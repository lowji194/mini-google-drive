import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// ==== Google Drive API config ====
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'YOUR_REDIRECT_URI';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });
const upload = multer({ dest: 'temp/' });
app.use(express.json());

// ==== Helper: Tạo thư mục temp nếu chưa có ====
if (!fs.existsSync('temp')) fs.mkdirSync('temp');

// ==== Đảm bảo luôn có thư mục gốc "UploadServer" ====
let uploadRootFolderId = null;
async function ensureUploadRoot() {
  if (uploadRootFolderId) return uploadRootFolderId;
  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and name='UploadServer' and trashed=false",
    fields: 'files(id, name)',
    spaces: 'drive'
  });
  if (res.data.files.length > 0) {
    uploadRootFolderId = res.data.files[0].id;
    return uploadRootFolderId;
  } else {
    const folderMeta = {
      name: 'UploadServer',
      mimeType: 'application/vnd.google-apps.folder'
    };
    const folder = await drive.files.create({
      resource: folderMeta,
      fields: 'id'
    });
    uploadRootFolderId = folder.data.id;
    return uploadRootFolderId;
  }
}

// ==== Helper: Lấy/tạo folder theo đường dẫn ====
async function getOrCreateFolderByPath(folderPath, parentId) {
  let currentParent = parentId;
  if (!folderPath) return currentParent;
  const parts = folderPath.split('/').filter(Boolean);
  for (const part of parts) {
    // Kiểm tra folder này đã tồn tại trong parent chưa
    const res = await drive.files.list({
      q: `'${currentParent}' in parents and mimeType='application/vnd.google-apps.folder' and name='${part.replace(/'/g, "\\'")}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    if (res.data.files.length > 0) {
      currentParent = res.data.files[0].id;
    } else {
      // Tạo mới folder
      const folderMeta = {
        name: part,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [currentParent]
      };
      const folder = await drive.files.create({
        resource: folderMeta,
        fields: 'id'
      });
      currentParent = folder.data.id;
    }
  }
  return currentParent;
}

// ==== Helper: Lấy hoặc tạo quyền share cho file và lấy webViewLink ====
async function getOrCreateShareLink(fileId) {
  // B1: Kiểm tra quyền hiện tại
  const perms = await drive.permissions.list({ fileId });
  let hasAnyone = perms.data.permissions &&
                  perms.data.permissions.some(p =>
                    p.type === 'anyone' && (p.role === 'reader' || p.role === 'writer')
                  );
  if (!hasAnyone) {
    // Tạo quyền share anyone-reader
    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
        fields: 'id'
      });
      await new Promise(r => setTimeout(r, 1000)); // đợi Google sync quyền (quan trọng!)
    } catch (err) {
      // Nếu quyền đã có, lỗi vẫn tiếp tục
      if (!String(err).includes('alreadyExists')) {
        console.error('Cấp quyền chia sẻ lỗi:', err?.errors || err?.message);
      }
    }
  }
  // B2: Lấy webViewLink và kiểm tra is anyone allowed
  for (let i = 0; i < 3; ++i) {
    const meta = await drive.files.get({
      fileId,
      fields: 'webViewLink, permissions'
    });
    // Google có thể mất vài trăm ms mới cập nhật permissions!
    const anyonePerm = (meta.data.permissions||[]).some(p =>
      p.type === 'anyone' && (p.role === 'reader' || p.role === 'writer')
    );
    if (anyonePerm) return meta.data.webViewLink;
    await new Promise(r => setTimeout(r, 600)); // thử lại lần nữa
  }
  // Dù vậy vẫn trả về link (có thể vẫn chưa public, nhưng thường đủ dùng)
  const meta = await drive.files.get({
    fileId,
    fields: 'webViewLink'
  });
  return meta.data.webViewLink;
}

// ==== API: Lấy quota dung lượng Drive ====
app.get('/storage', async (req, res) => {
  try {
    const about = await drive.about.get({ fields: 'storageQuota' });
    res.json(about.data.storageQuota);
  } catch (err) {
    res.status(500).json({ error: 'Không lấy được thông tin dung lượng', detail: err.message });
  }
});

// ==== API: List file/folder theo parentId, trả cả link share ====
app.get('/files', async (req, res) => {
  try {
    const rootId = await ensureUploadRoot();
    const parentId = req.query.parentId || rootId;
    const result = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime, size, mimeType, webViewLink)',
      spaces: 'drive'
    });
    const files = await Promise.all((result.data.files || []).map(async f => {
      const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
      let shareLink = f.webViewLink;
      if (!isFolder && !shareLink) {
        shareLink = await getOrCreateShareLink(f.id);
      }
      return {
        ...f,
        isFolder,
        shareLink
      }
    }));
    res.json(files);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ==== API: Lấy thông tin folder ====
app.get('/folderinfo/:id', async (req, res) => {
  try {
    const result = await drive.files.get({
      fileId: req.params.id,
      fields: 'id, name'
    });
    res.json({ id: result.data.id, name: result.data.name });
  } catch (err) {
    res.status(404).json({});
  }
});

// ==== API: Tạo thư mục, nếu đã tồn tại thì trả về ====
app.post('/create-folder', async (req, res) => {
  try {
    const rootId = await ensureUploadRoot();
    const parentId = req.body.parentId || rootId;
    const name = req.body.name;
    if (!name) return res.status(400).json({ error: 'Thiếu tên thư mục' });
    if (name.length > 255) return res.status(400).json({ error: 'Tên thư mục quá dài' });
    if (/[<>:"/\\|?*]/.test(name)) return res.status(400).json({ error: 'Tên thư mục chứa ký tự không hợp lệ' });
    // Nếu đã có folder cùng tên trong parent -> trả về luôn
    const existed = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    if (existed.data.files.length > 0) {
      return res.json({ id: existed.data.files[0].id, name: existed.data.files[0].name });
    }
    // Tạo mới
    const folderMeta = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };
    const folder = await drive.files.create({
      resource: folderMeta,
      fields: 'id, name'
    });
    res.json({ id: folder.data.id, name: folder.data.name });
  } catch (err) {
    res.status(500).json({ error: 'Tạo thư mục lỗi' });
  }
});

// ==== API: Upload file, nếu đã có thì cập nhật (ghi đè) ====
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const rootId = await ensureUploadRoot();
    let parentId = req.body.parentId || rootId;
    let relativePath = req.body.relativePath || '';
    let folderPath = '';
    if (relativePath) {
      const parts = relativePath.split('/');
      if (parts.length > 1) {
        folderPath = parts.slice(0, -1).join('/');
      }
    }
    if (folderPath) {
      parentId = await getOrCreateFolderByPath(folderPath, parentId);
    }

    // Kiểm tra file cùng tên trong parent (ghi đè)
    // const fileName = req.file.originalname;
    const fileName = req.body.encodedName ? decodeURIComponent(req.body.encodedName) : req.file.originalname;
    const existed = await drive.files.list({
      q: `'${parentId}' in parents and name='${fileName.replace(/'/g, "\\'")}' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive'
    });
    let fileId = null;
    if (existed.data.files.length > 0) {
      fileId = existed.data.files[0].id;
      // Cập nhật file
      await drive.files.update({
        fileId,
        media: {
          mimeType: req.file.mimetype,
          body: fs.createReadStream(req.file.path)
        }
      });
    } else {
      // Upload mới
      const fileMeta = {
        name: fileName,
        parents: [parentId]
      };
      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path)
      };
      const driveRes = await drive.files.create({
        resource: fileMeta,
        media,
        fields: 'id'
      });
      fileId = driveRes.data.id;
    }
    fs.unlink(req.file.path, () => {});
    // Lấy link share
    const shareLink = await getOrCreateShareLink(fileId);
    res.json({ id: fileId, name: fileName, shareLink });
  } catch (err) {
    res.status(500).json({ error: 'Upload lỗi', detail: err.message });
  }
});

// ==== API: Download file ====
app.get('/download/:id', async (req, res) => {
  try {
    const meta = await drive.files.get({
      fileId: req.params.id,
      fields: 'name'
    });
    const driveRes = await drive.files.get(
      { fileId: req.params.id, alt: 'media' },
      { responseType: 'stream' }
    );
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(meta.data.name)}"`);
    driveRes.data.pipe(res);
  } catch (err) {
    res.status(404).send('Không tìm thấy file');
  }
});

// ==== API: Xóa file hoặc thư mục ====
app.delete('/delete/:id', async (req, res) => {
  try {
    await drive.files.delete({ fileId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'Xóa lỗi' });
  }
});

// ==== Middleware xử lý lỗi tổng quát ====
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Lỗi server', detail: err.message });
});

// ==== Server static ====
app.use(express.static(__dirname));

// ==== Listen all IP ====
app.listen(PORT, '0.0.0.0', () => console.log(`Server running at http://0.0.0.0:${PORT}`));

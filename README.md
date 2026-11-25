[![🇺🇸 English](https://img.shields.io/badge/Language-English-1e293b?style=flat-square)](README-EN.md)

# Mini Google Drive

**Mini Google Drive** là một dự án giúp bạn upload, quản lý và chia sẻ file qua Google Drive với giao diện web thân thiện.

---

## 💾 Yêu cầu hệ thống

- Node.js >= 16.x
- npm hoặc yarn
- Tài khoản Google (để tạo OAuth2 Client)
- Đã bật Google Drive API (xem hướng dẫn bên dưới)

---
![Ảnh minh họa](Screenshot.png)
---

## 🚀 Hướng dẫn cài đặt

### 1. Clone dự án về máy

```bash
git clone https://github.com/lowji194/mini-google-drive.git
cd mini-google-drive
```

### 2. Cài đặt thư viện phụ thuộc

```bash
npm install
```

*(Hoặc cài trực tiếp: `npm install express multer googleapis`)*

---

### 3. Cấu hình `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`

Bạn có thể truyền qua biến môi trường theo mẫu `.env.example` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`) hoặc điền trực tiếp vào đầu file `server.js`:

```js
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'xxx.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'xxx';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || 'xxx';
```

#### Cách lấy thông tin này:

**Bước 1: Tạo OAuth Client ID trên Google Cloud**  
- Truy cập [Google Cloud Console](https://console.cloud.google.com/)
- Tạo project mới (hoặc chọn project bạn muốn dùng)
- Vào **APIs & Services > Credentials**
- Nhấn **Create Credentials > OAuth client ID**
- Application type: chọn **Web application**
- Authorized redirect URIs: thêm dòng:
  ```
  https://developers.google.com/oauthplayground
  ```
- Nhấn **Create** và copy **Client ID** và **Client Secret**

**Bước 2: Bật Google Drive API**  
- Vào **APIs & Services > Library**
- Tìm **Google Drive API** > **Enable**

**Bước 3: Lấy Refresh Token**  
- Vào [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- Nhấn biểu tượng bánh răng (cài đặt) → chọn **Use your own OAuth credentials**
- Nhập **Client ID** và **Client Secret**
- Ở Step 1, tìm **Drive API v3** > tick:
  ```
  https://www.googleapis.com/auth/drive
  ```
- Nhấn **Authorize APIs**, đăng nhập Google, cấp quyền, quay lại playground
- Nhấn **Exchange authorization code for tokens**
- Copy **Refresh token** và cấu hình vào biến môi trường hoặc `server.js`

---

### 4. Chạy dự án

```bash
npm start
```
Truy cập vào: [http://localhost:3001](http://localhost:3001)

---

## 📁 Cấu trúc thư mục

```
mini-google-drive/
│
├── server.js         # Backend Node.js / Express làm việc với Google Drive API v3
├── index.html        # Giao diện web
├── styles.css        # CSS giao diện
├── package.json      # Khai báo dependencies và script khởi chạy
├── .env.example      # Mẫu biến môi trường OAuth2
├── LICENSE           # Giấy phép MIT
└── README.md         # Tài liệu hướng dẫn
```

---

## 📢 Lưu ý bảo mật

- **Không chia sẻ hoặc commit mã nguồn chứa `CLIENT_SECRET`, `REFRESH_TOKEN` lên repository công khai.**
- Nếu bị lộ, hãy thu hồi và tạo lại credential trên Google Cloud Console.

---

## ❤️ Đóng góp

- Pull request và các ý tưởng cải tiến luôn được chào đón!

---

## 📫 Liên hệ

- 🌐 **Website:** [theloi.io.vn](https://theloi.io.vn)
- 💬 **Telegram:** [@theloi194](https://t.me/theloi194)
- 📌 **Facebook:** [Lowji194](https://facebook.com/Lowji194)

---

## ☕ Nếu bạn thấy dự án này hữu ích, một ly cà phê từ bạn sẽ là động lực tuyệt vời để mình tiếp tục phát triển thêm!

<p align="center">
  <img src="https://raw.githubusercontent.com/lowji194/lowji194/main/assets/donate-qr.svg" alt="Mời cà phê" width="240" />
</p>

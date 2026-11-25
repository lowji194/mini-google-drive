[![🇻🇳 Tiếng Việt](https://img.shields.io/badge/Language-Ti%E1%BA%BFng%20Vi%E1%BB%87t-1e293b?style=flat-square)](README.md)

# Mini Google Drive

**Mini Google Drive** is a lightweight Node.js and Express web portal for uploading, organizing, and sharing files via Google Drive API v3 with a clean browser interface.

![Screenshot](Screenshot.png)

## Features

- Upload single files or folders while preserving nested folder paths inside `UploadServer`
- Create nested folders and automatically overwrite files with matching names
- Generate shareable Google Drive links (`webViewLink`) upon upload
- Download and delete files or folders directly from the web UI

## Requirements

- Node.js `>= 16.x`
- Google account with Google Drive API enabled and OAuth2 credentials

## Setup & Usage

1. **Clone the repository and install dependencies**
   ```bash
   git clone https://github.com/lowji194/mini-google-drive.git
   cd mini-google-drive
   npm install
   ```

2. **Configure Google Drive OAuth2 credentials**
   - Create a **Web application** OAuth Client ID in [Google Cloud Console](https://console.cloud.google.com/) with redirect URI `https://developers.google.com/oauthplayground`
   - Enable **Google Drive API** under **APIs & Services > Library**
   - Authorize `https://www.googleapis.com/auth/drive` in [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) using your own credentials to get a refresh token
   - Set environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`) based on `.env.example`, or fill them in `server.js`

3. **Start the server**
   ```bash
   npm start
   ```
   Open [http://localhost:3001](http://localhost:3001).

## Security Note

Never commit `CLIENT_SECRET` or `REFRESH_TOKEN` to a public repository. Rotate credentials immediately in Google Cloud Console if exposed.

## License

Released under the [MIT License](LICENSE).

## Contact

- **Website:** [theloi.io.vn](https://theloi.io.vn)
- **Telegram:** [@theloi194](https://t.me/theloi194)
- **Facebook:** [Lowji194](https://facebook.com/Lowji194)

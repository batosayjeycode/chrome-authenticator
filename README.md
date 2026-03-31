# Chrome Authenticator Extension — VPN 2FA Integration

## Overview

Membangun Chrome Extension Manifest v3 menggunakan Vue 3 + JavaScript (tanpa TypeScript) + Webpack 5 + SCSS. Extension akan generate TOTP codes, scan QR codes, dan menggabungkan TOTP dengan VPN password untuk kemudahan login VPN internal.

**Tech Stack Final:**
- Language: JavaScript ES2020+ (tanpa TypeScript)
- UI: Vue 3 (Composition API) + Single File Components (.vue)
- Bundler: Webpack 5
- CSS: SCSS
- TOTP: implementasi manual via Web Crypto API (tidak bergantung library eksternal besar)
- QR Decode: `jsqr` library
- Node v22.15.1

---

## Verification Plan

### Automated / Manual Tests

1. **TOTP Accuracy Test**
   - Generate TOTP dengan known secret key
   - Bandingkan hasilnya dengan Google Authenticator di HP menggunakan QR Code yang sama
   - Verifikasi code berubah tepat saat detik ke-30/60

2. **QR Code Scan Test**
   - Upload QR Code image yang valid → verifikasi akun ter-parse benar
   - Context menu klik kanan pada QR image di halaman web → verifikasi flow berjalan

3. **VPN Combined Password Test**
   - Tambah akun dengan VPN password
   - Klik "Copy Combined" → paste di text editor, verifikasi format `VPNPass123044042`

4. **Storage Encryption Test**
   - Buka `chrome://extensions/ → Storage` (DevTools)
   - Verifikasi data tersimpan dalam format terenkripsi (bukan plain text)

5. **UI/UX Test**
   - Buka popup, verifikasi countdown timer berjalan smooth
   - Test tambah, edit, hapus akun
   - Test copy feedback ("Copied!" toast muncul)

### Load Extension di Chrome
```bash
1. npm install
2. npm run build
3. Buka chrome://extensions/
4. Enable "Developer Mode"
5. Klik "Load unpacked" → pilih folder dist/ (atau root jika manifest di root)
6. Test semua fitur
```

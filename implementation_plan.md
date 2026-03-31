# Implementation Plan
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

---

## Confirmed Decisions

> [!IMPORTANT]
> - ✅ Combined password format: `[VPN_PASSWORD][TOTP_CODE]` (VPN dahulu)
> - ✅ Internal use only — tidak publish ke Chrome Web Store publik
> - ✅ Tidak ada lock screen / PIN protection

---

## Proposed Changes

### Component 1 — Project Scaffolding & Build System

#### [NEW] `package.json`
Setup dependencies, scripts: `dev`, `build`, `watch`

#### [NEW] `webpack.config.js`
Entry points: popup, background, content script. Output ke `dist/`.

#### [NEW] `.eslintrc.js`  
ESLint config untuk JavaScript + Vue 3 (tanpa TypeScript rules)

#### [NEW] `manifest.json`
Chrome Extension Manifest v3 dengan permissions: `storage`, `contextMenus`, `activeTab`, `clipboardWrite`

#### [NEW] `view/popup.html`
HTML shell untuk popup extension.

---

### Component 2 — Core TOTP Library

#### [NEW] `src/lib/totp.js`
Implementasi murni TOTP (RFC 6238) menggunakan Web Crypto API `SubtleCrypto.sign()` (HMAC).

```
generateTOTP(base32Secret, { digits, period, algorithm })
  → decode base32 secret
  → compute time step = floor(Date.now()/1000 / period)
  → HMAC-SHA1(secret, timeStep as 8-byte big-endian)
  → dynamic truncation → 6-digit OTP
  → return { code, remainingSeconds, progress }
```

#### [NEW] `src/lib/base32.js`
Base32 decode untuk parsing secret key dari QR Code / manual input.

---

### Component 3 — Encryption Layer

#### [NEW] `src/lib/crypto.js`
AES-256-GCM encryption/decryption menggunakan `window.crypto.subtle`:
- `encrypt(plaintext)` → `{ iv, ciphertext }` (base64-encoded)
- `decrypt(iv, ciphertext)` → `plaintext`
- Key derivation dari random key yang disimpan di `chrome.storage.local`

---

### Component 4 — Storage Layer

#### [NEW] `src/lib/storage.js`
Wrapper untuk `chrome.storage.local`:
- `getAccounts()` → decrypt dan return list of accounts
- `saveAccount(account)` → encrypt secret + VPN password, lalu save
- `deleteAccount(id)` → hapus dari storage
- `updateAccount(id, data)` → update partial data

**Data schema per account:**
```json
{
  "id": "uuid-v4",
  "issuer": "YourCompany",
  "label": "andy.juliadi",
  "encryptedSecret": "base64...",
  "encryptedVpnPassword": "base64...",
  "algorithm": "SHA-1",
  "digits": 6,
  "period": 30,
  "createdAt": 1700000000
}
```

---

### Component 5 — Vue 3 UI Components

#### [NEW] `src/popup/main.js`
Vue 3 app entry point, mount `App.vue`

#### [NEW] `src/popup/App.vue`
Root component. Manages view routing (list ↔ add-account ↔ qr-scanner ↔ settings) menggunakan reactive state (bukan vue-router, cukup `ref` karena popup simple).

#### [NEW] `src/popup/components/AccountList.vue`
- Ambil accounts dari storage saat mounted
- Setup interval 1 detik untuk refresh TOTP codes
- Render list of `AccountCard`
- Tombol "+ Add Account"

#### [NEW] `src/popup/components/AccountCard.vue`
Props: `account` object
- Display: issuer name, account label
- TOTP code (format `XXX XXX` dengan spasi tengah)
- Progress bar menunjukkan sisa waktu (30s → 0s)
- Color coding: hijau (>10s), kuning (5-10s), merah (<5s)
- Tombol "Copy" → copy TOTP ke clipboard
- Row VPN: masked VPN password + tombol "Copy Combined"
- Copy Combined → copy `[vpnPassword][totpCode]` ke clipboard
- Feedback "Copied!" saat berhasil copy
- Tombol hapus (muncul saat edit mode aktif)

#### [NEW] `src/popup/components/AddAccount.vue`
Form tambah/edit akun:
- Form fields: Issuer, Label/Account, Secret Key (with toggle show/hide)
- Advanced section (collapsible): Algorithm, Digits, Period
- VPN Integration section: VPN Password field (with toggle show/hide)
- Validasi: secret key required, format base32
- Tombol: Cancel, Save Account
- Mode: Add baru atau Edit existing (berdasarkan prop `editAccount`)

#### [NEW] `src/popup/components/QrScanner.vue`
- Area upload drag-and-drop atau klik untuk pilih file
- Tombol "Scan QR on Current Page" → kirim message ke content script
- Proses image dengan jsQR
- Parsing `otpauth://totp/...` URI
- Auto-populate form AddAccount setelah berhasil scan

#### [NEW] `src/popup/components/ProgressBar.vue`
Reusable progress bar / countdown indicator:
- Props: `remaining`, `total` (seconds)
- Animated, smooth transition per second
- Auto color change berdasarkan remaining time percentage

#### [NEW] `src/popup/components/Toast.vue`
Reusable toast notification untuk feedback "Copied!", "Saved!", Error messages.

---

### Component 6 — Background Service Worker

#### [NEW] `src/background/index.js`
Chrome MV3 Service Worker:
```javascript
// Register context menu saat install & startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scanQrCode',
    title: 'Scan QR Code (Authenticator)',
    contexts: ['image']
  });
});

// Handle context menu click → kirim image URL ke popup/content script
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scanQrCode') {
    // Store image URL, popup akan mengambilnya
    chrome.storage.session.set({ pendingQrImageUrl: info.srcUrl });
  }
});
```

---

### Component 7 — Content Script

#### [NEW] `src/content/index.js`
- Listen untuk message dari popup/background
- Jika diminta scan QR dari halaman: ambil semua `<img>` di halaman, decode dengan jsQR
- Return result ke popup via `chrome.runtime.sendMessage`

---

### Component 8 — SCSS Styles

#### [NEW] `sass/_variables.scss`
Design tokens: colors, fonts, spacing, border-radius

#### [NEW] `sass/_card.scss`
Account card styles dengan hover effects, transitions

#### [NEW] `sass/_form.scss`
Form input styles, button styles

#### [NEW] `sass/_progress.scss`
Progress bar animation styles

#### [NEW] `sass/main.scss`
Import semua partials, global reset, typography (Inter font dari Google Fonts)

---

### Component 9 — Icon Assets

#### [NEW] `images/icon-16.png`, `icon-48.png`, `icon-128.png`
Icon extension (generate dari SVG)

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
1. npm run build
2. Buka chrome://extensions/
3. Enable "Developer Mode"
4. Klik "Load unpacked" → pilih folder dist/ (atau root jika manifest di root)
5. Test semua fitur
```

---

## Build Timeline

| Milestone | Tasks | Estimasi |
|---|---|---|
| M1 | Scaffolding, webpack, manifest | 1-2 hari |
| M2 | TOTP lib, Base32, Crypto, Storage | 2-3 hari |
| M3 | Vue components: List, Card, AddAccount | 2-3 hari |
| M4 | QR Scanner, Context Menu, Content Script | 2 hari |
| M5 | VPN Integration UI, Combined Copy | 1 hari |
| M6 | SCSS styling, polish, toast notifications | 2 hari |
| M7 | Testing, bug fix, package | 1-2 hari |

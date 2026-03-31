# Product Requirement Document (PRD)
# Chrome Authenticator Extension — VPN 2FA Integration

**Versi:** 1.1 *(Updated April 2026)*  
**Tanggal:** April 2026  
**Status:** ✅ Approved — Internal Use Only  

---

## 1. Executive Summary

Chrome Authenticator Extension adalah browser extension berbasis Chrome yang menghasilkan **Time-based One-Time Password (TOTP)** sesuai standar RFC 6238. Extension ini dirancang khusus untuk kebutuhan internal perusahaan, dengan fitur unggulan berupa **integrasi VPN Password** — yaitu kemampuan untuk menggabungkan kode TOTP dengan VPN password yang sudah dimiliki pengguna, sehingga proses autentikasi VPN menjadi lebih cepat dan efisien.

Extension ini terinspirasi dari [Authenticator Extension](https://github.com/Authenticator-Extension/Authenticator) (open source, MIT License) dan mengadaptasi fitur utamanya tanpa menggunakan TypeScript.

---

## 2. Latar Belakang & Permasalahan

### 2.1 Masalah yang Diselesaikan

| Permasalahan | Dampak |
|---|---|
| Pengguna harus membuka aplikasi authenticator terpisah (HP) setiap login VPN | Proses lambat, mengganggu workflow |
| Pengguna harus secara manual menggabungkan TOTP code + VPN password | Rentan kesalahan, frustrasi |
| Tidak ada cara cepat untuk scan QR Code dari browser | Onboarding 2FA baru membutuhkan HP |

### 2.2 Solusi yang Ditawarkan

Chrome Extension yang:
1. Menghasilkan TOTP code langsung di browser
2. Menggabungkan TOTP code dengan VPN password secara otomatis (format: `[VPN_PASSWORD][TOTP_CODE]`)
3. Mendukung scan QR Code langsung dari image/screenshot yang ada di browser
4. Menyediakan akses 1-klik untuk menyalin kode gabungan

---

## 3. Target Pengguna (User Persona)

### Persona Utama: Karyawan Internal

- **Nama:** Andy / Tim IT & Non-IT
- **Kebutuhan:** Login VPN perusahaan dengan 2FA
- **Pain Point:** Proses 2FA yang lambat dan manual
- **Technical Level:** Low to Medium

### Persona Sekunder: IT Administrator

- **Nama:** Admin IT
- **Kebutuhan:** Setup TOTP baru untuk karyawan, distribusi QR Code
- **Pain Point:** Onboarding yang membutuhkan langkah banyak

---

## 4. Fitur & Scope

### 4.1 MVP (Minimum Viable Product) — v1.0

#### F01 — TOTP Code Generator
- Menghasilkan 6-digit TOTP code berdasarkan standar RFC 6238 / RFC 4226 (HOTP)
- Update otomatis setiap 30 detik (configurable: 30s / 60s)
- Progress bar / countdown timer sebelum code expired
- Support algoritma: **SHA-1** (default), SHA-256, SHA-512

#### F02 — QR Code Scanner
- **Scan dari gambar di halaman web:** Klik kanan pada QR Code image → "Scan QR Code" (via Context Menu)
- **Upload file QR Code:** Pengguna dapat mengupload image file QR Code langsung dari popup
- QR Code harus mengikuti format standar `otpauth://totp/...`
- Parsing otomatis: issuer, account name, secret key, algorithm, digits, period

#### F03 — Account Management (Multi-Account)
- Tampilan daftar akun dengan issuer name, account label, dan TOTP code
- Tambah akun manual (masukkan secret key, issuer, label)
- Hapus akun
- Edit akun (label, issuer)
- Mendukung multiple akun sekaligus

#### F04 — VPN Password Integration ⭐ *Fitur Utama*
- Setiap akun dapat disimpan dengan **VPN Password** terkait
- Toggle "Show Combined Password" untuk melihat gabungan: `[VPN_PASSWORD][TOTP_CODE]`
  - Contoh: VPN password `MyVPN123` + TOTP `044042` → Combined: `MyVPN123044042`
- Tombol **"Copy VPN"** → salin VPN password saja ke clipboard
- Tombol **"Copy Combined"** → salin `[VPN_PASSWORD][TOTP_CODE]` ke clipboard
- VPN Password disimpan di `chrome.storage.local` (sandboxed per-extension oleh Chrome)
- Opsi untuk show/hide VPN password (default: tersembunyi)
- ✅ Format: `[VPN_PASSWORD][TOTP_CODE]` — VPN password dahulu, lalu TOTP (dikonfirmasi)

#### F05 — Clipboard & UX
- Klik pada TOTP code → salin ke clipboard (feedback visual "Copied!")
- Tombol **"Copy VPN"** → salin hanya VPN password ke clipboard
- Tombol **"Copy Combined"** → salin gabungan VPN+TOTP ke clipboard
- Semua tombol copy menampilkan feedback "Copied!" + toast notification selama 2 detik
- Auto-hide popup tidak menginterupsi alur kerja

#### F06 — Data Persistence & Security
- Semua secret key dan VPN password disimpan di `chrome.storage.local` (tidak keluar dari browser)
- `chrome.storage.local` sudah **sandboxed per-extension** oleh Chrome — tidak bisa diakses extension lain
- **Tidak ada komunikasi ke server eksternal** — semua kalkulasi dilakukan lokal
- ✅ Lock screen / PIN: **Tidak diperlukan** (dikonfirmasi)
- ✅ Deployment: **Internal only**, tidak dipublish ke Chrome Web Store publik (dikonfirmasi)

> [!NOTE]
> **Storage Approach (v1.1):** Custom AES-GCM encryption layer dihapus karena menyebabkan bug data hilang
> saat popup diclose & dibuka ulang (DOMException pada decryption). Data disimpan langsung di
> `chrome.storage.local` yang sudah terisolasi per-extension oleh Chrome secara native.

### 4.2 Fitur Masa Depan (v2.0+)

| Fitur | Prioritas |
|---|---|
| Export / Import akun (format JSON terenkripsi) | High |
| Backup ke Google Drive (terenkripsi) | Medium |
| Dark mode / Light mode toggle | Medium |
| Drag & drop untuk reorder akun | Low |
| Firefox & Edge support | Low |
| Notifikasi sebelum code expired | Low |

---

## 5. User Flow

### 5.1 Onboarding — Tambah Akun via QR Code

```
[Buka Extension Popup]
        ↓
[Klik tombol "+ Add Account"]
        ↓
[Pilih: "Scan QR Code" / "Enter Manually"]
        ↓ (Scan QR Code)
[Klik "Upload QR Code Image"] atau [Kanan click gambar di halaman → "Scan QR Code"]
        ↓
[Extension parse QR Code otomatis]
        ↓
[Form terisi otomatis: Issuer, Account, Secret]
[User mengisi VPN Password (opsional)]
        ↓
[Simpan → Akun muncul di daftar]
```

### 5.2 Daily Usage — Login VPN

```
[Klik icon Extension di toolbar]
        ↓
[Popup muncul dengan daftar akun]
        ↓
[Lihat TOTP code + countdown timer]
        ↓
[Opsi A] Klik "Copy VPN"      → salin VPN password saja
[Opsi B] Klik "Copy Combined" → salin VPN password + TOTP
[Opsi C] Klik TOTP code       → salin hanya TOTP code
        ↓
[Paste di field password VPN]
```

### 5.3 Flow Tambah Akun Manual

```
[Klik "+ Add Account"] → [Pilih "Enter Manually"]
        ↓
[Isi form: Issuer Name, Account Name, Secret Key]
[Isi VPN Password (opsional)]
[Pilih Algorithm, Digits, Period]
        ↓
[Klik "Save"]
        ↓
[Akun masuk daftar, TOTP langsung ditampilkan]
```

---

## 6. UI/UX Specification

### 6.1 Layout — Main Popup

```
┌─────────────────────────────────────┐
│  🔐  Authenticator              ✎  │  ← Header (edit mode toggle)
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ YourCompany               [●] │  │  ← Issuer Name + SVG timer ring
│  │ 044 042              [⎘ Copy] │  │  ← TOTP Code + copy button
│  │ andy.juliadi                  │  │  ← Account label
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │  ← Progress bar (countdown)
│  │ VPN ••••••• 👁  [🔒 Copy VPN] [⎘ Copy Combined] │
│  └───────────────────────────────┘  │  ← VPN row: 2 copy buttons
├─────────────────────────────────────┤
│  [📷 Scan QR]        [+ Add Manual] │  ← Add account bar
└─────────────────────────────────────┘
```

### 6.2 Layout — Add/Edit Account Form

```
┌─────────────────────────────────────┐
│  ←  Add Account                     │
├─────────────────────────────────────┤
│  Issuer / Company Name              │
│  [________________________]         │
│                                     │
│  Account Name / Email               │
│  [________________________]         │
│                                     │
│  Secret Key *                       │
│  [________________________] [👁]    │
│                                     │
│  ─── Advanced ───                   │
│  Algorithm: [SHA-1 ▼]               │
│  Digits:    [6 ▼]                   │
│  Period:    [30s ▼]                 │
│                                     │
│  ─── VPN Integration ───            │
│  VPN Password (optional)            │
│  [________________________] [👁]    │
│                                     │
│          [Cancel]  [Save Account]   │
└─────────────────────────────────────┘
```

### 6.3 Layout — QR Code Scanner

```
┌─────────────────────────────────────┐
│  ←  Scan QR Code                    │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │      Drop image here or     │   │
│   │      click to upload        │   │
│   │                             │   │
│   │         [📷 Upload]         │   │
│   └─────────────────────────────┘   │
│                                     │
│   ── or scan from current tab ──    │
│   [Scan QR on Current Page]         │
│                                     │
└─────────────────────────────────────┘
```

### 6.4 Design System

| Komponen | Nilai |
|---|---|
| Primary Color | `#1976D2` (Deep Blue) |
| Success Color | `#2E7D32` (Green) |
| Warning Color | `#F57C00` (Amber) — code akan expired |
| Danger Color | `#C62828` (Red) — code expired |
| Font | `Inter` (Google Fonts) |
| TOTP Font | `JetBrains Mono` (monospace, angka lebih jelas) |
| Border Radius | `12px` (card), `8px` (button) |
| Popup Width | `380px` |
| Popup Max Height | `600px` |

---

## 7. Tech Stack

> Reference: [Authenticator-Extension/Authenticator](https://github.com/Authenticator-Extension/Authenticator) — diadaptasi tanpa TypeScript

### 7.1 Core Technologies

| Layer | Teknologi | Alasan |
|---|---|---|
| **Language** | **JavaScript (ES2020+)** | Sesuai permintaan, tanpa TypeScript |
| **UI Framework** | **Vue 3** (Composition API) | Digunakan di referensi, reaktif & ringan |
| **Bundler** | **Webpack 5** | Sama seperti referensi, mature & stabil |
| **CSS Preprocessor** | **SCSS** | Sama seperti referensi, modular & maintainable |
| **Linting** | **ESLint** | Code quality (tanpa TypeScript rules) |

### 7.2 Libraries & Dependencies

| Library | Versi | Fungsi |
|---|---|---|
| `otpauth` | ^9.x | TOTP/HOTP generation (RFC 6238/4226) |
| `jsqr` | ^1.x | Decode QR Code dari image data |
| `@zxing/library` | ^0.20.x | Alternatif QR Code decoder (lebih akurat) |
| `vue` | ^3.x | UI Framework |
| `webpack` | ^5.x | Module bundler |
| `webpack-cli` | ^5.x | CLI untuk webpack |
| `vue-loader` | ^17.x | Webpack loader untuk .vue files |
| `sass` | ^1.x | SCSS compiler |
| `sass-loader` | ^13.x | Webpack loader untuk SCSS |
| `css-loader` | ^6.x | CSS processing |
| `copy-webpack-plugin` | ^11.x | Copy static assets |
| `eslint` | ^8.x | Linting |
| `eslint-plugin-vue` | ^9.x | Vue-specific linting rules |

### 7.3 Browser APIs yang Digunakan

| API | Kegunaan |
|---|---|
| `chrome.storage.local` | Menyimpan account data & VPN password (sandboxed by Chrome) |
| `chrome.storage.session` | Temporary data untuk pending QR scan dari context menu |
| `chrome.runtime` | Background script communication |
| `chrome.contextMenus` | Context menu "Scan QR Code" saat klik kanan |
| `chrome.tabs` | Query active tab untuk messaging ke content script |
| `Web Crypto API (SubtleCrypto)` | HMAC-SHA1/256/512 untuk TOTP generation |
| `Clipboard API` | Copy TOTP / VPN password / Combined ke clipboard |

### 7.4 Extension Manifest

**Manifest Version: 3** (MV3) — Standar terbaru Chrome Extension

```json
{
  "manifest_version": 3,
  "name": "Authenticator",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "contextMenus",
    "activeTab",
    "clipboardWrite"
  ],
  "action": {
    "default_popup": "view/popup.html",
    "default_icon": "images/icon-48.png"
  },
  "background": {
    "service_worker": "dist/background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["dist/content.js"]
    }
  ]
}
```

---

## 8. Arsitektur Sistem

### 8.1 Struktur Direktori

```
chrome-authenticator/
├── manifest.json                  # Chrome Extension manifest v3
├── package.json
├── webpack.config.js              # Webpack build config
├── webpack.dev.js                 # Dev build (watch mode)
├── webpack.prod.js                # Production build
├── .eslintrc.js                   # ESLint config (no TypeScript)
│
├── src/                           # Source code utama
│   ├── background/
│   │   └── index.js               # Service worker (context menu, etc.)
│   ├── popup/
│   │   ├── App.vue                # Root popup component
│   │   ├── main.js                # Popup entry point
│   │   └── components/
│   │       ├── AccountList.vue    # Daftar akun TOTP
│   │       ├── AccountCard.vue    # Card per akun (TOTP + VPN)
│   │       ├── AddAccount.vue     # Form tambah/edit akun
│   │       ├── QrScanner.vue      # QR Code scanner UI
│   │       ├── ProgressRing.vue   # Timer ring/bar countdown
│   │       └── Settings.vue       # Halaman settings
│   ├── content/
│   │   └── index.js               # Content script (QR scan di halaman)
│   ├── lib/
│   │   ├── totp.js                # TOTP generation logic (RFC 6238)
│   │   ├── crypto.js              # AES-GCM encryption/decryption
│   │   ├── storage.js             # chrome.storage wrapper
│   │   ├── qr.js                  # QR Code parsing logic
│   │   └── utils.js               # Helper functions
│   └── store/
│       └── accounts.js            # Vue reactive store (accounts state)
│
├── view/
│   └── popup.html                 # HTML entry point popup
│
├── sass/
│   ├── main.scss                  # Global styles
│   ├── _variables.scss            # Design tokens
│   ├── _card.scss                 # Account card styles
│   └── _form.scss                 # Form styles
│
├── images/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
│
└── dist/                          # Build output (generated)
    ├── popup.js
    ├── background.js
    └── content.js
```

### 8.2 Data Flow Diagram

```
┌──────────────────────────────────────────────────────┐
│                   POPUP (Vue 3)                       │
│                                                        │
│  AccountList → AccountCard → [TOTP Display + Copy]    │
│                            → [VPN row]                │
│                              → [Copy VPN]  ← NEW      │
│                              → [Copy Combined]        │
│                                                        │
│  AddAccount ←→ QrScanner (jsQR)                       │
│                                                        │
└──────────────────────┬───────────────────────────────┘
                       │ chrome.storage.local
                       ↓
┌──────────────────────────────────────────────────────┐
│           LOCAL STORAGE (Chrome Sandboxed)            │
│                                                        │
│  accounts: [                                          │
│    {                                                  │
│      id, issuer, label, secret,                      │
│      vpnPassword, algorithm,                         │
│      digits, period, createdAt                       │
│    }                                                  │
│  ]                                                    │
└──────────────────────────────────────────────────────┘
                       
┌──────────────────────────────────────────────────────┐
│             BACKGROUND SERVICE WORKER                 │
│                                                        │
│  - Register context menu "Scan QR Code"               │
│  - Handle context menu click                          │
│  - Pass image URL to content script                   │
└──────────────────────────────────────────────────────┘
                       
┌──────────────────────────────────────────────────────┐
│                CONTENT SCRIPT                         │
│                                                        │
│  - Receive image URL from background                  │
│  - Fetch & decode QR Code                             │
│  - Return otpauth:// URI to popup                     │
└──────────────────────────────────────────────────────┘
```

### 8.3 TOTP Computation Logic

```javascript
// lib/totp.js — Simplified TOTP Flow
function generateTOTP(secret, { digits = 6, period = 30, algorithm = 'SHA-1' } = {}) {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / period);
  // HMAC(key=secret, message=timeStep) → truncate → 6/8 digit OTP
  return computeHMAC(secret, timeStep, algorithm, digits);
}

// VPN Combined Password
function getCombinedPassword(vpnPassword, totpCode) {
  return `${vpnPassword}${totpCode}`;
}
```

---

## 9. Security Requirements

| Requirement | Detail |
|---|---|
| **No Remote Transmission** | Secret key dan VPN password TIDAK pernah dikirim ke server manapun |
| **Chrome Sandbox** | `chrome.storage.local` terisolasi per-extension oleh Chrome secara native |
| **No Analytics** | Tidak ada tracking, telemetry, atau analytics script |
| **Content Security Policy** | CSP strict di manifest untuk mencegah XSS |
| **Permissions Minimal** | Hanya minta permission yang benar-benar dibutuhkan |
| **Open Source Audit** | Semua dependencies adalah library open source yang sudah teruji |

---

## 10. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Performance** | Popup load < 300ms; TOTP generate < 10ms |
| **Accuracy** | TOTP harus sesuai standar RFC 6238 (test vectors) |
| **Compatibility** | Chrome 100+; Manifest v3 compliant |
| **Reliability** | Timer sync dengan system clock; tidak drift |
| **Offline** | Berfungsi penuh tanpa koneksi internet |
| **Bundle Size** | Total extension size < 2MB |

---

## 11. Milestones & Timeline

| Milestone | Deliverable | Estimasi |
|---|---|---|
| **M1 — Setup** | Project scaffolding, webpack config, manifest MV3 | Week 1 |
| **M2 — Core TOTP** | TOTP generation, storage, encryption | Week 1-2 |
| **M3 — UI Popup** | Account list, card, add form (Vue 3) | Week 2-3 |
| **M4 — QR Scanner** | Upload image, context menu, QR decode | Week 3 |
| **M5 — VPN Integration** | VPN password input, combined copy | Week 3-4 |
| **M6 — Polish & Test** | UI polish, error handling, testing | Week 4 |
| **M7 — Release** | Pack `.crx`, submit Chrome Web Store (private) | Week 5 |

---

## 12. Acceptance Criteria

### AC01 — TOTP Generation
- [ ] Menghasilkan 6-digit code yang berubah setiap 30 detik
- [ ] Code valid dan bisa di-verify oleh Google Authenticator / sistem VPN
- [ ] Countdown timer akurat menunjukkan sisa waktu

### AC02 — QR Code Scan
- [ ] Berhasil scan QR Code yang di-upload sebagai image file
- [ ] Berhasil scan via context menu klik kanan pada gambar QR di halaman web
- [ ] Data akun (issuer, label, secret) ter-parse dengan benar dari `otpauth://` URI

### AC03 — VPN Integration
- [x] User bisa menyimpan VPN password per akun
- [x] "Copy VPN" menyalin hanya VPN password ke clipboard *(baru v1.1)*
- [x] "Copy Combined" menyalin `[VPN_PASSWORD][TOTP_CODE]` ke clipboard
- [x] VPN password tidak tampil by default (masked)
- [x] Toast notification muncul saat berhasil copy

### AC04 — Security & Persistence
- [x] Data tersimpan di `chrome.storage.local` (sandboxed Chrome native isolation)
- [x] Akun tetap ada saat popup ditutup dan dibuka kembali
- [x] Tidak ada network request yang keluar

### AC05 — Multi-Account
- [ ] Bisa menambah lebih dari satu akun
- [ ] Bisa menghapus dan mengedit akun

---

## 13. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Chrome MV3 Service Worker lifecycle tidak konsisten | Context menu mungkin tidak registered | Register ulang saat `onInstalled` dan `onStartup` |
| QR Code image resolution rendah, gagal di-decode | Fitur scan tidak berfungsi | Fallback ke manual input; tambah error message jelas |
| User lupa VPN password tersimpan, salah copy | Login VPN gagal | Tampilkan preview combined sebelum copy |
| Secret key atau VPN password hilang (data corrupt) | Tidak bisa generate TOTP | Sediakan fitur export/backup di v2.0 |

---

## 14. Referensi

- [RFC 6238 — TOTP: Time-Based One-Time Password Algorithm](https://datatracker.ietf.org/doc/html/rfc6238)
- [RFC 4226 — HOTP: An HMAC-Based One-Time Password Algorithm](https://datatracker.ietf.org/doc/html/rfc4226)
- [Google Key URI Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)
- [Authenticator Extension Reference](https://github.com/Authenticator-Extension/Authenticator)
- [Chrome Extension MV3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Web Crypto API — SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
- [jsQR — JavaScript QR Code Reader](https://github.com/cozmo/jsQR)

---

*Dokumen ini adalah living document dan akan diupdate seiring perkembangan project.*

# Dokumentasi Pengembangan & Maintenance — FansEdu LMS

Dokumen ini menjelaskan cara mengembangkan dan merawat project **FansEdu LMS** (frontend Next.js untuk platform Olimpiade Informatika). Untuk panduan deploy production, lihat [DEPLOY.md](../DEPLOY.md).

---

## Daftar isi

1. [Ringkasan project](#1-ringkasan-project)
2. [Prasyarat](#2-prasyarat)
3. [Setup development](#3-setup-development)
4. [Scripts & perintah](#4-scripts--perintah)
5. [Struktur project](#5-struktur-project)
6. [Arsitektur & konvensi](#6-arsitektur--konvensi)
7. [Fitur & routing](#7-fitur--routing)
8. [Backend API](#8-backend-api)
9. [Quality & lint](#9-quality--lint)
10. [Deploy & production](#10-deploy--production)
11. [Maintenance rutin](#11-maintenance-rutin)
12. [Troubleshooting](#12-troubleshooting)
13. [Dokumen terkait](#13-dokumen-terkait)

---

## 1. Ringkasan project

| Aspek | Keterangan |
|-------|------------|
| **Nama** | FansEdu LMS |
| **Tipe** | Frontend web (SPA-style) untuk LMS OSN Informatika |
| **Framework** | Next.js 16 (App Router), React 19 |
| **Styling** | Tailwind CSS v4 |
| **Bahasa** | TypeScript |
| **Backend** | API Go terpisah (`api.fansedu.web.id/api/v1`) |

**Fitur utama:**

- **Siswa:** Login, dashboard, daftar tryout, mengerjakan tryout, review jawaban, sertifikat.
- **Admin:** Dashboard, manajemen user, event/tryout, soal, master data (jenjang, bidang, sekolah, event, role), laporan, payment.
- **Auth:** Login/register, forgot password; token disimpan di cookie (`auth_token`, `auth_role`, `auth_user_name`).

---

## 2. Prasyarat

- **Node.js** 20.x (direkomendasikan LTS).
- **npm** (biasanya terpasang dengan Node) atau **pnpm** / **yarn**.
- **Git** untuk clone dan versi control.
- **Backend API** harus bisa diakses (local atau `https://api.fansedu.web.id`) untuk fitur penuh.

---

## 3. Setup development

### 3.1 Clone & install

```bash
git clone <repo-url> fansedu-lms
cd fansedu-lms
npm install
```

### 3.2 Environment variables

Project memakai dua file env yang **di-commit** agar local vs server otomatis beda:

| File | Dipakai saat | Isi default |
|------|--------------|-------------|
| **`.env.development`** | `npm run dev` (local) | `NEXT_PUBLIC_API_URL=http://localhost:8080` |
| **`.env.production`** | `npm run build` / `npm run start` (server) | `NEXT_PUBLIC_API_URL=https://api.fansedu.web.id` |

- **Override lokal (opsional):** Buat **`.env.local`** di root. File ini di-ignore Git dan mengoverride nilai dari `.env.development` / `.env.production`. Cocok untuk rahasia atau URL backend lain di mesin Anda.
- **Template:** `.env.example` berisi contoh variabel; bisa di-copy ke `.env.local`.

Ringkasnya: **push ke server** lalu build di server → Next.js pakai **`.env.production`** saat `npm run build` (client bundle memakai production API). **Jalan di local** → `npm run dev` pakai **`.env.development`** (request ke localhost atau nilai di `.env.local` jika ada).

### 3.3 Menjalankan dev server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Halaman akan hot-reload saat Anda mengubah kode.

---

## 4. Scripts & perintah

| Perintah | Keterangan |
|----------|-------------|
| `npm run dev` | Menjalankan Next.js dev server (default port 3000). |
| `npm run build` | Build production (`next build`). Output standalone untuk Docker. |
| `npm run start` | Menjalankan server production (`next start -p 3000 -H 0.0.0.0`). Jalankan setelah `npm run build`. |
| `npm run lint` | Menjalankan ESLint (tanpa arg = pakai config default). |

Contoh lint dengan path tertentu:

```bash
npm run lint -- src/app src/lib
```

---

## 5. Struktur project

```
fansedu-lms/
├── docs/                    # Dokumentasi
│   ├── DEVELOPMENT_AND_MAINTENANCE.md   # Dokumen ini
│   └── BACKEND_REQUEST_DETAIL_TRYOUT_STATS.md
├── public/                  # Aset statis
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout (font, metadata)
│   │   ├── page.tsx         # Landing / redirect
│   │   ├── login/          # Login
│   │   ├── register/       # Register
│   │   ├── forgot-password/
│   │   ├── student/         # Dashboard & fitur siswa
│   │   │   ├── page.tsx
│   │   │   ├── attempts/[attemptId]/review/
│   │   │   └── ...
│   │   ├── tryout/[id]/     # Halaman tryout (siswa)
│   │   ├── admin/           # Panel admin
│   │   │   ├── page.tsx
│   │   │   ├── tryouts/     # Event/tryout, detail, soal
│   │   │   ├── users/
│   │   │   ├── master-data/ # Jenjang, bidang, sekolah, event, role, setting
│   │   │   ├── report/
│   │   │   └── payment/
│   │   └── api/             # Route API Next.js (proxy, health)
│   │       ├── health/
│   │       ├── auth/login/
│   │   └── api/v1/[...path]/ # Proxy ke backend Go
│   ├── components/          # Komponen reusable
│   │   ├── AdminSidebar.tsx
│   │   ├── QuestionBody.tsx
│   │   └── ...
│   └── lib/                 # Logic & shared
│       ├── api.ts           # Client API (fetch ke backend)
│       └── api-types.ts     # TypeScript types (request/response)
├── Dockerfile               # Multi-stage build production
├── next.config.ts           # output: "standalone", dll.
├── package.json
├── DEPLOY.md                # Panduan deploy & troubleshooting 502
└── README.md
```

---

## 6. Arsitektur & konvensi

### 6.1 API client

- **Lokasi:** `src/lib/api.ts`
- Semua panggilan ke backend dilakukan melalui fungsi di sini (mis. `login()`, `adminGetTryout()`, `getTryoutLeaderboard()`).
- Base URL: dari `NEXT_PUBLIC_API_URL` + `/api/v1`, atau fallback same-origin / default.
- **Auth:** Token di cookie `auth_token`; setiap request yang butuh auth mengirim header `Authorization: Bearer <token>`.
- **Error:** Fungsi `getFriendlyApiErrorMessage(err)` untuk menampilkan pesan ramah ke pengguna. Beberapa endpoint mengembalikan array kosong atau `null` pada 404/405 (lihat komentar di `api.ts`).

### 6.2 Types

- **Lokasi:** `src/lib/api-types.ts`
- Interface request/response (User, TryoutSession, Question, LeaderboardEntry, QuestionStats, dll.) disesuaikan dengan kontrak backend. Jika backend mengirim field dengan nama lain (mis. `nama` vs `name`), normalisasi dilakukan di `api.ts`.

### 6.3 Auth & role

- Setelah login: `setAuthToken(token, maxAge, role, name)` menyimpan token, role, dan nama di cookie.
- Role: `admin` | `student` | `trainer`. Redirect setelah login berdasarkan role (admin → `/admin`, siswa → `/student`).
- Halaman admin memeriksa role (biasanya redirect ke login atau home jika bukan admin).

### 6.4 Konvensi kode

- **Komponen:** Functional components + hooks. Untuk halaman yang butuh data API: `useState`, `useEffect` / `useCallback` untuk fetch.
- **Styling:** Tailwind utility classes. Konsisten dengan class yang sudah dipakai (zinc, emerald, red untuk status).
- **Bahasa UI:** Indonesia untuk teks yang tampil ke pengguna.
- **File:** PascalCase untuk komponen, kebab-case untuk folder route.

---

## 7. Fitur & routing

| Route | Deskripsi | Auth |
|-------|------------|------|
| `/` | Landing; redirect ke login atau dashboard sesuai role | - |
| `/login` | Form login | - |
| `/register` | Form registrasi | - |
| `/forgot-password` | Lupa password | - |
| `/student` | Dashboard siswa | Siswa |
| `/student/attempts/[id]/review` | Review jawaban attempt | Siswa |
| `/tryout/[id]` | Mengerjakan tryout | Siswa |
| `/admin` | Dashboard admin | Admin |
| `/admin/users` | Manajemen user | Admin |
| `/admin/tryouts` | Daftar event/tryout | Admin |
| `/admin/tryouts/[id]/detail` | Detail tryout (info, leaderboard, soal, statistik per soal) | Admin |
| `/admin/tryouts/[id]/soal` | Kelola soal tryout | Admin |
| `/admin/master-data/*` | Jenjang, bidang, sekolah, event, role, setting | Admin |
| `/admin/report` | Laporan | Admin |
| `/admin/payment` | Payment | Admin |

---

## 8. Backend API

- **Base URL:** `NEXT_PUBLIC_API_URL` + `/api/v1` (contoh: `https://api.fansedu.web.id/api/v1`).
- **Auth:** Header `Authorization: Bearer <token>` untuk endpoint yang memerlukan login/admin.
- **Endpoint tryout (ringkas):**
  - `GET /admin/tryouts/:tryoutId` — detail tryout
  - `GET /admin/tryouts/:tryoutId/questions` — daftar soal
  - `GET /tryouts/:tryoutId/leaderboard` — leaderboard (tanpa auth)
  - `GET /admin/tryouts/:tryoutId/questions/stats` — statistik semua soal (bulk, disarankan)
  - `GET /admin/tryouts/:tryoutId/questions/:questionId/stats` — statistik per soal (fallback)

Spesifikasi lengkap untuk endpoint statistik tryout ada di [docs/BACKEND_REQUEST_DETAIL_TRYOUT_STATS.md](BACKEND_REQUEST_DETAIL_TRYOUT_STATS.md).

---

## 9. Quality & lint

- **ESLint:** Config di `eslint.config.mjs` (Next.js core-web-vitals + TypeScript).
- Sebelum commit, disarankan jalankan:

  ```bash
  npm run lint
  ```

- Perbaiki error dan warning yang muncul. Tidak ada config Prettier terpisah; format mengandalkan konvensi tim atau format-on-save di editor.

---

## 10. Deploy & production

- Build: `npm run build` (pastikan `NEXT_PUBLIC_API_URL` diset untuk production).
- Run: `npm run start` (listen di `0.0.0.0:3000`).
- **Docker:** Lihat [DEPLOY.md](../DEPLOY.md). Image menggunakan output `standalone`. Build dengan:

  ```bash
  docker build --build-arg NEXT_PUBLIC_API_URL=https://api.fansedu.web.id -t fansedu-lms .
  ```

- Health check: `GET /api/health` harus mengembalikan 200.

---

## 11. Maintenance rutin

### 11.1 Update dependency

- Secara berkala cek vulnerability:

  ```bash
  npm audit
  ```

- Update minor/patch:

  ```bash
  npm update
  ```

- Untuk major (Next.js, React): baca release notes dan uji build serta fitur penting sebelum deploy.

### 11.2 Node version

- Project memakai Node 20 (lihat Dockerfile). Jika upgrade Node, sesuaikan `Dockerfile` dan dokumentasi (mis. README) agar konsisten.

### 11.3 Backend contract

- Jika backend mengubah response (nama field, struktur), sesuaikan:
  - `src/lib/api-types.ts` (interface)
  - `src/lib/api.ts` (normalisasi, mapping)
  - Komponen yang menampilkan data tersebut.

---

## 12. Troubleshooting

| Masalah | Hal yang dicek |
|---------|-----------------|
| **502 Bad Gateway** (production) | Lihat [DEPLOY.md](../DEPLOY.md): HOSTNAME, port proxy, rebuild image, health check. |
| **Request API gagal / CORS** | Pastikan `NEXT_PUBLIC_API_URL` benar; backend harus allow CORS dari origin frontend. |
| **Login redirect tidak sesuai** | Cek cookie `auth_role` dan logika redirect di `app/page.tsx` / setelah login. |
| **Data tryout/leaderboard kosong** | Pastikan backend mengembalikan format yang dinormalisasi di `api.ts` (mis. `leaderboard` atau `data`). |
| **Statistik soal tetap "–"** | Backend harus menyediakan endpoint stats (bulk atau per-soal). Lihat [BACKEND_REQUEST_DETAIL_TRYOUT_STATS.md](BACKEND_REQUEST_DETAIL_TRYOUT_STATS.md). |
| **Build gagal** | Jalankan `npm run build` di lokal; periksa error TypeScript/ESLint. Pastikan env `NEXT_PUBLIC_*` diset jika dipakai saat build. |

---

## 13. Dokumen terkait

- [DEPLOY.md](../DEPLOY.md) — Deploy Docker & troubleshooting 502.
- [README.md](../README.md) — Getting started singkat.
- [docs/BACKEND_REQUEST_DETAIL_TRYOUT_STATS.md](BACKEND_REQUEST_DETAIL_TRYOUT_STATS.md) — Spesifikasi endpoint statistik tryout untuk backend.

---

*Dokumen ini dapat diperbarui seiring perubahan struktur project atau proses tim. Jika ada konvensi baru (testing, CI/CD, branching), tambahkan ke dokumen ini.*

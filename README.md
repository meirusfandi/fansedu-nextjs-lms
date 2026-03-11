# FansEdu LMS

Frontend web untuk **FansEdu** — platform LMS Olimpiade Informatika (OSN). Dibangun dengan Next.js 16 (App Router), React 19, dan Tailwind CSS. Backend terpisah (API Go) di `api.fansedu.web.id`.

## Mulai cepat

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Environment

- **Local (`npm run dev`):** Pakai **`.env.development`** — default `NEXT_PUBLIC_API_URL=http://localhost:8080`.
- **Server / production (`npm run build`):** Pakai **`.env.production`** — default `NEXT_PUBLIC_API_URL=https://api.fansedu.web.id`.
- **Override lokal:** Buat **`.env.local`** (di-ignore Git) jika ingin nilai lain; `.env.local` mengoverride file env lainnya.
- **Template:** `.env.example` berisi contoh variabel.

## Scripts

| Perintah        | Keterangan                    |
|-----------------|--------------------------------|
| `npm run dev`   | Dev server (port 3000)         |
| `npm run build` | Build production               |
| `npm run start` | Jalankan build production     |
| `npm run lint`  | ESLint                         |

## Fitur

- **Siswa:** Login, dashboard, tryout, review jawaban, sertifikat.
- **Admin:** Dashboard, user, event/tryout, soal, master data (jenjang, bidang, sekolah, event, role), laporan, payment.

## Dokumentasi

- **[docs/DEVELOPMENT_AND_MAINTENANCE.md](docs/DEVELOPMENT_AND_MAINTENANCE.md)** — Pengembangan & maintenance: struktur project, konvensi, API, deploy, troubleshooting.
- **[DEPLOY.md](DEPLOY.md)** — Deploy production (Docker) & penanganan 502.

## Tech stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS v4
- Backend: API Go (`/api/v1`)

# Database Schema – FansEdu LMS

Schema database untuk mendukung semua fitur LMS: auth, admin, siswa, event tryout, soal, pengerjaan, rekomendasi, kursus, dan sertifikat.

## Ringkasan Tabel

| Tabel | Deskripsi |
|-------|-----------|
| **users** | Akun (admin & student): email, password_hash, nama, role |
| **password_reset_tokens** | Token untuk fitur lupa password |
| **tryout_sessions** | Event/jadwal simulasi OSN (buka–tutup, durasi, level) |
| **questions** | Soal per tryout (isian singkat, pilihan ganda, benar/salah) |
| **attempts** | Satu siswa mengerjakan satu tryout (skor, persentil, status) |
| **attempt_answers** | Jawaban per soal per attempt (teks atau pilihan) |
| **attempt_feedback** | Ringkasan & rangkuman per attempt (bisa dari AI) |
| **courses** | Kelas pembinaan (Algoritma, DP, dll.) |
| **course_enrollments** | Pendaftaran siswa ke kelas (enrolled / in_progress / completed) |
| **certificates** | Sertifikat (terkait tryout atau course) |

## Relasi Singkat

- **users** → attempts, course_enrollments, certificates, created tryout_sessions & courses  
- **tryout_sessions** → questions, attempts, certificates  
- **attempts** → attempt_answers, attempt_feedback  
- **questions** → attempt_answers (per attempt per question)  
- **courses** → course_enrollments, certificates  

## Cara Pakai

### Opsi 1: PostgreSQL + SQL

1. Buat database PostgreSQL.
2. Set `DATABASE_URL` (atau sambungkan lewat client).
3. Jalankan skrip:

```bash
psql -U postgres -d fansedu_lms -f database/schema.sql
```

### Opsi 2: Prisma (Next.js)

1. Pasang Prisma:

```bash
npm i prisma @prisma/client
```

2. Set `.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

3. Generate client dan sinkronkan schema:

```bash
npx prisma generate
npx prisma db push
```

atau pakai migrasi:

```bash
npx prisma migrate dev --name init
```

4. Di kode Next.js, gunakan `PrismaClient` untuk query (auth, tryout, attempts, feedback, dll.).

## Mapping ke Fitur Aplikasi

- **Login / register / forgot password** → `users`, `password_reset_tokens`
- **Dashboard admin** (statistik, event, siswa) → `users` (role=student), `tryout_sessions`, `course_enrollments`, `attempts`, `certificates`
- **Dashboard siswa** (jadwal buka, ringkasan, grafik) → `tryout_sessions` (status=open), `attempts` (user_id + score/percentile)
- **Halaman tryout** (mulai, soal, jawaban, kirim) → `attempts`, `attempt_answers`, `questions`
- **Ringkasan & rangkuman per tryout** → `attempt_feedback` (per attempt)
- **Kelas / pembinaan** → `courses`, `course_enrollments`
- **Sertifikat** → `certificates` (user_id + tryout_session_id atau course_id)

## Enum

- **user_role**: `admin`, `student`
- **tryout_level**: `easy`, `medium`, `hard`
- **tryout_status**: `draft`, `open`, `closed`
- **question_type**: `short`, `multiple_choice`, `true_false`
- **attempt_status**: `in_progress`, `submitted`, `expired`
- **enrollment_status**: `enrolled`, `in_progress`, `completed`

## Catatan

- Satu user hanya satu **attempt** per **tryout_session** (UNIQUE user_id, tryout_session_id).
- **attempt_answers**: satu baris per (attempt_id, question_id); isi `answer_text` untuk isian singkat, `selected_option` untuk pilihan ganda/benar-salah.
- **questions.options**: JSON; untuk pilihan ganda bisa array string atau array `{ key, label }`; untuk benar/salah `["Benar","Salah"]`.
- **attempt_feedback**: bisa diisi setelah submit (manual atau dari pipeline AI) untuk ringkasan, rangkuman, strength_areas, improvement_areas.

# Kebutuhan Data Backend: Halaman Detail Event/Tryout (Admin)

Gunakan dokumen ini sebagai **prompt/spesifikasi** untuk tim backend agar halaman **Detail event/tryout** di admin bisa menampilkan data lengkap: leaderboard, daftar soal, dan **statistik per soal** (berapa siswa mengerjakan, berapa jawaban benar/salah).

---

## Konteks

- **Frontend:** Halaman admin `GET /admin/tryouts/[id]/detail` menampilkan:
  1. Informasi event (judul, jadwal, durasi, status, jumlah soal).
  2. **Leaderboard** tryout (peringkat, nama, sekolah, skor).
  3. **Daftar soal** dengan detail teks, opsi, dan **statistik per soal**:
     - Jumlah siswa yang mengerjakan soal ini.
     - Jumlah jawaban benar (dan persentase).
     - Jumlah jawaban salah (dan persentase).

- **Base URL API:** `https://api.fansedu.web.id/api/v1` (atau sesuai env). Semua request admin memakai header `Authorization: Bearer <token>`.

---

## 1. Endpoint yang Sudah Dipakai (Pastikan Tersedia)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/admin/tryouts/:tryoutId` | Detail tryout (title, opens_at, closes_at, duration_minutes, questions_count, level, status, description, dll). |
| GET | `/admin/tryouts/:tryoutId/questions` | Daftar soal tryout. Response: array of `{ id, tryout_session_id, sort_order, type, body, options, max_score, image_url? }`. |
| GET | `/tryouts/:tryoutId/leaderboard` | Leaderboard (boleh tanpa auth). Response: array of `{ rank?, user_id?, user_name?, name?, school_name?, score?, best_score? }`. |

Frontend sudah memakai ketiga endpoint di atas. Pastikan response sesuai atau bisa dinormalisasi (misalnya `skor` vs `score`, `nama` vs `user_name`).

---

## 2. Endpoint Baru yang Dibutuhkan: Statistik Per Soal

Agar kolom **“Jumlah siswa yang mengerjakan”**, **“Jumlah jawaban benar”**, dan **“Jumlah jawaban salah”** per soal terisi (bukan "–"), backend perlu menyediakan endpoint berikut.

### 2.1. Statistik per satu soal

**Request**

- **Method:** `GET`
- **Path:** `/admin/tryouts/:tryoutId/questions/:questionId/stats`
- **Headers:** `Authorization: Bearer <token_admin>`

**Response (200 OK)**

JSON object dengan field berikut (nama field harus persis agar frontend bisa pakai):

```json
{
  "participants_count": 50,
  "answered_count": 48,
  "correct_count": 32,
  "wrong_count": 16,
  "correct_percent": 66.67,
  "wrong_percent": 33.33
}
```

**Deskripsi field**

| Field | Tipe | Wajib | Keterangan |
|-------|------|--------|------------|
| `participants_count` | number | disarankan | Jumlah **siswa yang pernah submit attempt** untuk tryout ini (attempt status = submitted). Ini = “jumlah siswa yang mengerjakan tryout”. |
| `answered_count` | number | opsional | Jumlah **jawaban yang masuk** untuk soal ini (berapa responden yang menjawab soal ini). Bisa sama dengan participants_count jika semua menjawab. |
| `correct_count` | number | ya | Jumlah jawaban **benar** untuk soal ini. |
| `wrong_count` | number | ya | Jumlah jawaban **salah** untuk soal ini. |
| `correct_percent` | number | opsional | Persentase benar (0–100). Frontend bisa hitung dari `correct_count / (correct_count + wrong_count) * 100` jika tidak dikirim. |
| `wrong_percent` | number | opsional | Persentase salah (0–100). Frontend bisa hitung dari `wrong_count / (correct_count + wrong_count) * 100` jika tidak dikirim. |

**Logika hitung (saran)**

- **participants_count:**  
  `COUNT(DISTINCT attempt.user_id)` untuk tryout ini dengan `attempt.status = 'submitted'`.

- **Per soal (question_id):**  
  Dari tabel jawaban (mis. `attempt_answers`): filter `question_id = :questionId` dan hanya attempt yang sudah submit.
  - **answered_count** = jumlah baris jawaban untuk soal ini (atau COUNT DISTINCT attempt_id).
  - **correct_count** = jumlah jawaban yang dinilai benar (bandingkan `user_answer` dengan kunci jawaban soal).
  - **wrong_count** = jumlah jawaban yang dinilai salah.
  - **correct_percent** = `correct_count / (correct_count + wrong_count) * 100`.
  - **wrong_percent** = `wrong_count / (correct_count + wrong_count) * 100`.

**Response jika soal/tryout tidak ditemukan**

- **404 Not Found** — frontend akan menampilkan "–" untuk statistik soal tersebut (tidak error).

---

## 3. Contoh Prompt yang Bisa Dikirim ke Backend

Berikut blok yang bisa Anda salin dan kirim ke tim backend (sebagai prompt/request):

---

**Subject:** Tambah endpoint statistik per soal untuk halaman detail tryout (admin)

Saya butuh endpoint berikut agar di admin, halaman **Detail event/tryout** bisa menampilkan per soal:
- jumlah siswa yang mengerjakan soal ini,
- jumlah jawaban benar (dan persen),
- jumlah jawaban salah (dan persen).

**Endpoint yang diminta:**

- **GET** `/api/v1/admin/tryouts/:tryoutId/questions/:questionId/stats`
- Auth: **Bearer token** (role admin).

**Response 200 (JSON):**

```json
{
  "participants_count": 50,
  "answered_count": 48,
  "correct_count": 32,
  "wrong_count": 16,
  "correct_percent": 66.67,
  "wrong_percent": 33.33
}
```

**Field:**

- `participants_count` (number): jumlah siswa yang pernah submit attempt untuk tryout ini.
- `answered_count` (number, opsional): jumlah jawaban yang masuk untuk soal ini.
- `correct_count` (number): jumlah jawaban benar untuk soal ini.
- `wrong_count` (number): jumlah jawaban salah untuk soal ini.
- `correct_percent` (number, opsional): persentase benar 0–100.
- `wrong_percent` (number, opsional): persentase salah 0–100.

Hitung dari data attempt + jawaban: bandingkan jawaban user dengan kunci jawaban soal; benar/salah sesuai logika penilaian yang sudah ada. Jika tryout atau soal tidak ada, kembalikan **404**.

Terima kasih.

---

## 4. Opsi Alternatif: Statistik Semua Soal Sekaligus (Bulk)

Jika lebih mudah di backend, boleh juga menyediakan **satu endpoint** yang mengembalikan statistik **semua soal** dalam satu tryout, agar frontend tidak perlu N kali request (satu per soal).

**Request**

- **Method:** `GET`
- **Path:** `/admin/tryouts/:tryoutId/questions/stats` (atau `/admin/tryouts/:tryoutId/question-stats`)
- **Headers:** `Authorization: Bearer <token>`

**Response (200 OK)**

```json
{
  "participants_count": 50,
  "questions": [
    {
      "question_id": "uuid-soal-1",
      "answered_count": 48,
      "correct_count": 32,
      "wrong_count": 16,
      "correct_percent": 66.67,
      "wrong_percent": 33.33
    },
    {
      "question_id": "uuid-soal-2",
      "answered_count": 48,
      "correct_count": 40,
      "wrong_count": 8,
      "correct_percent": 83.33,
      "wrong_percent": 16.67
    }
  ]
}
```

Jika backend memilih opsi bulk ini, frontend perlu penyesuaian kecil: satu kali panggil `GET /admin/tryouts/:id/questions/stats`, lalu map `questions[].question_id` ke tiap soal di halaman detail. Spesifikasi field per soal tetap sama seperti di atas.

---

## 5. Ringkasan untuk Backend

- **Wajib:** Endpoint **statistik per soal** (per questionId atau bulk) dengan minimal: **correct_count**, **wrong_count**, dan sebaiknya **participants_count** atau **answered_count**.
- **Auth:** Admin only (Bearer token).
- **404:** Untuk tryout/question tidak ditemukan.
- **Nama field:** Gunakan nama di dokumen ini agar frontend tidak perlu ubah banyak.

Setelah endpoint ini tersedia dan base URL API benar, halaman detail event/tryout akan menampilkan angka dan grafik perbandingan benar/salah per soal secara otomatis.

# API Guru (Trainer): Register & Profil

Dokumen referensi untuk endpoint yang dipakai dashboard guru. Base URL: `http://localhost:8080/api/v1` (atau sesuai env).

---

## 1. Register guru → simpan token

**Request**

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Pak Guru","email":"guru@example.com","password":"rahasia123","role":"guru"}'
```

**Response sukses (200)**

```json
{
  "user": { "id": "...", "name": "Pak Guru", "email": "guru@example.com", "role": "guru" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Frontend: simpan `token` di cookie (`auth_token`), set `auth_role` = `trainer` (map dari `guru`), redirect ke `/guru`.

---

## 2. Profil guru (pakai token dari response)

**Request**

```bash
curl -s -H "Authorization: Bearer <TOKEN>" http://localhost:8080/api/v1/trainer/profile
```

**Response sukses (200)**

Backend dapat mengembalikan nama, email, dan info sekolah, misalnya:

```json
{
  "name": "Pak Guru",
  "email": "guru@example.com",
  "school": {
    "id": "...",
    "nama_sekolah": "SMA Contoh",
    "npsn": "12345678",
    "kabupaten_kota": "Jakarta Selatan",
    "alamat": "Jl. Contoh No. 1",
    "telepon": "021-xxx"
  }
}
```

Atau tanpa `school` jika guru belum terhubung ke sekolah.

Frontend: `getTrainerProfile()` → GET `/trainer/profile` dengan header `Authorization: Bearer <token>` (otomatis dari cookie).

---

## 3. Update nama profil

**Request**

```bash
curl -s -X PUT http://localhost:8080/api/v1/trainer/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nama Baru"}'
```

**Response sukses (200)**

```json
{ "ok": true }
```

Frontend: `updateTrainerProfile({ name: "Nama Baru" })` → PUT `/trainer/profile` dengan body `{ "name": "Nama Baru" }`.

---

## Ringkasan

| Aksi           | Method | Path               | Body / Header                    |
|----------------|--------|--------------------|----------------------------------|
| Register guru  | POST   | `/auth/register`   | `{ name, email, password, role: "guru" }` |
| Ambil profil   | GET    | `/trainer/profile` | `Authorization: Bearer <TOKEN>`  |
| Update nama    | PUT    | `/trainer/profile` | `Authorization: Bearer <TOKEN>`, `{ "name": "Nama Baru" }` |

Ganti `http://localhost:8080` jika API berjalan di host/port lain.

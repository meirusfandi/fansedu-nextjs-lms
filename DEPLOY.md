# Panduan Deploy & Troubleshooting 502

## Perubahan untuk mengatasi 502 Bad Gateway

1. **Dockerfile**: `ENV HOSTNAME=0.0.0.0` — agar server Next.js (standalone) mendengarkan di semua interface, bukan hanya localhost. Tanpa ini, proxy (Easypanel/Cloudflare) tidak bisa mengakses container.
2. **Health check**: `GET /api/health` mengembalikan 200. Gunakan untuk cek apakah app hidup.

## Build & run (contoh)

```bash
# Build dengan URL backend production (untuk client bundle)
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.fansedu.web.id -t fansedu-lms .

# Jalankan
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.fansedu.web.id \
  fansedu-lms
```

Setelah container jalan, cek:
- **http://localhost:3000/api/health** → harus `{"status":"ok",...}` (200).
- **http://localhost:3000/** → halaman app (redirect ke login dsb.).

## Jika masih 502 di production (app.fansedu.web.id)

1. **Log container**  
   Di Easypanel (atau `docker logs <container>`): lihat apakah process crash atau ada error saat start.

2. **Port & proxy**  
   Pastikan proxy (Easypanel/Nginx) mengarah ke **port 3000** di dalam container, dan container benar-benar running.

3. **Rebuild setelah perubahan**  
   Setelah menambah `HOSTNAME=0.0.0.0` dan/atau mengubah Dockerfile, **build ulang image** dan deploy lagi. Container lama tidak punya env baru.

4. **Cek health dari dalam host**  
   Jika bisa akses host server: `curl http://localhost:3000/api/health`. Jika ini 200 tapi browser dapat 502, masalah di proxy/Cloudflare (port, upstream, SSL).

5. **Env production**  
   Pastikan `NEXT_PUBLIC_API_URL` diset saat build (atau di env container) agar app bisa panggil backend dengan benar.

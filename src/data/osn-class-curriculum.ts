/**
 * Kurikulum contoh: 8 sesi persiapan OSN-K (Computational Thinking → Strategi ujian).
 * Dipakai oleh Admin → Management Kelas → "Impor materi OSN (8 modul)".
 */
export type OsnPrepModuleSpec = {
  title: string;
  focus: string;
  lessonBody: string;
};

export const OSN_PREP_CURRICULUM_MODULES: OsnPrepModuleSpec[] = [
  {
    title: "KELAS 1 (Jadwal No. 1): Computational Thinking",
    focus: "Membangun abstraksi tanpa kode (tipe soal Bebras).",
    lessonBody: `Rencana slide & alur kelas

Slide 1–2 (Opening)
• Judul & aturan kelas: komputer = kertas & otak (latihan Bebras tidak wajib laptop).

Slide 3 (Teori ~10%)
• Empat pilar computational thinking: dekomposisi, pengenalan pola, abstraksi, algoritma (level konsep, belum menulis kode).

Slide 4 (Teori ~20%)
• Strategi scanning tipe A: baca pertanyaan di akhir paragraf dulu; catat batasan/aturan (kapasitas, waktu, larangan); abaikan teks yang tidak relevan.

Slide 5–6 (Latihan 1 & bahas)
• Soal dekomposisi. Contoh: menjadwalkan antrean loket dengan aturan waktu tertentu. Tutor mendemonstrasikan visualisasi antrean di slide.

Slide 7–8 (Latihan 2 & bahas)
• Soal pengenalan pola Bebras. Contoh: pola pergerakan robot pembersih lantai.

Slide 9–10 (Latihan 3 & bahas)
• Soal abstraksi. Contoh: rute pengiriman barang bersyarat. Latihan mencoret informasi jebakan yang tidak mempengaruhi jawaban.

Slide 11 (Closing)
• Kesimpulan & instruksi post-quiz.`,
  },
  {
    title: "KELAS 2 (Jadwal No. 2): Himpunan & Boolean",
    focus: "Logika komputer dasar dan diagram Venn.",
    lessonBody: `Rencana slide & alur kelas

Slide 1–2 (Opening)
• Judul & pemanasan: teka-teki True/False untuk membangun intuisi logika.

Slide 3 (Teori ~15%)
• Tabel kebenaran Boolean: AND, OR, NOT, XOR.

Slide 4 (Teori ~25%)
• Visualisasi diagram Venn & prinsip inklusi–eksklusi: |A ∪ B| = |A| + |B| − |A ∩ B|.

Slide 5–6 (Latihan 1 & bahas)
• Soal evaluasi Boolean. Ekspresi panjang seperti (A AND B) OR NOT (C XOR A) dengan nilai yang diketahui. Berlatih menghitung dari dalam kurung keluar.

Slide 7–8 (Latihan 2 & bahas)
• Soal cerita himpunan 2 variabel. Contoh: siswa yang suka C++ dan Python (irisan, gabungan, hanya salah satu).

Slide 9–10 (Latihan 3 & bahas)
• Soal cerita himpunan 3 variabel (lanjutan). Tutor mempraktikkan mengisi diagram Venn selalu dari titik tengah (irisan ketiganya) lalu ke luar.

Slide 11 (Closing)
• Hukum De Morgan sebagai jalan pintas mengubah NOT (A AND B) dan NOT (A OR B).`,
  },
  {
    title: "KELAS 3 (Jadwal No. 3): Kombinatorika",
    focus: "Menghitung peluang dan kemungkinan kejadian (dasar brute-force).",
    lessonBody: `Rencana slide & alur kelas

Slide 1–2 (Opening)
• Judul & review singkat himpunan sebagai jembatan ke “berapa banyak cara”.

Slide 3 (Teori ~15%)
• Aturan penjumlahan (pilihan / OR) vs aturan perkalian (bersamaan / AND).

Slide 4 (Teori ~30%)
• Permutasi (urutan penting): nPr = n! / (n−r)! vs kombinasi (bebas urutan): nCr = n! / (r! (n−r)!).

Slide 5–6 (Latihan 1 & bahas)
• Soal aturan perkalian. Contoh: kombinasi password atau banyaknya pilihan rute/baju.

Slide 7–8 (Latihan 2 & bahas)
• Soal kombinasi kelompok. Contoh: memilih 3 anggota tim dari 10 orang dengan syarat si A harus ikut.

Slide 9–10 (Latihan 3 & bahas)
• Soal pigeonhole principle (prinsip sarang merpati). Contoh: minimal berapa kaus kaki diambil dalam gelap agar pasti dapat sepasang warna sama?

Slide 11 (Closing)
• Trik membedakan dari kalimat soal: kapan pakai P (permutasi) vs C (kombinasi).`,
  },
  {
    title: "KELAS 4 (Jadwal No. 4): Deret & Model Matematis",
    focus: "Pola barisan angka yang sering muncul dalam output program perulangan.",
    lessonBody: `Rencana slide & alur kelas

Slide 1–2 (Opening)
• Judul & pemanasan pola deret singkat (tebak pola berikutnya).

Slide 3 (Teori ~15%)
• Barisan & deret aritmetika: suku ke-n (U_n) dan jumlah n suku pertama (S_n).

Slide 4 (Teori ~30%)
• Pemodelan matematis & penggunaan modulo (%) untuk memprediksi pola berulang (siklus).

Slide 5–6 (Latihan 1 & bahas)
• Soal prediksi siklus. Contoh: hari apa 1000 hari setelah hari Selasa? Praktik mod 7.

Slide 7–8 (Latihan 2 & bahas)
• Soal deret aritmetika “terselubung”: menghitung jumlah pergerakan/langkah dalam algoritma fiktif.

Slide 9–10 (Latihan 3 & bahas)
• Soal model matematis (aljabar): cerita tebak umur atau jumlah koin → persamaan X dan Y.

Slide 11 (Closing)
• Modulo sebagai senjata utama di banyak soal OSN. Pengingat: Tryout 1.`,
  },
  {
    title: "KELAS 5 (Jadwal No. 6): Graf & Geometri",
    focus: "Pemodelan peta dan titik koordinat.",
    lessonBody: `Rencana slide & alur kelas

Slide 1–2 (Opening)
• Judul & evaluasi singkat hasil Tryout 1 (refleksi cepat).

Slide 3 (Teori ~15%)
• Teori graf dasar: node, edge, degree, path.

Slide 4 (Teori ~30%)
• Geometri grid: jarak Manhattan |x₁−x₂| + |y₁−y₂| vs jarak Euclidean (garis lurus).

Slide 5–6 (Latihan 1 & bahas)
• Soal jarak terpendek di graf tertimbang. Tutor mempraktikkan logika pencarian jalur (mis. Dijkstra secara manual).

Slide 7–8 (Latihan 2 & bahas)
• Soal jarak Manhattan. Contoh: robot grid dari (0,0) ke (5,5) dengan rintangan.

Slide 9–10 (Latihan 3 & bahas)
• Soal pewarnaan graf atau konektivitas. Contoh: berapa kabel minimal untuk menyambungkan semua komputer?

Slide 11 (Closing)
• Tips menggambar ulang graf/peta rumit di kertas agar lebih rapi dan tidak salah baca.`,
  },
  {
    title: "KELAS 6 (Jadwal No. 7): Algoritma & C++ Dasar",
    focus: "Tracing code untuk I/O, percabangan, dan looping.",
    lessonBody: `Rencana slide & alur kelas

Slide 1–2 (Opening)
• Judul & perkenalan tipe C: koding di kertas (tanpa compiler).

Slide 3 (Teori ~15%)
• Tipe data C++, modulo (%), percabangan if / else if / else.

Slide 4 (Teori ~30%)
• Perulangan for & while; konsep tracing table (wajib dipakai saat ujian).

Slide 5–6 (Latihan 1 & bahas)
• Tracing table sederhana: melacak nilai variabel X dan Y dari while loop singkat.

Slide 7–8 (Latihan 2 & bahas)
• Jebakan if–else bertingkat: berlatih melompati blok yang syaratnya tidak terpenuhi.

Slide 9–10 (Latihan 3 & bahas)
• Looping skala besar: amati 3 iterasi pertama, lalu gunakan deret aritmetika untuk menebak hasil iterasi ke-100.

Slide 11 (Closing)
• Jangan menebak hasil kode tanpa membuat tabel trace.`,
  },
  {
    title: "KELAS 7 (Jadwal No. 9): Array, Subprogram & Rekursi",
    focus: "“Bos terakhir” di soal C++ OSN-K.",
    lessonBody: `Rencana slide & alur kelas

Slide 1–2 (Opening)
• Judul & review singkat tracing table.

Slide 3 (Teori ~15%)
• Array 1D/2D (indeks mulai 0) & anatomi fungsi (return value, parameter).

Slide 4 (Teori ~30%)
• Rekursi: base case & recursive step; cara menggambar pohon rekursi (recursion tree).

Slide 5–6 (Latihan 1 & bahas)
• Membaca array 1D: for-loop cari max/min atau tukar isi elemen.

Slide 7–8 (Latihan 2 & bahas)
• Rekursi linier: satu pemanggilan diri sendiri (mis. f(x) = x + f(x−1)); latihan hitung bottom-up.

Slide 9–10 (Latihan 3 & bahas)
• Rekursi bercabang (level OSN): dua pemanggilan (mis. Fibonacci f(x)=f(x−1)+f(x−2)). Tutor mendemonstrasikan penggambaran pohon.

Slide 11 (Closing)
• Kunci rekursi: cari titik berhenti (base case) lebih dulu.`,
  },
  {
    title: "KELAS 8 (Jadwal No. 10): Tryout Review & Strategi OSN",
    focus: "Persiapan mental, manajemen waktu, dan triage soal.",
    lessonBody: `Rencana slide & alur kelas

Slide 1–2 (Opening)
• Analisis hasil Tryout 2 (simulasi penuh): apa yang sering salah & pola waktu.

Slide 3 (Teori ~15%)
• Strategi ujian ~2,5 jam: kerjakan tipe A dulu, tipe B di tengah, tipe C (terutama rekursi) di akhir.

Slide 4 (Teori ~30%)
• Seni menebak cerdas (educated guess): mengeliminasi opsi pada pilihan ganda algoritma.

Slide 5–6 (Latihan 1 & bahas)
• Pembahasan soal tersulit #1 dari Tryout 2 (biasanya tipe C rekursi).

Slide 7–8 (Latihan 2 & bahas)
• Pembahasan soal tersulit #2 dari Tryout 2 (biasanya tipe B studi kasus).

Slide 9–10 (Latihan 3 & bahas)
• Latihan kecepatan: kuis kilat 3 soal tipe A.

Slide 11 (Closing)
• Motivasi, persiapan fisik H−1 ujian, penutup (doa bersama jika sesuai kelompok).`,
  },
];

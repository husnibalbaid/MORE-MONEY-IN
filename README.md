# Catatan Keuangan

Aplikasi catat uang masuk, keluar, dan split saving otomatis. Bisa diinstall di komputer dan HP seperti aplikasi sungguhan (PWA).

---

## Cara Deploy ke Vercel (Gratis)

### Langkah 1 — Upload ke GitHub
1. Buka https://github.com dan buat akun jika belum punya.
2. Klik **"New repository"**, beri nama `catatan-keuangan`, lalu klik **Create repository**.
3. Upload semua file dari folder `keuangan-app` ini ke repository tersebut (drag & drop di halaman GitHub, atau gunakan GitHub Desktop).

### Langkah 2 — Deploy ke Vercel
1. Buka https://vercel.com dan daftar/login (bisa pakai akun GitHub).
2. Klik **"Add New Project"** → pilih repository `catatan-keuangan` yang baru dibuat.
3. Vercel akan otomatis mendeteksi ini adalah project React.
4. Klik **"Deploy"** — tunggu 1-2 menit.
5. Selesai! Anda akan mendapat URL seperti `https://catatan-keuangan-xxx.vercel.app`.

### Langkah 3 — Install sebagai Aplikasi (PWA)

**Di komputer (Chrome/Edge):**
1. Buka URL Vercel Anda di Chrome atau Edge.
2. Lihat ikon install (⊕) di address bar kanan atas.
3. Klik → **"Install"**.
4. Aplikasi akan muncul di Start Menu / Desktop seperti app biasa.

**Di HP Android (Chrome):**
1. Buka URL di Chrome.
2. Tap menu ⋮ → **"Add to Home screen"** atau **"Install app"**.

**Di iPhone (Safari):**
1. Buka URL di Safari.
2. Tap ikon Share → **"Add to Home Screen"**.

---

## Fitur
- Catat uang masuk dan keluar
- Split otomatis ke kantong tabungan sesuai persentase
- Kantong bisa ditambah/diedit/hapus bebas
- Data tersimpan permanen di perangkat (localStorage)
- Bisa dipakai offline setelah pertama kali dibuka
- Bisa diinstall di komputer dan HP

## Catatan Teknis
- Data tersimpan di `localStorage` browser — tidak akan hilang walau tab ditutup
- Tidak perlu server/database — semua berjalan di browser
- Untuk mengganti ikon app: ganti file `public/icon-192.png` dan `public/icon-512.png`

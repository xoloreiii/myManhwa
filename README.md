# 屋 myTsundoku

**myTsundoku** adalah web untuk mencatat dan melacak koleksi bacaan manhwa & manga pribadi — mulai dari yang sedang dibaca, sudah tamat, di-drop, sampai yang masih rencana dibaca ("tsundoku"). Dibangun dengan React + Vite + Tailwind CSS dan Supabase sebagai backend.

🔗 **Live demo:** [my-tsundoku.vercel.app](https://my-tsundoku.vercel.app/)

---

##  Fitur

- **Dashboard** — ringkasan statistik total judul, sedang dibaca, tamat, serta breakdown kategori (NL / BL / GL) untuk manhwa & manga, plus daftar "Recently Added".
- **Manajemen koleksi Manhwa & Manga** (tambah, edit, hapus) dengan detail: judul, chapter, poster, status baca, rating bintang, genre, dan kategori.
- **Pencarian, filter & sorting** — cari judul, filter berdasarkan genre/rating/status, A–Z / Z–A / terbaru.
- **Status baca**: `Ongoing`, `Completed`, `Dropped`, `Plan to Read`.
- **Sistem login dua peran**:
  - **Admin** — akses penuh untuk kelola koleksi.
  - **Guest** — mode lihat-lihat (browsing) tanpa bisa mengubah data.
- **Mature Content Gate** — konten kategori BL/dewasa akan diblur dan memerlukan kode akses untuk dibuka; bisa juga dilewati (skip) jika ingin tetap browsing dengan konten yang diblur.
- **Profil pengguna** dengan avatar.
- UI bertema gelap ungu yang custom, responsif, dan dibangun sepenuhnya dengan Tailwind CSS.

##  Tech Stack

| Layer      | Teknologi |
|------------|-----------|
| Frontend   | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) |
| Backend/DB | [Supabase](https://supabase.com/) (Postgres + Auth) |
| Notifikasi | [react-hot-toast](https://react-hot-toast.com/) |
| Deployment | [Vercel](https://vercel.com/) |

##  Menjalankan secara lokal

1. Clone repo ini
   ```bash
   git clone https://github.com/xoloreiii/myTsundoku.git
   cd myTsundoku
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Jalankan development server
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`.

4. Build untuk produksi
   ```bash
   npm run build
   npm run preview
   ```

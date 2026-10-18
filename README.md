# SIMATA - MI Bustanul Huda Dawuhan

**SIMATA** (Sistem Informasi Manajemen Arsip & Transmisi Berkas) adalah aplikasi web full-stack modern untuk publik dan internal madrasah guna mengunggah berkas foto & video yang langsung dialirkan (*streaming*) ke Google Drive milik akun Google/Gmail Admin atau Service Account, dilengkapi fitur **Dynamic Custom Fields / Form Builder**.

---

## 🚀 Fitur Unggulan

### 1. Koneksi Akun Google Email Admin (Google OAuth 2.0)
- **1-Klik Hubungkan Akun Google**: Admin cukup mengklik tombol *"Hubungkan Akun Google Saya"* di menu Pengaturan.
- **Penyimpanan Langsung ke Drive Admin**: Berkas foto dan video yang dikirim pengunjung publik otomatis tersimpan langsung di Google Drive akun Gmail/Google milik admin.
- **Profil Admin Otomatis**: Menampilkan foto profil Google, nama, dan alamat email admin di dashboard.
- **Opsi Putuskan / Ganti Akun**: Fleksibilitas untuk mengganti akun Google admin sewaktu-waktu.

### 2. Halaman Publik (Guest Access / Tanpa Login)
- **Desain Modern & Mobile-Friendly**: Antarmuka responsif dengan aksen warna Emerald khas madrasah yang elegan dan glassmorphism.
- **Pemilihan Kategori Interaktif**: Memilih kategori berkas (Dokumentasi Kegiatan, Tugas Siswa, Berkas Guru, dll.).
- **Dynamic Form Rendering**: Form isian secara dinamis berubah menyesuaikan konfigurasi kustom dari database admin.
- **Drag-and-Drop File Upload Zone**:
  - Mendukung foto (JPG, PNG, WEBP) dan video (MP4, MOV, MKV).
  - Validasi ukuran berkas dan format otomatis.
  - Pratinjau langsung (*thumbnail preview* untuk foto & video).
- **Progress Bar & Realtime Feedback**: Progress bar animasi saat pengunggahan dan notifikasi toast via Sonner/shadcn.
- **Tanda Terima Submisi (Receipt)**: Menampilkan ID pengiriman dan tautan langsung untuk melihat berkas di Google Drive.

### 3. Dashboard Admin & Dynamic Form Builder (shadcn/ui)
- **Ringkasan Statistik**: Total submisi masuk, total foto & video terunggah, kategori aktif, dan status koneksi Google Drive.
- **Manajemen Kategori (CRUD)**: Tambah, ubah, atau hapus kategori dengan batas maksimal ukuran file dan opsi folder Drive khusus.
- **Dynamic Form Builder per Kategori**:
  - Tipe field didukung: `TEXT`, `TEXTAREA`, `NUMBER`, `SELECT` / `DROPDOWN`, `CHECKBOX`, `DATE`.
  - Aturan validasi: Label, placeholder, deskripsi petunjuk, status `required` (wajib/opsional), dan opsi pilihan dinamis.
  - Pengurutan field (`orderIndex`) dengan tombol naik/turun yang interaktif.
  - **Live Preview Tab**: Admin dapat langsung melihat pratinjau formulir publik secara *real-time*.
- **Submisi & Berkas Explorer**:
  - Filter berdasarkan kategori & pencarian kata kunci.
  - Pratinjau seluruh jawaban isian kustom dan tautan berkas di Google Drive.
  - Opsi penghapusan submisi.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack) + TypeScript
- **Database & ORM**: PostgreSQL via [Supabase](https://supabase.com/) + [Prisma ORM](https://www.prisma.io/)
- **Styling & UI**: Tailwind CSS v3.4 + shadcn/ui + Radix UI + Lucide Icons + Sonner Toast
- **Storage & Auth**: Google Drive API (`googleapis`) via Google OAuth 2.0 (Akun Google Admin) & Service Account

---

## ⚙️ Cara Menghubungkan Akun Google Email Admin

1. Buka halaman pengaturan di: [http://localhost:3000/admin/settings](http://localhost:3000/admin/settings)
2. Klik tombol hijau **"Hubungkan Akun Google Saya"**.
3. Masuk dengan akun Google/Gmail madrasah yang ingin dijadikan tempat penyimpanan berkas.
4. Berikan izin akses Google Drive.
5. Akun Anda langsung terhubung! Seluruh berkas unggahan publik sekarang akan otomatis tersimpan di Google Drive akun tersebut.

> **Penting (Authorized Redirect URI):**  
> Pastikan di Google Cloud Console pada OAuth 2.0 Client ID Anda telah didaftarkan URI berikut:  
> `http://localhost:3000/api/auth/google/callback`

---

## 💻 Menjalankan Aplikasi

```bash
# Menjalankan server development
npm run dev

# Membangun versi produksi
npm run build

# Menjalankan versi produksi
npm start
```

Akses aplikasi di browser:
- **Halaman Formulir Publik**: [http://localhost:3000](http://localhost:3000)
- **Dashboard Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Kategori & Form Builder**: [http://localhost:3000/admin/categories](http://localhost:3000/admin/categories)
- **Koneksi Google Email Admin**: [http://localhost:3000/admin/settings](http://localhost:3000/admin/settings)
- **Submisi & Berkas Masuk**: [http://localhost:3000/admin/submissions](http://localhost:3000/admin/submissions)

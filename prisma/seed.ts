import { PrismaClient, FieldType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database for SIMATA MI Bustanul Huda Dawuhan...");

  // Upsert Category 1: Dokumentasi Kegiatan
  const cat1 = await prisma.category.upsert({
    where: { slug: "dokumentasi-kegiatan" },
    update: {},
    create: {
      name: "Dokumentasi Kegiatan Madrasah",
      slug: "dokumentasi-kegiatan",
      description: "Unggah foto & video kegiatan resmi madrasah, upacara, PHBI, lomba, dan ekstrakurikuler.",
      icon: "Camera",
      color: "emerald",
      allowedFileTypes: "image/*,video/*",
      maxFileSizeMb: 100,
      orderIndex: 1,
      fields: {
        create: [
          {
            label: "Nama Kegiatan",
            name: "nama_kegiatan",
            fieldType: FieldType.TEXT,
            placeholder: "Contoh: Peringatan Hari Santri Nasional 2026",
            isRequired: true,
            orderIndex: 1,
          },
          {
            label: "Kategori Acara",
            name: "kategori_acara",
            fieldType: FieldType.SELECT,
            placeholder: "Pilih kategori acara",
            isRequired: true,
            options: [
              "Peringatan Hari Besar Islam (PHBI)",
              "Upacara & Apel",
              "Ekstrakurikuler (Pramuka/Rebana/Olahraga)",
              "Lomba & Kejuaraan",
              "Kegiatan Belajar Luar Kelas (Outing Class)",
              "Lainnya",
            ],
            orderIndex: 2,
          },
          {
            label: "Tanggal Pelaksanaan",
            name: "tanggal_acara",
            fieldType: FieldType.DATE,
            placeholder: "Pilih tanggal",
            isRequired: true,
            orderIndex: 3,
          },
          {
            label: "Lokasi Kegiatan",
            name: "lokasi",
            fieldType: FieldType.TEXT,
            placeholder: "Contoh: Halaman Utama MI Bustanul Huda",
            isRequired: false,
            orderIndex: 4,
          },
          {
            label: "Deskripsi & Ringkasan Berita",
            name: "deskripsi",
            fieldType: FieldType.TEXTAREA,
            placeholder: "Jelaskan jalannya acara dan poin penting kegiatan...",
            isRequired: false,
            orderIndex: 5,
          },
          {
            label: "Izin Tayang di Media Sosial Resmi",
            name: "izin_publikasi",
            fieldType: FieldType.CHECKBOX,
            placeholder: "Ya, berkas ini boleh dipublikasikan di Instagram/Website madrasah",
            isRequired: false,
            orderIndex: 6,
          },
        ],
      },
    },
  });

  // Upsert Category 2: Tugas Siswa
  const cat2 = await prisma.category.upsert({
    where: { slug: "tugas-portofolio-siswa" },
    update: {},
    create: {
      name: "Tugas & Portofolio Siswa",
      slug: "tugas-portofolio-siswa",
      description: "Pengumpulan tugas video praktik hafalan surat, pidato bahasa Arab, eksperimen IPAS, dan karya seni.",
      icon: "GraduationCap",
      color: "blue",
      allowedFileTypes: "image/*,video/*",
      maxFileSizeMb: 100,
      orderIndex: 2,
      fields: {
        create: [
          {
            label: "Nama Lengkap Siswa",
            name: "nama_siswa",
            fieldType: FieldType.TEXT,
            placeholder: "Contoh: Muhammad Rayhan",
            isRequired: true,
            orderIndex: 1,
          },
          {
            label: "Kelas",
            name: "kelas",
            fieldType: FieldType.SELECT,
            placeholder: "Pilih kelas",
            isRequired: true,
            options: ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"],
            orderIndex: 2,
          },
          {
            label: "Mata Pelajaran",
            name: "mapel",
            fieldType: FieldType.SELECT,
            placeholder: "Pilih mata pelajaran",
            isRequired: true,
            options: [
              "Al-Qur'an Hadits",
              "Akidah Akhlak",
              "Fiqih",
              "Sejarah Kebudayaan Islam (SKI)",
              "Bahasa Arab",
              "Matematika",
              "IPAS",
              "Bahasa Indonesia",
              "Seni Budaya & Prakarya",
            ],
            orderIndex: 3,
          },
          {
            label: "Nomor Absen",
            name: "no_absen",
            fieldType: FieldType.NUMBER,
            placeholder: "Contoh: 18",
            isRequired: false,
            orderIndex: 4,
          },
          {
            label: "Keterangan Tugas",
            name: "keterangan_tugas",
            fieldType: FieldType.TEXTAREA,
            placeholder: "Contoh: Hafalan Surat An-Naba' ayat 1-15",
            isRequired: false,
            orderIndex: 5,
          },
        ],
      },
    },
  });

  // Upsert Category 3: Berkas Guru
  const cat3 = await prisma.category.upsert({
    where: { slug: "administrasi-guru" },
    update: {},
    create: {
      name: "Arsip Administrasi & Sertifikat Guru",
      slug: "administrasi-guru",
      description: "Upload bukti fisik PKG, sertifikat seminar/workshop/diklat, dan perangkat ajar guru.",
      icon: "Award",
      color: "amber",
      allowedFileTypes: "image/*,video/*",
      maxFileSizeMb: 100,
      orderIndex: 3,
      fields: {
        create: [
          {
            label: "Nama Guru / Tendik",
            name: "nama_guru",
            fieldType: FieldType.TEXT,
            placeholder: "Nama lengkap beserta gelar",
            isRequired: true,
            orderIndex: 1,
          },
          {
            label: "NIP / NUPTK / PegID",
            name: "identitas_guru",
            fieldType: FieldType.TEXT,
            placeholder: "Masukkan NUPTK atau NIP (jika ada)",
            isRequired: false,
            orderIndex: 2,
          },
          {
            label: "Jenis Dokumen",
            name: "jenis_dokumen",
            fieldType: FieldType.SELECT,
            placeholder: "Pilih jenis dokumen",
            isRequired: true,
            options: [
              "Sertifikat Diklat / Webinar Kemenag",
              "Piagam Penghargaan Pembimbing Lomba",
              "Modul Ajar / RPP Kurikulum Merdeka",
              "Dokumentasi Supervisi Pembelajaran",
              "Lainnya",
            ],
            orderIndex: 3,
          },
          {
            label: "Tahun Terbit / Pelaksanaan",
            name: "tahun",
            fieldType: FieldType.NUMBER,
            placeholder: "2026",
            isRequired: true,
            orderIndex: 4,
          },
        ],
      },
    },
  });

  console.log("Seeding finished successfully!");
  console.log("Categories created/updated:", [cat1.name, cat2.name, cat3.name]);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

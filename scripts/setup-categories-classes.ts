import { PrismaClient, FieldType } from "@prisma/client";

const prisma = new PrismaClient();

const DAFTAR_KELAS = [
  "Kelas 1 A",
  "Kelas 1 B",
  "Kelas 2 A",
  "Kelas 2 B",
  "Kelas 3 A",
  "Kelas 3 B",
  "Kelas 4 A",
  "Kelas 4 B",
  "Kelas 5 A",
  "Kelas 5 B",
  "Kelas 6 A",
  "Kelas 6 B",
];

async function main() {
  console.log("Setting up categories and classes for MI Bustanul Huda Dawuhan...");

  // 1. Kategori: Jurnal Syukur
  let catJurnal = await prisma.category.findFirst({
    where: { name: { contains: "Jurnal Syukur", mode: "insensitive" } },
  });

  if (!catJurnal) {
    catJurnal = await prisma.category.create({
      data: {
        name: "Jurnal Syukur",
        slug: "jurnal-syukur",
        description: "Pengumpulan dokumentasi lembar Jurnal Syukur siswa oleh Wali Kelas MI Bustanul Huda Dawuhan.",
        icon: "Award",
        color: "emerald",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*,application/pdf",
        orderIndex: 1,
      },
    });
  }

  // Bersihkan dan tambahkan field khusus pengisian Wali Kelas
  await prisma.customField.deleteMany({ where: { categoryId: catJurnal.id } });
  await prisma.customField.createMany({
    data: [
      {
        categoryId: catJurnal.id,
        label: "Pilihan Kelas",
        name: "kelas",
        fieldType: FieldType.SELECT,
        placeholder: "Pilih kelas binaan Anda",
        isRequired: true,
        options: DAFTAR_KELAS,
        orderIndex: 1,
      },
      {
        categoryId: catJurnal.id,
        label: "Pekan / Tanggal Pelaksanaan Jurnal",
        name: "tanggal_jurnal",
        fieldType: FieldType.DATE,
        placeholder: "Pilih tanggal pelaksanaan",
        isRequired: true,
        orderIndex: 2,
      },
      {
        categoryId: catJurnal.id,
        label: "Jumlah Siswa yang Mengumpulkan",
        name: "jumlah_siswa",
        fieldType: FieldType.NUMBER,
        placeholder: "Contoh: 28",
        isRequired: false,
        orderIndex: 3,
      },
      {
        categoryId: catJurnal.id,
        label: "Catatan Pelaksanaan dari Wali Kelas",
        name: "catatan_wali_kelas",
        fieldType: FieldType.TEXTAREA,
        placeholder: "Tuliskan catatan, tema syukur pekan ini, atau evaluasi pembiasaan karakter syukur siswa di kelas...",
        isRequired: false,
        orderIndex: 4,
      },
    ],
  });
  console.log("✓ Jurnal Syukur configured for Wali Kelas");

  // 2. Kategori: Pojok Syukur
  let catPojok = await prisma.category.findFirst({
    where: { name: { contains: "Pojok Syukur", mode: "insensitive" } },
  });

  if (!catPojok) {
    catPojok = await prisma.category.create({
      data: {
        name: "Pojok Syukur",
        slug: "pojok-syukur",
        description: "Dokumentasi kreasi sudut Pojok Syukur di tiap ruang kelas yang dilaporkan oleh Wali Kelas.",
        icon: "Sparkles",
        color: "teal",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*",
        orderIndex: 2,
      },
    });
  }

  await prisma.customField.deleteMany({ where: { categoryId: catPojok.id } });
  await prisma.customField.createMany({
    data: [
      {
        categoryId: catPojok.id,
        label: "Pilihan Kelas",
        name: "kelas",
        fieldType: FieldType.SELECT,
        placeholder: "Pilih kelas binaan Anda",
        isRequired: true,
        options: DAFTAR_KELAS,
        orderIndex: 1,
      },
      {
        categoryId: catPojok.id,
        label: "Tema / Konsep Pojok Syukur Kelas",
        name: "tema_karya",
        fieldType: FieldType.TEXT,
        placeholder: "Contoh: Pohon Rasa Syukur atas Nikmat Sahabat & Keluarga",
        isRequired: true,
        orderIndex: 2,
      },
      {
        categoryId: catPojok.id,
        label: "Tanggal Dokumentasi Sudut Kelas",
        name: "tanggal_dokumentasi",
        fieldType: FieldType.DATE,
        placeholder: "Pilih tanggal dokumentasi",
        isRequired: true,
        orderIndex: 3,
      },
      {
        categoryId: catPojok.id,
        label: "Catatan & Cerita Inspiratif dari Wali Kelas",
        name: "catatan_wali_kelas",
        fieldType: FieldType.TEXTAREA,
        placeholder: "Ceritakan antusiasme siswa saat menghias atau pesan kebaikan dari pojok syukur kelas ini...",
        isRequired: false,
        orderIndex: 4,
      },
    ],
  });
  console.log("✓ Pojok Syukur configured for Wali Kelas");

  // 3. Kategori: Tugas & Portofolio Siswa
  let catTugas = await prisma.category.findFirst({
    where: { name: { contains: "Tugas", mode: "insensitive" } },
  });

  if (!catTugas) {
    catTugas = await prisma.category.create({
      data: {
        name: "Tugas & Portofolio Siswa",
        slug: "tugas-portofolio-siswa",
        description: "Pengumpulan tugas video praktik hafalan surat, pidato bahasa Arab, eksperimen IPAS, dan karya siswa.",
        icon: "GraduationCap",
        color: "blue",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*,application/pdf",
        orderIndex: 3,
      },
    });
  }

  await prisma.customField.deleteMany({ where: { categoryId: catTugas.id } });
  await prisma.customField.createMany({
    data: [
      {
        categoryId: catTugas.id,
        label: "Pilihan Kelas",
        name: "kelas",
        fieldType: FieldType.SELECT,
        placeholder: "Pilih kelas",
        isRequired: true,
        options: DAFTAR_KELAS,
        orderIndex: 1,
      },
      {
        categoryId: catTugas.id,
        label: "Nama Lengkap Siswa",
        name: "nama_siswa",
        fieldType: FieldType.TEXT,
        placeholder: "Masukkan nama siswa",
        isRequired: true,
        orderIndex: 2,
      },
      {
        categoryId: catTugas.id,
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
        categoryId: catTugas.id,
        label: "Keterangan Tugas / Materi",
        name: "keterangan_tugas",
        fieldType: FieldType.TEXTAREA,
        placeholder: "Contoh: Video praktik hafalan Surat Al-Insyirah",
        isRequired: false,
        orderIndex: 4,
      },
    ],
  });
  console.log("✓ Tugas & Portofolio Siswa configured with class options");

  // 4. Kategori: Dokumentasi Kegiatan Madrasah
  let catDok = await prisma.category.findFirst({
    where: { name: { contains: "Dokumentasi", mode: "insensitive" } },
  });

  if (!catDok) {
    catDok = await prisma.category.create({
      data: {
        name: "Dokumentasi Kegiatan Madrasah",
        slug: "dokumentasi-kegiatan-madrasah",
        description: "Unggah foto & video kegiatan resmi madrasah, upacara, PHBI, lomba, dan ekstrakurikuler.",
        icon: "Camera",
        color: "emerald",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*",
        orderIndex: 4,
      },
    });
  }
  console.log("✓ All categories and classes configured successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

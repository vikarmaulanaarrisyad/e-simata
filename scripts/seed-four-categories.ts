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
  console.log("Setting up the 4 official categories in exact order for MI Bustanul Huda Dawuhan...");

  // Nonaktifkan atau atur urutan kategori lain jika ada
  await prisma.category.updateMany({
    data: {
      orderIndex: 99,
      isActive: false,
    },
  });

  // 1. Jurnal Syukur hari senin (orderIndex: 1)
  let cat1 = await prisma.category.findFirst({
    where: { name: { contains: "Jurnal Syukur", mode: "insensitive" } },
  });

  if (cat1) {
    cat1 = await prisma.category.update({
      where: { id: cat1.id },
      data: {
        name: "Jurnal Syukur hari senin",
        slug: "jurnal-syukur-hari-senin",
        description: "Pengumpulan dokumentasi lembar Jurnal Syukur siswa setiap hari Senin oleh Wali Kelas.",
        icon: "Award",
        color: "emerald",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*,application/pdf",
        orderIndex: 1,
        isActive: true,
      },
    });
  } else {
    cat1 = await prisma.category.create({
      data: {
        name: "Jurnal Syukur hari senin",
        slug: "jurnal-syukur-hari-senin",
        description: "Pengumpulan dokumentasi lembar Jurnal Syukur siswa setiap hari Senin oleh Wali Kelas.",
        icon: "Award",
        color: "emerald",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*,application/pdf",
        orderIndex: 1,
        isActive: true,
      },
    });
  }

  await prisma.customField.deleteMany({ where: { categoryId: cat1.id } });
  await prisma.customField.createMany({
    data: [
      {
        categoryId: cat1.id,
        label: "Pilihan Kelas",
        name: "kelas",
        fieldType: FieldType.SELECT,
        placeholder: "Pilih kelas binaan Anda",
        isRequired: true,
        options: DAFTAR_KELAS,
        orderIndex: 1,
      },
      {
        categoryId: cat1.id,
        label: "Pekan / Tanggal Pelaksanaan (Hari Senin)",
        name: "tanggal_pelaksanaan",
        fieldType: FieldType.DATE,
        placeholder: "Pilih tanggal hari Senin",
        isRequired: true,
        orderIndex: 2,
      },
      {
        categoryId: cat1.id,
        label: "Jumlah Siswa yang Mengumpulkan",
        name: "jumlah_siswa",
        fieldType: FieldType.NUMBER,
        placeholder: "Contoh: 28",
        isRequired: false,
        orderIndex: 3,
      },
      {
        categoryId: cat1.id,
        label: "Catatan Pelaksanaan dari Wali Kelas",
        name: "catatan_wali_kelas",
        fieldType: FieldType.TEXTAREA,
        placeholder: "Tuliskan catatan, tema syukur pekan ini, atau evaluasi pembiasaan karakter syukur siswa di kelas...",
        isRequired: false,
        orderIndex: 4,
      },
    ],
  });
  console.log("✓ 1. Jurnal Syukur hari senin (orderIndex: 1) ready");

  // 2. Pojok Syukur Selasa (orderIndex: 2)
  let cat2 = await prisma.category.findFirst({
    where: { name: { contains: "Pojok Syukur", mode: "insensitive" } },
  });

  if (cat2) {
    cat2 = await prisma.category.update({
      where: { id: cat2.id },
      data: {
        name: "Pojok Syukur Selasa",
        slug: "pojok-syukur-selasa",
        description: "Dokumentasi kreasi sudut dan pohon Pojok Syukur di tiap ruang kelas setiap hari Selasa oleh Wali Kelas.",
        icon: "Sparkles",
        color: "teal",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*",
        orderIndex: 2,
        isActive: true,
      },
    });
  } else {
    cat2 = await prisma.category.create({
      data: {
        name: "Pojok Syukur Selasa",
        slug: "pojok-syukur-selasa",
        description: "Dokumentasi kreasi sudut dan pohon Pojok Syukur di tiap ruang kelas setiap hari Selasa oleh Wali Kelas.",
        icon: "Sparkles",
        color: "teal",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*",
        orderIndex: 2,
        isActive: true,
      },
    });
  }

  await prisma.customField.deleteMany({ where: { categoryId: cat2.id } });
  await prisma.customField.createMany({
    data: [
      {
        categoryId: cat2.id,
        label: "Pilihan Kelas",
        name: "kelas",
        fieldType: FieldType.SELECT,
        placeholder: "Pilih kelas binaan Anda",
        isRequired: true,
        options: DAFTAR_KELAS,
        orderIndex: 1,
      },
      {
        categoryId: cat2.id,
        label: "Tema / Konsep Pojok Syukur Kelas",
        name: "tema_karya",
        fieldType: FieldType.TEXT,
        placeholder: "Contoh: Pohon Rasa Syukur atas Nikmat Sahabat & Keluarga",
        isRequired: true,
        orderIndex: 2,
      },
      {
        categoryId: cat2.id,
        label: "Tanggal Dokumentasi (Hari Selasa)",
        name: "tanggal_dokumentasi",
        fieldType: FieldType.DATE,
        placeholder: "Pilih tanggal dokumentasi",
        isRequired: true,
        orderIndex: 3,
      },
      {
        categoryId: cat2.id,
        label: "Catatan & Cerita Inspiratif dari Wali Kelas",
        name: "catatan_wali_kelas",
        fieldType: FieldType.TEXTAREA,
        placeholder: "Ceritakan antusiasme siswa saat menghias atau pesan kebaikan dari sudut pojok syukur kelas...",
        isRequired: false,
        orderIndex: 4,
      },
    ],
  });
  console.log("✓ 2. Pojok Syukur Selasa (orderIndex: 2) ready");

  // 3. Toples Syukur Madrasah (orderIndex: 3)
  let cat3 = await prisma.category.findFirst({
    where: { name: { contains: "Toples Syukur", mode: "insensitive" } },
  });

  if (cat3) {
    cat3 = await prisma.category.update({
      where: { id: cat3.id },
      data: {
        name: "Toples Syukur Madrasah",
        slug: "toples-syukur-madrasah",
        description: "Dokumentasi catatan gulungan rasa syukur siswa yang dihimpun di Toples Syukur kelas/madrasah.",
        icon: "FolderArchive",
        color: "amber",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*",
        orderIndex: 3,
        isActive: true,
      },
    });
  } else {
    cat3 = await prisma.category.create({
      data: {
        name: "Toples Syukur Madrasah",
        slug: "toples-syukur-madrasah",
        description: "Dokumentasi catatan gulungan rasa syukur siswa yang dihimpun di Toples Syukur kelas/madrasah.",
        icon: "FolderArchive",
        color: "amber",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*",
        orderIndex: 3,
        isActive: true,
      },
    });
  }

  await prisma.customField.deleteMany({ where: { categoryId: cat3.id } });
  await prisma.customField.createMany({
    data: [
      {
        categoryId: cat3.id,
        label: "Pilihan Kelas",
        name: "kelas",
        fieldType: FieldType.SELECT,
        placeholder: "Pilih kelas binaan Anda",
        isRequired: true,
        options: DAFTAR_KELAS,
        orderIndex: 1,
      },
      {
        categoryId: cat3.id,
        label: "Periode / Tanggal Kegiatan Toples Syukur",
        name: "tanggal_kegiatan",
        fieldType: FieldType.DATE,
        placeholder: "Pilih tanggal pelaksanaan",
        isRequired: true,
        orderIndex: 2,
      },
      {
        categoryId: cat3.id,
        label: "Jumlah Gulungan Catatan Terkumpul",
        name: "jumlah_gulungan",
        fieldType: FieldType.NUMBER,
        placeholder: "Contoh: 32 gulungan",
        isRequired: false,
        orderIndex: 3,
      },
      {
        categoryId: cat3.id,
        label: "Catatan Mutiara Syukur yang Menarik dari Siswa",
        name: "catatan_mutiara",
        fieldType: FieldType.TEXTAREA,
        placeholder: "Kutip salah satu tulisan rasa syukur siswa yang paling inspiratif atau menyentuh...",
        isRequired: false,
        orderIndex: 4,
      },
    ],
  });
  console.log("✓ 3. Toples Syukur Madrasah (orderIndex: 3) ready");

  // 4. Terima Kasih teman (orderIndex: 4)
  let cat4 = await prisma.category.findFirst({
    where: { name: { contains: "Terima Kasih", mode: "insensitive" } },
  });

  if (cat4) {
    cat4 = await prisma.category.update({
      where: { id: cat4.id },
      data: {
        name: "Terima Kasih teman",
        slug: "terima-kasih-teman",
        description: "Dokumentasi kartu ucapan, kartu apresiasi, dan momen ungkapan terima kasih antar siswa di kelas.",
        icon: "GraduationCap",
        color: "blue",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*",
        orderIndex: 4,
        isActive: true,
      },
    });
  } else {
    cat4 = await prisma.category.create({
      data: {
        name: "Terima Kasih teman",
        slug: "terima-kasih-teman",
        description: "Dokumentasi kartu ucapan, kartu apresiasi, dan momen ungkapan terima kasih antar siswa di kelas.",
        icon: "GraduationCap",
        color: "blue",
        maxFileSizeMb: 100,
        allowedFileTypes: "image/*,video/*",
        orderIndex: 4,
        isActive: true,
      },
    });
  }

  await prisma.customField.deleteMany({ where: { categoryId: cat4.id } });
  await prisma.customField.createMany({
    data: [
      {
        categoryId: cat4.id,
        label: "Pilihan Kelas",
        name: "kelas",
        fieldType: FieldType.SELECT,
        placeholder: "Pilih kelas binaan Anda",
        isRequired: true,
        options: DAFTAR_KELAS,
        orderIndex: 1,
      },
      {
        categoryId: cat4.id,
        label: "Momen / Bentuk Kegiatan Terima Kasih Teman",
        name: "momen_apresiasi",
        fieldType: FieldType.TEXT,
        placeholder: "Contoh: Tukar kartu ucapan terima kasih dan apresiasi sahabat",
        isRequired: true,
        orderIndex: 2,
      },
      {
        categoryId: cat4.id,
        label: "Tanggal Pelaksanaan Kegiatan",
        name: "tanggal_kegiatan",
        fieldType: FieldType.DATE,
        placeholder: "Pilih tanggal kegiatan",
        isRequired: true,
        orderIndex: 3,
      },
      {
        categoryId: cat4.id,
        label: "Catatan Wali Kelas Mengenai Kerukunan & Karakter Siswa",
        name: "catatan_wali_kelas",
        fieldType: FieldType.TEXTAREA,
        placeholder: "Ceritakan dampak positif kegiatan ini terhadap sikap saling menghargai antar siswa...",
        isRequired: false,
        orderIndex: 4,
      },
    ],
  });
  console.log("✓ 4. Terima Kasih teman (orderIndex: 4) ready");

  console.log("All 4 categories configured in exact requested order!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

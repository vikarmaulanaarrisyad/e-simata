import { generatePedagogicalNote } from "../src/lib/ai-generator";

const testCategories = [
  "Jurnal Syukur hari senin",
  "Pojok Syukur Selasa",
  "Toples Syukur Madrasah",
  "Terima Kasih teman",
  "Pembiasaan Sholat Dhuha Berjamaah",
  "Tahfidz dan Setoran Hafalan Al-Qur'an",
  "Infaq Jumat Berkah",
  "Operasi Semut & Peduli Lingkungan",
  "Upacara Bendera Hari Senin",
  "Proyek P5RA Kewirausahaan Cilik",
  "Pekan Robotik & Sains Madrasah (Kategori Baru)",
];

for (const cat of testCategories) {
  console.log(`\n========================================`);
  console.log(`📌 KATEGORI: ${cat}`);
  console.log(`========================================`);
  const v1 = generatePedagogicalNote({
    categoryName: cat,
    kelas: "Kelas 1 A",
    waliKelas: "Ustadzah Siti",
    seedIndex: 0,
  });
  console.log(`[Variasi 1]:\n${v1}`);

  const v2 = generatePedagogicalNote({
    categoryName: cat,
    kelas: "Kelas 4 B",
    waliKelas: "Ustadz Ahmad",
    seedIndex: 1,
  });
  console.log(`\n[Variasi 2]:\n${v2}`);
}

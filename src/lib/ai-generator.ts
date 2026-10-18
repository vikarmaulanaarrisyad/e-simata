/**
 * AI Pedagogical Generator for SIMATA (MI Bustanul Huda Dawuhan)
 * Generates structured, formal, 3-sentence teacher reports matching educational guidelines.
 *
 * Example target style:
 * "Peserta menuliskan hal yang disyukuri dan memasangnya pada pojok kelas.
 *  Guru memandu pembacaan beberapa catatan.
 *  Kegiatan ditutup dengan refleksi dan rencana merawat pojok kelas."
 */

export interface GenerateNotesParams {
  categoryName: string;
  fieldLabel?: string;
  fieldName?: string;
  kelas?: string;
  waliKelas?: string;
  tema?: string;
  seedIndex?: number;
}

const TEMPLATES: Record<string, string[]> = {
  // 1. Jurnal Syukur hari senin
  "jurnal syukur": [
    "Peserta didik {KELAS}menuliskan hal-hal yang disyukuri pada lembar jurnal syukur hari Senin. {GURU}memandu pembacaan beberapa lembar jurnal dan memberikan apresiasi atas ketulusan refleksi siswa. Kegiatan ditutup dengan doa bersama serta komitmen pembiasaan rasa syukur dalam kehidupan sehari-hari.",
    "Peserta didik {KELAS}mengisi lembar jurnal syukur pekanan dengan menceritakan nikmat dan pengalaman baik yang dialami. {GURU}memfasilitasi perwakilan siswa untuk menceritakan catatannya di hadapan teman sekelas. Kegiatan diakhiri dengan refleksi hikmah rasa syukur dan penguatan karakter positif siswa.",
    "Peserta didik {KELAS}secara antusias menuangkan ungkapan rasa syukur mereka ke dalam lembar jurnal kegiatan. {GURU}menyimak serta memberikan bimbingan reflektif terhadap catatan siswa. Kegiatan ditutup dengan motivasi untuk senantiasa bersyukur atas nikmat belajar dan keluarga.",
    "Siswa {KELAS}melaksanakan pengisian jurnal syukur pagi hari dengan tertib dan khidmat. {GURU}memandu diskusi kelas mengenai makna bersyukur dalam menghadapi tantangan belajar. Kegiatan ditutup dengan refleksi bersama dan komitmen menjaga semangat belajar sepekan ke depan.",
  ],

  // 2. Pojok Syukur Selasa
  "pojok syukur": [
    "Peserta {KELAS}menuliskan hal yang disyukuri dan memasangnya pada pojok kelas. {GURU}memandu pembacaan beberapa catatan. Kegiatan ditutup dengan refleksi dan rencana merawat pojok kelas.",
    "Peserta didik {KELAS}menempelkan kartu ungkapan syukur pada pohon pojok syukur kelas dengan penuh antusias. {GURU}mendampingi proses penataan dan mengulas beberapa pesan inspiratif siswa. Kegiatan diakhiri dengan kesepakatan bersama untuk menjaga dan memperindah sudut pojok syukur.",
    "Siswa {KELAS}berkreasi menuliskan nikmat sahabat dan sekolah lalu menata sudut pojok syukur kelas secara gotong royong. {GURU}memandu sesi apresiasi atas karya estetika dan pesan kebaikan yang dibuat siswa. Kegiatan ditutup dengan refleksi mengenai pentingnya menciptakan suasana kelas yang menyenangkan.",
    "Peserta didik {KELAS}memasang lembar syukur pada display dinding pojok kelas masing-masing. {GURU}membacakan kutipan-kutipan menyentuh karya siswa yang menumbuhkan rasa empati. Kegiatan ditutup dengan komitmen merawat karya pojok syukur sebagai pengingat harian.",
  ],

  // 3. Toples Syukur Madrasah
  "toples syukur": [
    "Peserta didik {KELAS}menuliskan rasa syukur pada secarik kertas lalu menggulung dan memasukkannya ke dalam toples syukur kelas. {GURU}mengambil dan membacakan secara acak beberapa gulungan pesan syukur siswa. Kegiatan ditutup dengan doa bersama serta refleksi atas keberkahan kebersamaan di madrasah.",
    "Siswa {KELAS}menghimpun catatan kebaikan dan nikmat yang diperoleh ke dalam toples syukur secara tertib. {GURU}memandu pembacaan beberapa mutiara syukur yang paling menginspirasi di depan kelas. Kegiatan diakhiri dengan penguatan karakter saling menghargai dan bersyukur dalam segala keadaan.",
    "Peserta didik {KELAS}antusias mengisi toples syukur dengan berbagai ungkapan terima kasih atas nikmat kesehatan dan ilmu. {GURU}mengajak siswa merefleksikan catatan-catatan positif yang telah terkumpul. Kegiatan ditutup dengan pesan motivasi untuk terus menebarkan kebaikan di lingkungan madrasah.",
    "Gulungan pesan syukur siswa {KELAS}berhasil dihimpun dalam toples syukur kelas dengan penuh antusiasme. {GURU}memimpin sesi pembacaan mutiara syukur pilihan yang menyentuh hati teman-teman sekelas. Kegiatan ditutup dengan doa penutup dan refleksi nilai budi pekerti luhur.",
  ],

  // 4. Terima Kasih teman
  "terima kasih": [
    "Peserta didik {KELAS}saling bertukar kartu apresiasi dan menyampaikan ungkapan terima kasih kepada teman sekelas. {GURU}memandu sesi saling mengapresiasi dan mempererat tali persahabatan antar siswa. Kegiatan ditutup dengan refleksi pentingnya saling memaafkan, menghargai, dan menjaga kerukunan kelas.",
    "Siswa {KELAS}menuliskan pesan kebaikan dan terima kasih atas bantuan teman selama kegiatan belajar. {GURU}memfasilitasi pembacaan beberapa kartu apresiasi terpilih dengan suasana hangat dan penuh keakraban. Kegiatan diakhiri dengan komitmen bersama untuk saling mendukung dan menjauhi perundungan.",
    "Peserta didik {KELAS}memberikan ucapan terima kasih secara tulus kepada sahabat sebangku dan kelompok belajarnya. {GURU}memberikan tanggapan positif atas tumbuhnya empati serta rasa persaudaraan di kelas. Kegiatan ditutup dengan pembiasaan budaya santun dan saling menghargai antarsesama.",
    "Seluruh siswa {KELAS}berpartisipasi aktif dalam sesi ungkapan rasa terima kasih antarteman sebaya. {GURU}mengajak siswa merefleksikan nilai tolong-menolong dalam persahabatan di madrasah. Kegiatan ditutup dengan saling berjabat tangan dan doa bersama untuk kekompakan kelas.",
  ],

  // Default / Universal
  default: [
    "Peserta didik {KELAS}melaksanakan kegiatan pembiasaan karakter dengan antusias dan tertib. {GURU}mendampingi proses kegiatan dan memberikan apresiasi atas partisipasi aktif seluruh siswa. Kegiatan ditutup dengan evaluasi dan refleksi positif untuk pembelajaran berikutnya.",
    "Seluruh siswa {KELAS}mengikuti rangkaian kegiatan dengan penuh semangat dan kedisiplinan. {GURU}memandu jalannya dokumentasi serta merefleksikan nilai-nilai kebaikan bersama para siswa. Kegiatan diakhiri dengan kesimpulan dan tindak lanjut pembiasaan positif di kelas.",
  ],
};

export function generatePedagogicalNote(params: GenerateNotesParams): string {
  const { categoryName, kelas, waliKelas, seedIndex } = params;

  // Determine category key
  const catLower = (categoryName || "").toLowerCase();
  let selectedCategoryList = TEMPLATES.default;

  if (catLower.includes("jurnal")) {
    selectedCategoryList = TEMPLATES["jurnal syukur"];
  } else if (catLower.includes("pojok")) {
    selectedCategoryList = TEMPLATES["pojok syukur"];
  } else if (catLower.includes("toples")) {
    selectedCategoryList = TEMPLATES["toples syukur"];
  } else if (catLower.includes("terima kasih") || catLower.includes("teman")) {
    selectedCategoryList = TEMPLATES["terima kasih"];
  }

  // Choose index
  const index =
    typeof seedIndex === "number"
      ? Math.abs(seedIndex) % selectedCategoryList.length
      : Math.floor(Math.random() * selectedCategoryList.length);

  let template = selectedCategoryList[index];

  // Insert class name if present
  const kelasStr = kelas ? `${kelas} ` : "";
  template = template.replaceAll("{KELAS}", kelasStr);

  // Insert teacher reference
  const guruStr = waliKelas && waliKelas.trim().length > 0 ? "Wali kelas " : "Guru ";
  template = template.replaceAll("{GURU}", guruStr);

  return template;
}

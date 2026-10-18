/**
 * AI Pedagogical Generator for SIMATA (MI Bustanul Huda)
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

// Koleksi template tematik kaya untuk ragam kategori madrasah
const TEMPLATES: Record<string, string[]> = {
  // 1. Jurnal Syukur (Senin)
  "jurnal syukur": [
    "Peserta didik {KELAS}menuliskan hal-hal yang disyukuri pada lembar jurnal syukur hari Senin. {GURU}memandu pembacaan beberapa lembar jurnal dan memberikan apresiasi atas ketulusan refleksi siswa. Kegiatan ditutup dengan doa bersama serta komitmen pembiasaan rasa syukur dalam kehidupan sehari-hari.",
    "Peserta didik {KELAS}mengisi lembar jurnal syukur pekanan dengan menceritakan nikmat dan pengalaman baik yang dialami. {GURU}memfasilitasi perwakilan siswa untuk menceritakan catatannya di hadapan teman sekelas. Kegiatan diakhiri dengan refleksi hikmah rasa syukur dan penguatan karakter positif siswa.",
    "Peserta didik {KELAS}secara antusias menuangkan ungkapan rasa syukur mereka ke dalam lembar jurnal kegiatan. {GURU}menyimak serta memberikan bimbingan reflektif terhadap catatan siswa. Kegiatan ditutup dengan motivasi untuk senantiasa bersyukur atas nikmat belajar dan keluarga.",
    "Siswa {KELAS}melaksanakan pengisian jurnal syukur pagi hari dengan tertib dan khidmat. {GURU}memandu diskusi kelas mengenai makna bersyukur dalam menghadapi tantangan belajar. Kegiatan ditutup dengan refleksi bersama dan komitmen menjaga semangat belajar sepekan ke depan.",
    "Peserta didik {KELAS}merefleksikan berbagai nikmat kesehatan dan persahabatan yang dirasakan melalui jurnal syukur. {GURU}mengulas beberapa tulisan inspiratif yang ditulis siswa dengan penuh ketulusan. Kegiatan diakhiri dengan ikrar bersama untuk menjadi pribadi yang rendah hati dan gemar berterima kasih.",
    "Siswa {KELAS}menuliskan poin-poin rasa syukur atas kesempatan menuntut ilmu di madrasah. {GURU}memberikan umpan balik positif serta mengapresiasi keterbukaan peserta didik dalam bercerita. Kegiatan ditutup dengan lantunan doa dan optimisme mengawali pekan pembelajaran.",
    "Peserta didik {KELAS}mengeksplorasi rasa terima kasih kepada orang tua dan guru dalam lembar jurnal syukur. {GURU}mengajak siswa memahami pentingnya berbakti dan menghargai jerih payah keluarga. Kegiatan ditutup dengan penyampaian komitmen belajar dengan sungguh-sungguh.",
    "Anak-anak {KELAS}mengikuti kegiatan penulisan jurnal syukur dengan suasana hening dan penuh konsentrasi. {GURU}mendampingi siswa yang membutuhkan arahan dalam merangkai kalimat refleksi. Kegiatan ditutup dengan rangkuman nilai-nilai syukur yang dapat diterapkan di rumah.",
  ],

  // 2. Pojok Syukur (Selasa)
  "pojok syukur": [
    "Peserta {KELAS}menuliskan hal yang disyukuri dan memasangnya pada pojok kelas. {GURU}memandu pembacaan beberapa catatan. Kegiatan ditutup dengan refleksi dan rencana merawat pojok kelas.",
    "Peserta didik {KELAS}menempelkan kartu ungkapan syukur pada pohon pojok syukur kelas dengan penuh antusias. {GURU}mendampingi proses penataan dan mengulas beberapa pesan inspiratif siswa. Kegiatan diakhiri dengan kesepakatan bersama untuk menjaga dan memperindah sudut pojok syukur.",
    "Siswa {KELAS}berkreasi menuliskan nikmat sahabat dan sekolah lalu menata sudut pojok syukur kelas secara gotong royong. {GURU}memandu sesi apresiasi atas karya estetika dan pesan kebaikan yang dibuat siswa. Kegiatan ditutup dengan refleksi mengenai pentingnya menciptakan suasana kelas yang menyenangkan.",
    "Peserta didik {KELAS}memasang lembar syukur pada display dinding pojok kelas masing-masing. {GURU}membacakan kutipan-kutipan menyentuh karya siswa yang menumbuhkan rasa empati. Kegiatan ditutup dengan komitmen merawat karya pojok syukur sebagai pengingat harian.",
    "Siswa {KELAS}menghias kartu syukur warna-warni dan menggantungkannya pada dahan pohon syukur di sudut kelas. {GURU}mengamati antusiasme siswa seraya memberikan motivasi tentang indahnya berbagi kebaikan. Kegiatan ditutup dengan doa bersama untuk ketentraman dan kerukunan seluruh warga kelas.",
    "Peserta didik {KELAS}bergiliran membacakan kartu syukur sebelum menempelkannya di papan apresiasi pojok kelas. {GURU}memberikan tanggapan yang menumbuhkan rasa percaya diri dan kehangatan antarsiswa. Kegiatan diakhiri dengan foto bersama di depan display pojok syukur yang telah tertata rapi.",
    "Siswa {KELAS}merapikan dan memperbarui catatan kebaikan yang terpasang pada sudut pojok syukur madrasah. {GURU}mengarahkan siswa untuk saling mengapresiasi pesan positif yang ditulis rekan sekelasnya. Kegiatan ditutup dengan evaluasi berkala dan pesan moral untuk senantiasa saling menguatkan.",
    "Peserta didik {KELAS}mengekspresikan rasa syukur atas lingkungan belajar yang bersih dan nyaman pada pojok kelas. {GURU}memimpin diskusi santai mengenai langkah nyata menjaga kenyamanan ruang belajar. Kegiatan ditutup dengan pembagian tugas piket merawat sudut pojok kelas.",
  ],

  // 3. Toples Syukur Madrasah (Rabu)
  "toples syukur": [
    "Peserta didik {KELAS}menuliskan rasa syukur pada secarik kertas lalu menggulung dan memasukkannya ke dalam toples syukur kelas. {GURU}mengambil dan membacakan secara acak beberapa gulungan pesan syukur siswa. Kegiatan ditutup dengan doa bersama serta refleksi atas keberkahan kebersamaan di madrasah.",
    "Siswa {KELAS}menghimpun catatan kebaikan dan nikmat yang diperoleh ke dalam toples syukur secara tertib. {GURU}memandu pembacaan beberapa mutiara syukur yang paling menginspirasi di depan kelas. Kegiatan diakhiri dengan penguatan karakter saling menghargai dan bersyukur dalam segala keadaan.",
    "Peserta didik {KELAS}antusias mengisi toples syukur dengan berbagai ungkapan terima kasih atas nikmat kesehatan dan ilmu. {GURU}mengajak siswa merefleksikan catatan-catatan positif yang telah terkumpul. Kegiatan ditutup dengan pesan motivasi untuk terus menebarkan kebaikan di lingkungan madrasah.",
    "Gulungan pesan syukur siswa {KELAS}berhasil dihimpun dalam toples syukur kelas dengan penuh antusiasme. {GURU}memimpin sesi pembacaan mutiara syukur pilihan yang menyentuh hati teman-teman sekelas. Kegiatan ditutup dengan doa penutup dan refleksi nilai budi pekerti luhur.",
    "Siswa {KELAS}memasukkan gulungan kertas bertuliskan doa dan rasa syukur ke dalam toples transparan kelas. {GURU}membacakan cuplikan pesan yang menunjukkan keikhlasan dan kepolosan hati para siswa. Kegiatan diakhiri dengan tepuk tangan apresiasi dan penegasan pentingnya berprasangka baik.",
    "Peserta didik {KELAS}mengumpulkan catatan kebaikan harian mereka untuk disimpan dalam toples syukur madrasah. {GURU}memantik diskusi bermakna mengenai bagaimana rasa syukur dapat mendatangkan ketenangan hati. Kegiatan ditutup dengan komitmen mengisi toples secara berkelanjutan setiap pekan.",
    "Siswa {KELAS}berbaris rapi memasukkan lintingan kertas syukur yang telah dihias pita ke dalam toples berkah. {GURU}memilih beberapa lembar secara acak dan mengulas nilai keteladanan di dalamnya. Kegiatan ditutup dengan sujud syukur dan doa bersama demi kemaslahatan madrasah.",
    "Peserta didik {KELAS}mengevaluasi kumpulan pesan dalam toples syukur yang telah terakumulasi selama kegiatan kelas. {GURU}merangkum pesan-pesan utama menjadi kesimpulan pembelajaran karakter yang berharga. Kegiatan diakhiri dengan motivasi untuk tetap istiqomah dalam bersyukur.",
  ],

  // 4. Terima Kasih Teman (Kamis / Jumat)
  "terima kasih": [
    "Peserta didik {KELAS}saling bertukar kartu apresiasi dan menyampaikan ungkapan terima kasih kepada teman sekelas. {GURU}memandu sesi saling mengapresiasi dan mempererat tali persahabatan antar siswa. Kegiatan ditutup dengan refleksi pentingnya saling memaafkan, menghargai, dan menjaga kerukunan kelas.",
    "Siswa {KELAS}menuliskan pesan kebaikan dan terima kasih atas bantuan teman selama kegiatan belajar. {GURU}memfasilitasi pembacaan beberapa kartu apresiasi terpilih dengan suasana hangat dan penuh keakraban. Kegiatan diakhiri dengan komitmen bersama untuk saling mendukung dan menjauhi perundungan.",
    "Peserta didik {KELAS}memberikan ucapan terima kasih secara tulus kepada sahabat sebangku dan kelompok belajarnya. {GURU}memberikan tanggapan positif atas tumbuhnya empati serta rasa persaudaraan di kelas. Kegiatan ditutup dengan pembiasaan budaya santun dan saling menghargai antarsesama.",
    "Seluruh siswa {KELAS}berpartisipasi aktif dalam sesi ungkapan rasa terima kasih antarteman sebaya. {GURU}mengajak siswa merefleksikan nilai tolong-menolong dalam persahabatan di madrasah. Kegiatan ditutup dengan saling berjabat tangan dan doa bersama untuk kekompakan kelas.",
    "Peserta didik {KELAS}menyerahkan origami pesan terima kasih kepada teman yang pernah membantunya saat kesulitan. {GURU}menyaksikan momen haru tersebut seraya menanamkan nilai adab persaudaraan dalam Islam. Kegiatan diakhiri dengan ikrar kelas damai, bebas perundungan, dan saling menyayangi.",
    "Siswa {KELAS}menyampaikan kata-kata penghargaan secara langsung di hadapan rekan-rekan kelompoknya. {GURU}memuji keberanian siswa dalam mengungkapkan rasa terima kasih dan apresiasi secara terbuka. Kegiatan ditutup dengan senyum kebersamaan dan yel-yel kekompakan kelas.",
    "Peserta didik {KELAS}mengisi lembar 'Terima Kasih Sahabat' yang memuat cerita inspiratif bantuan teman sekelas. {GURU}membacakan testimoni paling berkesan yang menginspirasi seluruh siswa di ruangan. Kegiatan diakhiri dengan komitmen untuk selalu siap membantu siapa saja yang membutuhkan.",
    "Siswa {KELAS}belajar mengenali jasa-jasa kecil teman sekelas yang sering luput dari perhatian. {GURU}memfasilitasi dialog hangat yang mencairkan suasana dan mempererat ukhuwah islamiyah. Kegiatan ditutup dengan doa agar persahabatan mereka membawa keberkahan dunia akhirat.",
  ],

  // 5. Pembiasaan Ibadah / Sholat Dhuha / Dzuhur Berjamaah
  ibadah: [
    "Peserta didik {KELAS}melaksanakan sholat berjamaah dengan tertib, khusyuk, dan merapikan shaf sholat. {GURU}mendampingi pelaksanaan ibadah serta memimpin dzikir dan doa sesudah sholat. Kegiatan ditutup dengan tausiyah singkat tentang keutamaan menjaga sholat tepat waktu.",
    "Siswa {KELAS}mengambil wudhu secara tertib dan bersiap mengikuti pembiasaan sholat Dhuha bersama di musholla. {GURU}memantau ketertiban wudhu dan memberikan bimbingan tata cara sholat yang sempurna. Kegiatan diakhiri dengan doa memohon ilmu yang berkah dan kelapangan rezeki.",
    "Peserta didik {KELAS}menjalankan sholat dzuhur berjamaah dengan penuh kedisiplinan dan kekhusyukan. {GURU}memberikan teladan langsung dalam mengimami dan meluruskan barisan makmum. Kegiatan ditutup dengan pembacaan asmaul husna dan nasihat kebaikan sehari-hari.",
    "Siswa {KELAS}antusias mengikuti pembiasaan sholat sunnah Dhuha sebagai ikhtiar spiritual mengawali hari belajar. {GURU}memotivasi siswa agar membiasakan ibadah sunnah secara istiqomah sejak usia dini. Kegiatan diakhiri dengan doa bersama untuk kedua orang tua dan bapak ibu guru.",
    "Peserta didik {KELAS}melatih kemandirian dan kesiapan ibadah dengan membawa perlengkapan sholat lengkap dan bersih. {GURU}mengapresiasi kesadaran beribadah siswa yang tumbuh secara alami tanpa paksaan. Kegiatan ditutup dengan muhasabah singkat mengenai pentingnya adab di dalam masjid.",
    "Siswa {KELAS}bergiliran mengumandangkan adzan dan iqamah sebelum memulai sholat berjamaah madrasah. {GURU}memberikan pembinaan teknik melafalkan adzan yang merdu dan fasih. Kegiatan diakhiri dengan doa kafaratul majlis dan saling bersalaman dengan tertib.",
  ],

  // 6. Tahfidz / Tadarus / Literasi Al-Qur'an & Iqro
  quran: [
    "Peserta didik {KELAS}melantunkan ayat suci Al-Qur'an dan menyetorkan hafalan surah pilihan dengan tartil. {GURU}menyimak bacaan, mengoreksi makhraj huruf, serta memberikan penilaian perkembangan tahfidz. Kegiatan ditutup dengan doa khotmil Qur'an dan motivasi untuk terus mencintai kitab suci.",
    "Siswa {KELAS}mengikuti kegiatan tadarus pagi bersama dengan penuh khidmat di ruang kelas. {GURU}membimbing tajwid dan menjelaskan intisari ayat yang dibaca agar mudah dipahami siswa. Kegiatan diakhiri dengan evaluasi capaian bacaan dan penguatan tekad menjaga hafalan.",
    "Peserta didik {KELAS}berlatih membaca Iqro dan tahsin Al-Qur'an secara bergantian dengan bimbingan metode interaktif. {GURU}memberikan pendampingan intensif bagi siswa yang membutuhkan penguatan pelafalan huruf hijaiyah. Kegiatan ditutup dengan murojaah hafalan surah-surah juz 30 secara serempak.",
    "Siswa {KELAS}menunjukkan peningkatan kelancaran dan kefasihan dalam setoran hafalan surah pendek harian. {GURU}memberikan bintang apresiasi atas dedikasi dan kesungguhan siswa dalam menghafal. Kegiatan diakhiri dengan doa bersama agar Al-Qur'an menjadi penerang hidup mereka.",
    "Peserta didik {KELAS}saling menyimak (tasmi') hafalan Al-Qur'an bersama teman sebangku dengan penuh tanggung jawab. {GURU}berkeliling memastikan setiap pasangan belajar menjalankan sesi murojaah dengan baik. Kegiatan ditutup dengan refleksi keutamaan para penghafal Al-Qur'an di sisi Allah SWT.",
    "Siswa {KELAS}mengikuti pembiasaan tilawah satu juz bersama dalam suasana madrasah yang tenang dan berkah. {GURU}memberikan wawasan mengenai kisah inspiratif yang terkandung dalam ayat yang dikaji. Kegiatan diakhiri dengan doa senandung Al-Qur'an dan sujud tilawah.",
  ],

  // 7. Infaq / Sedekah / Jumat Berkah / Berbagi
  infaq: [
    "Peserta didik {KELAS}menunaikan sedekah sukarela melalui kotak infaq madrasah dengan penuh keikhlasan. {GURU}mendampingi penghimpunan infaq dan menanamkan nilai kepedulian terhadap sesama yang membutuhkan. Kegiatan ditutup dengan doa keberkahan atas rezeki dan sedekah yang telah dikeluarkan.",
    "Siswa {KELAS}antusias menyisihkan sebagian uang saku dalam program Jumat Berkah berbagi kebaikan. {GURU}mengajak siswa memahami bahwa tangan di atas lebih mulia daripada tangan di bawah. Kegiatan diakhiri dengan pencatatan perolehan infaq kelas secara transparan dan doa bersama.",
    "Peserta didik {KELAS}menyerahkan paket santunan dan makanan berkah kepada warga sekitar madrasah. {GURU}membimbing interaksi santun dan rendah hati saat menyalurkan bantuan kepada penerima manfaat. Kegiatan ditutup dengan refleksi rasa syukur atas nikmat berkecukupan yang Allah anugerahkan.",
    "Siswa {KELAS}berpartisipasi dalam penggalangan dana sosial kemanusiaan dengan rasa empati yang tinggi. {GURU}mengapresiasi kepekaan sosial dan kedermawanan siswa yang terus terpupuk di madrasah. Kegiatan diakhiri dengan doa bagi saudara-saudara kita yang sedang diuji kesulitan.",
    "Peserta didik {KELAS}mengelola kotak infaq mandiri di kelas dengan bimbingan bendahara cilik. {GURU}memberikan edukasi tentang amanah pengelolaan dana umat sejak bangku madrasah ibtidaiyah. Kegiatan ditutup dengan evaluasi mingguan dan laporan infaq kepada wali murid.",
    "Siswa {KELAS}belajar makna sedekah tidak hanya berupa materi, melainkan juga senyuman dan bantuan tenaga. {GURU}memberikan contoh teladan perilaku dermawan dan tolong-menolong dalam keseharian. Kegiatan diakhiri dengan komitmen membiasakan sedekah subuh di rumah masing-masing.",
  ],

  // 8. Literasi / Pojok Baca / Membaca Buku
  literasi: [
    "Peserta didik {KELAS}membaca buku cerita inspiratif selama 15 menit pada program literasi pagi. {GURU}memandu jalannya membaca hening dan mendampingi siswa memahami alur pesan moral buku. Kegiatan ditutup dengan perwakilan siswa yang menceritakan kembali intisari buku di depan kelas.",
    "Siswa {KELAS}mengunjungi perpustakaan madrasah dan memilih bacaan bermutu sesuai minat masing-masing. {GURU}membantu pemilihan referensi yang edukatif serta memotivasi kecintaan pada dunia membaca. Kegiatan diakhiri dengan pencatatan lembar reviu buku pada jurnal literasi kelas.",
    "Peserta didik {KELAS}memanfaatkan pojok baca kelas dengan membaca buku bertema sains dan keteladanan rasul. {GURU}memantik diskusi interaktif tentang teladan tokoh yang ada dalam buku bacaan. Kegiatan ditutup dengan pesan motivasi bahwa membaca adalah jendela pembuka cakrawala dunia.",
    "Siswa {KELAS}mempresentasikan sinopsis dongeng nusantara yang telah mereka baca dengan percaya diri. {GURU}memberikan tanggapan membangun dan melatih keberanian berkomunikasi di depan umum. Kegiatan diakhiri dengan rekomendasi buku-buku baru untuk dibaca pada pekan selanjutnya.",
    "Peserta didik {KELAS}menuliskan kosa kata baru yang mereka temukan dari teks bacaan pada pohon kata kelas. {GURU}menjelaskan arti kata-kata tersebut dan membimbing penyusunan kalimat yang tepat. Kegiatan ditutup dengan permainan kuis literasi yang disambut gembira oleh seluruh siswa.",
    "Siswa {KELAS}berkolaborasi membuat resensi bergambar dari cerita fabel yang sarat dengan pesan budi pekerti. {GURU}memajang karya resensi siswa pada mading kelas untuk menginspirasi rekan lainnya. Kegiatan diakhiri dengan apresiasi atas kreativitas menulis dan menggambar peserta didik.",
  ],

  // 9. Kebersihan / Operasi Semut / Peduli Lingkungan / Ro'an
  kebersihan: [
    "Peserta didik {KELAS}melaksanakan operasi semut membersihkan ruang kelas dan halaman madrasah secara gotong royong. {GURU}turut mendampingi, mengarahkan pemilahan sampah, dan memotivasi budaya peduli lingkungan. Kegiatan ditutup dengan cuci tangan bersih bersama dan ruangan yang rapi serta nyaman.",
    "Siswa {KELAS}bergotong-royong merapikan meja belajar, menyapu lantai, dan membersihkan papan tulis kelas. {GURU}menanamkan nilai kebersihan sebagai sebagian dari iman dan kunci kenyamanan belajar. Kegiatan diakhiri dengan pemeriksaan kebersihan dan apresiasi regu piket teladan.",
    "Peserta didik {KELAS}melakukan kegiatan merawat tanaman dan menyiram kebun hijau madrasah dengan penuh kasih sayang. {GURU}mengajarkan pentingnya menjaga kelestarian alam ciptaan Allah SWT dalam kehidupan sehari-hari. Kegiatan ditutup dengan evaluasi penataan pot bunga dan komitmen merawatnya setiap pagi.",
    "Siswa {KELAS}mempraktikkan pemilahan sampah organik dan anorganik pada tempat sampah yang telah disediakan. {GURU}memberikan penjelasan praktis tentang bahaya limbah plastik dan pentingnya daur ulang. Kegiatan diakhiri dengan kesepakatan bersama untuk mengurangi sampah plastik sekali pakai di madrasah.",
    "Peserta didik {KELAS}membersihkan sudut-sudut ventilasi dan loker buku kelas agar terbebas dari debu. {GURU}memuji ketangkasan dan kekompakan kerja sama siswa yang tampak tanpa saling mengandalkan. Kegiatan ditutup dengan doa dan suasana kelas yang segar serta harum.",
    "Siswa {KELAS}mengikuti kegiatan kerja bakti massal madrasah (ro'an) menjelang penilaian kebersihan kelas. {GURU}membagi zona tugas secara proporsional dan membimbing keselamatan kerja siswa. Kegiatan diakhiri dengan menikmati hidangan bersama dalam suasana kekeluargaan yang erat.",
  ],

  // 10. Upacara Bendera / Apel Pagi / Kedisiplinan
  upacara: [
    "Peserta didik {KELAS}mengikuti jalannya upacara bendera hari Senin dengan khidmat, tertib, dan berbaris rapi. {GURU}bertindak sebagai pembina/pendamping upacara dan mengamati kedisiplinan barisan siswa. Kegiatan ditutup dengan pengumuman prestasi madrasah dan doa bersama untuk bangsa dan negara.",
    "Siswa {KELAS}melaksanakan tugas sebagai petugas upacara bendera dengan penuh dedikasi dan percaya diri. {GURU}memberikan evaluasi positif serta apresiasi atas kelancaran tugas pengibaran bendera merah putih. Kegiatan diakhiri dengan penguatan amanat upacara mengenai disiplin dan cinta tanah air.",
    "Peserta didik {KELAS}mengikuti apel pagi madrasah dengan menyanyikan lagu Indonesia Raya dan Mars Madrasah secara serempak. {GURU}memeriksa kerapian seragam, atribut, dan kelengkapan belajar seluruh siswa. Kegiatan ditutup dengan ikrar santri dan baris masuk kelas secara tertib.",
    "Siswa {KELAS}menunjukkan sikap sempurna saat penghormatan bendera dan mengheningkan cipta untuk pahlawan bangsa. {GURU}menanamkan nilai-nilai patriotisme, pantang menyerah, dan integritas seorang pelajar muslim. Kegiatan diakhiri dengan pembiasaan salam santun kepada seluruh dewan guru.",
    "Peserta didik {KELAS}berlatih baris-berbaris (PBB) dasar untuk melatih konsentrasi, kekompakan, dan ketangkasan fisik. {GURU}memberikan komando instruksi dengan tegas namun tetap ramah dan menyenangkan. Kegiatan ditutup dengan yel-yel penyemangat dan pendinginan fisik.",
    "Siswa {KELAS}mendengarkan amanat pembina upacara tentang etika berteman dan adab menghormati guru. {GURU}mencatat poin penting amanat untuk direfleksikan kembali di dalam ruangan kelas. Kegiatan diakhiri dengan penyerahan piala bergilir kelas terbersih dan terdisiplin pekan ini.",
  ],

  // 11. Olahraga / Senam / Pramuka / Ekskul
  ekskul: [
    "Peserta didik {KELAS}mengikuti kegiatan senam sehat ceria madrasah dengan gerakan yang serentak dan penuh semangat. {GURU}memimpin pemanasan dan mendampingi irama gerak kebugaran jasmani seluruh siswa. Kegiatan ditutup dengan pendinginan, minum air putih bersama, dan sarapan bergizi.",
    "Siswa {KELAS}antusias mengikuti latihan kepramukaan gugus depan dengan materi sandi, simpul, dan dasa darma. {GURU}selaku pembina pramuka mengawasi keaktifan regu dan melatih kemandirian peserta didik. Kegiatan diakhiri dengan upacara penutupan latihan dan refleksi jiwa ksatria pramuka.",
    "Peserta didik {KELAS}mempraktikkan keterampilan olahraga atletik dan permainan bola dengan menjunjung sportivitas. {GURU}mengajarkan teknik dasar yang benar serta pentingnya menghormati keputusan wasit dan lawan. Kegiatan ditutup dengan evaluasi ketangkasan fisik dan pembiasaan hidup sehat.",
    "Siswa {KELAS}berpartisipasi aktif dalam kegiatan ekstrakurikuler seni rebana dan qasidah madrasah. {GURU}membimbing keselarasan pukulan terbang dan lantunan syair shalawat nabi. Kegiatan diakhiri dengan penampilan mini di hadapan teman-teman yang disambut tepuk tangan meriah.",
    "Peserta didik {KELAS}mengasah kemampuan public speaking dan pidato da'i cilik dalam ekstrakurikuler keagamaan. {GURU}memberikan masukan mengenai intonasi vokal, gestur tubuh, dan penguasaan panggung. Kegiatan ditutup dengan doa agar ilmu yang disampaikan membawa hidayah bagi pendengarnya.",
    "Siswa {KELAS}menunjukkan kerja sama yang luar biasa dalam permainan outbond edukatif yang mengasah kekompakan. {GURU}mengamati dinamika kepemimpinan alami yang muncul pada diri masing-masing anak. Kegiatan diakhiri dengan refleksi tentang arti penting saling percaya dalam satu tim.",
  ],

  // 12. Proyek P5RA / Prakarya / Kreasi Seni
  proyek: [
    "Peserta didik {KELAS}berkreasi menghasilkan karya inovatif dalam kegiatan Proyek Penguatan Profil Pelajar Rahmatan Lil Alamin (P5RA). {GURU}memfasilitasi penyediaan alat bahan dan memandu tahapan eksplorasi ide kreatif siswa. Kegiatan ditutup dengan gelar karya mini di mana setiap kelompok memamerkan hasil buatannya.",
    "Siswa {KELAS}berkolaborasi membuat kerajinan tangan bernilai guna dari bahan daur ulang ramah lingkungan. {GURU}mendampingi ketelitian teknik pembuatan seraya menanamkan nilai wirausaha cilik dan kemandirian. Kegiatan diakhiri dengan evaluasi estetika karya dan saling memberikan apresiasi antarkelompok.",
    "Peserta didik {KELAS}melakukan eksperimen sains sederhana untuk membuktikan hukum alam dengan rasa ingin tahu tinggi. {GURU}mengawasi aspek keamanan percobaan dan mengarahkan penalaran kritis terhadap fenomena yang terjadi. Kegiatan ditutup dengan penulisan laporan pengamatan dan kesimpulan ilmiah yang jelas.",
    "Siswa {KELAS}menggambar dan mewarnai kaligrafi arab dengan ketekunan, kerapian, dan perpaduan warna yang memukau. {GURU}mengulas keindahan seni khat islam serta membimbing teknik gradasi warna yang halus. Kegiatan diakhiri dengan pemajangan karya terbaik pada dinding apresiasi seni madrasah.",
    "Peserta didik {KELAS}menampilkan drama musikal bertema kepahlawanan islam yang sarat pesan moral dan keteladanan. {GURU}memberikan bimbingan penghayatan peran serta ekspresi panggung yang komunikatif. Kegiatan ditutup dengan sambutan hangat dan tepuk tangan meriah dari seluruh hadirin.",
    "Siswa {KELAS}merancang miniatur tata surya menggunakan bahan lempung plastisin berwarna-warni secara berkelompok. {GURU}membimbing pemahaman konsep rotasi dan revolusi planet dengan alat peraga yang dibuat siswa. Kegiatan diakhiri dengan kuis interaktif mengenai kebesaran ciptaan Allah di alam semesta.",
  ],

  // 13. Peringatan Hari Besar Islam (PHBI) / Hari Santri
  phbi: [
    "Peserta didik {KELAS}memperingati hari besar Islam dengan melantunkan shalawat nabi dan mendengarkan kisah keteladanan rasulullah. {GURU}memberikan tausiyah interaktif yang membumikan akhlak mulia dalam pergaulan sehari-hari. Kegiatan ditutup dengan doa keselamatan umat dan pembagian bingkisan berkah.",
    "Siswa {KELAS}mengenakan busana muslim rapi dan mengikuti pawai ta'aruf Hari Santri Nasional dengan riang gembira. {GURU}mengawal barisan siswa serta menyemarakkan yel-yel santri berjiwa patriotik dan berakhlak mulia. Kegiatan diakhiri dengan tasyakuran tumpeng bersama dalam suasana penuh kekhidmatan.",
    "Peserta didik {KELAS}berpartisipasi dalam aneka lomba keagamaan seperti hafalan doa, adzan, dan cerdas cermat islam. {GURU}bertindak sebagai dewan juri yang adil serta memberikan motivasi bertanding secara sportif. Kegiatan ditutup dengan pengumuman pemenang dan penyerahan sertifikat penghargaan.",
    "Siswa {KELAS}mengikuti pengajian akbar madrasah dalam rangka menyambut bulan suci Ramadhan dengan antusias. {GURU}mengajak para siswa membuat target ibadah dan amalan kebaikan selama satu bulan penuh. Kegiatan diakhiri dengan saling memaafkan antarseluruh warga madrasah.",
    "Peserta didik {KELAS}menyimak kisah perjuangan para ulama dan pahlawan kemerdekaan dalam menegakkan dakwah islam di tanah air. {GURU}menggarisbawahi pentingnya melanjutkan tongkat estafet perjuangan lewat giat belajar. Kegiatan ditutup dengan doa ziarah makam pendiri madrasah dan refleksi perjuangan santri.",
    "Siswa {KELAS}belajar mempraktikkan tata cara manasik haji cilik dengan mengenakan kain ihram putih yang suci. {GURU}membimbing setiap tahapan rukun haji mulai dari thawaf, sa'i, hingga wukuf secara visual. Kegiatan diakhiri dengan lantunan kalimat talbiyah yang menggetarkan hati seluruh hadirin.",
  ],

  // 14. Parenting / Rapat Paguyuban / Komunikasi Wali Murid
  parenting: [
    "Wali murid dan guru {KELAS}melaksanakan pertemuan paguyuban kelas untuk membahas kemajuan belajar dan pembiasaan karakter anak. {GURU}memaparkan program kerja kelas serta menyerap aspirasi positif dari orang tua siswa. Kegiatan ditutup dengan komitmen bersama untuk saling bersinergi demi keberhasilan pendidikan putra-putri.",
    "Pertemuan parenting madrasah berlangsung hangat dengan fokus penguatan peran orang tua di era digital saat ini. {GURU}dan narasumber berdialog interaktif membahas solusi tantangan pengasuhan anak usia sekolah dasar. Kegiatan diakhiri dengan kesepakatan pola pendampingan belajar di rumah yang konsisten dan ramah anak.",
    "Bapak dan Ibu wali murid {KELAS}menghadiri sosialisasi kegiatan akhir semester dan pelaporan capaian portofolio siswa. {GURU}menjelaskan secara transparan perkembangan akademik dan budi pekerti masing-masing anak. Kegiatan ditutup dengan apresiasi atas dukungan penuh orang tua terhadap kemajuan madrasah.",
    "Pengurus paguyuban kelas {KELAS}bermusyawarah mengenai renovasi pojok kelas dan pemenuhan sarana belajar anak. {GURU}mengapresiasi semangat gotong royong dan kepedulian tinggi dari para wali murid. Kegiatan diakhiri dengan doa bersama dan jadwal kerja bakti mandiri orang tua di akhir pekan.",
  ],

  // 15. Default Universal (Fallback cerdas untuk kategori baru apa pun)
  default: [
    "Peserta didik {KELAS}melaksanakan kegiatan {KEGIATAN}dengan antusias, tertib, dan penuh kedisiplinan. {GURU}mendampingi jalannya proses kegiatan seraya memberikan arahan serta apresiasi atas partisipasi aktif seluruh siswa. Kegiatan ditutup dengan evaluasi positif dan komitmen pembiasaan karakter baik di lingkungan madrasah.",
    "Seluruh siswa {KELAS}mengikuti rangkaian kegiatan {KEGIATAN}dengan semangat belajar yang tinggi dan suasana yang menyenangkan. {GURU}memandu jalannya dokumentasi dan memfasilitasi refleksi bersama atas pembelajaran yang diperoleh. Kegiatan diakhiri dengan kesimpulan bermakna dan doa bersama demi keberkahan ilmu.",
    "Peserta didik {KELAS}menunjukkan kerja sama dan keterlibatan aktif yang luar biasa selama pelaksanaan {KEGIATAN}. {GURU}mengamati dinamika kelompok dan memberikan motivasi penguatan budi pekerti luhur. Kegiatan ditutup dengan apresiasi bersama dan komitmen menjaga kekompakan kelas.",
    "Siswa {KELAS}mengikuti tahapan kegiatan {KEGIATAN}secara runut sesuai dengan panduan pembelajaran madrasah. {GURU}memberikan bimbingan edukatif yang memicu rasa ingin tahu dan kreativitas peserta didik. Kegiatan diakhiri dengan refleksi hikmah kegiatan dan salam penutup yang hangat.",
    "Peserta didik {KELAS}berpartisipasi dengan penuh tanggung jawab dan sukacita dalam agenda {KEGIATAN}. {GURU}memberikan umpan balik yang membangun untuk meningkatkan rasa percaya diri anak-anak. Kegiatan ditutup dengan penegasan nilai-nilai akhlakul karimah yang relevan dalam keseharian.",
    "Suasana kelas tampak hidup dan kondusif saat siswa {KELAS}menjalankan kegiatan {KEGIATAN}. {GURU}mendokumentasikan setiap momen penting dan memuji ketertiban siswa selama kegiatan berlangsung. Kegiatan diakhiri dengan doa bersama dan tekad untuk terus berprestasi membanggakan orang tua dan madrasah.",
  ],
};

/**
 * Deteksi cerdas kategori berdasarkan nama kategori, label field, atau tema
 */
function resolveCategoryKey(categoryName: string, fieldLabel = ""): string {
  const text = `${categoryName} ${fieldLabel}`.toLowerCase();

  if (text.includes("jurnal")) return "jurnal syukur";
  if (text.includes("pojok") || text.includes("display") || text.includes("sudut")) return "pojok syukur";
  if (text.includes("toples") || text.includes("tabung") || text.includes("celengan")) return "toples syukur";
  if (text.includes("terima kasih") || text.includes("apresiasi") || text.includes("sahabat") || text.includes("teman")) return "terima kasih";
  if (text.includes("sholat") || text.includes("dhuha") || text.includes("dzuhur") || text.includes("ibadah") || text.includes("wudhu") || text.includes("adzan")) return "ibadah";
  if (text.includes("quran") || text.includes("qur'an") || text.includes("tahfidz") || text.includes("tadarus") || text.includes("iqro") || text.includes("tilawah") || text.includes("hafalan") || text.includes("makhraj")) return "quran";
  if (text.includes("infaq") || text.includes("infak") || text.includes("sedekah") || text.includes("jumat berkah") || text.includes("berbagi") || text.includes("donasi") || text.includes("santunan")) return "infaq";
  if (text.includes("literasi") || text.includes("buku") || text.includes("baca") || text.includes("perpustakaan") || text.includes("resensi") || text.includes("cerita")) return "literasi";
  if (text.includes("bersih") || text.includes("semut") || text.includes("lingkungan") || text.includes("sampah") || text.includes("roan") || text.includes("ro'an") || text.includes("piket") || text.includes("kebersihan")) return "kebersihan";
  if (text.includes("upacara") || text.includes("apel") || text.includes("bendera") || text.includes("pbb") || text.includes("disiplin") || text.includes("baris")) return "upacara";
  if (text.includes("pramuka") || text.includes("senam") || text.includes("olahraga") || text.includes("ekskul") || text.includes("ekstrakurikuler") || text.includes("sehat") || text.includes("rebana")) return "ekskul";
  if (text.includes("proyek") || text.includes("p5") || text.includes("p5ra") || text.includes("karya") || text.includes("prakarya") || text.includes("kreasi") || text.includes("sains") || text.includes("gambar")) return "proyek";
  if (text.includes("phbi") || text.includes("santri") || text.includes("maulid") || text.includes("ramadhan") || text.includes("hijriah") || text.includes("peringatan") || text.includes("isra") || text.includes("manasik")) return "phbi";
  if (text.includes("parenting") || text.includes("paguyuban") || text.includes("wali murid") || text.includes("rapat") || text.includes("orang tua") || text.includes("komite")) return "parenting";

  return "default";
}

/**
 * Generate Catatan Pedagogis Berkualitas Tinggi
 */
export function generatePedagogicalNote(params: GenerateNotesParams): string {
  const { categoryName, fieldLabel, kelas, waliKelas, tema, seedIndex } = params;

  const key = resolveCategoryKey(categoryName || "", fieldLabel || "");
  const templateList = TEMPLATES[key] || TEMPLATES.default;

  // Pilih index secara terdistribusi berdasarkan seedIndex atau random
  const index =
    typeof seedIndex === "number"
      ? Math.abs(seedIndex) % templateList.length
      : Math.floor(Math.random() * templateList.length);

  let template = templateList[index];

  // 1. Format Nama Kelas
  const kelasStr = kelas && kelas.trim().length > 0 ? `${kelas.trim()} ` : "";
  template = template.replaceAll("{KELAS}", kelasStr);

  // 2. Format Panggilan Guru
  let guruStr = "Guru ";
  if (waliKelas && waliKelas.trim().length > 0) {
    guruStr = `Wali kelas (${waliKelas.trim()}) `;
  } else {
    guruStr = "Wali kelas ";
  }
  template = template.replaceAll("{GURU}", guruStr);

  // 3. Format Nama Kegiatan
  const kegiatanName =
    categoryName && categoryName.trim().length > 0 ? categoryName.trim() : "pembiasaan karakter";
  template = template.replaceAll("{KEGIATAN}", `${kegiatanName} `);

  // 4. Sisipkan tema jika relevan dan belum tercakup
  if (tema && tema.trim().length > 0 && !template.toLowerCase().includes(tema.toLowerCase())) {
    template = template.replace(
      "kegiatan",
      `kegiatan dengan tema "${tema.trim()}"`
    );
  }

  return template;
}

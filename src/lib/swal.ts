import Swal from "sweetalert2";

/**
 * Custom SweetAlert2 theme matching SIMATA MI Bustanul Huda Dawuhan design system
 */

const customClass = {
  popup: "rounded-2xl sm:rounded-3xl p-4 sm:p-7 max-w-[92vw] sm:max-w-md shadow-2xl border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
  title: "text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight",
  htmlContainer: "text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5",
  confirmButton: "w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95 cursor-pointer",
  cancelButton: "w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-all cursor-pointer",
  denyButton: "w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer",
};

/**
 * Show a sleek Swal Success modal
 */
export function showSwalSuccess(options: {
  title?: string;
  message?: string;
  folderName?: string;
  folderUrl?: string;
  filesCount?: number;
  onUploadAgain?: () => void;
}) {
  const {
    title = "Alhamdulillah! Berkas Berhasil Diunggah",
    message = "Dokumentasi Anda telah tersusun rapi di Google Drive madrasah.",
    folderName,
    folderUrl,
    filesCount = 1,
    onUploadAgain,
  } = options;

  let htmlContent = `
    <div class="space-y-4 my-2 text-left">
      <p class="text-sm text-center text-slate-600 dark:text-slate-300 leading-relaxed">
        ${message}
      </p>

      ${
        folderName
          ? `
        <div class="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
          <div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            <span>📁 Folder Google Drive Tujuan</span>
          </div>
          <p class="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-1 break-all">
            ${folderName}
          </p>
          <p class="text-[11px] text-muted-foreground mt-0.5">
            ${filesCount} berkas tersimpan rapi dan terorganisir per rombel.
          </p>
        </div>
      `
          : ""
      }
    </div>
  `;

  return Swal.fire({
    icon: "success",
    title,
    html: htmlContent,
    showConfirmButton: Boolean(folderUrl),
    confirmButtonText: "📂 Buka Folder di Drive",
    showCancelButton: true,
    cancelButtonText: "🔄 Unggah Berkas Baru",
    customClass: {
      ...customClass,
      actions: "flex flex-col sm:flex-row gap-2.5 mt-4 w-full justify-center",
    },
    buttonsStyling: false,
    backdrop: `rgba(15, 23, 42, 0.65)`,
  }).then((result) => {
    if (result.isConfirmed && folderUrl) {
      window.open(folderUrl, "_blank", "noopener,noreferrer");
    } else if (result.dismiss === Swal.DismissReason.cancel && onUploadAgain) {
      onUploadAgain();
    }
  });
}

/**
 * Show a sleek Swal Warning modal
 */
export function showSwalWarning(title: string, message: string) {
  return Swal.fire({
    icon: "warning",
    title,
    text: message,
    confirmButtonText: "Saya Mengerti",
    customClass,
    buttonsStyling: false,
    backdrop: `rgba(15, 23, 42, 0.65)`,
  });
}

/**
 * Show a sleek Swal Error modal
 */
export function showSwalError(title: string, message: string) {
  return Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonText: "Tutup",
    customClass,
    buttonsStyling: false,
    backdrop: `rgba(15, 23, 42, 0.65)`,
  });
}

/**
 * Show a sleek Swal Loading modal with simulated steps
 */
export function showSwalLoading(options?: {
  title?: string;
  stepText?: string;
  progressPercent?: number;
}) {
  const title = options?.title || "Mengunggah Berkas ke Google Drive...";
  const stepText = options?.stepText || "Sedang menyiapkan berkas dan koneksi cloud...";
  const progress = options?.progressPercent || 30;

  Swal.fire({
    title,
    html: `
      <div class="space-y-4 py-2">
        <div class="flex items-center justify-center py-2">
          <div class="relative h-16 w-16">
            <div class="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-950/60"></div>
            <div class="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
            <div class="absolute inset-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <span class="text-xl">☁️</span>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <p id="swal-step-text" class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            ${stepText}
          </p>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div id="swal-progress-bar" class="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
          </div>
          <p class="text-[11px] text-muted-foreground">
            Mohon jangan menutup halaman ini hingga proses unggah selesai.
          </p>
        </div>
      </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      ...customClass,
      popup: customClass.popup + " text-center",
    },
    buttonsStyling: false,
    backdrop: `rgba(15, 23, 42, 0.75)`,
  });
}

/**
 * Update step text and progress on active Swal Loading
 */
export function updateSwalLoading(stepText: string, progressPercent: number) {
  const stepElem = document.getElementById("swal-step-text");
  const barElem = document.getElementById("swal-progress-bar");

  if (stepElem) stepElem.textContent = stepText;
  if (barElem) barElem.style.width = `${progressPercent}%`;
}

/**
 * Close Swal
 */
export function closeSwal() {
  Swal.close();
}

/**
 * Confirmation dialog (mendukung icon warning & tombol merah bahaya)
 */
export function showSwalConfirm(
  title: string,
  message: string,
  confirmText: string = "Ya, Lanjutkan",
  isDanger: boolean = false
): Promise<boolean> {
  return Swal.fire({
    icon: isDanger ? "warning" : "question",
    title,
    html: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Batal",
    customClass: {
      ...customClass,
      confirmButton: isDanger
        ? "px-6 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
        : customClass.confirmButton,
      actions: "flex flex-col sm:flex-row gap-2.5 mt-4 w-full justify-center",
    },
    buttonsStyling: false,
    backdrop: `rgba(15, 23, 42, 0.70)`,
  }).then((res) => res.isConfirmed);
}

/**
 * Tampilkan SweetAlert Success ringkas dan elegan (untuk aksi hapus, edit, dan update)
 */
export function showSwalSuccessAlert(title: string, message: string) {
  return Swal.fire({
    icon: "success",
    title,
    html: `<p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${message}</p>`,
    confirmButtonText: "Alhamdulillah, Siap",
    customClass: {
      ...customClass,
      confirmButton: "px-6 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer",
    },
    buttonsStyling: false,
    backdrop: `rgba(15, 23, 42, 0.65)`,
  });
}


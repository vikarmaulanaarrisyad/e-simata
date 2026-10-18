/**
 * Utility kompresi gambar otomatis di sisi klien (Browser Canvas)
 * Mengoptimalkan foto beresolusi tinggi dari kamera HP (4-12 MB)
 * menjadi ukuran yang sangat ringan (~300-700 KB) dengan teks dokumen tetap tajam & jernih.
 *
 * Mencegah kegagalan "Payload Too Large" (limit 4.5MB Vercel) dan "Koneksi Terputus"
 * pada jaringan HP / kuota seluler.
 */

export interface CompressionOptions {
  maxDimension?: number; // Lebar/tinggi maksimal (default: 1920px - standar Full HD)
  quality?: number; // Kualitas JPEG 0-1 (default: 0.82 - tajam & efisien)
  minSizeToCompressKb?: number; // Hanya kompres file jika di atas ukuran ini (default: 500 KB)
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Hanya proses file gambar
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // File GIF / SVG tidak dikompresi via canvas
  if (file.type.includes("gif") || file.type.includes("svg")) {
    return file;
  }

  const {
    maxDimension = 1920,
    quality = 0.82,
    minSizeToCompressKb = 500,
  } = options;

  // Jika ukuran file sudah cukup kecil (< 500 KB), tidak perlu dikompresi lagi
  if (file.size <= minSizeToCompressKb * 1024) {
    return file;
  }

  try {
    const bitmap = await loadImageBitmapOrElement(file);
    const { width, height } = bitmap;

    // Hitung dimensi baru dengan mempertahankan aspek rasio
    let targetWidth = width;
    let targetHeight = height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        targetWidth = maxDimension;
        targetHeight = Math.round((height * maxDimension) / width);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((width * maxDimension) / height);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) {
      return file;
    }

    // Gambar dengan smoothing berkualitas tinggi untuk menjaga ketajaman teks/tulisan
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    // Bersihkan bitmap jika mendukung close
    if ("close" in bitmap && typeof (bitmap as ImageBitmap).close === "function") {
      (bitmap as ImageBitmap).close();
    }

    // Convert ke Blob JPEG
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });

    if (!blob || blob.size >= file.size) {
      // Jika hasil kompresi ternyata tidak lebih kecil, gunakan file asli
      return file;
    }

    // Standarisasi nama file ke .jpg
    const originalName = file.name;
    const lastDot = originalName.lastIndexOf(".");
    const baseName = lastDot !== -1 ? originalName.slice(0, lastDot) : originalName;
    const newFileName = `${baseName}.jpg`;

    return new File([blob], newFileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn(`[ImageCompression] Gagal mengompres ${file.name}, menggunakan file asli:`, err);
    return file;
  }
}

/**
 * Helper untuk memuat gambar baik melalui createImageBitmap (modern & cepat)
 * atau HTMLImageElement (kompatibilitas browser lama / iOS Safari)
 */
async function loadImageBitmapOrElement(
  file: File
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fallback ke HTMLImageElement jika createImageBitmap gagal mem-parse format tertentu
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}

/**
 * Kompres beberapa file gambar secara paralel
 */
export async function compressMultipleFiles(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<File[]> {
  const total = files.length;
  const results: File[] = [];

  for (let i = 0; i < total; i++) {
    const file = files[i];
    if (file.type.startsWith("image/")) {
      const compressed = await compressImageFile(file);
      results.push(compressed);
    } else {
      results.push(file);
    }
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
}

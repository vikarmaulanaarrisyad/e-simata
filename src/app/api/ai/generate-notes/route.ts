import { NextRequest, NextResponse } from "next/server";
import { generatePedagogicalNote } from "@/lib/ai-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryName, fieldLabel, fieldName, kelas, waliKelas, tema, seedIndex } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    // If Gemini API Key is configured, attempt calling Gemini with fallback
    if (apiKey) {
      try {
        const prompt = `Anda adalah asisten AI resmi untuk Wali Kelas di MI Bustanul Huda.
Tugas Anda: Buat catatan pelaksanaan kegiatan kelas yang singkat, formal, edukatif, dan bernada positif dalam 3 kalimat padat.

Gaya contoh yang diinginkan:
"Peserta menuliskan hal yang disyukuri dan memasangnya pada pojok kelas. Guru memandu pembacaan beberapa catatan. Kegiatan ditutup dengan refleksi dan rencana merawat pojok kelas."

Informasi Kegiatan:
- Program/Kategori: ${categoryName || "Dokumentasi Kelas"}
- Kelas: ${kelas || "Seluruh siswa kelas"}
- Wali Kelas: ${waliKelas || "Wali Kelas"}
- Fokus/Label: ${fieldLabel || fieldName || "Catatan Pelaksanaan"}
${tema ? `- Tema Kegiatan: ${tema}` : ""}

Instruksi Khusus:
1. Tulis tepat 3 kalimat narasi formal bahasa Indonesia yang baik dan santun.
2. Kalimat 1 menceritakan aktivitas peserta didik.
3. Kalimat 2 menceritakan peran/dampingan guru atau wali kelas.
4. Kalimat 3 menceritakan penutup (refleksi, doa bersama, atau komitmen karakter).
5. Jangan gunakan tanda kutip, jangan gunakan format markdown heading, langsung teks narasi.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 250,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generatedText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

          if (generatedText && generatedText.length > 20) {
            return NextResponse.json({
              success: true,
              generatedText,
              provider: "gemini",
            });
          }
        }
      } catch (geminiErr) {
        console.warn("[Gemini API Warning, falling back to local pedagogical engine]", geminiErr);
      }
    }

    // Fallback to high quality pedagogical template engine
    const note = generatePedagogicalNote({
      categoryName: categoryName || "",
      fieldLabel,
      fieldName,
      kelas,
      waliKelas,
      tema,
      seedIndex,
    });

    return NextResponse.json({
      success: true,
      generatedText: note,
      provider: "smart-pedagogical-engine",
    });
  } catch (error: any) {
    console.error("[generate-notes error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat catatan otomatis." },
      { status: 500 }
    );
  }
}

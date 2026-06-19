import { prisma } from "../config/db";
import { openai} from "../config/openai";

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meter
};

// ==============================
// 🧠 VISION AI VALIDATION
// ==============================
const analyzeImage = async (base64Image: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "google/gemma-3-27b-it:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Kamu adalah sistem validasi bukti pengiriman.

Tugas:
- Tentukan apakah ini lingkungan sekolah
- Tentukan apakah relevan sebagai bukti pengiriman

WAJIB:
- Jawab hanya dalam JSON
- Jangan tambahkan teks lain

Format:
{
  "valid": true atau false,
  "reason": "penjelasan singkat"
}
              `,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    let text = response.choices[0].message.content ?? "";

    // bersihkan markdown kalau ada
    text = text.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        valid: false,
        reason: "AI tidak mengembalikan JSON valid",
      };
    }

    // 🔒 VALIDASI OUTPUT
    return {
      valid: typeof parsed.valid === "boolean" ? parsed.valid : false,
      reason:
        typeof parsed.reason === "string"
          ? parsed.reason
          : "Tidak ada penjelasan",
    };
  } catch (error) {
    console.error("AI ERROR:", error);

    return {
      valid: false,
      reason: "Gagal analisis AI",
    };
  }
};

export const validateDelivery = async ({
  lat,
  lng,
  tugasId,
  base64Image,
}: {
  lat: number;
  lng: number;
  tugasId: number;
  base64Image: string;
}) => {
  try {
    // ambil daftar sekolah dari tugas
    const sekolahList = await prisma.tugas_detail.findMany({
      where: { tugas_id: tugasId },
      include: { sekolah: true },
    });

    let selectedSekolah: any = null;

    //  CEK LOKASI
    for (const s of sekolahList) {
      const distance = calculateDistance(
        lat,
        lng,
        s.sekolah.latitude!,
        s.sekolah.longitude!
      );

      if (distance <= 50) {
        selectedSekolah = s;
        break;
      }
    }

    // tidak di lokasi sekolah
    if (!selectedSekolah) {
      return {
        success: false,
        valid: false,
        reason: "Driver tidak berada di lokasi sekolah",
      };
    }


    // CEK GAMBAR (AI)
    const aiResult = await analyzeImage(base64Image);

    return {
      success: true,
      valid: aiResult.valid,
      reason: aiResult.reason,
      tugas_detail_id: selectedSekolah.id,
      sekolah_id: selectedSekolah.sekolah.id,
    };
  } catch (error) {
    console.error("VALIDATION ERROR:", error);
    return {
      success: false,
      valid: false,
      reason: "Driver tidak berada di lokasi sekolah",
      tugas_detail_id: null,
      sekolah_id: null,
    };
  }
};
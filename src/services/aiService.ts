import { openai } from "../config/openai";
import { prisma } from "../config/db";

export const chatWithAI = async (userId: number, message: string) => {
    
    // ambil data tugas driver
    const tugas = await prisma.tugas_driver.findFirst({
        where: {
        driver_id: BigInt(userId),
        status: "berjalan",
        },
        include: {
        tugas_detail: {
            include: {
            sekolah: true,
            },
        },
        },
    });
    if (message.toLowerCase().includes("berapa sekolah")) {
        const count = tugas?.tugas_detail.length ?? 0;

        return `Anda memiliki ${count} sekolah tujuan.`;
    }

    
    // 🔥 context untuk AI
    const sekolahList = tugas?.tugas_detail.map((d) => d.sekolah.nama_sekolah).join(", ");
    const context = `
        Driver memiliki ${tugas?.tugas_detail.length ?? 0} sekolah:
        ${sekolahList}

        Status: ${tugas?.status}
        `;

    try{const completion = await openai.chat.completions.create({
        model: "openai/gpt-oss-120b:free",
        messages: [
        {
            role: "system",
            content: `
            Kamu adalah asisten driver SPPG.
            Tugas kamu membantu driver memahami tugas pengantaran makanan.

            Jawaban harus:
            - singkat
            - jelas
            - dalam bahasa Indonesia
            - sesuai data yang diberikan
            `
        },
        {
            role: "user",
            content: `
    ${context}

    Pertanyaan:
    ${message}
    `,
        },
        ],
    });

    return completion.choices[0].message.content;
    }catch(e){
        return "AI sedang tidak tersedia, coba lagi nanti.";
    }
};
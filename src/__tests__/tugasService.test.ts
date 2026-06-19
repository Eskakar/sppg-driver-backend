import {
  getHistoryTugas,
  getDetailTugasSelesai,
  getHistoryPreview,
  getCurrentTugas,
  checkAndCompleteTugas,
} from "../services/tugasService";

import { prisma } from "../config/db";

jest.mock("../config/db", () => ({
  prisma: {
    tugas_driver: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    tugas_detail: {
      findMany: jest.fn(),
    },
    box_mbg: {
      findMany: jest.fn(),
    },
  },
}));

describe("Unit Testing - tugasService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    // Representasi TC-01
    it("UT-TGS-01 getHistoryTugas tanpa search", async () => {
        (prisma.tugas_driver.findMany as jest.Mock).mockResolvedValue([
            {
            id: BigInt(1),
            tanggal_tugas: new Date(),
            tugas_detail: [
                {
                sekolah: {
                    nama_sekolah: "SMAN 1",
                },
                },
            ],
            },
        ]);
    const result = await getHistoryTugas();
    expect(result.length).toBe(1);
    });

    // Representasi TC-02
    it("UT-TGS-02 getHistoryTugas search sekolah", async () => {
        (prisma.tugas_driver.findMany as jest.Mock).mockResolvedValue([]);

        await getHistoryTugas("SMAN");

        expect(prisma.tugas_driver.findMany).toHaveBeenCalled();
    });
    // Representasi TC-03
    it("UT-TGS-03 getHistoryTugas search tanggal", async () => {
        (prisma.tugas_driver.findMany as jest.Mock).mockResolvedValue([]);

        await getHistoryTugas("2025-12-01");

        expect(prisma.tugas_driver.findMany).toHaveBeenCalled();
    });

    // Representasi TC-04
    it("UT-TGS-04 detail tugas tidak ditemukan", async () => {
        (prisma.tugas_driver.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(
            getDetailTugasSelesai(1)
        ).rejects.toThrow("Tugas tidak ditemukan");
    }); 

    // Representasi TC-05
    it("UT-TGS-05 detail tugas berhasil", async () => {
        (prisma.tugas_driver.findUnique as jest.Mock).mockResolvedValue({
            id: BigInt(1),
            status: "selesai",
            tanggal_tugas: new Date(),
            jam_mulai: new Date("2025-01-01 08:00"),
            jam_selesai: new Date("2025-01-01 09:00"),

            tugas_detail: [
            {
                status: "sampai",
                jam_sampai: new Date(),
                sekolah: {
                nama_sekolah: "SMAN 1",
                },
                box_mbg: [
                {
                    jumlah_porsi: 10,
                    status: "sampai",
                },
                {
                    jumlah_porsi: 5,
                    status: "diperjalanan",
                },
                {
                    jumlah_porsi: 3,
                    status: "di_sppg",
                },
                ],
            },
            ],
        });
        const result = await getDetailTugasSelesai(1);
        expect(result.total_mbg).toBe(18);
        expect(result.mbg_sampai).toBe(10);
    });

    // Representasi TC-06
    it("UT-TGS-06 history preview", async () => {
        (prisma.tugas_driver.findMany as jest.Mock).mockResolvedValue([
            {
            id: BigInt(1),
            tanggal_tugas: new Date(),
            tugas_detail: [
                {
                box_mbg: [
                    {
                    jumlah_porsi: 100,
                    },
                ],
                },
            ],
            },
        ]);

        const result = await getHistoryPreview();

        expect(result[0].total_mbg).toBe(100);
    });

    // Representasi TC-07
    it("UT-TGS-07 current tugas tidak ada", async () => {
        (prisma.tugas_driver.findFirst as jest.Mock)
            .mockResolvedValue(null);

        const result = await getCurrentTugas(1);

        expect(result).toBeNull();
    });

    // Representasi TC-08
    it("UT-TGS-08 current tugas berhasil", async () => {
        (prisma.tugas_driver.findFirst as jest.Mock)
            .mockResolvedValue({
            id: BigInt(1),
            tanggal_tugas: new Date(),
            status: "berjalan",
            tugas_detail: [
                {
                id: BigInt(1),
                sekolah_id: 1,
                urutan_kirim: 1,
                target_mbg: 100,
                status: "berjalan",

                sekolah: {
                    nama_sekolah: "SMAN 1",
                    latitude: 1,
                    longitude: 1,
                },

                box_mbg: [
                    {
                    jumlah_porsi: 30,
                    status: "di_sppg",
                    },
                    {
                    jumlah_porsi: 20,
                    status: "diperjalanan",
                    },
                    {
                    jumlah_porsi: 50,
                    status: "sampai",
                    },
                ],
                },
            ],
            });

        (prisma.box_mbg.findMany as jest.Mock)
            .mockResolvedValue([
            {
                status: "sampai",
                delivered_sekolah_id: 1,
                jumlah_porsi: 50,
            },
            ]);

        const result = await getCurrentTugas(1);

        expect(result?.statistik.total).toBe(100);
        expect(result?.statistik.progress).toBe(50);
    });

    // Representasi TC-09
    it("UT-TGS-09 detail kosong", async () => {
        (prisma.tugas_detail.findMany as jest.Mock)
            .mockResolvedValue([]);

        const result =
            await checkAndCompleteTugas(BigInt(1));

        expect(result).toBe(false);
    });

    // Representasi TC-10
    it("UT-TGS-10 belum semua selesai", async () => {
        (prisma.tugas_detail.findMany as jest.Mock)
            .mockResolvedValue([
            {
                status: "berjalan",
            },
            ]);

        const result =
            await checkAndCompleteTugas(BigInt(1));

        expect(result).toBe(false);
    });

    // Representasi TC-11
    it("UT-TGS-1 tugas sudah selesai", async () => {
        (prisma.tugas_detail.findMany as jest.Mock)
            .mockResolvedValue([
            {
                status: "sampai",
            },
            ]);

        (prisma.tugas_driver.findUnique as jest.Mock)
            .mockResolvedValue({
            status: "selesai",
            });

        const result =
            await checkAndCompleteTugas(BigInt(1));

        expect(result).toBe(true);
    });

    // Representasi TC-12
    it("UT-TGS-12 update menjadi selesai tugas masih berjalan", async () => {
        (prisma.tugas_detail.findMany as jest.Mock)
            .mockResolvedValue([
            {
                status: "sampai",
            },
            ]);

        (prisma.tugas_driver.findUnique as jest.Mock)
            .mockResolvedValue({
            status: "berjalan",
            });

        (prisma.tugas_driver.update as jest.Mock)
            .mockResolvedValue({});

        const result =
            await checkAndCompleteTugas(BigInt(1));

        expect(result).toBe(true);

        expect(
            prisma.tugas_driver.update
        ).toHaveBeenCalled();
    });
})
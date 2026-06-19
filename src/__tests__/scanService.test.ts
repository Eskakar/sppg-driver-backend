import { prisma } from "../config/db.js";
import { addSpin } from "../services/rouletteService.js";
import { scanBox } from "../services/scanService";
import { checkAndCompleteTugas } from "../services/tugasService.js";
import { calculateDistance } from "../utils/distance.js";

// Mock fungsi eksternal
jest.mock("../config/db.js", () => ({
  prisma: {
    box_mbg: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    tugas_detail: { findMany: jest.fn(), update: jest.fn() }
  }
}));

jest.mock("../services/tugasService", () => ({
  checkAndCompleteTugas: jest.fn(),
}));

jest.mock("../services/rouletteService", () => ({
  addSpin: jest.fn(),
}));

jest.mock("../utils/distance.js", () => ({
  calculateDistance: jest.fn(),
}));

const baseMockBox = {
  id: 1,
  status: "di_sppg",
  jumlah_porsi: 50,
  tugas_detail: {
    id: 100,
    tugas_id: 10,
    tugas_driver: {
      driver_id: 11,
    },
  },
};

describe("White Box Testing - scanBox (Statement Coverage)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Representasi TC-01
  it("TC-SCS-01: Harus throw error jika box tidak ditemukan", async () => {
    (prisma.box_mbg.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(scanBox("QR_NOT_FOUND", 1, -6.1, 106.8)).rejects.toThrow(
      "Box tidak ditemukan"
    );
  });

  // Representasi TC-02
  it("TC-SCS-02: Harus throw error jika driver_id tidak cocok", async () => {
    const mockBox = {
      tugas_detail: {
        tugas_id: 10,
        tugas_driver: { driver_id: 11 } // Driver asli ID 11
      }
    };
    (prisma.box_mbg.findUnique as jest.Mock).mockResolvedValue(mockBox);

    await expect(scanBox("QR_VALID", 99, -6.1, 106.8)).rejects.toThrow(
      "Bukan tugas anda"
    );
  });

  // Representasi TC-03
  it("TC-SCS-03: Harus sukses pickup jika status box di_sppg", async () => {
    const mockBox = {
      id: 1,
      status: "di_sppg",
      tugas_detail: {
        tugas_id: 10,
        tugas_driver: { driver_id: 11 }
      }
    };
    (prisma.box_mbg.findUnique as jest.Mock).mockResolvedValue(mockBox);
    (prisma.box_mbg.update as jest.Mock).mockResolvedValue({});

    const result = await scanBox("QR_VALID", 11, -6.1, 106.8);
    
    expect(prisma.box_mbg.update).toHaveBeenCalled();
    expect(result).toEqual({ type: "pickup", message: "Pickup berhasil" });
  });
  // ==========================================
  // TC-SCS-04: GAGAL DELIVERED - DRIVER JAUH FROM SEKOLAH
 
  it("TC-04: Harus throw error jika jarak driver ke sekolah > 20 meter", async () => {
    // Kondisi: Box sedang diperjalanan
    const mockBox = {
        ...baseMockBox,
        status: "diperjalanan",
    };

    (prisma.box_mbg.findUnique as jest.Mock)
    .mockResolvedValue(mockBox);

    // Mock daftar sekolah yang ditugaskan
    const mockSekolahList = [
      {
        id: 50,
        sekolah_id: "SCH-01",
        sekolah: { latitude: -6.2, longitude: 106.8, nama_sekolah: "SDN 01" },
      },
    ];
    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue(mockSekolahList);

    (calculateDistance as jest.Mock).mockReturnValue(25); 

    await expect(scanBox("QR_VALID", 11, -6.3, 106.9)).rejects.toThrow(
      "Anda tidak berada di lokasi sekolah (min 20m)"
    );
  });

 
  // TC-SCS-05: GAGAL DELIVERED - KUOTA MBG TERPENUHI
 
  it("TC-05: Harus throw error jika target MBG sekolah sudah terpenuhi/surplus", async () => {
    const mockBox = {
        ...baseMockBox,
        status: "diperjalanan",
    };

    (prisma.box_mbg.findUnique as jest.Mock)
    .mockResolvedValue(mockBox);

    const mockSekolahList = [
      {
        id: 50,
        sekolah_id: "SCH-01",
        target_mbg: 100, // Target sekolah: 100 porsi
        sekolah: { latitude: -6.2, longitude: 106.8, nama_sekolah: "SDN 01" },
      },
    ];
    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue(mockSekolahList);
    (calculateDistance as jest.Mock).mockReturnValue(10); // Jarak 10m (Lolos <= 20m)

    // Simulasi Box yang sudah sampai sebelumnya sudah memenuhi target (50 + 50 = 100)
    // Sekaligus mengetes operator `?? 0` dengan menyertakan null/undefined
    const mockDeliveredBoxes = [
      { id: 101, jumlah_porsi: 50 },
      { id: 102, jumlah_porsi: 50 },
      { id: 103, jumlah_porsi: null }, // Mengetes baris `b.jumlah_porsi ?? 0`
    ];
    (prisma.box_mbg.findMany as jest.Mock).mockResolvedValueOnce(mockDeliveredBoxes);

    await expect(scanBox("QR_VALID", 11, -6.2, 106.8)).rejects.toThrow(
      "Kebutuhan sekolah sudah terpenuhi"
    );
  });

 
  // TC-06: SUKSES DELIVERED - SEMUA BOX SAMPAI & TUGAS SELESAI
 
  it("TC-SCS-06: Harus sukses kirim, update status sekolah ke 'sampai', dan memberikan spin reward", async () => {
    const mockBox = {
        ...baseMockBox,
        status: "diperjalanan",
    };

    (prisma.box_mbg.findUnique as jest.Mock)
    .mockResolvedValue(mockBox);

    // 1. Mock List Sekolah (Jarak dekat & target belum terpenuhi)
    const mockSekolah = {
      id: 50,
      sekolah_id: "SCH-01",
      target_mbg: 100,
      sekolah: { latitude: -6.2, longitude: 106.8, nama_sekolah: "SDN 01" },
    };
    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue([mockSekolah]);
    (calculateDistance as jest.Mock).mockReturnValue(5); // 5 meter

    // 2. Mock deliveredBoxes (Baru terpenuhi 30 porsi, masih aman di bawah target 100)
    (prisma.box_mbg.findMany as jest.Mock).mockResolvedValueOnce([{ jumlah_porsi: 30 }]);

    // 3. Mock update box utama ke status 'sampai'
    (prisma.box_mbg.update as jest.Mock).mockResolvedValue({});

    // 4. Mock pengecekan seluruh box di sekolah tersebut (Semua status wajib 'sampai' untuk memicu .every)
    const mockAllBoxesInSekolah = [
      { id: 1, status: "sampai" },
      { id: 2, status: "sampai" },
    ];
    (prisma.box_mbg.findMany as jest.Mock).mockResolvedValueOnce(mockAllBoxesInSekolah);

    // 5. Mock update tugas_detail karena allDelivered bernilai true
    (prisma.tugas_detail.update as jest.Mock).mockResolvedValue({});

    // 6. Mock fungsi penyelesaian tugas dan reward spin (isDone = true)
    (checkAndCompleteTugas as jest.Mock).mockResolvedValue(true);
    (addSpin as jest.Mock).mockResolvedValue({});

    // Eksekusi
    const result = await scanBox("QR_VALID", 11, -6.2, 106.8);

    // Verifikasi semua statement krusial tereksekusi
    expect(prisma.box_mbg.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "sampai" }) })
    );
    expect(prisma.tugas_detail.update).toHaveBeenCalled(); // Terpanggil karena allDelivered = true
    expect(addSpin).toHaveBeenCalledWith(11);      // Terpanggil karena isDone = true
    
    expect(result).toEqual({
      type: "delivered",
      sekolah: "SDN 01",
      message: "Berhasil dikirim",
    });
  });

 
  // TC-07: BOX SUDAH SELESAI DIPROSES (KONDISI AKHIR)
 
  it("TC-SCS-07: Harus throw error jika status box bukan 'di_sppg' maupun 'diperjalanan'", async () => {
    // Kondisi: status box sudah "sampai"
    baseMockBox.status = "sampai";
    (prisma.box_mbg.findUnique as jest.Mock).mockResolvedValue(baseMockBox);

    await expect(scanBox("QR_VALID", 11, -6.2, 106.8)).rejects.toThrow(
      "Box sudah selesai diproses"
    );
  });

  // ==========================================
  // TC-08: allDelivered = false
  // Tidak update tugas_detail jika masih ada box yang belum sampai
  // ==========================================

  it("TC-SCS-08: Tidak mengubah status tugas_detail jika masih ada box yang belum sampai", async () => {
    const mockBox = {
      ...baseMockBox,
      status: "diperjalanan",
    };

    (prisma.box_mbg.findUnique as jest.Mock).mockResolvedValue(mockBox);

    const mockSekolah = {
      id: 50,
      sekolah_id: "SCH-01",
      target_mbg: 100,
      sekolah: {
        latitude: -6.2,
        longitude: 106.8,
        nama_sekolah: "SDN 01",
      },
    };

    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue([
      mockSekolah,
    ]);

    (calculateDistance as jest.Mock).mockReturnValue(5);

    // deliveredBoxes
    (prisma.box_mbg.findMany as jest.Mock).mockResolvedValueOnce([
      { jumlah_porsi: 30 },
    ]);

    (prisma.box_mbg.update as jest.Mock).mockResolvedValue({});

    // allDelivered = false
    (prisma.box_mbg.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 1, status: "sampai" },
      { id: 2, status: "diperjalanan" },
    ]);

    (checkAndCompleteTugas as jest.Mock).mockResolvedValue(true);
    (addSpin as jest.Mock).mockResolvedValue({});

    const result = await scanBox(
      "QR_VALID",
      11,
      -6.2,
      106.8
    );

    expect(prisma.tugas_detail.update).not.toHaveBeenCalled();

    expect(result).toEqual({
      type: "delivered",
      sekolah: "SDN 01",
      message: "Berhasil dikirim",
    });
  });

  // ==========================================
  // TC-09: isDone = false
  // Tidak memberikan reward spin
  // ==========================================

  it("TC-SCS-09: Tidak memberikan spin reward jika tugas belum selesai", async () => {
    const mockBox = {
      ...baseMockBox,
      status: "diperjalanan",
    };

    (prisma.box_mbg.findUnique as jest.Mock).mockResolvedValue(mockBox);

    const mockSekolah = {
      id: 50,
      sekolah_id: "SCH-01",
      target_mbg: 100,
      sekolah: {
        latitude: -6.2,
        longitude: 106.8,
        nama_sekolah: "SDN 01",
      },
    };

    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue([
      mockSekolah,
    ]);

    (calculateDistance as jest.Mock).mockReturnValue(5);

    // deliveredBoxes
    (prisma.box_mbg.findMany as jest.Mock).mockResolvedValueOnce([
      { jumlah_porsi: 30 },
    ]);

    (prisma.box_mbg.update as jest.Mock).mockResolvedValue({});

    // allDelivered = true
    (prisma.box_mbg.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 1, status: "sampai" },
      { id: 2, status: "sampai" },
    ]);

    (prisma.tugas_detail.update as jest.Mock).mockResolvedValue({});

    // branch yang belum diuji
    (checkAndCompleteTugas as jest.Mock).mockResolvedValue(false);

    const result = await scanBox(
      "QR_VALID",
      11,
      -6.2,
      106.8
    );

    expect(checkAndCompleteTugas).toHaveBeenCalledWith(10);

    expect(addSpin).not.toHaveBeenCalled();

    expect(result).toEqual({
      type: "delivered",
      sekolah: "SDN 01",
      message: "Berhasil dikirim",
    });
  });

  it("TC-SCS-10: Berhasil menemukan sekolah pada iterasi kedua", async () => {
    const mockBox = {
      ...baseMockBox,
      status: "diperjalanan",
    };

    (prisma.box_mbg.findUnique as jest.Mock).mockResolvedValue(mockBox);

    const sekolahList = [
      {
        id: 1,
        sekolah_id: "SCH-01",
        target_mbg: 100,
        sekolah: {
          latitude: -6.20,
          longitude: 106.80,
          nama_sekolah: "SDN 01",
        },
      },
      {
        id: 2,
        sekolah_id: "SCH-02",
        target_mbg: 100,
        sekolah: {
          latitude: -6.21,
          longitude: 106.81,
          nama_sekolah: "SDN 02",
        },
      },
    ];

    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue(
      sekolahList
    );

    (calculateDistance as jest.Mock)
      .mockReturnValueOnce(30) // sekolah pertama gagal
      .mockReturnValueOnce(10); // sekolah kedua berhasil

    (prisma.box_mbg.findMany as jest.Mock)
      .mockResolvedValueOnce([{ jumlah_porsi: 20 }]);

    (prisma.box_mbg.update as jest.Mock)
      .mockResolvedValue({});

    (prisma.box_mbg.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 1,
          status: "sampai",
        },
      ]);

    (prisma.tugas_detail.update as jest.Mock)
      .mockResolvedValue({});

    (checkAndCompleteTugas as jest.Mock)
      .mockResolvedValue(true);

    (addSpin as jest.Mock)
      .mockResolvedValue({});

    const result = await scanBox(
      "QR_VALID",
      11,
      -6.2,
      106.8
    );

    expect(calculateDistance).toHaveBeenCalledTimes(2);

    expect(result).toEqual({
      type: "delivered",
      sekolah: "SDN 02",
      message: "Berhasil dikirim",
    });
  });
  
});
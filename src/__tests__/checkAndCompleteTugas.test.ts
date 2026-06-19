import { prisma } from "../config/db.js";
import { checkAndCompleteTugas } from "../services/tugasService.js";

jest.mock("../config/db.js", () => ({
  prisma: {
    tugas_detail: {
      findMany: jest.fn(),
    },
    tugas_driver: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("White Box Testing - checkAndCompleteTugas (Statement Coverage)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================================================
  // TC-TGS-01
  // ==================================================

  it("TC-TGS-01: Mengembalikan false jika tidak ada tugas_detail", async () => {
    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue([]);

    const result = await checkAndCompleteTugas(BigInt(1));

    expect(result).toBe(false);

    expect(prisma.tugas_driver.findUnique).not.toHaveBeenCalled();
    expect(prisma.tugas_driver.update).not.toHaveBeenCalled();
  });

  // ==================================================
  // TC-TGS-02
  // ==================================================

  it("TC-TGS-02: Mengembalikan false jika masih ada tugas yang belum selesai", async () => {
    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        status: "sampai",
      },
      {
        id: 2,
        status: "berjalan",
      },
    ]);

    const result = await checkAndCompleteTugas(BigInt(1));

    expect(result).toBe(false);

    expect(prisma.tugas_driver.findUnique).not.toHaveBeenCalled();
    expect(prisma.tugas_driver.update).not.toHaveBeenCalled();
  });

  // ==================================================
  // TC-TGS-03
  // ==================================================

  it("TC-TGS-03: Mengembalikan true jika status tugas sudah selesai", async () => {
    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        status: "sampai",
      },
      {
        id: 2,
        status: "sampai",
      },
    ]);

    (prisma.tugas_driver.findUnique as jest.Mock).mockResolvedValue({
      status: "selesai",
    });

    const result = await checkAndCompleteTugas(BigInt(1));

    expect(result).toBe(true);

    expect(prisma.tugas_driver.findUnique).toHaveBeenCalled();

    expect(prisma.tugas_driver.update).not.toHaveBeenCalled();
  });

  // ==================================================
  // TC-TGS-04
  // ==================================================

  it("TC-TGS-04: Mengupdate status tugas menjadi selesai jika seluruh tugas_detail telah selesai", async () => {
    (prisma.tugas_detail.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        status: "sampai",
      },
      {
        id: 2,
        status: "sampai",
      },
    ]);

    (prisma.tugas_driver.findUnique as jest.Mock).mockResolvedValue({
      status: "berjalan",
    });

    (prisma.tugas_driver.update as jest.Mock).mockResolvedValue({});

    const result = await checkAndCompleteTugas(BigInt(1));

    expect(result).toBe(true);

    expect(prisma.tugas_driver.update).toHaveBeenCalledWith({
      where: {
        id: BigInt(1),
      },
      data: {
        status: "selesai",
        jam_selesai: expect.any(Date),
      },
    });
  });
});
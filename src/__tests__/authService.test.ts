import { loginUser } from "../services/authService"; // Sesuaikan path ke file loginUser Anda
import { prisma } from "../config/db";
import * as bcrypt from "bcrypt";

// ==========================================
// 1. MOCKING DEPENDENCIES
// ==========================================
jest.mock("../config/db", () => ({
  prisma: {
    users: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

describe("White Box Testing - loginUser (Statement Coverage)", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TC-01: USER TIDAK DITEMUKAN
  // ==========================================
  it("TC-AUTH-01: Harus throw error jika user tidak ditemukan di database", async () => {
    // Simulasi prisma mengembalikan null (user tidak ada)
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(loginUser("Ahmad_Palsu", "password123")).rejects.toThrow(
      "User tidak ditemukan"
    );

    // Memastikan pencarian ke DB terjadi, namun Bcrypt tidak dipanggil
    expect(prisma.users.findFirst).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  // ==========================================
  // TC-02: PASSWORD SALAH
  // ==========================================
  it("TC-AUTH-02: Harus throw error jika password tidak cocok (isMatch = false)", async () => {
    const mockUser = {
      id: 1,
      nama: "Ahmad",
      password_hash: "$2b$10$hashedpasswordsebenarnya",
      role: "driver",
    };
    
    // Simulasi user ditemukan
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    // Simulasi bcrypt menghasilkan false (password salah)
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(loginUser("Ahmad", "password_salah")).rejects.toThrow(
      "Password salah"
    );

    expect(prisma.users.findFirst).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).toHaveBeenCalledWith("password_salah", mockUser.password_hash);
  });

  // ==========================================
  // TC-03: LOGIN SUKSES
  // ==========================================
  it("TC-AUTH-03: Harus mengembalikan data user (id, nama, role) jika login berhasil", async () => {
    const mockUser = {
      id: "99", // Berbentuk string di DB (misal BigInt/String)
      nama: "Budi",
      password_hash: "$2b$10$hashedpasswordbudiyangbenar",
      role: "admin",
    };

    // Simulasi semua kondisi sukses
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await loginUser("Budi", "rahasia123");

    // Verifikasi output sesuai dengan ekspektasi return fungsi
    expect(result).toEqual({
      id: 99, // Pastikan berubah jadi number karena ada Number(user.id)
      nama: "Budi",
      role: "admin",
    });

    expect(prisma.users.findFirst).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
  });
});
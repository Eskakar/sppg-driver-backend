import {prisma} from "../config/db";
import * as bcrypt from 'bcrypt';

type RegisterUserInput = {
  nama: string;
  nik?: string;
  no_telp: string;
  password: string;
  role: "admin" | "driver" | "dapur";
};

export const loginUser = async (nama: string, password: string) => {
  const user = await prisma.users.findFirst({
    where: { nama }
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new Error("Password salah");
  }

  return {
    id: Number(user.id),
    nama: user.nama,
    role: user.role,
  };
};

export const registerUser = async (payload: RegisterUserInput) => {
  const { nama, nik, no_telp, password, role } = payload;

  // cek nomor sudah dipakai
  const existingPhone = await prisma.users.findFirst({
    where: { no_telp },
  });

  if (existingPhone) {
    throw new Error("Nomor telepon sudah terdaftar");
  }

  // cek nik jika diisi
  if (nik) {
    const existingNik = await prisma.users.findFirst({
      where: { nik },
    });

    if (existingNik) {
      throw new Error("NIK sudah terdaftar");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      nama,
      nik,
      no_telp,
      password_hash: hashedPassword,
      role,
    },
    select: {
      id: true,
      nama: true,
      nik: true,
      no_telp: true,
      role: true,
      created_at: true,
    },
  });

  return {
    id: Number(user.id),
    nama: user.nama,
    nik: user.nik,
    no_telp: user.no_telp,
    role: user.role,
    created_at: user.created_at,
  };
};
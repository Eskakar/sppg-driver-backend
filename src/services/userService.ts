import {prisma} from "../config/db";
import dotenv from "dotenv";
dotenv.config();
const IP_BACKEND = process.env.IP_BACKEND;
//const IP_FRONTEND = process.env.IP_FRONTEND;
export const getCurrentUser = async (userId: number) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nama: true,
      no_telp: true,
      role: true,
      gaji: true,
      foto_profil: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  //  tambahkan base URL
  return {
    ...user,
    foto_profil: user.foto_profil
      ? `${IP_BACKEND}/uploads/${user.foto_profil}`
      : null,
  };
};
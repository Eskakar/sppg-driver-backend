import { prisma } from "../config/db";

type SendNotifInput = {
  tugas_id: string;
  judul: string;
  pesan: string;
  jenis: "pengumuman" | "tugas" | "sanksi";
};

// untuk admin kirim notif ke driver, kirim ke db
export const sendNotifToTaskDrivers = async (
  payload: SendNotifInput
) => {
  const { tugas_id, judul, pesan, jenis } = payload;

  const tugasDrivers = await prisma.tugas_driver.findMany({
    where: {
      id: BigInt(tugas_id),
    },
    select: {
      driver_id: true,
    },
  });

  if (tugasDrivers.length === 0) return;

  const data = tugasDrivers.map((td) => ({
    user_id: td.driver_id,
    judul,
    pesan,
    jenis,
  }));

  await prisma.notifikasi.createMany({
    data,
  });
};

export const getUserNotif = async (userId: number) => {
  return await prisma.notifikasi.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });
};

export const markNotifAsRead = async (userId: number) => {
  await prisma.notifikasi.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: {
      is_read: true,
    },
  });
};
//bagin is_sent
export const getUnsentNotif = async (userId: number) => {
  
  return await prisma.notifikasi.findMany({
    where: {
      user_id: userId,
      is_sent: false,
    },
    orderBy: {
      created_at: "desc",
    },
  });
};
export const markNotifAsSent = async (ids: bigint[]) => {
  if (!ids || ids.length === 0) return;

  await prisma.notifikasi.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      is_sent: true,
    },
  });
};
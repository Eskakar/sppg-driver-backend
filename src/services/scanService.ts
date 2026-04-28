import {prisma} from "../config/db.js";

export const scanPickup = async (
  qr_code: string,
  driverId: number,
  lat: number,
  lng: number
) => {
  // 1. cari box + relasi tugas
  const box = await prisma.box_mbg.findUnique({
    where: { qr_code },
    include: {
      tugas_detail: {
        include: {
          tugas_driver: true,
        },
      },
    },
  });

  if (!box) {
    throw new Error("Box tidak ditemukan");
  }

  // 2. validasi driver (convert bigint → number)
  const ownerId = Number(box.tugas_detail.tugas_driver.driver_id);

  if (ownerId !== driverId) {
    throw new Error("Bukan tugas anda");
  }

  // 3. validasi status
  if (box.status === "diperjalanan") {
    throw new Error("Box sudah di-pickup");
  }

  if (box.status === "sampai") {
    throw new Error("Box sudah sampai, tidak bisa pickup");
  }

  // 4. update box
  const updatedBox = await prisma.box_mbg.update({
    where: { id: box.id },
    data: {
      status: "diperjalanan",
      scanned_sppg_at: new Date(),
      scanned_sppg_lat: lat,
      scanned_sppg_lng: lng,
    },
  });

  // 5. simpan log (optional tapi bagus)
  await prisma.scan_logs.create({
    data: {
      box_id: box.id,
      user_id: driverId,
      scan_type: "pickup",
      latitude: lat,
      longitude: lng,
    },
  });

  return {
    message: "Berhasil scan pickup",
    box_id: Number(updatedBox.id),
  };
};

export const scanDelivered = async (
  qr_code: string,
  sekolahId: number,
  driverId: number,
  lat: number,
  lng: number
) => {
  // 1. cari box
  const box = await prisma.box_mbg.findUnique({
    where: { qr_code },
    include: {
      tugas_detail: {
        include: {
          tugas_driver: true,
        },
      },
    },
  });

  if (!box) throw new Error("Box tidak ditemukan");

  // 2. validasi driver
  if (Number(box.tugas_detail.tugas_driver.driver_id) !== driverId) {
    throw new Error("Bukan tugas anda");
  }

  // 3. sudah sampai?
  if (box.status === "sampai") {
    throw new Error("Box sudah discan sebelumnya");
  }

  // 4. ambil target sekolah
  const detail = await prisma.tugas_detail.findFirst({
    where: {
      tugas_id: box.tugas_detail.tugas_id,
      sekolah_id: sekolahId,
    },
    include: {
      box_mbg: true,
    },
  });

  if (!detail) throw new Error("Sekolah tidak valid");

  // 5. hitung MBG sudah sampai
  let current = 0;

  for (const b of detail.box_mbg) {
    if (b.status === "sampai") {
      current += b.jumlah_porsi ?? 0;
    }
  }

  // 6. validasi target
  const targetmbg = detail.target_mbg ?? 0;
  if (current >= targetmbg) {
    throw new Error("Kebutuhan sekolah sudah terpenuhi");
  }

  // 7. update box
  await prisma.box_mbg.update({
    where: { id: box.id },
    data: {
      status: "sampai",
      scanned_sampai_at: new Date(),
      scanned_sampai_lat: lat,
      scanned_sampai_lng: lng,
      delivered_sekolah_id: sekolahId,
    },
  });

  // 8. update detail status kalau sudah full
  const newTotal = current + (box.jumlah_porsi ?? 0);

  if (newTotal >= targetmbg) {
    await prisma.tugas_detail.update({
      where: { id: detail.id },
      data: {
        status: "sampai",
        jam_sampai: new Date(),
      },
    });
  }

  return {
    message: "Berhasil scan",
  };
};
import {prisma} from "../config/db.js";
import { calculateDistance } from "../utils/distance.js";

export const scanBox = async (
  qr_code: string,
  driverId: number,
  lat: number,
  lng: number
) => {
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

  const ownerId = Number(box.tugas_detail.tugas_driver.driver_id);

  if (ownerId !== driverId) {
    throw new Error("Bukan tugas anda");
  }

  // =========================
  // PICKUP
  // =========================
  if (box.status === "di_sppg") {
    await prisma.box_mbg.update({
      where: { id: box.id },
      data: {
        status: "diperjalanan",
        scanned_sppg_at: new Date(),
        scanned_sppg_lat: lat,
        scanned_sppg_lng: lng,
      },
    });

    return { type: "pickup", message: "Pickup berhasil" };
  }

  // =========================
  // DELIVERED
  // =========================
  if (box.status === "diperjalanan") {
    // ambil semua sekolah dalam tugas
    const sekolahList = await prisma.tugas_detail.findMany({
      where: {
        tugas_id: box.tugas_detail.tugas_id,
      },
      include: {
        sekolah: true,
      },
    });

    let selectedSekolah = null;

    for (const s of sekolahList) {
      const distance = calculateDistance(
        lat,
        lng,
        s.sekolah.latitude!,
        s.sekolah.longitude!
      );

      if (distance <= 20) {
        selectedSekolah = s;
        break;
      }
    }

    if (!selectedSekolah) {
      throw new Error("Anda tidak berada di lokasi sekolah (min 20m)");
    }

    // hitung MBG saat ini
    const deliveredBoxes = await prisma.box_mbg.findMany({
      where: {
        delivered_sekolah_id: selectedSekolah.sekolah_id,
        status: "sampai",
        tugas_detail: {
          tugas_id: box.tugas_detail.tugas_id,
        },
      },
    });

    let current = 0;
    for (const b of deliveredBoxes) {
      current += b.jumlah_porsi ?? 0;
    }

    if (current >= selectedSekolah.target_mbg!) {
      throw new Error("Kebutuhan sekolah sudah terpenuhi");
    }

    // update
    await prisma.box_mbg.update({
      where: { id: box.id },
      data: {
        status: "sampai",
        scanned_sampai_at: new Date(),
        scanned_sampai_lat: lat,
        scanned_sampai_lng: lng,
        delivered_sekolah_id: selectedSekolah.sekolah_id,
      },
    });

    return {
      type: "delivered",
      sekolah: selectedSekolah.sekolah.nama_sekolah,
      message: "Berhasil dikirim",
    };
  }

  // =========================
  // SUDAH SELESAI
  // =========================
  throw new Error("Box sudah selesai diproses");
};
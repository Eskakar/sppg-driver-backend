import { prisma } from "../config/db.js";
import { calculateDistance } from "../utils/distance.js";
import { checkAndCompleteTugas } from "./tugasService.js";
import { addSpin } from "./rouletteService.js";

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

  const tugasId = box.tugas_detail.tugas_id;
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
    const sekolahList = await prisma.tugas_detail.findMany({
      where: { tugas_id: tugasId },
      include: { sekolah: true },
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

    // =========================
    // HITUNG MBG
    // =========================
    const deliveredBoxes = await prisma.box_mbg.findMany({
      where: {
        delivered_sekolah_id: selectedSekolah.sekolah_id,
        status: "sampai",
        tugas_detail: {
          tugas_id: tugasId,
        },
      },
    });

    let current = 0;
    for (const b of deliveredBoxes) {
      current += b.jumlah_porsi ?? 0;
    }

    if (current >= (selectedSekolah.target_mbg ?? 0)) {
      throw new Error("Kebutuhan sekolah sudah terpenuhi");
    }

    // =========================
    // UPDATE BOX
    // =========================
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

    // =========================
    // CEK SEMUA BOX DI SEKOLAH
    // =========================
    const boxes = await prisma.box_mbg.findMany({
      where: {
        tugas_detail_id: selectedSekolah.id,
      },
    });

    const allDelivered = boxes.every((b) => b.status === "sampai");

    if (allDelivered) {
      await prisma.tugas_detail.update({
        where: { id: selectedSekolah.id },
        data: {
          status: "sampai",
          jam_sampai: new Date(),
        },
      });
    }

    // =========================
    // CEK TUGAS SELESAI
    // =========================
    const isDone = await checkAndCompleteTugas(tugasId);

    if (isDone) {
      await addSpin(driverId); //  reward
    }

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
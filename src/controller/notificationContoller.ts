import { Request, Response } from "express";
import { getUnsentNotif, getUserNotif, markNotifAsRead,markNotifAsSent,sendNotifToTaskDrivers } from "../services/notificationService";
import { serializeBigInt } from "../utils/serialize";

export const getNotifController = async (req:Request, res:Response) => {
  try {

    const user = req.session.user!;
    const data = await getUserNotif(user.id);

    res.json({
      success: true,
      data: serializeBigInt(data),
    });
  } catch (e:any) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};

export const readNotifController = async (req:Request, res:Response) => {
  try {
    const user = req.session.user!;

    await markNotifAsRead(user.id);

    res.json({
      success: true,
      message: "Notifikasi sudah dibaca",
    });
  } catch (e:any) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};
export const sendTugasNotifController = async (req: Request, res: Response) => {
  try {
    const { tugas_id, judul, pesan } = req.body;

    // validasi input
    if (!tugas_id || !judul || !pesan) {
      return res.status(400).json({
        success: false,
        message: "tugas_id, judul, dan pesan wajib diisi",
      });
    }

    await sendNotifToTaskDrivers({
      tugas_id,
      judul,
      pesan,
      jenis: "tugas", //  auto set jenis
    });

    return res.json({
      success: true,
      message: "Notifikasi tugas berhasil dikirim",
    });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};

export const getUnsentNotifController = async (req:Request, res:Response) => {
  try {
    const user = req.session.user!;

    const data = await getUnsentNotif(user.id);

    res.json({
      success: true,
      data: serializeBigInt(data),
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};
export const markNotifAsSentController = async (req:Request, res:Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: "ids harus berupa array",
      });
    }

    //  convert ke BigInt
    const parsedIds = serializeBigInt(ids.map((id: any) => BigInt(id)));

    await markNotifAsSent(parsedIds);

    res.json({
      success: true,
      message: "Notifikasi ditandai sebagai terkirim",
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};
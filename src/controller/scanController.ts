import { Request, Response } from "express";
import { scanDelivered, scanPickup } from "../services/scanService.js";


export const scanPickupController = async (req: Request, res: Response) => {
  try {
    const user = req.session.user!; // dari middleware

    const { qr_code, latitude, longitude } = req.body;

    // validasi input
    if (!qr_code || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "qr_code, latitude, dan longitude wajib diisi",
      });
    }

    const result = await scanPickup(
      qr_code,
      user.id,
      Number(latitude),
      Number(longitude)
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const scanDeliveredController = async (req: Request, res: Response) => {
  try {
    const sessionUser = req.session.user!;

    const { qr_code, sekolah_id, latitude, longitude } = req.body;
    const sekolahId = parseInt(sekolah_id);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!qr_code || !sekolah_id) {
      return res.status(400).json({
        success: false,
        message: "qr_code dan sekolah_id wajib diisi",
      });
    }

    const result = await scanDelivered(
      qr_code,
      sekolahId,
      sessionUser.id,
      lat,
      lng
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
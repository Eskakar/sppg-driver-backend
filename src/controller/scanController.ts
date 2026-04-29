import { Request, Response } from "express";
import { scanBox } from "../services/scanService.js";

export const scanController = async (req:Request, res:Response) => {
  try {
    const user = req.session.user!;
    const { qr_code, latitude, longitude } = req.body;

    const result = await scanBox(
      qr_code,
      user.id,
      Number(latitude),
      Number(longitude)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
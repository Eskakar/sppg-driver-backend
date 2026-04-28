import { Request, Response } from "express";
import { getHistoryTugas, getDetailTugasSelesai, getHistoryPreview, getCurrentTugas } from "../services/tugasService.js";
import { serializeBigInt } from "../utils/serialize.js";

export const getHistory = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const data = await getHistoryTugas(search as string);

    return res.json({
      success: true,
      data: serializeBigInt(data),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDetailSelesai = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = await getDetailTugasSelesai(Number(id));

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHistoryPreviewController = async (
    req: Request,
    res: Response
    ) => {
    try {
        const data = await getHistoryPreview();

        return res.json({
        success: true,
        data,
        });
    } catch (error: any) {
        return res.status(500).json({
        success: false,
        message: error.message,
        });
    }
};

//controller data tugas sedang berlangsung
export const getCurrent = async (req: Request, res: Response) => {
  try {
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await getCurrentTugas(sessionUser.id);

    if (!data) {
      return res.json({
        success: true,
        data: null,
        message: "Tidak ada tugas hari ini",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
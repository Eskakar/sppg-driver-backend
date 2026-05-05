import { Request, Response } from "express";
import { chatWithAI } from "../services/aiService";
import { validateDelivery } from "../services/visionService";
import { prisma } from "../config/db";
import fs from "fs";

export const chatController = async (req: Request, res: Response) => {
  try {
    const user = req.session.user!;
    if (!user) {
        return res.status(401).json({
        success: false,
        message: "Session tidak valid",
        });
    }
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message wajib diisi",
      });
    }

    const reply = await chatWithAI(user.id, message);

    res.json({
      success: true,
      data: reply,
    });
  } catch (e: any) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

export const uploadProofHandler = async (req: Request, res: Response) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.session.user;
    const file = req.file;
    const { lat, lng, tugasId } = req.body;

    if (!file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imagePath = file.path;

    // convert ke base64 untuk AI
    const base64Image = fs.readFileSync(imagePath, {
      encoding: "base64",
    });

    const result = await validateDelivery({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      tugasId: parseInt(tugasId),
      base64Image,
    });

    // simpan hanya kalau sukses
    if (result.success && result.valid) {
      await prisma.bukti_pengiriman.create({
        data: {
          tugas_id: parseInt(tugasId),
          tugas_detail_id: result.tugas_detail_id,
          sekolah_id: result.sekolah_id,
          driver_id: user.id,
          foto_path: imagePath,
          is_valid: result.valid,
          reason: result.reason,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        reason: result.reason,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
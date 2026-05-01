import { Request, Response } from "express";
import { chatWithAI } from "../services/aiService";

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
import { Request, Response } from "express";
import { getCurrentUser } from "../services/userService.js";
import { serializeBigInt } from "../utils/serialize.js";

export const me = async (req: Request, res: Response) => {
  try {
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await getCurrentUser(sessionUser.id);

    return res.status(200).json({
      success: true,
      data: serializeBigInt(user),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
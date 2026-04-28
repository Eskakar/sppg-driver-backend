import { Request, Response, NextFunction } from "express";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.session.user;

  if (!user || !user.id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // 🔥 inject ke req biar lebih aman
  (req as any).user = user;

  next();
};
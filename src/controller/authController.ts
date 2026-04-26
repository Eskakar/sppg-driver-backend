import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/authService.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { nama , password } = req.body;

    if (!nama || !password) {
      return res.status(400).json({
        success: false,
        message: "nama dan password wajib diisi",
      });
    }

    const user = await loginUser(nama, password);

    req.session.user = user;

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: user,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = (req: Request, res: Response) => {
    if (!req.session) {
        return res.status(400).json({
            success: false,
            message: "Session tidak ada",
        });
    }

    req.session.destroy((err?: Error) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Logout gagal",
                error: err.message,
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            success: true,
            message: "Logout berhasil",
        });
    });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { nama, nik, no_telp, password, role } = req.body;

    // validasi field wajib
    if (!nama || !no_telp || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "nama, no_telp, password, dan role wajib diisi",
      });
    }

    // validasi role
    const allowedRoles = ["admin", "driver", "dapur"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role tidak valid. Gunakan: admin, driver, atau dapur",
      });
    }

    const user = await registerUser({
      nama,
      nik,
      no_telp,
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Gagal membuat user",
    });
  }
};

export const me = async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  return res.status(200).json({
    success: true,
    data: req.session.user,
  });
};
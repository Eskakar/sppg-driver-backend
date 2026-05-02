import { Request, Response } from "express";
import { getSpin, spinRoulette,addSpin } from "../services/rouletteService.js";

// ==========================
// GET SPIN
// ==========================
export const getSpinController = async (req: Request, res: Response) => {
  try {
    const user = req.session.user!;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const spins = await getSpin(user.id);

    res.json({
      success: true,
      data: {
        spins,
      },
    });
  } catch (e: any) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ==========================
// POST SPIN
// ==========================
export const spinController = async (req: Request, res: Response) => {
  try {
    const user = req.session.user!;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await spinRoulette(user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }


  
};

//khusus dev
export const addSpinToken = async (req:Request, res: Response) =>{
    try{
        const user = req.session.user!;
    
        if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
        }
        await addSpin (user.id);
        res.status(200).json({
            success: true,
            message: "Berhasil tambah token spin ke : " + user.nama,
        })
    }catch(e:any){
        res.status(400).json({
            success: false,
            message: e.message,
        })
    }
}

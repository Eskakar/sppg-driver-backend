import { Router } from "express";
import {
  getNotifController,
  getUnsentNotifController,
  markNotifAsSentController,
  readNotifController,
  sendTugasNotifController
} from "../controller/notificationContoller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

//ngambil semua notif 
router.get("/", requireAuth, getNotifController);
//jika sudah dipencet notif screen, maka mark as read
router.post("/read", requireAuth, readNotifController);
//mengirim tugas ke DB (hanay boleh admin)
router.post("/send-tugas", requireAuth, sendTugasNotifController);
//check di local notif, udah kekirim apa belum
router.get("/unsent", requireAuth, getUnsentNotifController);
//jika sudah terkirim akan dikirim mark sent
router.post("/mark-sent", requireAuth, markNotifAsSentController);

export default router;
import { Router } from "express";
import { getHistory,getDetailSelesai,getHistoryPreviewController, getCurrent  } from "../controller/tugasController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { scanDeliveredController, scanPickupController } from "../controller/scanController.js";

const router = Router();

router.get("/search", requireAuth, getHistory); //untuk sistem search
router.get("/:id/detail", requireAuth, getDetailSelesai); //untuk detail 1 tugas yang sudah selesai
router.get("/history/preview", requireAuth, getHistoryPreviewController); //untuk listview beberapa tugas selesai
router.get("/current", requireAuth, getCurrent); // untuk mengambil data tugas sedang berlangsung
router.post("/pickup", requireAuth, scanPickupController); //untuk scan box_mbg sebelum diangkut oleh driver
router.post("/scan/delivered", requireAuth, scanDeliveredController); // untuk scanning box mbg disekolah
export default router;
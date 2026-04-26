import { Router } from "express";
import { login, logout,register, me } from "../controller/authController.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);
router.get("/me", me);

export default router;
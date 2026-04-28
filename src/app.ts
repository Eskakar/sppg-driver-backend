import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import tugasRoutes from "./routes/tugasRoutes.js";

dotenv.config();

import router from "./routes/authRoutes";
//const authRoutes = require("./routes/authRoutes.js");

const app = express();

// app.use(cors({
//   origin: true,
//   credentials: true
// }));

//ingat harus ip frontend
app.use(cors({
  origin: ['http://localhost', 'http://127.0.0.1:5500','http://10.0.2.2:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Jika butuh kirim cookie/session
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use("/api/auth", router);
app.use("/api/user", userRoutes);
app.use("/api/tugas", tugasRoutes);

export default app;
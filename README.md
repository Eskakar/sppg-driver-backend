# 🚚 SPPG Driver Backend

\


\

Backend API untuk aplikasi **SPPG Driver**, digunakan untuk mengelola distribusi MBG (Makanan Bergizi Gratis), scan QR, tracking pengantaran, notifikasi, dan sistem reward (roulette).

---

# ✨ Features

## 🚚 Manajemen Tugas

* Ambil tugas harian driver
* Detail tugas per sekolah
* Monitoring progress distribusi

## 📦 Scan QR Box

* Pickup dari SPPG
* Delivery ke sekolah
* Validasi lokasi (GPS)
* Status:

  ```
  di_sppg → diperjalanan → sampai
  ```

## 📊 Auto Complete Tugas

* Tugas selesai otomatis jika semua sekolah terpenuhi
* Trigger reward roulette

## 🎰 Roulette System

* Reward setelah menyelesaikan tugas
* Weighted random (backend controlled)
* Anti-cheat (tidak bisa manipulasi client)

## 🔔 Notifikasi

* Notifikasi tugas baru
* Mark as read

## 🔐 Authentication

* Session-based auth
* Role-based access (driver/admin)

---

# 🧠 System Architecture

```
Flutter App (Driver)
        ↓
     REST API (Express.js)
        ↓
     Prisma ORM
        ↓
     MySQL Database
```

---

# 🗄️ Database Overview

## Core Tables

```
users
tugas_driver
tugas_detail
box_mbg
sekolah
```

## Roulette System

```
roulette_balance
roulette_history
```

---

# ⚙️ Getting Started

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Eskakar/sppg-driver-backend.git
cd sppg-driver-backend
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Setup Environment

Buat file `.env`

```env
DATABASE_URL="mysql://user:password@localhost:3306/sppg_driver"
SESSION_SECRET="your_secret_key"
PORT=3000
```

---

## 4️⃣ Setup Database

```bash
npx prisma db push
npx prisma generate
```

---

## 5️⃣ Run Server

```bash
npm run dev
```

---

# 🌐 API Endpoints

## 🔐 Authentication

```
POST /login
GET  /check-session
```

---

## 🚚 Tugas

```
GET /tugas/hari-ini
GET /tugas/:id/detail
```

---

## 📦 Scan QR

```
POST /scan
```

Body:

```json
{
  "qr_code": "RUN-4",
  "latitude": -6.21,
  "longitude": 106.81
}
```

---

## 🎰 Roulette

```
GET  /roulette/spin   → cek sisa spin
POST /roulette/spin   → spin roulette
```

---

## 🔔 Notifikasi

```
GET  /notifikasi
POST /notifikasi/read
```

---

# 🔄 System Flow

## 🚚 Delivery Flow

```
Scan di SPPG
↓
Status → diperjalanan
↓
Scan di sekolah
↓
Status → sampai
↓
Semua sekolah selesai
↓
Tugas selesai
↓
+1 spin roulette 🎰
```

---

## 🎰 Roulette Flow

```
User klik spin
↓
Backend cek spin
↓
Generate reward (weighted)
↓
Kurangi spin
↓
Return hasil
```

---

# 🧠 Tech Stack

* Node.js
* Express.js
* Prisma ORM
* MySQL
* express-session

---

# ⚠️ Important Notes

* Session **tidak dikelola Prisma**
* Semua logic penting ada di backend (anti cheat)
* Gunakan HTTPS untuk production
* Hindari spam request (rate limit)

---

# 💬 Key Concept

> Backend ini tidak hanya menyediakan API, tetapi juga mengelola business logic seperti validasi distribusi, state management, dan sistem reward secara terpusat.

---

# 🚀 Future Improvements

* Push Notification (FCM)
* Dashboard Admin
* Analytics & Reporting
* Leaderboard Reward

---

# 👨‍💻 Author

Developed for **SPPG Driver System** 🚀
* Nabil Aqila Putra 123230085
* Adib Fathani Awwab 123230104

---

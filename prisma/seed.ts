import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcrypt";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  database: process.env.DB_NAME!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 START SEEDING...");

  // =========================
  // RESET (urut dari child)
  // =========================
  // await prisma.scan_logs.deleteMany();
  // await prisma.tracking_logs.deleteMany();
  // await prisma.box_mbg.deleteMany();
  // await prisma.tugas_detail.deleteMany();
  // await prisma.tugas_driver.deleteMany();
  // await prisma.sekolah.deleteMany();
  // await prisma.sppg.deleteMany();
  // await prisma.users.deleteMany();

  // =========================
  // USERS
  // =========================
  const password = await bcrypt.hash("123456", 10);

  const driver = await prisma.users.create({
    data: {
      nama: "Driver Andi",
      no_telp: "0811111111",
      password_hash: password,
      role: "driver",
      gaji: 3000000,
      foto_profil: "Andi.jpg"
    },
  });

  await prisma.users.create({
    data: {
      nama: "Admin",
      no_telp: "0800000001",
      password_hash: password,
      role: "admin",
      foto_profil: "Andi.jpg"
    },
  });

  // =========================
  // SPPG
  // =========================
  const sppg = await prisma.sppg.create({
    data: {
      nama_sppg: "SPPG Pusat",
      alamat: "Jakarta",
      latitude: -6.2,
      longitude: 106.8,
    },
  });

  // =========================
  // SEKOLAH
  // =========================
  const sekolahList = await prisma.$transaction([
    prisma.sekolah.create({
      data: {
        nama_sekolah: "SMA 1 Jakarta",
        alamat: "Jakarta",
        latitude: -6.21,
        longitude: 106.81,
      },
    }),
    prisma.sekolah.create({
      data: {
        nama_sekolah: "SMA 2 Jakarta",
        alamat: "Jakarta",
        latitude: -6.22,
        longitude: 106.82,
      },
    }),
    prisma.sekolah.create({
      data: {
        nama_sekolah: "SD 3 Jakarta",
        alamat: "Jakarta",
        latitude: -6.23,
        longitude: 106.83,
      },
    }),
  ]);

  // =========================
  // TUGAS BERJALAN
  // =========================
  const tugasBerjalan = await prisma.tugas_driver.create({
    data: {
      driver_id: driver.id,
      sppg_id: sppg.id,
      tanggal_tugas: new Date(),
      status: "berjalan",
      jam_mulai: new Date(),
    },
  });

  const detailBerjalan = [];

  for (let i = 0; i < sekolahList.length; i++) {
    const d = await prisma.tugas_detail.create({
      data: {
        tugas_id: tugasBerjalan.id,
        sekolah_id: sekolahList[i].id,
        urutan_kirim: i + 1,
        target_mbg: 30,
        status: "pending",
      },
    });

    detailBerjalan.push(d);
  }

  // =========================
  // BOX BERJALAN
  // =========================
  let boxCounter = 1;

  for (const d of detailBerjalan) {
    for (let i = 0; i < 3; i++) {
      await prisma.box_mbg.create({
        data: {
          qr_code: `RUN-${boxCounter}`,
          tugas_detail_id: d.id,
          jumlah_porsi: 10,
          status: "diperjalanan",
          scanned_sppg_at: new Date(),
          scanned_sppg_lat: sppg.latitude,
          scanned_sppg_lng: sppg.longitude,
        },
      });

      boxCounter++;
    }
  }

  // =========================
  // TUGAS SELESAI
  // =========================
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const tugasSelesai = await prisma.tugas_driver.create({
    data: {
      driver_id: driver.id,
      sppg_id: sppg.id,
      tanggal_tugas: yesterday,
      status: "selesai",
      jam_mulai: yesterday,
      jam_selesai: new Date(),
    },
  });

  const detailSelesai = [];

  for (let i = 0; i < sekolahList.length; i++) {
    const d = await prisma.tugas_detail.create({
      data: {
        tugas_id: tugasSelesai.id,
        sekolah_id: sekolahList[i].id,
        urutan_kirim: i + 1,
        target_mbg: 30,
        status: "sampai",
        jam_sampai: new Date(),
      },
    });

    detailSelesai.push(d);
  }

  // =========================
  // BOX SELESAI + SCAN
  // =========================
  for (const d of detailSelesai) {
    for (let i = 0; i < 3; i++) {
      const sekolah = sekolahList[i];
      const box = await prisma.box_mbg.create({
        data: {
          qr_code: `DONE-${boxCounter}`,
          tugas_detail_id: d.id,
          jumlah_porsi: 10,
          status: "sampai",
          scanned_sppg_at: yesterday,
          scanned_sppg_lat: sppg.latitude,
          scanned_sppg_lng: sppg.longitude,
          scanned_sampai_at: new Date(),
          scanned_sampai_lat: sekolah.latitude,
          scanned_sampai_lng: sekolah.longitude,
          delivered_sekolah_id: d.sekolah_id,
        },
      });

      // scan log delivered
      await prisma.scan_logs.create({
        data: {
          box_id: box.id,
          user_id: driver.id,
          scan_type: "delivered",
          latitude: sekolah.latitude,
          longitude: sekolah.longitude,
        },
      });

      boxCounter++;
    }
  }

  // =========================
  // TRACKING LOGS (optional)
  // =========================
  for (let i = 0; i < 5; i++) {
    await prisma.tracking_logs.create({
      data: {
        tugas_id: tugasBerjalan.id,
        driver_id: driver.id,
        latitude: -6.2 + i * 0.001,
        longitude: 106.8 + i * 0.001,
        speed: 30,
        motion_status: "bergerak",
      },
    });
  }

  await prisma.notifikasi.createMany({
    data:[ 
      {
        user_id: driver.id,
        judul: "Tugas Baru",
        pesan: "Anda mendapatkan tugas pengantaran hari ini",
        jenis: "tugas"
      },
      {
        user_id: driver.id,
        judul: "Pemberitahuan",
        pesan: "Akan ada pemeriksaan kendaraan pada tiap Driver",
        jenis: "pengumuman"
      },
      {
        user_id: driver.id,
        judul: "Peringatan",
        pesan: "Dilarang melewati batas maksimal kecepatan kendaraan",
        jenis: "sanksi"
      },
    ]
  });

  console.log("✅ SEEDING DONE!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
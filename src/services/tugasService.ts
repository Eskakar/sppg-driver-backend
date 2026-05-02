import {prisma} from "../config/db.js";

//untuk search tugas yang sudah selesai
export const getHistoryTugas = async (search?: string) => {
    const whereClause: any = {
        status: "selesai",
    };
    const keyword = search?.trim();
    // kalau ada search
    if (keyword && keyword.length > 0) {
        whereClause.OR = [];
        const parsedDate = new Date(keyword);
        const isValidDate = !isNaN(parsedDate.getTime());
        if(isValidDate){
            whereClause.OR.push({
                tanggal_tugas: {
                    equals: new Date(keyword),
                }
            })
        }
        whereClause.OR.push({
            tugas_detail: {
            some: {
                sekolah: {
                nama_sekolah: {
                    contains: keyword,
                },
                },
            },
            },
        })
    }

    const tugas = await prisma.tugas_driver.findMany({
        where: whereClause,
        include: {
        tugas_detail: {
            include: {
            sekolah: true,
            },
        },
        },
        orderBy: {
        tanggal_tugas: "desc",
        },
    });

    return tugas.map((t) => ({
        id: Number(t.id),
        tanggal: t.tanggal_tugas,
        sekolah: t.tugas_detail.map((d) => d.sekolah.nama_sekolah),
    }));
};

//untuk membuka detail tugas yang sudah selesai 
export const getDetailTugasSelesai = async (tugasId: number) => {
    const tugas = await prisma.tugas_driver.findUnique({
        where: { id: tugasId },
        include: {
        tugas_detail: {
            include: {
            sekolah: true,
            box_mbg: true,
            },
        },
        },
    });

  if (!tugas) {
    throw new Error("Tugas tidak ditemukan");
  }

  // HITUNG DURASI
  let durasiMenit = 0;

  if (tugas.jam_mulai && tugas.jam_selesai) {
    durasiMenit =
        (new Date(tugas.jam_selesai).getTime() -
        new Date(tugas.jam_mulai).getTime()) /
        60000;
  }


  // HITUNG MBG
  let totalMBG = 0;
  let mbgSampai = 0;
  let mbgPerjalanan = 0;
  let mbgSppg = 0;

    for (const detail of tugas.tugas_detail) {
        for (const box of detail.box_mbg) {
            if(box.jumlah_porsi != null){
                totalMBG += box.jumlah_porsi;
                if (box.status === "sampai") {
                    mbgSampai += box.jumlah_porsi;
                } else if (box.status === "diperjalanan") {
                    mbgPerjalanan += box.jumlah_porsi;
                } else {
                    mbgSppg += box.jumlah_porsi;
            }}
        }
    }

  
  // LIST SEKOLAH
  
    const sekolahList = tugas.tugas_detail.map((d) => ({
        nama: d.sekolah.nama_sekolah,
        status: d.status,
        jam_sampai: d.jam_sampai,
    }));

    return {
        id: Number(tugas.id),
        tanggal: tugas.tanggal_tugas,
        status: tugas.status,
        durasi_menit: durasiMenit,

        total_mbg: totalMBG,
        mbg_sampai: mbgSampai,
        mbg_perjalanan: mbgPerjalanan,
        mbg_sppg: mbgSppg,

        sekolah: sekolahList,
    };
};

// mengambil 5 tugas yang sudah selesai
export const getHistoryPreview = async () => {
  const tugas = await prisma.tugas_driver.findMany({
    where: {
        status: "selesai",
    },
    include: {
        tugas_detail: {
            include: {
            sekolah: true,
            box_mbg: true,
            },
        },
    },
    orderBy: {
        tanggal_tugas: "desc",
    },
    take: 5, // limit 5 data
  });

  return tugas.map((t) => {
    // hitung total mbg
    let totalMBG = 0;

    for (const d of t.tugas_detail) {
        for (const box of d.box_mbg) {
                if(box.jumlah_porsi != null){
                    totalMBG += box.jumlah_porsi;
                }
        }
    }

    // format hari
    const date = new Date(t.tanggal_tugas);
    const hari = date.toLocaleDateString("id-ID", {
        weekday: "long",
    });

    return {
        id: Number(t.id),
        tanggal: t.tanggal_tugas,
        hari,
        jumlah_sekolah: t.tugas_detail.length,
        total_mbg: totalMBG,
    };
  });
};

//membuka detail tugas sedanga berlangsung
export const getCurrentTugas = async (driverId: number) => {
    const tugas = await prisma.tugas_driver.findFirst({
        where: {
        driver_id: driverId,
        status: "berjalan",
        },
        include: {
        tugas_detail: {
            include: {
            sekolah: true,
            box_mbg: true,
            },
            orderBy: {
            urutan_kirim: "asc",
            },
        },
        },
    });

    if (!tugas) {
        return null;
    }


    // HITUNG STATISTIK MBG
    let mbgSppg = 0;
    let mbgPerjalanan = 0;
    let mbgSampai = 0;

    for (const detail of tugas.tugas_detail) {
        for (const box of detail.box_mbg) {
        if (box.status === "di_sppg") {
            mbgSppg += box.jumlah_porsi ?? 0;
        } else if (box.status === "diperjalanan") {
            mbgPerjalanan += box.jumlah_porsi ?? 0;
        } else if (box.status === "sampai") {
            mbgSampai += box.jumlah_porsi ?? 0;
        }
        }
    }

    // ambil semua box dari tugas
    const allBoxes = await prisma.box_mbg.findMany({
    where: {
        tugas_detail: {
        tugas_id: tugas.id,
        },
    },
    });


    // PROGRESS (%)
    const total = mbgSppg + mbgPerjalanan + mbgSampai;
    const progress = total > 0 ? Math.round((mbgSampai / total) * 100) : 0;


    // LIST SEKOLAH
    const sekolah = tugas.tugas_detail.map((d) => {
        let sampai = 0;
    
        // for (const box of d.box_mbg) {
        //     if (box.status === "sampai") {
        //     sampai += box.jumlah_porsi ?? 0;
        //     }
        // }
        for (const box of allBoxes) {
            if (
            box.status === "sampai" &&
            Number(box.delivered_sekolah_id) === Number(d.sekolah_id)
            ) {
            sampai += box.jumlah_porsi ?? 0;
            }
        }

        return {
            id: Number(d.id),
            nama: d.sekolah.nama_sekolah,
            status: d.status,
            urutan: d.urutan_kirim,
            latitude: d.sekolah.latitude,
            longitude: d.sekolah.longitude,
            target_mbg: d.target_mbg,
            mbg_sampai: sampai,
            progress: `${sampai}/${d.target_mbg}`,
        };
    });

  return {
    id: Number(tugas.id),
    tanggal: tugas.tanggal_tugas,
    status: tugas.status,

    statistik: {
      mbg_sppg: mbgSppg,
      mbg_perjalanan: mbgPerjalanan,
      mbg_sampai: mbgSampai,
      total,
      progress,
    },

    sekolah,
  };
};

export const checkAndCompleteTugas = async (tugasId: bigint) => {
  // ambil semua detail sekolah
  const details = await prisma.tugas_detail.findMany({
    where: { tugas_id: tugasId },
    select: {
      id: true,
      status: true,
    },
  });

  if (details.length === 0) return false;

  // cek apakah semua sudah "sampai"
  const allDone = details.every((d) => d.status === "sampai");

  if (!allDone) return false;

  // cek dulu apakah sudah selesai (hindari double update)
  const tugas = await prisma.tugas_driver.findUnique({
    where: { id: tugasId },
    select: { status: true },
  });

  if (tugas?.status === "selesai") return true;

  // update tugas jadi selesai
  await prisma.tugas_driver.update({
    where: { id: tugasId },
    data: {
      status: "selesai",
      jam_selesai: new Date(),
    },
  });

  return true;
};
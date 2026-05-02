import { prisma } from "../config/db.js";

// daftar reward (harus sama urutan dengan frontend)
const rewards = [
  { label: "Sepeda Motor", weight: 1 },   // super rare
  { label: "Zonk", weight: 20 },
  { label: "Zonk", weight: 20 },
  { label: "Rp100.000", weight: 5 },
  { label: "Zonk", weight: 20 },
  { label: "Zonk", weight: 20 },
  { label: "Rp50.000", weight: 10 },
  { label: "Zonk", weight: 4 },
];

// ==========================
// GET SPIN USER
// ==========================
export const getSpin = async (userId: number) => {
  const data = await prisma.roulette_balance.findUnique({
    where: { user_id: BigInt(userId) },
  });

  return data?.spins ?? 0;
};

// ==========================
// ADD SPIN (DARI TUGAS)
// ==========================
export const addSpin = async (userId: number) => {
  const existing = await prisma.roulette_balance.findUnique({
    where: { user_id: BigInt(userId) },
  });

  if (existing) {
    await prisma.roulette_balance.update({
      where: { user_id: BigInt(userId) },
      data: {
        spins: { increment: 1 },
      },
    });
  } else {
    await prisma.roulette_balance.create({
      data: {
        user_id: BigInt(userId),
        spins: 1,
      },
    });
  }
};

// ==========================
// WEIGHTED RANDOM
// ==========================
const getRewardWithIndex = () => {
  const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.random() * totalWeight;

  for (let i = 0; i < rewards.length; i++) {
    if (rand < rewards[i].weight) {
      return {
        reward: rewards[i].label,
        index: i,
      };
    }
    rand -= rewards[i].weight;
  }

  return {
    reward: rewards[0].label,
    index: 0,
  };
};

// ==========================
// SPIN ROULETTE
// ==========================
export const spinRoulette = async (userId: number) => {
  const userIdBig = BigInt(userId);

  // ambil saldo spin
  const balance = await prisma.roulette_balance.findUnique({
    where: { user_id: userIdBig },
  });

  if (!balance || balance.spins <= 0) {
    throw new Error("Spin tidak tersedia");
  }

  // ambil reward dari backend
  const { reward, index } = getRewardWithIndex();

  // transaksi biar aman (anti race condition)
  const result = await prisma.$transaction(async (tx) => {
    // cek ulang dalam transaksi
    const latest = await tx.roulette_balance.findUnique({
      where: { user_id: userIdBig },
    });

    if (!latest || latest.spins <= 0) {
      throw new Error("Spin habis");
    }

    // kurangi spin
    await tx.roulette_balance.update({
      where: { user_id: userIdBig },
      data: {
        spins: { decrement: 1 },
      },
    });

    // bonus spin
    if (reward === "Bonus Spin") {
      await tx.roulette_balance.update({
        where: { user_id: userIdBig },
        data: {
          spins: { increment: 1 },
        },
      });
    }

    // simpan history
    await tx.roulette_history.create({
      data: {
        user_id: userIdBig,
        reward,
      },
    });

    return true;
  });

  // ambil sisa spin terbaru
  const remaining = await getSpin(userId);

  return {
    reward,
    index,
    remaining_spins: remaining,
  };
};
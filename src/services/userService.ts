import {prisma} from "../config/db";

export const getCurrentUser = async (userId: number) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
        id: true,
        nama: true,
        no_telp: true,
        role: true,
        gaji: true,
        foto_profil: true,
        },
    });

    if (!user) {
        throw new Error("User tidak ditemukan");
    }

    return user;
};
/*
  Warnings:

  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `sessions` DROP FOREIGN KEY `fk_sessions_user`;

-- DropTable
DROP TABLE `sessions`;

-- CreateTable
CREATE TABLE `roulette_balance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `spins` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roulette_balance_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bukti_pengiriman` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tugas_id` BIGINT NOT NULL,
    `tugas_detail_id` BIGINT NOT NULL,
    `sekolah_id` BIGINT NOT NULL,
    `driver_id` BIGINT NOT NULL,
    `is_valid` BOOLEAN NOT NULL,
    `reason` TEXT NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `foto_path` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `bukti_pengiriman_tugas_id_idx`(`tugas_id`),
    INDEX `bukti_pengiriman_driver_id_idx`(`driver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roulette_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `reward` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roulette_balance` ADD CONSTRAINT `roulette_balance_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bukti_pengiriman` ADD CONSTRAINT `bukti_pengiriman_tugas_detail_id_fkey` FOREIGN KEY (`tugas_detail_id`) REFERENCES `tugas_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bukti_pengiriman` ADD CONSTRAINT `bukti_pengiriman_sekolah_id_fkey` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bukti_pengiriman` ADD CONSTRAINT `bukti_pengiriman_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roulette_history` ADD CONSTRAINT `roulette_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

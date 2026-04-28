-- CreateTable
CREATE TABLE `box_mbg` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `qr_code` VARCHAR(100) NOT NULL,
    `tugas_detail_id` BIGINT NOT NULL,
    `status` ENUM('di_sppg', 'diperjalanan', 'sampai') NULL DEFAULT 'di_sppg',
    `jumlah_porsi` INTEGER NULL DEFAULT 0,
    `scanned_sppg_at` DATETIME(0) NULL,
    `scanned_sampai_at` DATETIME(0) NULL,
    `scanned_sppg_lat` DOUBLE NULL,
    `scanned_sppg_lng` DOUBLE NULL,
    `scanned_sampai_lat` DOUBLE NULL,
    `scanned_sampai_lng` DOUBLE NULL,
    `delivered_sekolah_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `qr_code`(`qr_code`),
    INDEX `idx_box_mbg_tugas_detail`(`tugas_detail_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `pesan` TEXT NOT NULL,
    `rating` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_feedback_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifikasi` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `jenis` ENUM('pengumuman', 'tugas', 'sanksi') NOT NULL,
    `judul` VARCHAR(100) NULL,
    `pesan` TEXT NULL,
    `is_read` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_notifikasi_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scan_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `box_id` BIGINT NOT NULL,
    `user_id` BIGINT NULL,
    `scan_type` ENUM('pickup', 'delivered') NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `scanned_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `device_info` TEXT NULL,

    INDEX `fk_scan_logs_user`(`user_id`),
    INDEX `idx_scan_logs_box`(`box_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sekolah` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_sekolah` VARCHAR(100) NOT NULL,
    `alamat` TEXT NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `jenis_tujuan` ENUM('sekolah', 'posyandu') NULL DEFAULT 'sekolah',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token` TEXT NOT NULL,
    `expired_at` DATETIME(0) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_sessions_token`(`token`(255)),
    INDEX `fk_sessions_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sppg` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_sppg` VARCHAR(100) NOT NULL,
    `alamat` TEXT NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracking_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tugas_id` BIGINT NOT NULL,
    `driver_id` BIGINT NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `speed` DOUBLE NULL,
    `motion_status` ENUM('diam', 'bergerak') NULL DEFAULT 'diam',
    `recorded_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_tracking_logs_tugas`(`tugas_id`),
    INDEX `idx_tracking_driver`(`driver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tugas_detail` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tugas_id` BIGINT NOT NULL,
    `sekolah_id` BIGINT NOT NULL,
    `urutan_kirim` INTEGER NOT NULL,
    `status` ENUM('pending', 'sampai') NULL DEFAULT 'pending',
    `jam_sampai` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `target_mbg` INTEGER NULL DEFAULT 0,

    INDEX `fk_tugas_detail_sekolah`(`sekolah_id`),
    INDEX `idx_tugas_detail_tugas`(`tugas_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tugas_driver` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `driver_id` BIGINT NOT NULL,
    `sppg_id` BIGINT NULL,
    `tanggal_tugas` DATE NOT NULL,
    `status` ENUM('pending', 'berjalan', 'selesai') NULL DEFAULT 'pending',
    `jam_mulai` DATETIME(0) NULL,
    `jam_selesai` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_tugas_driver_sppg`(`sppg_id`),
    INDEX `idx_tugas_driver_driver`(`driver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `nik` VARCHAR(50) NULL,
    `no_telp` VARCHAR(20) NULL,
    `password_hash` TEXT NOT NULL,
    `role` ENUM('admin', 'driver', 'dapur') NOT NULL,
    `foto_profil` TEXT NULL,
    `biometric_enabled` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `gaji` DECIMAL(15, 2) NULL DEFAULT 0.00,

    UNIQUE INDEX `nik`(`nik`),
    INDEX `idx_users_role`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `box_mbg` ADD CONSTRAINT `fk_box_mbg_tugas_detail` FOREIGN KEY (`tugas_detail_id`) REFERENCES `tugas_detail`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `fk_notifikasi_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `scan_logs` ADD CONSTRAINT `fk_scan_logs_box` FOREIGN KEY (`box_id`) REFERENCES `box_mbg`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `scan_logs` ADD CONSTRAINT `fk_scan_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tracking_logs` ADD CONSTRAINT `fk_tracking_logs_driver` FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tracking_logs` ADD CONSTRAINT `fk_tracking_logs_tugas` FOREIGN KEY (`tugas_id`) REFERENCES `tugas_driver`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tugas_detail` ADD CONSTRAINT `fk_tugas_detail_sekolah` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tugas_detail` ADD CONSTRAINT `fk_tugas_detail_tugas` FOREIGN KEY (`tugas_id`) REFERENCES `tugas_driver`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tugas_driver` ADD CONSTRAINT `fk_tugas_driver_sppg` FOREIGN KEY (`sppg_id`) REFERENCES `sppg`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tugas_driver` ADD CONSTRAINT `fk_tugas_driver_user` FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

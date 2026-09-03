-- AlterTable
ALTER TABLE `ProductImage`
    ADD COLUMN `publicId` VARCHAR(191) NULL,
    ADD COLUMN `assetId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ProductImage_publicId_key` ON `ProductImage`(`publicId`);

-- CreateIndex
CREATE UNIQUE INDEX `ProductImage_assetId_key` ON `ProductImage`(`assetId`);

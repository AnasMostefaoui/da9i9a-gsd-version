-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'UNINSTALLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DataRetention" AS ENUM ('DELETE_AFTER_30_DAYS', 'KEEP_FOREVER');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ALIEXPRESS', 'AMAZON');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('IMPORTING', 'IMPORTED', 'ENHANCED', 'PUSHING', 'PUSHED', 'FAILED');

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "salla_id" INTEGER NOT NULL,
    "store_name" TEXT NOT NULL,
    "store_url" TEXT NOT NULL,
    "email" TEXT,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "plan" TEXT,
    "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
    "data_retention" "DataRetention" NOT NULL DEFAULT 'DELETE_AFTER_30_DAYS',
    "uninstalled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "title_ar" TEXT,
    "title_en" TEXT,
    "description_ar" TEXT,
    "description_en" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selected_images" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "enhanced_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ProductStatus" NOT NULL DEFAULT 'IMPORTED',
    "salla_product_id" INTEGER,
    "pushed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_salla_id_key" ON "merchants"("salla_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

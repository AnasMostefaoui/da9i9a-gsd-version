-- AlterTable
ALTER TABLE "products" ADD COLUMN     "content_lang" TEXT NOT NULL DEFAULT 'ar',
ADD COLUMN     "landing_page_content" JSONB;

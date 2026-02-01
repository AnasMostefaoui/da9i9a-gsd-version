-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "webhook_history" (
    "id" TEXT NOT NULL,
    "merchant_salla_id" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "webhook_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_history_merchant_salla_id_idx" ON "webhook_history"("merchant_salla_id");

-- CreateIndex
CREATE INDEX "webhook_history_event_idx" ON "webhook_history"("event");

-- CreateIndex
CREATE INDEX "webhook_history_received_at_idx" ON "webhook_history"("received_at");

/*
  Warnings:

  - A unique constraint covering the columns `[shop_id,legacy_line_key]` on the table `repair_order_labor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shop_id,legacy_line_key]` on the table `repair_order_parts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `legacy_line_key` to the `repair_order_labor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legacy_line_key` to the `repair_order_parts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "repair_order_labor" ADD COLUMN     "legacy_line_key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "repair_order_parts" ADD COLUMN     "legacy_line_key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "repair_orders" ADD COLUMN     "estimated_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "labor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "parts_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "raw_legacy_order_parts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID NOT NULL,
    "legacy_import_run_id" UUID NOT NULL,
    "legacy_ro_no" TEXT,
    "legacy_custno" TEXT,
    "legacy_carno" TEXT,
    "legacy_row_key" TEXT NOT NULL,
    "raw_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_legacy_order_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_legacy_order_labor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID NOT NULL,
    "legacy_import_run_id" UUID NOT NULL,
    "legacy_ro_no" TEXT,
    "legacy_custno" TEXT,
    "legacy_carno" TEXT,
    "legacy_row_key" TEXT NOT NULL,
    "raw_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_legacy_order_labor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_legacy_order_parts_shop_id_legacy_ro_no_idx" ON "raw_legacy_order_parts"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "raw_legacy_order_parts_shop_id_legacy_custno_idx" ON "raw_legacy_order_parts"("shop_id", "legacy_custno");

-- CreateIndex
CREATE INDEX "raw_legacy_order_parts_shop_id_legacy_carno_idx" ON "raw_legacy_order_parts"("shop_id", "legacy_carno");

-- CreateIndex
CREATE INDEX "raw_legacy_order_parts_legacy_import_run_id_idx" ON "raw_legacy_order_parts"("legacy_import_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "raw_legacy_order_parts_shop_id_legacy_row_key_key" ON "raw_legacy_order_parts"("shop_id", "legacy_row_key");

-- CreateIndex
CREATE INDEX "raw_legacy_order_labor_shop_id_legacy_ro_no_idx" ON "raw_legacy_order_labor"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "raw_legacy_order_labor_shop_id_legacy_custno_idx" ON "raw_legacy_order_labor"("shop_id", "legacy_custno");

-- CreateIndex
CREATE INDEX "raw_legacy_order_labor_shop_id_legacy_carno_idx" ON "raw_legacy_order_labor"("shop_id", "legacy_carno");

-- CreateIndex
CREATE INDEX "raw_legacy_order_labor_legacy_import_run_id_idx" ON "raw_legacy_order_labor"("legacy_import_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "raw_legacy_order_labor_shop_id_legacy_row_key_key" ON "raw_legacy_order_labor"("shop_id", "legacy_row_key");

-- CreateIndex
CREATE UNIQUE INDEX "repair_order_labor_shop_id_legacy_line_key_key" ON "repair_order_labor"("shop_id", "legacy_line_key");

-- CreateIndex
CREATE UNIQUE INDEX "repair_order_parts_shop_id_legacy_line_key_key" ON "repair_order_parts"("shop_id", "legacy_line_key");

-- AddForeignKey
ALTER TABLE "raw_legacy_order_parts" ADD CONSTRAINT "raw_legacy_order_parts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_legacy_order_parts" ADD CONSTRAINT "raw_legacy_order_parts_legacy_import_run_id_fkey" FOREIGN KEY ("legacy_import_run_id") REFERENCES "legacy_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_legacy_order_labor" ADD CONSTRAINT "raw_legacy_order_labor_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_legacy_order_labor" ADD CONSTRAINT "raw_legacy_order_labor_legacy_import_run_id_fkey" FOREIGN KEY ("legacy_import_run_id") REFERENCES "legacy_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[shop_id,legacy_ro_no]` on the table `accounts_receivable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shop_id,legacy_line_key]` on the table `invoice_labor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shop_id,legacy_line_key]` on the table `invoice_parts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `legacy_line_key` to the `invoice_labor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legacy_line_key` to the `invoice_parts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoice_labor" ADD COLUMN     "legacy_line_key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoice_parts" ADD COLUMN     "legacy_line_key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_shop_id_legacy_ro_no_key" ON "accounts_receivable"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_labor_shop_id_legacy_line_key_key" ON "invoice_labor"("shop_id", "legacy_line_key");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_parts_shop_id_legacy_line_key_key" ON "invoice_parts"("shop_id", "legacy_line_key");

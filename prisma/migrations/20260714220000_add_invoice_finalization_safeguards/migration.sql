ALTER TABLE "invoices"
ADD COLUMN "repair_order_number" INTEGER,
ADD COLUMN "shop_snapshot" JSONB,
ADD COLUMN "customer_snapshot" JSONB,
ADD COLUMN "vehicle_snapshot" JSONB;

CREATE UNIQUE INDEX "invoices_repair_order_id_key"
ON "invoices"("repair_order_id");

CREATE UNIQUE INDEX "invoices_shop_id_repair_order_number_key"
ON "invoices"("shop_id", "repair_order_number");

CREATE UNIQUE INDEX "accounts_receivable_invoice_id_key"
ON "accounts_receivable"("invoice_id");

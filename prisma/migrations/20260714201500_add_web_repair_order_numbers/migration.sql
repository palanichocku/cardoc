ALTER TABLE "shops"
ADD COLUMN "next_repair_order_number" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "repair_orders"
ADD COLUMN "repair_order_number" INTEGER;

UPDATE "shops" AS shop
SET "next_repair_order_number" = COALESCE((
  SELECT MAX("legacy_ro_no"::INTEGER) + 1
  FROM "repair_orders"
  WHERE "shop_id" = shop."id"
    AND "legacy_ro_no" ~ '^[0-9]+$'
), 1);

CREATE UNIQUE INDEX "repair_orders_shop_id_repair_order_number_key"
ON "repair_orders"("shop_id", "repair_order_number");

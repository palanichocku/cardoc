-- CreateTable
CREATE TABLE "raw_legacy_final" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID NOT NULL,
    "legacy_import_run_id" UUID NOT NULL,
    "legacy_ro_no" TEXT,
    "legacy_custno" TEXT,
    "legacy_carno" TEXT,
    "raw_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_legacy_final_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_legacy_labor_final" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID NOT NULL,
    "legacy_import_run_id" UUID NOT NULL,
    "legacy_ro_no" TEXT,
    "legacy_custno" TEXT,
    "legacy_carno" TEXT,
    "raw_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_legacy_labor_final_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_legacy_ar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID NOT NULL,
    "legacy_import_run_id" UUID NOT NULL,
    "legacy_ro_no" TEXT,
    "legacy_custno" TEXT,
    "legacy_carno" TEXT,
    "raw_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_legacy_ar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_legacy_final_shop_id_legacy_ro_no_idx" ON "raw_legacy_final"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "raw_legacy_final_shop_id_legacy_custno_idx" ON "raw_legacy_final"("shop_id", "legacy_custno");

-- CreateIndex
CREATE INDEX "raw_legacy_final_legacy_import_run_id_idx" ON "raw_legacy_final"("legacy_import_run_id");

-- CreateIndex
CREATE INDEX "raw_legacy_labor_final_shop_id_legacy_ro_no_idx" ON "raw_legacy_labor_final"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "raw_legacy_labor_final_shop_id_legacy_custno_idx" ON "raw_legacy_labor_final"("shop_id", "legacy_custno");

-- CreateIndex
CREATE INDEX "raw_legacy_labor_final_legacy_import_run_id_idx" ON "raw_legacy_labor_final"("legacy_import_run_id");

-- CreateIndex
CREATE INDEX "raw_legacy_ar_shop_id_legacy_ro_no_idx" ON "raw_legacy_ar"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "raw_legacy_ar_shop_id_legacy_custno_idx" ON "raw_legacy_ar"("shop_id", "legacy_custno");

-- CreateIndex
CREATE INDEX "raw_legacy_ar_legacy_import_run_id_idx" ON "raw_legacy_ar"("legacy_import_run_id");

-- AddForeignKey
ALTER TABLE "raw_legacy_final" ADD CONSTRAINT "raw_legacy_final_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_legacy_final" ADD CONSTRAINT "raw_legacy_final_legacy_import_run_id_fkey" FOREIGN KEY ("legacy_import_run_id") REFERENCES "legacy_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_legacy_labor_final" ADD CONSTRAINT "raw_legacy_labor_final_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_legacy_labor_final" ADD CONSTRAINT "raw_legacy_labor_final_legacy_import_run_id_fkey" FOREIGN KEY ("legacy_import_run_id") REFERENCES "legacy_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_legacy_ar" ADD CONSTRAINT "raw_legacy_ar_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_legacy_ar" ADD CONSTRAINT "raw_legacy_ar_legacy_import_run_id_fkey" FOREIGN KEY ("legacy_import_run_id") REFERENCES "legacy_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "shops" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "legacy_custno" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "vin" TEXT,
    "license_plate" TEXT,
    "legacy_carno" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_orders" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "assigned_employee_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "odometer" INTEGER,
    "concern" TEXT,
    "notes" TEXT,
    "legacy_ro_no" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_order_parts" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "repair_order_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "part_number" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "legacy_ro_no" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_order_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_order_labor" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "repair_order_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "hourly_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "legacy_ro_no" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_order_labor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "repair_order_id" UUID,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "invoice_date" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "legacy_ro_no" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_parts" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "part_number" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "legacy_ro_no" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_labor" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "hourly_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "legacy_ro_no" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_labor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "invoice_id" UUID,
    "customer_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "legacy_ro_no" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "invoice_id" UUID,
    "customer_id" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "due_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "legacy_ro_no" TEXT,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "legacy_source_table" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_import_runs" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source_label" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "records_processed" INTEGER NOT NULL DEFAULT 0,
    "records_imported" INTEGER NOT NULL DEFAULT 0,
    "records_failed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_import_errors" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "import_run_id" UUID NOT NULL,
    "legacy_source_table" TEXT,
    "legacy_record_id" TEXT,
    "error_code" TEXT,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legacy_import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_legacy_custno_idx" ON "customers"("legacy_custno");

-- CreateIndex
CREATE INDEX "customers_shop_id_display_name_idx" ON "customers"("shop_id", "display_name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_shop_id_legacy_custno_key" ON "customers"("shop_id", "legacy_custno");

-- CreateIndex
CREATE INDEX "vehicles_legacy_carno_idx" ON "vehicles"("legacy_carno");

-- CreateIndex
CREATE INDEX "vehicles_shop_id_customer_id_idx" ON "vehicles"("shop_id", "customer_id");

-- CreateIndex
CREATE INDEX "vehicles_shop_id_vin_idx" ON "vehicles"("shop_id", "vin");

-- CreateIndex
CREATE INDEX "vehicles_shop_id_license_plate_idx" ON "vehicles"("shop_id", "license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_shop_id_legacy_carno_key" ON "vehicles"("shop_id", "legacy_carno");

-- CreateIndex
CREATE INDEX "repair_orders_legacy_ro_no_idx" ON "repair_orders"("legacy_ro_no");

-- CreateIndex
CREATE INDEX "repair_orders_shop_id_status_idx" ON "repair_orders"("shop_id", "status");

-- CreateIndex
CREATE INDEX "repair_orders_customer_id_idx" ON "repair_orders"("customer_id");

-- CreateIndex
CREATE INDEX "repair_orders_vehicle_id_idx" ON "repair_orders"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "repair_orders_shop_id_legacy_ro_no_key" ON "repair_orders"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "repair_order_parts_repair_order_id_idx" ON "repair_order_parts"("repair_order_id");

-- CreateIndex
CREATE INDEX "repair_order_parts_shop_id_legacy_ro_no_idx" ON "repair_order_parts"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "repair_order_labor_repair_order_id_idx" ON "repair_order_labor"("repair_order_id");

-- CreateIndex
CREATE INDEX "repair_order_labor_shop_id_legacy_ro_no_idx" ON "repair_order_labor"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "invoices_legacy_ro_no_idx" ON "invoices"("legacy_ro_no");

-- CreateIndex
CREATE INDEX "invoices_shop_id_invoice_date_idx" ON "invoices"("shop_id", "invoice_date");

-- CreateIndex
CREATE INDEX "invoices_shop_id_status_idx" ON "invoices"("shop_id", "status");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_shop_id_legacy_ro_no_key" ON "invoices"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "invoice_parts_invoice_id_idx" ON "invoice_parts"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_parts_shop_id_legacy_ro_no_idx" ON "invoice_parts"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "invoice_labor_invoice_id_idx" ON "invoice_labor"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_labor_shop_id_legacy_ro_no_idx" ON "invoice_labor"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "payments_shop_id_paid_at_idx" ON "payments"("shop_id", "paid_at");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_shop_id_legacy_ro_no_idx" ON "payments"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "accounts_receivable_shop_id_status_idx" ON "accounts_receivable"("shop_id", "status");

-- CreateIndex
CREATE INDEX "accounts_receivable_customer_id_idx" ON "accounts_receivable"("customer_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_shop_id_legacy_ro_no_idx" ON "accounts_receivable"("shop_id", "legacy_ro_no");

-- CreateIndex
CREATE INDEX "accounts_receivable_legacy_ro_no_idx" ON "accounts_receivable"("legacy_ro_no");

-- CreateIndex
CREATE INDEX "employees_shop_id_active_idx" ON "employees"("shop_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "employees_shop_id_email_key" ON "employees"("shop_id", "email");

-- CreateIndex
CREATE INDEX "legacy_import_runs_shop_id_created_at_idx" ON "legacy_import_runs"("shop_id", "created_at");

-- CreateIndex
CREATE INDEX "legacy_import_errors_import_run_id_idx" ON "legacy_import_errors"("import_run_id");

-- CreateIndex
CREATE INDEX "legacy_import_errors_shop_id_legacy_source_table_idx" ON "legacy_import_errors"("shop_id", "legacy_source_table");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_parts" ADD CONSTRAINT "repair_order_parts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_parts" ADD CONSTRAINT "repair_order_parts_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_labor" ADD CONSTRAINT "repair_order_labor_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_labor" ADD CONSTRAINT "repair_order_labor_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_parts" ADD CONSTRAINT "invoice_parts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_parts" ADD CONSTRAINT "invoice_parts_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_labor" ADD CONSTRAINT "invoice_labor_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_labor" ADD CONSTRAINT "invoice_labor_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_import_runs" ADD CONSTRAINT "legacy_import_runs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_import_errors" ADD CONSTRAINT "legacy_import_errors_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_import_errors" ADD CONSTRAINT "legacy_import_errors_import_run_id_fkey" FOREIGN KEY ("import_run_id") REFERENCES "legacy_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

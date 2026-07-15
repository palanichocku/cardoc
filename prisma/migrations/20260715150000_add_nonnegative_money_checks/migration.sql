-- Imported invoice components may contain legitimate credits/negative adjustments.
-- Web-created records remain strictly nonnegative. Constraints are added without a
-- table rewrite, then validated against the audited existing data in this migration.
ALTER TABLE "shops" ADD CONSTRAINT "shops_default_tax_rate_nonnegative" CHECK ("default_tax_rate" >= 0) NOT VALID;
ALTER TABLE "shops" ADD CONSTRAINT "shops_default_labor_rate_nonnegative" CHECK ("default_labor_rate" >= 0) NOT VALID;
ALTER TABLE "canned_services" ADD CONSTRAINT "canned_services_hours_nonnegative" CHECK ("default_hours" >= 0) NOT VALID;
ALTER TABLE "canned_services" ADD CONSTRAINT "canned_services_rate_nonnegative" CHECK ("default_labor_rate" >= 0) NOT VALID;
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_totals_nonnegative" CHECK ("parts_total" >= 0 AND "labor_total" >= 0 AND "tax_total" >= 0 AND "estimated_total" >= 0) NOT VALID;
ALTER TABLE "repair_order_parts" ADD CONSTRAINT "repair_order_parts_money_nonnegative" CHECK ("quantity" >= 0 AND "unit_price" >= 0) NOT VALID;
ALTER TABLE "repair_order_labor" ADD CONSTRAINT "repair_order_labor_money_nonnegative" CHECK ("hours" >= 0 AND "hourly_rate" >= 0) NOT VALID;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_totals_nonnegative" CHECK (
  "subtotal" >= 0 AND "tax_total" >= 0 AND "total" >= 0 AND "paid_total" >= 0
  AND ("legacy_source_table" IS NOT NULL OR ("parts_total" >= 0 AND "labor_total" >= 0))
) NOT VALID;
ALTER TABLE "invoice_parts" ADD CONSTRAINT "invoice_parts_money_nonnegative" CHECK (
  "legacy_source_table" IS NOT NULL OR ("quantity" >= 0 AND "unit_price" >= 0)
) NOT VALID;
ALTER TABLE "invoice_labor" ADD CONSTRAINT "invoice_labor_money_nonnegative" CHECK (
  "legacy_source_table" IS NOT NULL OR ("hours" >= 0 AND "hourly_rate" >= 0)
) NOT VALID;
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_nonnegative" CHECK ("amount" >= 0) NOT VALID;
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_balance_nonnegative" CHECK ("balance" >= 0) NOT VALID;

ALTER TABLE "shops" VALIDATE CONSTRAINT "shops_default_tax_rate_nonnegative";
ALTER TABLE "shops" VALIDATE CONSTRAINT "shops_default_labor_rate_nonnegative";
ALTER TABLE "canned_services" VALIDATE CONSTRAINT "canned_services_hours_nonnegative";
ALTER TABLE "canned_services" VALIDATE CONSTRAINT "canned_services_rate_nonnegative";
ALTER TABLE "repair_orders" VALIDATE CONSTRAINT "repair_orders_totals_nonnegative";
ALTER TABLE "repair_order_parts" VALIDATE CONSTRAINT "repair_order_parts_money_nonnegative";
ALTER TABLE "repair_order_labor" VALIDATE CONSTRAINT "repair_order_labor_money_nonnegative";
ALTER TABLE "invoices" VALIDATE CONSTRAINT "invoices_totals_nonnegative";
ALTER TABLE "invoice_parts" VALIDATE CONSTRAINT "invoice_parts_money_nonnegative";
ALTER TABLE "invoice_labor" VALIDATE CONSTRAINT "invoice_labor_money_nonnegative";
ALTER TABLE "payments" VALIDATE CONSTRAINT "payments_amount_nonnegative";
ALTER TABLE "accounts_receivable" VALIDATE CONSTRAINT "accounts_receivable_balance_nonnegative";

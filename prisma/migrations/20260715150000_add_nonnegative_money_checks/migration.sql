-- PROPOSED ONLY: do not apply until existing values have been audited.
-- NOT VALID preserves existing rows while enforcing these checks on new writes;
-- each constraint can be validated separately after a count-only legacy audit.
ALTER TABLE "shops" ADD CONSTRAINT "shops_default_tax_rate_nonnegative" CHECK ("default_tax_rate" >= 0) NOT VALID;
ALTER TABLE "shops" ADD CONSTRAINT "shops_default_labor_rate_nonnegative" CHECK ("default_labor_rate" >= 0) NOT VALID;
ALTER TABLE "canned_services" ADD CONSTRAINT "canned_services_hours_nonnegative" CHECK ("default_hours" >= 0) NOT VALID;
ALTER TABLE "canned_services" ADD CONSTRAINT "canned_services_rate_nonnegative" CHECK ("default_labor_rate" >= 0) NOT VALID;
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_totals_nonnegative" CHECK ("parts_total" >= 0 AND "labor_total" >= 0 AND "tax_total" >= 0 AND "estimated_total" >= 0) NOT VALID;
ALTER TABLE "repair_order_parts" ADD CONSTRAINT "repair_order_parts_money_nonnegative" CHECK ("quantity" >= 0 AND "unit_price" >= 0) NOT VALID;
ALTER TABLE "repair_order_labor" ADD CONSTRAINT "repair_order_labor_money_nonnegative" CHECK ("hours" >= 0 AND "hourly_rate" >= 0) NOT VALID;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_totals_nonnegative" CHECK ("parts_total" >= 0 AND "labor_total" >= 0 AND "subtotal" >= 0 AND "tax_total" >= 0 AND "total" >= 0 AND "paid_total" >= 0) NOT VALID;
ALTER TABLE "invoice_parts" ADD CONSTRAINT "invoice_parts_money_nonnegative" CHECK ("quantity" >= 0 AND "unit_price" >= 0) NOT VALID;
ALTER TABLE "invoice_labor" ADD CONSTRAINT "invoice_labor_money_nonnegative" CHECK ("hours" >= 0 AND "hourly_rate" >= 0) NOT VALID;
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_nonnegative" CHECK ("amount" >= 0) NOT VALID;
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_balance_nonnegative" CHECK ("balance" >= 0) NOT VALID;

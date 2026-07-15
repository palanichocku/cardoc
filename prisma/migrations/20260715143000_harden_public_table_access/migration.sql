-- Car Doc application tables are server-only. Supabase browser clients use Auth only.
-- RLS has no permissive policies, and PostgREST roles receive no direct table access.
ALTER TABLE "public"."shops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."canned_services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."staff_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."shop_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."repair_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."repair_order_parts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."repair_order_labor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invoice_parts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invoice_labor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."accounts_receivable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legacy_import_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."raw_legacy_customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."raw_legacy_vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."raw_legacy_final" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."raw_legacy_labor_final" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."raw_legacy_ar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."raw_legacy_order_parts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."raw_legacy_order_labor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legacy_import_errors" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  "public"."shops",
  "public"."canned_services",
  "public"."audit_logs",
  "public"."staff_invites",
  "public"."shop_memberships",
  "public"."customers",
  "public"."vehicles",
  "public"."repair_orders",
  "public"."repair_order_parts",
  "public"."repair_order_labor",
  "public"."invoices",
  "public"."invoice_parts",
  "public"."invoice_labor",
  "public"."payments",
  "public"."accounts_receivable",
  "public"."employees",
  "public"."legacy_import_runs",
  "public"."raw_legacy_customers",
  "public"."raw_legacy_vehicles",
  "public"."raw_legacy_final",
  "public"."raw_legacy_labor_final",
  "public"."raw_legacy_ar",
  "public"."raw_legacy_order_parts",
  "public"."raw_legacy_order_labor",
  "public"."legacy_import_errors"
FROM anon, authenticated;

-- Prevent later Prisma-created public tables/sequences from inheriting API access.
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM anon, authenticated;

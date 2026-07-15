ALTER TABLE "audit_logs"
  ADD COLUMN "actor_email" TEXT,
  ADD COLUMN "actor_role" TEXT,
  ADD COLUMN "entity_label" TEXT,
  ADD COLUMN "entity_href" TEXT,
  ADD COLUMN "context_summary" TEXT;

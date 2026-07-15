CREATE TABLE "staff_invites" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "shop_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role" "ShopMembershipRole" NOT NULL DEFAULT 'STAFF',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "invited_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_invites_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "staff_invites_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "staff_invites_shop_id_email_key" ON "staff_invites"("shop_id", "email");
CREATE INDEX "staff_invites_shop_id_status_idx" ON "staff_invites"("shop_id", "status");

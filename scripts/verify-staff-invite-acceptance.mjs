import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Database configuration is unavailable.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const rollback = new Error("ROLLBACK_VERIFICATION");

try {
  const realShop = await prisma.shop.findFirst({ select: { id: true } });
  if (!realShop) throw new Error("Shop is unavailable.");
  const [importedCustomersBefore, importedVehiclesBefore, importedInvoicesBefore, importedOrdersBefore] = await Promise.all([
    prisma.customer.count({ where: { legacySourceTable: { not: null } } }),
    prisma.vehicle.count({ where: { legacySourceTable: { not: null } } }),
    prisma.invoice.count({ where: { legacySourceTable: { not: null } } }),
    prisma.repairOrder.count({ where: { legacySourceTable: { not: null } } }),
  ]);
  const results = { pending: 0, membership: 0, accepted: 0, duplicateBlocked: 0, wrongEmailBlocked: 0, revokedBlocked: 0, audits: 0 };
  try {
    await prisma.$transaction(async (transaction) => {
      const shop = await transaction.shop.create({ data: { name: "Invite verification shop" }, select: { id: true } });
      const userId = randomUUID();
      const invite = await transaction.staffInvite.create({ data: { shopId: shop.id, email: "invite-verification@example.invalid", role: "STAFF" }, select: { id: true, email: true, role: true, status: true } });
      results.pending = Number(invite.status === "pending");
      const match = invite.email.toLowerCase() === "invite-verification@example.invalid";
      if (!match) throw new Error("Verification invite did not match.");
      const membership = await transaction.shopMembership.create({ data: { shopId: shop.id, userId, role: invite.role }, select: { id: true } });
      results.membership = Number(Boolean(membership.id));
      const accepted = await transaction.staffInvite.update({ where: { id: invite.id }, data: { status: "accepted" }, select: { status: true } });
      results.accepted = Number(accepted.status === "accepted");
      await transaction.auditLog.create({ data: { shopId: shop.id, userId, action: "staff_invite_accepted", entityType: "staff_invite", entityId: invite.id, metadata: { membershipId: membership.id } } });
      results.duplicateBlocked = Number(await transaction.shopMembership.count({ where: { shopId: shop.id, userId } }) === 1 && await transaction.staffInvite.count({ where: { id: invite.id, status: "pending" } }) === 0);
      const wrong = await transaction.staffInvite.create({ data: { shopId: shop.id, email: "different@example.invalid", role: "STAFF" }, select: { id: true } });
      results.wrongEmailBlocked = Number(await transaction.staffInvite.count({ where: { id: wrong.id, status: "pending", email: { equals: "wrong@example.invalid", mode: "insensitive" } } }) === 0);
      const revoked = await transaction.staffInvite.create({ data: { shopId: shop.id, email: "revoked@example.invalid", role: "STAFF", status: "revoked" }, select: { id: true } });
      results.revokedBlocked = Number(await transaction.staffInvite.count({ where: { id: revoked.id, status: "pending" } }) === 0);
      await transaction.auditLog.create({ data: { shopId: shop.id, action: "staff_invite_revoked", entityType: "staff_invite", entityId: revoked.id, metadata: { source: "web" } } });
      results.audits = await transaction.auditLog.count({ where: { shopId: shop.id } });
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  const [importedCustomersAfter, importedVehiclesAfter, importedInvoicesAfter, importedOrdersAfter] = await Promise.all([
    prisma.customer.count({ where: { legacySourceTable: { not: null } } }),
    prisma.vehicle.count({ where: { legacySourceTable: { not: null } } }),
    prisma.invoice.count({ where: { legacySourceTable: { not: null } } }),
    prisma.repairOrder.count({ where: { legacySourceTable: { not: null } } }),
  ]);
  const importedUnchanged = importedCustomersBefore === importedCustomersAfter && importedVehiclesBefore === importedVehiclesAfter && importedInvoicesBefore === importedInvoicesAfter && importedOrdersBefore === importedOrdersAfter;
  console.log(`pending invite created: ${results.pending}`);
  console.log(`invite acceptance creates membership: ${results.membership}`);
  console.log(`invite status accepted: ${results.accepted}`);
  console.log(`duplicate acceptance blocked: ${results.duplicateBlocked}`);
  console.log(`wrong-email acceptance blocked: ${results.wrongEmailBlocked}`);
  console.log(`revoked invite blocked: ${results.revokedBlocked}`);
  console.log(`audit rows created: ${results.audits}`);
  console.log(`imported records unchanged: ${Number(importedUnchanged)}`);
} finally { await prisma.$disconnect(); }

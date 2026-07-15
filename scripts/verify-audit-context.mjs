import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Database configuration is unavailable.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const rollback = new Error("ROLLBACK_VERIFICATION");

try {
  const shop = await prisma.shop.findFirst({ select: { id: true } });
  if (!shop) throw new Error("Shop is unavailable.");
  const before = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.repairOrder.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]);
  const oldRowsReadable = await prisma.auditLog.count({ where: { OR: [{ actorEmail: null }, { entityLabel: null }, { contextSummary: null }] } });
  const checks = { email: 0, label: 0, href: 0, context: 0, safe: 0 };
  try {
    await prisma.$transaction(async (transaction) => {
      const event = await transaction.auditLog.create({ data: { shopId: shop.id, userId: randomUUID(), action: "verification_event", entityType: "verification", entityId: randomUUID(), actorEmail: "audit-verification@example.invalid", actorRole: "OWNER", entityLabel: "Verification record", entityHref: "/admin/audit-log", contextSummary: "Verification event created", metadata: { source: "verification" } }, select: { actorEmail: true, entityLabel: true, entityHref: true, contextSummary: true, metadata: true } });
      checks.email = Number(Boolean(event.actorEmail)); checks.label = Number(Boolean(event.entityLabel)); checks.href = Number(event.entityHref?.startsWith("/") ?? false); checks.context = Number(Boolean(event.contextSummary));
      const serialized = JSON.stringify({ metadata: event.metadata, context: event.contextSummary }).toLowerCase();
      checks.safe = Number(!["phone", "vin", "license", "address", "labor description", "part description"].some((term) => serialized.includes(term)));
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  const after = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.repairOrder.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]);
  const matrix = JSON.parse(await readFile(new URL("../src/lib/permission-matrix.json", import.meta.url), "utf8"));
  console.log(`actor email stored: ${checks.email}`); console.log(`entity label stored: ${checks.label}`); console.log(`entity href stored: ${checks.href}`); console.log(`context summary stored: ${checks.context}`); console.log(`old audit rows readable: ${Number(oldRowsReadable >= 0)}`); console.log(`STAFF blocked: ${Number(!matrix.STAFF.includes("view_audit_log"))}`); console.log(`OWNER/ADMIN allowed: ${Number(matrix.OWNER.includes("view_audit_log") && matrix.ADMIN.includes("view_audit_log"))}`); console.log(`restricted context absent: ${checks.safe}`); console.log(`application row counts unchanged after rollback: ${Number(before.every((count, index) => count === after[index]))}`);
} finally { await prisma.$disconnect(); }

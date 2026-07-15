import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Database configuration is unavailable.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const rollback = new Error("ROLLBACK_VERIFICATION");

try {
  const shop = await prisma.shop.findFirst({ select: { id: true } });
  if (!shop) throw new Error("Shop is unavailable.");
  const [membersListed, importedCustomersBefore, importedVehiclesBefore, importedInvoicesBefore, importedOrdersBefore] = await Promise.all([
    prisma.shopMembership.count({ where: { shopId: shop.id } }),
    prisma.customer.count({ where: { legacySourceTable: { not: null } } }),
    prisma.vehicle.count({ where: { legacySourceTable: { not: null } } }),
    prisma.invoice.count({ where: { legacySourceTable: { not: null } } }),
    prisma.repairOrder.count({ where: { legacySourceTable: { not: null } } }),
  ]);
  let roleUpdateProtected = 0;
  let lastOwnerProtected = 0;
  let auditCreated = 0;
  try {
    await prisma.$transaction(async (transaction) => {
      const member = await transaction.shopMembership.findFirst({ where: { shopId: shop.id }, select: { id: true } });
      if (!member) throw new Error("Membership verification is unavailable.");
      const crossShopUpdate = await transaction.shopMembership.updateMany({ where: { id: member.id, shopId: randomUUID() }, data: { role: "STAFF" } });
      roleUpdateProtected = Number(crossShopUpdate.count === 0);

      const temporaryShop = await transaction.shop.create({ data: { name: "Verification shop" }, select: { id: true } });
      const temporaryOwner = await transaction.shopMembership.create({ data: { shopId: temporaryShop.id, userId: randomUUID(), role: "OWNER" }, select: { id: true } });
      const ownerCount = await transaction.shopMembership.count({ where: { shopId: temporaryShop.id, role: "OWNER" } });
      lastOwnerProtected = Number(ownerCount <= 1);
      if (ownerCount > 1) await transaction.shopMembership.update({ where: { id: temporaryOwner.id }, data: { role: "STAFF" } });

      await transaction.auditLog.create({ data: { shopId: shop.id, action: "member_role_changed", entityType: "shop_membership", entityId: member.id, metadata: { source: "web" } } });
      auditCreated = 1;
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
  console.log(`members listed: ${membersListed}`);
  console.log(`role update protected: ${roleUpdateProtected}`);
  console.log(`last OWNER protection works: ${lastOwnerProtected}`);
  console.log(`audit row created: ${auditCreated}`);
  console.log(`imported records unchanged: ${Number(importedUnchanged)}`);
} finally {
  await prisma.$disconnect();
}

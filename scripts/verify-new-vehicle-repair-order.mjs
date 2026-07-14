import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

try {
  const membership = await prisma.shopMembership.findFirst({
    orderBy: { createdAt: "asc" },
    select: { shopId: true },
  });
  if (!membership) throw new Error("No shop membership is available for verification.");
  const shopId = membership.shopId;

  const customer = await prisma.customer.findFirst({
    where: { shopId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!customer) throw new Error("No existing customer is available for verification.");

  const [vehiclesBefore, importedBefore, existingVehicle] = await Promise.all([
    prisma.vehicle.count({ where: { shopId } }),
    prisma.vehicle.count({ where: { shopId, legacySourceTable: { not: null } } }),
    prisma.vehicle.findFirst({
      where: {
        shopId,
        legacySourceTable: null,
        notes: "Web new vehicle workflow verification",
      },
      select: { id: true, customerId: true },
    }),
  ]);

  if (!existingVehicle) {
    await prisma.$transaction(async (transaction) => {
      const vehicle = await transaction.vehicle.create({
        data: {
          shopId,
          customerId: customer.id,
          year: 2020,
          make: "Verification",
          model: "Vehicle",
          notes: "Web new vehicle workflow verification",
        },
        select: { id: true },
      });
      const shop = await transaction.shop.update({
        where: { id: shopId },
        data: { nextRepairOrderNumber: { increment: 1 } },
        select: { nextRepairOrderNumber: true },
      });
      await transaction.repairOrder.create({
        data: {
          shopId,
          customerId: customer.id,
          vehicleId: vehicle.id,
          repairOrderNumber: shop.nextRepairOrderNumber - 1,
          status: "draft",
          concern: "Web new vehicle workflow verification",
        },
      });
    }, { isolationLevel: "Serializable" });
  }

  const [vehiclesAfter, importedAfter, webRepairOrders] = await Promise.all([
    prisma.vehicle.count({ where: { shopId } }),
    prisma.vehicle.count({ where: { shopId, legacySourceTable: { not: null } } }),
    prisma.repairOrder.count({
      where: { shopId, repairOrderNumber: { not: null }, legacySourceTable: null },
    }),
  ]);
  if (importedAfter !== importedBefore) {
    throw new Error("Imported vehicle count changed during verification.");
  }

  console.log(`vehicles before test creation: ${vehiclesBefore}`);
  console.log(`vehicles after test creation: ${vehiclesAfter}`);
  console.log(`web-created repair_orders: ${webRepairOrders}`);
  console.log(`imported vehicles before: ${importedBefore}`);
  console.log(`imported vehicles after: ${importedAfter}`);
} finally {
  await prisma.$disconnect();
}

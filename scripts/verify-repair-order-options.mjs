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

  const customers = await prisma.customer.findMany({
    where: { shopId: membership.shopId, vehicles: { some: {} } },
    select: { _count: { select: { vehicles: true } } },
  });
  const vehicleCounts = customers.map((customer) => customer._count.vehicles);

  console.log(`selectable customers: ${customers.length}`);
  console.log(`maximum vehicles per selectable customer: ${Math.max(0, ...vehicleCounts)}`);
  console.log(`customers with more than one vehicle: ${vehicleCounts.filter((count) => count > 1).length}`);
} finally {
  await prisma.$disconnect();
}

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  const membership = await prisma.shopMembership.findFirst({
    orderBy: { createdAt: "asc" },
    select: { shopId: true },
  });
  if (!membership) throw new Error("No shop membership is available for verification.");
  const shopId = membership.shopId;
  const sample = await prisma.customer.findFirst({
    where: { shopId, displayName: { not: "" } },
    orderBy: { createdAt: "asc" },
    select: { displayName: true },
  });
  if (!sample) throw new Error("No searchable customer is available.");
  const query = sample.displayName;

  const [searchableCustomers, searchableVehicles, searchableRepairOrders, searchableInvoices, sampleCustomers, sampleVehicles, sampleRepairOrders, sampleInvoices] = await Promise.all([
    prisma.customer.count({ where: { shopId, OR: [{ displayName: { not: "" } }, { phone: { not: null } }] } }),
    prisma.vehicle.count({ where: { shopId, OR: [{ year: { not: null } }, { make: { not: null } }, { model: { not: null } }, { licensePlate: { not: null } }, { vin: { not: null } }] } }),
    prisma.repairOrder.count({ where: { shopId, OR: [{ repairOrderNumber: { not: null } }, { legacyRoNo: { not: null } }] } }),
    prisma.invoice.count({ where: { shopId, OR: [{ repairOrderNumber: { not: null } }, { legacyRoNo: { not: null } }] } }),
    prisma.customer.count({ where: { shopId, OR: [{ displayName: { contains: query, mode: "insensitive" } }, { phone: { contains: query } }] } }),
    prisma.vehicle.count({ where: { shopId, OR: [{ make: { contains: query, mode: "insensitive" } }, { model: { contains: query, mode: "insensitive" } }, { licensePlate: { contains: query, mode: "insensitive" } }, { vin: { contains: query, mode: "insensitive" } }] } }),
    prisma.repairOrder.count({ where: { shopId, legacyRoNo: { contains: query, mode: "insensitive" } } }),
    prisma.invoice.count({ where: { shopId, legacyRoNo: { contains: query, mode: "insensitive" } } }),
  ]);

  console.log(`searchable customers: ${searchableCustomers}`);
  console.log(`searchable vehicles: ${searchableVehicles}`);
  console.log(`searchable repair orders: ${searchableRepairOrders}`);
  console.log(`searchable invoices: ${searchableInvoices}`);
  console.log(`sample customer results: ${Math.min(sampleCustomers, 10)}`);
  console.log(`sample vehicle results: ${Math.min(sampleVehicles, 10)}`);
  console.log(`sample repair order results: ${Math.min(sampleRepairOrders, 10)}`);
  console.log(`sample invoice results: ${Math.min(sampleInvoices, 10)}`);
} finally {
  await prisma.$disconnect();
}

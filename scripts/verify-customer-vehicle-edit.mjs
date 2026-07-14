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
  const customer = await prisma.customer.findFirst({
    where: { shopId, vehicles: { some: {} } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, displayName: true, phone: true, email: true, addressLine1: true,
      city: true, state: true, postalCode: true, legacyCustno: true,
      legacySourceTable: true,
      vehicles: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { id: true, year: true, make: true, model: true, licensePlate: true, vin: true, odometer: true, legacyCarno: true, legacySourceTable: true },
      },
    },
  });
  if (!customer || !customer.vehicles[0]) throw new Error("No customer-owned vehicle is available.");
  const vehicle = customer.vehicles[0];
  const invoicesBefore = await prisma.invoice.count({ where: { shopId } });

  const [customerResult, vehicleResult] = await prisma.$transaction([
    prisma.customer.updateMany({
      where: { id: customer.id, shopId },
      data: {
        displayName: customer.displayName, phone: customer.phone, email: customer.email,
        addressLine1: customer.addressLine1, city: customer.city, state: customer.state,
        postalCode: customer.postalCode,
      },
    }),
    prisma.vehicle.updateMany({
      where: { id: vehicle.id, shopId },
      data: {
        year: vehicle.year, make: vehicle.make, model: vehicle.model,
        licensePlate: vehicle.licensePlate, vin: vehicle.vin, odometer: vehicle.odometer,
      },
    }),
  ]);

  const [customerAfter, vehicleAfter, invoicesAfter] = await Promise.all([
    prisma.customer.findUniqueOrThrow({ where: { id: customer.id }, select: { legacyCustno: true, legacySourceTable: true } }),
    prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id }, select: { legacyCarno: true, legacySourceTable: true } }),
    prisma.invoice.count({ where: { shopId } }),
  ]);
  const legacyPreserved = customerAfter.legacyCustno === customer.legacyCustno &&
    customerAfter.legacySourceTable === customer.legacySourceTable &&
    vehicleAfter.legacyCarno === vehicle.legacyCarno &&
    vehicleAfter.legacySourceTable === vehicle.legacySourceTable;
  const invoicesUnchanged = invoicesAfter === invoicesBefore;
  if (!legacyPreserved || !invoicesUnchanged) throw new Error("Protected records changed.");

  console.log(`customer updates succeeded: ${customerResult.count}`);
  console.log(`vehicle updates succeeded: ${vehicleResult.count}`);
  console.log(`legacy source fields preserved: ${legacyPreserved ? 1 : 0}`);
  console.log(`invoices before: ${invoicesBefore}`);
  console.log(`invoices after: ${invoicesAfter}`);
} finally {
  await prisma.$disconnect();
}

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

function roValue(search) {
  const query = search.trim().replaceAll(/\s+/g, " ");
  const cleaned = query.replace(/^(?:repair\s*order|ro|invoice|inv)\s*#?\s*/i, "").replace(/^#\s*/, "").trim();
  const numericText = cleaned.match(/\d+/)?.[0] ?? null;
  return { text: (numericText ?? cleaned) || query, number: numericText ? Number(numericText) : null };
}

async function roCounts(shopId, search) {
  const value = roValue(search);
  const where = {
    shopId,
    OR: [
      { legacyRoNo: { contains: value.text, mode: "insensitive" } },
      ...(value.number === null ? [] : [{ repairOrderNumber: value.number }]),
    ],
  };
  const [orders, invoices] = await Promise.all([
    prisma.repairOrder.count({ where }),
    prisma.invoice.count({ where }),
  ]);
  return [Math.min(orders, 10), Math.min(invoices, 10)];
}

try {
  const membership = await prisma.shopMembership.findFirst({ orderBy: { createdAt: "asc" }, select: { shopId: true } });
  if (!membership) throw new Error("No shop membership is available for verification.");
  const shopId = membership.shopId;
  const [prefixed, plain] = await Promise.all([
    roCounts(shopId, "RO #21613"),
    roCounts(shopId, "21613"),
  ]);
  if (prefixed[0] !== plain[0] || prefixed[1] !== plain[1]) throw new Error("RO normalization counts differ.");

  const vehicleTokens = ["2024", "jeep", "compass"];
  const vehicleResults = await prisma.vehicle.count({
    where: {
      shopId,
      AND: vehicleTokens.map((token) => ({
        OR: [
          { make: { contains: token, mode: "insensitive" } },
          { model: { contains: token, mode: "insensitive" } },
          { licensePlate: { contains: token, mode: "insensitive" } },
          { vin: { contains: token, mode: "insensitive" } },
          ...(/^\d+$/.test(token) ? [{ year: Number(token) }] : []),
        ],
      })),
    },
  });
  const sampleCustomer = await prisma.customer.findFirst({ where: { shopId, displayName: { not: "" } }, orderBy: { createdAt: "asc" }, select: { displayName: true } });
  if (!sampleCustomer) throw new Error("No customer is available for verification.");
  const customerTokens = sampleCustomer.displayName.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const customerResults = await prisma.customer.count({
    where: { shopId, AND: customerTokens.map((token) => ({ OR: [{ displayName: { contains: token, mode: "insensitive" } }, { phone: { contains: token } }] })) },
  });

  console.log(`RO-prefixed repair order results: ${prefixed[0]}`);
  console.log(`RO-prefixed invoice results: ${prefixed[1]}`);
  console.log(`plain-number repair order results: ${plain[0]}`);
  console.log(`plain-number invoice results: ${plain[1]}`);
  console.log(`RO normalized result counts equal: 1`);
  console.log(`multi-token vehicle results: ${Math.min(vehicleResults, 10)}`);
  console.log(`customer query results: ${Math.min(customerResults, 10)}`);
} finally {
  await prisma.$disconnect();
}

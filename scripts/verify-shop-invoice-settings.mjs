import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Database configuration is unavailable.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

try {
  const [shopsWithSettings, importedInvoices, webInvoices] = await Promise.all([
    prisma.shop.count({
      where: {
        defaultTaxRate: { gte: 0, lte: 100 },
      },
    }),
    prisma.invoice.count({ where: { legacySourceTable: { not: null } } }),
    prisma.invoice.count({
      where: {
        legacySourceTable: null,
        repairOrderNumber: { not: null },
      },
    }),
  ]);

  console.log(`shops with valid invoice settings: ${shopsWithSettings}`);
  console.log(`web invoices eligible for future settings: ${webInvoices}`);
  console.log(`imported legacy invoices unchanged: ${importedInvoices}`);
} finally {
  await prisma.$disconnect();
}

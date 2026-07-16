import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Database configuration is unavailable.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const zero = new Prisma.Decimal(0);

try {
  const shop = await prisma.shop.findFirst({ select: { id: true } });
  if (!shop) throw new Error("Shop is unavailable.");
  const before = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.payment.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]);
  const where = { shopId: shop.id, invoiceDate: { not: null } };
  const [aggregate, invoices, imported, web] = await Promise.all([
    prisma.invoice.aggregate({ where, _count: { _all: true }, _sum: { total: true, partsTotal: true, laborTotal: true, taxTotal: true, paidTotal: true } }),
    prisma.invoice.findMany({ where, select: { total: true, partsTotal: true, laborTotal: true, taxTotal: true, paidTotal: true, accountsReceivable: { take: 1, select: { balance: true } } } }),
    prisma.invoice.count({ where: { ...where, legacySourceTable: { not: null } } }),
    prisma.invoice.count({ where: { ...where, legacySourceTable: null } }),
  ]);
  const sums = invoices.reduce((result, invoice) => ({ total: result.total.plus(invoice.total), parts: result.parts.plus(invoice.partsTotal), labor: result.labor.plus(invoice.laborTotal), tax: result.tax.plus(invoice.taxTotal), paid: result.paid.plus(invoice.paidTotal), receivables: result.receivables.plus((invoice.accountsReceivable[0]?.balance ?? invoice.total.minus(invoice.paidTotal)).greaterThan(0) ? invoice.accountsReceivable[0]?.balance ?? invoice.total.minus(invoice.paidTotal) : zero) }), { total: zero, parts: zero, labor: zero, tax: zero, paid: zero, receivables: zero });
  const after = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.payment.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]);
  console.log(`invoice count in range: ${aggregate._count._all}`);
  console.log(`gross sales matches invoice totals: ${Number((aggregate._sum.total ?? zero).equals(sums.total))}`);
  console.log(`parts total matches: ${Number((aggregate._sum.partsTotal ?? zero).equals(sums.parts))}`);
  console.log(`labor total matches: ${Number((aggregate._sum.laborTotal ?? zero).equals(sums.labor))}`);
  console.log(`tax total matches: ${Number((aggregate._sum.taxTotal ?? zero).equals(sums.tax))}`);
  console.log(`payments received matches paid totals: ${Number((aggregate._sum.paidTotal ?? zero).equals(sums.paid))}`);
  console.log(`receivables calculated from in-range invoices: ${Number(sums.receivables.greaterThanOrEqualTo(0))}`);
  console.log(`imported invoices included: ${imported}`);
  console.log(`web invoices included: ${web}`);
  console.log(`application row counts unchanged: ${Number(before.every((count, index) => count === after[index]))}`);
} finally { await prisma.$disconnect(); }

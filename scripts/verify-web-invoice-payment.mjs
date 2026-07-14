import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

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
  const [importedBefore, paymentsBefore] = await Promise.all([
    prisma.invoice.count({ where: { shopId, legacySourceTable: { not: null } } }),
    prisma.payment.count({ where: { shopId, invoice: { legacySourceTable: null, repairOrderNumber: { not: null } } } }),
  ]);
  const invoice = await prisma.invoice.findFirst({
    where: {
      shopId,
      legacySourceTable: null,
      repairOrderNumber: { not: null },
      status: "finalized",
      repairOrder: { concern: { contains: "verification", mode: "insensitive" } },
      accountsReceivable: { some: { balance: { gt: 0 } } },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!invoice) throw new Error("No eligible verification invoice is available.");

  const existingPayment = await prisma.payment.findFirst({
    where: { shopId, invoiceId: invoice.id, reference: "Web payment workflow verification" },
    select: { id: true },
  });
  if (!existingPayment) {
    await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM invoices WHERE id = ${invoice.id}::uuid AND shop_id = ${shopId}::uuid FOR UPDATE`;
      const current = await transaction.invoice.findFirstOrThrow({
        where: { id: invoice.id, shopId, legacySourceTable: null, repairOrderNumber: { not: null }, status: "finalized" },
        select: { id: true, customerId: true, total: true, accountsReceivable: { take: 1, select: { id: true } } },
      });
      const existing = await transaction.payment.aggregate({
        where: { invoiceId: current.id, shopId },
        _sum: { amount: true },
      });
      const existingPaid = existing._sum.amount ?? new Prisma.Decimal(0);
      const currentBalance = current.total.minus(existingPaid).toDecimalPlaces(2);
      const amount = Prisma.Decimal.min(currentBalance, new Prisma.Decimal("0.01"));
      if (!amount.greaterThan(0)) throw new Error("Verification invoice has no balance.");
      const paidTotal = existingPaid.plus(amount).toDecimalPlaces(2);
      const balance = current.total.minus(paidTotal).toDecimalPlaces(2);
      const paid = balance.equals(0);
      await transaction.payment.create({
        data: { shopId, invoiceId: current.id, customerId: current.customerId, amount, method: "other", paidAt: new Date(), reference: "Web payment workflow verification" },
      });
      await transaction.invoice.update({ where: { id: current.id }, data: { paidTotal, status: paid ? "paid" : "finalized" } });
      await transaction.accountReceivable.update({ where: { id: current.accountsReceivable[0].id }, data: { balance, status: paid ? "paid" : "open" } });
    }, { isolationLevel: "Serializable" });
  }

  const [webInvoices, paymentsAfter, importedAfter, verified] = await Promise.all([
    prisma.invoice.count({ where: { shopId, legacySourceTable: null, repairOrderNumber: { not: null } } }),
    prisma.payment.count({ where: { shopId, invoice: { legacySourceTable: null, repairOrderNumber: { not: null } } } }),
    prisma.invoice.count({ where: { shopId, legacySourceTable: { not: null } } }),
    prisma.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      select: { total: true, paidTotal: true, status: true, payments: { select: { amount: true } }, accountsReceivable: { take: 1, select: { balance: true, status: true } } },
    }),
  ]);
  if (importedAfter !== importedBefore) throw new Error("Imported invoice count changed.");
  const paymentSum = verified.payments.reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0));
  const expectedBalance = verified.total.minus(paymentSum).toDecimalPlaces(2);
  const receivable = verified.accountsReceivable[0];
  const invoiceValid = verified.paidTotal.equals(paymentSum) &&
    ((expectedBalance.equals(0) && verified.status === "paid") || (expectedBalance.greaterThan(0) && verified.status === "finalized"));
  const arValid = Boolean(receivable?.balance.equals(expectedBalance)) &&
    ((expectedBalance.equals(0) && receivable?.status === "paid") || (expectedBalance.greaterThan(0) && receivable?.status === "open"));
  if (!invoiceValid || !arValid) throw new Error("Payment totals did not reconcile.");

  console.log(`web invoices: ${webInvoices}`);
  console.log(`payment rows created: ${paymentsAfter - paymentsBefore}`);
  console.log(`web payment rows total: ${paymentsAfter}`);
  console.log(`invoice paid/balance calculations valid: ${invoiceValid ? 1 : 0}`);
  console.log(`AR paid/balance calculations valid: ${arValid ? 1 : 0}`);
  console.log(`imported legacy invoices before: ${importedBefore}`);
  console.log(`imported legacy invoices after: ${importedAfter}`);
} finally {
  await prisma.$disconnect();
}

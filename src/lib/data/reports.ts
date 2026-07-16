import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "./membership";

export type ReportDateRange = {
  start: Date;
  endExclusive: Date;
};

export async function getShopReport(range: ReportDateRange) {
  const { membership } = await getCurrentMembership();
  if (!membership) return null;

  const invoiceWhere = {
    shopId: membership.shopId,
    invoiceDate: { gte: range.start, lt: range.endExclusive },
  };
  const [invoiceTotals, invoiceBalances, invoices] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: invoiceWhere,
        _count: { _all: true },
        _sum: {
          total: true,
          partsTotal: true,
          laborTotal: true,
          taxTotal: true,
          paidTotal: true,
        },
      }),
      prisma.invoice.findMany({ where: invoiceWhere, select: { total: true, paidTotal: true, accountsReceivable: { take: 1, select: { balance: true } } } }),
      prisma.invoice.findMany({
        where: invoiceWhere,
        orderBy: [{ invoiceDate: "desc" }, { updatedAt: "desc" }],
        take: 100,
        select: {
          id: true,
          repairOrderNumber: true,
          legacyRoNo: true,
          invoiceDate: true,
          status: true,
          partsTotal: true,
          laborTotal: true,
          taxTotal: true,
          total: true,
          paidTotal: true,
        },
      }),
    ]);

  const receivablesTotal = invoiceBalances.reduce((sum, invoice) => {
    const calculated = invoice.total.minus(invoice.paidTotal);
    const balance = invoice.accountsReceivable[0]?.balance ?? calculated;
    return sum.plus(balance.greaterThan(0) ? balance : 0);
  }, new Prisma.Decimal(0));

  return { invoiceTotals, receivablesTotal, invoices };
}

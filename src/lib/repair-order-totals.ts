import "server-only";

import { Prisma } from "@/generated/prisma/client";

export async function refreshRepairOrderTotals(
  transaction: Prisma.TransactionClient,
  shopId: string,
  repairOrderId: string,
) {
  const [shop, parts, labor] = await Promise.all([
    transaction.shop.findUniqueOrThrow({
      where: { id: shopId },
      select: { defaultTaxRate: true, partsTaxable: true, laborTaxable: true },
    }),
    transaction.repairOrderPart.findMany({
      where: { repairOrderId, shopId },
      select: { quantity: true, unitPrice: true },
    }),
    transaction.repairOrderLabor.findMany({
      where: { repairOrderId, shopId },
      select: { hours: true, hourlyRate: true },
    }),
  ]);

  const zero = new Prisma.Decimal(0);
  const partsTotal = parts.reduce(
    (sum, line) => sum.plus(line.quantity.mul(line.unitPrice)),
    zero,
  ).toDecimalPlaces(2);
  const laborTotal = labor.reduce(
    (sum, line) => sum.plus(line.hours.mul(line.hourlyRate)),
    zero,
  ).toDecimalPlaces(2);
  const taxableTotal = (shop.partsTaxable ? partsTotal : zero).plus(
    shop.laborTaxable ? laborTotal : zero,
  );
  const taxTotal = taxableTotal.mul(shop.defaultTaxRate).toDecimalPlaces(2);

  await transaction.repairOrder.update({
    where: { id: repairOrderId },
    data: {
      partsTotal,
      laborTotal,
      taxTotal,
      estimatedTotal: partsTotal.plus(laborTotal).plus(taxTotal).toDecimalPlaces(2),
    },
  });
}

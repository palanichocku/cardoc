import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "./membership";

export async function getOpenOrdersForCurrentShop() {
  const { membership } = await getCurrentMembership();
  if (!membership) return [];

  return prisma.repairOrder.findMany({
    where: { shopId: membership.shopId, status: "open" },
    orderBy: [{ openedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      legacyRoNo: true,
      openedAt: true,
      estimatedTotal: true,
      customer: { select: { displayName: true } },
      vehicle: { select: { year: true, make: true, model: true } },
      _count: { select: { parts: true, labor: true } },
    },
  });
}

export async function getOpenOrderForCurrentShop(id: string) {
  const { membership } = await getCurrentMembership();
  if (!membership) return null;

  return prisma.repairOrder.findFirst({
    where: { id, shopId: membership.shopId, status: "open" },
    select: {
      id: true,
      legacyRoNo: true,
      openedAt: true,
      odometer: true,
      partsTotal: true,
      laborTotal: true,
      taxTotal: true,
      estimatedTotal: true,
      customer: { select: { id: true, displayName: true, phone: true } },
      vehicle: { select: { id: true, year: true, make: true, model: true } },
      parts: {
        orderBy: { createdAt: "asc" },
        select: { id: true, description: true, partNumber: true, quantity: true, unitPrice: true },
      },
      labor: {
        orderBy: { createdAt: "asc" },
        select: { id: true, description: true, hours: true, hourlyRate: true },
      },
    },
  });
}

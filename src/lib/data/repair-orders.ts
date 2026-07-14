import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "./membership";

export async function getRepairOrderFormOptions() {
  const { membership } = await getCurrentMembership();
  if (!membership) return [];

  return prisma.customer.findMany({
    where: { shopId: membership.shopId, vehicles: { some: {} } },
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      displayName: true,
      vehicles: {
        orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          licensePlate: true,
        },
      },
    },
  });
}

export async function getWebRepairOrderForCurrentShop(id: string) {
  const { membership } = await getCurrentMembership();
  if (!membership) return null;

  return prisma.repairOrder.findFirst({
    where: {
      id,
      shopId: membership.shopId,
      legacySourceTable: null,
      status: { in: ["draft", "open"] },
    },
    select: {
      id: true,
      repairOrderNumber: true,
      status: true,
      openedAt: true,
      customer: { select: { id: true, displayName: true } },
      vehicle: { select: { id: true, year: true, make: true, model: true } },
      parts: { select: { id: true } },
      labor: { select: { id: true } },
    },
  });
}

import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "./membership";

export async function getCustomersForCurrentShop() {
  const { membership } = await getCurrentMembership();

  if (!membership) {
    return [];
  }

  return prisma.customer.findMany({
    where: { shopId: membership.shopId },
    orderBy: [{ displayName: "asc" }, { id: "asc" }],
    take: 50,
    select: {
      id: true,
      displayName: true,
      email: true,
      phone: true,
    },
  });
}

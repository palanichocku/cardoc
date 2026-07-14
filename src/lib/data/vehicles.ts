import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "./membership";

export async function getVehiclesForCurrentShop() {
  const { membership } = await getCurrentMembership();

  if (!membership) {
    return [];
  }

  return prisma.vehicle.findMany({
    where: { shopId: membership.shopId },
    orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
    take: 50,
    select: {
      id: true,
      year: true,
      make: true,
      model: true,
      vin: true,
      licensePlate: true,
    },
  });
}

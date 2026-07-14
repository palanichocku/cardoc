import "server-only";

import { prisma } from "@/lib/prisma";

export async function getPrimaryShop() {
  return prisma.shop.findFirst({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      addressLine1: true,
      city: true,
      state: true,
      postalCode: true,
      phone: true,
    },
  });
}

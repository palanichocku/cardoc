import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "./membership";

export async function searchCurrentShop(search: string) {
  const { membership } = await getCurrentMembership();
  const query = search.trim();
  if (!membership || !query) {
    return { customers: [], vehicles: [], repairOrders: [], invoices: [] };
  }
  const shopId = membership.shopId;
  const number = /^\d+$/.test(query) ? Number(query) : null;

  const [customers, vehicles, repairOrders, invoices] = await Promise.all([
    prisma.customer.findMany({
      where: { shopId, OR: [{ displayName: { contains: query, mode: "insensitive" } }, { phone: { contains: query } }] },
      orderBy: { displayName: "asc" },
      take: 10,
      select: { id: true, displayName: true, phone: true },
    }),
    prisma.vehicle.findMany({
      where: {
        shopId,
        OR: [
          { make: { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
          { licensePlate: { contains: query, mode: "insensitive" } },
          { vin: { contains: query, mode: "insensitive" } },
          ...(number === null ? [] : [{ year: number }]),
        ],
      },
      orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
      take: 10,
      select: { id: true, year: true, make: true, model: true, licensePlate: true },
    }),
    prisma.repairOrder.findMany({
      where: {
        shopId,
        OR: [
          { legacyRoNo: { contains: query, mode: "insensitive" } },
          ...(number === null ? [] : [{ repairOrderNumber: number }]),
        ],
      },
      orderBy: { openedAt: "desc" },
      take: 10,
      select: { id: true, repairOrderNumber: true, legacyRoNo: true, legacySourceTable: true, status: true, openedAt: true },
    }),
    prisma.invoice.findMany({
      where: {
        shopId,
        OR: [
          { legacyRoNo: { contains: query, mode: "insensitive" } },
          ...(number === null ? [] : [{ repairOrderNumber: number }]),
        ],
      },
      orderBy: [{ invoiceDate: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: { id: true, repairOrderNumber: true, legacyRoNo: true, status: true, invoiceDate: true, total: true },
    }),
  ]);
  return { customers, vehicles, repairOrders, invoices };
}

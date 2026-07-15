import "server-only";

import { prisma } from "@/lib/prisma";

export type Confidence = "High" | "Medium" | "Low";
export type DuplicateGroup<T> = { id: string; reason: string; confidence: Confidence; records: T[]; totalCount: number };
export type CustomerDuplicate = {
  id: string; displayName: string; phone: string | null; email: string | null;
  addressLine1: string | null; city: string | null; state: string | null; postalCode: string | null;
  vehicleCount: number; invoiceCount: number; repairOrderCount: number; openArBalance: string;
  lastActivityAt: string | null; createdAt: string; updatedAt: string;
};
export type VehicleDuplicate = {
  id: string; year: number | null; make: string | null; model: string | null; licensePlate: string | null; vin: string | null;
  customerName: string; invoiceCount: number; repairOrderCount: number; lastActivityAt: string | null; createdAt: string; updatedAt: string;
};

const ignoredIdentifiers = new Set(["NONE", "UNKNOWN", "NA", "NOVIN", "NOPLATE", "NOTAVAILABLE", "NOTAPPLICABLE", "PENDING", "TBD", "TEMP", "UNLICENSED"]);
const ignoredNames = new Set(["CASH", "CASH CUSTOMER", "CUSTOMER", "NONE", "UNKNOWN", "UNKNOWN CUSTOMER", "WALK IN", "WALKIN"]);
const ignoredPhones = new Set(["1234567890"]);
const words = (value: string | null) => value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim() ?? "";
const confidence = (reason: string): Confidence => reason.includes("phone") || reason.includes("VIN") || reason.includes("plate") ? "High" : reason.includes("location") ? "Medium" : "Low";

function identifier(value: string | null) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return ignoredIdentifiers.has(normalized) || /^(.)\1+$/.test(normalized) ? "" : normalized;
}
function phone(value: string | null) {
  const normalized = value?.replace(/\D/g, "") ?? "";
  return normalized.length >= 7 && !ignoredPhones.has(normalized) && !/^(\d)\1+$/.test(normalized) ? normalized : "";
}
function name(value: string | null) { const normalized = words(value); return ignoredNames.has(normalized) ? "" : normalized; }
function isStrongName(value: string) { const tokens = value.split(" ").filter(Boolean); return value.length >= 6 && (tokens.length >= 2 || value.length >= 10); }
function add<T>(groups: Map<string, { reason: string; records: T[] }>, reason: string, key: string, record: T) {
  if (!key) return;
  const groupKey = `${reason}:${key}`;
  const group = groups.get(groupKey) ?? { reason, records: [] };
  group.records.push(record);
  groups.set(groupKey, group);
}
function finish<T extends { id: string }>(prefix: string, groups: Map<string, { reason: string; records: T[] }>) {
  return [...groups.values()].filter((group) => group.records.length > 1)
    .sort((a, b) => b.records.length - a.records.length || a.reason.localeCompare(b.reason)).slice(0, 50)
    .map((group, index) => ({ id: `${prefix}-${index + 1}`, reason: group.reason, confidence: confidence(group.reason), totalCount: group.records.length, records: group.records.slice(0, 15) }));
}
function latest(...values: Array<Date | null | undefined>) {
  const dates = values.filter((value): value is Date => Boolean(value));
  return dates.length ? new Date(Math.max(...dates.map((value) => value.getTime()))).toISOString() : null;
}

export async function findDuplicateCustomers(shopId: string): Promise<Array<DuplicateGroup<CustomerDuplicate>>> {
  const customers = await prisma.customer.findMany({ where: { shopId }, orderBy: { id: "asc" }, select: { id: true, displayName: true, phone: true, city: true, state: true } });
  const candidates = new Map<string, { reason: string; records: Array<{ id: string }> }>();
  for (const customer of customers) {
    const record = { id: customer.id };
    const normalizedName = name(customer.displayName);
    const location = [words(customer.city), words(customer.state)].filter(Boolean).join("|");
    add(candidates, "Same normalized phone", phone(customer.phone), record);
    add(candidates, "Same normalized name and location", normalizedName && location ? `${normalizedName}|${location}` : "", record);
    add(candidates, "Same normalized name", isStrongName(normalizedName) ? normalizedName : "", record);
  }
  const groups = finish("customer", candidates);
  const ids = [...new Set(groups.flatMap((group) => group.records.map((record) => record.id)))];
  if (!ids.length) return [];
  const [details, ar, invoiceDates, serviceDates] = await Promise.all([
    prisma.customer.findMany({ where: { shopId, id: { in: ids } }, select: { id: true, displayName: true, phone: true, email: true, addressLine1: true, city: true, state: true, postalCode: true, createdAt: true, updatedAt: true, _count: { select: { vehicles: true, invoices: true, repairOrders: true } } } }),
    prisma.accountReceivable.groupBy({ by: ["customerId"], where: { shopId, customerId: { in: ids }, status: "open" }, _sum: { balance: true } }),
    prisma.invoice.groupBy({ by: ["customerId"], where: { shopId, customerId: { in: ids } }, _max: { invoiceDate: true } }),
    prisma.repairOrder.groupBy({ by: ["customerId"], where: { shopId, customerId: { in: ids } }, _max: { openedAt: true } }),
  ]);
  const arMap = new Map(ar.map((row) => [row.customerId, row._sum.balance?.toString() ?? "0"]));
  const invoiceMap = new Map(invoiceDates.map((row) => [row.customerId, row._max.invoiceDate]));
  const serviceMap = new Map(serviceDates.map((row) => [row.customerId, row._max.openedAt]));
  const detailMap = new Map(details.map((row) => [row.id, { id: row.id, displayName: row.displayName, phone: row.phone, email: row.email, addressLine1: row.addressLine1, city: row.city, state: row.state, postalCode: row.postalCode, vehicleCount: row._count.vehicles, invoiceCount: row._count.invoices, repairOrderCount: row._count.repairOrders, openArBalance: arMap.get(row.id) ?? "0", lastActivityAt: latest(invoiceMap.get(row.id), serviceMap.get(row.id)), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }]));
  return groups.map((group) => ({ ...group, records: group.records.map((record) => detailMap.get(record.id)).filter((record): record is CustomerDuplicate => Boolean(record)) }));
}

export async function findDuplicateVehicles(shopId: string): Promise<Array<DuplicateGroup<VehicleDuplicate>>> {
  const vehicles = await prisma.vehicle.findMany({ where: { shopId }, orderBy: { id: "asc" }, select: { id: true, vin: true, licensePlate: true } });
  const candidates = new Map<string, { reason: string; records: Array<{ id: string }> }>();
  for (const vehicle of vehicles) {
    const record = { id: vehicle.id };
    const vin = identifier(vehicle.vin);
    const plate = identifier(vehicle.licensePlate);
    add(candidates, "Same VIN", vin.length >= 8 ? vin : "", record);
    add(candidates, "Same license plate", plate.length >= 2 ? plate : "", record);
  }
  const groups = finish("vehicle", candidates);
  const ids = [...new Set(groups.flatMap((group) => group.records.map((record) => record.id)))];
  if (!ids.length) return [];
  const [details, invoiceDates, serviceDates] = await Promise.all([
    prisma.vehicle.findMany({ where: { shopId, id: { in: ids } }, select: { id: true, year: true, make: true, model: true, licensePlate: true, vin: true, createdAt: true, updatedAt: true, customer: { select: { displayName: true } }, _count: { select: { invoices: true, repairOrders: true } } } }),
    prisma.invoice.groupBy({ by: ["vehicleId"], where: { shopId, vehicleId: { in: ids } }, _max: { invoiceDate: true } }),
    prisma.repairOrder.groupBy({ by: ["vehicleId"], where: { shopId, vehicleId: { in: ids } }, _max: { openedAt: true } }),
  ]);
  const invoiceMap = new Map(invoiceDates.map((row) => [row.vehicleId, row._max.invoiceDate]));
  const serviceMap = new Map(serviceDates.map((row) => [row.vehicleId, row._max.openedAt]));
  const detailMap = new Map(details.map((row) => [row.id, { id: row.id, year: row.year, make: row.make, model: row.model, licensePlate: row.licensePlate, vin: row.vin, customerName: row.customer.displayName, invoiceCount: row._count.invoices, repairOrderCount: row._count.repairOrders, lastActivityAt: latest(invoiceMap.get(row.id), serviceMap.get(row.id)), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }]));
  return groups.map((group) => ({ ...group, records: group.records.map((record) => detailMap.get(record.id)).filter((record): record is VehicleDuplicate => Boolean(record)) }));
}

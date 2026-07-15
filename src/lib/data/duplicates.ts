import "server-only";

import { prisma } from "@/lib/prisma";

export type CustomerDuplicate = { id: string; displayName: string };
export type VehicleDuplicate = { id: string; label: string };
export type DuplicateGroup<T> = { id: string; reason: string; records: T[]; totalCount: number };

const ignoredIdentifiers = new Set(["NONE", "UNKNOWN", "NA", "N/A", "NOVIN", "NO VIN", "TEMP"]);

function words(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim() ?? "";
}

function identifier(value: string | null) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return ignoredIdentifiers.has(normalized) ? "" : normalized;
}

function phone(value: string | null) {
  const normalized = value?.replace(/\D/g, "") ?? "";
  return normalized.length >= 7 && !/^(\d)\1+$/.test(normalized) ? normalized : "";
}

function add<T>(groups: Map<string, { reason: string; records: T[] }>, reason: string, key: string, record: T) {
  if (!key) return;
  const groupKey = `${reason}:${key}`;
  const group = groups.get(groupKey) ?? { reason, records: [] };
  group.records.push(record);
  groups.set(groupKey, group);
}

function finish<T>(prefix: string, groups: Map<string, { reason: string; records: T[] }>) {
  return [...groups.values()]
    .filter((group) => group.records.length > 1)
    .sort((a, b) => b.records.length - a.records.length || a.reason.localeCompare(b.reason))
    .slice(0, 50)
    .map((group, index): DuplicateGroup<T> => ({ id: `${prefix}-${index + 1}`, reason: group.reason, totalCount: group.records.length, records: group.records.slice(0, 10) }));
}

export async function findDuplicateCustomers(shopId: string) {
  const customers = await prisma.customer.findMany({
    where: { shopId },
    orderBy: { id: "asc" },
    select: { id: true, displayName: true, phone: true, city: true, state: true },
  });
  const groups = new Map<string, { reason: string; records: CustomerDuplicate[] }>();
  for (const customer of customers) {
    const record = { id: customer.id, displayName: customer.displayName };
    const normalizedName = words(customer.displayName);
    const location = [words(customer.city), words(customer.state)].filter(Boolean).join("|");
    add(groups, "Same normalized phone", phone(customer.phone), record);
    add(groups, "Same normalized name and location", normalizedName && location ? `${normalizedName}|${location}` : "", record);
    add(groups, "Same normalized name", normalizedName.length >= 3 ? normalizedName : "", record);
  }
  return finish("customer", groups);
}

export async function findDuplicateVehicles(shopId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { shopId },
    orderBy: { id: "asc" },
    select: { id: true, year: true, make: true, model: true, vin: true, licensePlate: true, customerId: true },
  });
  const groups = new Map<string, { reason: string; records: VehicleDuplicate[] }>();
  for (const vehicle of vehicles) {
    const label = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle details unavailable";
    const record = { id: vehicle.id, label };
    const vin = identifier(vehicle.vin);
    const plate = identifier(vehicle.licensePlate);
    const description = [vehicle.year, words(vehicle.make), words(vehicle.model)].filter(Boolean).join("|");
    add(groups, "Same VIN", vin.length >= 8 ? vin : "", record);
    add(groups, "Same license plate", plate.length >= 2 ? plate : "", record);
    add(groups, "Same year, make, model, and customer", vehicle.year && words(vehicle.make) && words(vehicle.model) ? `${description}|${vehicle.customerId}` : "", record);
  }
  return finish("vehicle", groups);
}

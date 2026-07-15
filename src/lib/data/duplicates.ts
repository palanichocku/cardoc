import "server-only";

import { prisma } from "@/lib/prisma";

export type CustomerDuplicate = { id: string; displayName: string };
export type VehicleDuplicate = { id: string; label: string };
export type DuplicateGroup<T> = { id: string; reason: string; records: T[]; totalCount: number };

const ignoredIdentifiers = new Set(["NONE", "UNKNOWN", "NA", "NOVIN", "NOPLATE", "NOTAVAILABLE", "NOTAPPLICABLE", "PENDING", "TBD", "TEMP", "UNLICENSED"]);
const ignoredNames = new Set(["CASH", "CASH CUSTOMER", "CUSTOMER", "NONE", "UNKNOWN", "UNKNOWN CUSTOMER", "WALK IN", "WALKIN"]);
const ignoredPhones = new Set(["1234567890"]);

function words(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim() ?? "";
}

function identifier(value: string | null) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return ignoredIdentifiers.has(normalized) || /^(.)\1+$/.test(normalized) ? "" : normalized;
}

function phone(value: string | null) {
  const normalized = value?.replace(/\D/g, "") ?? "";
  return normalized.length >= 7 && !ignoredPhones.has(normalized) && !/^(\d)\1+$/.test(normalized) ? normalized : "";
}

function name(value: string | null) {
  const normalized = words(value);
  return ignoredNames.has(normalized) ? "" : normalized;
}

function isStrongName(value: string) {
  const tokens = value.split(" ").filter(Boolean);
  return value.length >= 6 && (tokens.length >= 2 || value.length >= 10);
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
    const normalizedName = name(customer.displayName);
    const location = [words(customer.city), words(customer.state)].filter(Boolean).join("|");
    add(groups, "Same normalized phone", phone(customer.phone), record);
    add(groups, "Same normalized name and location", normalizedName && location ? `${normalizedName}|${location}` : "", record);
    add(groups, "Same normalized name", isStrongName(normalizedName) ? normalizedName : "", record);
  }
  return finish("customer", groups);
}

export async function findDuplicateVehicles(shopId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { shopId },
    orderBy: { id: "asc" },
    select: { id: true, year: true, make: true, model: true, vin: true, licensePlate: true },
  });
  const groups = new Map<string, { reason: string; records: VehicleDuplicate[] }>();
  for (const vehicle of vehicles) {
    const label = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle details unavailable";
    const record = { id: vehicle.id, label };
    const vin = identifier(vehicle.vin);
    const plate = identifier(vehicle.licensePlate);
    add(groups, "Same VIN", vin.length >= 8 ? vin : "", record);
    add(groups, "Same license plate", plate.length >= 2 ? plate : "", record);
  }
  return finish("vehicle", groups);
}

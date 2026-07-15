import "server-only";

import { prisma } from "@/lib/prisma";

export type Confidence = "High" | "Medium" | "Low" | "Data quality only";
export type EntityType = "customer" | "vehicle";
export type DuplicateGroup<T> = { id: string; entityType: EntityType; reason: string; confidence: Confidence; records: T[]; totalCount: number };
export type CustomerDuplicate = { id: string; displayName: string; phone: string | null; email: string | null; addressLine1: string | null; city: string | null; state: string | null; postalCode: string | null; vehicleCount: number; invoiceCount: number; repairOrderCount: number; openArBalance: string; lastActivityAt: string | null; createdAt: string; updatedAt: string };
export type VehicleDuplicate = { id: string; year: number | null; make: string | null; model: string | null; licensePlate: string | null; vin: string | null; customerName: string; invoiceCount: number; repairOrderCount: number; lastActivityAt: string | null; createdAt: string; updatedAt: string };

type Candidate = { id: string; customerId?: string };
type CandidateGroup = { entityType: EntityType; reason: string; confidence: Confidence; records: Candidate[] };
const ignoredIdentifiers = new Set(["NONE", "UNKNOWN", "NA", "NOVIN", "NOPLATE", "NOTAVAILABLE", "NOTAPPLICABLE", "PENDING", "TBD", "TEMP", "UNLICENSED", "000000"]);
const ignoredNames = new Set(["CASH", "CASH CUSTOMER", "CUSTOMER", "NONE", "UNKNOWN", "UNKNOWN CUSTOMER", "WALK IN", "WALKIN", "NO NAME"]);
const ignoredPhones = new Set(["1234567890"]);
const commonSurnames = new Set(["PATEL", "SINGH", "SHAH", "KUMAR", "SMITH", "JOHNSON", "WILLIAMS", "BROWN", "JONES", "MILLER", "DAVIS", "GARCIA", "RODRIGUEZ", "WILSON", "MARTINEZ", "ANDERSON", "TAYLOR", "THOMAS", "HERNANDEZ", "MOORE", "MARTIN", "JACKSON", "THOMPSON", "WHITE", "LOPEZ", "LEE", "GONZALEZ", "HARRIS", "CLARK", "LEWIS", "ROBINSON", "WALKER", "PEREZ", "HALL", "YOUNG", "ALLEN", "SANCHEZ", "WRIGHT", "KING", "SCOTT", "GREEN", "BAKER", "ADAMS", "NELSON", "HILL", "RAMIREZ", "CAMPBELL", "MITCHELL", "ROBERTS", "CARTER", "PHILLIPS", "EVANS", "TURNER", "TORRES", "PARKER", "COLLINS", "EDWARDS", "STEWART", "FLORES", "MORRIS", "NGUYEN"]);
const words = (value: string | null) => value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim() ?? "";
const compact = (value: string | null) => words(value).replaceAll(" ", "");
function validIdentifier(value: string | null) { const normalized = compact(value); return ignoredIdentifiers.has(normalized) || /^(.)\1+$/.test(normalized) ? "" : normalized; }
function validPhone(value: string | null) { const normalized = value?.replace(/\D/g, "") ?? ""; return normalized.length >= 7 && !ignoredPhones.has(normalized) && !/^(\d)\1+$/.test(normalized) ? normalized : ""; }
function validName(value: string | null) { const normalized = words(value); return ignoredNames.has(normalized) ? "" : normalized; }
function add(groups: Map<string, CandidateGroup>, entityType: EntityType, confidence: Confidence, reason: string, key: string, record: Candidate) { if (!key) return; const mapKey = `${entityType}:${confidence}:${reason}:${key}`; const group = groups.get(mapKey) ?? { entityType, confidence, reason, records: [] }; if (!group.records.some((item) => item.id === record.id)) group.records.push(record); groups.set(mapKey, group); }
function finish(prefix: string, groups: Map<string, CandidateGroup>) { const levels: Confidence[] = ["High", "Medium", "Low", "Data quality only"]; const valid = [...groups.values()].filter((group) => group.confidence === "Data quality only" ? group.records.length > 0 : group.records.length > 1); const seen = new Set<string>(); return levels.flatMap((level) => valid.filter((group) => group.confidence === level).sort((a, b) => b.records.length - a.records.length || a.reason.localeCompare(b.reason)).slice(0, 30)).filter((group) => { const records = group.records.map((record) => record.id).sort().join("|"); const signature = group.confidence === "Data quality only" ? `${group.reason}:${records}` : records; if (seen.has(signature)) return false; seen.add(signature); return true; }).map((group, index) => ({ id: `${prefix}-${index + 1}`, ...group, totalCount: group.records.length, records: group.records.slice(0, 15) })); }
function latest(...values: Array<Date | null | undefined>) { const dates = values.filter((value): value is Date => Boolean(value)); return dates.length ? new Date(Math.max(...dates.map((value) => value.getTime()))).toISOString() : null; }

async function enrichCustomerGroups(shopId: string, groups: ReturnType<typeof finish>): Promise<Array<DuplicateGroup<CustomerDuplicate>>> {
  const customerGroups = groups.filter((group) => group.entityType === "customer");
  const ids = [...new Set(customerGroups.flatMap((group) => group.records.map((record) => record.id)))]; if (!ids.length) return [];
  const [details, ar, invoiceDates, serviceDates] = await Promise.all([
    prisma.customer.findMany({ where: { shopId, id: { in: ids } }, select: { id: true, displayName: true, phone: true, email: true, addressLine1: true, city: true, state: true, postalCode: true, createdAt: true, updatedAt: true, _count: { select: { vehicles: true, invoices: true, repairOrders: true } } } }),
    prisma.accountReceivable.groupBy({ by: ["customerId"], where: { shopId, customerId: { in: ids }, status: "open" }, _sum: { balance: true } }),
    prisma.invoice.groupBy({ by: ["customerId"], where: { shopId, customerId: { in: ids } }, _max: { invoiceDate: true } }),
    prisma.repairOrder.groupBy({ by: ["customerId"], where: { shopId, customerId: { in: ids } }, _max: { openedAt: true } }),
  ]);
  const arMap = new Map(ar.map((row) => [row.customerId, row._sum.balance?.toString() ?? "0"])); const invoiceMap = new Map(invoiceDates.map((row) => [row.customerId, row._max.invoiceDate])); const serviceMap = new Map(serviceDates.map((row) => [row.customerId, row._max.openedAt]));
  const detailMap = new Map(details.map((row) => [row.id, { id: row.id, displayName: row.displayName, phone: row.phone, email: row.email, addressLine1: row.addressLine1, city: row.city, state: row.state, postalCode: row.postalCode, vehicleCount: row._count.vehicles, invoiceCount: row._count.invoices, repairOrderCount: row._count.repairOrders, openArBalance: arMap.get(row.id) ?? "0", lastActivityAt: latest(invoiceMap.get(row.id), serviceMap.get(row.id)), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }]));
  return customerGroups.map((group) => ({ ...group, records: group.records.map((record) => detailMap.get(record.id)).filter((record): record is CustomerDuplicate => Boolean(record)) }));
}
async function enrichVehicleGroups(shopId: string, groups: ReturnType<typeof finish>): Promise<Array<DuplicateGroup<VehicleDuplicate>>> {
  const vehicleGroups = groups.filter((group) => group.entityType === "vehicle");
  const ids = [...new Set(vehicleGroups.flatMap((group) => group.records.map((record) => record.id)))]; if (!ids.length) return [];
  const [details, invoiceDates, serviceDates] = await Promise.all([
    prisma.vehicle.findMany({ where: { shopId, id: { in: ids } }, select: { id: true, year: true, make: true, model: true, licensePlate: true, vin: true, createdAt: true, updatedAt: true, customer: { select: { displayName: true } }, _count: { select: { invoices: true, repairOrders: true } } } }),
    prisma.invoice.groupBy({ by: ["vehicleId"], where: { shopId, vehicleId: { in: ids } }, _max: { invoiceDate: true } }), prisma.repairOrder.groupBy({ by: ["vehicleId"], where: { shopId, vehicleId: { in: ids } }, _max: { openedAt: true } }),
  ]);
  const invoiceMap = new Map(invoiceDates.map((row) => [row.vehicleId, row._max.invoiceDate])); const serviceMap = new Map(serviceDates.map((row) => [row.vehicleId, row._max.openedAt]));
  const detailMap = new Map(details.map((row) => [row.id, { id: row.id, year: row.year, make: row.make, model: row.model, licensePlate: row.licensePlate, vin: row.vin, customerName: row.customer.displayName, invoiceCount: row._count.invoices, repairOrderCount: row._count.repairOrders, lastActivityAt: latest(invoiceMap.get(row.id), serviceMap.get(row.id)), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }]));
  return vehicleGroups.map((group) => ({ ...group, records: group.records.map((record) => detailMap.get(record.id)).filter((record): record is VehicleDuplicate => Boolean(record)) }));
}

export async function findDuplicateCustomers(shopId: string) {
  const customers = await prisma.customer.findMany({ where: { shopId }, orderBy: { id: "asc" }, select: { id: true, displayName: true, phone: true, email: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true } });
  const groups = new Map<string, CandidateGroup>();
  for (const customer of customers) {
    const record = { id: customer.id }; const fullName = validName(customer.displayName); const phone = validPhone(customer.phone); const emailMissing = !customer.email?.trim(); const address1 = words(customer.addressLine1); const address2 = words(customer.addressLine2); const city = words(customer.city); const state = words(customer.state); const postal = compact(customer.postalCode); const fullAddress = address1 && city && state && postal ? `${address1}|${address2}|${city}|${state}|${postal}` : ""; const commonName = fullName.split(" ").some((token) => commonSurnames.has(token));
    add(groups, "customer", "High", "Same normalized name, valid phone, and full address", !commonName && fullName && phone && fullAddress ? `${fullName}|${phone}|${fullAddress}` : "", record);
    add(groups, "customer", "Data quality only", "Missing phone", !phone ? "all" : "", record);
    add(groups, "customer", "Data quality only", "Missing email", emailMissing ? "all" : "", record);
    add(groups, "customer", "Data quality only", "Missing both phone and email", !phone && emailMissing ? "all" : "", record);
    add(groups, "customer", "Data quality only", "Missing or placeholder customer name", !fullName ? "all" : "", record);
  }
  return enrichCustomerGroups(shopId, finish("customer", groups));
}

export async function findDuplicateVehicles(shopId: string) {
  const vehicles = await prisma.vehicle.findMany({ where: { shopId }, orderBy: { id: "asc" }, select: { id: true, year: true, make: true, model: true, vin: true, licensePlate: true } });
  const groups = new Map<string, CandidateGroup>();
  for (const vehicle of vehicles) {
    const record = { id: vehicle.id }; const rawPlate = compact(vehicle.licensePlate); const plate = validIdentifier(vehicle.licensePlate); const make = words(vehicle.make); const model = words(vehicle.model); const vinMissing = !compact(vehicle.vin);
    add(groups, "vehicle", "High", "Same year, make, model, and valid license plate", vehicle.year && make && model && plate ? `${vehicle.year}|${make}|${model}|${plate}` : "", record);
    add(groups, "vehicle", "Data quality only", "Missing license plate", !rawPlate ? "all" : "", record);
    add(groups, "vehicle", "Data quality only", "Missing VIN", vinMissing ? "all" : "", record);
    add(groups, "vehicle", "Data quality only", "Missing year, make, or model", !vehicle.year || !make || !model ? "all" : "", record);
    add(groups, "vehicle", "Data quality only", "Placeholder license plate", rawPlate && !plate ? "all" : "", record);
  }
  return enrichVehicleGroups(shopId, finish("vehicle", groups));
}

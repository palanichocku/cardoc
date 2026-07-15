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
function validEmail(value: string | null) { const normalized = value?.trim().toLowerCase() ?? ""; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && !normalized.endsWith("@example.com") ? normalized : ""; }
function validName(value: string | null) { const normalized = words(value); return ignoredNames.has(normalized) ? "" : normalized; }
function nameParts(value: string) { const tokens = value.split(" ").filter(Boolean); return { tokens, last: tokens.at(-1) ?? "", initialLast: tokens.length >= 2 ? `${tokens[0][0]}|${tokens.at(-1)}` : "" }; }
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
  const customers = await prisma.customer.findMany({ where: { shopId }, orderBy: { id: "asc" }, select: { id: true, displayName: true, phone: true, email: true, addressLine1: true, city: true, state: true, postalCode: true, vehicles: { select: { vin: true, licensePlate: true } } } });
  const groups = new Map<string, CandidateGroup>(); const phoneNames = new Map<string, Set<string>>(); const addressNames = new Map<string, Set<string>>();
  for (const customer of customers) {
    const record = { id: customer.id }; const fullName = validName(customer.displayName); const parts = nameParts(fullName); const phone = validPhone(customer.phone); const email = validEmail(customer.email); const address = words(customer.addressLine1); const city = words(customer.city); const state = words(customer.state); const postal = compact(customer.postalCode); const location = city && state && postal ? `${city}|${state}|${postal}` : "";
    add(groups, "customer", "High", "Same valid phone", phone, record); add(groups, "customer", "High", "Same valid email", email, record);
    add(groups, "customer", "High", "Exact customer fingerprint", fullName && phone && email && address && location ? `${fullName}|${phone}|${email}|${address}|${location}` : "", record);
    add(groups, "customer", "High", "Same address and full name with contact details missing", !phone && !email && fullName && address ? `${fullName}|${address}|${city}|${state}|${postal}` : "", record);
    add(groups, "customer", "Medium", "Same full name and city/state/postal", fullName && location ? `${fullName}|${location}` : "", record);
    for (const vehicle of customer.vehicles) { const vin = validIdentifier(vehicle.vin); const plate = validIdentifier(vehicle.licensePlate); add(groups, "customer", "Medium", "Same full name and shared vehicle identifier", fullName && (vin || plate) ? `${fullName}|${vin || plate}` : "", record); }
    const common = commonSurnames.has(parts.last); add(groups, "customer", "Low", "Same display name only", !common && fullName.length >= 6 ? fullName : "", record); add(groups, "customer", "Low", "Same last name only", !common && parts.last.length >= 5 ? parts.last : "", record); add(groups, "customer", "Low", "Same first initial and last name only", !common ? parts.initialLast : "", record);
    if (phone) { const names = phoneNames.get(phone) ?? new Set(); names.add(fullName); phoneNames.set(phone, names); } if (address) { const names = addressNames.get(address) ?? new Set(); names.add(fullName); addressNames.set(address, names); }
    add(groups, "customer", "Data quality only", "Missing both phone and email", !phone && !email ? "all" : "", record); add(groups, "customer", "Data quality only", "Missing or placeholder customer name", !fullName ? "all" : "", record);
  }
  for (const customer of customers) { const record = { id: customer.id }; const phone = validPhone(customer.phone); const address = words(customer.addressLine1); if (phone && (phoneNames.get(phone)?.size ?? 0) >= 3) add(groups, "customer", "Data quality only", "Same phone linked to many different names", phone, record); if (address && (addressNames.get(address)?.size ?? 0) >= 3) add(groups, "customer", "Data quality only", "Same address linked to many different names", address, record); }
  return enrichCustomerGroups(shopId, finish("customer", groups));
}

export async function findDuplicateVehicles(shopId: string) {
  const vehicles = await prisma.vehicle.findMany({ where: { shopId }, orderBy: { id: "asc" }, select: { id: true, customerId: true, year: true, make: true, model: true, vin: true, licensePlate: true } });
  const groups = new Map<string, CandidateGroup>(); const plateCounts = new Map<string, number>(); const vinCustomers = new Map<string, Set<string>>(); const customerPlates = new Map<string, number>();
  for (const vehicle of vehicles) { const plate = validIdentifier(vehicle.licensePlate); const vin = validIdentifier(vehicle.vin); if (plate) plateCounts.set(plate, (plateCounts.get(plate) ?? 0) + 1); if (vin) { const customers = vinCustomers.get(vin) ?? new Set(); customers.add(vehicle.customerId); vinCustomers.set(vin, customers); } if (plate) { const key = `${vehicle.customerId}|${plate}`; customerPlates.set(key, (customerPlates.get(key) ?? 0) + 1); } }
  for (const vehicle of vehicles) {
    const record = { id: vehicle.id, customerId: vehicle.customerId }; const vin = validIdentifier(vehicle.vin); const plate = validIdentifier(vehicle.licensePlate); const make = words(vehicle.make); const model = words(vehicle.model); const ymm = vehicle.year && make && model ? `${vehicle.year}|${make}|${model}` : ""; const broadPlate = plate && (plateCounts.get(plate) ?? 0) > 3;
    add(groups, "vehicle", "High", "Same valid VIN", vin.length >= 8 ? vin : "", record); add(groups, "vehicle", "High", "Same valid license plate", plate && !broadPlate ? plate : "", record); add(groups, "vehicle", "High", "Same customer, vehicle description, and VIN or plate", ymm && (vin || plate) ? `${vehicle.customerId}|${ymm}|${vin || plate}` : "", record);
    add(groups, "vehicle", "Medium", "Same customer and year/make/model with identifiers missing", ymm && !vin && !plate ? `${vehicle.customerId}|${ymm}` : "", record); add(groups, "vehicle", "Medium", "Same valid plate and similar vehicle description", plate && ymm ? `${plate}|${ymm}` : "", record);
    add(groups, "vehicle", "Low", "Same year/make/model across customers", ymm ? ymm : "", record); add(groups, "vehicle", "Low", "Same make/model only", make && model ? `${make}|${model}` : "", record);
    const rawPlate = compact(vehicle.licensePlate); add(groups, "vehicle", "Data quality only", "Placeholder license plate", !plate ? rawPlate || "blank" : "", record); add(groups, "vehicle", "Data quality only", "Blank VIN and blank plate", !vin && !plate ? "all" : "", record); add(groups, "vehicle", "Data quality only", "License plate reused across many vehicles", broadPlate ? plate : "", record); add(groups, "vehicle", "Data quality only", "Same VIN linked to multiple customers", vin && (vinCustomers.get(vin)?.size ?? 0) > 1 ? vin : "", record); add(groups, "vehicle", "Data quality only", "Same customer has multiple vehicles with the same plate", plate && (customerPlates.get(`${vehicle.customerId}|${plate}`) ?? 0) > 1 ? `${vehicle.customerId}|${plate}` : "", record); add(groups, "vehicle", "Data quality only", "Missing year, make, or model", !vehicle.year || !make || !model ? "all" : "", record);
  }
  const finished = finish("vehicle", groups).filter((group) => !group.reason.includes("across customers") || new Set(group.records.map((record) => record.customerId)).size > 1);
  return enrichVehicleGroups(shopId, finished);
}

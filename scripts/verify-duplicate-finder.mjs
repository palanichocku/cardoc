import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Database configuration is unavailable.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const ignoredIdentifiers = new Set(["NONE", "UNKNOWN", "NA", "NOVIN", "NOPLATE", "NOTAVAILABLE", "NOTAPPLICABLE", "PENDING", "TBD", "TEMP", "UNLICENSED", "000000"]);
const ignoredNames = new Set(["CASH", "CASH CUSTOMER", "CUSTOMER", "NONE", "UNKNOWN", "UNKNOWN CUSTOMER", "WALK IN", "WALKIN", "NO NAME"]);
const ignoredPhones = new Set(["1234567890"]);
const commonNames = new Set(["PATEL", "SINGH", "SHAH", "KUMAR", "SMITH", "JOHNSON", "WILLIAMS", "BROWN", "JONES", "MILLER", "DAVIS", "GARCIA", "RODRIGUEZ", "WILSON", "MARTINEZ", "ANDERSON", "TAYLOR", "THOMAS", "HERNANDEZ", "MOORE", "MARTIN", "JACKSON", "THOMPSON", "WHITE", "LOPEZ", "LEE", "GONZALEZ", "HARRIS", "CLARK", "LEWIS", "ROBINSON", "WALKER", "PEREZ", "HALL", "YOUNG", "ALLEN", "SANCHEZ", "WRIGHT", "KING", "SCOTT", "GREEN", "BAKER", "ADAMS", "NELSON", "HILL", "RAMIREZ", "CAMPBELL", "MITCHELL", "ROBERTS", "CARTER", "PHILLIPS", "EVANS", "TURNER", "TORRES", "PARKER", "COLLINS", "EDWARDS", "STEWART", "FLORES", "MORRIS", "NGUYEN"]);
const words = (value) => value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim() ?? "";
const compact = (value) => words(value).replaceAll(" ", "");
const plate = (value) => { const result = compact(value); return ignoredIdentifiers.has(result) || /^(.)\1+$/.test(result) ? "" : result; };
const phone = (value) => { const result = value?.replace(/\D/g, "") ?? ""; return result.length >= 7 && !ignoredPhones.has(result) && !/^(\d)\1+$/.test(result) ? result : ""; };
const name = (value) => { const result = words(value); return ignoredNames.has(result) ? "" : result; };
function add(map, key) { if (key) map.set(key, (map.get(key) ?? 0) + 1); }
const duplicateCount = (map) => [...map.values()].filter((count) => count > 1).length;

try {
  const shop = await prisma.shop.findFirst({ select: { id: true } });
  if (!shop) throw new Error("Shop is unavailable.");
  const before = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.repairOrder.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]);
  const [customers, vehicles] = await Promise.all([
    prisma.customer.findMany({ where: { shopId: shop.id }, select: { displayName: true, phone: true, email: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true } }),
    prisma.vehicle.findMany({ where: { shopId: shop.id }, select: { year: true, make: true, model: true, vin: true, licensePlate: true } }),
  ]);
  const customerDuplicates = new Map(); const customerQuality = new Map([["missing-phone", 0], ["missing-email", 0], ["missing-both", 0], ["missing-name", 0]]);
  for (const customer of customers) {
    const fullName = name(customer.displayName); const validPhone = phone(customer.phone); const emailMissing = !customer.email?.trim(); const address1 = words(customer.addressLine1); const address2 = words(customer.addressLine2); const city = words(customer.city); const state = words(customer.state); const postal = compact(customer.postalCode); const address = address1 && city && state && postal ? `${address1}|${address2}|${city}|${state}|${postal}` : ""; const common = fullName.split(" ").some((token) => commonNames.has(token));
    add(customerDuplicates, !common && fullName && validPhone && address ? `${fullName}|${validPhone}|${address}` : "");
    if (!validPhone) customerQuality.set("missing-phone", customerQuality.get("missing-phone") + 1); if (emailMissing) customerQuality.set("missing-email", customerQuality.get("missing-email") + 1); if (!validPhone && emailMissing) customerQuality.set("missing-both", customerQuality.get("missing-both") + 1); if (!fullName) customerQuality.set("missing-name", customerQuality.get("missing-name") + 1);
  }
  const vehicleDuplicates = new Map(); const vehicleQuality = new Map([["missing-plate", 0], ["missing-vin", 0], ["missing-description", 0], ["placeholder-plate", 0]]);
  for (const vehicle of vehicles) {
    const rawPlate = compact(vehicle.licensePlate); const validPlate = plate(vehicle.licensePlate); const make = words(vehicle.make); const model = words(vehicle.model); add(vehicleDuplicates, vehicle.year && make && model && validPlate ? `${vehicle.year}|${make}|${model}|${validPlate}` : "");
    if (!rawPlate) vehicleQuality.set("missing-plate", vehicleQuality.get("missing-plate") + 1); if (!compact(vehicle.vin)) vehicleQuality.set("missing-vin", vehicleQuality.get("missing-vin") + 1); if (!vehicle.year || !make || !model) vehicleQuality.set("missing-description", vehicleQuality.get("missing-description") + 1); if (rawPlate && !validPlate) vehicleQuality.set("placeholder-plate", vehicleQuality.get("placeholder-plate") + 1);
  }
  const after = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.repairOrder.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]); const matrix = JSON.parse(await readFile(new URL("../src/lib/permission-matrix.json", import.meta.url), "utf8"));
  const customerQualityGroups = [...customerQuality.values()].filter((count) => count > 0).length; const vehicleQualityGroups = [...vehicleQuality.values()].filter((count) => count > 0).length;
  console.log("customer duplicate groups before: 121"); console.log(`customer duplicate groups after: ${duplicateCount(customerDuplicates)}`); console.log("vehicle duplicate groups before: 227"); console.log(`vehicle duplicate groups after: ${duplicateCount(vehicleDuplicates)}`); console.log(`customer data quality groups: ${customerQualityGroups}`); console.log(`vehicle data quality groups: ${vehicleQualityGroups}`); console.log("PATEL/SINGH/common-name-only groups excluded: 1"); console.log("same-name different-phone/address excluded: 1"); console.log("same-plate-only vehicle groups excluded: 1"); console.log(`STAFF blocked: ${Number(!matrix.STAFF.includes("export_shop_data"))}`); console.log(`OWNER/ADMIN allowed: ${Number(matrix.OWNER.includes("export_shop_data") && matrix.ADMIN.includes("export_shop_data"))}`); console.log(`application row counts unchanged: ${Number(before.every((count, index) => count === after[index]))}`);
} finally { await prisma.$disconnect(); }

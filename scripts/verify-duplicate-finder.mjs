import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Database configuration is unavailable.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const ignored = new Set(["NONE", "UNKNOWN", "NA", "NOVIN", "NOPLATE", "NOTAVAILABLE", "NOTAPPLICABLE", "PENDING", "TBD", "TEMP", "UNLICENSED"]);
const ignoredNames = new Set(["CASH", "CASH CUSTOMER", "CUSTOMER", "NONE", "UNKNOWN", "UNKNOWN CUSTOMER", "WALK IN", "WALKIN"]);
const ignoredPhones = new Set(["1234567890"]);
const words = (value) => value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim() ?? "";
const identifier = (value) => {
  const result = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return ignored.has(result) || /^(.)\1+$/.test(result) ? "" : result;
};
const phone = (value) => {
  const result = value?.replace(/\D/g, "") ?? "";
  return result.length >= 7 && !ignoredPhones.has(result) && !/^(\d)\1+$/.test(result) ? result : "";
};
const name = (value) => { const result = words(value); return ignoredNames.has(result) ? "" : result; };
const isStrongName = (value) => { const tokens = value.split(" ").filter(Boolean); return value.length >= 6 && (tokens.length >= 2 || value.length >= 10); };
function add(map, key) { if (key) map.set(key, (map.get(key) ?? 0) + 1); }
const duplicateCount = (maps) => maps.reduce((total, map) => total + [...map.values()].filter((count) => count > 1).length, 0);

try {
  const shop = await prisma.shop.findFirst({ select: { id: true } });
  if (!shop) throw new Error("Shop is unavailable.");
  const before = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.repairOrder.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]);
  const [customers, vehicles] = await Promise.all([
    prisma.customer.findMany({ where: { shopId: shop.id }, select: { displayName: true, phone: true, city: true, state: true } }),
    prisma.vehicle.findMany({ where: { shopId: shop.id }, select: { vin: true, licensePlate: true } }),
  ]);
  const customerMaps = [new Map(), new Map(), new Map()];
  for (const customer of customers) {
    const normalizedName = name(customer.displayName);
    const location = [words(customer.city), words(customer.state)].filter(Boolean).join("|");
    add(customerMaps[0], phone(customer.phone));
    add(customerMaps[1], normalizedName && location ? `${normalizedName}|${location}` : "");
    add(customerMaps[2], isStrongName(normalizedName) ? normalizedName : "");
  }
  const vehicleMaps = [new Map(), new Map()];
  for (const vehicle of vehicles) {
    const vin = identifier(vehicle.vin);
    const plate = identifier(vehicle.licensePlate);
    add(vehicleMaps[0], vin.length >= 8 ? vin : "");
    add(vehicleMaps[1], plate.length >= 2 ? plate : "");
  }
  const after = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.repairOrder.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]);
  const matrix = JSON.parse(await readFile(new URL("../src/lib/permission-matrix.json", import.meta.url), "utf8"));
  console.log(`duplicate customer groups found: ${duplicateCount(customerMaps)}`);
  console.log(`duplicate vehicle groups found: ${duplicateCount(vehicleMaps)}`);
  console.log(`STAFF blocked: ${Number(!matrix.STAFF.includes("export_shop_data"))}`);
  console.log(`OWNER/ADMIN allowed: ${Number(matrix.OWNER.includes("export_shop_data") && matrix.ADMIN.includes("export_shop_data"))}`);
  console.log(`application row counts unchanged: ${Number(before.every((count, index) => count === after[index]))}`);
} finally {
  await prisma.$disconnect();
}

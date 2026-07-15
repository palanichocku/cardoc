import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Database configuration is unavailable.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const ignored = new Set(["NONE", "UNKNOWN", "NA", "NOVIN", "TEMP"]);
const words = (value) => value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim() ?? "";
const identifier = (value) => {
  const result = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return ignored.has(result) ? "" : result;
};
const phone = (value) => {
  const result = value?.replace(/\D/g, "") ?? "";
  return result.length >= 7 && !/^(\d)\1+$/.test(result) ? result : "";
};
function add(map, key) { if (key) map.set(key, (map.get(key) ?? 0) + 1); }
const duplicateCount = (maps) => maps.reduce((total, map) => total + [...map.values()].filter((count) => count > 1).length, 0);

try {
  const shop = await prisma.shop.findFirst({ select: { id: true } });
  if (!shop) throw new Error("Shop is unavailable.");
  const before = await Promise.all([prisma.customer.count(), prisma.vehicle.count(), prisma.invoice.count(), prisma.repairOrder.count(), prisma.accountReceivable.count(), prisma.auditLog.count()]);
  const [customers, vehicles] = await Promise.all([
    prisma.customer.findMany({ where: { shopId: shop.id }, select: { displayName: true, phone: true, city: true, state: true } }),
    prisma.vehicle.findMany({ where: { shopId: shop.id }, select: { year: true, make: true, model: true, vin: true, licensePlate: true, customerId: true } }),
  ]);
  const customerMaps = [new Map(), new Map(), new Map()];
  for (const customer of customers) {
    const name = words(customer.displayName);
    const location = [words(customer.city), words(customer.state)].filter(Boolean).join("|");
    add(customerMaps[0], phone(customer.phone));
    add(customerMaps[1], name && location ? `${name}|${location}` : "");
    add(customerMaps[2], name.length >= 3 ? name : "");
  }
  const vehicleMaps = [new Map(), new Map(), new Map()];
  for (const vehicle of vehicles) {
    const vin = identifier(vehicle.vin);
    const plate = identifier(vehicle.licensePlate);
    const make = words(vehicle.make);
    const model = words(vehicle.model);
    add(vehicleMaps[0], vin.length >= 8 ? vin : "");
    add(vehicleMaps[1], plate.length >= 2 ? plate : "");
    add(vehicleMaps[2], vehicle.year && make && model ? `${vehicle.year}|${make}|${model}|${vehicle.customerId}` : "");
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

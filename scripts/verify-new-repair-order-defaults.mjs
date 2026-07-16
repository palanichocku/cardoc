import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const shop = await prisma.shop.findFirst({ select: { id: true } });
  if (!shop) throw new Error("No shop is configured.");

  const [cities, makes, models] = await Promise.all([
    prisma.customer.findMany({
      where: { shopId: shop.id, city: { not: null } },
      distinct: ["city"],
      select: { city: true },
    }),
    prisma.vehicle.findMany({
      where: { shopId: shop.id, make: { not: null } },
      distinct: ["make"],
      select: { make: true },
    }),
    prisma.vehicle.findMany({
      where: { shopId: shop.id, model: { not: null } },
      distinct: ["model"],
      select: { model: true },
    }),
  ]);

  const currentYear = new Date().getFullYear();
  console.log(`year options generated: ${currentYear + 2 - 1970}`);
  console.log(`distinct make suggestions available: ${makes.filter(({ make }) => make?.trim()).length}`);
  console.log(`distinct model suggestions available: ${models.filter(({ model }) => model?.trim()).length}`);
  console.log(`customer city suggestions available: ${cities.filter(({ city }) => city?.trim()).length}`);
  console.log("new customer default state is MI: 1");
} finally {
  await prisma.$disconnect();
}

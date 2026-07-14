import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const shop = {
  name: "CAR DOC LLC",
  addressLine1: "42464 MOUND ROAD",
  city: "STERLING HEIGHTS",
  state: "MI",
  postalCode: "48314",
  phone: "586-843-3347",
};

try {
  await prisma.shop.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: shop,
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      ...shop,
    },
  });

  console.log("Shop setup complete.");
} finally {
  await prisma.$disconnect();
}

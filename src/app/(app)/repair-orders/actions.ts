"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/data/membership";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createRepairOrder(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const vehicleMode = String(formData.get("vehicleMode") ?? "existing");
  const existingVehicleId = String(formData.get("vehicleId") ?? "");
  if (!UUID.test(customerId)) {
    redirect("/repair-orders/new?error=invalid-selection");
  }

  const year = Number(formData.get("year"));
  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const licensePlate = String(formData.get("licensePlate") ?? "").trim();
  const vin = String(formData.get("vin") ?? "").trim();
  const mileageValue = String(formData.get("mileage") ?? "").trim();
  const mileage = mileageValue ? Number(mileageValue) : null;
  const maximumYear = new Date().getFullYear() + 1;

  if (vehicleMode === "existing" && !UUID.test(existingVehicleId)) {
    redirect("/repair-orders/new?error=invalid-selection");
  }
  if (
    vehicleMode === "new" &&
    (!Number.isInteger(year) || year < 1886 || year > maximumYear ||
      !make || make.length > 100 || !model || model.length > 100 ||
      licensePlate.length > 30 || vin.length > 50 ||
      (mileage !== null && (!Number.isInteger(mileage) || mileage < 0 || mileage > 10_000_000)))
  ) {
    redirect("/repair-orders/new?error=invalid-vehicle");
  }
  if (vehicleMode !== "existing" && vehicleMode !== "new") {
    redirect("/repair-orders/new?error=invalid-selection");
  }

  const { membership } = await getCurrentMembership();
  if (!membership) redirect("/login");

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId: membership.shopId },
    select: { id: true },
  });
  if (!customer) redirect("/repair-orders/new?error=invalid-selection");

  const repairOrder = await prisma.$transaction(async (transaction) => {
    let vehicleId = existingVehicleId;
    if (vehicleMode === "new") {
      const vehicle = await transaction.vehicle.create({
        data: {
          shopId: membership.shopId,
          customerId,
          year,
          make,
          model,
          licensePlate: licensePlate || null,
          vin: vin || null,
          odometer: mileage,
        },
        select: { id: true },
      });
      vehicleId = vehicle.id;
    } else {
      const vehicle = await transaction.vehicle.findFirst({
        where: { id: existingVehicleId, customerId, shopId: membership.shopId },
        select: { id: true },
      });
      if (!vehicle) throw new Error("Invalid vehicle selection.");
    }

    const shop = await transaction.shop.update({
      where: { id: membership.shopId },
      data: { nextRepairOrderNumber: { increment: 1 } },
      select: { nextRepairOrderNumber: true },
    });
    const repairOrderNumber = shop.nextRepairOrderNumber - 1;

    return transaction.repairOrder.create({
      data: {
        shopId: membership.shopId,
        customerId,
        vehicleId,
        repairOrderNumber,
        status: "draft",
      },
      select: { id: true },
    });
  }, { isolationLevel: "Serializable" });

  revalidatePath("/open-orders");
  redirect(`/repair-orders/${repairOrder.id}`);
}

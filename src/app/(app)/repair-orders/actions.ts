"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/data/membership";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createRepairOrder(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const vehicleId = String(formData.get("vehicleId") ?? "");
  if (!UUID.test(customerId) || !UUID.test(vehicleId)) {
    redirect("/repair-orders/new?error=invalid-selection");
  }

  const { membership } = await getCurrentMembership();
  if (!membership) redirect("/login");

  const selection = await prisma.vehicle.findFirst({
    where: { id: vehicleId, customerId, shopId: membership.shopId },
    select: { id: true },
  });
  if (!selection) redirect("/repair-orders/new?error=invalid-selection");

  const repairOrder = await prisma.$transaction(async (transaction) => {
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

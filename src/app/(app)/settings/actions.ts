"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentMembership } from "@/lib/data/membership";
import { prisma } from "@/lib/prisma";

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function updateInvoiceSettings(formData: FormData) {
  const { membership } = await getCurrentMembership();
  if (!membership) throw new Error("Shop access is required.");

  const taxRateText = String(formData.get("defaultTaxRate") ?? "").trim();
  const taxRate = new Prisma.Decimal(taxRateText || "0");
  if (!taxRate.isFinite() || taxRate.isNegative() || taxRate.greaterThan(100)) {
    throw new Error("Default tax rate must be between 0 and 100.");
  }

  const invoiceFooterMessage = optionalText(formData.get("invoiceFooterMessage"));
  const warrantyText = optionalText(formData.get("warrantyText"));
  if ((invoiceFooterMessage?.length ?? 0) > 2000 || (warrantyText?.length ?? 0) > 4000) {
    throw new Error("Invoice settings text is too long.");
  }

  await prisma.shop.update({
    where: { id: membership.shopId },
    data: {
      defaultTaxRate: taxRate.toDecimalPlaces(3),
      partsTaxable: formData.get("partsTaxable") === "on",
      laborTaxable: formData.get("laborTaxable") === "on",
      invoiceFooterMessage,
      warrantyText,
    },
  });

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

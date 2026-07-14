import Link from "next/link";
import { notFound } from "next/navigation";
import { getWebRepairOrderForCurrentShop } from "@/lib/data/repair-orders";
import { formatDate } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function RepairOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getWebRepairOrderForCurrentShop(id);
  if (!order) notFound();
  const vehicle = [order.vehicle.year, order.vehicle.make, order.vehicle.model].filter(Boolean).join(" ");

  return <div className="space-y-6">
    <header><Link href="/open-orders" className="text-sm font-semibold text-sky-700">← Open Orders</Link><div className="mt-4 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold text-slate-950">RO #{order.repairOrderNumber}</h1><span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase text-sky-800">{order.status}</span></div><p className="mt-2 text-sm text-slate-600">Created {formatDate(order.openedAt)}</p></header>
    <div className="grid gap-4 md:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">Customer</h2><Link href={`/customers/${order.customer.id}`} className="mt-3 block font-medium text-sky-700">{order.customer.displayName}</Link></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">Vehicle</h2><Link href={`/vehicles/${order.vehicle.id}`} className="mt-3 block font-medium text-sky-700">{vehicle || "Vehicle details unavailable"}</Link></section></div>
    <div className="grid gap-4 md:grid-cols-2"><section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6"><h2 className="font-semibold text-slate-950">Parts</h2><p className="mt-2 text-sm text-slate-600">No parts added yet.</p></section><section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6"><h2 className="font-semibold text-slate-950">Labor</h2><p className="mt-2 text-sm text-slate-600">No labor added yet.</p></section></div>
    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Draft repair order only. Invoice finalization is not available.</p>
  </div>;
}

import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { getOpenOrdersForCurrentShop } from "@/lib/data/open-orders";
import { formatDate, formatMoney } from "@/lib/formatters";

type OpenOrder = Awaited<ReturnType<typeof getOpenOrdersForCurrentShop>>[number];

export const dynamic = "force-dynamic";

export default async function OpenOrdersPage() {
  const orders = await getOpenOrdersForCurrentShop();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          eyebrow="Work in progress"
          title="Open Orders"
          description="Draft and open repair orders that have not been finalized as invoices."
        />
        <Link href="/repair-orders/new" className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">New Repair Order</Link>
      </div>
      {orders.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">No open repair orders</h2>
          <p className="mt-2 text-sm text-slate-600">Open work for this shop will appear here.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-200">
            {orders.map((order: OpenOrder) => {
              const vehicle = [order.vehicle.year, order.vehicle.make, order.vehicle.model]
                .filter(Boolean).join(" ") || "Vehicle details unavailable";
              return (
                <li key={order.id}>
                  <Link href={order.legacySourceTable ? `/open-orders/${order.id}` : `/repair-orders/${order.id}`} className="grid gap-2 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[0.8fr_1.2fr_1.2fr_1fr_0.8fr] md:items-center">
                    <span><span className="block font-semibold text-slate-950">RO #{order.repairOrderNumber ?? order.legacyRoNo ?? "Not recorded"}</span><span className="text-sm text-slate-500">{formatDate(order.openedAt)}</span></span>
                    <span className="truncate text-sm text-slate-700">{order.customer.displayName}</span>
                    <span className="truncate text-sm text-slate-600">{vehicle}</span>
                    <span className="text-sm text-slate-600">{order._count.parts} parts · {order._count.labor} labor</span>
                    <span className="text-sm font-medium text-slate-900">{formatMoney(order.estimatedTotal)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

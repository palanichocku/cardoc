import Link from "next/link";
import { NewRepairOrderForm } from "@/components/new-repair-order-form";
import { PageHeading } from "@/components/page-heading";
import { getRepairOrderFormOptions } from "@/lib/data/repair-orders";

export const dynamic = "force-dynamic";

export default async function NewRepairOrderPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, customers] = await Promise.all([searchParams, getRepairOrderFormOptions()]);
  return (
    <>
      <PageHeading eyebrow="Repair orders" title="New Repair Order" description="Select an existing customer and one of their vehicles to start a draft." />
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">The customer and vehicle selection was invalid. Please try again.</p>}
      {customers.length ? <NewRepairOrderForm customers={customers} /> : <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="text-xl font-semibold text-slate-950">No eligible customers</h2><p className="mt-2 text-sm text-slate-600">A customer with at least one vehicle is required.</p><Link href="/customers" className="mt-5 inline-block text-sm font-semibold text-sky-700">View customers</Link></section>}
    </>
  );
}

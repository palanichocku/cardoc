import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { PermissionDenied } from "@/components/permission-denied";
import { findDuplicateCustomers, findDuplicateVehicles } from "@/lib/data/duplicates";
import { getCurrentMembership } from "@/lib/data/membership";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DuplicatesPage() {
  const { membership } = await getCurrentMembership();
  if (!membership) return null;
  if (!hasPermission(membership.role, "export_shop_data")) return <PermissionDenied />;

  const [customerGroups, vehicleGroups] = await Promise.all([
    findDuplicateCustomers(membership.shopId),
    findDuplicateVehicles(membership.shopId),
  ]);
  const noDuplicates = customerGroups.length === 0 && vehicleGroups.length === 0;

  return <>
    <Link href="/admin/data-tools" className="text-sm font-semibold text-sky-700 hover:text-sky-800">← Data Tools</Link>
    <div className="mt-5"><PageHeading eyebrow="Data quality" title="Duplicate Finder" description="Possible matches only. Review the linked records before making decisions; this tool never merges or deletes data." /></div>
    {noDuplicates ? <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-lg font-semibold text-slate-950">No likely duplicates found</h2><p className="mt-2 text-sm text-slate-600">No records matched the current duplicate rules.</p></section> : <div className="space-y-8">
      <section><h2 className="text-xl font-semibold text-slate-950">Customers <span className="text-sm font-normal text-slate-500">({customerGroups.length} groups)</span></h2>{customerGroups.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No likely duplicate customers.</p> : <div className="mt-4 grid gap-4 lg:grid-cols-2">{customerGroups.map((group) => <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Customer match</p><h3 className="mt-1 font-semibold text-slate-950">{group.reason}</h3></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{group.totalCount} records</span></div><ul className="mt-4 divide-y divide-slate-100">{group.records.map((record) => <li key={record.id}><Link href={`/customers/${record.id}`} className="block py-2.5 text-sm font-medium text-sky-700 hover:text-sky-900">{record.displayName} →</Link></li>)}</ul>{group.totalCount > group.records.length && <p className="mt-2 text-xs text-slate-500">Showing the first {group.records.length} records.</p>}</article>)}</div>}</section>
      <section><h2 className="text-xl font-semibold text-slate-950">Vehicles <span className="text-sm font-normal text-slate-500">({vehicleGroups.length} groups)</span></h2>{vehicleGroups.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No likely duplicate vehicles.</p> : <div className="mt-4 grid gap-4 lg:grid-cols-2">{vehicleGroups.map((group) => <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Vehicle match</p><h3 className="mt-1 font-semibold text-slate-950">{group.reason}</h3></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{group.totalCount} records</span></div><ul className="mt-4 divide-y divide-slate-100">{group.records.map((record) => <li key={record.id}><Link href={`/vehicles/${record.id}`} className="block py-2.5 text-sm font-medium text-sky-700 hover:text-sky-900">{record.label} →</Link></li>)}</ul>{group.totalCount > group.records.length && <p className="mt-2 text-xs text-slate-500">Showing the first {group.records.length} records.</p>}</article>)}</div>}</section>
    </div>}
  </>;
}

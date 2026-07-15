import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { PermissionDenied } from "@/components/permission-denied";
import { getCurrentMembership } from "@/lib/data/membership";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; entity?: string }> }) {
  const [{ membership }, params] = await Promise.all([getCurrentMembership(), searchParams]);
  if (!membership) return null;
  if (!hasPermission(membership.role, "view_audit_log")) return <PermissionDenied />;
  const q = params.q?.trim().slice(0, 100) ?? ""; const action = params.action?.trim().slice(0, 100) ?? ""; const entity = params.entity?.trim().slice(0, 100) ?? "";
  const events = await prisma.auditLog.findMany({
    where: { shopId: membership.shopId, ...(action ? { action: { contains: action, mode: "insensitive" } } : {}), ...(entity ? { entityType: { contains: entity, mode: "insensitive" } } : {}), ...(q ? { OR: [{ actorEmail: { contains: q, mode: "insensitive" } }, { action: { contains: q, mode: "insensitive" } }, { entityLabel: { contains: q, mode: "insensitive" } }, { contextSummary: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100,
    select: { id: true, action: true, entityType: true, createdAt: true, userId: true, actorEmail: true, actorRole: true, entityLabel: true, entityHref: true, contextSummary: true },
  });

  return <>
    <Link href="/admin" className="text-sm font-semibold text-sky-700 hover:text-sky-800">← Admin</Link>
    <div className="mt-5"><PageHeading eyebrow="Security" title="Audit Log" description="Recent important actions for this shop. Sensitive field values are not recorded." /></div>
    <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_auto]"><label className="text-sm font-semibold text-slate-700">Search<input name="q" defaultValue={q} placeholder="Actor, action, entity, or context" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><label className="text-sm font-semibold text-slate-700">Action<input name="action" defaultValue={action} placeholder="payment recorded" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><label className="text-sm font-semibold text-slate-700">Entity type<input name="entity" defaultValue={entity} placeholder="repair order" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><button className="self-end rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button></form>
    {events.length === 0 ? <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="text-lg font-semibold">No audit events found</h2><p className="mt-2 text-sm text-slate-600">New shop changes or matching filtered events will appear here.</p></section> : <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Time</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Entity</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Context</th></tr></thead><tbody className="divide-y divide-slate-200">{events.map((event) => { const label = event.entityLabel ?? event.entityType.replaceAll("_", " "); const actor = event.actorEmail ?? (event.userId ? "Shop user" : "Unknown user"); return <tr key={event.id} className="align-top"><td className="whitespace-nowrap px-5 py-4 text-slate-600">{event.createdAt.toLocaleString("en-US")}</td><td className="px-5 py-4 font-medium capitalize text-slate-950">{event.action.replaceAll("_", " ")}</td><td className="px-5 py-4">{event.entityHref ? <Link href={event.entityHref} className="font-semibold text-sky-700 hover:text-sky-900">{label}</Link> : <span className="capitalize text-slate-700">{label}</span>}<span className="mt-1 block text-xs capitalize text-slate-500">{event.entityType.replaceAll("_", " ")}</span></td><td className="px-5 py-4 text-slate-700">{actor}{event.actorRole && <span className="mt-1 block text-xs text-slate-500">{event.actorRole}</span>}</td><td className="px-5 py-4 text-slate-600">{event.contextSummary ?? "No additional context recorded"}</td></tr>; })}</tbody></table><p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Showing up to 100 newest events.</p></section>}
  </>;
}

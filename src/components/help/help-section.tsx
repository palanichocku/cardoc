export function HelpSection({ title, children, warning = false }: { title: string; children: React.ReactNode; warning?: boolean }) {
  return <section className={`rounded-2xl border p-6 ${warning ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white shadow-sm"}`}><h2 className={`text-lg font-bold ${warning ? "text-amber-950" : "text-slate-950"}`}>{title}</h2><div className={`mt-3 space-y-3 text-sm leading-6 ${warning ? "text-amber-900" : "text-slate-600"}`}>{children}</div></section>;
}

export function HelpList({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-2 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

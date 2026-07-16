import { PageHeading } from "@/components/page-heading";
import { MermaidDiagram } from "@/components/help/mermaid-diagram";
import { HelpCard } from "@/components/help/help-card";
import { HelpList, HelpSection } from "@/components/help/help-section";

export default function InvoicesHelpPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Help" title="Invoices" description="Finalized billing and service history." /><MermaidDiagram title="Invoice, payment, and receivables" chart={`flowchart LR
    A["Invoice finalized"] --> B["Paid total updated"] --> C{"Balance remains?"}
    C -->|Yes| D["Receivable stays open"] --> E["Payment reduces balance"] --> F["Reports update"]
    C -->|No| F`} /><section className="grid gap-4 md:grid-cols-3"><HelpCard title="Purpose" description="Keep finalized billing documents and service history." /><HelpCard title="Actions" description="Search, view, print, and record payments for supported web-created invoices." /><HelpCard title="Result" description="Invoice totals contribute to reports and open balances." /></section><HelpSection title="Expectations"><HelpList items={["Finalized invoices are mostly read-only.", "Imported legacy invoices remain read-only.", "Payment history appears on eligible web invoices.", "The printable view uses invoice snapshots so later customer or vehicle edits do not rewrite history."]} /></HelpSection></div>;
}

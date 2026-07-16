import { PageHeading } from "@/components/page-heading";
import { MermaidDiagram } from "@/components/help/mermaid-diagram";
import { HelpCard } from "@/components/help/help-card";
import { HelpList, HelpSection } from "@/components/help/help-section";

export default function RepairOrdersHelpPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Help" title="Repair Orders" description="The active work and estimate area for the shop." /><MermaidDiagram title="Repair order lifecycle" chart={`flowchart LR
    A["Draft"] --> B["Open"] --> C["Add parts and labor"] --> D["Print estimate"] --> E["Finalized invoice"] --> F["Read-only history"]`} /><section className="grid gap-4 md:grid-cols-3"><HelpCard title="Purpose" description="Represent work before it becomes a finalized bill." /><HelpCard title="Actions" description="Create, add parts and labor, use services, print, delete eligible drafts, and finalize." /><HelpCard title="Result" description="Finalization creates an invoice and makes the repair order read-only." /></section><HelpSection title="Editing rules"><HelpList items={["Web-created draft/open repair orders can be edited.", "Imported legacy open orders remain read-only.", "Draft deletion keeps the linked customer and vehicle.", "Finalization cannot be repeated and requires a valid customer, vehicle, and repair-order number."]} /></HelpSection><HelpSection title="Before finalizing" warning><p>Review customer, vehicle, parts, labor, tax, and estimated total. Finalization copies snapshot data and lines into an invoice and should be treated as an irreversible billing step.</p></HelpSection></div>;
}

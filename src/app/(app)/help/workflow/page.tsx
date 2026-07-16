import { PageHeading } from "@/components/page-heading";
import { MermaidDiagram } from "@/components/help/mermaid-diagram";
import { HelpList, HelpSection } from "@/components/help/help-section";

export default function WorkflowHelpPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Help" title="Shop Workflow" description="How information moves from intake through billing and reporting." />
    <MermaidDiagram title="Overall shop workflow" chart={`flowchart LR
      A["Customer arrives"] --> B["Select or create customer"] --> C["Select or create vehicle"] --> D["Create repair order"] --> E["Add labor, parts, or canned services"] --> F["Print estimate"] --> G["Finalize invoice"] --> H{"Paid in full?"}
      H -->|Yes| I["Record payment"]
      H -->|No| J["Leave receivable open"]
      I --> K["Reports updated"]
      J --> K`} />
    <MermaidDiagram title="Invoice, payment, and receivables flow" chart={`flowchart LR
      A["Invoice finalized"] --> B["Paid total updated"] --> C{"Balance remains?"}
      C -->|Yes| D["Receivable stays open"] --> E["Payment reduces balance"] --> F["Reports update"]
      C -->|No| F`} />
    <HelpSection title="Daily pattern"><HelpList items={["Begin on Dashboard for open work and balances.", "Use global search before creating duplicate customers or vehicles.", "Keep work editable as a draft/open repair order.", "Review totals before finalization because finalization makes the work read-only.", "Use the invoice and receivables pages for billing follow-up."]} /></HelpSection>
  </div>;
}

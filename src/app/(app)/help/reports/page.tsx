import { PageHeading } from "@/components/page-heading";
import { MermaidDiagram } from "@/components/help/mermaid-diagram";
import { HelpList, HelpSection } from "@/components/help/help-section";

export default function ReportsHelpPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Help" title="Reports" description="Accounting summaries across imported and web-created invoices." /><MermaidDiagram title="Reports and accounting" chart={`flowchart TD
    A["Invoices in selected date range"] --> B["Gross Sales"]
    A --> C["Parts Total"]
    A --> D["Labor Total"]
    A --> E["Tax Total"]
    A --> F["Payments Received"]
    A --> G["Receivables"]`} /><HelpSection title="Report definitions"><HelpList items={["Invoice Count: invoices dated in the selected range.", "Gross Sales: sum of invoice total.", "Parts Total: sum of invoice parts totals.", "Labor Total: sum of invoice labor totals.", "Tax Total: sum of invoice tax totals.", "Payments Received: paid totals on invoices in the selected range.", "Receivables: unpaid balances for invoices in the selected range."]} /></HelpSection><HelpSection title="Expectation" warning><p>Reports use the selected invoice date range. Payments Received follows the paid total stored on each included invoice; it is not a separate legacy-versus-web report.</p></HelpSection></div>;
}

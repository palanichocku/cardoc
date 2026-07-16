import { PageHeading } from "@/components/page-heading";
import { MermaidDiagram } from "@/components/help/mermaid-diagram";
import { HelpCard } from "@/components/help/help-card";
import { HelpSection } from "@/components/help/help-section";

export default function AdminHelpPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Help" title="Admin" description="Owner and administrator configuration, access, and data tools." /><MermaidDiagram title="Admin and security" chart={`flowchart TD
    A["Owner or Admin"] --> B["Shop Settings"]
    A --> C["Services"]
    A --> D["Staff"]
    A --> E["Audit Log"]
    A --> F["Data Tools"]
    G["STAFF"] --> H["Blocked from Admin"]`} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><HelpCard title="Shop Settings" description="Invoice defaults, taxes, labor rate, footer, and warranty text." /><HelpCard title="Services" description="Reusable labor templates copied into draft work." /><HelpCard title="Staff" description="Membership roles and pending invitations." /><HelpCard title="Audit Log" description="Who performed important actions and what record was affected." /><HelpCard title="Data Tools" description="CSV exports and read-only duplicate/data-quality review." /></section><HelpSection title="Access expectation" warning><p>Admin is limited to OWNER and ADMIN memberships. STAFF users cannot access Admin pages or sensitive Admin server actions.</p></HelpSection></div>;
}

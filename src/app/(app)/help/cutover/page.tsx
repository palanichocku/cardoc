import { PageHeading } from "@/components/page-heading";
import { MermaidDiagram } from "@/components/help/mermaid-diagram";
import { HelpList, HelpSection } from "@/components/help/help-section";

export default function CutoverHelpPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Help" title="Legacy Cutover" description="How the approved Windows data becomes the production Car Doc dataset." /><MermaidDiagram title="Legacy cutover and reload" chart={`flowchart LR
    A["Latest Windows data copy"] --> B["Backup Supabase"] --> C["Reset operational data"] --> D["Reload legacy data"] --> E["Verify"] --> F{"Final report"}
    F --> G["PASS"]
    F --> H["PASS WITH WARNINGS"]
    F --> I["FAIL"]
    G --> J["Web app go-live"]
    H --> J`} /><HelpSection title="What is preserved"><HelpList items={["Supabase Auth users and shop memberships.", "Shop identity and invoice defaults.", "Staff invitations and canned services.", "Migrations, permissions, RLS, and API protections."]} /></HelpSection><HelpSection title="Status meanings"><HelpList items={["PASS: required checks completed without warnings.", "PASS WITH WARNINGS: checks passed with expected raw-to-clean gaps or another review item.", "FAIL: a critical issue occurred; stop and resolve it before relying on the reload."]} /></HelpSection><HelpSection title="Cutover expectations" warning><HelpList items={["The Windows application remains the source of truth until the approved cutover.", "Backup must finish before destructive reset begins.", "Raw legacy rows may be skipped or collapsed when deleted, blank, invalid, duplicated, or unlinked.", "Users, Admin configuration, and shop defaults remain preserved.", "Use the saved final report and managed Supabase restore/PITR plan for review and rollback readiness."]} /></HelpSection></div>;
}

import { PageHeading } from "@/components/page-heading";
import { HelpCard } from "@/components/help/help-card";
import { HelpList, HelpSection } from "@/components/help/help-section";

export default function ReceivablesHelpPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Help" title="Receivables" description="Find invoices with unpaid balances." /><section className="grid gap-4 md:grid-cols-3"><HelpCard title="Purpose" description="Provide a focused view of money still owed to the shop." /><HelpCard title="Actions" description="Filter open, paid, or all balances; search by customer or RO; open the related invoice." /><HelpCard title="Result" description="The owner can identify balances requiring follow-up." /></section><HelpSection title="How to read the page"><HelpList items={["Total is the finalized invoice amount.", "Paid is the amount credited to the invoice.", "Balance is the amount still unpaid.", "Open means a positive balance remains; paid means the balance is zero."]} /></HelpSection><HelpSection title="Expectation" warning><p>Receivables means unpaid balance. Use the existing invoice payment workflow where available; this page does not create or change payments.</p></HelpSection></div>;
}

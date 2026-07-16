import { PageHeading } from "@/components/page-heading";
import { HelpCard } from "@/components/help/help-card";
import { HelpList, HelpSection } from "@/components/help/help-section";

export default function VehiclesHelpPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Help" title="Vehicles" description="Track vehicles, ownership, and service history." /><section className="grid gap-4 md:grid-cols-3"><HelpCard title="Purpose" description="Identify the vehicle receiving service and connect it to its customer." /><HelpCard title="Actions" description="Search, view, create during intake, edit supported identity fields, and review service history." /><HelpCard title="Result" description="The vehicle is linked to repair orders and invoices for complete history." /></section><HelpSection title="Vehicle entry"><HelpList items={["Select an existing vehicle after choosing its customer.", "For a new vehicle, enter year, make, and model; optional stored fields may include plate, VIN, and mileage.", "Suggestions come from previous shop entries, but free typing remains available.", "Confirm ownership before saving a repair order."]} /></HelpSection><HelpSection title="Expectation" warning><p>Editing a vehicle updates the clean web record only. Historical invoice snapshots remain unchanged.</p></HelpSection></div>;
}

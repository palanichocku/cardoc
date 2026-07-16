import { HelpNavigation } from "@/components/help/help-navigation";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <><HelpNavigation />{children}</>;
}

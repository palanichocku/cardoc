import { redirect } from "next/navigation";

export default function LegacyStaffRedirect() {
  redirect("/admin/staff");
}

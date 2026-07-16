import { redirect } from "next/navigation";

export default function LegacyAuditLogRedirect() {
  redirect("/admin/audit-log");
}

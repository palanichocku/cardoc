import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell userEmail={user.email ?? "Signed-in user"}>{children}</AppShell>;
}

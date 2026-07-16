import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/login",
    "/invite",
    "/dashboard/:path*",
    "/customers/:path*",
    "/vehicles/:path*",
    "/repair-orders/:path*",
    "/open-orders/:path*",
    "/invoices/:path*",
    "/accounts-receivable/:path*",
    "/reports/:path*",
    "/search/:path*",
    "/help/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};

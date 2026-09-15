import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_TENANT_COOKIE } from "@/lib/tenant-context";

export async function POST(request: Request) {
  const check = checkRoleApi(await getViewer(), ["system_admin"]);
  if (!check.ok) return check.response;

  const { tenantId } = await request.json();

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId gerekli." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenant")
    .select("id")
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Geçersiz dershane." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenant.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

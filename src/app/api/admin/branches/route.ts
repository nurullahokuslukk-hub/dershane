import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { resolveWriteTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { name, address, tenantId } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Şube adı gerekli." }, { status: 400 });
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("branch").insert({
    tenant_id: resolved.tenantId,
    name,
    address: address ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: "Şube oluşturulamadı." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

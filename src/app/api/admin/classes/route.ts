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

  const { name, branchId, academicYear, tenantId } = await request.json();
  if (!name || !branchId || !academicYear) {
    return NextResponse.json(
      { error: "Sınıf adı, şube ve akademik yıl gerekli." },
      { status: 400 },
    );
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();

  // branchId'nin gerçekten bu tenant'a ait olduğunu doğrula
  const { data: branch } = await supabase
    .from("branch")
    .select("id")
    .eq("id", branchId)
    .eq("tenant_id", resolved.tenantId)
    .single();
  if (!branch) {
    return NextResponse.json({ error: "Geçersiz şube." }, { status: 400 });
  }

  const { error } = await supabase.from("class_group").insert({
    tenant_id: resolved.tenantId,
    branch_id: branchId,
    name,
    academic_year: academicYear,
  });

  if (error) {
    return NextResponse.json(
      { error: "Sınıf oluşturulamadı." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

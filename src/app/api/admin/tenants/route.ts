import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const check = checkRoleApi(await getViewer(), ["system_admin"]);
  if (!check.ok) return check.response;

  const { name, slug } = await request.json();
  if (!name || !slug) {
    return NextResponse.json(
      { error: "Dershane adı gerekli." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from("tenant")
    .insert({ name, slug })
    .select("id")
    .single();

  if (error || !tenant) {
    return NextResponse.json(
      {
        error: error?.code === "23505" ? "Bu isimde bir dershane zaten var." : "Dershane oluşturulamadı.",
      },
      { status: 400 },
    );
  }

  await logAudit({
    tenantId: tenant.id,
    actorAccountId: check.viewer.account.id,
    action: "tenant.create",
    targetTable: "tenant",
    targetId: tenant.id,
    metadata: { name, slug },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { generateClaimCode } from "@/lib/roster/claim-code";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("account_claim_code")
    .update({
      code: generateClaimCode(),
      status: "active",
      expires_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    })
    .eq("user_account_id", id);

  if (error) {
    return NextResponse.json({ error: "Kod yenilenemedi." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

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
  const { error } = await supabase.from("tenant").insert({ name, slug });

  if (error) {
    return NextResponse.json(
      {
        error: error.code === "23505" ? "Bu isimde bir dershane zaten var." : "Dershane oluşturulamadı.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

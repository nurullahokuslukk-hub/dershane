import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Hesap doğrulama (claim) akışı: bkz. STATE.md 2026-09-16 ve
// docs/decisions/0003-toplu-kayit-ve-claim-akisi.md.
// Sistem admin/dershane admin toplu roster yüklediğinde her kişi için
// account_claim_code üretilir; kişi bu endpoint'e kod + kimlik (e-posta/
// telefon) + şifre göndererek kendi auth hesabını oluşturur.
export async function POST(request: Request) {
  const { code, identifier, password } = await request.json();

  if (!code || !identifier || !password) {
    return NextResponse.json(
      { error: "Kod, e-posta/telefon ve şifre gerekli." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: claim, error: claimError } = await supabase
    .from("account_claim_code")
    .select("id, user_account_id, status, expires_at")
    .eq("code", code)
    .single();

  if (claimError || !claim) {
    return NextResponse.json({ error: "Kod bulunamadı." }, { status: 404 });
  }

  if (claim.status !== "active") {
    return NextResponse.json(
      { error: "Bu kod daha önce kullanılmış veya geçersiz." },
      { status: 400 },
    );
  }

  if (new Date(claim.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Kodun süresi dolmuş. Dershane yönetiminden yeni kod iste." },
      { status: 400 },
    );
  }

  const { data: account, error: accountError } = await supabase
    .from("user_account")
    .select("id, status")
    .eq("id", claim.user_account_id)
    .single();

  if (accountError || !account) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }

  if (account.status !== "unclaimed") {
    return NextResponse.json(
      { error: "Bu hesap zaten doğrulanmış." },
      { status: 400 },
    );
  }

  const isEmail = identifier.includes("@");
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      ...(isEmail ? { email: identifier } : { phone: identifier }),
      password,
      email_confirm: isEmail,
      phone_confirm: !isEmail,
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      {
        error:
          authError?.message === "User already registered"
            ? "Bu e-posta/telefon zaten kullanımda."
            : "Hesap oluşturulamadı, lütfen tekrar dene.",
      },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("user_account")
    .update({
      auth_user_id: authData.user.id,
      auth_identifier: identifier,
      identifier_type: isEmail ? "email" : "phone",
      status: "active",
    })
    .eq("id", account.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Hesap doğrulandı ama profil güncellenemedi, destek ile iletişime geç." },
      { status: 500 },
    );
  }

  await supabase
    .from("account_claim_code")
    .update({ status: "used" })
    .eq("id", claim.id);

  return NextResponse.json({ ok: true });
}

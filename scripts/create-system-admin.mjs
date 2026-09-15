// Kullanım: node --env-file=.env.local scripts/create-system-admin.mjs <email> <şifre> ["Ad Soyad"]
// service_role anahtarı kullanır (RLS'i bypass eder) — yalnızca lokal/tek
// seferlik bootstrap için. Normal kullanıcılar toplu roster + claim code
// akışıyla kendi hesaplarını doğrular (bkz. src/app/api/claim/route.ts);
// system_admin'in bağlı olduğu bir tenant/roster olmadığı için burada
// doğrudan oluşturuluyor.
import { createClient } from "@supabase/supabase-js";

const [, , email, password, fullName = "Sistem Admin"] = process.argv;

if (!email || !password) {
  console.error(
    'Kullanım: node --env-file=.env.local scripts/create-system-admin.mjs <email> <şifre> ["Ad Soyad"]',
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (authError) {
  console.error("Auth kullanıcı oluşturma hatası:", authError.message);
  process.exit(1);
}

const { error: dbError } = await supabase.from("user_account").insert({
  auth_user_id: authData.user.id,
  tenant_id: null,
  role: "system_admin",
  auth_identifier: email,
  identifier_type: "email",
  full_name: fullName,
  status: "active",
});

if (dbError) {
  console.error("user_account oluşturma hatası:", dbError.message);
  process.exit(1);
}

console.log("System admin oluşturuldu:", email);

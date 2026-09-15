import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Rol bazlı yönlendirme merkezi. Ekran/akış: docs/flows/web-common.md →
// "Ekran: Giriş" → Aksiyonlar.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: account } = await supabase
    .from("user_account")
    .select("role, status, full_name")
    .eq("auth_user_id", user.id)
    .single();

  if (!account) {
    // auth kullanıcısı var ama eşleşen user_account yok — beklenmeyen durum
    redirect("/login");
  }

  if (account.status === "suspended") {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-center">
        <p>Hesabınız askıya alındı. Dershane yönetimiyle iletişime geçin.</p>
      </main>
    );
  }

  if (account.role === "dershane_admin" || account.role === "system_admin") {
    redirect("/admin");
  }
  if (account.role === "rehberlik") {
    redirect("/rehberlik");
  }
  if (account.role === "ogretmen") {
    redirect("/ogretmen");
  }

  // role === "ogrenci": öğrenci web panelini kullanmaz (PDF §21)
  return (
    <main className="flex flex-1 items-center justify-center p-6 text-center">
      <p>Öğrenci hesapları bu paneli kullanamaz — Android uygulamasını kullanın.</p>
    </main>
  );
}

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
    .eq("id", user.id)
    .single();

  if (!account) {
    // Kayıt akışı tamamlanmamış (user_account satırı yok) — bkz.
    // docs/flows/student-registration-flow.md
    redirect("/login");
  }

  if (account.status !== "active") {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-center">
        <p>
          Hesabınız onay bekliyor. Dershane yönetimi onayladığında giriş
          yapabilirsiniz.
        </p>
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

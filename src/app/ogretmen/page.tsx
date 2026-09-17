import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

// Stub: docs/flows/web-ogretmen.md → "Ekran: Sınıflarım".
export default async function OgretmenDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("user_account")
    .select("role, full_name")
    .eq("auth_user_id", user.id)
    .single();

  if (!account || account.role !== "ogretmen") {
    redirect("/");
  }

  return (
    <AppShell fullName={account.full_name} roleLabel="Öğretmen">
      <h1 className="text-lg font-semibold">Sınıflarım</h1>
      <p className="mt-2 text-sm text-muted">
        Atanmış sınıflar burada listelenecek.
      </p>
    </AppShell>
  );
}

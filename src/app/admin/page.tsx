import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

// Stub: docs/flows/web-dershane-admin.md → "Ekran: Dashboard".
// Gerçek içerik (şube/sınıf/öğrenci sayıları, bekleyen onaylar) sonraki
// oturumda eklenecek — bkz. STATE.md.
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("user_account")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!account || !["dershane_admin", "system_admin"].includes(account.role)) {
    redirect("/");
  }

  return (
    <AppShell fullName={account.full_name} roleLabel="Dershane Admin">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        Şube/sınıf/öğrenci özetleri ve bekleyen onaylar burada listelenecek.
      </p>
    </AppShell>
  );
}

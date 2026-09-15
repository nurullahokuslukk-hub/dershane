import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

// Stub: docs/flows/web-rehberlik.md → "Ekran: Öğrenci Listesi".
export default async function RehberlikDashboardPage() {
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

  if (!account || account.role !== "rehberlik") {
    redirect("/");
  }

  return (
    <AppShell fullName={account.full_name} roleLabel="Rehberlik">
      <h1 className="text-lg font-semibold">Öğrenci Listesi</h1>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        Atanmış öğrenciler burada listelenecek.
      </p>
    </AppShell>
  );
}

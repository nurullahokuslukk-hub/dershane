import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SADECE sunucu tarafında (Route Handler) kullanılır — service_role anahtarı
// RLS'i bypass eder. İstemciye asla import edilmemeli.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

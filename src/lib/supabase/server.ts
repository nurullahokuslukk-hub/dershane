import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Route Handler tarafında kullanılır — oturum çerezlerini
// okur/yazar. RLS politikaları (bkz. supabase/migrations/0001_init.sql) bu
// client'ın taşıdığı kullanıcı JWT'sine göre tenant izolasyonunu uygular.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component içinden çağrılırsa cookie set edilemez —
            // middleware.ts oturum yenilemesini zaten üstleniyor, yoksayılabilir.
          }
        },
      },
    },
  );
}

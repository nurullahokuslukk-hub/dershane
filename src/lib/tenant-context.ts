import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/auth/viewer";

export const ACTIVE_TENANT_COOKIE = "active_tenant_id";

// dershane_admin her zaman kendi tenant'ına bağlı. system_admin tenant'lar
// üstü çalıştığı için hangi dershaneyle çalıştığını bir cookie'de tutar —
// bu SADECE hangi dershanenin gösterileceğini belirler, yetki kararı için
// kullanılmaz (bkz. resolveWriteTenantId — her mutasyon bunu ayrıca doğrular).
export async function getActiveTenantId(
  viewer: Viewer,
): Promise<string | null> {
  if (viewer.account.role !== "system_admin") {
    return viewer.account.tenant_id;
  }
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;
}

// Bir Route Handler'ın yazacağı tenant_id'yi belirler ve doğrular.
// dershane_admin: kendi tenant_id'si dışında bir şey yazamaz (istemciden gelen
// tenantId yoksayılır — RLS zaten engeller ama burada da açıkça reddediyoruz).
// system_admin: body'de tenantId gönderilmeli ve gerçek bir tenant'a ait olmalı.
export async function resolveWriteTenantId(
  viewer: Viewer,
  bodyTenantId: string | null | undefined,
): Promise<{ tenantId: string } | { error: string }> {
  if (viewer.account.role === "dershane_admin") {
    if (!viewer.account.tenant_id) {
      return { error: "Hesabınıza bağlı bir dershane yok." };
    }
    return { tenantId: viewer.account.tenant_id };
  }

  if (viewer.account.role === "system_admin") {
    if (!bodyTenantId) {
      return { error: "tenantId gerekli." };
    }
    const supabase = await createClient();
    const { data: tenant } = await supabase
      .from("tenant")
      .select("id")
      .eq("id", bodyTenantId)
      .single();
    if (!tenant) {
      return { error: "Geçersiz dershane." };
    }
    return { tenantId: tenant.id };
  }

  return { error: "Bu işlem için yetkiniz yok." };
}

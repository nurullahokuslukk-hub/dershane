import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Role =
  | "system_admin"
  | "dershane_admin"
  | "rehberlik"
  | "ogretmen"
  | "ogrenci";

export type Viewer = {
  authUserId: string;
  account: {
    id: string;
    tenant_id: string | null;
    role: Role;
    full_name: string;
    status: "unclaimed" | "active" | "suspended";
  };
};

// Her admin sayfasında tekrarlanan "auth kullanıcısı → user_account → rol"
// sorgusunu tekilleştirir. bkz. plan: src/lib/tenant-context.ts bunun üzerine
// kurulur.
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: account } = await supabase
    .from("user_account")
    .select("id, tenant_id, role, full_name, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!account) return null;

  return { authUserId: user.id, account };
}

// Sayfalar (Server Component) için: Viewer yoksa /login'e, rolü uymuyorsa
// /'e (rol yönlendirme merkezine) atar.
export function requireRole(viewer: Viewer | null, roles: Role[]): Viewer {
  if (!viewer) {
    redirect("/login");
  }
  if (!roles.includes(viewer.account.role)) {
    redirect("/");
  }
  return viewer;
}

// Route Handler'lar için: redirect yerine düzgün bir JSON hata döner (client
// fetch() ile çağırdığı için bir yönlendirmeyi anlamlı işleyemez).
export function checkRoleApi(
  viewer: Viewer | null,
  roles: Role[],
):
  | { ok: true; viewer: Viewer }
  | { ok: false; response: NextResponse } {
  if (!viewer) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Giriş gerekli." }, { status: 401 }),
    };
  }
  if (!roles.includes(viewer.account.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 }),
    };
  }
  return { ok: true, viewer };
}

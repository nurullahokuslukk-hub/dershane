import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/auth/viewer";

export type GuidanceStudent = {
  /** student_profile.id — rehberlik ekranlarındaki öğrenci anahtarı. */
  id: string;
  accountId: string;
  fullName: string;
  className: string;
  branchName: string;
  accountStatus: string;
};

type AssignmentRow = {
  student: {
    id: string;
    class_group: { name: string } | null;
    branch: { name: string } | null;
    account: { id: string; full_name: string; status: string } | null;
  } | null;
};

function toStudent(row: AssignmentRow): GuidanceStudent | null {
  const s = row.student;
  if (!s) return null;
  return {
    id: s.id,
    accountId: s.account?.id ?? "",
    fullName: s.account?.full_name ?? "(isimsiz)",
    className: s.class_group?.name ?? "—",
    branchName: s.branch?.name ?? "",
    accountStatus: s.account?.status ?? "unclaimed",
  };
}

const SELECT =
  "student:student_id(id, class_group:class_group_id(name), branch:branch_id(name), account:user_id(id, full_name, status))";

// Rehberlik kullanıcısına ATANMIŞ öğrenciler (guidance_student_assignment).
// Rehberlik tüm dershaneyi değil yalnızca atandığı öğrencileri görür —
// AGENTS.md değişmez kural. RLS yalnızca tenant izolasyonu yaptığı için bu
// daraltma burada, uygulama katmanında yapılıyor.
export async function listAssignedStudents(
  viewer: Viewer,
): Promise<GuidanceStudent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guidance_student_assignment")
    .select(SELECT)
    .eq("guidance_user_id", viewer.account.id)
    .returns<AssignmentRow[]>();

  return (data ?? [])
    .map(toStudent)
    .filter((s): s is GuidanceStudent => s !== null)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}

// Tek öğrenci — atama yoksa null döner (çağıran notFound()'a çevirir).
// Öğrenci profilindeki HER sorgudan önce bu çağrılır; URL'deki id'ye
// asla doğrudan güvenilmez.
export async function getAssignedStudent(
  viewer: Viewer,
  studentId: string,
): Promise<GuidanceStudent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guidance_student_assignment")
    .select(SELECT)
    .eq("guidance_user_id", viewer.account.id)
    .eq("student_id", studentId)
    .maybeSingle()
    .returns<AssignmentRow | null>();

  return data ? toStudent(data) : null;
}

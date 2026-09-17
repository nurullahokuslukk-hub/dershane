import { Badge } from "@/components/ui/Badge";

// user_account.status — 'unclaimed' | 'active' | 'suspended'
// (bkz. supabase/migrations/0002_account_claim_flow.sql)
export function AccountStatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge tone="success">Doğrulandı</Badge>;
  if (status === "unclaimed") return <Badge tone="warning">Doğrulanmadı</Badge>;
  if (status === "suspended") return <Badge tone="danger">Askıda</Badge>;
  return <Badge>{status}</Badge>;
}

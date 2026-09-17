import { EmptyState } from "@/components/ui/EmptyState";

// system_admin henüz bir dershane seçmediğinde tüm tenant'a bağlı admin
// ekranlarının gösterdiği ortak uyarı (her sayfada tekrarlanmasın diye).
export function NoTenantNotice() {
  return (
    <EmptyState
      title="Önce bir dershane seç"
      description="Sağ üstteki dershane seçiciden çalışmak istediğin dershaneyi seç; bu ekran seçilen dershanenin verisini gösterir."
    />
  );
}

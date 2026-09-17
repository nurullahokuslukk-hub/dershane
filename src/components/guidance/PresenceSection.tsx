import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  formatMinutes,
  formatTime,
  summarizePresence,
  type PresenceRow,
} from "@/lib/guidance/presence";
import { table, tableWrap, td, th } from "@/components/ui/styles";

const SOURCE_LABEL: Record<string, string> = {
  student_self_report: "Öğrencinin beyanı",
};

// Ekran: web-rehberlik.md → "Sekme: Dershane Düzeni".
// Karar ve sınırları: decisions/0006-dershane-devam-oz-bildirimi.md.
// Burada bilinçli olarak YOK: devamsızlık yüzdesi, puan, "tutarsız beyan"
// uyarısı, otomatik disiplin çıktısı. Gösterilen şey ham kayıt + konuşma
// başlatıcı nazik bir hatırlatma.
export function PresenceSection({
  rows,
  windowDays,
}: {
  rows: PresenceRow[];
  windowDays: number;
}) {
  const summary = summarizePresence(rows, windowDays);

  return (
    <Card>
      <CardHeader
        title="Dershane düzeni"
        description={`Son ${windowDays} günün öğrenci bildirimleri`}
      />
      <CardBody className="space-y-4">
        <p className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-muted">
          Bu bilgiyi <strong className="text-foreground">öğrencinin kendisi</strong>{" "}
          uygulamadan giriyor; konumla doğrulanmıyor. Kesin bir devam kanıtı ya
          da disiplin verisi değildir — öğrencinin düzenini birlikte konuşmak
          için bir başlangıç noktasıdır.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Gittim dediği gün" value={summary.attendedDays} />
          <Stat label="Gitmedim dediği gün" value={summary.notAttendedDays} />
          <Stat label="Bildirim girilmemiş" value={summary.missingDays} />
          <Stat
            label="Ortalama kalış"
            value={
              summary.averageMinutes === null
                ? "—"
                : formatMinutes(summary.averageMinutes)
            }
          />
        </div>

        <ul className="space-y-2">
          {summary.signals.map((signal, i) => (
            <li
              key={i}
              className={`rounded-lg px-3 py-2 text-sm ${
                signal.tone === "attention"
                  ? "bg-brand-soft text-brand-soft-fg"
                  : "bg-surface-muted text-muted"
              }`}
            >
              {signal.text}
            </li>
          ))}
        </ul>

        {rows.length === 0 ? (
          <p className="text-sm text-muted">
            Bu dönemde kayıtlı bildirim yok.
          </p>
        ) : (
          <div className={tableWrap}>
            <table className={table}>
              <thead>
                <tr>
                  <th className={th}>Tarih</th>
                  <th className={th}>Durum</th>
                  <th className={th}>Giriş</th>
                  <th className={th}>Çıkış</th>
                  <th className={th}>Kaynak</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.attendance_date}>
                    <td className={`${td} whitespace-nowrap`}>
                      {new Date(r.attendance_date).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        weekday: "short",
                      })}
                    </td>
                    <td className={td}>
                      {r.attended ? (
                        <Badge tone="success">Gittim</Badge>
                      ) : (
                        <Badge>Gitmedim</Badge>
                      )}
                    </td>
                    <td className={`${td} tabular-nums`}>
                      {formatTime(r.arrived_at)}
                    </td>
                    <td className={`${td} tabular-nums`}>
                      {formatTime(r.departed_at)}
                    </td>
                    <td className={`${td} text-xs text-muted`}>
                      {SOURCE_LABEL[r.report_source] ?? r.report_source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

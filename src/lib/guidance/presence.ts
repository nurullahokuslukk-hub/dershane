// Dershane devam öz-bildirimi (daily_dershane_presence) için özet ve
// konuşma sinyalleri.
//
// ÖNEMLİ (bkz. decisions/0006-dershane-devam-oz-bildirimi.md): burada
// üretilen hiçbir değer bir puan, devamsızlık skoru ya da "yalan tespiti"
// değildir. Veri öğrencinin doğrulanmamış beyanıdır. Üretilen tek şey,
// rehberliğin öğrenciyle konuşmaya başlaması için nazik bir hatırlatma.

export type PresenceRow = {
  attendance_date: string;
  attended: boolean;
  arrived_at: string | null;
  departed_at: string | null;
  report_source: string;
};

export type PresenceSignal = {
  tone: "neutral" | "attention";
  text: string;
};

export type PresenceSummary = {
  windowDays: number;
  reportedDays: number;
  attendedDays: number;
  notAttendedDays: number;
  /** Bildirim hiç girilmemiş gün sayısı (pencere içinde). */
  missingDays: number;
  /** Giriş+çıkış saati dolu günlerin ortalama kalış süresi (dakika). */
  averageMinutes: number | null;
  signals: PresenceSignal[];
};

function minutesBetween(arrived: string, left: string): number | null {
  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };
  const a = parse(arrived);
  const b = parse(left);
  if (a === null || b === null) return null;
  const diff = b - a;
  // Öğrenci saatleri ters girdiyse (yazım hatası) hesaba katmıyoruz —
  // "hatalı giriş" diye işaretlemek de suçlayıcı bir dil olurdu.
  return diff > 0 ? diff : null;
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h === 0) return `${m} dk`;
  if (m === 0) return `${h} sa`;
  return `${h} sa ${m} dk`;
}

// "HH:MM:SS" → "HH:MM"
export function formatTime(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

export function summarizePresence(
  rows: PresenceRow[],
  windowDays: number,
): PresenceSummary {
  const attendedDays = rows.filter((r) => r.attended).length;
  const notAttendedDays = rows.filter((r) => !r.attended).length;
  const reportedDays = rows.length;
  const missingDays = Math.max(0, windowDays - reportedDays);

  const durations = rows
    .map((r) =>
      r.attended && r.arrived_at && r.departed_at
        ? minutesBetween(r.arrived_at, r.departed_at)
        : null,
    )
    .filter((d): d is number => d !== null);
  const averageMinutes =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

  const signals: PresenceSignal[] = [];

  // Sinyaller son 7 güne bakar — "bu hafta" konuşması için.
  const lastWeek = rows.slice(0, 7);
  const lastWeekMissed = lastWeek.filter((r) => !r.attended).length;

  if (reportedDays === 0) {
    signals.push({
      tone: "neutral",
      text: "Bu öğrenci henüz devam bildirimi girmemiş. Uygulamayı kurmuş olup olmadığını sormak iyi bir başlangıç olabilir.",
    });
  } else {
    if (lastWeekMissed >= 3) {
      signals.push({
        tone: "attention",
        text: "Son bir haftada birkaç gün gelemediğini belirtmiş. Bu hafta düzenini konuşmak ister misiniz?",
      });
    }
    if (missingDays >= Math.ceil(windowDays / 2)) {
      signals.push({
        tone: "neutral",
        text: "Günlerin çoğunda bildirim girilmemiş. Bu bir devamsızlık göstergesi değil — öğrenci uygulamayı kullanmayı unutuyor ya da zorlanıyor olabilir.",
      });
    }
    if (signals.length === 0) {
      signals.push({
        tone: "neutral",
        text: "Bildirimler düzenli görünüyor. Ayrıca bir şey konuşmak isterseniz görüşme notu ekleyebilirsiniz.",
      });
    }
  }

  return {
    windowDays,
    reportedDays,
    attendedDays,
    notAttendedDays,
    missingDays,
    averageMinutes,
    signals,
  };
}

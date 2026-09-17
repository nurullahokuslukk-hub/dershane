import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatMinutes,
  formatTime,
  summarizePresence,
  type PresenceRow,
} from "@/lib/guidance/presence";

function row(
  date: string,
  attended: boolean,
  arrived: string | null = null,
  left: string | null = null,
): PresenceRow {
  return {
    attendance_date: date,
    attended,
    arrived_at: arrived,
    departed_at: left,
    report_source: "student_self_report",
  };
}

test("hiç bildirim yoksa suçlayıcı değil, nötr bir sinyal üretir", () => {
  const s = summarizePresence([], 30);
  assert.equal(s.reportedDays, 0);
  assert.equal(s.missingDays, 30);
  assert.equal(s.signals.length, 1);
  assert.equal(s.signals[0].tone, "neutral");
});

test("gittim/gitmedim ve eksik gün sayıları doğru", () => {
  const rows = [
    row("2026-09-17", true, "16:00:00", "19:00:00"),
    row("2026-09-16", true, "16:00:00", "18:30:00"),
    row("2026-09-15", false),
  ];
  const s = summarizePresence(rows, 7);
  assert.equal(s.attendedDays, 2);
  assert.equal(s.notAttendedDays, 1);
  assert.equal(s.reportedDays, 3);
  assert.equal(s.missingDays, 4);
});

test("ortalama kalış süresi yalnızca giriş+çıkış dolu günlerden hesaplanır", () => {
  const rows = [
    row("2026-09-17", true, "16:00:00", "19:00:00"), // 180 dk
    row("2026-09-16", true, "16:00:00", "18:00:00"), // 120 dk
    row("2026-09-15", true, "16:00:00", null), // çıkış girilmemiş → sayılmaz
    row("2026-09-14", false),
  ];
  const s = summarizePresence(rows, 7);
  assert.equal(s.averageMinutes, 150);
});

test("saatler ters girilmişse hata olarak işaretlenmez, sadece hesaba katılmaz", () => {
  const rows = [row("2026-09-17", true, "19:00:00", "16:00:00")];
  const s = summarizePresence(rows, 7);
  assert.equal(s.averageMinutes, null);
});

test("son haftada 3+ gün gelinmemişse konuşma önerisi çıkar", () => {
  const rows = [
    row("2026-09-17", false),
    row("2026-09-16", false),
    row("2026-09-15", false),
    row("2026-09-14", true, "16:00:00", "19:00:00"),
  ];
  const s = summarizePresence(rows, 7);
  const attention = s.signals.filter((x) => x.tone === "attention");
  assert.equal(attention.length, 1);
  assert.match(attention[0].text, /düzenini konuşmak/);
  // Suçlayıcı/puanlayıcı bir ifade üretmediğini de sabitliyoruz.
  for (const signal of s.signals) {
    assert.doesNotMatch(signal.text, /devamsız|ceza|uyarı|yalan|puan/i);
  }
});

test("düzenli görünen öğrencide sadece nötr bilgi verilir", () => {
  const rows = Array.from({ length: 7 }, (_, i) =>
    row(`2026-09-${17 - i}`, true, "16:00:00", "19:00:00"),
  );
  const s = summarizePresence(rows, 7);
  assert.equal(s.signals.every((x) => x.tone === "neutral"), true);
});

test("saat ve süre biçimlendirme", () => {
  assert.equal(formatTime("16:05:00"), "16:05");
  assert.equal(formatTime(null), "—");
  assert.equal(formatMinutes(45), "45 dk");
  assert.equal(formatMinutes(120), "2 sa");
  assert.equal(formatMinutes(150), "2 sa 30 dk");
});

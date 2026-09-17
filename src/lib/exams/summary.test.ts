import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatNet,
  groupResultsByExam,
  toNumber,
  type SubjectResult,
} from "@/lib/exams/summary";

function result(
  id: string,
  subject: string,
  net: number | string,
  exam: { id: string; name: string; exam_date: string } | null,
): SubjectResult {
  return {
    id,
    subject,
    correct_count: 0,
    wrong_count: 0,
    blank_count: 0,
    net: net as number,
    mock_exam: exam,
  };
}

const eylul = { id: "e1", name: "1. Deneme", exam_date: "2026-09-01" };
const ekim = { id: "e2", name: "2. Deneme", exam_date: "2026-10-01" };

test("sonuçlar denemeye göre gruplanır, en yeni deneme üstte", () => {
  const groups = groupResultsByExam([
    result("a", "Türkçe", 30, eylul),
    result("b", "Matematik", 20, eylul),
    result("c", "Türkçe", 35, ekim),
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].examId, "e2");
  assert.equal(groups[1].examId, "e1");
});

test("toplam net doğru hesaplanır ve dersler alfabetik sıralanır", () => {
  const [group] = groupResultsByExam([
    result("a", "Türkçe", 30.5, eylul),
    result("b", "Matematik", 20.25, eylul),
  ]);
  assert.equal(group.totalNet, 50.75);
  assert.deepEqual(
    group.subjects.map((s) => s.subject),
    ["Matematik", "Türkçe"],
  );
});

test("PostgREST numeric'i string döndürse bile toplama bozulmaz", () => {
  const [group] = groupResultsByExam([
    result("a", "Türkçe", "30.50", eylul),
    result("b", "Matematik", "20.25", eylul),
  ]);
  assert.equal(group.totalNet, 50.75);
  assert.equal(toNumber("abc"), 0);
});

test("denemesi silinmiş satırlar sessizce atlanır", () => {
  const groups = groupResultsByExam([
    result("a", "Türkçe", 30, null),
    result("b", "Matematik", 20, eylul),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].subjects.length, 1);
});

test("net iki ondalıkla Türkçe biçiminde gösterilir", () => {
  assert.equal(formatNet(30.5), "30,50");
  assert.equal(formatNet(0), "0,00");
});

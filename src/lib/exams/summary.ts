export type SubjectResult = {
  id: string;
  subject: string;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  net: number;
  mock_exam: { id: string; name: string; exam_date: string } | null;
};

export type ExamGroup = {
  examId: string;
  examName: string;
  examDate: string;
  totalNet: number;
  subjects: SubjectResult[];
};

// numeric(6,2) PostgREST üzerinden bazen string olarak geliyor — toplama
// yapmadan önce tek noktadan sayıya çeviriyoruz.
export function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatNet(value: number): string {
  return toNumber(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Ders bazlı satırları denemeye göre gruplar, toplam neti hesaplar ve
// denemeleri tarihe göre (en yeni üstte) sıralar.
export function groupResultsByExam(rows: SubjectResult[]): ExamGroup[] {
  const byExam = new Map<string, ExamGroup>();

  for (const row of rows) {
    if (!row.mock_exam) continue;
    const { id, name, exam_date } = row.mock_exam;
    let group = byExam.get(id);
    if (!group) {
      group = {
        examId: id,
        examName: name,
        examDate: exam_date,
        totalNet: 0,
        subjects: [],
      };
      byExam.set(id, group);
    }
    group.subjects.push(row);
    group.totalNet += toNumber(row.net);
  }

  const groups = [...byExam.values()];
  for (const group of groups) {
    group.subjects.sort((a, b) => a.subject.localeCompare(b.subject, "tr"));
  }
  groups.sort((a, b) => b.examDate.localeCompare(a.examDate));
  return groups;
}

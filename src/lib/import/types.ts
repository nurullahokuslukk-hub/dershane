export type RowStatus = "ok" | "error" | "needs-review";

export type ImportCandidate = { id: string; label: string };

export type RowResult<T> = {
  rowNumber: number;
  raw: Record<string, string>;
  data?: T;
  status: RowStatus;
  errors: string[];
  candidates?: ImportCandidate[];
};

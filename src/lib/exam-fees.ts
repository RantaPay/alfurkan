export const DEFAULT_EXAM_FEES: Record<string, number> = {
  "WAEC SSCE": 47000,
  "NECO SSCE": 45000,
  BECE: 21500,
  BABECE: 10000,
};

export function examFeeAmount(name: string, configured?: Record<string, number> | null): number {
  const amount = Number(configured?.[name]);
  if (Number.isFinite(amount) && amount >= 0 && configured && name in configured) return amount;
  return Number(DEFAULT_EXAM_FEES[name]) || 0;
}

export function readStoredExamFees(value: unknown): Record<string, number> {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    Object.keys(DEFAULT_EXAM_FEES).map((name) => [name, examFeeAmount(name, source as Record<string, number>)]),
  );
}

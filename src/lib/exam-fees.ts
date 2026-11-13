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

export function canonicalExamName(name: string): string | null {
  if (/\bwaec\s*ssce\b/i.test(name)) return "WAEC SSCE";
  if (/\bneco\s*ssce\b/i.test(name)) return "NECO SSCE";
  if (/\bbabece\b/i.test(name)) return "BABECE";
  if (/\bbece\b/i.test(name)) return "BECE";
  return null;
}

export function paidTowardExam(receipts: { isVoided?: boolean; items?: { name?: string; amount?: number }[] }[], examName: string): number {
  return receipts.filter((receipt) => !receipt.isVoided).reduce((sum, receipt) => sum + (receipt.items || []).reduce((line, item) => {
    return canonicalExamName(item.name || "") === examName ? line + (Number(item.amount) || 0) : line;
  }, 0), 0);
}

export function examCharge(name: string, paidNow: number, alreadyPaid: number, configured?: Record<string, number> | null): { chargeAmount: number; chargeBalance: number } | null {
  const examName = canonicalExamName(name);
  if (!examName) return null;
  const due = examFeeAmount(examName, configured);
  return { chargeAmount: due, chargeBalance: Math.max(0, due - alreadyPaid - (Number(paidNow) || 0)) };
}

export function readStoredExamFees(value: unknown): Record<string, number> {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    Object.keys(DEFAULT_EXAM_FEES).map((name) => [name, examFeeAmount(name, source as Record<string, number>)]),
  );
}

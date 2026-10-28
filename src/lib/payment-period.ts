import { addFeePayments, calculateFeeBalance, type FeeAmounts, type PaymentPeriod } from "./fee-ledger";
import type { ReceiptItem } from "./types";

export const TERM_PERIODS = ["1st Term", "2nd Term", "3rd Term"] as const;
export type TermPeriod = (typeof TERM_PERIODS)[number];
type PeriodReceipt = {
  term: string;
  amountPaid: number;
  isVoided?: boolean;
  items?: { category: string; amount: number; paymentTerm?: string | null }[];
};

export function isTermPeriod(value: unknown): value is TermPeriod {
  return typeof value === "string" && TERM_PERIODS.includes(value as TermPeriod);
}

/** Existing receipts inherit their stored receipt term; new lines have explicit coverage. */
function paymentsForTerm(receipts: PeriodReceipt[], term: TermPeriod, activeTerm: TermPeriod): FeeAmounts {
  let paid: FeeAmounts = { Tuition: 0, Books: 0, Uniform: 0, PTA: 0 };
  for (const receipt of receipts) {
    if (receipt.isVoided) continue;
    const items = receipt.items?.length ? receipt.items : [{ category: "Tuition", amount: receipt.amountPaid }];
    for (const item of items) {
      const itemTerm = item.paymentTerm || receipt.term;
      if (itemTerm === term) paid = addFeePayments(paid, [item]);
      // Compatibility for annual records created without explicit line allocations.
      else if (itemTerm === "Whole Session") {
        if (item.category === "Tuition") {
          const cents = Math.round(item.amount * 100);
          const index = TERM_PERIODS.indexOf(term);
          const amount = (Math.floor(cents / 3) + (index < cents % 3 ? 1 : 0)) / 100;
          paid = addFeePayments(paid, [{ ...item, amount }]);
        } else if (term === activeTerm) paid = addFeePayments(paid, [item]);
      }
    }
  }
  return paid;
}

/** Annual tuition covers three terms; other charges are counted once in the active term. */
export function calculatePeriodFeeBalance(
  obligations: FeeAmounts,
  receipts: PeriodReceipt[],
  period: PaymentPeriod,
  activeTerm: TermPeriod
) {
  if (period !== "Whole Session") return calculateFeeBalance(obligations, paymentsForTerm(receipts, period, activeTerm));
  const paid = paymentsForTerm(receipts, activeTerm, activeTerm);
  paid.Tuition = TERM_PERIODS.reduce((sum, term) => sum + Math.min(
    obligations.Tuition, Math.max(0, paymentsForTerm(receipts, term, activeTerm).Tuition)
  ), 0);
  return calculateFeeBalance({ ...obligations, Tuition: obligations.Tuition * 3 }, paid);
}

/** Allocate annual tuition to outstanding terms in order, preserving every kobo collected. */
export function allocatePeriodItems(
  items: ReceiptItem[],
  period: PaymentPeriod,
  activeTerm: TermPeriod,
  obligations: FeeAmounts,
  receipts: PeriodReceipt[]
): ReceiptItem[] {
  const priorTuition = Object.fromEntries(TERM_PERIODS.map((term) => [term, paymentsForTerm(receipts, term, activeTerm).Tuition]));
  const result: ReceiptItem[] = [];
  for (const item of items) {
    if (period !== "Whole Session" || item.category !== "Tuition") {
      result.push({ ...item, paymentTerm: period === "Whole Session" ? activeTerm : period });
      continue;
    }
    let remaining = Math.round(item.amount * 100);
    const shares: { term: TermPeriod; cents: number }[] = [];
    for (const term of TERM_PERIODS) {
      const outstanding = Math.max(0, Math.round((obligations.Tuition - priorTuition[term]) * 100));
      const cents = Math.min(remaining, outstanding);
      if (cents > 0) shares.push({ term, cents });
      remaining -= cents;
      priorTuition[term] += cents / 100;
    }
    if (remaining > 0) {
      const last = shares.find((share) => share.term === "3rd Term");
      if (last) last.cents += remaining;
      else shares.push({ term: "3rd Term", cents: remaining });
      priorTuition["3rd Term"] += remaining / 100;
    }
    if (!shares.length) shares.push({ term: activeTerm, cents: 0 });
    for (const share of shares) result.push({ ...item, paymentTerm: share.term, amount: share.cents / 100 });
  }
  return result;
}

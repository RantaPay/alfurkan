import { splitClassName } from "./class-placement";
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

/** JSS 3, SS 2, and SS 3 finish after 2nd Term. They do not pay 3rd Term school fees. */
export function sessionTuitionTerms(className?: string | null): TermPeriod[] {
  const level = splitClassName(className || "").level;
  if (level === "JSS 3" || level === "SS 2" || level === "SS 3") return ["1st Term", "2nd Term"];
  return [...TERM_PERIODS];
}

/** Existing receipts inherit their stored receipt term; new lines have explicit coverage. */
function paymentsForTerm(receipts: PeriodReceipt[], term: TermPeriod, activeTerm: TermPeriod, tuitionTerms: TermPeriod[]): FeeAmounts {
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
          const index = tuitionTerms.indexOf(term);
          if (index === -1) continue;
          const cents = Math.round(item.amount * 100);
          const amount = (Math.floor(cents / tuitionTerms.length) + (index < cents % tuitionTerms.length ? 1 : 0)) / 100;
          paid = addFeePayments(paid, [{ ...item, amount }]);
        } else if (term === activeTerm) paid = addFeePayments(paid, [item]);
      }
    }
  }
  return paid;
}

/** Annual tuition covers the class session. JSS 3, SS 2, and SS 3 stop after 2nd Term. Other charges are counted once in the active term. */
export function calculatePeriodFeeBalance(
  obligations: FeeAmounts,
  receipts: PeriodReceipt[],
  period: PaymentPeriod,
  activeTerm: TermPeriod,
  className?: string | null
) {
  const tuitionTerms = sessionTuitionTerms(className);
  if (period !== "Whole Session") {
    const termObligations = isTermPeriod(period) && !tuitionTerms.includes(period)
      ? { ...obligations, Tuition: 0 }
      : obligations;
    return calculateFeeBalance(termObligations, paymentsForTerm(receipts, period, activeTerm, tuitionTerms));
  }
  const paid = paymentsForTerm(receipts, activeTerm, activeTerm, tuitionTerms);
  paid.Tuition = tuitionTerms.reduce((sum, term) => sum + Math.min(
    obligations.Tuition, Math.max(0, paymentsForTerm(receipts, term, activeTerm, tuitionTerms).Tuition)
  ), 0);
  return calculateFeeBalance({ ...obligations, Tuition: obligations.Tuition * tuitionTerms.length }, paid);
}

/** Allocate annual tuition to outstanding terms in order, preserving every kobo collected. */
export function allocatePeriodItems(
  items: ReceiptItem[],
  period: PaymentPeriod,
  activeTerm: TermPeriod,
  obligations: FeeAmounts,
  receipts: PeriodReceipt[],
  className?: string | null
): ReceiptItem[] {
  const tuitionTerms = sessionTuitionTerms(className);
  const priorTuition = Object.fromEntries(tuitionTerms.map((term) => [term, paymentsForTerm(receipts, term, activeTerm, tuitionTerms).Tuition])) as Record<TermPeriod, number>;
  const result: ReceiptItem[] = [];
  for (const item of items) {
    if (period !== "Whole Session" || item.category !== "Tuition") {
      const paymentTerm = period === "Whole Session" ? activeTerm : period;
      result.push({ ...item, paymentTerm });
      continue;
    }
    let remaining = Math.round(item.amount * 100);
    const shares: { term: TermPeriod; cents: number }[] = [];
    for (const term of tuitionTerms) {
      const outstanding = Math.max(0, Math.round((obligations.Tuition - priorTuition[term]) * 100));
      const cents = Math.min(remaining, outstanding);
      if (cents > 0) shares.push({ term, cents });
      remaining -= cents;
      priorTuition[term] += cents / 100;
    }
    if (remaining > 0) {
      const lastTerm = tuitionTerms[tuitionTerms.length - 1];
      const last = shares.find((share) => share.term === lastTerm);
      if (last) last.cents += remaining;
      else shares.push({ term: lastTerm, cents: remaining });
    }
    if (!shares.length) shares.push({ term: activeTerm, cents: 0 });
    for (const share of shares) result.push({ ...item, paymentTerm: share.term, amount: share.cents / 100 });
  }
  return result;
}

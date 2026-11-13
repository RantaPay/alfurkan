import { canonicalExamName } from "./exam-fees";
import type { ReceiptItem } from "./types";

const PREVIOUS_DEBT = /previous\s*term\s*debt|\b3t\s*debt\b/i;

export function displaySession(session: string): string {
  return (session || "").replace(/\bAcademic\s*/gi, "").replace(/\s*Session\s*/gi, " ").replace(/\s+/g, " ").trim();
}

/** Move 2026/2027 or 2026/27 back by whole years. Text around the years stays put. */
export function shiftSession(session: string, yearsBack: number): string {
  if (!yearsBack) return session;
  return session.replace(/(\d{4})\s*\/\s*(\d{2,4})/, (_match, start: string, end: string) => {
    const nextStart = Number(start) - yearsBack;
    const endYear = Number(end.length === 4 ? end : `20${end}`) - yearsBack;
    const nextEnd = end.length === 4 ? String(endYear) : String(endYear).slice(-2);
    return `${nextStart}/${nextEnd}`;
  });
}

/**
 * The term before the one the school was accounting in.
 * 1st Term steps back to 3rd Term of the previous session.
 * 2nd and 3rd Term stay in the same session.
 */
export function previousTermContext(currentTerm: string, session: string): { term: string; session: string } {
  if (currentTerm === "2nd Term") return { term: "1st Term", session: displaySession(session) };
  if (currentTerm === "3rd Term") return { term: "2nd Term", session: displaySession(session) };
  return { term: "3rd Term", session: displaySession(shiftSession(session, 1)) };
}

/** A saved receipt term is stable. Whole Session falls back to the school term. */
export function termForPreviousDebt(receiptTerm: string, schoolTerm?: string): string {
  if (receiptTerm === "1st Term" || receiptTerm === "2nd Term" || receiptTerm === "3rd Term") return receiptTerm;
  if (schoolTerm === "1st Term" || schoolTerm === "2nd Term" || schoolTerm === "3rd Term") return schoolTerm;
  return "1st Term";
}

function isSchoolFee(item: Pick<ReceiptItem, "name" | "category">): boolean {
  if (PREVIOUS_DEBT.test(item.name || "")) return false;
  return item.category === "Tuition" || /tuition|school fees/i.test(item.name || "");
}

export function buildReceiptNarration(input: {
  items: Pick<ReceiptItem, "name" | "category" | "amount" | "chargeBalance">[];
  hasStudent: boolean;
  currentTerm: string;
  session: string;
}): string {
  const items = input.items.filter((item) => item.name || item.amount);
  if (!input.hasStudent) {
    const names = items.map((item) => item.name).filter(Boolean);
    return names.length ? `payment of ${names.join(", ")}` : "payment of official school services";
  }

  const phrases: string[] = [];
  const schoolFees = items.filter(isSchoolFee);
  if (schoolFees.length) {
    const known = schoolFees.filter((item) => item.chargeBalance !== undefined);
    if (!known.length) phrases.push("payment of school fees");
    else phrases.push(known.some((item) => Number(item.chargeBalance) > 0) ? "part payment of school fees" : "full payment of school fees");
  }

  for (const item of items) {
    if (isSchoolFee(item)) continue;
    if (PREVIOUS_DEBT.test(item.name || "")) {
      const previous = previousTermContext(input.currentTerm, input.session);
      phrases.push(`payment of ${previous.term} ${previous.session}`.trim());
      continue;
    }
    const examName = canonicalExamName(item.name || "");
    if (examName && item.chargeBalance !== undefined) {
      phrases.push(Number(item.chargeBalance) > 0 ? `part payment of ${item.name}` : `full payment of ${item.name}`);
      continue;
    }
    if (item.name) phrases.push(`payment of ${item.name}`);
  }

  return phrases.join(", ") || "payment of school fees";
}

/** Calendar day the receipt was generated. Older receipts only stored the payment day, so both dates match. */
export function formatGeneratedDate(timestamp: string | undefined, paymentDate: string): string {
  if (!timestamp) return paymentDate;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return paymentDate;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

/** The same payment, used by the server and by the offline copy. */

export interface DuplicateCandidate {
  id?: string;
  receiptNumber?: string;
  studentName: string;
  regNumber: string;
  amountPaid: number;
  date: string;
  timestamp?: string;
  term?: string;
  session?: string;
  isVoided?: boolean;
  items?: { name: string }[];
}

export interface DuplicateQuery {
  studentName?: string;
  regNumber?: string;
  amountPaid: number;
  date?: string;
  term?: string;
  session?: string;
  items?: { name: string }[];
}

const DEFAULT_FEE = "tuition / school fees";

function itemKey(items?: { name: string }[]): string {
  const names = items && items.length > 0
    ? Array.from(new Set(items.map((item) => item.name.trim().toLowerCase())))
    : [DEFAULT_FEE];
  return names.filter(Boolean).sort().join(", ");
}

const MONTHS: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", sept: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

/** The day the money was paid. The day the receipt was issued is not part of this. */
export function paymentDateKey(value?: string | null): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const written = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!written) return null;
  const month = MONTHS[written[2].toLowerCase()];
  if (!month) return null;
  return `${written[3]}-${month}-${written[1].padStart(2, "0")}`;
}

export function sameReceiptPayment(candidate: DuplicateCandidate, input: DuplicateQuery): boolean {
  if (candidate.isVoided) return false;
  if (Number(candidate.amountPaid) !== Number(input.amountPaid)) return false;
  if (input.term && candidate.term !== input.term) return false;
  if (input.session && candidate.session !== input.session) return false;

  const reg = (input.regNumber || "").trim();
  const name = (input.studentName || "").trim().toLowerCase();
  if (reg && reg !== "N/A") {
    if (candidate.regNumber.trim().toLowerCase() !== reg.toLowerCase()) return false;
  } else if (name) {
    if (candidate.studentName.trim().toLowerCase() !== name) return false;
  } else {
    return false;
  }

  const savedPaymentDay = paymentDateKey(candidate.date);
  const newPaymentDay = paymentDateKey(input.date);
  if (!savedPaymentDay || savedPaymentDay !== newPaymentDay) return false;
  return itemKey(candidate.items) === itemKey(input.items);
}

export function findMatchingReceipt<T extends DuplicateCandidate>(candidates: T[], input: DuplicateQuery): T | null {
  if (!Number.isFinite(Number(input.amountPaid)) || Number(input.amountPaid) <= 0) return null;
  return candidates.find((candidate) => sameReceiptPayment(candidate, input)) || null;
}

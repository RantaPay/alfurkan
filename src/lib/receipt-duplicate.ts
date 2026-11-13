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

function paymentDates(input: DuplicateQuery): { formattedDate: string; isoDate: string; raw: string } {
  let receiptDate = new Date();
  if (input.date) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      const [year, month, day] = input.date.split("-").map(Number);
      receiptDate = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      const parsed = new Date(input.date);
      if (!isNaN(parsed.getTime())) receiptDate = parsed;
    }
  }
  return {
    formattedDate: receiptDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    isoDate: input.date ? input.date.split("T")[0] : receiptDate.toISOString().split("T")[0],
    raw: input.date || "",
  };
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

  const { formattedDate, isoDate, raw } = paymentDates(input);
  const recordedIso = candidate.timestamp ? candidate.timestamp.split("T")[0] : "";
  const recorded = candidate.timestamp ? new Date(candidate.timestamp) : null;
  const recordedFormatted = recorded && !isNaN(recorded.getTime())
    ? recorded.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const sameDate =
    candidate.date.trim().toLowerCase() === formattedDate.trim().toLowerCase() ||
    candidate.date.trim().toLowerCase() === raw.trim().toLowerCase() ||
    (!!isoDate && recordedIso === isoDate) ||
    (!!recordedFormatted && recordedFormatted.toLowerCase() === formattedDate.toLowerCase());
  if (!sameDate) return false;
  return itemKey(candidate.items) === itemKey(input.items);
}

export function findMatchingReceipt<T extends DuplicateCandidate>(candidates: T[], input: DuplicateQuery): T | null {
  if (!Number.isFinite(Number(input.amountPaid)) || Number(input.amountPaid) <= 0) return null;
  return candidates.find((candidate) => sameReceiptPayment(candidate, input)) || null;
}

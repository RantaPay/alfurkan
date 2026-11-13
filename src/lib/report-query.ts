import { classLevelOrder, splitClassName } from "./class-placement";
import { isPaymentPeriod, type PaymentPeriod } from "./fee-ledger";
import { calculatePeriodFeeBalance, isTermPeriod, type TermPeriod } from "./payment-period";
import { getStudentFeeObligations } from "./student-importer";
import type { ClassFeeConfig, ConcessionCategoryConfig, PaymentStatus, ReportSummary, SchoolProfile } from "./types";
export interface ReportReceiptSource {
  id: string;
  receiptNumber: string;
  amountPaid: number;
  date: string;
  timestamp?: string;
  term: string;
  session: string;
  isVoided?: boolean;
  paymentMethod: string;
  bankName?: string | null;
  items: { name: string; category: string; amount: number; paymentTerm?: string | null }[];
}

export interface ReportStudentSource {
  id: string;
  regNumber: string;
  fullName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  totalTermBill: number;
  receipts: ReportReceiptSource[];
}

export interface ReportQuery {
  term?: string;
  classLevel?: string;
  arm?: string;
  status?: string;
  bank?: string;
  fee?: string;
  from?: string;
  to?: string;
}

export interface ReportReceiptRef {
  id: string;
  receiptNumber: string;
  amount: number;
  date: string;
  bankName: string;
  fees: string;
}

export interface ReportStudentRow {
  id: string;
  regNumber: string;
  fullName: string;
  class: string;
  parentName: string;
  parentPhone: string;
  totalTermBill: number;
  totalPaid: number;
  balanceRemaining: number;
  status: PaymentStatus;
  paymentBank: string;
  paidBanks: string[];
  receivedAmount: number;
  receipts: ReportReceiptRef[];
  lastPaymentDate?: string;
}

export interface AccountReportOptions {
  classLevels: string[];
  arms: string[];
  banks: string[];
  feeTypes: string[];
  terms: string[];
}

export interface AccountReportApplied {
  term: string;
  classLevel: string;
  arm: string;
  status: string;
  bank: string;
  fee: string;
  from: string;
  to: string;
  session: string;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function canonicalFeeName(item: { name?: string; category?: string }): string {
  const name = (item.name || "").trim();
  if (/previous\s*term\s*debt|\b3t\s*debt\b/i.test(name)) return "Previous Term Debt";
  if (item.category === "Tuition" || /tuition|school fees/i.test(name)) return "School Fees";
  if (/sport/i.test(name)) return "Sport Wears";
  if (/\bahis\b/i.test(name)) return "AHIS";
  if (/\bwaec\s*ssce\b/i.test(name)) return "WAEC SSCE";
  if (/\bneco\s*ssce\b/i.test(name)) return "NECO SSCE";
  if (/\bbabece\b/i.test(name)) return "BABECE";
  if (/\bbece\b/i.test(name)) return "BECE";
  if (!name && item.category === "Uniform") return "School Uniform";
  if (!name && item.category === "Books") return "Books";
  if (name.toUpperCase() === "CUSTOM") return "Other";
  return name || item.category || "Other";
}

export const STANDARD_FEE_FILTERS = [
  "School Fees",
  "Notebook",
  "Textbooks",
  "School Uniform",
  "Sport Wears",
  "WAEC SSCE",
  "NECO SSCE",
  "BABECE",
  "BECE",
  "Transport / Bus Service",
  "Laboratory & Practical Fees",
  "Excursion & Field Trip",
  "Badge fee",
  "Certificate and testimonials",
  "Admission form fees",
  "Examination fees",
  "Sale of scrapped assets",
  "Hall rent",
  "Jamb center fees",
  "Alfurqan clinic fees",
  "AHIS",
  "Previous Term Debt",
];

export function parseDayNumber(value: string | undefined): number | null {
  const text = (value || "").trim();
  if (!text) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return Number(iso[1]) * 10000 + Number(iso[2]) * 100 + Number(iso[3]);
  const written = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(text);
  if (!written) return null;
  const month = MONTHS[written[2].slice(0, 3).toLowerCase()];
  if (!month) return null;
  return Number(written[3]) * 10000 + month * 100 + Number(written[1]);
}

export function sameAcademicSession(left: string, right: string): boolean {
  const clean = (value: string) => value.replace(/\bAcademic\s*/gi, "").replace(/\s*Session\s*/gi, "").trim().toLowerCase();
  return clean(left) === clean(right);
}

function receiptLines(receipt: ReportReceiptSource) {
  if (receipt.items.length) return receipt.items;
  return [{ name: "Tuition / School Fees", category: "Tuition", amount: receipt.amountPaid, paymentTerm: receipt.term }];
}

function lineTerm(line: { paymentTerm?: string | null }, receiptTerm: string): string {
  return line.paymentTerm || receiptTerm;
}

export function receiptBankLabel(receipt: Pick<ReportReceiptSource, "bankName" | "paymentMethod">): string {
  const name = (receipt.bankName || "").trim();
  if (receipt.paymentMethod.toLowerCase() === "cash" && (!name || name.toLowerCase() === "cash")) return "Cash";
  return name || "Unspecified";
}

export function bankMatches(receipt: Pick<ReportReceiptSource, "bankName" | "paymentMethod">, bank: string): boolean {
  if (!bank || bank === "ALL") return true;
  if (bank.toLowerCase() === "cash") {
    return receipt.paymentMethod.toLowerCase() === "cash" || (receipt.bankName || "").trim().toLowerCase() === "cash";
  }
  return (receipt.bankName || "").trim().toLowerCase() === bank.trim().toLowerCase();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function receiptPortion(
  receipt: ReportReceiptSource,
  applied: { term: string; fee: string; from: number | null; to: number | null; session: string; limitSession: boolean }
): { amount: number; fees: string[] } | null {
  if (receipt.isVoided) return null;
  if (applied.limitSession && !sameAcademicSession(receipt.session, applied.session)) return null;
  const day = parseDayNumber(receipt.date) ?? parseDayNumber(receipt.timestamp);
  if (applied.from !== null && (day === null || day < applied.from)) return null;
  if (applied.to !== null && (day === null || day > applied.to)) return null;

  const lines = receiptLines(receipt).filter((line) => {
    const term = lineTerm(line, receipt.term);
    const termOk = applied.term === "ALL" || term === applied.term;
    const feeName = canonicalFeeName(line);
    const feeOk = applied.fee === "ALL" || feeName.toLowerCase() === applied.fee.toLowerCase();
    return termOk && feeOk;
  });
  if (!lines.length) return null;

  const everyLineInTerm = applied.term === "ALL" || receiptLines(receipt).every((line) => lineTerm(line, receipt.term) === applied.term);
  const narrow = applied.fee !== "ALL" || !everyLineInTerm;
  const amount = narrow
    ? roundMoney(lines.reduce((sum, line) => sum + Number(line.amount || 0), 0))
    : roundMoney(receipt.amountPaid);
  return { amount, fees: Array.from(new Set(lines.map((line) => canonicalFeeName(line)))) };
}

function sortArm(left: string, right: string): number {
  const preferred = ["A", "B", "C", "D"];
  const leftIndex = preferred.indexOf(left.toUpperCase());
  const rightIndex = preferred.indexOf(right.toUpperCase());
  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  }
  return left.localeCompare(right);
}

function statusMatches(filter: string, status: PaymentStatus, bill: number): boolean {
  if (filter === "ALL") return true;
  if (filter === "FULL") return bill === 0 || status === "FULL";
  if (filter === "PARTIAL") return bill > 0 && status === "PARTIAL";
  if (filter === "UNPAID") return bill > 0 && status === "UNPAID";
  return true;
}

export function buildAccountReport(
  students: ReportStudentSource[],
  school: Omit<Pick<SchoolProfile, "currentTerm" | "currentSession" | "feeStructure" | "concessions" | "bankAccounts">, "concessions"> & {
    concessions?: Partial<ConcessionCategoryConfig>;
  },
  query: ReportQuery
) {
  const activeTerm: TermPeriod = isTermPeriod(school.currentTerm) ? school.currentTerm : "1st Term";
  const requestedTerm = query.term && (query.term === "ALL" || isPaymentPeriod(query.term)) ? query.term : activeTerm;
  const ledgerPeriod: PaymentPeriod = requestedTerm === "ALL" ? activeTerm : requestedTerm;
  const classLevel = query.classLevel && query.classLevel !== "ALL" ? query.classLevel : "ALL";
  const arm = query.arm && query.arm !== "ALL" ? query.arm : "ALL";
  const status = query.status || "ALL";
  const bank = query.bank && query.bank !== "ALL" ? query.bank : "ALL";
  const fee = query.fee && query.fee !== "ALL" ? query.fee : "ALL";
  let from = parseDayNumber(query.from);
  let to = parseDayNumber(query.to);
  if (from !== null && to !== null && from > to) [from, to] = [to, from];
  const session = (school.currentSession || "").replace(/\bAcademic\s*/gi, "").trim();
  const bankBuckets = new Map<string, { totalAmount: number; receiptCount: number }>();
  const feeStructure = (school.feeStructure || []) as ClassFeeConfig[];
  const concessions = school.concessions as ConcessionCategoryConfig | undefined;

  const classLevels = new Set<string>();
  const arms = new Set<string>();
  const banks = new Set<string>(["Cash", ...(school.bankAccounts || []).map((item) => item.bankName).filter(Boolean)]);
  const feeTypes = new Set<string>(STANDARD_FEE_FILTERS);

  for (const student of students) {
    const placement = splitClassName(student.className);
    if (placement.level) classLevels.add(placement.level);
    if (placement.arm) arms.add(placement.arm);
    for (const receipt of student.receipts) {
      if (receipt.isVoided) continue;
      banks.add(receiptBankLabel(receipt));
      for (const line of receiptLines(receipt)) feeTypes.add(canonicalFeeName(line));
    }
  }

  const rows: ReportStudentRow[] = [];
  for (const student of students) {
    const placement = splitClassName(student.className);
    if (classLevel !== "ALL" && placement.level.toLowerCase() !== classLevel.toLowerCase()) continue;
    if (arm !== "ALL" && placement.arm.toLowerCase() !== arm.toLowerCase()) continue;

    const sessionReceipts = student.receipts.filter((receipt) => !receipt.isVoided && sameAcademicSession(receipt.session, session));
    const obligations = getStudentFeeObligations(student.fullName, student.className, feeStructure, concessions, student.totalTermBill || 0);
    const ledger = calculatePeriodFeeBalance(obligations, sessionReceipts, ledgerPeriod, activeTerm);
    if (!statusMatches(status, ledger.status, ledger.totalBill)) continue;

    const matchedBeforeBank = student.receipts.flatMap((receipt) => {
      const portion = receiptPortion(receipt, {
        term: requestedTerm,
        fee,
        from,
        to,
        session,
        limitSession: from === null && to === null,
      });
      if (!portion) return [];
      return [{ receipt, portion }];
    });
    const matches = bank === "ALL" ? matchedBeforeBank : matchedBeforeBank.filter((match) => bankMatches(match.receipt, bank));
    const sliceWithoutBank = fee !== "ALL" || from !== null || to !== null;
    if (sliceWithoutBank && !matchedBeforeBank.length) continue;
    for (const match of matchedBeforeBank) {
      const label = receiptBankLabel(match.receipt);
      const bucket = bankBuckets.get(label) || { totalAmount: 0, receiptCount: 0 };
      bucket.totalAmount = roundMoney(bucket.totalAmount + match.portion.amount);
      bucket.receiptCount += 1;
      bankBuckets.set(label, bucket);
    }
    if (bank !== "ALL" && !matches.length) continue;

    const receivedAmount = roundMoney(matches.reduce((sum, match) => sum + match.portion.amount, 0));
    const paidBanks = Array.from(new Set(matches.map((match) => receiptBankLabel(match.receipt))));
    const receipts = matches.map((match) => ({
      id: match.receipt.id,
      receiptNumber: match.receipt.receiptNumber,
      amount: match.portion.amount,
      date: match.receipt.date,
      bankName: receiptBankLabel(match.receipt),
      fees: match.portion.fees.join(", "),
    }));

    rows.push({
      id: student.id,
      regNumber: student.regNumber,
      fullName: student.fullName,
      class: student.className,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      totalTermBill: ledger.totalBill,
      totalPaid: ledger.totalPaid,
      balanceRemaining: ledger.balanceRemaining,
      status: ledger.status,
      paymentBank: paidBanks.join(", ") || "—",
      paidBanks,
      receivedAmount,
      receipts,
      lastPaymentDate: receipts[0]?.date,
    });
  }

  const bankTotal = Array.from(bankBuckets.values()).reduce((sum, item) => sum + item.totalAmount, 0);
  const bankReconciliation = Array.from(bankBuckets.entries())
    .map(([bankName, stats]) => ({
      bankName,
      totalAmount: stats.totalAmount,
      receiptCount: stats.receiptCount,
      percentage: bankTotal > 0 ? Math.round((stats.totalAmount / bankTotal) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const expectedRevenue = roundMoney(rows.reduce((sum, row) => sum + row.totalTermBill, 0));
  const collectedRevenue = roundMoney(rows.reduce((sum, row) => sum + row.receivedAmount, 0));
  const outstandingDebt = roundMoney(rows.reduce((sum, row) => sum + row.balanceRemaining, 0));
  const summary: ReportSummary = {
    period: requestedTerm === "ALL" ? `All terms • ${session}` : `${requestedTerm} • ${session}`,
    totalStudents: rows.length,
    expectedRevenue,
    collectedRevenue,
    outstandingDebt,
    collectionRate: expectedRevenue > 0 ? Math.min(100, Math.round((collectedRevenue / expectedRevenue) * 100)) : 0,
    fullPaymentCount: rows.filter((row) => row.totalTermBill === 0 || row.status === "FULL").length,
    partialPaymentCount: rows.filter((row) => row.totalTermBill > 0 && row.status === "PARTIAL").length,
    unpaidCount: rows.filter((row) => row.totalTermBill > 0 && row.status === "UNPAID").length,
    filteredBank: bank !== "ALL" ? bank : undefined,
    filteredClass: classLevel !== "ALL" ? classLevel : undefined,
    bankReconciliation,
    bankSpecificCollection: bank !== "ALL" ? collectedRevenue : undefined,
  };

  const options: AccountReportOptions = {
    classLevels: Array.from(classLevels).sort((a, b) => classLevelOrder(a) - classLevelOrder(b) || a.localeCompare(b)),
    arms: Array.from(arms).sort(sortArm),
    banks: Array.from(banks).sort((a, b) => a.localeCompare(b)),
    feeTypes: [
      ...STANDARD_FEE_FILTERS.filter((name) => feeTypes.has(name)),
      ...Array.from(feeTypes).filter((name) => !STANDARD_FEE_FILTERS.includes(name)).sort((a, b) => a.localeCompare(b)),
    ],
    terms: ["ALL", "1st Term", "2nd Term", "3rd Term", "Whole Session"],
  };
  const applied: AccountReportApplied = {
    term: requestedTerm,
    classLevel,
    arm,
    status,
    bank,
    fee,
    from: query.from || "",
    to: query.to || "",
    session,
  };
  return { rows, summary, options, applied };
}

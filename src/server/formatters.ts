import {
  DEFAULT_CONCESSIONS
} from "@/lib/student-importer";
import {
  BankAccountConfig,
  ClassFeeConfig,
  ConcessionCategoryConfig,
  FeeScheduleHistoryEntry,
  Receipt,
  SchoolProfile,
  StaffUser,
  Student
} from "@/lib/types";

// Formatter Helpers to map Prisma database models to frontend types
export function formatStudent(s: any): Student {
  const receipts = s.receipts || [];
  const validReceipts = receipts.filter((r: any) => !r.isVoided);
  const paidBanks = Array.from(new Set(validReceipts.map((r: any) => r.bankName).filter(Boolean))) as string[];
  const paymentBank = paidBanks.length > 0 ? paidBanks.join(", ") : "—";
  const lastReceiptNumber = validReceipts[0]?.receiptNumber;

  return {
    id: s.id,
    regNumber: s.regNumber,
    fullName: s.fullName,
    class: s.class,
    gender: (s.gender === "Female" ? "Female" : "Male") as "Male" | "Female",
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    parentEmail: s.parentEmail || undefined,
    totalTermBill: Number(s.totalTermBill),
    totalPaid: Number(s.totalPaid),
    balanceRemaining: Number(s.balanceRemaining),
    status: s.status as any,
    isRepeating: !!s.isRepeating,
    lastPaymentDate: s.lastPaymentDate || undefined,
    paymentBank,
    paidBanks,
    lastReceiptNumber,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString().split("T")[0] : String(s.createdAt),
  };
}

export function formatReceipt(r: any): Receipt {
  return {
    id: r.id,
    receiptNumber: r.receiptNumber,
    studentId: r.studentId,
    regNumber: r.regNumber,
    studentName: r.studentName,
    studentClass: r.studentClass,
    parentName: r.parentName,
    parentPhone: r.parentPhone,
    parentEmail: r.parentEmail || undefined,
    amountPaid: Number(r.amountPaid),
    totalTermBill: Number(r.totalTermBill),
    previousTotalPaid: Number(r.previousTotalPaid),
    newTotalPaid: Number(r.newTotalPaid),
    balanceRemaining: Number(r.balanceRemaining),
    paymentStatus: r.paymentStatus as any,
    paymentMethod: r.paymentMethod as any,
    bankReference: r.bankReference || undefined,
    bankName: r.bankName || "",
    items: (r.items || []).map((it: any) => ({
      name: it.name,
      category: it.category,
      amount: Number(it.amount),
      description: it.description || undefined,
      chargeAmount: it.chargeAmount == null ? undefined : Number(it.chargeAmount),
      chargeBalance: it.chargeBalance == null ? undefined : Number(it.chargeBalance),
      paymentTerm: it.paymentTerm || undefined,
    })),
    term: r.term,
    session: r.session,
    date: r.date,
    timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
    issuedBy: r.issuedBy,
    qrCodeDataUrl: r.qrCodeDataUrl || undefined,
    securityHash: r.securityHash,
    notes: r.notes || undefined,
    isVoided: !!r.isVoided,
    voidReason: r.voidReason || undefined,
    voidedAt: r.voidedAt instanceof Date ? r.voidedAt.toISOString() : (r.voidedAt || undefined),
    voidedBy: r.voidedBy || undefined,
  };
}

export function formatSchool(s: any): SchoolProfile {
  let bankAccounts: BankAccountConfig[] = [];
  if (s.bankAccountsJson) {
    try {
      const parsed = JSON.parse(s.bankAccountsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        bankAccounts = parsed;
      }
    } catch {
      // fallback
    }
  }

  let feeStructure: ClassFeeConfig[] = [];
  if (s.feeStructureJson) {
    try {
      const parsed = JSON.parse(s.feeStructureJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        feeStructure = parsed.map((item: any) => {
          const sportsWear = Number(item.sportsWearFee ?? item.ptaLevy) || 0;
          return {
            classLevel: item.classLevel || "",
            tuitionFee: Number(item.tuitionFee) || 0,
            booksFee: Number(item.booksFee) || 0,
            uniformFee: Number(item.uniformFee) || 0,
            sportsWearFee: sportsWear,
            ptaLevy: sportsWear,
            totalBill:
              (Number(item.tuitionFee) || 0) +
              (Number(item.booksFee) || 0) +
              (Number(item.uniformFee) || 0) +
              sportsWear,
          };
        });
      }
    } catch {
      // fallback
    }
  }

  let feeScheduleHistory: FeeScheduleHistoryEntry[] = [];
  if (s.feeScheduleHistoryJson) {
    try {
      const parsed = JSON.parse(s.feeScheduleHistoryJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        feeScheduleHistory = parsed;
      }
    } catch {
      // fallback
    }
  }

  let concessions: ConcessionCategoryConfig = DEFAULT_CONCESSIONS;
  if (s.concessionsJson) {
    try {
      const parsed = JSON.parse(s.concessionsJson);
      if (parsed && typeof parsed === "object") {
        concessions = {
          ...DEFAULT_CONCESSIONS,
          ...parsed,
        };
      }
    } catch {
      // fallback
    }
  }

  const accountantName =
    s.accountantName === "Administrator" || !s.accountantName
      ? "Aminu S. Boro"
      : s.accountantName;
  const accountantPin = s.accountantPin || "";

  return {
    name: s.name,
    shortName: s.shortName,
    motto: s.motto,
    address: s.address,
    email: s.email,
    phone: s.phone,
    currentTerm: s.currentTerm,
    currentSession: s.currentSession,
    bankName: s.bankName,
    accountNumber: s.accountNumber,
    accountName: s.accountName,
    accountantName,
    accountantPin,
    logoUrl: s.logoUrl || "/logo.png",
    receiptPrefix: s.receiptPrefix || "AFIA/",
    receiptFooterNote:
      (s.receiptFooterNote || "").replace(/Bursary/gi, "Accounts") ||
      "Receipt • Valid only with authorized Stamp • Fees paid are non-refundable • All payments subject to bank clearance",
    defaultReceiptFormat: (s.defaultReceiptFormat as any) || "traditional",
    showStamp: s.showStamp !== undefined ? s.showStamp : true,
    bankAccounts,
    feeStructure,
    feeScheduleHistory,
    concessions,
  };
}

export function formatStaff(u: any): StaffUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as any,
    pin: u.pin,
    title: u.title,
    avatar: u.avatar || undefined,
  };
}

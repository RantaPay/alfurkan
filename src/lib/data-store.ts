import QRCode from "qrcode";
import { prisma } from "./prisma";
import {
  Student,
  Receipt,
  SchoolProfile,
  ReportSummary,
  ReceiptItem,
  StaffUser,
  BankAccountConfig,
  ClassFeeConfig,
  FeeScheduleHistoryEntry,
  ConcessionCategoryConfig,
} from "./types";
import { Prisma } from "@prisma/client";
import {
  DEFAULT_CONCESSIONS,
  calculateStudentBill,
  detectStudentCategory,
} from "./student-importer";

export const DEFAULT_USERS: StaffUser[] = [];

export const DEFAULT_BANK_ACCOUNTS: BankAccountConfig[] = [];

export const DEFAULT_FEE_STRUCTURE: ClassFeeConfig[] = [];

export function formatSessionCode(sessionStr?: string): string {
  if (!sessionStr) {
    const curYear = new Date().getFullYear();
    const nextYear = (curYear + 1).toString().slice(-2);
    return `${curYear}-${nextYear}`;
  }
  const match = sessionStr.match(/(\d{4})[/-](\d{2,4})/);
  if (match) {
    const startYear = match[1];
    const endYear = match[2].length === 4 ? match[2].slice(-2) : match[2];
    return `${startYear}-${endYear}`;
  }
  return sessionStr.replace(/\s*Academic\s*Session/i, "").trim();
}

export const DEFAULT_SCHOOL: SchoolProfile = {
  name: "Alfurqan International Academy",
  shortName: "Alfurqan",
  motto: "Knowledge and Guidance",
  address: "Along Dass Road, Bauchi State",
  email: "admin@alfurqanintlacademy.com",
  phone: "+234 806 977 0538",
  currentTerm: "1st Term",
  currentSession: "2026/2027 Session",
  bankName: "",
  accountNumber: "",
  accountName: "",
  accountantName: "Aminu S. Boro",
  accountantPin: "",
  logoUrl: "/logo.png",
  receiptPrefix: "AFIA/",
  receiptFooterNote:
    "Receipt • Valid only with authorized Stamp • Fees paid are non-refundable • All payments subject to bank clearance",
  defaultReceiptFormat: "traditional",
  showStamp: true,
  bankAccounts: [],
  feeStructure: [],
  concessions: DEFAULT_CONCESSIONS,
};

// Formatter Helpers to map Prisma database models to frontend types
function formatStudent(s: any): Student {
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

function formatReceipt(r: any): Receipt {
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

function formatSchool(s: any): SchoolProfile {
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

function formatStaff(u: any): StaffUser {
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

// Student Queries
export async function getStudents(
  query?: string,
  classFilter?: string,
  statusFilter?: string
): Promise<Student[]> {
  const where: Prisma.StudentWhereInput = {};

  if (query && query.trim()) {
    const q = query.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { regNumber: { contains: q, mode: "insensitive" } },
      { parentName: { contains: q, mode: "insensitive" } },
      { parentPhone: { contains: q, mode: "insensitive" } },
    ];
  }

  if (classFilter && classFilter !== "ALL") {
    where.class = { startsWith: classFilter, mode: "insensitive" };
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return students.map(formatStudent);
}

export async function getDistinctClassLevels(): Promise<string[]> {
  const distinct = await prisma.student.findMany({
    select: { class: true },
    distinct: ["class"],
  });

  const baseSet = new Set<string>();
  for (const item of distinct) {
    if (!item.class) continue;
    // Strip trailing arm letter: e.g. "Basic 1 A" -> "Basic 1", "JSS 2 C" -> "JSS 2", "Pre-Nursery B" -> "Pre-Nursery"
    const base = item.class.replace(/\s+[-–]?[A-Za-z0-9]$/i, "").trim();
    if (base) {
      baseSet.add(base);
    }
  }

  // Canonical educational sorting
  const orderRank = (cls: string) => {
    const l = cls.toLowerCase();
    if (l.includes("pre-nursery")) return 1;
    if (l.includes("nursery 1")) return 2;
    if (l.includes("nursery 2")) return 3;
    if (l.includes("pre-basic") || l.includes("pre basic") || l === "pb" || l.startsWith("pb ") || l.startsWith("pb-")) return 4;
    if (l.includes("basic 1")) return 11;
    if (l.includes("basic 2")) return 12;
    if (l.includes("basic 3")) return 13;
    if (l.includes("basic 4")) return 14;
    if (l.includes("basic 5")) return 15;
    if (l.includes("basic 6")) return 16;
    if (l.includes("jss 1")) return 21;
    if (l.includes("jss 2")) return 22;
    if (l.includes("jss 3")) return 23;
    if (l.includes("ss 1")) return 31;
    if (l.includes("ss 2")) return 32;
    if (l.includes("ss 3")) return 33;
    return 99;
  };

  return Array.from(baseSet).sort((a, b) => {
    const diff = orderRank(a) - orderRank(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}

export async function getStudentById(id: string): Promise<Student | null> {
  const student = await prisma.student.findUnique({
    where: { id },
  });
  return student ? formatStudent(student) : null;
}

export async function getStudentByRegNumber(regNumber: string): Promise<Student | null> {
  const clean = regNumber.trim();
  const student = await prisma.student.findFirst({
    where: {
      regNumber: { equals: clean, mode: "insensitive" },
    },
  });
  return student ? formatStudent(student) : null;
}

// Receipt Queries
export async function getReceipts(limit?: number): Promise<Receipt[]> {
  const receipts = await prisma.receipt.findMany({
    include: { items: true },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
  return receipts.map(formatReceipt);
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { items: true },
  });
  return receipt ? formatReceipt(receipt) : null;
}

export async function getReceiptByNumber(receiptNumber: string): Promise<Receipt | null> {
  const clean = receiptNumber.trim();
  const receipt = await prisma.receipt.findFirst({
    where: {
      receiptNumber: { equals: clean, mode: "insensitive" },
    },
    include: { items: true },
  });
  return receipt ? formatReceipt(receipt) : null;
}

export async function getStudentReceipts(studentId: string): Promise<Receipt[]> {
  const receipts = await prisma.receipt.findMany({
    where: { studentId },
    include: { items: true },
    orderBy: { timestamp: "desc" },
  });
  return receipts.map(formatReceipt);
}

export interface CheckDuplicateInput {
  studentName?: string;
  regNumber?: string;
  amountPaid: number;
  date?: string;
  items?: { name: string }[];
}

export async function findDuplicateReceipt(input: CheckDuplicateInput): Promise<Receipt | null> {
  const reg = (input.regNumber || "").trim();
  const name = (input.studentName || "").trim().toLowerCase();
  const amount = Number(input.amountPaid) || 0;
  if (amount <= 0) return null;

  // Format date for comparison
  let receiptDateObj = new Date();
  if (input.date) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      const [y, m, d] = input.date.split("-").map(Number);
      receiptDateObj = new Date(y, m - 1, d, 12, 0, 0);
    } else {
      const parsed = new Date(input.date);
      if (!isNaN(parsed.getTime())) receiptDateObj = parsed;
    }
  }

  const formattedDate = receiptDateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const isoDate = input.date ? input.date.split("T")[0] : receiptDateObj.toISOString().split("T")[0];

  const defaultFeeName = "tuition / school fees";
  const inputItemNames = (
    input.items && input.items.length > 0
      ? input.items.map((it) => it.name.trim().toLowerCase())
      : [defaultFeeName]
  )
    .filter(Boolean)
    .sort()
    .join(", ");

  const studentConditions: any[] = [];
  if (reg && reg !== "N/A") {
    studentConditions.push({ regNumber: { equals: reg, mode: "insensitive" } });
  } else if (name) {
    studentConditions.push({ studentName: { equals: name, mode: "insensitive" } });
  }

  if (studentConditions.length === 0) return null;

  const candidateReceipts = await prisma.receipt.findMany({
    where: {
      isVoided: false,
      amountPaid: amount,
      OR: studentConditions,
    },
    include: { items: true },
    orderBy: { timestamp: "desc" },
  });

  for (const r of candidateReceipts) {
    const rIsoDate = r.timestamp instanceof Date ? r.timestamp.toISOString().split("T")[0] : "";
    const rDateObj = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
    const rFormattedDate = !isNaN(rDateObj.getTime())
      ? rDateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "";

    const isSameDate =
      r.date.trim().toLowerCase() === formattedDate.trim().toLowerCase() ||
      r.date.trim().toLowerCase() === (input.date || "").trim().toLowerCase() ||
      (isoDate && rIsoDate === isoDate) ||
      (rFormattedDate && rFormattedDate.toLowerCase() === formattedDate.toLowerCase());

    if (!isSameDate) continue;

    const rItemNames = (
      r.items && r.items.length > 0
        ? r.items.map((it) => it.name.trim().toLowerCase())
        : [defaultFeeName]
    )
      .filter(Boolean)
      .sort()
      .join(", ");

    if (inputItemNames === rItemNames) {
      return formatReceipt(r);
    }
  }

  return null;
}

export interface CreateReceiptInput {
  studentId?: string | null;
  studentName?: string;
  regNumber?: string;
  studentClass?: string;
  amountPaid: number;
  paymentMethod: "Bank Transfer" | "Bank Deposit" | "POS" | "Cash";
  bankReference?: string;
  bankName?: string;
  date?: string;
  depositorName?: string;
  payerName?: string;
  depositorPhone?: string;
  payerPhone?: string;
  items: ReceiptItem[];
  notes?: string;
}

export async function createReceipt(input: CreateReceiptInput): Promise<Receipt> {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch student if studentId is provided, or prepare external payer
    const student = input.studentId
      ? await tx.student.findUnique({
          where: { id: input.studentId },
        })
      : null;

    if (input.studentId && !student) {
      throw new Error("Student not found");
    }

    const school = await tx.schoolProfile.findUnique({
      where: { id: "default" },
    });

    const payerFullName = (
      input.studentName ||
      input.depositorName ||
      input.payerName ||
      "External Payer"
    ).trim();

    const regNumber = student?.regNumber || input.regNumber || "N/A";
    const studentClass = student?.class || input.studentClass || "General";
    const parentName = (
      input.depositorName?.trim() ||
      input.payerName?.trim() ||
      student?.parentName ||
      payerFullName
    );
    const parentPhone = (
      input.depositorPhone?.trim() ||
      input.payerPhone?.trim() ||
      student?.parentPhone ||
      ""
    );
    const parentEmail = student?.parentEmail || null;

    let effectiveBill = student ? (student.totalTermBill || 0) : input.amountPaid;
    const schoolAny = school as any;
    if (student && effectiveBill === 0 && schoolAny?.feeStructureJson && detectStudentCategory(student.fullName) !== "ADF") {
      try {
        const fees = JSON.parse(schoolAny.feeStructureJson);
        const concessions = schoolAny.concessionsJson ? JSON.parse(schoolAny.concessionsJson) : DEFAULT_CONCESSIONS;
        const configuredBill = calculateStudentBill(student.fullName, student.class, fees, concessions);
        if (configuredBill > 0) {
          effectiveBill = configuredBill;
        }
      } catch {}
    }

    const prevTotalPaid = student ? (student.totalPaid || 0) : 0;
    const newTotalPaid = student ? prevTotalPaid + input.amountPaid : input.amountPaid;
    const newBalanceRemaining = student ? Math.max(0, effectiveBill - newTotalPaid) : 0;
    const paymentStatus: "FULL" | "PARTIAL" =
      newBalanceRemaining === 0 ? "FULL" : "PARTIAL";

    const currentTerm = school?.currentTerm || "1st Term";
    const currentSession = (school?.currentSession || "2026/2027 Session").replace(/\bAcademic\s*/gi, "").trim();
    const accountantName = school?.accountantName || "Aminu S. Boro";

    // 3. Generate sequential receipt number in format session/counter (e.g. 2026-27/0001)
    const sessionCode = formatSessionCode(currentSession);
    const count = await tx.receipt.count({
      where: { session: currentSession },
    });
    let nextNum = count + 1;
    let candidate = `${sessionCode}/${String(nextNum).padStart(4, "0")}`;
    while (await tx.receipt.findUnique({ where: { receiptNumber: candidate } })) {
      nextNum++;
      candidate = `${sessionCode}/${String(nextNum).padStart(4, "0")}`;
    }
    const receiptNumber = candidate;

    const now = new Date();
    let receiptDateObj = now;
    if (input.date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
        const [y, m, d] = input.date.split("-").map(Number);
        receiptDateObj = new Date(y, m - 1, d, 12, 0, 0);
      } else {
        const parsed = new Date(input.date);
        if (!isNaN(parsed.getTime())) {
          receiptDateObj = parsed;
        }
      }
    }

    const formattedDate = receiptDateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const isoDateString = input.date || receiptDateObj.toISOString().split("T")[0];

    // 4. Generate QR Code for Gate and Audit Clearance
    const verifyUrl = `https://alfurqan.edu.ng/verify/${receiptNumber}`;
    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 200,
        color: { dark: "#075E54", light: "#ffffff" },
      });
    } catch (err) {
      console.error("QR generation failed", err);
    }

    const securityHash = `AIA-HASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const defaultNotes = `${paymentStatus === "FULL" ? "Full payment cleared" : "Partial payment recorded"}. Verified by Accounts.`;

    const receiptItemsData =
      input.items && input.items.length > 0
        ? input.items.map((it) => ({
            name: it.name,
            category: it.category,
            amount: Number(it.amount),
            description: it.description || null,
          }))
        : [
            {
              name: "Tuition / School Fees",
              category: "Tuition",
              amount: Number(input.amountPaid),
              description: null,
            },
          ];

    // 5. Create Receipt in PostgreSQL
    const createdReceipt = await tx.receipt.create({
      data: {
        receiptNumber,
        ...(student ? { student: { connect: { id: student.id } } } : {}),
        regNumber,
        studentName: student ? student.fullName : payerFullName,
        studentClass,
        parentName,
        parentPhone,
        parentEmail,
        amountPaid: input.amountPaid,
        totalTermBill: effectiveBill,
        previousTotalPaid: prevTotalPaid,
        newTotalPaid,
        balanceRemaining: newBalanceRemaining,
        paymentStatus,
        paymentMethod: input.paymentMethod,
        bankReference: input.bankReference?.trim() || `TRF/NIP/${Date.now().toString().slice(-6)}`,
        bankName: (input as any).bankName || school?.bankName || "",
        term: currentTerm,
        session: currentSession,
        date: formattedDate,
        timestamp: receiptDateObj,
        issuedBy: accountantName,
        qrCodeDataUrl,
        securityHash,
        notes: input.notes?.trim() || defaultNotes,
        items: {
          create: receiptItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // 6. Update student balance in PostgreSQL (if registered student)
    if (student) {
      await tx.student.update({
        where: { id: student.id },
        data: {
          totalTermBill: effectiveBill,
          totalPaid: newTotalPaid,
          balanceRemaining: newBalanceRemaining,
          status: effectiveBill === 0 ? "UNPAID" : newBalanceRemaining === 0 ? "FULL" : "PARTIAL",
          lastPaymentDate: isoDateString,
        },
      });
    }

    // 7. Insert Audit Log
    await tx.auditLog.create({
      data: {
        action: "RECEIPT_ISSUED",
        performedBy: accountantName,
        details: JSON.stringify({
          receiptNumber,
          studentRegNumber: student?.regNumber || regNumber,
          studentName: student?.fullName || payerFullName,
          amountPaid: input.amountPaid,
          paymentMethod: input.paymentMethod,
          bankName: (input as any).bankName || school?.bankName || "",
          timestamp: now.toISOString(),
        }),
      },
    });

    return formatReceipt(createdReceipt);
  });
}

// Reports and Analytics
export async function getReportData(
  term?: string,
  month?: string,
  classFilter?: string,
  statusFilter?: string,
  bankFilter?: string
) {
  const where: Prisma.StudentWhereInput = {};

  if (classFilter && classFilter !== "ALL") {
    where.class = { startsWith: classFilter, mode: "insensitive" };
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  if (bankFilter && bankFilter !== "ALL") {
    where.receipts = {
      some: {
        isVoided: false,
        bankName: {
          contains: bankFilter,
          mode: "insensitive",
        },
      },
    };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      receipts: {
        where: {
          isVoided: false,
        },
        orderBy: {
          timestamp: "desc",
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const school = await getSchoolProfile();

  // Fetch all active non-voided receipts for accurate bank reconciliation
  const activeReceipts = await prisma.receipt.findMany({
    where: {
      isVoided: false,
    },
    select: {
      id: true,
      bankName: true,
      amountPaid: true,
      paymentMethod: true,
    },
  });

  // Calculate Bank Reconciliation metrics grouped by bank
  const bankTotalsMap = new Map<string, { totalAmount: number; receiptCount: number }>();
  let totalAllBanksAmount = 0;

  for (const r of activeReceipts) {
    const rawBank = (r.bankName || "").trim();
    if (!rawBank) continue;
    const bName = rawBank;

    const prev = bankTotalsMap.get(bName) || { totalAmount: 0, receiptCount: 0 };
    prev.totalAmount += r.amountPaid;
    prev.receiptCount += 1;
    bankTotalsMap.set(bName, prev);
    totalAllBanksAmount += r.amountPaid;
  }

  const bankReconciliation = Array.from(bankTotalsMap.entries())
    .map(([bankName, stats]) => ({
      bankName,
      totalAmount: stats.totalAmount,
      receiptCount: stats.receiptCount,
      percentage: totalAllBanksAmount > 0 ? Math.round((stats.totalAmount / totalAllBanksAmount) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Exact collections for the filtered bank (if filtering by a specific bank)
  let bankSpecificCollection: number | undefined = undefined;
  if (bankFilter && bankFilter !== "ALL") {
    const matchingReceipts = activeReceipts.filter((r) =>
      (r.bankName || "").toLowerCase().includes(bankFilter.toLowerCase())
    );
    bankSpecificCollection = matchingReceipts.reduce((sum, r) => sum + r.amountPaid, 0);
  }

  const totalStudents = students.length;
  const expectedRevenue = students.reduce((sum, s) => sum + s.totalTermBill, 0);
  const collectedRevenue =
    bankSpecificCollection !== undefined
      ? bankSpecificCollection
      : students.reduce((sum, s) => sum + s.totalPaid, 0);
  const outstandingDebt = Math.max(0, expectedRevenue - collectedRevenue);
  const collectionRate = expectedRevenue > 0 ? Math.min(100, Math.round((collectedRevenue / expectedRevenue) * 100)) : 0;

  const fullPaymentCount = students.filter((s) => s.status === "FULL").length;
  const partialPaymentCount = students.filter((s) => s.status === "PARTIAL").length;
  const unpaidCount = students.filter((s) => s.totalTermBill > 0 && s.status === "UNPAID").length;

  const summary: ReportSummary = {
    period: term || school.currentTerm,
    totalStudents,
    expectedRevenue,
    collectedRevenue,
    outstandingDebt,
    collectionRate,
    fullPaymentCount,
    partialPaymentCount,
    unpaidCount,
    filteredBank: bankFilter !== "ALL" ? bankFilter : undefined,
    filteredClass: classFilter !== "ALL" ? classFilter : undefined,
    bankReconciliation,
    bankSpecificCollection,
  };

  return {
    summary,
    students: students.map(formatStudent),
    school,
  };
}

// School Profile Queries
export async function getSchoolProfile(): Promise<SchoolProfile> {
  let profile = await prisma.schoolProfile.findUnique({
    where: { id: "default" },
  });

  if (!profile) {
    profile = await prisma.schoolProfile.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        ...DEFAULT_SCHOOL,
      },
    });
  }

  return formatSchool(profile);
}

export async function updateSchoolProfile(updates: Partial<SchoolProfile> & { feeRevisionNote?: string }): Promise<SchoolProfile> {
  const { bankAccounts, feeStructure, feeScheduleHistory, feeRevisionNote, concessions, ...rest } = updates;
  const prismaData: any = { ...rest };

  if (bankAccounts !== undefined) {
    prismaData.bankAccountsJson = JSON.stringify(bankAccounts);
    const defaultAcc = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    if (defaultAcc) {
      prismaData.bankName = defaultAcc.bankName;
      prismaData.accountNumber = defaultAcc.accountNumber;
      prismaData.accountName = defaultAcc.accountName;
    }
  }

  if (concessions !== undefined) {
    prismaData.concessionsJson = JSON.stringify(concessions);
  }

  if (feeStructure !== undefined) {
    prismaData.feeStructureJson = JSON.stringify(feeStructure);

    // If explicit feeScheduleHistory was passed, prioritize it; otherwise append history entry
    if (feeScheduleHistory !== undefined) {
      prismaData.feeScheduleHistoryJson = JSON.stringify(feeScheduleHistory);
    } else {
      const current = await prisma.schoolProfile.findUnique({ where: { id: "default" } });
      let currentHistory: FeeScheduleHistoryEntry[] = [];
      const currentAny = current as any;
      if (currentAny?.feeScheduleHistoryJson) {
        try {
          const parsed = JSON.parse(currentAny.feeScheduleHistoryJson);
          if (Array.isArray(parsed)) currentHistory = parsed;
        } catch {
          // ignore
        }
      }

      const activeSession = updates.currentSession || current?.currentSession || "2026/2027 Academic Session";
      const activeTerm = updates.currentTerm || current?.currentTerm || "1st Term";
      const updater = updates.accountantName || current?.accountantName || "Aminu S. Boro (Accountant)";

      const newHistoryEntry: FeeScheduleHistoryEntry = {
        id: `fee_rev_${Date.now()}`,
        session: activeSession,
        term: activeTerm,
        updatedAt: new Date().toISOString(),
        updatedBy: updater,
        notes: feeRevisionNote || `Fee schedule updated for ${activeTerm} (${activeSession})`,
        schedule: feeStructure,
        summaryText: `Rates revised for ${feeStructure.length} classes: JSS 1 (₦${(feeStructure.find(f => f.classLevel === "JSS 1")?.totalBill || 0).toLocaleString()}), SS 1 (₦${(feeStructure.find(f => f.classLevel === "SS 1")?.totalBill || 0).toLocaleString()})`,
      };

      currentHistory.unshift(newHistoryEntry);
      if (currentHistory.length > 50) currentHistory = currentHistory.slice(0, 50);
      prismaData.feeScheduleHistoryJson = JSON.stringify(currentHistory);
    }
  } else if (feeScheduleHistory !== undefined) {
    prismaData.feeScheduleHistoryJson = JSON.stringify(feeScheduleHistory);
  }

  const updated = await prisma.schoolProfile.upsert({
    where: { id: "default" },
    update: prismaData,
    create: {
      id: "default",
      ...prismaData,
    },
  });

  const isFeeUpdate = feeStructure !== undefined;
  const isConcessionUpdate = concessions !== undefined;
  if (isFeeUpdate || isConcessionUpdate) {
    let activeFees: ClassFeeConfig[] = [];
    if (feeStructure !== undefined && Array.isArray(feeStructure)) {
      activeFees = feeStructure;
    } else if (updated.feeStructureJson) {
      try {
        activeFees = JSON.parse(updated.feeStructureJson);
      } catch {}
    }

    let activeConcessions: ConcessionCategoryConfig = DEFAULT_CONCESSIONS;
    const updatedAny = updated as any;
    if (concessions !== undefined) {
      activeConcessions = { ...DEFAULT_CONCESSIONS, ...concessions };
    } else if (updatedAny.concessionsJson) {
      try {
        activeConcessions = { ...DEFAULT_CONCESSIONS, ...JSON.parse(updatedAny.concessionsJson) };
      } catch {}
    }

    const allStudents = await prisma.student.findMany({
      select: {
        id: true,
        fullName: true,
        class: true,
        totalPaid: true,
        totalTermBill: true,
      },
    });

    const updateOps: Promise<any>[] = [];
    for (const s of allStudents) {
      const targetBill = calculateStudentBill(s.fullName, s.class, activeFees, activeConcessions);
      if (s.totalTermBill !== targetBill) {
        const bal = Math.max(0, targetBill - s.totalPaid);
        const status = targetBill === 0 ? "FULL" : bal === 0 ? "FULL" : s.totalPaid > 0 ? "PARTIAL" : "UNPAID";
        updateOps.push(
          prisma.student.update({
            where: { id: s.id },
            data: {
              totalTermBill: targetBill,
              balanceRemaining: bal,
              status,
            },
          })
        );
      }
    }

    for (let i = 0; i < updateOps.length; i += 50) {
      await Promise.all(updateOps.slice(i, i + 50));
    }
  }

  await prisma.auditLog.create({
    data: {
      action: isFeeUpdate ? "FEE_SCHEDULE_UPDATED" : "SETTINGS_UPDATED",
      performedBy: updated.accountantName || "Aminu S. Boro",
      details: JSON.stringify({
        ...updates,
        session: updated.currentSession,
        term: updated.currentTerm,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  return formatSchool(updated);
}

// Student Creation & Bulk Import
export async function createStudent(input: any): Promise<Student> {
  let regNumber = input.regNumber?.trim();
  if (!regNumber) {
    const count = await prisma.student.count();
    const year = new Date().getFullYear();
    regNumber = `AIA/${year}/${String(count + 101).padStart(4, "0")}`;
  }

  const totalBill = Number(input.totalTermBill) || 0;

  const student = await prisma.student.create({
    data: {
      regNumber,
      fullName: input.fullName.trim(),
      class: input.class.trim(),
      gender: input.gender || "Male",
      parentName: input.parentName.trim(),
      parentPhone: input.parentPhone?.trim() || "",
      parentEmail: input.parentEmail?.trim() || null,
      totalTermBill: totalBill,
      totalPaid: 0,
      balanceRemaining: totalBill,
      status: "UNPAID",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "STUDENT_ENROLLED",
      performedBy: "Accounts Staff",
      details: JSON.stringify({
        studentId: student.id,
        regNumber: student.regNumber,
        fullName: student.fullName,
        class: student.class,
      }),
    },
  });

  return formatStudent(student);
}

export async function importStudentsBulk(studentsList: any[]): Promise<Student[]> {
  const created: Student[] = [];
  const year = new Date().getFullYear();
  const currentCount = await prisma.student.count();

  for (let i = 0; i < studentsList.length; i++) {
    const s = studentsList[i];
    if (!s.fullName?.trim()) continue;

    const regNumber =
      s.regNumber?.trim() || `AIA/${year}/${String(currentCount + i + 101).padStart(4, "0")}`;
    const totalBill = Number(s.totalTermBill) || 0;

    const student = await prisma.student.upsert({
      where: { regNumber },
      update: {
        fullName: s.fullName.trim(),
        class: s.class?.trim() || "",
        gender: s.gender || "Male",
        parentName: s.parentName?.trim() || "Parent/Guardian",
        parentPhone: s.parentPhone?.trim() || "",
        parentEmail: s.parentEmail?.trim() || null,
        totalTermBill: totalBill,
      },
      create: {
        regNumber,
        fullName: s.fullName.trim(),
        class: s.class?.trim() || "",
        gender: s.gender || "Male",
        parentName: s.parentName?.trim() || "Parent/Guardian",
        parentPhone: s.parentPhone?.trim() || "",
        parentEmail: s.parentEmail?.trim() || null,
        totalTermBill: totalBill,
        totalPaid: 0,
        balanceRemaining: totalBill,
        status: "UNPAID",
      },
    });

    created.push(formatStudent(student));
  }

  await prisma.auditLog.create({
    data: {
      action: "STUDENTS_BULK_IMPORTED",
      performedBy: "Accounts Staff",
      details: JSON.stringify({ count: created.length }),
    },
  });

  return created;
}

export async function updateStudent(
  id: string,
  updates: {
    fullName?: string;
    class?: string;
    isRepeating?: boolean;
    totalTermBill?: number;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    gender?: "Male" | "Female";
    operator?: string;
  }
): Promise<Student> {
  const current = await prisma.student.findUnique({
    where: { id },
  });
  if (!current) {
    throw new Error("Student not found");
  }

  const dataToUpdate: any = {};
  if (updates.fullName !== undefined) dataToUpdate.fullName = updates.fullName.trim();
  if (updates.class !== undefined) dataToUpdate.class = updates.class.trim();
  if (updates.isRepeating !== undefined) dataToUpdate.isRepeating = !!updates.isRepeating;
  if (updates.gender !== undefined) dataToUpdate.gender = updates.gender;
  if (updates.parentName !== undefined) dataToUpdate.parentName = updates.parentName.trim();
  if (updates.parentPhone !== undefined) dataToUpdate.parentPhone = updates.parentPhone.trim();
  if (updates.parentEmail !== undefined) dataToUpdate.parentEmail = updates.parentEmail?.trim() || null;

  if (updates.totalTermBill !== undefined) {
    const newBill = Number(updates.totalTermBill);
    dataToUpdate.totalTermBill = newBill;
    const newBalance = Math.max(0, newBill - current.totalPaid);
    dataToUpdate.balanceRemaining = newBalance;
    dataToUpdate.status = newBalance === 0 ? "FULL" : current.totalPaid > 0 ? "PARTIAL" : "UNPAID";
  }

  const updated = await prisma.student.update({
    where: { id },
    data: dataToUpdate,
  });

  await prisma.auditLog.create({
    data: {
      action: "STUDENT_UPDATED",
      performedBy: updates.operator || "Accountant/Admin",
      details: JSON.stringify({
        studentId: id,
        regNumber: updated.regNumber,
        previousClass: current.class,
        newClass: updated.class,
        isRepeating: updated.isRepeating,
        previousBill: current.totalTermBill,
        newBill: updated.totalTermBill,
      }),
    },
  });

  return formatStudent(updated);
}

export async function deleteStudent(id: string, operator?: string): Promise<boolean> {
  const current = await prisma.student.findUnique({
    where: { id },
  });
  if (!current) {
    throw new Error("Student not found");
  }

  await prisma.student.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      action: "STUDENT_DELETED",
      performedBy: operator || "Accountant/Admin",
      details: JSON.stringify({
        studentId: id,
        regNumber: current.regNumber,
        fullName: current.fullName,
        class: current.class,
      }),
    },
  });

  return true;
}

export async function promoteStudentsSession(
  promotions: Array<{
    studentId: string;
    newClass: string;
    isRepeating: boolean;
    newTermBill?: number;
  }>,
  operator: string = "Accountant/Admin"
): Promise<{ success: boolean; updatedCount: number }> {
  return await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const p of promotions) {
      const student = await tx.student.findUnique({
        where: { id: p.studentId },
      });
      if (!student) continue;

      const dataToUpdate: any = {
        class: p.newClass.trim(),
        isRepeating: p.isRepeating,
      };

      if (p.newTermBill !== undefined && p.newTermBill > 0) {
        dataToUpdate.totalTermBill = p.newTermBill;
        dataToUpdate.totalPaid = 0;
        dataToUpdate.balanceRemaining = p.newTermBill;
        dataToUpdate.status = "UNPAID";
        dataToUpdate.lastPaymentDate = null;
      }

      await tx.student.update({
        where: { id: p.studentId },
        data: dataToUpdate,
      });
      count++;
    }

    await tx.auditLog.create({
      data: {
        action: "SESSION_PROMOTION_EXECUTED",
        performedBy: operator,
        details: JSON.stringify({
          promotedCount: count,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return { success: true, updatedCount: count };
  });
}

const PROMOTION_LEVEL_ORDER = [
  "Pre-Nursery",
  "Nursery 1",
  "Nursery 2",
  "Pre-Basic",
  "Basic 1",
  "Basic 2",
  "Basic 3",
  "Basic 4",
  "Basic 5",
  "Basic 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SS 1",
  "SS 2",
  "SS 3",
];

const PROMOTION_NEXT_LEVEL_MAP: Record<string, string> = {
  "Pre-Nursery": "Nursery 1",
  "Nursery 1": "Nursery 2",
  "Nursery 2": "Basic 1",
  "Pre-Basic": "Basic 1",
  "Basic 1": "Basic 2",
  "Basic 2": "Basic 3",
  "Basic 3": "Basic 4",
  "Basic 4": "Basic 5",
  "Basic 5": "Basic 6",
  "Basic 6": "JSS 1",
  "JSS 1": "JSS 2",
  "JSS 2": "JSS 3",
  "JSS 3": "SS 1",
  "SS 1": "SS 2",
  "SS 2": "SS 3",
  "SS 3": "Graduated Alumni",
};

export function getAutoPromotedClassName(currentClass: string): string {
  const current = (currentClass || "").trim();
  for (const lvl of PROMOTION_LEVEL_ORDER) {
    if (current.startsWith(lvl)) {
      const nextLvl = PROMOTION_NEXT_LEVEL_MAP[lvl];
      if (nextLvl === "Graduated Alumni") return "Graduated Alumni";
      const arm = current.substring(lvl.length).trim();
      return arm ? `${nextLvl} ${arm}` : nextLvl;
    }
  }
  if (current.toLowerCase().includes("graduated")) return "Graduated Alumni";
  return current;
}

export async function autoPromoteAllStudents(
  operator: string = "Chief Accountant & Admin"
): Promise<{ success: boolean; updatedCount: number; breakdown: Record<string, number> }> {
  const allStudents = await prisma.student.findMany();
  const breakdown: Record<string, number> = {};

  const updates: Array<{ id: string; newClass: string }> = [];

  for (const s of allStudents) {
    const nextClass = getAutoPromotedClassName(s.class);
    if (nextClass !== s.class) {
      updates.push({ id: s.id, newClass: nextClass });
      const transitionKey = `${s.class.split(" ")[0]} → ${nextClass.split(" ")[0]}`;
      breakdown[transitionKey] = (breakdown[transitionKey] || 0) + 1;
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const u of updates) {
      await tx.student.update({
        where: { id: u.id },
        data: {
          class: u.newClass,
          isRepeating: false, // Clean slate for new session; repeaters are marked via individual edit
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "AUTO_SESSION_PROMOTION_ALL",
        performedBy: operator,
        details: JSON.stringify({
          promotedCount: updates.length,
          breakdown,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  });

  return { success: true, updatedCount: updates.length, breakdown };
}

// Receipt Void / Cancellation - ACID Transactional
export async function voidReceipt(
  receiptId: string,
  reason: string,
  voidedBy?: string
): Promise<Receipt> {
  return await prisma.$transaction(async (tx) => {
    const receipt = await tx.receipt.findUnique({
      where: { id: receiptId },
      include: { items: true },
    });

    if (!receipt) {
      throw new Error("Receipt not found");
    }

    if (receipt.isVoided) {
      throw new Error("This receipt is already voided.");
    }

    const school = await tx.schoolProfile.findUnique({ where: { id: "default" } });
    const operator = voidedBy || school?.accountantName || "Aminu S. Boro";
    const now = new Date();

    // 1. Mark receipt as voided
    const updatedReceipt = await tx.receipt.update({
      where: { id: receiptId },
      data: {
        isVoided: true,
        voidReason: reason.trim(),
        voidedAt: now,
        voidedBy: operator,
      },
      include: { items: true },
    });

    // 2. Re-adjust student balance from all remaining active receipts
    const student = receipt.studentId
      ? await tx.student.findUnique({
          where: { id: receipt.studentId },
        })
      : null;

    if (student) {
      const activeReceipts = await tx.receipt.findMany({
        where: {
          studentId: student.id,
          isVoided: false,
        },
      });

      const newTotalPaid = activeReceipts.reduce((sum, r) => sum + r.amountPaid, 0);
      const newBalanceRemaining = Math.max(0, student.totalTermBill - newTotalPaid);
      const newStatus =
        newBalanceRemaining === 0 ? "FULL" : newTotalPaid > 0 ? "PARTIAL" : "UNPAID";

      await tx.student.update({
        where: { id: student.id },
        data: {
          totalPaid: newTotalPaid,
          balanceRemaining: newBalanceRemaining,
          status: newStatus,
        },
      });
    }

    // 3. Record Audit Log
    await tx.auditLog.create({
      data: {
        action: "RECEIPT_VOIDED",
        performedBy: operator,
        details: JSON.stringify({
          receiptNumber: receipt.receiptNumber,
          receiptId,
          reason,
          timestamp: now.toISOString(),
        }),
      },
    });

    return formatReceipt(updatedReceipt);
  });
}

// Staff Authentication Queries
export async function authenticateStaff(input: {
  email?: string;
  password?: string;
  mode?: string;
  pin?: string;
}): Promise<StaffUser | null> {
  const searchEmail = input.email?.toLowerCase().trim() || "";
  if (!searchEmail || !input.password) return null;

  const user = await prisma.staffUser.findFirst({
    where: {
      email: { equals: searchEmail, mode: "insensitive" },
      password: input.password,
    },
  });
  return user ? formatStaff(user) : null;
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  const users = await prisma.staffUser.findMany({
    orderBy: { createdAt: "asc" },
  });
  return users.map(formatStaff);
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  role: "Accountant" | "Admin" | "Cashier";
  pin?: string;
  password?: string;
  title: string;
  avatar?: string;
}): Promise<StaffUser> {
  const user = await prisma.staffUser.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      role: input.role || "Admin",
      pin: input.pin ? input.pin.trim() : "0000",
      password: input.password || "admin",
      title: input.title.trim(),
      avatar: input.avatar,
    },
  });
  return formatStaff(user);
}

export async function updateStaffUser(
  id: string,
  updates: Partial<{
    name: string;
    email: string;
    role: "Accountant" | "Admin" | "Cashier";
    pin: string;
    password?: string;
    title: string;
    avatar?: string;
  }>
): Promise<StaffUser> {
  const data: any = { ...updates };
  if (data.email) data.email = data.email.toLowerCase().trim();
  if (data.pin) data.pin = data.pin.trim();
  if (data.title) data.title = data.title.trim();

  const user = await prisma.staffUser.update({
    where: { id },
    data,
  });
  return formatStaff(user);
}

export async function deleteStaffUser(id: string): Promise<boolean> {
  const count = await prisma.staffUser.count();
  if (count <= 1) {
    throw new Error("Cannot delete the only remaining administrator account.");
  }
  await prisma.staffUser.delete({
    where: { id },
  });
  return true;
}

// Backward Compatibility Helpers for readDB / writeDB
export async function readDB() {
  const [school, students, receipts, users] = await Promise.all([
    getSchoolProfile(),
    getStudents(),
    getReceipts(),
    getStaffUsers(),
  ]);
  return { school, students, receipts, users };
}

export async function writeDB() {
  // In PostgreSQL, individual operations are persisted immediately and transactionally.
  return Promise.resolve();
}

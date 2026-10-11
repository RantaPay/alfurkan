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
} from "./types";
import { Prisma } from "@prisma/client";

export const DEFAULT_USERS: StaffUser[] = [
  {
    id: "usr_accountant",
    name: "Alhaji Ibrahim S. Danladi",
    email: "accountant@alfurqan.edu.ng",
    role: "Accountant",
    pin: "1234",
    password: "accountant2026",
    title: "Chief Accountant & Head of Finance",
  },
  {
    id: "usr_admin",
    name: "Dr. Shehu Danladi",
    email: "admin@alfurqan.edu.ng",
    role: "Admin",
    pin: "9988",
    password: "admin2026",
    title: "Principal & College Director",
  },
];

export const DEFAULT_BANK_ACCOUNTS: BankAccountConfig[] = [
  {
    id: "bank_jaiz",
    bankName: "Jaiz Bank",
    accountNumber: "0012489301",
    accountName: "Al-Furqan International College - Fees",
    isDefault: true,
  },
  {
    id: "bank_gtb",
    bankName: "GTBank",
    accountNumber: "0239104820",
    accountName: "Al-Furqan Operational Collections",
    isDefault: false,
  },
  {
    id: "bank_zenith",
    bankName: "Zenith Bank",
    accountNumber: "1014892019",
    accountName: "Al-Furqan Academy Tuition",
    isDefault: false,
  },
  {
    id: "bank_taj",
    bankName: "Taj Bank",
    accountNumber: "0004928172",
    accountName: "Al-Furqan Non-Interest Accounts",
    isDefault: false,
  },
  {
    id: "bank_first",
    bankName: "First Bank",
    accountNumber: "2039182740",
    accountName: "Al-Furqan Secondary Collections",
    isDefault: false,
  },
];

export const DEFAULT_FEE_STRUCTURE: ClassFeeConfig[] = [
  {
    classLevel: "JSS 1",
    tuitionFee: 120000,
    booksFee: 25000,
    uniformFee: 20000,
    ptaLevy: 10000,
    totalBill: 175000,
  },
  {
    classLevel: "JSS 2",
    tuitionFee: 120000,
    booksFee: 20000,
    uniformFee: 10000,
    ptaLevy: 10000,
    totalBill: 160000,
  },
  {
    classLevel: "JSS 3",
    tuitionFee: 130000,
    booksFee: 22000,
    uniformFee: 10000,
    ptaLevy: 10000,
    totalBill: 172000,
  },
  {
    classLevel: "SS 1",
    tuitionFee: 140000,
    booksFee: 30000,
    uniformFee: 20000,
    ptaLevy: 10000,
    totalBill: 200000,
  },
  {
    classLevel: "SS 2",
    tuitionFee: 140000,
    booksFee: 25000,
    uniformFee: 10000,
    ptaLevy: 10000,
    totalBill: 185000,
  },
  {
    classLevel: "SS 3",
    tuitionFee: 150000,
    booksFee: 25000,
    uniformFee: 10000,
    ptaLevy: 10000,
    totalBill: 195000,
  },
];

export const DEFAULT_SCHOOL: SchoolProfile = {
  name: "Al-Furqan International Academy",
  shortName: "Al-Furqan",
  motto: "Knowledge and Guidance",
  address: "Along Dass Road / 10 Dukku Close, New GRA, Bauchi, Bauchi State, Nigeria",
  email: "admin@alfurqanintlacademy.com",
  phone: "+234 804 430 5624 / +234 806 977 0538 / +234 817 799 4444",
  currentTerm: "1st Term",
  currentSession: "2026/2027 Academic Session",
  bankName: "Jaiz Bank",
  accountNumber: "0012489301",
  accountName: "Al-Furqan International College - Fees",
  accountantName: "Alhaji Ibrahim S. Danladi",
  accountantPin: "1234",
  logoUrl: "/logo.png",
  receiptPrefix: "AFIA/",
  receiptFooterNote:
    "Official Receipt • Valid only with authorized Accounts Stamp • Fees paid are non-refundable • All payments subject to bank clearance",
  defaultReceiptFormat: "traditional",
  showStamp: true,
  bankAccounts: DEFAULT_BANK_ACCOUNTS,
  feeStructure: DEFAULT_FEE_STRUCTURE,
};

// Formatter Helpers to map Prisma database models to frontend types
function formatStudent(s: any): Student {
  const receipts = s.receipts || [];
  const validReceipts = receipts.filter((r: any) => !r.isVoided);
  const paidBanks = Array.from(new Set(validReceipts.map((r: any) => r.bankName).filter(Boolean))) as string[];
  const paymentBank = paidBanks.length > 0 ? paidBanks.join(", ") : (s.status === "UNPAID" ? "Unpaid / None" : "Jaiz Bank");
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
    bankName: r.bankName || "Jaiz Bank",
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
  let bankAccounts: BankAccountConfig[] = DEFAULT_BANK_ACCOUNTS;
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

  let feeStructure: ClassFeeConfig[] = DEFAULT_FEE_STRUCTURE;
  if (s.feeStructureJson) {
    try {
      const parsed = JSON.parse(s.feeStructureJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        feeStructure = parsed.map((item: any) => ({
          classLevel: item.classLevel,
          tuitionFee: Number(item.tuitionFee) || 0,
          booksFee: Number(item.booksFee) || 0,
          uniformFee: Number(item.uniformFee) || 0,
          ptaLevy: Number(item.ptaLevy) || 0,
          totalBill:
            (Number(item.tuitionFee) || 0) +
            (Number(item.booksFee) || 0) +
            (Number(item.uniformFee) || 0) +
            (Number(item.ptaLevy) || 0),
        }));
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

  // Provide initial baseline entry if empty so history is immediately viewable
  if (feeScheduleHistory.length === 0 && feeStructure.length > 0) {
    feeScheduleHistory = [
      {
        id: "fee_rev_baseline_1",
        session: s.currentSession || "2026/2027 Academic Session",
        term: s.currentTerm || "1st Term",
        updatedAt: s.updatedAt ? (s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt)) : new Date().toISOString(),
        updatedBy: s.accountantName || "Alhaji Ibrahim S. Danladi",
        notes: "Approved session schedule by School Governing Council",
        schedule: feeStructure,
        summaryText: `Standard fee schedule initialized across ${feeStructure.length} class levels`,
      },
    ];
  }

  const accountantName = s.accountantName || "Alhaji Ibrahim S. Danladi";
  const accountantPin = s.accountantPin || "1234";

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
      "Official Receipt • Valid only with authorized Accounts Stamp • Fees paid are non-refundable • All payments subject to bank clearance",
    defaultReceiptFormat: (s.defaultReceiptFormat as any) || "traditional",
    showStamp: s.showStamp !== undefined ? s.showStamp : true,
    bankAccounts,
    feeStructure,
    feeScheduleHistory,
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

export interface CreateReceiptInput {
  studentId: string;
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
    // 1. Fetch student in transaction to prevent race conditions
    const student = await tx.student.findUnique({
      where: { id: input.studentId },
    });
    if (!student) {
      throw new Error("Student not found");
    }

    const prevTotalPaid = student.totalPaid || 0;
    const newTotalPaid = prevTotalPaid + input.amountPaid;
    const newBalanceRemaining = Math.max(0, student.totalTermBill - newTotalPaid);
    const paymentStatus: "FULL" | "PARTIAL" = newBalanceRemaining === 0 ? "FULL" : "PARTIAL";

    // 2. Fetch school profile for term, session, accountant
    const school = await tx.schoolProfile.findUnique({
      where: { id: "default" },
    });

    const currentTerm = school?.currentTerm || "1st Term";
    const currentSession = school?.currentSession || "2026/2027 Academic Session";
    const accountantName = school?.accountantName || "Alhaji Ibrahim S. Danladi";

    // 3. Generate sequential receipt number
    const count = await tx.receipt.count();
    const padded = String(count + 1).padStart(4, "0");
    const year = new Date().getFullYear();
    const receiptNumber = `AFIC-RCP-${year}-${padded}`;

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

    const securityHash = `AFIC-HASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
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
        studentId: student.id,
        regNumber: student.regNumber,
        studentName: student.fullName,
        studentClass: student.class,
        parentName: input.depositorName?.trim() || input.payerName?.trim() || student.parentName,
        parentPhone: input.depositorPhone?.trim() || input.payerPhone?.trim() || student.parentPhone,
        parentEmail: student.parentEmail,
        amountPaid: input.amountPaid,
        totalTermBill: student.totalTermBill,
        previousTotalPaid: prevTotalPaid,
        newTotalPaid,
        balanceRemaining: newBalanceRemaining,
        paymentStatus,
        paymentMethod: input.paymentMethod,
        bankReference: input.bankReference?.trim() || `TRF/NIP/${Date.now().toString().slice(-6)}`,
        bankName: (input as any).bankName || school?.bankName || "Jaiz Bank",
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

    // 6. Update student ledger in PostgreSQL
    await tx.student.update({
      where: { id: student.id },
      data: {
        totalPaid: newTotalPaid,
        balanceRemaining: newBalanceRemaining,
        status: newBalanceRemaining === 0 ? "FULL" : "PARTIAL",
        lastPaymentDate: isoDateString,
      },
    });

    // 7. Insert Audit Log
    await tx.auditLog.create({
      data: {
        action: "RECEIPT_ISSUED",
        performedBy: accountantName,
        details: JSON.stringify({
          receiptNumber,
          studentRegNumber: student.regNumber,
          amountPaid: input.amountPaid,
          paymentMethod: input.paymentMethod,
          bankName: (input as any).bankName || school?.bankName || "Jaiz Bank",
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
    const rawBank = (r.bankName || "Jaiz Bank").trim();
    let bName = rawBank;
    if (/gtb/i.test(bName)) bName = "GTBank";
    else if (/jaiz/i.test(bName)) bName = "Jaiz Bank";
    else if (/zenith/i.test(bName)) bName = "Zenith Bank";
    else if (/taj/i.test(bName)) bName = "Taj Bank";
    else if (/first/i.test(bName)) bName = "First Bank";
    else if (/cash/i.test(bName)) bName = "Cash";

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
  const unpaidCount = students.filter((s) => s.status === "UNPAID").length;

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
  const { bankAccounts, feeStructure, feeScheduleHistory, feeRevisionNote, ...rest } = updates;
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

  if (feeStructure !== undefined) {
    prismaData.feeStructureJson = JSON.stringify(feeStructure);

    // If explicit feeScheduleHistory was passed, prioritize it; otherwise append history entry
    if (feeScheduleHistory !== undefined) {
      prismaData.feeScheduleHistoryJson = JSON.stringify(feeScheduleHistory);
    } else {
      const current = await prisma.schoolProfile.findUnique({ where: { id: "default" } });
      let currentHistory: FeeScheduleHistoryEntry[] = [];
      if (current?.feeScheduleHistoryJson) {
        try {
          const parsed = JSON.parse(current.feeScheduleHistoryJson);
          if (Array.isArray(parsed)) currentHistory = parsed;
        } catch {
          // ignore
        }
      }

      const activeSession = updates.currentSession || current?.currentSession || "2026/2027 Academic Session";
      const activeTerm = updates.currentTerm || current?.currentTerm || "1st Term";
      const updater = updates.accountantName || current?.accountantName || "Alhaji Ibrahim S. Danladi (Accountant)";

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
  await prisma.auditLog.create({
    data: {
      action: isFeeUpdate ? "FEE_SCHEDULE_UPDATED" : "SETTINGS_UPDATED",
      performedBy: updated.accountantName || "Administrator",
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
    regNumber = `AFIC/${year}/${String(count + 101).padStart(4, "0")}`;
  }

  const totalBill = Number(input.totalTermBill) || 165000;

  const student = await prisma.student.create({
    data: {
      regNumber,
      fullName: input.fullName.trim(),
      class: input.class.trim(),
      gender: input.gender || "Male",
      parentName: input.parentName.trim(),
      parentPhone: input.parentPhone.trim(),
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
      s.regNumber?.trim() || `AFIC/${year}/${String(currentCount + i + 101).padStart(4, "0")}`;
    const totalBill = Number(s.totalTermBill) || 165000;

    const student = await prisma.student.upsert({
      where: { regNumber },
      update: {
        fullName: s.fullName.trim(),
        class: s.class?.trim() || "JSS 1",
        gender: s.gender || "Male",
        parentName: s.parentName?.trim() || "Parent/Guardian",
        parentPhone: s.parentPhone?.trim() || "08000000000",
        parentEmail: s.parentEmail?.trim() || null,
        totalTermBill: totalBill,
      },
      create: {
        regNumber,
        fullName: s.fullName.trim(),
        class: s.class?.trim() || "JSS 1",
        gender: s.gender || "Male",
        parentName: s.parentName?.trim() || "Parent/Guardian",
        parentPhone: s.parentPhone?.trim() || "08000000000",
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

const PROMOTION_LEVEL_ORDER = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];
const PROMOTION_NEXT_LEVEL_MAP: Record<string, string> = {
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
  const breakdown: Record<string, number> = {
    "JSS 1 → JSS 2": 0,
    "JSS 2 → JSS 3": 0,
    "JSS 3 → SS 1": 0,
    "SS 1 → SS 2": 0,
    "SS 2 → SS 3": 0,
    "SS 3 → Graduated Alumni": 0,
  };

  const updates: Array<{ id: string; newClass: string }> = [];

  for (const s of allStudents) {
    const nextClass = getAutoPromotedClassName(s.class);
    if (nextClass !== s.class) {
      updates.push({ id: s.id, newClass: nextClass });
      if (s.class.startsWith("JSS 1")) breakdown["JSS 1 → JSS 2"] = (breakdown["JSS 1 → JSS 2"] || 0) + 1;
      else if (s.class.startsWith("JSS 2")) breakdown["JSS 2 → JSS 3"] = (breakdown["JSS 2 → JSS 3"] || 0) + 1;
      else if (s.class.startsWith("JSS 3")) breakdown["JSS 3 → SS 1"] = (breakdown["JSS 3 → SS 1"] || 0) + 1;
      else if (s.class.startsWith("SS 1")) breakdown["SS 1 → SS 2"] = (breakdown["SS 1 → SS 2"] || 0) + 1;
      else if (s.class.startsWith("SS 2")) breakdown["SS 2 → SS 3"] = (breakdown["SS 2 → SS 3"] || 0) + 1;
      else if (s.class.startsWith("SS 3")) breakdown["SS 3 → Graduated Alumni"] = (breakdown["SS 3 → Graduated Alumni"] || 0) + 1;
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
    const operator = voidedBy || school?.accountantName || "Alhaji Ibrahim S. Danladi";
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

    // 2. Re-adjust student ledger from all remaining active receipts
    const student = await tx.student.findUnique({
      where: { id: receipt.studentId },
    });

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
  mode: "password" | "pin";
  email?: string;
  password?: string;
  pin?: string;
}): Promise<StaffUser | null> {
  if (input.mode === "pin") {
    const cleanPin = input.pin?.trim();
    const school = await getSchoolProfile();
    const validPin = school.accountantPin || "1234";

    if (cleanPin && cleanPin === validPin) {
      const accountantUser = await prisma.staffUser.findFirst({
        where: {
          OR: [
            { id: "usr_accountant" },
            { id: "usr_bursar" },
            { role: "Accountant" },
          ],
        },
      });
      if (accountantUser) return formatStaff(accountantUser);
    }

    const user = await prisma.staffUser.findFirst({
      where: { pin: cleanPin },
    });
    return user ? formatStaff(user) : null;
  } else {
    const searchEmail = input.email?.toLowerCase().trim() || "";
    const user = await prisma.staffUser.findFirst({
      where: {
        OR: [
          { email: { equals: searchEmail, mode: "insensitive" } },
          ...(searchEmail === "accountant@alfurqan.edu.ng" ? [{ email: { equals: "bursar@alfurqan.edu.ng", mode: "insensitive" as const } }] : []),
          ...(searchEmail === "bursar@alfurqan.edu.ng" ? [{ email: { equals: "accountant@alfurqan.edu.ng", mode: "insensitive" as const } }] : []),
        ],
        password: input.password,
      },
    });
    return user ? formatStaff(user) : null;
  }
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
  pin: string;
  password?: string;
  title: string;
  avatar?: string;
}): Promise<StaffUser> {
  const user = await prisma.staffUser.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      role: input.role,
      pin: input.pin.trim(),
      password: input.password || `${input.role.toLowerCase()}2026`,
      title: input.title.trim().replace(/Bursar/gi, "Accountant"),
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
  if (data.title) data.title = data.title.replace(/Bursar/gi, "Accountant");

  const user = await prisma.staffUser.update({
    where: { id },
    data,
  });
  return formatStaff(user);
}

export async function deleteStaffUser(id: string): Promise<boolean> {
  if (id === "usr_accountant" || id === "usr_bursar") {
    throw new Error("Primary Chief Accountant account cannot be deleted.");
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

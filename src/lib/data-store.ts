import QRCode from "qrcode";
import { prisma } from "./prisma";
import { Student, Receipt, SchoolProfile, ReportSummary, ReceiptItem, StaffUser } from "./types";
import { Prisma } from "@prisma/client";

export const DEFAULT_USERS: StaffUser[] = [
  {
    id: "usr_bursar",
    name: "Alhaji Ibrahim S. Danladi",
    email: "bursar@alfurqan.edu.ng",
    role: "Bursar",
    pin: "1234",
    password: "bursar2026",
    title: "Chief Bursar & Head of Finance",
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

export const DEFAULT_SCHOOL: SchoolProfile = {
  name: "Al-Furqan International Academy",
  shortName: "Al-Furqan",
  motto: "Knowledge and Guidance",
  address: "Plot 14, Islamic Crescent, Off Airport Road, Gwarinpa, Abuja, Nigeria",
  email: "bursary@alfurqan.edu.ng",
  phone: "+234 803 456 7890 / +234 812 345 6789",
  currentTerm: "1st Term",
  currentSession: "2026/2027 Academic Session",
  bankName: "Jaiz Bank",
  accountNumber: "0012489301",
  accountName: "Al-Furqan International College - Fees",
  bursarName: "Alhaji Ibrahim S. Danladi",
  bursarPin: "1234",
  logoUrl: "/logo.png",
};

// Formatter Helpers to map Prisma database models to frontend types
function formatStudent(s: any): Student {
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
    lastPaymentDate: s.lastPaymentDate || undefined,
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
    bursarName: s.bursarName,
    bursarPin: s.bursarPin || "1234",
    logoUrl: s.logoUrl || "/logo.png",
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
    where.class = { contains: classFilter, mode: "insensitive" };
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

// Issue / Create Receipt Workflow - Fully ACID Transactional
export interface CreateReceiptInput {
  studentId: string;
  amountPaid: number;
  paymentMethod: "Bank Transfer" | "Bank Deposit" | "POS" | "Cash";
  bankReference?: string;
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

    // 2. Fetch school profile for term, session, bursar
    const school = await tx.schoolProfile.findUnique({
      where: { id: "default" },
    });

    const currentTerm = school?.currentTerm || "1st Term";
    const currentSession = school?.currentSession || "2026/2027 Academic Session";
    const bursarName = school?.bursarName || "Alhaji Ibrahim S. Danladi";

    // 3. Generate sequential receipt number
    const count = await tx.receipt.count();
    const padded = String(count + 1).padStart(4, "0");
    const year = new Date().getFullYear();
    const receiptNumber = `AFIC-RCP-${year}-${padded}`;

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

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
    const defaultNotes = `${paymentStatus === "FULL" ? "Full payment cleared" : "Partial payment recorded"}. Verified by Bursary.`;

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
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        amountPaid: input.amountPaid,
        totalTermBill: student.totalTermBill,
        previousTotalPaid: prevTotalPaid,
        newTotalPaid,
        balanceRemaining: newBalanceRemaining,
        paymentStatus,
        paymentMethod: input.paymentMethod,
        bankReference: input.bankReference?.trim() || `TRF/NIP/${Date.now().toString().slice(-6)}`,
        term: currentTerm,
        session: currentSession,
        date: formattedDate,
        timestamp: now,
        issuedBy: bursarName,
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
        lastPaymentDate: now.toISOString().split("T")[0],
      },
    });

    // 7. Insert Audit Log
    await tx.auditLog.create({
      data: {
        action: "RECEIPT_ISSUED",
        performedBy: bursarName,
        details: JSON.stringify({
          receiptNumber,
          studentRegNumber: student.regNumber,
          amountPaid: input.amountPaid,
          paymentMethod: input.paymentMethod,
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
  statusFilter?: string
) {
  const where: Prisma.StudentWhereInput = {};

  if (classFilter && classFilter !== "ALL") {
    where.class = { contains: classFilter, mode: "insensitive" };
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: { fullName: "asc" },
  });

  const school = await getSchoolProfile();

  const totalStudents = students.length;
  const expectedRevenue = students.reduce((sum, s) => sum + s.totalTermBill, 0);
  const collectedRevenue = students.reduce((sum, s) => sum + s.totalPaid, 0);
  const outstandingDebt = students.reduce((sum, s) => sum + s.balanceRemaining, 0);
  const collectionRate = expectedRevenue > 0 ? Math.round((collectedRevenue / expectedRevenue) * 100) : 0;

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

export async function updateSchoolProfile(updates: Partial<SchoolProfile>): Promise<SchoolProfile> {
  const updated = await prisma.schoolProfile.upsert({
    where: { id: "default" },
    update: {
      ...updates,
    },
    create: {
      id: "default",
      ...DEFAULT_SCHOOL,
      ...updates,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "SETTINGS_UPDATED",
      performedBy: updated.bursarName || "Administrator",
      details: JSON.stringify(updates),
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
      performedBy: "Bursary Staff",
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
      performedBy: "Bursary Staff",
      details: JSON.stringify({ count: created.length }),
    },
  });

  return created;
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
    const operator = voidedBy || school?.bursarName || "Alhaji Ibrahim S. Danladi";
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
    const user = await prisma.staffUser.findFirst({
      where: { pin: input.pin?.trim() },
    });
    return user ? formatStaff(user) : null;
  } else {
    const user = await prisma.staffUser.findFirst({
      where: {
        email: { equals: input.email?.toLowerCase().trim(), mode: "insensitive" },
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

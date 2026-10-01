import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { Student, Receipt, SchoolProfile, ReportSummary, ReceiptItem } from "./types";

const DB_FILE = path.join(process.cwd(), "data", "alfurqan-db.json");

interface DatabaseSchema {
  school: SchoolProfile;
  students: Student[];
  receipts: Receipt[];
}

const DEFAULT_SCHOOL: SchoolProfile = {
  name: "Al-Furqan International College",
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

const DEFAULT_STUDENTS: Student[] = [
  {
    id: "std_001",
    regNumber: "AFIC/2026/0101",
    fullName: "Fatima Abubakar Sadiq",
    class: "JSS 1 Diamond",
    gender: "Female",
    parentName: "Dr. Abubakar Sadiq",
    parentPhone: "08031112233",
    parentEmail: "abubakar.sadiq@gmail.com",
    totalTermBill: 165000,
    totalPaid: 165000,
    balanceRemaining: 0,
    status: "FULL",
    lastPaymentDate: "2026-09-18",
    createdAt: "2026-09-01",
  },
  {
    id: "std_002",
    regNumber: "AFIC/2026/0102",
    fullName: "Yusuf Umar Faruk",
    class: "JSS 2 Gold",
    gender: "Male",
    parentName: "Alhaji Umar Faruk",
    parentPhone: "08023456789",
    parentEmail: "umar.faruk@yahoo.com",
    totalTermBill: 175000,
    totalPaid: 90000,
    balanceRemaining: 85000,
    status: "PARTIAL",
    lastPaymentDate: "2026-09-22",
    createdAt: "2026-09-01",
  },
  {
    id: "std_003",
    regNumber: "AFIC/2026/0103",
    fullName: "Aisha Mohammed Bello",
    class: "JSS 3 Emerald",
    gender: "Female",
    parentName: "Hajiya Maryam Bello",
    parentPhone: "08055667788",
    parentEmail: "maryam.bello@outlook.com",
    totalTermBill: 180000,
    totalPaid: 180000,
    balanceRemaining: 0,
    status: "FULL",
    lastPaymentDate: "2026-09-15",
    createdAt: "2026-09-01",
  },
  {
    id: "std_004",
    regNumber: "AFIC/2026/0104",
    fullName: "Ibrahim Shehu Danladi",
    class: "SS 1 Science",
    gender: "Male",
    parentName: "Engr. Shehu Danladi",
    parentPhone: "08099887766",
    parentEmail: "shehu.danladi@gmail.com",
    totalTermBill: 210000,
    totalPaid: 100000,
    balanceRemaining: 110000,
    status: "PARTIAL",
    lastPaymentDate: "2026-09-25",
    createdAt: "2026-09-01",
  },
  {
    id: "std_005",
    regNumber: "AFIC/2026/0105",
    fullName: "Zainab Sani Zaria",
    class: "SS 2 Arts",
    gender: "Female",
    parentName: "Barrister Sani Zaria",
    parentPhone: "08144332211",
    parentEmail: "sani.zaria@legal.ng",
    totalTermBill: 195000,
    totalPaid: 0,
    balanceRemaining: 195000,
    status: "UNPAID",
    createdAt: "2026-09-01",
  },
  {
    id: "std_006",
    regNumber: "AFIC/2026/0106",
    fullName: "Abdulrahman Aliyu Kano",
    class: "SS 3 Science",
    gender: "Male",
    parentName: "Alhaji Aliyu Kano",
    parentPhone: "08088776655",
    parentEmail: "aliyu.kano@kano.gov.ng",
    totalTermBill: 230000,
    totalPaid: 230000,
    balanceRemaining: 0,
    status: "FULL",
    lastPaymentDate: "2026-09-12",
    createdAt: "2026-09-01",
  },
  {
    id: "std_007",
    regNumber: "AFIC/2026/0107",
    fullName: "Khadijah Usman Idris",
    class: "JSS 1 Gold",
    gender: "Female",
    parentName: "Mallam Usman Idris",
    parentPhone: "08066554433",
    parentEmail: "usman.idris@gmail.com",
    totalTermBill: 165000,
    totalPaid: 75000,
    balanceRemaining: 90000,
    status: "PARTIAL",
    lastPaymentDate: "2026-09-20",
    createdAt: "2026-09-01",
  },
  {
    id: "std_008",
    regNumber: "AFIC/2026/0108",
    fullName: "Mustapha Kabir Ahmed",
    class: "SS 2 Science",
    gender: "Male",
    parentName: "Dr. Kabir Ahmed",
    parentPhone: "08077665544",
    parentEmail: "kabir.ahmed@abu.edu.ng",
    totalTermBill: 205000,
    totalPaid: 0,
    balanceRemaining: 205000,
    status: "UNPAID",
    createdAt: "2026-09-01",
  },
];

const DEFAULT_RECEIPTS: Receipt[] = [
  {
    id: "rcpt_001",
    receiptNumber: "AFIC-RCP-2026-0001",
    studentId: "std_001",
    regNumber: "AFIC/2026/0101",
    studentName: "Fatima Abubakar Sadiq",
    studentClass: "JSS 1 Diamond",
    parentName: "Dr. Abubakar Sadiq",
    parentPhone: "08031112233",
    parentEmail: "abubakar.sadiq@gmail.com",
    amountPaid: 165000,
    totalTermBill: 165000,
    previousTotalPaid: 0,
    newTotalPaid: 165000,
    balanceRemaining: 0,
    paymentStatus: "FULL",
    paymentMethod: "Bank Transfer",
    bankReference: "JAIZ/TRF/20260918/984210",
    items: [
      { name: "Tuition / School Fees", category: "Tuition", amount: 120000 },
      { name: "First Term Textbooks", category: "Books", amount: 25000 },
      { name: "College Uniform (2 Sets)", category: "Uniform", amount: 15000 },
      { name: "PTA Termly Levy", category: "PTA", amount: 5000 },
    ],
    term: "1st Term",
    session: "2026/2027",
    date: "18 Sep 2026",
    timestamp: "2026-09-18T10:14:22.000Z",
    issuedBy: "Alhaji Ibrahim S. Danladi (Bursar)",
    securityHash: "AFIC-VERIFIED-984210",
    notes: "Full payment confirmed via Jaiz Bank corporate transfer.",
  },
  {
    id: "rcpt_002",
    receiptNumber: "AFIC-RCP-2026-0002",
    studentId: "std_002",
    regNumber: "AFIC/2026/0102",
    studentName: "Yusuf Umar Faruk",
    studentClass: "JSS 2 Gold",
    parentName: "Alhaji Umar Faruk",
    parentPhone: "08023456789",
    parentEmail: "umar.faruk@yahoo.com",
    amountPaid: 90000,
    totalTermBill: 175000,
    previousTotalPaid: 0,
    newTotalPaid: 90000,
    balanceRemaining: 85000,
    paymentStatus: "PARTIAL",
    paymentMethod: "Bank Transfer",
    bankReference: "GTB/NIP/20260922/741982",
    items: [
      { name: "Tuition (Part Payment 1)", category: "Tuition", amount: 65000 },
      { name: "Textbooks Pack", category: "Books", amount: 25000 },
    ],
    term: "1st Term",
    session: "2026/2027",
    date: "22 Sep 2026",
    timestamp: "2026-09-22T14:32:05.000Z",
    issuedBy: "Alhaji Ibrahim S. Danladi (Bursar)",
    securityHash: "AFIC-VERIFIED-741982",
    notes: "Part payment installment 1. Balance of ₦85,000 due before mid-term exams.",
  },
  {
    id: "rcpt_003",
    receiptNumber: "AFIC-RCP-2026-0003",
    studentId: "std_003",
    regNumber: "AFIC/2026/0103",
    studentName: "Aisha Mohammed Bello",
    studentClass: "JSS 3 Emerald",
    parentName: "Hajiya Maryam Bello",
    parentPhone: "08055667788",
    parentEmail: "maryam.bello@outlook.com",
    amountPaid: 180000,
    totalTermBill: 180000,
    previousTotalPaid: 0,
    newTotalPaid: 180000,
    balanceRemaining: 0,
    paymentStatus: "FULL",
    paymentMethod: "Bank Deposit",
    bankReference: "JAIZ-DEP-0915-4421",
    items: [
      { name: "JSS 3 Full Tuition", category: "Tuition", amount: 135000 },
      { name: "Textbooks & Revision Kits", category: "Books", amount: 30000 },
      { name: "PTA & Practical Fees", category: "PTA", amount: 15000 },
    ],
    term: "1st Term",
    session: "2026/2027",
    date: "15 Sep 2026",
    timestamp: "2026-09-15T09:20:11.000Z",
    issuedBy: "Alhaji Ibrahim S. Danladi (Bursar)",
    securityHash: "AFIC-VERIFIED-442109",
    notes: "Full payment bank deposit teller presented and confirmed.",
  },
];

// Helper to ensure QR codes are pre-generated
async function populateQRCodes(receipts: Receipt[]): Promise<Receipt[]> {
  const updated: Receipt[] = [];
  for (const r of receipts) {
    if (!r.qrCodeDataUrl) {
      try {
        const verifyPayload = `https://alfurqan.edu.ng/verify/${r.receiptNumber}`;
        r.qrCodeDataUrl = await QRCode.toDataURL(verifyPayload, {
          margin: 1,
          width: 180,
          color: { dark: "#075E54", light: "#ffffff" },
        });
      } catch (e) {
        // Fallback placeholder
      }
    }
    updated.push(r);
  }
  return updated;
}

// In-memory cache for speed
let dbCache: DatabaseSchema | null = null;

export async function readDB(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache;

  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    dbCache = JSON.parse(raw);
    if (!dbCache?.students || !dbCache?.receipts) {
      throw new Error("Invalid DB format");
    }
    if (!dbCache.school) {
      dbCache.school = DEFAULT_SCHOOL;
    } else {
      dbCache.school.bursarPin = dbCache.school.bursarPin || "1234";
      dbCache.school.logoUrl = dbCache.school.logoUrl || "";
    }
    return dbCache;
  } catch {
    // Initialize default DB
    const initialReceipts = await populateQRCodes(DEFAULT_RECEIPTS);
    const initialDB: DatabaseSchema = {
      school: DEFAULT_SCHOOL,
      students: DEFAULT_STUDENTS,
      receipts: initialReceipts,
    };
    await writeDB(initialDB);
    dbCache = initialDB;
    return initialDB;
  }
}

export async function writeDB(data: DatabaseSchema): Promise<void> {
  dbCache = data;
  try {
    const dir = path.dirname(DB_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database:", err);
  }
}

// Student Queries
export async function getStudents(query?: string, classFilter?: string, statusFilter?: string): Promise<Student[]> {
  const db = await readDB();
  let list = db.students;

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.regNumber.toLowerCase().includes(q) ||
        s.parentPhone.includes(q)
    );
  }

  if (classFilter && classFilter !== "ALL") {
    list = list.filter((s) => s.class.toLowerCase().includes(classFilter.toLowerCase()));
  }

  if (statusFilter && statusFilter !== "ALL") {
    list = list.filter((s) => s.status === statusFilter);
  }

  return list;
}

export async function getStudentById(id: string): Promise<Student | null> {
  const db = await readDB();
  return db.students.find((s) => s.id === id) || null;
}

export async function getStudentByRegNumber(regNumber: string): Promise<Student | null> {
  const db = await readDB();
  const clean = regNumber.trim().toLowerCase();
  return db.students.find((s) => s.regNumber.toLowerCase() === clean) || null;
}

// Receipt Queries
export async function getReceipts(limit?: number): Promise<Receipt[]> {
  const db = await readDB();
  const sorted = [...db.receipts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const db = await readDB();
  return db.receipts.find((r) => r.id === id) || null;
}

export async function getReceiptByNumber(receiptNumber: string): Promise<Receipt | null> {
  const db = await readDB();
  const clean = receiptNumber.trim().toLowerCase();
  return db.receipts.find((r) => r.receiptNumber.toLowerCase() === clean) || null;
}

export async function getStudentReceipts(studentId: string): Promise<Receipt[]> {
  const db = await readDB();
  return db.receipts
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Issue / Create Receipt Workflow
export interface CreateReceiptInput {
  studentId: string;
  amountPaid: number;
  paymentMethod: "Bank Transfer" | "Bank Deposit" | "POS" | "Cash";
  bankReference?: string;
  items: ReceiptItem[];
  notes?: string;
}

export async function createReceipt(input: CreateReceiptInput): Promise<Receipt> {
  const db = await readDB();
  const student = db.students.find((s) => s.id === input.studentId);
  if (!student) {
    throw new Error("Student not found");
  }

  const prevTotalPaid = student.totalPaid || 0;
  const newTotalPaid = prevTotalPaid + input.amountPaid;
  const newBalanceRemaining = Math.max(0, student.totalTermBill - newTotalPaid);
  const paymentStatus: "FULL" | "PARTIAL" = newBalanceRemaining === 0 ? "FULL" : "PARTIAL";

  // Generate unique sequential receipt number
  const count = db.receipts.length + 1;
  const padded = String(count).padStart(4, "0");
  const year = new Date().getFullYear();
  const receiptNumber = `AFIC-RCP-${year}-${padded}`;

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Generate QR Code for Gate and Audit Clearance
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

  const newReceipt: Receipt = {
    id: "rcpt_" + Date.now(),
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
    items: input.items && input.items.length > 0 ? input.items : [{ name: "Tuition / School Fees", category: "Tuition", amount: input.amountPaid }],
    term: db.school.currentTerm,
    session: db.school.currentSession,
    date: formattedDate,
    timestamp: now.toISOString(),
    issuedBy: db.school.bursarName,
    qrCodeDataUrl,
    securityHash: `AFIC-HASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    notes: input.notes?.trim() || `${paymentStatus === "FULL" ? "Full payment cleared" : "Partial payment recorded"}. Verified by Bursary.`,
  };

  // Update student ledger
  student.totalPaid = newTotalPaid;
  student.balanceRemaining = newBalanceRemaining;
  student.status = newBalanceRemaining === 0 ? "FULL" : "PARTIAL";
  student.lastPaymentDate = now.toISOString().split("T")[0];

  db.receipts.unshift(newReceipt);
  await writeDB(db);

  return newReceipt;
}

// Termly & Monthly Debtor & Collection Reports
export async function getReportData(term?: string, month?: string, classFilter?: string, statusFilter?: string) {
  const db = await readDB();
  let students = db.students;

  if (classFilter && classFilter !== "ALL") {
    students = students.filter((s) => s.class.toLowerCase().includes(classFilter.toLowerCase()));
  }

  if (statusFilter && statusFilter !== "ALL") {
    students = students.filter((s) => s.status === statusFilter);
  }

  const totalStudents = students.length;
  const expectedRevenue = students.reduce((sum, s) => sum + s.totalTermBill, 0);
  const collectedRevenue = students.reduce((sum, s) => sum + s.totalPaid, 0);
  const outstandingDebt = students.reduce((sum, s) => sum + s.balanceRemaining, 0);
  const collectionRate = expectedRevenue > 0 ? Math.round((collectedRevenue / expectedRevenue) * 100) : 0;

  const fullPaymentCount = students.filter((s) => s.status === "FULL").length;
  const partialPaymentCount = students.filter((s) => s.status === "PARTIAL").length;
  const unpaidCount = students.filter((s) => s.status === "UNPAID").length;

  const summary: ReportSummary = {
    period: term || db.school.currentTerm,
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
    students,
    school: db.school,
  };
}

// School Profile Queries
export async function getSchoolProfile(): Promise<SchoolProfile> {
  const db = await readDB();
  return db.school;
}

export async function updateSchoolProfile(updates: Partial<SchoolProfile>): Promise<SchoolProfile> {
  const db = await readDB();
  db.school = { ...db.school, ...updates };
  await writeDB(db);
  return db.school;
}

// Student Creation & Bulk Import
export async function createStudent(input: any): Promise<Student> {
  const db = await readDB();
  
  let regNumber = input.regNumber?.trim();
  if (!regNumber) {
    const year = new Date().getFullYear();
    const count = db.students.length + 1;
    regNumber = `AFIC/${year}/${String(count + 100).padStart(4, "0")}`;
  }

  const totalBill = Number(input.totalTermBill) || 165000;

  const newStudent: Student = {
    id: "std_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
    regNumber,
    fullName: input.fullName.trim(),
    class: input.class.trim(),
    gender: input.gender || "Male",
    parentName: input.parentName.trim(),
    parentPhone: input.parentPhone.trim(),
    parentEmail: input.parentEmail?.trim(),
    totalTermBill: totalBill,
    totalPaid: 0,
    balanceRemaining: totalBill,
    status: "UNPAID",
    createdAt: new Date().toISOString().split("T")[0],
  };

  db.students.unshift(newStudent);
  await writeDB(db);
  return newStudent;
}

export async function importStudentsBulk(studentsList: any[]): Promise<Student[]> {
  const db = await readDB();
  const created: Student[] = [];
  const year = new Date().getFullYear();

  for (let i = 0; i < studentsList.length; i++) {
    const s = studentsList[i];
    if (!s.fullName?.trim()) continue;

    const count = db.students.length + 1;
    const regNumber = s.regNumber?.trim() || `AFIC/${year}/${String(count + 100).padStart(4, "0")}`;
    const totalBill = Number(s.totalTermBill) || 165000;

    const newStudent: Student = {
      id: "std_" + Date.now() + "_" + i + "_" + Math.random().toString(36).substring(2, 5),
      regNumber,
      fullName: s.fullName.trim(),
      class: s.class?.trim() || "JSS 1",
      gender: s.gender || "Male",
      parentName: s.parentName?.trim() || "Parent/Guardian",
      parentPhone: s.parentPhone?.trim() || "08000000000",
      parentEmail: s.parentEmail?.trim(),
      totalTermBill: totalBill,
      totalPaid: 0,
      balanceRemaining: totalBill,
      status: "UNPAID",
      createdAt: new Date().toISOString().split("T")[0],
    };

    db.students.unshift(newStudent);
    created.push(newStudent);
  }

  await writeDB(db);
  return created;
}

// Receipt Void / Cancellation
export async function voidReceipt(receiptId: string, reason: string, voidedBy?: string): Promise<Receipt> {
  const db = await readDB();
  const receipt = db.receipts.find((r) => r.id === receiptId);
  if (!receipt) {
    throw new Error("Receipt not found");
  }

  if (receipt.isVoided) {
    throw new Error("This receipt is already voided.");
  }

  receipt.isVoided = true;
  receipt.voidReason = reason.trim();
  receipt.voidedAt = new Date().toISOString();
  receipt.voidedBy = voidedBy || db.school.bursarName;

  // Re-adjust student ledger
  const student = db.students.find((s) => s.id === receipt.studentId);
  if (student) {
    const validReceipts = db.receipts.filter(
      (r) => r.studentId === student.id && !r.isVoided
    );
    const newTotalPaid = validReceipts.reduce((sum, r) => sum + r.amountPaid, 0);
    student.totalPaid = newTotalPaid;
    student.balanceRemaining = Math.max(0, student.totalTermBill - newTotalPaid);
    student.status = student.balanceRemaining === 0 ? "FULL" : newTotalPaid > 0 ? "PARTIAL" : "UNPAID";
  }

  await writeDB(db);
  return receipt;
}

export type PaymentStatus = "FULL" | "PARTIAL" | "UNPAID";

export type FeeCategory =
  | "Tuition"
  | "Books"
  | "Uniform"
  | "PTA"
  | "Transport"
  | "Excursion"
  | "Development"
  | "Other";

export interface FeeItem {
  id: string;
  name: string;
  category: FeeCategory;
  amount: number;
}

export interface Student {
  id: string;
  regNumber: string; // e.g. AFIC/2026/001
  fullName: string;
  class: string; // e.g. JSS 1 Diamond, SS 2 Science
  gender: "Male" | "Female";
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  totalTermBill: number; // e.g. 180,000
  totalPaid: number;
  balanceRemaining: number;
  status: PaymentStatus;
  lastPaymentDate?: string;
  createdAt: string;
}

export interface CreateStudentInput {
  fullName: string;
  regNumber?: string;
  class: string;
  gender: "Male" | "Female";
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  totalTermBill: number;
}

export interface ReceiptItem {
  name: string;
  category: FeeCategory;
  amount: number;
  description?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. AFIC-RCP-2026-0041
  studentId: string;
  regNumber: string;
  studentName: string;
  studentClass: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  amountPaid: number;
  totalTermBill: number;
  previousTotalPaid: number;
  newTotalPaid: number;
  balanceRemaining: number;
  paymentStatus: "FULL" | "PARTIAL"; // Full payment or part payment
  paymentMethod: "Bank Transfer" | "Bank Deposit" | "POS" | "Cash";
  bankReference?: string;
  items: ReceiptItem[];
  term: string; // e.g. 1st Term
  session: string; // e.g. 2026/2027
  date: string; // formatted date string
  timestamp: string; // ISO date string
  issuedBy: string;
  qrCodeDataUrl?: string;
  securityHash: string;
  notes?: string;
  isVoided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
}

export interface SchoolProfile {
  name: string;
  shortName: string;
  motto: string;
  address: string;
  email: string;
  phone: string;
  currentTerm: string;
  currentSession: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bursarName: string;
  logoUrl?: string;
  bursarPin?: string;
}

export interface ReportSummary {
  period: string; // e.g. "1st Term 2026/2027" or "September 2026"
  totalStudents: number;
  expectedRevenue: number;
  collectedRevenue: number;
  outstandingDebt: number;
  collectionRate: number; // percentage
  fullPaymentCount: number;
  partialPaymentCount: number;
  unpaidCount: number;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "Bursar" | "Admin" | "Cashier";
  pin: string;
  password?: string;
  title: string;
  avatar?: string;
}

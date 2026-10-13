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
  regNumber: string; // e.g. P453, N1636, JS201
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
  isRepeating?: boolean;
  lastPaymentDate?: string;
  paymentBank?: string; // e.g. "GTBank", "Jaiz Bank"
  paidBanks?: string[]; // All banks student has paid to
  lastReceiptNumber?: string;
  createdAt: string;
}

export interface CreateStudentInput {
  fullName: string;
  regNumber?: string;
  class: string;
  gender: "Male" | "Female";
  isRepeating?: boolean;
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
  receiptNumber: string; // e.g. AIA-RCP-2026-0041
  studentId?: string | null;
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
  bankName?: string; // e.g. "Jaiz Bank", "GTBank", "Zenith Bank"
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

export interface BankAccountConfig {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
}

export interface ClassFeeConfig {
  classLevel: string; // e.g. "Basic 1", "JSS 1", "SS 1"
  tuitionFee: number;
  booksFee: number; // Notebook / Textbooks
  uniformFee: number;
  sportsWearFee: number; // Sport Wears
  ptaLevy?: number; // legacy optional
  developmentLevy?: number;
  totalBill: number;
}

export interface FeeScheduleHistoryEntry {
  id: string;
  session: string; // e.g. "2026/2027 Academic Session"
  term: string; // e.g. "1st Term"
  updatedAt: string; // ISO date string
  updatedBy: string; // Accountant/Admin name
  notes?: string;
  schedule: ClassFeeConfig[];
  summaryText?: string;
}

export interface ConcessionCategoryConfig {
  preNurseryNurseryPb: number;
  basic: number;
  jss1_2: number;
  jss3: number;
  ss1: number;
  ss2_3: number;
  dualSrYr: number;
  adf: number;
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
  accountantName: string;
  accountantPin?: string;
  logoUrl?: string;
  bankAccounts?: BankAccountConfig[];
  receiptPrefix?: string;
  receiptFooterNote?: string;
  defaultReceiptFormat?: "traditional" | "statement";
  showStamp?: boolean;
  feeStructure?: ClassFeeConfig[];
  feeScheduleHistory?: FeeScheduleHistoryEntry[];
  concessions?: ConcessionCategoryConfig;
}

export interface BankReconciliationItem {
  bankName: string;
  totalAmount: number;
  receiptCount: number;
  percentage: number;
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
  filteredBank?: string;
  filteredClass?: string;
  bankReconciliation?: BankReconciliationItem[];
  bankSpecificCollection?: number;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "Accountant" | "Admin" | "Cashier";
  pin: string;
  password?: string;
  title: string;
  avatar?: string;
}

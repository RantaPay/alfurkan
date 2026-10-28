import {
  DEFAULT_CONCESSIONS
} from "@/lib/student-importer";
import {
  BankAccountConfig,
  ClassFeeConfig,
  SchoolProfile,
  StaffUser
} from "@/lib/types";

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

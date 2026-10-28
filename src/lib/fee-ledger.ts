import type { PaymentStatus } from "./types";

export const PAYMENT_PERIODS = ["1st Term", "2nd Term", "3rd Term", "Whole Session"] as const;
export type PaymentPeriod = (typeof PAYMENT_PERIODS)[number];
export function isPaymentPeriod(value: unknown): value is PaymentPeriod {
  return typeof value === "string" && PAYMENT_PERIODS.includes(value as PaymentPeriod);
}

export const ACCOUNT_FEE_CATEGORIES = ["Tuition", "Books", "Uniform", "PTA"] as const;
export type AccountFeeCategory = (typeof ACCOUNT_FEE_CATEGORIES)[number];
export type FeeAmounts = Record<AccountFeeCategory, number>;
type PaymentItem = { category: string; amount: number };

export function addFeePayments(paid: Partial<FeeAmounts>, items: PaymentItem[]): FeeAmounts {
  const amounts: FeeAmounts = { Tuition: 0, Books: 0, Uniform: 0, PTA: 0, ...paid };
  for (const item of items) {
    if (ACCOUNT_FEE_CATEGORIES.includes(item.category as AccountFeeCategory)) {
      const category = item.category as AccountFeeCategory;
      amounts[category] = Math.round((amounts[category] + Number(item.amount)) * 100) / 100;
    }
  }
  return amounts;
}

/** Itemless historical receipts were issued as tuition payments. */
export function sumFeePayments(receipts: {
  amountPaid: number;
  isVoided?: boolean;
  items?: PaymentItem[];
}[]): FeeAmounts {
  return receipts.reduce((paid, receipt) => receipt.isVoided ? paid : addFeePayments(
    paid,
    receipt.items?.length ? receipt.items : [{ category: "Tuition", amount: receipt.amountPaid }]
  ), { Tuition: 0, Books: 0, Uniform: 0, PTA: 0 });
}

/** Surplus in one fee category never settles another category's balance. */
export function calculateFeeBalance(obligations: FeeAmounts, paid: Partial<FeeAmounts>) {
  const balances = {} as FeeAmounts;
  let totalBill = 0;
  let totalPaid = 0;
  for (const category of ACCOUNT_FEE_CATEGORIES) {
    const due = Math.max(0, Math.round(obligations[category] * 100));
    const received = Math.max(0, Math.round((paid[category] || 0) * 100));
    balances[category] = Math.max(0, due - received) / 100;
    totalBill += due;
    totalPaid += Math.min(due, received);
  }
  const balanceRemaining = (totalBill - totalPaid) / 100;
  const status: PaymentStatus = totalBill === 0 ? "UNPAID"
    : balanceRemaining === 0 ? "FULL" : totalPaid > 0 ? "PARTIAL" : "UNPAID";
  return { totalBill: totalBill / 100, totalPaid: totalPaid / 100, balanceRemaining, balances, status };
}

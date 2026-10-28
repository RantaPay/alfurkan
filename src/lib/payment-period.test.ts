import { test } from "node:test";
import assert from "node:assert/strict";
import { allocatePeriodItems, calculatePeriodFeeBalance, isTermPeriod } from "./payment-period";
import { isPaymentPeriod } from "./fee-ledger";
import type { ReceiptItem } from "./types";

const due = { Tuition: 30000, Books: 27000, Uniform: 18000, PTA: 0 };
const tuitionOnly = { Tuition: 30000, Books: 0, Uniform: 0, PTA: 0 };
const tuition = (amount: number): ReceiptItem => ({ name: "Tuition / School Fees", category: "Tuition", amount });
const receipt = (term: string, items: ReceiptItem[], isVoided = false) => ({ term, items, isVoided, amountPaid: items.reduce((sum, item) => sum + item.amount, 0) });

test("second-term advance payment leaves first-term tuition unpaid", () => {
  const items = allocatePeriodItems([tuition(30000)], "2nd Term", "1st Term", due, []);
  const history = [receipt("2nd Term", items)];
  assert.equal(calculatePeriodFeeBalance(due, history, "1st Term", "1st Term").balances.Tuition, 30000);
  assert.equal(calculatePeriodFeeBalance(due, history, "2nd Term", "1st Term").balances.Tuition, 0);
});

test("whole session uses three tuition bills and counts materials only once", () => {
  const items = allocatePeriodItems([tuition(90000), { name: "Books", category: "Books", amount: 27000 }, { name: "Uniform", category: "Uniform", amount: 18000 }], "Whole Session", "1st Term", due, []);
  const history = [receipt("Whole Session", items)];
  const ledger = calculatePeriodFeeBalance(due, history, "Whole Session", "1st Term");
  assert.equal(ledger.totalBill, 135000);
  assert.equal(ledger.balanceRemaining, 0);
  assert.equal(ledger.status, "FULL");
  for (const term of ["1st Term", "2nd Term", "3rd Term"] as const) {
    assert.equal(calculatePeriodFeeBalance(due, history, term, "1st Term").balances.Tuition, 0);
  }
  assert.equal(items.reduce((sum, item) => sum + item.amount, 0), 135000);
});

test("annual installments settle outstanding terms in order", () => {
  const items = allocatePeriodItems([tuition(45000)], "Whole Session", "1st Term", tuitionOnly, []);
  assert.deepEqual(items.map(({ amount, paymentTerm }) => ({ amount, paymentTerm })), [
    { amount: 30000, paymentTerm: "1st Term" }, { amount: 15000, paymentTerm: "2nd Term" },
  ]);
  const ledger = calculatePeriodFeeBalance(tuitionOnly, [receipt("Whole Session", items)], "Whole Session", "1st Term");
  assert.equal(ledger.balanceRemaining, 45000);
  assert.equal(ledger.status, "PARTIAL");
});

test("annual allocation skips an already paid second term", () => {
  const history = [receipt("2nd Term", [tuition(30000)])];
  const items = allocatePeriodItems([tuition(60000)], "Whole Session", "1st Term", tuitionOnly, history);
  assert.deepEqual(items.map((item) => item.paymentTerm), ["1st Term", "3rd Term"]);
  assert.equal(calculatePeriodFeeBalance(tuitionOnly, [...history, receipt("Whole Session", items)], "Whole Session", "1st Term").status, "FULL");
});

test("voiding an annual receipt reopens the term balances it settled", () => {
  const items = allocatePeriodItems([tuition(90000)], "Whole Session", "1st Term", tuitionOnly, []);
  const voided = receipt("Whole Session", items, true);
  assert.equal(calculatePeriodFeeBalance(tuitionOnly, [voided], "2nd Term", "1st Term").balances.Tuition, 30000);
});

test("overpaying a single term cannot clear another term", () => {
  const history = [receipt("1st Term", [tuition(90000)])];
  const ledger = calculatePeriodFeeBalance(tuitionOnly, history, "Whole Session", "1st Term");
  assert.equal(ledger.balanceRemaining, 60000);
});

test("an annual surplus remains recorded without multiplying money received", () => {
  const items = allocatePeriodItems([tuition(100000)], "Whole Session", "1st Term", tuitionOnly, []);
  assert.equal(items.reduce((sum, item) => sum + item.amount, 0), 100000);
  assert.equal(calculatePeriodFeeBalance(tuitionOnly, [receipt("Whole Session", items)], "Whole Session", "1st Term").totalPaid, 90000);
});

test("multiple annual tuition lines do not reuse the same outstanding balance", () => {
  const items = allocatePeriodItems([tuition(16500), tuition(16500)], "Whole Session", "1st Term", tuitionOnly, []);
  const ledger = calculatePeriodFeeBalance(tuitionOnly, [receipt("Whole Session", items)], "2nd Term", "1st Term");
  assert.equal(ledger.balances.Tuition, 27000);
});

test("legacy receipt lines inherit their receipt period and retain void status", () => {
  assert.equal(calculatePeriodFeeBalance(tuitionOnly, [receipt("2nd Term", [tuition(16500)])], "2nd Term", "1st Term").balances.Tuition, 13500);
  assert.equal(calculatePeriodFeeBalance(tuitionOnly, [{ term: "3rd Term", amountPaid: 30000, items: [] }], "3rd Term", "1st Term").status, "FULL");
});

test("payment periods reject arbitrary values", () => {
  assert.equal(isPaymentPeriod("Whole Session"), true);
  assert.equal(isTermPeriod("Whole Session"), false);
  for (const value of ["4th Term", "", null, 1]) assert.equal(isPaymentPeriod(value), false);
});

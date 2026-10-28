import { test } from "node:test";
import assert from "node:assert/strict";
import { addFeePayments, calculateFeeBalance, sumFeePayments } from "./fee-ledger";
import { getStudentFeeObligations } from "./student-importer";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReceiptDocument } from "../components/receipts/ReceiptDocument";
import type { Receipt } from "./types";
import { allocatePeriodItems, calculatePeriodFeeBalance } from "./payment-period";

const schedule = [{ classLevel: "JSS 1", tuitionFee: 60000, booksFee: 27000, uniformFee: 18000, sportsWearFee: 0, totalBill: 105000 }];
const maryamBill = () => getStudentFeeObligations("Maryam Ishaq Eniola (SR)", "JSS 1 A", schedule, { jss1_2: 30000 }, 30000);
const payment = [
  { category: "Books", amount: 19000 },
  { category: "Books", amount: 8000 },
  { category: "Uniform", amount: 18000 },
  { category: "Tuition", amount: 16500 },
  { category: "Other", amount: 2500 },
];

test("Maryam's mixed ₦64,000 receipt leaves ₦13,500 of school fees unpaid", () => {
  const obligations = maryamBill();
  const ledger = calculateFeeBalance(obligations, addFeePayments({}, payment));
  assert.equal(payment.reduce((sum, item) => sum + item.amount, 0), 64000);
  assert.equal(obligations.Tuition, 30000);
  assert.equal(ledger.balances.Tuition, 13500);
  assert.equal(ledger.balanceRemaining, 13500);
  assert.equal(ledger.totalPaid, 61500);
  assert.equal(ledger.status, "PARTIAL");
});

test("overpaying books and uniform never settles unpaid tuition", () => {
  const paid = addFeePayments({}, [{ category: "Books", amount: 200000 }, { category: "Uniform", amount: 200000 }]);
  const ledger = calculateFeeBalance(maryamBill(), paid);
  assert.equal(ledger.balances.Tuition, 30000);
  assert.equal(ledger.status, "PARTIAL");
});

test("prior-term debt and miscellaneous payments do not reduce current fee balances", () => {
  const ledger = calculateFeeBalance(maryamBill(), addFeePayments({}, [{ category: "Other", amount: 100000 }]));
  assert.equal(ledger.totalPaid, 0);
  assert.equal(ledger.balances.Tuition, 30000);
  assert.equal(ledger.status, "UNPAID");
});

test("later tuition installments settle only the remaining tuition balance", () => {
  const paid = addFeePayments(addFeePayments({}, payment), [{ category: "Tuition", amount: 13500 }]);
  const ledger = calculateFeeBalance(maryamBill(), paid);
  assert.equal(ledger.status, "FULL");
  assert.equal(ledger.balanceRemaining, 0);
});

test("voided payments are excluded when rebuilding fee balances", () => {
  const paid = sumFeePayments([
    { amountPaid: 64000, items: payment },
    { amountPaid: 13500, items: [{ category: "Tuition", amount: 13500 }], isVoided: true },
  ]);
  assert.equal(calculateFeeBalance(maryamBill(), paid).balanceRemaining, 13500);
});

test("historical itemless payments retain their tuition allocation", () => {
  const paid = sumFeePayments([{ amountPaid: 5000, items: [] }]);
  const ledger = calculateFeeBalance(maryamBill(), addFeePayments(paid, payment));
  assert.equal(ledger.balances.Tuition, 8500);
});

test("regular students retain a manually adjusted total bill", () => {
  const due = getStudentFeeObligations("Regular Student", "JSS 1 A", schedule, undefined, 100000);
  assert.equal(due.Tuition, 55000);
  assert.equal(calculateFeeBalance(due, {}).totalBill, 100000);
});

test("ADF rates retain their configured exemption or amount", () => {
  assert.equal(calculateFeeBalance(getStudentFeeObligations("Student (ADF)", "JSS 1 A", schedule), {}).totalBill, 0);
  assert.equal(getStudentFeeObligations("Student (ADF)", "JSS 1 A", schedule, { adf: 1000 }).Tuition, 1000);
});

test("payment arithmetic rounds to kobo and cannot leave floating point debt", () => {
  const paid = addFeePayments({}, [{ category: "Tuition", amount: 0.1 }, { category: "Tuition", amount: 0.2 }]);
  assert.equal(calculateFeeBalance({ Tuition: 0.3, Books: 0, Uniform: 0, PTA: 0 }, paid).balanceRemaining, 0);
});

for (const format of ["thermal", "traditional", "statement"] as const) {
  test(`${format} receipt displays tuition payment and remaining balance separately`, () => {
    const receipt: Receipt = {
      id: "test", receiptNumber: "2026-27/0001", studentId: "maryam", regNumber: "TEST-1",
      studentName: "Maryam Ishaq Eniola (SR)", studentClass: "JSS 1 A", parentName: "Parent", parentPhone: "",
      amountPaid: 64000, totalTermBill: 75000, previousTotalPaid: 0, newTotalPaid: 61500,
      balanceRemaining: 13500, paymentStatus: "PARTIAL", paymentMethod: "Cash", term: "1st Term",
      session: "2026/2027 Session", date: "28 Oct 2026", timestamp: "2026-10-28T12:00:00Z",
      issuedBy: "Accountant", securityHash: "test",
      items: [
        { name: "Tuition / School Fees", category: "Tuition", amount: 16500, chargeAmount: 30000, chargeBalance: 13500 },
        { name: "3T Debt (Previous Term)", category: "Other", amount: 2500 },
      ],
    };
    const html = renderToStaticMarkup(createElement(ReceiptDocument, { receipt, selectedFormat: format }));
    assert.match(html, /16,500/);
    assert.match(html, /30,000/);
    assert.match(html, /13,500/);
    assert.match(html, /3T Debt/);
    assert.doesNotMatch(html, /PAID IN FULL \(CLEARED\)|NIL \/ CLEARED|Full Settlement of/);
  });
}

test("annual receipts identify the allocated term on all three print formats", () => {
  const obligations = { Tuition: 30000, Books: 0, Uniform: 0, PTA: 0 };
  const allocated = allocatePeriodItems([{ name: "Tuition / School Fees", category: "Tuition", amount: 90000 }], "Whole Session", "1st Term", obligations, []);
  const ledger = calculatePeriodFeeBalance(obligations, [{ term: "Whole Session", amountPaid: 90000, items: allocated }], "Whole Session", "1st Term");
  const receipt: Receipt = {
    id: "annual", receiptNumber: "2026-27/0002", studentId: "student", regNumber: "TEST-2",
    studentName: "Student", studentClass: "JSS 1 A", parentName: "Parent", parentPhone: "",
    amountPaid: 90000, totalTermBill: ledger.totalBill, previousTotalPaid: 0, newTotalPaid: ledger.totalPaid,
    balanceRemaining: ledger.balanceRemaining, paymentStatus: "FULL", paymentMethod: "Cash", term: "Whole Session",
    session: "2026/2027 Session", date: "28 Oct 2026", timestamp: "2026-10-28T12:00:00Z",
    issuedBy: "Accountant", securityHash: "test", items: allocated,
  };
  for (const format of ["thermal", "traditional", "statement"] as const) {
    const html = renderToStaticMarkup(createElement(ReceiptDocument, { receipt, selectedFormat: format }));
    for (const term of ["1st Term", "2nd Term", "3rd Term"]) assert.ok(html.includes(term), `${format}: missing ${term}`);
    assert.match(html, /90,000/);
    assert.match(html, /Whole Session/);
  }
});

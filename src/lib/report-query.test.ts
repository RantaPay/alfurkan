import assert from "node:assert/strict";
import test from "node:test";
import { splitClassName } from "./class-placement";
import { buildAccountReport, canonicalFeeName, type ReportStudentSource } from "./report-query";

const school = {
  currentTerm: "1st Term",
  currentSession: "2026/2027 Session",
  feeStructure: [{ classLevel: "JSS 1", tuitionFee: 30000, booksFee: 8000, uniformFee: 5000, sportsWearFee: 2000, totalBill: 45000 }],
  concessions: { jss1_2: 30000 },
  bankAccounts: [{ id: "1", bankName: "Jaiz Bank", accountNumber: "1", accountName: "School" }],
};

function student(overrides: Partial<ReportStudentSource> & Pick<ReportStudentSource, "id" | "className">): ReportStudentSource {
  return {
    regNumber: overrides.id,
    fullName: "Amina Bello",
    parentName: "Parent",
    parentPhone: "08000000000",
    totalTermBill: 45000,
    receipts: [],
    ...overrides,
  };
}

test("class levels and arms do not swallow a neighbouring class", () => {
  assert.deepEqual(splitClassName("JSS 1 A"), { level: "JSS 1", arm: "A" });
  assert.deepEqual(splitClassName("SS 1 Science"), { level: "SS 1", arm: "Science" });
  assert.notEqual(splitClassName("SS 10 A").level, "SS 1");
  assert.equal(canonicalFeeName({ name: "Sport Wears", category: "PTA" }), "Sport Wears");
  assert.equal(canonicalFeeName({ name: "AHIS fees", category: "Other" }), "AHIS");
  assert.equal(canonicalFeeName({ name: "ahis", category: "Other" }), "AHIS");
  assert.equal(canonicalFeeName({ name: "Badge fee", category: "Other" }), "Badge fee");
  assert.equal(canonicalFeeName({ name: "WAEC SSCE", category: "Other" }), "WAEC SSCE");
  assert.equal(canonicalFeeName({ name: "neco ssce", category: "Other" }), "NECO SSCE");
  assert.equal(canonicalFeeName({ name: "BABECE", category: "Other" }), "BABECE");
  assert.equal(canonicalFeeName({ name: "BECE exam", category: "Other" }), "BECE");
});

test("report filters class, arm, fee, bank, and dates, and keeps the receipt link", () => {
  const rows = [
    student({
      id: "a",
      className: "JSS 1 A",
      receipts: [{
        id: "r1", receiptNumber: "2026-27/0001", amountPaid: 27000, date: "15 Jan 2026",
        term: "1st Term", session: "2026/2027 Session", paymentMethod: "Bank Transfer", bankName: "Jaiz Bank",
        items: [
          { name: "Textbooks", category: "Books", amount: 8000, paymentTerm: "1st Term" },
          { name: "School Uniform", category: "Uniform", amount: 5000, paymentTerm: "1st Term" },
          { name: "Tuition / School Fees", category: "Tuition", amount: 14000, paymentTerm: "1st Term" },
        ],
      }],
    }),
    student({
      id: "b",
      fullName: "Bola Kane",
      className: "JSS 1 B",
      receipts: [{
        id: "r2", receiptNumber: "2026-27/0002", amountPaid: 5000, date: "20 Feb 2026",
        term: "1st Term", session: "2026/2027 Session", paymentMethod: "Cash", bankName: "",
        items: [{ name: "Sport Wears", category: "PTA", amount: 5000, paymentTerm: "1st Term" }],
      }],
    }),
    student({ id: "c", fullName: "Chidi Okon", className: "JSS 2 A", receipts: [] }),
  ];

  const byArm = buildAccountReport(rows, school, { classLevel: "JSS 1", arm: "A" });
  assert.deepEqual(byArm.rows.map((row) => row.id), ["a"]);
  assert.equal(byArm.rows[0].receipts[0].id, "r1");

  const books = buildAccountReport(rows, school, { fee: "Textbooks", from: "2026-01-01", to: "2026-01-31" });
  assert.deepEqual(books.rows.map((row) => row.id), ["a"]);
  assert.equal(books.rows[0].receivedAmount, 8000);
  assert.equal(books.summary.collectedRevenue, 8000);

  const cash = buildAccountReport(rows, school, { bank: "Cash" });
  assert.deepEqual(cash.rows.map((row) => row.id), ["b"]);
  assert.equal(cash.rows[0].receipts[0].receiptNumber, "2026-27/0002");

  const jaiz = buildAccountReport(rows, school, { bank: "Jaiz" });
  assert.equal(jaiz.rows.length, 0);

  const exactBank = buildAccountReport(rows, school, { bank: "Jaiz Bank" });
  assert.deepEqual(exactBank.rows.map((row) => row.id), ["a"]);
  assert.ok(exactBank.summary.bankReconciliation?.some((bank) => bank.bankName === "Cash"));
});

test("a whole-session receipt contributes only the selected term", () => {
  const annual = student({
    id: "annual",
    className: "JSS 1 A",
    receipts: [{
      id: "r3", receiptNumber: "2026-27/0009", amountPaid: 90000, date: "2 Oct 2026",
      term: "Whole Session", session: "2026/2027 Session", paymentMethod: "Bank Transfer", bankName: "Jaiz Bank",
      items: [
        { name: "Tuition / School Fees", category: "Tuition", amount: 30000, paymentTerm: "1st Term" },
        { name: "Tuition / School Fees", category: "Tuition", amount: 30000, paymentTerm: "2nd Term" },
        { name: "Tuition / School Fees", category: "Tuition", amount: 30000, paymentTerm: "3rd Term" },
      ],
    }],
  });
  const second = buildAccountReport([annual], school, { term: "2nd Term" });
  assert.equal(second.rows[0].receivedAmount, 30000);
  assert.equal(second.rows[0].receipts[0].id, "r3");
});

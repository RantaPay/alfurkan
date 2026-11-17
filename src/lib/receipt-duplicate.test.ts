import assert from "node:assert/strict";
import test from "node:test";
import { findMatchingReceipt, type DuplicateCandidate } from "./receipt-duplicate";
import { classifySyncResult, shouldUseSnapshot } from "./offline/sync-result";

const payment: DuplicateCandidate = {
  id: "online",
  receiptNumber: "2026-27/0109",
  studentName: "Maryam Ishaq",
  regNumber: "AF-1",
  amountPaid: 16500,
  date: "12 Nov 2026",
  term: "1st Term",
  session: "2026/2027",
  items: [{ name: "Tuition / School Fees" }],
};

test("the same offline payment matches the receipt already saved online", () => {
  const match = findMatchingReceipt([payment], {
    studentName: "maryam ishaq",
    regNumber: "af-1",
    amountPaid: 16500,
    date: "12 Nov 2026",
    term: "1st Term",
    session: "2026/2027",
    items: [{ name: "Tuition / School Fees" }],
  });
  assert.equal(match?.receiptNumber, "2026-27/0109");
});

test("the same student and amount on another payment date is not a duplicate", () => {
  const saved: DuplicateCandidate = {
    ...payment,
    receiptNumber: "2026-27/0478",
    date: "28 Sept 2026",
    timestamp: "2026-11-16T12:00:00.000Z",
    amountPaid: 41250,
  };
  const nextPayment = {
    studentName: saved.studentName,
    regNumber: saved.regNumber,
    amountPaid: 41250,
    term: "1st Term",
    session: "2026/2027",
    items: [{ name: "Tuition / School Fees" }],
  };
  assert.equal(findMatchingReceipt([saved], { ...nextPayment, date: "2026-11-16" }), null);
  assert.equal(findMatchingReceipt([saved], { ...nextPayment, date: "16 Nov 2026" }), null);
  assert.equal(findMatchingReceipt([saved], { ...nextPayment, date: "2026-09-28" })?.receiptNumber, "2026-27/0478");
  assert.equal(findMatchingReceipt([saved], { ...nextPayment, date: "28 Sep 2026" })?.receiptNumber, "2026-27/0478");
});

test("a different amount, a voided receipt, and a different fee are not the same payment", () => {
  const query = {
    regNumber: "AF-1",
    amountPaid: 16500,
    date: "12 Nov 2026",
    term: "1st Term",
    session: "2026/2027",
    items: [{ name: "Tuition / School Fees" }],
  };
  assert.equal(findMatchingReceipt([{ ...payment, amountPaid: 10000 }], query), null);
  assert.equal(findMatchingReceipt([{ ...payment, isVoided: true }], query), null);
  assert.equal(findMatchingReceipt([{ ...payment, items: [{ name: "Textbooks" }] }], query), null);
});

test("sync answers keep a real payment and hold a duplicate", () => {
  assert.equal(classifySyncResult({ ok: true }), "synced");
  assert.equal(classifySyncResult({ ok: true, reprint: true }), "reprint");
  assert.equal(classifySyncResult({ ok: false, code: "DUPLICATE" }), "needs_decision");
  assert.equal(classifySyncResult({ ok: false, code: "STUDENT_MISSING" }), "needs_decision");
  assert.equal(classifySyncResult({ ok: false, code: "SYNC_UNAVAILABLE" }), "waiting");
  assert.equal(shouldUseSnapshot(new TypeError("Failed to fetch"), true), true);
  assert.equal(shouldUseSnapshot(new Error("Unable to load records"), true), false);
  assert.equal(shouldUseSnapshot(new Error("offline"), false), true);
});

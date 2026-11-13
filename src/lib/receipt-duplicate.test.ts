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

import assert from "node:assert/strict";
import test from "node:test";
import { buildReceiptNarration, previousTermContext, shiftSession } from "./receipt-narration";

test("first term debt names the previous session's third term", () => {
  assert.deepEqual(previousTermContext("1st Term", "2026/2027 Session"), {
    term: "3rd Term",
    session: "2025/2026",
  });
  assert.equal(shiftSession("2026/27", 1), "2025/26");
});

test("second and third term debt stay in the same session", () => {
  assert.deepEqual(previousTermContext("2nd Term", "2026/2027"), { term: "1st Term", session: "2026/2027" });
  assert.deepEqual(previousTermContext("3rd Term", "2026/2027 Session"), { term: "2nd Term", session: "2026/2027" });
});

test("narration separates school fees, other items, and previous-term debt", () => {
  const narration = buildReceiptNarration({
    currentTerm: "1st Term",
    session: "2026/2027 Session",
    hasStudent: true,
    items: [
      { name: "Tuition / School Fees", category: "Tuition", amount: 16500, chargeBalance: 13500 },
      { name: "Textbooks", category: "Books", amount: 19000, chargeBalance: 0 },
      { name: "School Uniform", category: "Uniform", amount: 18000, chargeBalance: 0 },
      { name: "3T Debt (Previous Term)", category: "Other", amount: 2500 },
    ],
  });
  assert.equal(narration, "part payment of school fees, payment of Textbooks, payment of School Uniform, payment of 3rd Term 2025/2026");
});

test("cleared school fees and a single other item stay specific", () => {
  const narration = buildReceiptNarration({
    currentTerm: "2nd Term",
    session: "2026/2027",
    hasStudent: true,
    items: [
      { name: "Tuition / School Fees", category: "Tuition", amount: 30000, chargeBalance: 0 },
      { name: "Sport Wears", category: "PTA", amount: 5000, chargeBalance: 0 },
      { name: "Previous Term Debt", category: "Other", amount: 1000 },
    ],
  });
  assert.equal(narration, "full payment of school fees, payment of Sport Wears, payment of 1st Term 2026/2027");
});

import assert from "node:assert/strict";
import test from "node:test";
import { currentPath, queryMatches, queryString, receiptHref, returnLabel, safeReturnPath } from "./return-path";

test("receipt links remember the page that opened them", () => {
  const href = receiptHref("receipt-1", "/students?q=maryam&class=JSS 1 A");
  const from = new URL(`https://school.local${href}`).searchParams.get("from");
  assert.equal(safeReturnPath(from), "/students?q=maryam&class=JSS 1 A");
  assert.equal(returnLabel(safeReturnPath(from)), "Students");
});

test("return paths stay inside the app", () => {
  assert.equal(safeReturnPath(null), "/");
  assert.equal(safeReturnPath("https://evil.example/students"), "/");
  assert.equal(safeReturnPath("//evil.example"), "/");
  assert.equal(safeReturnPath("/\\evil"), "/");
  assert.equal(safeReturnPath("/reports?from=2026-01-01&to=2026-02-01"), "/reports?from=2026-01-01&to=2026-02-01");
});

test("list filters omit defaults and ignore the issue action", () => {
  const defaults = { q: "", class: "ALL", status: "ALL" };
  const values = { q: "maryam", class: "ALL", status: "PARTIAL" };
  const query = queryString(defaults, values);
  assert.equal(query, "q=maryam&status=PARTIAL");
  assert.equal(queryMatches(defaults, values, new URLSearchParams(query)), true);
  assert.equal(currentPath("/students", new URLSearchParams("q=maryam&action=issue")), "/students?q=maryam");
  assert.equal(returnLabel("/receipts?q=0109"), "Receipts");
  assert.equal(returnLabel("/reports?term=1st+Term"), "Reports");
});

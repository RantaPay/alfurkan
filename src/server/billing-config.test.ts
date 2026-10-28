import { DEFAULT_CONCESSIONS } from "@/lib/student-importer";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBillingConfiguration } from "./billing-config";

test("missing billing settings retain empty schedule and default concessions", () => {
  assert.deepEqual(parseBillingConfiguration(null), { feeStructure: [], concessions: DEFAULT_CONCESSIONS });
});

test("saved fee values and partial concessions retain legacy merge semantics", () => {
  const fees = [{ classLevel: "JSS 1", tuitionFee: 60000, booksFee: 27000 }];
  const result = parseBillingConfiguration({ feeStructureJson: JSON.stringify(fees), concessionsJson: '{"jss1_2":30000,"adf":0}' });
  assert.deepEqual(result.feeStructure, fees);
  assert.deepEqual(result.concessions, { ...DEFAULT_CONCESSIONS, jss1_2: 30000, adf: 0 });
});

test("malformed fees retain the legacy bill fallback and default concessions", () => {
  assert.deepEqual(parseBillingConfiguration({ feeStructureJson: "{broken", concessionsJson: '{"jss1_2":15000}' }), { feeStructure: [], concessions: DEFAULT_CONCESSIONS });
});

test("malformed concessions retain a successfully parsed schedule", () => {
  const fees = [{ classLevel: "Basic 1", tuitionFee: 25000 }];
  assert.deepEqual(parseBillingConfiguration({ feeStructureJson: JSON.stringify(fees), concessionsJson: "{broken" }), { feeStructure: fees, concessions: DEFAULT_CONCESSIONS });
});

test("non-array fee settings and primitive concessions use their defaults", () => {
  for (const value of ['null', '12', '"invalid"']) {
    assert.deepEqual(parseBillingConfiguration({ feeStructureJson: value, concessionsJson: value }), { feeStructure: [], concessions: DEFAULT_CONCESSIONS });
  }
});

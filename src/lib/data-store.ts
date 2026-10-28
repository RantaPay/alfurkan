// Stable server API. Domain implementations live in src/server.
export * from "@/server/config";
export * from "@/server/student-service";
export * from "@/server/receipt-service";
export * from "@/server/settings-service";
export * from "@/server/report-service";
export * from "@/server/staff-service";

import { getSchoolProfile } from "@/server/settings-service";
import { getStudents } from "@/server/student-service";
import { getReceipts } from "@/server/receipt-service";
import { getStaffUsers } from "@/server/staff-service";

// Backward Compatibility Helpers for readDB / writeDB
export async function readDB() {
  const [school, students, receipts, users] = await Promise.all([
    getSchoolProfile(),
    getStudents(),
    getReceipts(),
    getStaffUsers(),
  ]);
  return { school, students, receipts, users };
}

export async function writeDB() {
  // In PostgreSQL, individual operations are persisted immediately and transactionally.
  return Promise.resolve();
}

import { getReceipts } from "./receipt-service";
import { getSchoolProfile } from "./settings-service";
import { getStaffUsers } from "./staff-service";
import { getStudents } from "./student-service";

/** Read-only accounts copy. Secrets and QR images stay on the server. */
export async function getOfflineSnapshot() {
  const school = await getSchoolProfile();
  delete school.accountantPin;
  const students = await getStudents();
  const receipts = (await getReceipts()).map((receipt) => ({ ...receipt, qrCodeDataUrl: undefined }));
  const staff = (await getStaffUsers()).map((user) => ({ ...user, pin: "", password: undefined }));
  return {
    savedAt: new Date().toISOString(),
    school,
    students,
    receipts,
    staff,
  };
}

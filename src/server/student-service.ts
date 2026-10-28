import { calculatePeriodFeeBalance, isTermPeriod } from "@/lib/payment-period";
import { prisma } from "@/lib/prisma";
import {
  getStudentFeeObligations
} from "@/lib/student-importer";
import {
  Student
} from "@/lib/types";
import { Prisma } from "@prisma/client";
import { parseBillingConfiguration } from "./billing-config";

import { formatStudent } from "./formatters";

// Student Queries
export async function getStudents(
  query?: string,
  classFilter?: string,
  statusFilter?: string
): Promise<Student[]> {
  const where: Prisma.StudentWhereInput = {};

  if (query && query.trim()) {
    const q = query.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { regNumber: { contains: q, mode: "insensitive" } },
      { parentName: { contains: q, mode: "insensitive" } },
      { parentPhone: { contains: q, mode: "insensitive" } },
    ];
  }

  if (classFilter && classFilter !== "ALL") {
    where.class = { startsWith: classFilter, mode: "insensitive" };
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return students.map(formatStudent);
}

export async function getDistinctClassLevels(): Promise<string[]> {
  const distinct = await prisma.student.findMany({
    select: { class: true },
    distinct: ["class"],
  });

  const baseSet = new Set<string>();
  for (const item of distinct) {
    if (!item.class) continue;
    // Strip trailing arm letter: e.g. "Basic 1 A" -> "Basic 1", "JSS 2 C" -> "JSS 2", "Pre-Nursery B" -> "Pre-Nursery"
    const base = item.class.replace(/\s+[-–]?[A-Za-z0-9]$/i, "").trim();
    if (base) {
      baseSet.add(base);
    }
  }

  // Canonical educational sorting
  const orderRank = (cls: string) => {
    const l = cls.toLowerCase();
    if (l.includes("pre-nursery")) return 1;
    if (l.includes("nursery 1")) return 2;
    if (l.includes("nursery 2")) return 3;
    if (l.includes("pre-basic") || l.includes("pre basic") || l === "pb" || l.startsWith("pb ") || l.startsWith("pb-")) return 4;
    if (l.includes("basic 1")) return 11;
    if (l.includes("basic 2")) return 12;
    if (l.includes("basic 3")) return 13;
    if (l.includes("basic 4")) return 14;
    if (l.includes("basic 5")) return 15;
    if (l.includes("basic 6")) return 16;
    if (l.includes("jss 1")) return 21;
    if (l.includes("jss 2")) return 22;
    if (l.includes("jss 3")) return 23;
    if (l.includes("ss 1")) return 31;
    if (l.includes("ss 2")) return 32;
    if (l.includes("ss 3")) return 33;
    return 99;
  };

  return Array.from(baseSet).sort((a, b) => {
    const diff = orderRank(a) - orderRank(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}

export async function getStudentById(id: string): Promise<Student | null> {
  const student = await prisma.student.findUnique({
    where: { id },
  });
  return student ? formatStudent(student) : null;
}

export async function getStudentByRegNumber(regNumber: string): Promise<Student | null> {
  const clean = regNumber.trim();
  const student = await prisma.student.findFirst({
    where: {
      regNumber: { equals: clean, mode: "insensitive" },
    },
  });
  return student ? formatStudent(student) : null;
}

// Student Creation & Bulk Import
export async function createStudent(input: any): Promise<Student> {
  let regNumber = input.regNumber?.trim();
  if (!regNumber) {
    const count = await prisma.student.count();
    const year = new Date().getFullYear();
    regNumber = `AIA/${year}/${String(count + 101).padStart(4, "0")}`;
  }

  const totalBill = Number(input.totalTermBill) || 0;

  const student = await prisma.student.create({
    data: {
      regNumber,
      fullName: input.fullName.trim(),
      class: input.class.trim(),
      gender: input.gender || "Male",
      parentName: input.parentName.trim(),
      parentPhone: input.parentPhone?.trim() || "",
      parentEmail: input.parentEmail?.trim() || null,
      totalTermBill: totalBill,
      totalPaid: 0,
      balanceRemaining: totalBill,
      status: "UNPAID",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "STUDENT_ENROLLED",
      performedBy: "Accounts Staff",
      details: JSON.stringify({
        studentId: student.id,
        regNumber: student.regNumber,
        fullName: student.fullName,
        class: student.class,
      }),
    },
  });

  return formatStudent(student);
}

export async function importStudentsBulk(studentsList: any[]): Promise<Student[]> {
  const created: Student[] = [];
  const year = new Date().getFullYear();
  const currentCount = await prisma.student.count();

  for (let i = 0;i < studentsList.length;i++) {
    const s = studentsList[i];
    if (!s.fullName?.trim()) continue;

    const regNumber =
      s.regNumber?.trim() || `AIA/${year}/${String(currentCount + i + 101).padStart(4, "0")}`;
    const totalBill = Number(s.totalTermBill) || 0;

    const student = await prisma.student.upsert({
      where: { regNumber },
      update: {
        fullName: s.fullName.trim(),
        class: s.class?.trim() || "",
        gender: s.gender || "Male",
        parentName: s.parentName?.trim() || "Parent/Guardian",
        parentPhone: s.parentPhone?.trim() || "",
        parentEmail: s.parentEmail?.trim() || null,
        totalTermBill: totalBill,
      },
      create: {
        regNumber,
        fullName: s.fullName.trim(),
        class: s.class?.trim() || "",
        gender: s.gender || "Male",
        parentName: s.parentName?.trim() || "Parent/Guardian",
        parentPhone: s.parentPhone?.trim() || "",
        parentEmail: s.parentEmail?.trim() || null,
        totalTermBill: totalBill,
        totalPaid: 0,
        balanceRemaining: totalBill,
        status: "UNPAID",
      },
    });

    created.push(formatStudent(student));
  }

  await prisma.auditLog.create({
    data: {
      action: "STUDENTS_BULK_IMPORTED",
      performedBy: "Accounts Staff",
      details: JSON.stringify({ count: created.length }),
    },
  });

  return created;
}

export async function updateStudent(
  id: string,
  updates: {
    fullName?: string;
    class?: string;
    isRepeating?: boolean;
    totalTermBill?: number;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    gender?: "Male" | "Female";
    operator?: string;
  }
): Promise<Student> {
  const current = await prisma.student.findUnique({
    where: { id },
  });
  if (!current) {
    throw new Error("Student not found");
  }

  const dataToUpdate: any = {};
  if (updates.fullName !== undefined) dataToUpdate.fullName = updates.fullName.trim();
  if (updates.class !== undefined) dataToUpdate.class = updates.class.trim();
  if (updates.isRepeating !== undefined) dataToUpdate.isRepeating = !!updates.isRepeating;
  if (updates.gender !== undefined) dataToUpdate.gender = updates.gender;
  if (updates.parentName !== undefined) dataToUpdate.parentName = updates.parentName.trim();
  if (updates.parentPhone !== undefined) dataToUpdate.parentPhone = updates.parentPhone.trim();
  if (updates.parentEmail !== undefined) dataToUpdate.parentEmail = updates.parentEmail?.trim() || null;

  const school = await prisma.schoolProfile.findUnique({ where: { id: "default" } });
  const { feeStructure, concessions } = parseBillingConfiguration(school);

  const nextName = updates.fullName?.trim() || current.fullName;
  const nextClass = updates.class?.trim() || current.class;
  const fallbackBill = updates.totalTermBill === undefined
    ? current.totalTermBill
    : Number(updates.totalTermBill) || 0;
  const obligations = getStudentFeeObligations(nextName, nextClass, feeStructure, concessions, fallbackBill);
  const newBill = Object.values(obligations).reduce((sum, amount) => sum + amount, 0);
  const currentSession = (school?.currentSession || "2026/2027 Session").replace(/\bAcademic\s*/gi, "").trim();
  const currentTerm = isTermPeriod(school?.currentTerm) ? school.currentTerm : "1st Term";
  const currentReceipts = await prisma.receipt.findMany({
    where: { studentId: id, session: currentSession, isVoided: false },
    include: { items: true },
  });
  const ledger = calculatePeriodFeeBalance(obligations, currentReceipts, currentTerm, currentTerm);
  const { totalPaid: newPaid, balanceRemaining: newBalance } = ledger;
  dataToUpdate.totalTermBill = newBill;
  dataToUpdate.totalPaid = newPaid;
  dataToUpdate.balanceRemaining = newBalance;
  dataToUpdate.status = ledger.status;

  const updated = await prisma.student.update({
    where: { id },
    data: dataToUpdate,
  });

  await prisma.auditLog.create({
    data: {
      action: "STUDENT_UPDATED",
      performedBy: updates.operator || "Accountant/Admin",
      details: JSON.stringify({
        studentId: id,
        regNumber: updated.regNumber,
        previousClass: current.class,
        newClass: updated.class,
        isRepeating: updated.isRepeating,
        previousBill: current.totalTermBill,
        newBill: updated.totalTermBill,
      }),
    },
  });

  return formatStudent(updated);
}

export async function deleteStudent(id: string, operator?: string): Promise<boolean> {
  const current = await prisma.student.findUnique({
    where: { id },
  });
  if (!current) {
    throw new Error("Student not found");
  }

  await prisma.student.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      action: "STUDENT_DELETED",
      performedBy: operator || "Accountant/Admin",
      details: JSON.stringify({
        studentId: id,
        regNumber: current.regNumber,
        fullName: current.fullName,
        class: current.class,
      }),
    },
  });

  return true;
}

export async function promoteStudentsSession(
  promotions: Array<{
    studentId: string;
    newClass: string;
    isRepeating: boolean;
    newTermBill?: number;
  }>,
  operator: string = "Accountant/Admin"
): Promise<{ success: boolean; updatedCount: number }> {
  return await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const p of promotions) {
      const student = await tx.student.findUnique({
        where: { id: p.studentId },
      });
      if (!student) continue;

      const dataToUpdate: any = {
        class: p.newClass.trim(),
        isRepeating: p.isRepeating,
      };

      if (p.newTermBill !== undefined && p.newTermBill > 0) {
        dataToUpdate.totalTermBill = p.newTermBill;
        dataToUpdate.totalPaid = 0;
        dataToUpdate.balanceRemaining = p.newTermBill;
        dataToUpdate.status = "UNPAID";
        dataToUpdate.lastPaymentDate = null;
      }

      await tx.student.update({
        where: { id: p.studentId },
        data: dataToUpdate,
      });
      count++;
    }

    await tx.auditLog.create({
      data: {
        action: "SESSION_PROMOTION_EXECUTED",
        performedBy: operator,
        details: JSON.stringify({
          promotedCount: count,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return { success: true, updatedCount: count };
  });
}

const PROMOTION_LEVEL_ORDER = [
  "Pre-Nursery",
  "Nursery 1",
  "Nursery 2",
  "Pre-Basic",
  "Basic 1",
  "Basic 2",
  "Basic 3",
  "Basic 4",
  "Basic 5",
  "Basic 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SS 1",
  "SS 2",
  "SS 3",
];

const PROMOTION_NEXT_LEVEL_MAP: Record<string, string> = {
  "Pre-Nursery": "Nursery 1",
  "Nursery 1": "Nursery 2",
  "Nursery 2": "Basic 1",
  "Pre-Basic": "Basic 1",
  "Basic 1": "Basic 2",
  "Basic 2": "Basic 3",
  "Basic 3": "Basic 4",
  "Basic 4": "Basic 5",
  "Basic 5": "Basic 6",
  "Basic 6": "JSS 1",
  "JSS 1": "JSS 2",
  "JSS 2": "JSS 3",
  "JSS 3": "SS 1",
  "SS 1": "SS 2",
  "SS 2": "SS 3",
  "SS 3": "Graduated Alumni",
};

export function getAutoPromotedClassName(currentClass: string): string {
  const current = (currentClass || "").trim();
  for (const lvl of PROMOTION_LEVEL_ORDER) {
    if (current.startsWith(lvl)) {
      const nextLvl = PROMOTION_NEXT_LEVEL_MAP[lvl];
      if (nextLvl === "Graduated Alumni") return "Graduated Alumni";
      const arm = current.substring(lvl.length).trim();
      return arm ? `${nextLvl} ${arm}` : nextLvl;
    }
  }
  if (current.toLowerCase().includes("graduated")) return "Graduated Alumni";
  return current;
}

export async function autoPromoteAllStudents(
  operator: string = "Chief Accountant & Admin"
): Promise<{ success: boolean; updatedCount: number; breakdown: Record<string, number> }> {
  const allStudents = await prisma.student.findMany();
  const breakdown: Record<string, number> = {};

  const updates: Array<{ id: string; newClass: string }> = [];

  for (const s of allStudents) {
    const nextClass = getAutoPromotedClassName(s.class);
    if (nextClass !== s.class) {
      updates.push({ id: s.id, newClass: nextClass });
      const transitionKey = `${s.class.split(" ")[0]} → ${nextClass.split(" ")[0]}`;
      breakdown[transitionKey] = (breakdown[transitionKey] || 0) + 1;
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const u of updates) {
      await tx.student.update({
        where: { id: u.id },
        data: {
          class: u.newClass,
          isRepeating: false, // Clean slate for new session; repeaters are marked via individual edit
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "AUTO_SESSION_PROMOTION_ALL",
        performedBy: operator,
        details: JSON.stringify({
          promotedCount: updates.length,
          breakdown,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  });

  return { success: true, updatedCount: updates.length, breakdown };
}

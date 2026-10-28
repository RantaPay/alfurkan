import { calculatePeriodFeeBalance, isTermPeriod } from "@/lib/payment-period";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CONCESSIONS,
  getBillForClass,
  getStudentFeeObligations,
} from "@/lib/student-importer";
import {
  ClassFeeConfig,
  ConcessionCategoryConfig,
  FeeScheduleHistoryEntry,
  SchoolProfile
} from "@/lib/types";

import { DEFAULT_SCHOOL } from "./config";
import { formatSchool } from "./formatters";

// School Profile Queries
export async function getSchoolProfile(): Promise<SchoolProfile> {
  let profile = await prisma.schoolProfile.findUnique({
    where: { id: "default" },
  });

  if (!profile) {
    profile = await prisma.schoolProfile.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        ...DEFAULT_SCHOOL,
      },
    });
  }

  return formatSchool(profile);
}

export async function updateSchoolProfile(updates: Partial<SchoolProfile> & { feeRevisionNote?: string }): Promise<SchoolProfile> {
  const previousSchool = await prisma.schoolProfile.findUnique({ where: { id: "default" } });
  const { bankAccounts, feeStructure, feeScheduleHistory, feeRevisionNote, concessions, ...rest } = updates;
  const prismaData: any = { ...rest };

  if (bankAccounts !== undefined) {
    prismaData.bankAccountsJson = JSON.stringify(bankAccounts);
    const defaultAcc = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    if (defaultAcc) {
      prismaData.bankName = defaultAcc.bankName;
      prismaData.accountNumber = defaultAcc.accountNumber;
      prismaData.accountName = defaultAcc.accountName;
    }
  }

  if (concessions !== undefined) {
    prismaData.concessionsJson = JSON.stringify(concessions);
  }

  if (feeStructure !== undefined) {
    prismaData.feeStructureJson = JSON.stringify(feeStructure);

    // If explicit feeScheduleHistory was passed, prioritize it; otherwise append history entry
    if (feeScheduleHistory !== undefined) {
      prismaData.feeScheduleHistoryJson = JSON.stringify(feeScheduleHistory);
    } else {
      const current = await prisma.schoolProfile.findUnique({ where: { id: "default" } });
      let currentHistory: FeeScheduleHistoryEntry[] = [];
      const currentAny = current as any;
      if (currentAny?.feeScheduleHistoryJson) {
        try {
          const parsed = JSON.parse(currentAny.feeScheduleHistoryJson);
          if (Array.isArray(parsed)) currentHistory = parsed;
        } catch {
          // ignore
        }
      }

      const activeSession = updates.currentSession || current?.currentSession || "2026/2027 Academic Session";
      const activeTerm = updates.currentTerm || current?.currentTerm || "1st Term";
      const updater = updates.accountantName || current?.accountantName || "Aminu S. Boro (Accountant)";

      const newHistoryEntry: FeeScheduleHistoryEntry = {
        id: `fee_rev_${Date.now()}`,
        session: activeSession,
        term: activeTerm,
        updatedAt: new Date().toISOString(),
        updatedBy: updater,
        notes: feeRevisionNote || `Fee schedule updated for ${activeTerm} (${activeSession})`,
        schedule: feeStructure,
        summaryText: `Rates revised for ${feeStructure.length} classes: JSS 1 (₦${(feeStructure.find(f => f.classLevel === "JSS 1")?.totalBill || 0).toLocaleString()}), SS 1 (₦${(feeStructure.find(f => f.classLevel === "SS 1")?.totalBill || 0).toLocaleString()})`,
      };

      currentHistory.unshift(newHistoryEntry);
      if (currentHistory.length > 50) currentHistory = currentHistory.slice(0, 50);
      prismaData.feeScheduleHistoryJson = JSON.stringify(currentHistory);
    }
  } else if (feeScheduleHistory !== undefined) {
    prismaData.feeScheduleHistoryJson = JSON.stringify(feeScheduleHistory);
  }

  const updated = await prisma.schoolProfile.upsert({
    where: { id: "default" },
    update: prismaData,
    create: {
      id: "default",
      ...prismaData,
    },
  });

  const isFeeUpdate = feeStructure !== undefined;
  const isConcessionUpdate = concessions !== undefined;
  const periodChanged = previousSchool?.currentTerm !== updated.currentTerm || previousSchool?.currentSession !== updated.currentSession;
  if (isFeeUpdate || isConcessionUpdate || periodChanged) {
    let activeFees: ClassFeeConfig[] = [];
    if (feeStructure !== undefined && Array.isArray(feeStructure)) {
      activeFees = feeStructure;
    } else if (updated.feeStructureJson) {
      try {
        activeFees = JSON.parse(updated.feeStructureJson);
      } catch { }
    }

    let activeConcessions: ConcessionCategoryConfig = DEFAULT_CONCESSIONS;
    const updatedAny = updated as any;
    if (concessions !== undefined) {
      activeConcessions = { ...DEFAULT_CONCESSIONS, ...concessions };
    } else if (updatedAny.concessionsJson) {
      try {
        activeConcessions = { ...DEFAULT_CONCESSIONS, ...JSON.parse(updatedAny.concessionsJson) };
      } catch { }
    }

    const allStudents = await prisma.student.findMany({
      select: {
        id: true,
        fullName: true,
        class: true,
        totalPaid: true,
        totalTermBill: true,
        balanceRemaining: true,
        status: true,
      },
    });

    const activeTermReceipts = await prisma.receipt.findMany({
      where: {
        session: updated.currentSession.replace(/\bAcademic\s*/gi, "").trim(),
        isVoided: false,
        studentId: { not: null },
      },
      include: { items: true },
    });
    const receiptsByStudent = new Map<string, typeof activeTermReceipts>();
    for (const receipt of activeTermReceipts) {
      if (!receipt.studentId) continue;
      const list = receiptsByStudent.get(receipt.studentId) || [];
      list.push(receipt);
      receiptsByStudent.set(receipt.studentId, list);
    }

    const updateOps: Promise<any>[] = [];
    for (const s of allStudents) {
      const revisedBill = getBillForClass(s.class, activeFees) || s.totalTermBill;
      const obligations = getStudentFeeObligations(s.fullName, s.class, activeFees, activeConcessions, revisedBill);
      const activeTerm = isTermPeriod(updated.currentTerm) ? updated.currentTerm : "1st Term";
      const ledger = calculatePeriodFeeBalance(obligations, receiptsByStudent.get(s.id) || [], activeTerm, activeTerm);
      const { totalBill: targetBill, totalPaid: paid, balanceRemaining: bal, status } = ledger;
      if (s.totalTermBill !== targetBill || s.totalPaid !== paid || s.balanceRemaining !== bal || s.status !== status) {
        updateOps.push(
          prisma.student.update({
            where: { id: s.id },
            data: {
              totalTermBill: targetBill,
              totalPaid: paid,
              balanceRemaining: bal,
              status,
            },
          })
        );
      }
    }

    for (let i = 0;i < updateOps.length;i += 50) {
      await Promise.all(updateOps.slice(i, i + 50));
    }
  }

  await prisma.auditLog.create({
    data: {
      action: isFeeUpdate ? "FEE_SCHEDULE_UPDATED" : "SETTINGS_UPDATED",
      performedBy: updated.accountantName || "Aminu S. Boro",
      details: JSON.stringify({
        ...updates,
        session: updated.currentSession,
        term: updated.currentTerm,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  return formatSchool(updated);
}

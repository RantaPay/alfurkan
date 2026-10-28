import { prisma } from "@/lib/prisma";
import {
  ReportSummary
} from "@/lib/types";
import { Prisma } from "@prisma/client";

import { formatStudent } from "./formatters";
import { getSchoolProfile } from "./settings-service";

// Reports and Analytics
export async function getReportData(
  term?: string,
  month?: string,
  classFilter?: string,
  statusFilter?: string,
  bankFilter?: string
) {
  const where: Prisma.StudentWhereInput = {};

  if (classFilter && classFilter !== "ALL") {
    where.class = { startsWith: classFilter, mode: "insensitive" };
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  if (bankFilter && bankFilter !== "ALL") {
    where.receipts = {
      some: {
        isVoided: false,
        bankName: {
          contains: bankFilter,
          mode: "insensitive",
        },
      },
    };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      receipts: {
        where: {
          isVoided: false,
        },
        orderBy: {
          timestamp: "desc",
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const school = await getSchoolProfile();

  // Fetch all active non-voided receipts for accurate bank reconciliation
  const activeReceipts = await prisma.receipt.findMany({
    where: {
      isVoided: false,
    },
    select: {
      id: true,
      bankName: true,
      amountPaid: true,
      paymentMethod: true,
    },
  });

  // Calculate Bank Reconciliation metrics grouped by bank
  const bankTotalsMap = new Map<string, { totalAmount: number; receiptCount: number }>();
  let totalAllBanksAmount = 0;

  for (const r of activeReceipts) {
    const rawBank = (r.bankName || "").trim();
    if (!rawBank) continue;
    const bName = rawBank;

    const prev = bankTotalsMap.get(bName) || { totalAmount: 0, receiptCount: 0 };
    prev.totalAmount += r.amountPaid;
    prev.receiptCount += 1;
    bankTotalsMap.set(bName, prev);
    totalAllBanksAmount += r.amountPaid;
  }

  const bankReconciliation = Array.from(bankTotalsMap.entries())
    .map(([bankName, stats]) => ({
      bankName,
      totalAmount: stats.totalAmount,
      receiptCount: stats.receiptCount,
      percentage: totalAllBanksAmount > 0 ? Math.round((stats.totalAmount / totalAllBanksAmount) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Exact collections for the filtered bank (if filtering by a specific bank)
  let bankSpecificCollection: number | undefined = undefined;
  if (bankFilter && bankFilter !== "ALL") {
    const matchingReceipts = activeReceipts.filter((r) =>
      (r.bankName || "").toLowerCase().includes(bankFilter.toLowerCase())
    );
    bankSpecificCollection = matchingReceipts.reduce((sum, r) => sum + r.amountPaid, 0);
  }

  const totalStudents = students.length;
  const expectedRevenue = students.reduce((sum, s) => sum + s.totalTermBill, 0);
  const collectedRevenue =
    bankSpecificCollection !== undefined
      ? bankSpecificCollection
      : students.reduce((sum, s) => sum + s.totalPaid, 0);
  const outstandingDebt = Math.max(0, expectedRevenue - collectedRevenue);
  const collectionRate = expectedRevenue > 0 ? Math.min(100, Math.round((collectedRevenue / expectedRevenue) * 100)) : 0;

  const fullPaymentCount = students.filter((s) => s.status === "FULL").length;
  const partialPaymentCount = students.filter((s) => s.status === "PARTIAL").length;
  const unpaidCount = students.filter((s) => s.totalTermBill > 0 && s.status === "UNPAID").length;

  const summary: ReportSummary = {
    period: term || school.currentTerm,
    totalStudents,
    expectedRevenue,
    collectedRevenue,
    outstandingDebt,
    collectionRate,
    fullPaymentCount,
    partialPaymentCount,
    unpaidCount,
    filteredBank: bankFilter !== "ALL" ? bankFilter : undefined,
    filteredClass: classFilter !== "ALL" ? classFilter : undefined,
    bankReconciliation,
    bankSpecificCollection,
  };

  return {
    summary,
    students: students.map(formatStudent),
    school,
  };
}

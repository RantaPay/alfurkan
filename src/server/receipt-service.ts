import { isPaymentPeriod, type PaymentPeriod } from "@/lib/fee-ledger";
import { allocatePeriodItems, calculatePeriodFeeBalance, isTermPeriod } from "@/lib/payment-period";
import { prisma } from "@/lib/prisma";
import {
  getStudentFeeObligations
} from "@/lib/student-importer";
import {
  Receipt,
  ReceiptItem
} from "@/lib/types";
import QRCode from "qrcode";
import { parseBillingConfiguration } from "./billing-config";

import { sameReceiptPayment, type DuplicateQuery } from "@/lib/receipt-duplicate";
import { formatSessionCode } from "./config";
import { formatReceipt } from "./formatters";

// Receipt Queries
export async function getReceipts(limit?: number): Promise<Receipt[]> {
  const receipts = await prisma.receipt.findMany({
    include: { items: true },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
  return receipts.map(formatReceipt);
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { items: true },
  });
  return receipt ? formatReceipt(receipt) : null;
}

export async function getReceiptByNumber(receiptNumber: string): Promise<Receipt | null> {
  const clean = receiptNumber.trim();
  const receipt = await prisma.receipt.findFirst({
    where: {
      receiptNumber: { equals: clean, mode: "insensitive" },
    },
    include: { items: true },
  });
  return receipt ? formatReceipt(receipt) : null;
}

export async function getStudentReceipts(studentId: string): Promise<Receipt[]> {
  const receipts = await prisma.receipt.findMany({
    where: { studentId },
    include: { items: true },
    orderBy: { timestamp: "desc" },
  });
  return receipts.map(formatReceipt);
}

export interface CheckDuplicateInput {
  studentName?: string;
  regNumber?: string;
  amountPaid: number;
  date?: string;
  term?: string;
  session?: string;
  items?: { name: string }[];
}

export async function findDuplicateReceipt(input: CheckDuplicateInput): Promise<Receipt | null> {
  const reg = (input.regNumber || "").trim();
  const name = (input.studentName || "").trim().toLowerCase();
  const amount = Number(input.amountPaid) || 0;
  if (amount <= 0) return null;

  const studentConditions: any[] = [];
  if (reg && reg !== "N/A") {
    studentConditions.push({ regNumber: { equals: reg, mode: "insensitive" } });
  } else if (name) {
    studentConditions.push({ studentName: { equals: name, mode: "insensitive" } });
  }

  if (studentConditions.length === 0) return null;

  const candidateReceipts = await prisma.receipt.findMany({
    where: {
      isVoided: false,
      amountPaid: amount,
      ...(input.term ? { term: input.term } : {}),
      ...(input.session ? { session: input.session } : {}),
      OR: studentConditions,
    },
    include: { items: true },
    orderBy: { timestamp: "desc" },
  });

  const query: DuplicateQuery = input;
  for (const receipt of candidateReceipts) {
    if (sameReceiptPayment({
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      studentName: receipt.studentName,
      regNumber: receipt.regNumber,
      amountPaid: Number(receipt.amountPaid),
      date: receipt.date,
      timestamp: receipt.timestamp instanceof Date ? receipt.timestamp.toISOString() : String(receipt.timestamp),
      term: receipt.term,
      session: receipt.session,
      isVoided: receipt.isVoided,
      items: receipt.items,
    }, query)) {
      return formatReceipt(receipt);
    }
  }

  return null;
}

export interface CreateReceiptInput {
  studentId?: string | null;
  studentName?: string;
  regNumber?: string;
  studentClass?: string;
  amountPaid: number;
  paymentMethod: "Bank Transfer" | "Bank Deposit" | "POS" | "Cash";
  bankReference?: string;
  bankName?: string;
  date?: string;
  depositorName?: string;
  payerName?: string;
  depositorPhone?: string;
  payerPhone?: string;
  items: ReceiptItem[];
  notes?: string;
  term?: PaymentPeriod;
  session?: string;
  clientReceiptId?: string;
  confirmDuplicate?: boolean;
}

function missingClientColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("42703") || (message.includes("clientReceiptId") && message.toLowerCase().includes("does not exist"));
}

function codedError(message: string, code: string): Error {
  const error = new Error(message);
  (error as Error & { code: string }).code = code;
  return error;
}

export async function createReceipt(input: CreateReceiptInput): Promise<Receipt> {
  if (input.items != null && !Array.isArray(input.items)) {
    throw new Error("Receipt items must be an array");
  }
  const receiptItems = input.items?.length
    ? input.items
    : [{ name: "Tuition / School Fees", category: "Tuition" as const, amount: input.amountPaid }];
  if (!Number.isFinite(input.amountPaid) || input.amountPaid <= 0) {
    throw new Error("Payment amount must be a positive number");
  }
  if (!Array.isArray(receiptItems) || receiptItems.some((item) =>
    !item || !Number.isFinite(Number(item.amount)) || Number(item.amount) < 0 ||
    typeof item.name !== "string" || !item.name.trim() ||
    !["Tuition", "Books", "Uniform", "PTA", "Transport", "Excursion", "Development", "Other"].includes(item.category)
  )) {
    throw new Error("Receipt items must have a name and a valid non-negative amount");
  }
  const itemTotal = receiptItems.reduce((sum, item) => sum + Number(item.amount), 0);
  if (Math.abs(itemTotal - input.amountPaid) > 0.01) {
    throw new Error("Receipt item amounts must equal the total amount paid");
  }

  return await prisma.$transaction(async (tx) => {
    // Serialize receipt numbering and balance changes across application instances.
    await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(hashtext('alfurqan-receipt-ledger'))`;
    if (input.clientReceiptId) {
      let existingId = "";
      try {
        const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM "Receipt" WHERE "clientReceiptId" = ${input.clientReceiptId} LIMIT 1`;
        existingId = rows[0]?.id || "";
      } catch (error) {
        if (missingClientColumn(error)) throw codedError("Offline sync is not ready on this server.", "SYNC_UNAVAILABLE");
        throw error;
      }
      if (existingId) {
        const existing = await tx.receipt.findUnique({ where: { id: existingId }, include: { items: true } });
        if (existing) return formatReceipt(existing);
      }
      if (!input.confirmDuplicate) {
        const reg = (input.regNumber || "").trim();
        const name = (input.studentName || input.depositorName || input.payerName || "").trim();
        const duplicateQuery = {
          studentName: name,
          regNumber: reg,
          amountPaid: input.amountPaid,
          date: input.date,
          term: input.term,
          session: input.session,
          items: input.items,
        };
        if (Number(input.amountPaid) > 0 && ((reg && reg !== "N/A") || name)) {
          const candidates = await tx.receipt.findMany({
            where: {
              isVoided: false,
              amountPaid: Number(input.amountPaid),
              ...(input.term ? { term: input.term } : {}),
              ...(input.session ? { session: input.session } : {}),
              OR: reg && reg !== "N/A"
                ? [{ regNumber: { equals: reg, mode: "insensitive" as const } }]
                : [{ studentName: { equals: name, mode: "insensitive" as const } }],
            },
            include: { items: true },
            orderBy: { timestamp: "desc" },
          });
          const match = candidates.find((candidate) => sameReceiptPayment({
            studentName: candidate.studentName,
            regNumber: candidate.regNumber,
            amountPaid: Number(candidate.amountPaid),
            date: candidate.date,
            timestamp: candidate.timestamp.toISOString(),
            term: candidate.term,
            session: candidate.session,
            isVoided: candidate.isVoided,
            items: candidate.items,
          }, duplicateQuery));
          if (match) {
            const error = codedError("This payment is already recorded.", "DUPLICATE");
            (error as Error & { duplicate: Receipt }).duplicate = formatReceipt(match);
            throw error;
          }
        }
      }
    }
    // 1. Fetch student if studentId is provided, or prepare external payer
    const student = input.studentId
      ? await tx.student.findUnique({
        where: { id: input.studentId },
      })
      : null;

    if (input.studentId && !student) {
      throw input.clientReceiptId ? codedError("Student not found", "STUDENT_MISSING") : new Error("Student not found");
    }

    const school = await tx.schoolProfile.findUnique({
      where: { id: "default" },
    });

    const payerFullName = (
      input.studentName ||
      input.depositorName ||
      input.payerName ||
      "External Payer"
    ).trim();

    const regNumber = student?.regNumber || input.regNumber || "N/A";
    const studentClass = student?.class || input.studentClass || "General";
    const parentName = (
      input.depositorName?.trim() ||
      input.payerName?.trim() ||
      student?.parentName ||
      payerFullName
    );
    const parentPhone = (
      input.depositorPhone?.trim() ||
      input.payerPhone?.trim() ||
      student?.parentPhone ||
      ""
    );
    const parentEmail = student?.parentEmail || null;

    const currentTerm = isTermPeriod(school?.currentTerm) ? school.currentTerm : "1st Term";
    const paymentTerm = input.term ?? currentTerm;
    if (!isPaymentPeriod(paymentTerm)) throw new Error("Select a valid payment period");
    const currentSession = (school?.currentSession || "2026/2027 Session").replace(/\bAcademic\s*/gi, "").trim();
    const requestedSession = (input.session || "").replace(/\bAcademic\s*/gi, "").trim();
    if (input.clientReceiptId && requestedSession && requestedSession !== currentSession) {
      throw codedError("The school session changed while this receipt was offline.", "SESSION_CHANGED");
    }
    const accountantName = school?.accountantName || "Aminu S. Boro";

    const { feeStructure, concessions } = parseBillingConfiguration(school);

    const obligations = student
      ? getStudentFeeObligations(
        student.fullName,
        student.class,
        feeStructure,
        concessions,
        student.totalTermBill || 0
      )
      : { Tuition: 0, Books: 0, Uniform: 0, PTA: 0 };
    const priorReceipts = student
      ? await tx.receipt.findMany({
        where: { studentId: student.id, session: currentSession, isVoided: false },
        include: { items: true },
      })
      : [];
    const allocatedItems = allocatePeriodItems(receiptItems, paymentTerm, currentTerm, obligations, priorReceipts);
    const projectedReceipts = [...priorReceipts, { term: paymentTerm, amountPaid: input.amountPaid, items: allocatedItems }];
    const previousLedger = calculatePeriodFeeBalance(obligations, priorReceipts, paymentTerm, currentTerm);
    const nextBalance = calculatePeriodFeeBalance(obligations, projectedReceipts, paymentTerm, currentTerm);
    const effectiveBill = student ? nextBalance.totalBill : input.amountPaid;
    const previousTotalPaid = previousLedger.totalPaid;
    const newTotalPaid = student ? nextBalance.totalPaid : input.amountPaid;
    const newBalanceRemaining = student ? nextBalance.balanceRemaining : 0;
    const paymentStatus: "FULL" | "PARTIAL" = student
      ? nextBalance.status === "FULL" ? "FULL" : "PARTIAL"
      : "FULL";

    // 3. Generate sequential receipt number in format session/counter (e.g. 2026-27/0001)
    const sessionCode = formatSessionCode(currentSession);
    const count = await tx.receipt.count({
      where: { session: currentSession },
    });
    let nextNum = count + 1;
    let candidate = `${sessionCode}/${String(nextNum).padStart(4, "0")}`;
    while (await tx.receipt.findUnique({ where: { receiptNumber: candidate } })) {
      nextNum++;
      candidate = `${sessionCode}/${String(nextNum).padStart(4, "0")}`;
    }
    const receiptNumber = candidate;

    const now = new Date();
    let receiptDateObj = now;
    if (input.date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
        const [y, m, d] = input.date.split("-").map(Number);
        receiptDateObj = new Date(y, m - 1, d, 12, 0, 0);
      } else {
        const parsed = new Date(input.date);
        if (!isNaN(parsed.getTime())) {
          receiptDateObj = parsed;
        }
      }
    }

    const formattedDate = receiptDateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const isoDateString = input.date || receiptDateObj.toISOString().split("T")[0];

    // 4. Generate QR Code for Gate and Audit Clearance
    const verifyUrl = `https://alfurqan.edu.ng/verify/${receiptNumber}`;
    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 200,
        color: { dark: "#075E54", light: "#ffffff" },
      });
    } catch (err) {
      console.error("QR generation failed", err);
    }

    const securityHash = `AIA-HASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const defaultNotes = `${paymentStatus === "FULL" ? "Full payment cleared" : "Partial payment recorded"}. Verified by Accounts.`;

    const receiptItemsData = allocatedItems.map((it) => {
      const category = it.category as keyof typeof obligations;
      const due = obligations[category];
      const itemTerm = isTermPeriod(it.paymentTerm) ? it.paymentTerm : currentTerm;
      const lineBalance = calculatePeriodFeeBalance(obligations, projectedReceipts, itemTerm, currentTerm);
      return {
        name: it.name.trim(),
        category: it.category,
        amount: Number(it.amount),
        description: it.description || null,
        paymentTerm: itemTerm,
        ...(student && due !== undefined ? { chargeAmount: due, chargeBalance: lineBalance.balances[category] } : {}),
      };
    });

    // 5. Create Receipt in PostgreSQL
    const createdReceipt = await tx.receipt.create({
      data: {
        receiptNumber,
        ...(student ? { student: { connect: { id: student.id } } } : {}),
        regNumber,
        studentName: student ? student.fullName : payerFullName,
        studentClass,
        parentName,
        parentPhone,
        parentEmail,
        amountPaid: input.amountPaid,
        totalTermBill: effectiveBill,
        previousTotalPaid,
        newTotalPaid,
        balanceRemaining: newBalanceRemaining,
        paymentStatus,
        paymentMethod: input.paymentMethod,
        bankReference: input.bankReference?.trim() || `TRF/NIP/${Date.now().toString().slice(-6)}`,
        bankName: (input as any).bankName || school?.bankName || "",
        term: paymentTerm,
        session: currentSession,
        date: formattedDate,
        timestamp: now,
        issuedBy: accountantName,
        qrCodeDataUrl,
        securityHash,
        notes: input.notes?.trim() || defaultNotes,
        items: {
          create: receiptItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    if (input.clientReceiptId) {
      await tx.$executeRaw`UPDATE "Receipt" SET "clientReceiptId" = ${input.clientReceiptId} WHERE id = ${createdReceipt.id}`;
    }

    // 6. Update student balance in PostgreSQL (if registered student)
    if (student && allocatedItems.some((item) => item.paymentTerm === currentTerm)) {
      const currentLedger = calculatePeriodFeeBalance(obligations, projectedReceipts, currentTerm, currentTerm);
      await tx.student.update({
        where: { id: student.id },
        data: {
          totalTermBill: currentLedger.totalBill,
          totalPaid: currentLedger.totalPaid,
          balanceRemaining: currentLedger.balanceRemaining,
          status: currentLedger.status,
          lastPaymentDate: isoDateString,
        },
      });
    }

    // 7. Insert Audit Log
    await tx.auditLog.create({
      data: {
        action: "RECEIPT_ISSUED",
        performedBy: accountantName,
        details: JSON.stringify({
          receiptNumber,
          studentRegNumber: student?.regNumber || regNumber,
          studentName: student?.fullName || payerFullName,
          amountPaid: input.amountPaid,
          paymentMethod: input.paymentMethod,
          bankName: (input as any).bankName || school?.bankName || "",
          timestamp: now.toISOString(),
        }),
      },
    });

    return formatReceipt(createdReceipt);
  });
}

// Receipt Void / Cancellation - ACID Transactional
export async function voidReceipt(
  receiptId: string,
  reason: string,
  voidedBy?: string
): Promise<Receipt> {
  return await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(hashtext('alfurqan-receipt-ledger'))`;
    const receipt = await tx.receipt.findUnique({
      where: { id: receiptId },
      include: { items: true },
    });

    if (!receipt) {
      throw new Error("Receipt not found");
    }

    if (receipt.isVoided) {
      throw new Error("This receipt is already voided.");
    }

    const school = await tx.schoolProfile.findUnique({ where: { id: "default" } });
    const operator = voidedBy || school?.accountantName || "Aminu S. Boro";
    const now = new Date();

    // 1. Mark receipt as voided
    const updatedReceipt = await tx.receipt.update({
      where: { id: receiptId },
      data: {
        isVoided: true,
        voidReason: reason.trim(),
        voidedAt: now,
        voidedBy: operator,
      },
      include: { items: true },
    });

    // 2. Re-adjust student balance from all remaining active receipts
    const student = receipt.studentId
      ? await tx.student.findUnique({
        where: { id: receipt.studentId },
      })
      : null;

    if (student && receipt.session === (school?.currentSession || "").replace(/\bAcademic\s*/gi, "").trim()) {
      const activeReceipts = await tx.receipt.findMany({
        where: {
          studentId: student.id,
          session: receipt.session,
          isVoided: false,
        },
        include: { items: true },
      });

      const { feeStructure, concessions } = parseBillingConfiguration(school);

      const obligations = getStudentFeeObligations(
        student.fullName,
        student.class,
        feeStructure,
        concessions,
        student.totalTermBill || 0
      );
      const activeTerm = isTermPeriod(school?.currentTerm) ? school.currentTerm : "1st Term";
      const ledger = calculatePeriodFeeBalance(obligations, activeReceipts, activeTerm, activeTerm);
      const { totalBill, totalPaid: newTotalPaid, balanceRemaining: newBalanceRemaining, status: newStatus } = ledger;

      await tx.student.update({
        where: { id: student.id },
        data: {
          totalTermBill: totalBill,
          totalPaid: newTotalPaid,
          balanceRemaining: newBalanceRemaining,
          status: newStatus,
        },
      });
    }

    // 3. Record Audit Log
    await tx.auditLog.create({
      data: {
        action: "RECEIPT_VOIDED",
        performedBy: operator,
        details: JSON.stringify({
          receiptNumber: receipt.receiptNumber,
          receiptId,
          reason,
          timestamp: now.toISOString(),
        }),
      },
    });

    return formatReceipt(updatedReceipt);
  });
}

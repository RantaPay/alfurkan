"use client";

import { buildAccountReport, type ReportQuery } from "@/lib/report-query";
import { shouldUseSnapshot } from "@/lib/offline/sync-result";
import type { Receipt, ReportSummary, SchoolProfile, Student } from "@/lib/types";

export interface OfflineSnapshot {
  savedAt: string;
  school: SchoolProfile;
  students: Student[];
  receipts: Receipt[];
}

export interface OutboxReceipt {
  clientReceiptId: string;
  provisionalRef: string;
  createdAt: string;
  status: "waiting" | "syncing" | "synced" | "needs_decision" | "reprint";
  confirmDuplicate?: boolean;
  payload: Record<string, unknown>;
  provisionalBill: number;
  provisionalBalance: number;
  officialId?: string;
  officialNumber?: string;
  conflict?: { id: string; receiptNumber: string; studentName: string; amountPaid: number; date: string };
  message?: string;
}

const DB_NAME = "alfurqan-pay";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("snapshot")) db.createObjectStore("snapshot");
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "clientReceiptId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadJson(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok || data?.success === false) throw new Error(data?.error || "Unable to load records. Please try again.");
    return data;
  } catch (error) {
    if (!shouldUseSnapshot(error, typeof navigator === "undefined" ? true : navigator.onLine)) throw error;
    const offline = await readOfflineApi(url);
    if (!offline) throw error;
    return offline;
  }
}

export async function readSnapshot(): Promise<OfflineSnapshot | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  const snapshot = await requestToPromise(db.transaction("snapshot").objectStore("snapshot").get("current"));
  db.close();
  return snapshot || null;
}

export async function writeSnapshot(snapshot: OfflineSnapshot): Promise<void> {
  const db = await openDb();
  await requestToPromise(db.transaction("snapshot", "readwrite").objectStore("snapshot").put(snapshot, "current"));
  db.close();
}

export async function readOutbox(): Promise<OutboxReceipt[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  const rows = await requestToPromise(db.transaction("outbox").objectStore("outbox").getAll());
  db.close();
  return (rows || []).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function saveOutbox(receipt: OutboxReceipt): Promise<void> {
  const db = await openDb();
  await requestToPromise(db.transaction("outbox", "readwrite").objectStore("outbox").put(receipt));
  db.close();
}

export async function removeOutbox(clientReceiptId: string): Promise<void> {
  const db = await openDb();
  await requestToPromise(db.transaction("outbox", "readwrite").objectStore("outbox").delete(clientReceiptId));
  db.close();
}

export function outboxAsReceipt(entry: OutboxReceipt): Receipt {
  const payload = entry.payload;
  return {
    id: entry.clientReceiptId,
    receiptNumber: entry.officialNumber || entry.provisionalRef,
    studentId: (payload.studentId as string) || null,
    regNumber: String(payload.regNumber || "N/A"),
    studentName: String(payload.studentName || ""),
    studentClass: String(payload.studentClass || ""),
    parentName: String(payload.depositorName || payload.studentName || ""),
    parentPhone: String(payload.depositorPhone || ""),
    amountPaid: Number(payload.amountPaid) || 0,
    totalTermBill: entry.provisionalBill,
    previousTotalPaid: 0,
    newTotalPaid: Number(payload.amountPaid) || 0,
    balanceRemaining: entry.provisionalBalance,
    paymentStatus: entry.provisionalBalance === 0 ? "FULL" : "PARTIAL",
    paymentMethod: (payload.paymentMethod as Receipt["paymentMethod"]) || "Cash",
    bankReference: payload.bankReference as string | undefined,
    bankName: String(payload.bankName || ""),
    items: Array.isArray(payload.items) ? payload.items as Receipt["items"] : [],
    term: String(payload.term || ""),
    session: String(payload.session || ""),
    date: String(payload.date || ""),
    timestamp: entry.createdAt,
    issuedBy: "Pending sync",
    securityHash: "PENDING",
    notes: typeof payload.notes === "string" ? payload.notes : undefined,
    isVoided: false,
  };
}

function waitingReceipts(entries: OutboxReceipt[]): Receipt[] {
  return entries
    .filter((entry) => entry.status === "waiting" || entry.status === "syncing" || entry.status === "needs_decision")
    .map(outboxAsReceipt);
}

function dashboardSummary(snapshot: OfflineSnapshot, entries: OutboxReceipt[]): ReportSummary {
  const students = snapshot.students;
  const expectedRevenue = students.reduce((sum, student) => sum + student.totalTermBill, 0);
  const waiting = entries
    .filter((entry) => entry.status !== "synced" && entry.status !== "reprint")
    .reduce((sum, entry) => sum + Number(entry.payload.amountPaid || 0), 0);
  const collectedRevenue = students.reduce((sum, student) => sum + student.totalPaid, 0) + waiting;
  const outstandingDebt = Math.max(0, expectedRevenue - collectedRevenue);
  return {
    period: snapshot.school.currentTerm,
    totalStudents: students.length,
    expectedRevenue,
    collectedRevenue,
    outstandingDebt,
    collectionRate: expectedRevenue > 0 ? Math.min(100, Math.round((collectedRevenue / expectedRevenue) * 100)) : 0,
    fullPaymentCount: students.filter((student) => student.status === "FULL").length,
    partialPaymentCount: students.filter((student) => student.status === "PARTIAL").length,
    unpaidCount: students.filter((student) => student.totalTermBill > 0 && student.status === "UNPAID").length,
    bankReconciliation: [],
  };
}

export async function readOfflineApi(url: string): Promise<{ success: true; [key: string]: unknown } | null> {
  const snapshot = await readSnapshot();
  if (!snapshot) return null;
  const entries = await readOutbox();
  const pending = waitingReceipts(entries);
  const receipts = [...pending, ...snapshot.receipts];
  const parsed = new URL(url, "https://alfurqan.local");
  const path = parsed.pathname;

  if (path === "/api/settings") return { success: true, school: snapshot.school };
  if (path === "/api/students") {
    const query = (parsed.searchParams.get("query") || "").trim().toLowerCase();
    const students = query
      ? snapshot.students.filter((student) =>
        student.fullName.toLowerCase().includes(query) ||
        student.regNumber.toLowerCase().includes(query) ||
        student.parentName.toLowerCase().includes(query) ||
        student.parentPhone.includes(query))
      : snapshot.students;
    return { success: true, students };
  }
  if (path === "/api/receipts") {
    const studentId = parsed.searchParams.get("studentId");
    const number = parsed.searchParams.get("number");
    const limit = Number(parsed.searchParams.get("limit") || 0);
    let list = receipts;
    if (studentId) list = list.filter((receipt) => receipt.studentId === studentId);
    if (number) {
      const receipt = list.find((item) => item.receiptNumber.toLowerCase() === number.toLowerCase());
      return receipt ? { success: true, receipt } : null;
    }
    if (limit > 0) list = list.slice(0, limit);
    return { success: true, count: list.length, receipts: list };
  }
  if (path === "/api/reports" && parsed.searchParams.get("view") === "accounts") {
    const query: ReportQuery = {
      term: parsed.searchParams.get("term") || undefined,
      classLevel: parsed.searchParams.get("class") || undefined,
      arm: parsed.searchParams.get("arm") || undefined,
      status: parsed.searchParams.get("status") || undefined,
      bank: parsed.searchParams.get("bank") || undefined,
      fee: parsed.searchParams.get("fee") || undefined,
      from: parsed.searchParams.get("from") || undefined,
      to: parsed.searchParams.get("to") || undefined,
    };
    const byStudent = new Map(snapshot.students.map((student) => [student.id, { ...student, receipts: [] as Receipt[] }]));
    for (const receipt of receipts) {
      if (receipt.isVoided || !receipt.studentId) continue;
      byStudent.get(receipt.studentId)?.receipts.push(receipt);
    }
    const report = buildAccountReport(
      Array.from(byStudent.values()).map((student) => ({
        id: student.id,
        regNumber: student.regNumber,
        fullName: student.fullName,
        className: student.class,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        totalTermBill: student.totalTermBill,
        receipts: student.receipts.map((receipt) => ({
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          amountPaid: receipt.amountPaid,
          date: receipt.date,
          timestamp: receipt.timestamp,
          term: receipt.term,
          session: receipt.session,
          isVoided: receipt.isVoided,
          paymentMethod: receipt.paymentMethod,
          bankName: receipt.bankName,
          items: receipt.items || [],
        })),
      })),
      snapshot.school,
      query,
    );
    return { success: true, summary: report.summary, students: report.rows, options: report.options, applied: report.applied, school: snapshot.school };
  }
  if (path === "/api/reports") return { success: true, summary: dashboardSummary(snapshot, entries), students: snapshot.students, school: snapshot.school };
  return null;
}

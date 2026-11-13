"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { LoadingRows } from "@/components/ui/feedback";
import { PaymentStatus } from "@/components/ui/payment-status";
import { downloadStudentPaymentReport } from "@/features/students/student-payment-report";
import { ReceiptLink } from "@/features/shared/ReceiptLink";
import { loadJson } from "@/lib/offline/store";
import { returnLabel, safeReturnPath } from "@/lib/return-path";
import type { Receipt, Student } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { ArrowLeft, FileDown } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function StudentReceiptsPage() {
  const params = useParams<{ id: string }>();
  const backTo = safeReturnPath(useSearchParams().get("from"), "/students");
  const id = params?.id || "";
  const [student, setStudent] = useState<Student | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingReport, setSavingReport] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [receiptData, studentData] = await Promise.all([
          loadJson(`/api/receipts?studentId=${encodeURIComponent(id)}`),
          loadJson("/api/students"),
        ]);
        if (cancelled) return;
        const found = (studentData.students || []).find((item: Student) => item.id === id) || null;
        setStudent(found);
        setReceipts(receiptData.receipts || []);
        if (!found && !(receiptData.receipts || []).length) setError("Student not found.");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load this student's receipts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const name = student?.fullName || receipts[0]?.studentName || "Student";
  const reg = student?.regNumber || receipts[0]?.regNumber || "";
  const className = student?.class || receipts[0]?.studentClass || "";

  return (
    <AuthGuard>
      <SidebarLayout>
        <main className="app-page">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link href={backTo} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              {returnLabel(backTo)}
            </Link>
            <button
              type="button"
              disabled={loading || !!error || savingReport}
              onClick={async () => {
                setSavingReport(true);
                try {
                  await downloadStudentPaymentReport({
                    fullName: name,
                    regNumber: reg,
                    class: className,
                    parentName: student?.parentName || receipts[0]?.parentName || "",
                    totalTermBill: student?.totalTermBill || 0,
                    balanceRemaining: student?.balanceRemaining ?? receipts[0]?.balanceRemaining ?? 0,
                  }, receipts);
                } finally {
                  setSavingReport(false);
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075E54] px-4 text-sm font-semibold text-white hover:bg-[#128C7E] disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              {savingReport ? "Preparing report" : "Payment report"}
            </button>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{name}</h1>
            <p className="mt-1 text-sm text-slate-500">{[reg, className].filter(Boolean).join(" · ")} {receipts.length ? `· ${receipts.length} receipt${receipts.length === 1 ? "" : "s"}` : ""}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[40rem] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-500">
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Fees</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Balance after</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-3"><LoadingRows label="Loading receipts" /></td></tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">{error}</td></tr>
                  ) : receipts.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No receipt has been issued to this student.</td></tr>
                  ) : receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <ReceiptLink id={receipt.id} className="font-mono text-sm font-semibold text-[#075E54] hover:underline">{receipt.receiptNumber}</ReceiptLink>
                        <div className="mt-0.5 text-xs text-slate-500">{receipt.bankName || receipt.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{receipt.date}</td>
                      <td className="px-4 py-3 text-slate-700">{receipt.items?.map((item) => item.name).join(", ") || "School fees"}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">{formatNaira(receipt.amountPaid)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${receipt.balanceRemaining > 0 ? "text-amber-700" : "text-emerald-700"}`}>{formatNaira(receipt.balanceRemaining)}</td>
                      <td className="px-4 py-3 text-center"><PaymentStatus status={receipt.paymentStatus} voided={receipt.isVoided} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </SidebarLayout>
    </AuthGuard>
  );
}

export default function StudentReceiptsRoute() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F8FAFC]" />}>
      <StudentReceiptsPage />
    </Suspense>
  );
}

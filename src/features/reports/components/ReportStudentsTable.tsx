"use client";
import { LoadingRows } from "@/components/ui/feedback";
import { PaymentStatus } from "@/components/ui/payment-status";
import { BankBadge } from "@/features/reports/BankBadge";
import { useReport } from "@/features/reports/useReport";
import { formatNaira } from "@/lib/utils";
import { Filter } from "lucide-react";
import Link from "next/link";

type Props = { form: ReturnType<typeof useReport> };

export function ReportStudentsTable({ form }: Props) {
  const { students, loading, hideSensitive, handleResetFilters, paymentSlice } = form;
  const money = (value: number) => hideSensitive ? "₦ * * * * * *" : formatNaira(value);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Students and receipts ({students.length})</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {paymentSlice
            ? "Received is the money that matches the fee, bank, and dates you selected. Each receipt number opens that receipt."
            : "Each receipt number opens that receipt, the same way the receipts page does."}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <div className="panel p-6"><LoadingRows label="Loading report" /></div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No records match this filter</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Try another class, arm, fee, bank, or date range.</p>
            <button type="button" onClick={handleResetFilters} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
              Reset filters
            </button>
          </div>
        ) : (
          <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-500">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Student and receipts</th>
                <th className="px-3 py-3">Class</th>
                <th className="px-3 py-3">Bank</th>
                <th className="px-3 py-3 text-right">Received</th>
                <th className="px-3 py-3 text-right">Term bill</th>
                <th className="px-3 py-3 text-right">Balance</th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, index) => {
                const latest = student.receipts[0];
                return (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">{index + 1}</td>
                    <td className="px-3 py-3">
                      {latest ? (
                        <Link href={`/receipts/${latest.id}`} className="text-sm font-bold text-slate-900 hover:text-[#075E54] hover:underline sm:text-base">
                          {student.fullName}
                        </Link>
                      ) : (
                        <div className="text-sm font-bold text-slate-900 sm:text-base">{student.fullName}</div>
                      )}
                      <div className="font-mono text-xs text-slate-500">{student.regNumber}</div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {student.receipts.length ? student.receipts.map((receipt) => (
                          <Link key={receipt.id} href={`/receipts/${receipt.id}`} className="font-mono text-xs font-semibold text-[#075E54] hover:underline" title={`${receipt.fees} • ${receipt.date}`}>
                            {receipt.receiptNumber}
                          </Link>
                        )) : <span className="text-xs text-slate-400">No receipt in this filter</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">{student.class}</td>
                    <td className="px-3 py-3"><BankBadge student={student} /></td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-semibold text-emerald-800">{student.receivedAmount > 0 ? money(student.receivedAmount) : "—"}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-bold text-slate-800">{student.totalTermBill > 0 ? money(student.totalTermBill) : "—"}</td>
                    <td className={`px-3 py-3 text-right font-mono text-sm font-bold ${student.balanceRemaining > 0 ? "text-amber-700" : "text-slate-400"}`}>
                      {student.totalTermBill === 0 ? "—" : money(student.balanceRemaining)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {student.totalTermBill === 0 ? <span className="text-xs text-slate-500">No fee due</span> : <PaymentStatus status={student.status} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

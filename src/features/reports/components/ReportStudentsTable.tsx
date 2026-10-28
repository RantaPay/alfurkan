"use client";
import { LoadingRows } from "@/components/ui/feedback";
import { PaymentStatus } from "@/components/ui/payment-status";
import { BankBadge } from "@/features/reports/BankBadge";
import { useReport } from "@/features/reports/useReport";
import { formatNaira } from "@/lib/utils";
import {
  Filter
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useReport>, "classFilter" | "bankFilter" | "statusFilter" | "students" | "loading" | "hideSensitive" | "handleResetFilters"> };
export function ReportStudentsTable({ form }: Props) {
  const { classFilter, bankFilter, statusFilter, students, loading, hideSensitive, handleResetFilters } = form;
  return (<>
    {/* Detailed Students & Debtors Table */}
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 sm:p-7 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Student Debt &amp; Payments ({students.length} Records)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {students.length} students {bankFilter !== "ALL" ? `who made payments to ${bankFilter}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-500">
            Class: <strong className="text-slate-800">{classFilter}</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs sm:text-sm font-bold text-slate-500">
            Bank: <strong className="text-emerald-800">{bankFilter}</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs sm:text-sm font-bold text-slate-500">
            Status: <strong className="text-slate-800">{statusFilter}</strong>
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <div className="panel p-6"><LoadingRows label="Loading report" /></div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No student records match this filter</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              No students in {classFilter !== "ALL" ? classFilter : "any class"} were found for {bankFilter !== "ALL" ? bankFilter : "the selected criteria"}.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer hover:bg-slate-800 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <table className="min-w-[52rem] w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-slate-500 font-bold  text-xs tracking-normal border-b border-slate-100">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Reg No</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3">Parent Contact</th>
                <th className="py-3 px-3">Receiving Bank</th>
                <th className="py-3 px-3 text-right">Term Bill</th>
                <th className="py-3 px-3 text-right">Paid to Date</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-slate-400 font-mono text-xs">{idx + 1}</td>

                  <td className="py-3 px-3 font-bold text-slate-900 text-sm sm:text-base">
                    {student.fullName}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-700 text-sm">
                    {student.regNumber}
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-700 text-sm">
                    {student.class}
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    <div className="font-medium text-slate-800">{student.parentName}</div>
                    <div className="text-xs text-slate-400 font-mono">{student.parentPhone}</div>
                  </td>

                  {/* Receiving Bank Column */}
                  <td className="py-3 px-3">
                    <BankBadge student={student} />
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 text-sm sm:text-base">
                    {hideSensitive
                      ? "₦ * * * * * *"
                      : student.totalTermBill > 0
                        ? formatNaira(student.totalTermBill)
                        : "—"}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm sm:text-base">
                    {hideSensitive
                      ? "₦ * * * * * *"
                      : student.totalPaid > 0
                        ? formatNaira(student.totalPaid)
                        : "—"}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-sm sm:text-base">
                    <span className={student.balanceRemaining > 0 ? "text-amber-700 font-semibold" : "text-slate-400 font-normal"}>
                      {hideSensitive
                        ? "₦ * * * * * *"
                        : student.totalTermBill === 0
                          ? "—"
                          : student.balanceRemaining > 0
                            ? formatNaira(student.balanceRemaining)
                            : "₦0"}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {student.totalTermBill === 0 ? <span className="text-xs text-slate-500">No fee due</span> : <PaymentStatus status={student.status} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </>);
}

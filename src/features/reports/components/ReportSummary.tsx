"use client";
import { useReport } from "@/features/reports/useReport";
import { formatNaira } from "@/lib/utils";
import {
  Landmark,
  RotateCcw
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useReport>, "bankFilter" | "setBankFilter" | "students" | "summary" | "hideSensitive"> };
export function ReportSummary({ form }: Props) {
  const { bankFilter, setBankFilter, students, summary, hideSensitive } = form;
  return (<>
    {/* 4 KPI Summary Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <span className="text-xs font-bold  tracking-normal text-slate-500 block mb-1">
          Expected Revenue
        </span>
        <div className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono tracking-tight">
          {hideSensitive ? "₦ * * * * * *" : summary ? formatNaira(summary.expectedRevenue) : "₦0"}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Across {hideSensitive ? "* *" : (summary?.totalStudents || 0)} filtered students
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <span className="text-xs font-bold  tracking-normal text-emerald-700 block mb-1">
          Total Collections
        </span>
        <div className="text-2xl sm:text-3xl font-semibold text-emerald-800 font-mono tracking-tight">
          {hideSensitive ? "₦ * * * * * *" : summary ? formatNaira(summary.collectedRevenue) : "₦0"}
        </div>
        <div className="text-xs font-bold text-emerald-700 mt-1">
          {hideSensitive ? "**%" : `${summary?.collectionRate || 0}%`} collection rate
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <span className="text-xs font-bold  tracking-normal text-amber-700 block mb-1">
          Outstanding Debt
        </span>
        <div className="text-2xl sm:text-3xl font-semibold text-amber-700 font-mono tracking-tight">
          {hideSensitive ? "₦ * * * * * *" : summary ? formatNaira(summary.outstandingDebt) : "₦0"}
        </div>
        <div className="text-xs font-bold text-amber-700 mt-1">
          {hideSensitive ? "* *" : (summary?.partialPaymentCount || 0)} partial debtors
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <span className="text-xs font-bold  tracking-normal text-slate-500 block mb-1">
          Payment Breakdown
        </span>
        <div className="text-xs sm:text-sm font-bold text-slate-700 space-y-1 mt-1">
          <div className="flex justify-between">
            <span>🟢 Fully Cleared:</span>
            <strong className="font-mono text-emerald-700 font-semibold">
              {hideSensitive ? "* *" : (summary?.fullPaymentCount || 0)}
            </strong>
          </div>
          <div className="flex justify-between">
            <span>🟡 Partial Debt:</span>
            <strong className="font-mono text-amber-700 font-semibold">
              {hideSensitive ? "* *" : (summary?.partialPaymentCount || 0)}
            </strong>
          </div>
          <div className="flex justify-between">
            <span>🔴 Unpaid Zero:</span>
            <strong className="font-mono text-rose-700 font-semibold">
              {hideSensitive ? "* *" : (summary?.unpaidCount || 0)}
            </strong>
          </div>
        </div>
      </div>
    </div>

    {/* Bank Reconciliation Matrix (Treasury Breakdown) */}
    {summary?.bankReconciliation && summary.bankReconciliation.length > 0 && (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-[#075E54] border border-emerald-200">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Bank Reconciliation & Treasury Breakdown
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verified collections by receiving bank account • Click any bank card to filter
              </p>
            </div>
          </div>

          {bankFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setBankFilter("ALL")}
              className="text-xs font-bold text-[#075E54] hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Show All Banks</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summary.bankReconciliation.map((bank, bIdx) => {
            const isSelected = bankFilter.toLowerCase() === bank.bankName.toLowerCase();
            return (
              <button
                key={bIdx}
                type="button"
                onClick={() => setBankFilter(isSelected ? "ALL" : bank.bankName)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${isSelected
                    ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/30"
                    : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                  }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                    {bank.bankName}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {bank.percentage}%
                  </span>
                </div>

                <div className="text-sm sm:text-base font-semibold text-emerald-800 font-mono">
                  {hideSensitive ? "₦ * * *" : formatNaira(bank.totalAmount)}
                </div>

                <div className="text-[11px] font-bold text-slate-500 mt-1">
                  {bank.receiptCount} {bank.receiptCount === 1 ? "receipt" : "receipts"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    )}


  </>);
}

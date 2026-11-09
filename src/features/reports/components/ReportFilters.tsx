"use client";
import { useReport } from "@/features/reports/useReport";
import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

type Props = { form: ReturnType<typeof useReport> };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const control = "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]";

export function ReportFilters({ form }: Props) {
  const {
    term, setTerm, classFilter, setClassFilter, armFilter, setArmFilter, bankFilter, setBankFilter,
    statusFilter, setStatusFilter, feeFilter, setFeeFilter, fromDate, setFromDate, toDate, setToDate,
    students, options, applied, handleResetFilters, hasActiveFilters,
  } = form;
  const session = applied?.session || "";
  const termLabel = (value: string) => value === "ALL" ? "All terms" : `${value}${session ? ` ${session}` : ""}`;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Payment status">
          <select aria-label="Payment status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={control}>
            <option value="ALL">All statuses</option>
            <option value="FULL">Paid in full</option>
            <option value="PARTIAL">Part paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </Field>
        <Field label="Term">
          <select aria-label="Term" value={term || applied?.term || ""} onChange={(event) => setTerm(event.target.value)} className={control}>
            {options.terms.map((value) => <option key={value} value={value}>{termLabel(value)}</option>)}
          </select>
        </Field>
        <Field label="Class">
          <select aria-label="Class" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className={control}>
            <option value="ALL">All classes</option>
            {options.classLevels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </Field>
        <Field label="Arm">
          <select aria-label="Class arm" value={armFilter} onChange={(event) => setArmFilter(event.target.value)} className={control}>
            <option value="ALL">All arms</option>
            {options.arms.map((arm) => <option key={arm} value={arm}>{arm}</option>)}
          </select>
        </Field>
        <Field label="Bank">
          <select aria-label="Bank" value={bankFilter} onChange={(event) => setBankFilter(event.target.value)} className={control}>
            <option value="ALL">All banks</option>
            {options.banks.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
          </select>
        </Field>
        <Field label="Fee">
          <select aria-label="Fee" value={feeFilter} onChange={(event) => setFeeFilter(event.target.value)} className={control}>
            <option value="ALL">All fees</option>
            {options.feeTypes.map((fee) => <option key={fee} value={fee}>{fee}</option>)}
          </select>
        </Field>
        <Field label="Paid from">
          <input aria-label="Paid from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={control} />
        </Field>
        <Field label="Paid to">
          <input aria-label="Paid to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className={control} />
        </Field>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200/90 bg-emerald-50/70 px-4 py-2.5 text-sm">
          <p className="font-medium text-slate-700">
            <span className="font-semibold text-emerald-900">Showing {students.length} students</span>
            {applied ? ` for ${termLabel(applied.term)}` : ""}.
            {feeFilter !== "ALL" ? ` Fee: ${feeFilter}.` : ""}
            {bankFilter !== "ALL" ? ` Bank: ${bankFilter}.` : ""}
            {fromDate || toDate ? ` Dates: ${fromDate || "start"} to ${toDate || "today"}.` : ""}
          </p>
          <button type="button" onClick={handleResetFilters} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

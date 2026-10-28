"use client";
import { useReport } from "@/features/reports/useReport";
import {
  Calendar,
  Filter,
  Landmark,
  RotateCcw,
  Users
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useReport>, "term" | "setTerm" | "classFilter" | "setClassFilter" | "bankFilter" | "setBankFilter" | "statusFilter" | "setStatusFilter" | "students" | "school" | "handleResetFilters" | "hasActiveFilters"> };
export function ReportFilters({ form }: Props) {
  const { term, setTerm, classFilter, setClassFilter, bankFilter, setBankFilter, statusFilter, setStatusFilter, students, school, handleResetFilters, hasActiveFilters } = form;
  return (<>
    {/* Filters Container */}
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
      {/* Main Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Payment Status Dropdown (Screenshot 2 converted to dropdown) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
            <Filter className="h-4 w-4 text-slate-500 ml-1" />
            <span className="text-xs font-bold text-slate-500  tracking-normal">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "FULL" | "PARTIAL" | "UNPAID")}
              className="h-9 px-1 text-sm font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Students</option>
              <option value="FULL">Full Payment (Cleared)</option>
              <option value="PARTIAL">Part paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          {/* Term Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
            <Calendar className="h-4 w-4 text-slate-500 ml-1" />
            <span className="text-xs font-bold text-slate-500  tracking-normal">Term:</span>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="h-9 px-1 text-sm font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="1st Term">1st Term 2026/2027</option>
              <option value="2nd Term">2nd Term 2026/2027</option>
              <option value="3rd Term">3rd Term 2026/2027</option>
            </select>
          </div>

          {/* Class Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
            <Users className="h-4 w-4 text-slate-500 ml-1" />
            <span className="text-xs font-bold text-slate-500  tracking-normal">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-9 px-1 text-sm font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery 1">Nursery 1</option>
              <option value="Nursery 2">Nursery 2</option>
              <option value="Basic 1">Basic 1</option>
              <option value="Basic 2">Basic 2</option>
              <option value="Basic 3">Basic 3</option>
              <option value="Basic 4">Basic 4</option>
              <option value="Basic 5">Basic 5</option>
              <option value="Basic 6">Basic 6</option>
              <option value="JSS 1">JSS 1</option>
              <option value="JSS 2">JSS 2</option>
              <option value="JSS 3">JSS 3</option>
              <option value="SS 1">SS 1</option>
              <option value="SS 2">SS 2</option>
              <option value="SS 3">SS 3</option>
            </select>
          </div>

          {/* Bank Selector */}
          <div className="flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-200 px-3 py-1 rounded-xl">
            <Landmark className="h-4 w-4 text-emerald-700 ml-1" />
            <span className="text-xs font-bold text-emerald-700  tracking-normal">Bank:</span>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="h-9 px-1 text-sm font-semibold text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Payment Banks</option>
              {school?.bankAccounts && school.bankAccounts.length > 0
                ? school.bankAccounts.map((b) => (
                  <option key={b.id} value={b.bankName}>
                    {b.bankName}
                  </option>
                ))
                : null}
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-2 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Summary Bar */}
      {hasActiveFilters && (
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2.5 text-slate-700 font-medium">
            <span className="font-semibold text-emerald-900">Active Criteria:</span>
            {statusFilter !== "ALL" && (
              <span className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 font-semibold">
                Status: {statusFilter === "FULL" ? "Full Payment" : statusFilter === "PARTIAL" ? "Part paid" : "Unpaid"}
              </span>
            )}
            {classFilter !== "ALL" && (
              <span className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 font-semibold">
                Class: {classFilter}
              </span>
            )}
            {bankFilter !== "ALL" && (
              <span className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 font-semibold">
                Bank: {bankFilter}
              </span>
            )}
            <span className="text-slate-600">
              — Found <strong className="text-slate-950 font-bold">{students.length}</strong> matching student records
            </span>
          </div>
        </div>
      )}
    </div>


  </>);
}

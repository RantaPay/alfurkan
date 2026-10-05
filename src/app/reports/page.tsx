"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Student, ReportSummary, SchoolProfile } from "@/lib/types";
import { formatNaira, formatNumber } from "@/lib/utils";
import {
  Download,
  Printer,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Calendar,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ReportsPage() {
  const [term, setTerm] = useState("1st Term");
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FULL" | "PARTIAL" | "UNPAID">("ALL");
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (term) params.set("term", term);
      if (classFilter !== "ALL") params.set("class", classFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setSummary(data.summary);
        setSchool(data.school);
      }
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [term, classFilter, statusFilter]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (!students.length) return;

    const headers = [
      "Student Name",
      "Registration Number",
      "Class",
      "Parent Name",
      "Parent Phone",
      "Total Term Bill (NGN)",
      "Total Paid (NGN)",
      "Outstanding Debt (NGN)",
      "Payment Status",
      "Last Payment Date",
    ];

    const rows = students.map((s) => [
      `"${s.fullName}"`,
      `"${s.regNumber}"`,
      `"${s.class}"`,
      `"${s.parentName}"`,
      `"${s.parentPhone}"`,
      s.totalTermBill,
      s.totalPaid,
      s.balanceRemaining,
      s.status,
      s.lastPaymentDate || "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `AlFurqan_${statusFilter}_Report_${term.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AuthGuard>
      <SidebarLayout>
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Printable Official Report Header (Shown only during print) */}
        <div className="hidden print:block text-center pb-6 border-b-2 border-slate-900 mb-6">
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
            {school?.name || "AL-FURQAN INTERNATIONAL COLLEGE"}
          </h1>
          <p className="text-xs font-semibold text-slate-600">
            Official Bursary Fee Collection & Debtor Ledger Report • {term} (2026/2027)
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Generated on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} • Authorized by Bursar
          </p>
        </div>

        {/* Page Title & Export Toolbar */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Termly & Monthly Debtor Reports
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Download comprehensive payment reconciliation and outstanding fee lists for Al-Furqan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Download Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#075E54] hover:bg-[#128C7E] text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Executive Report</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar (Hidden during print) */}
        <div className="print:hidden bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Students
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("FULL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "FULL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Full Payment (Cleared)</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PARTIAL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "PARTIAL"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Part Payment Debtors</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("UNPAID")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "UNPAID"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Unpaid Defaulters</span>
            </button>
          </div>

          {/* Period & Class Selectors */}
          <div className="flex items-center gap-3">
            <div>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              >
                <option value="1st Term">1st Term 2026/2027</option>
                <option value="2nd Term">2nd Term 2026/2027</option>
                <option value="3rd Term">3rd Term 2026/2027</option>
              </select>
            </div>

            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              >
                <option value="ALL">All Classes</option>
                <option value="JSS 1">JSS 1</option>
                <option value="JSS 2">JSS 2</option>
                <option value="JSS 3">JSS 3</option>
                <option value="SS 1">SS 1</option>
                <option value="SS 2">SS 2</option>
                <option value="SS 3">SS 3</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
              Expected Revenue
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {summary ? formatNaira(summary.expectedRevenue) : "₦0"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across {summary?.totalStudents || 0} enrolled students
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-emerald-600 block mb-1">
              Total Collections
            </span>
            <div className="text-xl font-black text-emerald-800 font-mono">
              {summary ? formatNaira(summary.collectedRevenue) : "₦0"}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
              {summary?.collectionRate || 0}% collection rate
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-amber-600 block mb-1">
              Outstanding Debt
            </span>
            <div className="text-xl font-black text-amber-700 font-mono">
              {summary ? formatNaira(summary.outstandingDebt) : "₦0"}
            </div>
            <div className="text-[11px] font-bold text-amber-700 mt-0.5">
              {summary?.partialPaymentCount || 0} partial debtors
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
              Payment Breakdown
            </span>
            <div className="text-xs font-bold text-slate-700 space-y-0.5 mt-1">
              <div className="flex justify-between">
                <span>🟢 Fully Cleared:</span>
                <strong className="font-mono text-emerald-700">{summary?.fullPaymentCount || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>🟡 Partial Debt:</span>
                <strong className="font-mono text-amber-700">{summary?.partialPaymentCount || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>🔴 Unpaid Zero:</span>
                <strong className="font-mono text-rose-700">{summary?.unpaidCount || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Students & Debtors Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900">
              Student Debt & Payment Ledger ({students.length} Records)
            </h2>
            <span className="text-xs font-bold text-slate-500">
              Filtered: {statusFilter} • {classFilter}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Reg No</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Parent Contact</th>
                  <th className="py-3 px-3 text-right">Term Bill</th>
                  <th className="py-3 px-3 text-right">Paid to Date</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>

                    <td className="py-3 px-3 font-bold text-slate-900">
                      {student.fullName}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {student.regNumber}
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700">
                      {student.class}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div>{student.parentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{student.parentPhone}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      {formatNaira(student.totalTermBill)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatNaira(student.totalPaid)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={student.balanceRemaining > 0 ? "text-amber-700 font-black" : "text-emerald-700 font-normal"}>
                        {formatNaira(student.balanceRemaining)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {student.status === "FULL" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          CLEARED
                        </span>
                      ) : student.status === "PARTIAL" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                          PARTIAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                          UNPAID
                        </span>
                      )}
                    </td>
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

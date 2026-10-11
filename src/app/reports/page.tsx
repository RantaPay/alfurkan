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
  Landmark,
  RotateCcw,
  Sparkles,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ReportsPage() {
  const [term, setTerm] = useState("1st Term");
  const [classFilter, setClassFilter] = useState("ALL");
  const [bankFilter, setBankFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FULL" | "PARTIAL" | "UNPAID">("ALL");
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideSensitive, setHideSensitive] = useState(false);

  // Sync privacy mask setting from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("alfurqan_hide_sensitive_figures");
    if (saved !== null) {
      setHideSensitive(saved === "true");
    }
  }, []);

  const toggleSensitive = () => {
    setHideSensitive((prev) => {
      const nextVal = !prev;
      localStorage.setItem("alfurqan_hide_sensitive_figures", String(nextVal));
      return nextVal;
    });
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (term) params.set("term", term);
      if (classFilter !== "ALL") params.set("class", classFilter);
      if (bankFilter !== "ALL") params.set("bank", bankFilter);
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
  }, [term, classFilter, bankFilter, statusFilter]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setClassFilter("ALL");
    setBankFilter("ALL");
    setStatusFilter("ALL");
  };

  const hasActiveFilters = classFilter !== "ALL" || bankFilter !== "ALL" || statusFilter !== "ALL";

  // Helper to style bank badge in the ledger
  const renderBankBadge = (student: Student) => {
    if (student.status === "UNPAID" && (!student.paidBanks || student.paidBanks.length === 0)) {
      return <span className="text-slate-400 font-mono text-xs">—</span>;
    }

    const banks = student.paidBanks && student.paidBanks.length > 0 
      ? student.paidBanks 
      : student.paymentBank 
        ? student.paymentBank.split(", ").filter(Boolean) 
        : ["Jaiz Bank"];

    return (
      <div className="flex flex-wrap gap-1 items-center">
        {banks.map((b, i) => {
          const lower = b.toLowerCase();
          let colorClass = "bg-slate-100 text-slate-700 border-slate-200";

          if (lower.includes("gtb")) {
            colorClass = "bg-orange-50 text-orange-800 border-orange-200";
          } else if (lower.includes("jaiz")) {
            colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
          } else if (lower.includes("zenith")) {
            colorClass = "bg-rose-50 text-rose-800 border-rose-200";
          } else if (lower.includes("taj")) {
            colorClass = "bg-teal-50 text-teal-800 border-teal-200";
          } else if (lower.includes("first")) {
            colorClass = "bg-blue-50 text-blue-800 border-blue-200";
          } else if (lower.includes("cash")) {
            colorClass = "bg-amber-50 text-amber-800 border-amber-200";
          }

          return (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border tracking-tight ${colorClass}`}
            >
              <Landmark className="h-3 w-3 shrink-0" />
              <span>{b}</span>
            </span>
          );
        })}
      </div>
    );
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    if (!students.length) return;

    const headers = [
      "Student Name",
      "Registration Number",
      "Class",
      "Parent Name",
      "Parent Phone",
      "Receiving Bank",
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
      `"${s.paymentBank || 'N/A'}"`,
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

    const safeClass = classFilter.replace(/\s+/g, "_");
    const safeBank = bankFilter.replace(/\s+/g, "_");
    link.setAttribute(
      "download",
      `AlFurqan_${safeClass}_${safeBank}_${statusFilter}_Report_${term.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
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
            Official Accountant & Cashier Fee Collection & Debtor Ledger Report • {term} (2026/2027)
          </p>
          <div className="flex justify-center gap-4 text-[11px] font-bold text-slate-700 mt-1">
            <span>Class Filter: {classFilter === "ALL" ? "All Classes" : classFilter}</span>
            <span>•</span>
            <span>Receiving Bank: {bankFilter === "ALL" ? "All Bank Accounts" : bankFilter}</span>
            <span>•</span>
            <span>Payment Status: {statusFilter}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Generated on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} • Total Records: {students.length} • Certified by Chief Accountant & Authorized Cashier
          </p>
        </div>

        {/* Page Title & Export Toolbar */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Accountant & Cashier Debtor Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Reconcile fee collections, audit cashier intake, identify debtors, and filter collections across specific classes and receiving bank accounts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sensitive Figures Eye Mask Toggle */}
            <button
              type="button"
              onClick={toggleSensitive}
              aria-label={hideSensitive ? "Show sensitive figures" : "Hide sensitive figures"}
              title={hideSensitive ? "Show sensitive figures" : "Hide sensitive figures (Mask with asterisks)"}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                hideSensitive
                  ? "bg-emerald-50 text-[#075E54] border-emerald-300 hover:bg-emerald-100 ring-2 ring-emerald-500/20"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              {hideSensitive ? (
                <>
                  <Eye className="h-4.5 w-4.5 text-[#075E54]" />
                  <span>Show Figures</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4.5 w-4.5 text-slate-500" />
                  <span>Hide Figures</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={students.length === 0}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
              <span>Download Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#075E54] hover:bg-[#128C7E] text-white px-4.5 py-2.5 rounded-xl text-sm font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="h-4.5 w-4.5" />
              <span>Print Executive Report</span>
            </button>
          </div>
        </div>

        {/* Filters Container (Hidden during print) */}
        <div className="print:hidden bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          {/* Main Filter Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
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
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === "FULL"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Full Payment (Cleared)</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PARTIAL")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === "PARTIAL"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Part Payment Debtors</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("UNPAID")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === "UNPAID"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Unpaid Defaulters</span>
              </button>
            </div>

            {/* Dropdown Filters: Term, Class, and Bank */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Term Selector */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                <Calendar className="h-4 w-4 text-slate-400 ml-1" />
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="h-9 px-1 text-sm font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="1st Term">1st Term 2026/2027</option>
                  <option value="2nd Term">2nd Term 2026/2027</option>
                  <option value="3rd Term">3rd Term 2026/2027</option>
                </select>
              </div>

              {/* Class Selector */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                <Users className="h-4 w-4 text-slate-400 ml-1" />
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="h-9 px-1 text-sm font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
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

              {/* Bank Selector (Requested Feature) */}
              <div className="flex items-center gap-1 bg-emerald-50/70 border border-emerald-200 px-2.5 py-1 rounded-xl">
                <Landmark className="h-4 w-4 text-emerald-700 ml-1" />
                <select
                  value={bankFilter}
                  onChange={(e) => setBankFilter(e.target.value)}
                  className="h-9 px-1 text-sm font-black text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Payment Banks</option>
                  <option value="GTBank">GTBank</option>
                  <option value="Jaiz Bank">Jaiz Bank</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="Taj Bank">Taj Bank</option>
                  <option value="First Bank">First Bank</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Presets Bar (Specific Examples requested by User) */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mr-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Quick Presets:
              </span>

              {/* Preset 1: JSS 1 paid to GTBank */}
              <button
                type="button"
                onClick={() => {
                  setClassFilter("JSS 1");
                  setBankFilter("GTBank");
                  setStatusFilter("ALL");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  classFilter === "JSS 1" && bankFilter === "GTBank"
                    ? "bg-orange-100 text-orange-900 border-orange-300 ring-2 ring-orange-400/30"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-600" />
                <span>JSS 1 • GTBank Collections</span>
              </button>

              {/* Preset 2: SS 2 paid to Jaiz Bank */}
              <button
                type="button"
                onClick={() => {
                  setClassFilter("SS 2");
                  setBankFilter("Jaiz Bank");
                  setStatusFilter("ALL");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  classFilter === "SS 2" && bankFilter === "Jaiz Bank"
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300 ring-2 ring-emerald-400/30"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>SS 2 • Jaiz Bank Collections</span>
              </button>

              {/* Preset 3: All Part-Payment Debtors */}
              <button
                type="button"
                onClick={() => {
                  setClassFilter("ALL");
                  setBankFilter("ALL");
                  setStatusFilter("PARTIAL");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === "PARTIAL" && classFilter === "ALL" && bankFilter === "ALL"
                    ? "bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/30"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>All Part Debtors</span>
              </button>
            </div>

            {/* Clear / Reset Filter Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-rose-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Active Filter Summary Bar */}
          {hasActiveFilters && (
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-2.5 text-slate-700 font-medium">
                <span className="font-black text-emerald-900">Active Criteria:</span>
                {classFilter !== "ALL" && (
                  <span className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 font-black">
                    Class: {classFilter}
                  </span>
                )}
                {bankFilter !== "ALL" && (
                  <span className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 font-black">
                    Bank: {bankFilter}
                  </span>
                )}
                {statusFilter !== "ALL" && (
                  <span className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 font-black">
                    Status: {statusFilter}
                  </span>
                )}
                <span className="text-slate-600">
                  — Found <strong className="text-slate-950 font-bold">{students.length}</strong> matching student records
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Expected Revenue
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {hideSensitive ? "₦ * * * * * *" : summary ? formatNaira(summary.expectedRevenue) : "₦0"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across {hideSensitive ? "* *" : (summary?.totalStudents || 0)} filtered students
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Total Collections
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono tracking-tight">
              {hideSensitive ? "₦ * * * * * *" : summary ? formatNaira(summary.collectedRevenue) : "₦0"}
            </div>
            <div className="text-xs font-bold text-emerald-700 mt-1">
              {hideSensitive ? "**%" : `${summary?.collectionRate || 0}%`} collection rate
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
              Outstanding Debt
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono tracking-tight">
              {hideSensitive ? "₦ * * * * * *" : summary ? formatNaira(summary.outstandingDebt) : "₦0"}
            </div>
            <div className="text-xs font-bold text-amber-700 mt-1">
              {hideSensitive ? "* *" : (summary?.partialPaymentCount || 0)} partial debtors
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Payment Breakdown
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-700 space-y-1 mt-1">
              <div className="flex justify-between">
                <span>🟢 Fully Cleared:</span>
                <strong className="font-mono text-emerald-700 font-black">
                  {hideSensitive ? "* *" : (summary?.fullPaymentCount || 0)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>🟡 Partial Debt:</span>
                <strong className="font-mono text-amber-700 font-black">
                  {hideSensitive ? "* *" : (summary?.partialPaymentCount || 0)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>🔴 Unpaid Zero:</span>
                <strong className="font-mono text-rose-700 font-black">
                  {hideSensitive ? "* *" : (summary?.unpaidCount || 0)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Reconciliation Matrix (Treasury Breakdown) */}
        {summary?.bankReconciliation && summary.bankReconciliation.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-[#075E54] border border-emerald-200">
                  <Landmark className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Bank Reconciliation & Treasury Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Verified collections by receiving bank account • Click any bank card to filter ledger
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
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/30"
                        : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xs font-black text-slate-900 line-clamp-1">
                        {bank.bankName}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {bank.percentage}%
                      </span>
                    </div>

                    <div className="text-sm sm:text-base font-black text-emerald-800 font-mono">
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

        {/* Detailed Students & Debtors Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Student Debt & Payment Ledger ({students.length} Records)
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
              <div className="py-16 text-center text-slate-400">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm font-bold">Loading report data...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="py-16 text-center">
                <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Filter className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">No student records match this filter</h3>
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
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
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
                        {renderBankBadge(student)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 text-sm sm:text-base">
                        {hideSensitive ? "₦ * * * * * *" : formatNaira(student.totalTermBill)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm sm:text-base">
                        {hideSensitive ? "₦ * * * * * *" : formatNaira(student.totalPaid)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-sm sm:text-base">
                        <span className={student.balanceRemaining > 0 ? "text-amber-700 font-black" : "text-emerald-700 font-normal"}>
                          {hideSensitive ? "₦ * * * * * *" : formatNaira(student.balanceRemaining)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {student.status === "FULL" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                            CLEARED
                          </span>
                        ) : student.status === "PARTIAL" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                            UNPAID
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
      </SidebarLayout>
    </AuthGuard>
  );
}

"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Student, ReportSummary, SchoolProfile } from "@/lib/types";
import { formatNaira, formatNumber } from "@/lib/utils";
import {
  Download,
  Filter,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Calendar,
  Landmark,
  RotateCcw,
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

  // Helper to style bank badge
  const renderBankBadge = (student: Student) => {
    if (student.status === "UNPAID" && (!student.paidBanks || student.paidBanks.length === 0)) {
      return <span className="text-slate-400 font-mono text-xs">—</span>;
    }

    const banks = student.paidBanks && student.paidBanks.length > 0 
      ? student.paidBanks 
      : student.paymentBank && student.paymentBank !== "—"
        ? student.paymentBank.split(", ").filter(Boolean) 
        : [];

    if (banks.length === 0) {
      return <span className="text-slate-400 font-mono text-xs">—</span>;
    }

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

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    if (!students.length) return;
    setIsDownloadingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const formatPdfCurrency = (amount: number) => {
        return "NGN " + (Number(amount) || 0).toLocaleString();
      };

      // Header: School Name & Motto
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(7, 94, 84);
      doc.text(school?.name || "ALFURQAN INTERNATIONAL ACADEMY", 14, 15);

      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${school?.motto || "Knowledge & Guidance"} • ${school?.address || "Along Dass Road, Bauchi State"}`,
        14,
        21
      );

      // Title & Generation Metadata
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      const activeSession = school?.currentSession || "2026/2027";
      doc.text(`Fee Collection & Debtor Report — ${term} (${activeSession})`, 14, 29);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const statusLabel =
        statusFilter === "ALL"
          ? "All Students"
          : statusFilter === "FULL"
          ? "Full Payment (Cleared)"
          : statusFilter === "PARTIAL"
          ? "Part Payment Debtors"
          : "Unpaid Defaulters";
      doc.text(
        `Generated on: ${dateStr} • Filters: Class [${classFilter === "ALL" ? "All Classes" : classFilter}], Bank [${bankFilter === "ALL" ? "All Banks" : bankFilter}], Status [${statusLabel}]`,
        14,
        34
      );

      // Summary Box Banner
      doc.setFillColor(245, 247, 248);
      doc.roundedRect(14, 37, 269, 13, 2, 2, "F");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);

      const billedStr = formatPdfCurrency(summary?.expectedRevenue || 0);
      const paidStr = formatPdfCurrency(summary?.collectedRevenue || 0);
      const debtStr = formatPdfCurrency(summary?.outstandingDebt || 0);
      const countStr = `${students.length} Students`;

      doc.text(`Total Billed: ${billedStr}`, 18, 45);
      doc.text(`Total Collected: ${paidStr}`, 80, 45);
      doc.setTextColor(180, 40, 40);
      doc.text(`Outstanding Debt: ${debtStr}`, 155, 45);
      doc.setTextColor(30, 30, 30);
      doc.text(`Total Records: ${countStr}`, 235, 45);

      // Prepare table rows
      const tableBody = students.map((s, idx) => [
        String(idx + 1),
        s.fullName,
        s.regNumber,
        s.class,
        s.parentName ? `${s.parentName} (${s.parentPhone || ""})` : s.parentPhone || "—",
        s.totalTermBill > 0 ? formatPdfCurrency(s.totalTermBill) : "—",
        s.totalPaid > 0 ? formatPdfCurrency(s.totalPaid) : "—",
        s.totalTermBill === 0 ? "—" : s.balanceRemaining > 0 ? formatPdfCurrency(s.balanceRemaining) : "₦0",
        s.totalTermBill === 0 ? "Nil" : s.status === "FULL" ? "CLEARED" : s.status === "PARTIAL" ? "PARTIAL" : "UNPAID",
        s.paymentBank || "—",
      ]);

      autoTable(doc, {
        startY: 53,
        head: [
          [
            "#",
            "Student Name",
            "Admission No",
            "Class",
            "Parent & Phone",
            "Term Bill",
            "Paid to Date",
            "Balance Due",
            "Status",
            "Bank",
          ],
        ],
        body: tableBody,
        headStyles: {
          fillColor: [7, 94, 84],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          valign: "middle",
        },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 45, fontStyle: "bold" },
          2: { cellWidth: 24, fontStyle: "bold" },
          3: { cellWidth: 20 },
          4: { cellWidth: 50 },
          5: { cellWidth: 26, halign: "right" },
          6: { cellWidth: 26, halign: "right" },
          7: { cellWidth: 26, halign: "right", fontStyle: "bold" },
          8: { cellWidth: 22, halign: "center" },
          9: { cellWidth: 22 },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(130, 130, 130);
          doc.text(
            `Alfurqan International Academy • Debtor Report • Page ${data.pageNumber} of ${pageCount} • Bursary & Accounts`,
            14,
            202
          );
        },
      });

      const safeClass = classFilter.replace(/\s+/g, "_");
      const safeTerm = term.replace(/\s+/g, "_");
      doc.save(
        `AlFurqan_${safeClass}_Debtor_Report_${safeTerm}_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <AuthGuard>
      <SidebarLayout>
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title & Export Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              School Fee &amp; Debtor Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track fee collections, identify outstanding balances, and filter reports by class or bank account
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
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf || students.length === 0}
              className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4.5 py-2.5 rounded-xl text-sm font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4.5 w-4.5" />
              <span>{isDownloadingPdf ? "Preparing PDF..." : "Download PDF Report"}</span>
            </button>
          </div>
        </div>

        {/* Filters Container */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          {/* Main Filter Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Payment Status Dropdown (Screenshot 2 converted to dropdown) */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                <Filter className="h-4 w-4 text-slate-500 ml-1" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "ALL" | "FULL" | "PARTIAL" | "UNPAID")}
                  className="h-9 px-1 text-sm font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Students</option>
                  <option value="FULL">Full Payment (Cleared)</option>
                  <option value="PARTIAL">Part Payment Debtors</option>
                  <option value="UNPAID">Unpaid Defaulters</option>
                </select>
              </div>

              {/* Term Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                <Calendar className="h-4 w-4 text-slate-500 ml-1" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Term:</span>
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class:</span>
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
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Bank:</span>
                <select
                  value={bankFilter}
                  onChange={(e) => setBankFilter(e.target.value)}
                  className="h-9 px-1 text-sm font-black text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
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
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-2.5 text-slate-700 font-medium">
                <span className="font-black text-emerald-900">Active Criteria:</span>
                {statusFilter !== "ALL" && (
                  <span className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 font-black">
                    Status: {statusFilter === "FULL" ? "Full Payment" : statusFilter === "PARTIAL" ? "Part Payment Debtors" : "Unpaid Defaulters"}
                  </span>
                )}
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
              <div className="py-24 text-center">
                <div className="flex items-center justify-center">
                  <div className="h-10 w-10 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin" />
                </div>
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
                        <span className={student.balanceRemaining > 0 ? "text-amber-700 font-black" : "text-slate-400 font-normal"}>
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
                        {student.totalTermBill === 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            Nil
                          </span>
                        ) : student.status === "FULL" ? (
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

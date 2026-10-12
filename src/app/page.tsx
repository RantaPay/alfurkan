"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { QuickStudentSearch } from "@/components/dashboard/QuickStudentSearch";
import { ReceiptModal } from "@/components/receipts/ReceiptModal";
import { Student, Receipt } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  Receipt as ReceiptIcon,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Printer,
  MessageSquare,
  Users,
  Search,
  Sparkles,
  UserPlus,
  Upload,
  Database,
  Eye,
  EyeOff,
} from "lucide-react";
import { AddStudentModal } from "@/components/students/AddStudentModal";
import { DatabaseImportModal } from "@/components/students/DatabaseImportModal";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiptFilter, setReceiptFilter] = useState<"ALL" | "FULL" | "PARTIAL">("ALL");
  const [hideSensitive, setHideSensitive] = useState(false);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, repRes] = await Promise.all([
        fetch("/api/receipts?limit=15"),
        fetch("/api/reports"),
      ]);
      const recData = await recRes.json();
      const repData = await repRes.json();

      if (recData.success) {
        setReceipts(recData.receipts);
      }
      if (repData.success) {
        setStats(repData.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenIssueModal = (student?: Student) => {
    if (student) {
      setSelectedStudentForReceipt(student);
    } else {
      setSelectedStudentForReceipt(null);
    }
    setIsModalOpen(true);
  };

  const filteredReceipts = receipts.filter((r) => {
    if (receiptFilter === "ALL") return true;
    return r.paymentStatus === receiptFilter;
  });

  return (
    <AuthGuard>
      <SidebarLayout onOpenIssueModal={() => handleOpenIssueModal()}>
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section & Quick Receipt Generator Launcher */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#075E54] via-[#0b6e63] to-[#043e37] p-6 sm:p-10 text-white shadow-xl shadow-emerald-950/10">
          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#FFB21D]" />
                <span>Official Bursary &amp; Accounts Portal</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs font-bold border border-white/25 transition-all cursor-pointer shadow-xs"
                  title="Upload student list spreadsheet"
                >
                  <Upload className="h-3.5 w-3.5 text-[#FFB21D]" />
                  <span>Upload Students</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 text-xs font-semibold border border-white/15 transition-all cursor-pointer"
                  title="Enroll a single student"
                >
                  <UserPlus className="h-3.5 w-3.5 text-emerald-200" />
                  <span>Enroll Student</span>
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Al-Furqan Digital Receipts &amp; Bursary Portal
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Search students by admission number, record school fee payments, and issue receipts.
            </p>

            {/* Prominent Quick Student Search Bar */}
            <div className="mt-6 pt-2">
              <QuickStudentSearch
                onSelectStudent={(student) => handleOpenIssueModal(student)}
              />
            </div>
          </div>

          {/* Decorative ambient badge */}
          <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none select-none text-9xl font-black">
            AIA
          </div>
        </div>

        {/* Financial Metrics Header & Sensitive Masking Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Financial Key Metrics
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                Active Term
              </span>
            </div>

            {/* Privacy Eye Mask Toggle */}
            <button
              type="button"
              onClick={toggleSensitive}
              aria-label={hideSensitive ? "Show sensitive figures" : "Hide sensitive figures"}
              title={hideSensitive ? "Show sensitive figures" : "Hide sensitive figures (Mask with asterisks)"}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                hideSensitive
                  ? "bg-emerald-50 text-[#075E54] border-emerald-200 hover:bg-emerald-100"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
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
          </div>

          {/* 4 Financial Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Total Collections */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">Collected Revenue</span>
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {hideSensitive ? "₦ * * * * * *" : stats ? formatNaira(stats.collectedRevenue) : "₦0"}
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1">
                <span>{hideSensitive ? "**%" : `${stats?.collectionRate || 0}%`} collection rate</span>
                <span className="text-slate-400">• of {hideSensitive ? "₦ * * * * * *" : formatNaira(stats?.expectedRevenue || 0)}</span>
              </div>
            </div>

            {/* Full Payments (Cleared Students) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">Paid In Full (Cleared)</span>
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {hideSensitive ? "* *" : (stats?.fullPaymentCount || 0)}{" "}
                <span className="text-sm font-bold text-slate-400">Students</span>
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-1.5">
                100% Cleared
              </div>
            </div>

            {/* Partial Payment Debtors */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">Part Payment Debtors</span>
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900 font-mono">
                {hideSensitive ? "* *" : (stats?.partialPaymentCount || 0)}{" "}
                <span className="text-sm font-bold text-slate-400">Students</span>
              </div>
              <div className="text-xs font-bold text-amber-700 mt-1.5 truncate">
                Outstanding Debt: {hideSensitive ? "₦ * * * * * *" : formatNaira(stats?.outstandingDebt || 0)}
              </div>
            </div>

            {/* Unpaid */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">Unpaid</span>
                <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-900 font-mono">
                {hideSensitive ? "* *" : (stats?.unpaidCount || 0)}{" "}
                <span className="text-sm font-bold text-slate-400">Students</span>
              </div>
              <div className="text-xs font-semibold text-rose-700 mt-1.5">
                <Link href="/reports?status=UNPAID" className="hover:underline flex items-center gap-1 font-bold">
                  <span>View Unpaid List</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Receipts Section with Filter Pills */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Recent Issued Receipts</span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {filteredReceipts.length}
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Receipts recorded in the system
              </p>
            </div>

            {/* Filter Pills: All, Full Payment, Part Payment */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setReceiptFilter("ALL")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  receiptFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Receipts
              </button>
              <button
                type="button"
                onClick={() => setReceiptFilter("FULL")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  receiptFilter === "FULL"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Paid In Full</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptFilter("PARTIAL")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  receiptFilter === "PARTIAL"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Part Payment</span>
              </button>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                  <th className="py-3 px-3">Receipt No</th>
                  <th className="py-3 px-3">Student & Class</th>
                  <th className="py-3 px-3">Status Badge</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3">Balance Due</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex items-center justify-center py-6">
                        <div className="h-10 w-10 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredReceipts.length > 0 ? (
                  filteredReceipts.map((receipt) => {
                    const isFull = receipt.paymentStatus === "FULL" || receipt.balanceRemaining === 0;

                    return (
                      <tr key={receipt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <Link
                            href={`/receipts/${receipt.id}`}
                            className="font-mono font-black text-[#075E54] hover:underline text-sm"
                          >
                            {receipt.receiptNumber}
                          </Link>
                          <div className="text-xs text-slate-400 font-sans">
                            {receipt.paymentMethod}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 text-sm sm:text-base">
                            {receipt.studentName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {receipt.regNumber} • <span className="font-sans font-semibold text-slate-700">{receipt.studentClass}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {receipt.isVoided ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span>VOIDED</span>
                            </span>
                          ) : isFull ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>PAID IN FULL</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                              <span>PART PAYMENT</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 font-mono font-black text-slate-900 text-sm sm:text-base">
                          {hideSensitive ? "₦ * * * * *" : formatNaira(receipt.amountPaid)}
                        </td>

                        <td className="py-3.5 px-3 font-mono font-bold text-sm sm:text-base">
                          <span className={receipt.balanceRemaining > 0 ? "text-amber-700" : "text-emerald-700"}>
                            {hideSensitive ? "₦ * * * * *" : formatNaira(receipt.balanceRemaining)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-500 text-xs font-medium">
                          {receipt.date}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/receipts/${receipt.id}`}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View / Print Receipt"
                            >
                              <ExternalLink className="h-4.5 w-4.5" />
                            </Link>

                            {/* 1-Click WhatsApp Share */}
                            <a
                              href={`https://wa.me/234${receipt.parentPhone.replace(/^0/, "")}?text=${encodeURIComponent(
                                `Assalamu Alaikum ${receipt.parentName},\n\nPayment confirmation for ${receipt.studentName} (${receipt.regNumber}) at Al-Furqan International Academy.\n\n• Receipt No: ${receipt.receiptNumber}\n• Amount Paid: ${formatNaira(receipt.amountPaid)}\n• Status: ${receipt.isVoided ? "VOIDED / REVOKED" : isFull ? "PAID IN FULL (CLEARED)" : `PARTIAL PAYMENT (Balance: ${formatNaira(receipt.balanceRemaining)})`}\n\nView or download digital receipt:\nhttps://alfurqan.edu.ng/receipts/${receipt.id}\n\nThank you.\nAccounts Department, Al-Furqan International Academy`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Share to Parent WhatsApp"
                            >
                              <MessageSquare className="h-4.5 w-4.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                      <div className="max-w-md mx-auto space-y-1.5">
                        <ReceiptIcon className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">No receipts issued yet</p>
                        <p className="text-xs text-slate-400">
                          Search for a student above or click "Issue Receipt" to record a fee payment.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>Showing recent receipts issued this term</span>
            <Link href="/receipts" className="font-bold text-[#075E54] hover:underline flex items-center gap-1.5">
              <span>View Full Receipts Ledger</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Issue Receipt Modal */}
      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedStudent={selectedStudentForReceipt}
        onReceiptCreated={() => loadData()}
      />

        {/* Upload Excel / CSV Database Import Modal */}
        <DatabaseImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={() => loadData()}
        />

        {/* Add Student Single Enrollment Modal */}
        <AddStudentModal
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          onStudentAdded={() => loadData()}
        />
      </SidebarLayout>
    </AuthGuard>
  );
}

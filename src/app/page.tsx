"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
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
} from "lucide-react";

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiptFilter, setReceiptFilter] = useState<"ALL" | "FULL" | "PARTIAL">("ALL");

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <Navbar onOpenIssueModal={() => handleOpenIssueModal()} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section & Quick Receipt Generator Launcher */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#075E54] via-[#0b6e63] to-[#043e37] p-6 sm:p-10 text-white shadow-xl shadow-emerald-950/10">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold border border-white/20 mb-4 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#FFB21D]" />
              <span>Official School Bursary Platform</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Al-Furqan Digital Receipts & Bursary OS
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Instantly search students by registration number, record bank transfers, and issue verifiable digital receipts with full vs. part-payment badges.
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
            AFIC
          </div>
        </div>

        {/* 4 Financial Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Collections */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Collected Revenue</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {stats ? formatNaira(stats.collectedRevenue) : "₦0"}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
              <span>{stats?.collectionRate || 0}% collection rate</span>
              <span className="text-slate-400">• of {formatNaira(stats?.expectedRevenue || 0)}</span>
            </div>
          </div>

          {/* Full Payments (Cleared Students) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Paid In Full (Cleared)</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {stats?.fullPaymentCount || 0}{" "}
              <span className="text-xs font-bold text-slate-400">Students</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">
              100% Cleared • Granted gate & exam pass
            </div>
          </div>

          {/* Partial Payment Debtors */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Part Payment Debtors</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-900 font-mono">
              {stats?.partialPaymentCount || 0}{" "}
              <span className="text-xs font-bold text-slate-400">Students</span>
            </div>
            <div className="text-[11px] font-bold text-amber-700 mt-1 truncate">
              Outstanding Debt: {formatNaira(stats?.outstandingDebt || 0)}
            </div>
          </div>

          {/* Unpaid / Zero Payment Defaulters */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Zero Payment Defaulters</span>
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-900 font-mono">
              {stats?.unpaidCount || 0}{" "}
              <span className="text-xs font-bold text-slate-400">Students</span>
            </div>
            <div className="text-[11px] font-semibold text-rose-700 mt-1">
              <Link href="/reports?status=UNPAID" className="hover:underline flex items-center gap-1">
                <span>View Debtor Defaulters List</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Receipts Section with Filter Pills */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Recent Issued Receipts</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredReceipts.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official receipts generated for Al-Furqan students
              </p>
            </div>

            {/* Filter Pills: All, Full Payment, Part Payment */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setReceiptFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  receiptFilter === "FULL"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Paid In Full</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptFilter("PARTIAL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  receiptFilter === "PARTIAL"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>Part Payment</span>
              </button>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
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
                {filteredReceipts.map((receipt) => {
                  const isFull = receipt.paymentStatus === "FULL" || receipt.balanceRemaining === 0;

                  return (
                    <tr key={receipt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <Link
                          href={`/receipts/${receipt.id}`}
                          className="font-mono font-black text-[#075E54] hover:underline"
                        >
                          {receipt.receiptNumber}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {receipt.paymentMethod}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">
                          {receipt.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {receipt.regNumber} • <span className="font-sans font-semibold text-slate-700">{receipt.studentClass}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {isFull ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>PAID IN FULL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>PART PAYMENT</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-black text-slate-900 text-sm">
                        {formatNaira(receipt.amountPaid)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold">
                        <span className={receipt.balanceRemaining > 0 ? "text-amber-700" : "text-emerald-700"}>
                          {formatNaira(receipt.balanceRemaining)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        {receipt.date}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/receipts/${receipt.id}`}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View / Print Receipt"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>

                          {/* 1-Click WhatsApp Share */}
                          <a
                            href={`https://wa.me/234${receipt.parentPhone.replace(/^0/, "")}?text=${encodeURIComponent(
                              `Assalamu Alaikum ${receipt.parentName},\n\nPayment confirmation for ${receipt.studentName} (${receipt.regNumber}) at Al-Furqan International College.\n\n• Receipt No: ${receipt.receiptNumber}\n• Amount Paid: ${formatNaira(receipt.amountPaid)}\n• Status: ${isFull ? "PAID IN FULL (CLEARED)" : `PARTIAL PAYMENT (Balance: ${formatNaira(receipt.balanceRemaining)})`}\n\nView or download official digital receipt:\nhttps://alfurqan.edu.ng/receipts/${receipt.id}\n\nThank you.\nBursary Department, Al-Furqan International College`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Share to Parent WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing recent receipts issued this term</span>
            <Link href="/receipts" className="font-bold text-[#075E54] hover:underline flex items-center gap-1">
              <span>View Full Receipts Ledger</span>
              <ArrowRight className="h-3 w-3" />
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
    </div>
  );
}

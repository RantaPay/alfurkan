"use client";
import { InlineNotice, LoadingRows } from "@/components/ui/feedback";
import { PaymentStatus } from "@/components/ui/payment-status";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { QuickStudentSearch } from "@/components/dashboard/QuickStudentSearch";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ReceiptModal } from "@/components/receipts/ReceiptModal";
import { AddStudentModal } from "@/components/students/AddStudentModal";
import { DatabaseImportModal } from "@/components/students/DatabaseImportModal";
import { PageHeader } from "@/components/ui/page-header";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { formatNaira } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  MessageSquare,
  Receipt as ReceiptIcon,
  TrendingUp,
  Upload,
  UserPlus
} from "lucide-react";
import Link from "next/link";


export default function DashboardPage() {
  const form = useDashboard();
  const { error, isModalOpen, setIsModalOpen, isAddStudentOpen, setIsAddStudentOpen, isImportModalOpen, setIsImportModalOpen, selectedStudentForReceipt, stats, loading, receiptFilter, setReceiptFilter, hideSensitive, toggleSensitive, loadData, handleOpenIssueModal, filteredReceipts } = form;
  return (
    <AuthGuard>
      <SidebarLayout onOpenIssueModal={() => handleOpenIssueModal()}>
        <main className="app-page space-y-8">
        {error && <InlineNotice onRetry={loadData}>{error}</InlineNotice>}
        <PageHeader title="Overview" description="Record payments and keep track of school accounts." actions={<>
          <button type="button" className="button-secondary" onClick={() => setIsImportModalOpen(true)}><Upload className="h-4 w-4" />Import students</button>
          <button type="button" className="button-secondary" onClick={() => setIsAddStudentOpen(true)}><UserPlus className="h-4 w-4" />Add student</button>
        </>} />
        <section className="panel p-5 sm:p-6" aria-labelledby="record-payment-heading">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div><h2 id="record-payment-heading" className="text-lg font-semibold text-slate-900">Record a payment</h2><p className="mt-1 text-sm text-slate-500">Find a student or start a receipt for an external payer.</p></div>
            <button type="button" className="button-accent" onClick={() => handleOpenIssueModal()}><ReceiptIcon className="h-4 w-4" />Issue receipt</button>
          </div>
          <QuickStudentSearch onSelectStudent={handleOpenIssueModal} />
        </section>

        {/* Financial Metrics Header & Sensitive Masking Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800  tracking-normal">
                This term
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
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs  transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs sm:text-sm font-bold  tracking-normal text-slate-600">Total collected</span>
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono tracking-tight">
                {hideSensitive ? "₦ * * * * * *" : stats ? formatNaira(stats.collectedRevenue) : "₦0"}
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1">
                <span>{hideSensitive ? "**%" : `${stats?.collectionRate || 0}%`} collection rate</span>
                <span className="text-slate-400">• of {hideSensitive ? "₦ * * * * * *" : formatNaira(stats?.expectedRevenue || 0)}</span>
              </div>
            </div>

            {/* Full Payments (Cleared Students) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs  transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs sm:text-sm font-bold  tracking-normal text-slate-600">Paid in full</span>
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono">
                {hideSensitive ? "* *" : (stats?.fullPaymentCount || 0)}{" "}
                <span className="text-sm font-bold text-slate-400">Students</span>
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-1.5">
                No outstanding balance
              </div>
            </div>

            {/* Partial Payment Debtors */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs  transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs sm:text-sm font-bold  tracking-normal text-slate-600">Part paid</span>
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-amber-900 font-mono">
                {hideSensitive ? "* *" : (stats?.partialPaymentCount || 0)}{" "}
                <span className="text-sm font-bold text-slate-400">Students</span>
              </div>
              <div className="text-xs font-bold text-amber-700 mt-1.5 truncate">
                Outstanding Debt: {hideSensitive ? "₦ * * * * * *" : formatNaira(stats?.outstandingDebt || 0)}
              </div>
            </div>

            {/* Unpaid */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs  transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs sm:text-sm font-bold  tracking-normal text-slate-600">Unpaid</span>
                <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-rose-900 font-mono">
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
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <span>Recent Issued Receipts</span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {filteredReceipts.length}
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Receipts recorded in the system
              </p>
            </div>

            {/* Filter Pills: All, Full Payment, Part paid */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit">
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
                <span>Part paid</span>
              </button>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[52rem] w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold  text-xs tracking-normal border-b border-slate-100">
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
                  <tr><td colSpan={7} className="px-5 py-3"><LoadingRows label="Loading receipts" /></td></tr>
                ) : filteredReceipts.length > 0 ? (
                  filteredReceipts.map((receipt) => {
                    const isFull = receipt.paymentStatus === "FULL";

                    return (
                      <tr key={receipt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <Link
                            href={`/receipts/${receipt.id}`}
                            className="font-mono font-semibold text-[#075E54] hover:underline text-sm"
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
                          <PaymentStatus status={receipt.paymentStatus} voided={receipt.isVoided} />
                        </td>

                        <td className="py-3.5 px-3 font-mono font-semibold text-slate-900 text-sm sm:text-base">
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
                                `Assalamu Alaikum ${receipt.parentName},\n\nPayment confirmation for ${receipt.studentName} (${receipt.regNumber}) at Alfurqan International Academy.\n\n• Receipt No: ${receipt.receiptNumber}\n• Amount Paid: ${formatNaira(receipt.amountPaid)}\n• Status: ${receipt.isVoided ? "VOIDED / REVOKED" : isFull ? "PAID IN FULL (CLEARED)" : `PARTIAL PAYMENT (Balance: ${formatNaira(receipt.balanceRemaining)})`}\n\nView or download digital receipt:\nhttps://alfurqan.edu.ng/receipts/${receipt.id}\n\nThank you.\nAccounts Department, Alfurqan International Academy`
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
                          Search for a student above or click &quot;Issue receipt&quot; to record a fee payment.
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
              <span>View All Receipts</span>
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

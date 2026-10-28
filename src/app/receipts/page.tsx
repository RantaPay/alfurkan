"use client";
import { InlineNotice, LoadingRows } from "@/components/ui/feedback";
import { PaymentStatus } from "@/components/ui/payment-status";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useReceiptsPage } from "@/features/receipts/useReceiptsPage";
import { formatNaira } from "@/lib/utils";
import {
  ExternalLink,
  Landmark,
  MessageSquare,
  Receipt as ReceiptIcon,
  Search
} from "lucide-react";
import Link from "next/link";


export default function ReceiptsPage() {
  const form = useReceiptsPage();
  const { error, reload, query, setQuery, statusFilter, setStatusFilter, bankFilter, setBankFilter, loading, uniqueBanks, filtered } = form;
  return (
    <AuthGuard>
      <SidebarLayout>
        <main className="app-page space-y-6">
        {error && <InlineNotice onRetry={reload}>{error}</InlineNotice>}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Receipts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Search, view, and print fee payment receipts
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="search" aria-label="Search records"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search receipt no, student, reg no, or ref..."
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            {/* Bank Filter Dropdown */}
            <div className="flex items-center gap-1 bg-emerald-50/70 border border-emerald-200 px-3 py-1 rounded-xl h-11 self-stretch sm:self-auto">
              <Landmark className="h-4 w-4 text-emerald-700 ml-0.5" />
              <select aria-label="Filter by bank"
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
                disabled={loading}
                className="h-full px-1 text-xs sm:text-sm font-semibold text-emerald-900 bg-transparent focus:outline-none cursor-pointer disabled:opacity-60"
              >
                <option value="ALL">All Payment Banks</option>
                {!loading &&
                  uniqueBanks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                {!loading && <option value="Cash">Cash</option>}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Receipts
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("FULL")}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                statusFilter === "FULL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Paid In Full
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PARTIAL")}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                statusFilter === "PARTIAL"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Part paid
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("VOIDED")}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                statusFilter === "VOIDED"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Voided
            </button>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 sm:p-7 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[52rem] w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold  text-xs tracking-normal border-b border-slate-100">
                  <th className="py-3 px-3">Receipt Number</th>
                  <th className="py-3 px-3">Student Name & Reg No</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Amount Paid</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-3"><LoadingRows label="Loading receipts" /></td></tr>
                ) : filtered.length > 0 ? (
                  filtered.map((receipt) => {
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
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {receipt.bankName || receipt.paymentMethod}
                            </span>
                            <span className="text-[10px] text-emerald-800 font-semibold truncate max-w-[140px]" title={`Issued by: ${receipt.issuedBy}`}>
                              • Issued by: {receipt.issuedBy?.split(" ")[0] || "Accounts"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 text-sm sm:text-base">{receipt.studentName}</div>
                          <div className="font-mono text-xs text-slate-500">{receipt.regNumber}</div>
                        </td>

                        <td className="py-3.5 px-3 font-medium text-slate-700 text-sm">
                          {receipt.studentClass}
                        </td>

                        <td className="py-3.5 px-3">
                          <PaymentStatus status={receipt.paymentStatus} voided={receipt.isVoided} />
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-900 text-sm sm:text-base">
                          {formatNaira(receipt.amountPaid)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-sm sm:text-base">
                          <span className={receipt.balanceRemaining > 0 ? "text-amber-700" : "text-emerald-700"}>
                            {formatNaira(receipt.balanceRemaining)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-500 text-xs font-medium">
                          {receipt.date}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/receipts/${receipt.id}`}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View / Print Receipt"
                            >
                              <ExternalLink className="h-4.5 w-4.5" />
                            </Link>

                            <a
                              href={`https://wa.me/234${receipt.parentPhone.replace(/^0/, "")}?text=${encodeURIComponent(
                                `Assalamu Alaikum ${receipt.parentName},\n\nPayment confirmation for ${receipt.studentName} at Alfurqan International Academy.\nReceipt: ${receipt.receiptNumber}\nAmount Paid: ${formatNaira(receipt.amountPaid)}\nStatus: ${isFull ? "PAID IN FULL" : `PARTIAL PAYMENT (Remaining: ${formatNaira(receipt.balanceRemaining)})`}\n\nView digital receipt: https://alfurqan.edu.ng/receipts/${receipt.id}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Send WhatsApp to Parent"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                      <div className="max-w-md mx-auto space-y-1.5">
                        <ReceiptIcon className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">No receipts found</p>
                        <p className="text-xs text-slate-400">
                          {query || statusFilter !== "ALL" || bankFilter !== "ALL"
                            ? "Try adjusting your search query or filter options."
                            : "No fee payment receipts have been recorded yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      </SidebarLayout>
    </AuthGuard>
  );
}

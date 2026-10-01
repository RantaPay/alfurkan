"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Receipt } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  Search,
  ExternalLink,
  MessageSquare,
  Printer,
  CheckCircle2,
  Clock,
  Receipt as ReceiptIcon,
} from "lucide-react";

export default function ReceiptsLedgerPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FULL" | "PARTIAL" | "VOIDED">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/receipts");
        const data = await res.json();
        if (data.success) {
          setReceipts(data.receipts);
        }
      } catch (err) {
        console.error("Failed to load receipts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  const filtered = receipts.filter((r) => {
    let matchesStatus = true;
    if (statusFilter === "FULL") matchesStatus = !r.isVoided && (r.paymentStatus === "FULL" || r.balanceRemaining === 0);
    else if (statusFilter === "PARTIAL") matchesStatus = !r.isVoided && (r.paymentStatus === "PARTIAL" && r.balanceRemaining > 0);
    else if (statusFilter === "VOIDED") matchesStatus = !!r.isVoided;

    const q = query.toLowerCase().trim();
    const matchesQuery =
      !q ||
      r.receiptNumber.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.regNumber.toLowerCase().includes(q) ||
      (r.bankReference && r.bankReference.toLowerCase().includes(q));

    return matchesStatus && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Official Receipts Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Search and manage all official digital receipts issued by Al-Furqan International College
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by receipt number, student name, or reg no..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "PARTIAL"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Part Payments
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("VOIDED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "VOIDED"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Voided
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
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
                {filtered.map((receipt) => {
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
                        <div className="font-bold text-slate-900">{receipt.studentName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{receipt.regNumber}</div>
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {receipt.studentClass}
                      </td>

                      <td className="py-3.5 px-3">
                        {receipt.isVoided ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>VOIDED</span>
                          </span>
                        ) : isFull ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>FULL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>PARTIAL</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900">
                        {formatNaira(receipt.amountPaid)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span className={receipt.balanceRemaining > 0 ? "text-amber-700" : "text-emerald-700"}>
                          {formatNaira(receipt.balanceRemaining)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        {receipt.date}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/receipts/${receipt.id}`}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View / Print Receipt"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>

                          <a
                            href={`https://wa.me/234${receipt.parentPhone.replace(/^0/, "")}?text=${encodeURIComponent(
                              `Assalamu Alaikum ${receipt.parentName},\n\nPayment confirmation for ${receipt.studentName} at Al-Furqan International College.\nReceipt: ${receipt.receiptNumber}\nAmount Paid: ${formatNaira(receipt.amountPaid)}\nStatus: ${isFull ? "PAID IN FULL" : `PARTIAL PAYMENT (Remaining: ${formatNaira(receipt.balanceRemaining)})`}\n\nView digital receipt: https://alfurqan.edu.ng/receipts/${receipt.id}`
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

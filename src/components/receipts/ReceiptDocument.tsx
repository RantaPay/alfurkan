"use client";

import { useState } from "react";
import { Receipt, SchoolProfile } from "@/lib/types";
import { formatNaira, amountInWords } from "@/lib/utils";
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, FileText, ScrollText } from "lucide-react";

interface ReceiptDocumentProps {
  receipt: Receipt;
  school?: SchoolProfile | null;
  hideActions?: boolean;
}

export function ReceiptDocument({ receipt, school }: ReceiptDocumentProps) {
  const [viewFormat, setViewFormat] = useState<"traditional" | "statement">("traditional");

  const isFullPayment = receipt.paymentStatus === "FULL" || receipt.balanceRemaining === 0;
  const writtenAmount = amountInWords(receipt.amountPaid);
  const serialNo = receipt.receiptNumber.replace(/^AFIC-RCP-/, "AFIA/ ");

  // Formatted date
  const receiptDate = receipt.date || new Date(receipt.timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto font-sans">
      {/* Format Selector Tab (Hidden when printing) */}
      <div className="print:hidden flex items-center justify-between bg-white/90 backdrop-blur-xs p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600 pl-2">Receipt Format:</span>
          <button
            type="button"
            onClick={() => setViewFormat("traditional")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewFormat === "traditional"
                ? "bg-[#075E54] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ScrollText className="h-4 w-4" />
            <span>Official Treasury Paper Slip (Standard)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewFormat("statement")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewFormat === "statement"
                ? "bg-[#075E54] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Detailed Ledger Statement</span>
          </button>
        </div>
        <div className="text-xs text-slate-500 font-semibold pr-3 hidden sm:block">
          Official Bursary Receipt
        </div>
      </div>

      {/* Main Printable Document */}
      <div
        id="printable-receipt"
        className="bg-[#FCFBF7] text-slate-900 rounded-3xl shadow-xl border-2 border-slate-300 p-8 sm:p-12 relative overflow-hidden print:shadow-none print:border print:border-slate-400 print:p-8 print:max-w-full font-sans"
        style={{
          boxShadow: "0 12px 36px -6px rgba(0, 0, 0, 0.09), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {/* Subtle Bank-Security Paper Guilloche Border */}
        <div className="absolute inset-3 border-2 border-slate-300/70 rounded-2xl pointer-events-none" />
        <div className="absolute inset-4 border border-dashed border-slate-300/50 rounded-xl pointer-events-none" />

        {/* 1. Large Centered Watermark of School Logo */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden">
          <img
            src={school?.logoUrl || "/logo.png"}
            alt="School Crest Watermark"
            className="w-88 h-88 sm:w-[460px] sm:h-[460px] object-contain opacity-[0.08] grayscale contrast-125 mix-blend-multiply"
          />
        </div>

        {/* Void Stamp Overlay if Receipt is Cancelled */}
        {receipt.isVoided && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none z-30">
            <div className="border-4 sm:border-8 border-rose-600/70 text-rose-700/90 px-8 py-3 rounded-2xl font-black text-4xl sm:text-7xl tracking-widest uppercase rotate-[-22deg] shadow-lg bg-rose-50/50 backdrop-blur-[1px]">
              REVOKED / VOID
            </div>
            <div className="text-sm sm:text-base font-bold text-rose-800 rotate-[-22deg] mt-3 bg-white/90 px-5 py-1.5 rounded-lg border border-rose-300 shadow-xs">
              Cancelled on {receipt.voidedAt ? new Date(receipt.voidedAt).toLocaleDateString() : receiptDate} • {receipt.voidReason || "Duplicate Entry"}
            </div>
          </div>
        )}

        {/* TOP HEADER: School Crest, Institution Title & Serial */}
        <div className="relative z-10 pb-6 border-b-2 border-slate-900/20">
          <div className="flex items-start justify-between gap-5">
            {/* Left: School Crest Logo */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl p-1.5 bg-white border-2 border-emerald-900/30 shadow-xs flex items-center justify-center overflow-hidden">
                <img
                  src={school?.logoUrl || "/logo.png"}
                  alt={school?.name || "Al-Furqan"}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Center: Official Institutional Header */}
            <div className="flex-1 text-center px-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                {school?.name || "AL-FURQAN INTERNATIONAL ACADEMY"}
              </h1>
              <p className="text-sm sm:text-base font-bold text-emerald-900 italic mt-1">
                {school?.motto || "Knowledge and Guidance"} • العلم والتربية
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">
                {school?.address || "Plot 14, Islamic Crescent, Off Airport Road, Gwarinpa, Abuja, Nigeria"}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Tel: <strong className="text-slate-700">{school?.phone || "+234 803 456 7890"}</strong> • Email: <strong className="text-slate-700">{school?.email || "bursary@alfurqan.edu.ng"}</strong>
              </p>
            </div>

            {/* Right: Receipt Serial Number & Date */}
            <div className="shrink-0 text-right space-y-1.5">
              <div className="inline-block border-2 border-rose-800/80 bg-rose-50 text-rose-900 px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase shadow-2xs">
                ORIGINAL
              </div>
              <div className="text-sm text-slate-700 font-bold">
                No:{" "}
                <span className={`font-mono font-black text-base sm:text-lg ${receipt.isVoided ? "line-through text-rose-600" : "text-rose-700"}`}>
                  {serialNo}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                Date: <strong className="text-slate-900 underline font-mono text-sm sm:text-base">{receiptDate}</strong>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Term: <strong className="text-slate-800">{receipt.term}</strong>
              </div>
            </div>
          </div>

          {/* Banner Title: Official Receipt */}
          <div className="text-center mt-4 pt-3 border-t border-slate-300 flex items-center justify-center gap-4">
            <span className="h-0.5 bg-slate-400 flex-1 max-w-[120px]" />
            <span className="text-lg sm:text-xl font-black tracking-widest text-slate-900 uppercase px-3">
              Official Receipt
            </span>
            <span className="h-0.5 bg-slate-400 flex-1 max-w-[120px]" />
          </div>
        </div>

        {/* VIEW 1: TRADITIONAL TREASURY PAPER SLIP (Matching User Images) */}
        {viewFormat === "traditional" ? (
          <div className="relative z-10 py-7 space-y-6">
            {/* Row 1: Received from */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2.5">
              <span className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide shrink-0">
                RECEIVED from:
              </span>
              <div className="flex-1 border-b-2 border-dotted border-slate-400 pb-1 flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-lg sm:text-xl font-black text-slate-950 tracking-wide">
                  {receipt.studentName}
                </span>
                <span className="text-sm text-slate-700 font-semibold">
                  Adm / Reg No: <strong className="font-mono text-slate-950 font-black text-base">{receipt.regNumber}</strong> • Class: <strong className="text-slate-950 text-base">{receipt.studentClass}</strong>
                </span>
              </div>
            </div>

            {/* Row 2: The sum of (AMOUNT IN WORDS) */}
            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2.5">
                <span className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide shrink-0">
                  the sum of:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-slate-400 pb-1">
                  <span className="text-base sm:text-lg font-bold text-slate-900 italic leading-relaxed">
                    {writtenAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Being (Purpose) */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2.5">
              <span className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide shrink-0">
                being:
              </span>
              <div className="flex-1 border-b-2 border-dotted border-slate-400 pb-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm sm:text-base font-semibold text-slate-900">
                  {receipt.paymentStatus === "FULL" ? "Full Settlement of" : "Part-Payment installment towards"}{" "}
                  <strong>{receipt.term}, {receipt.session}</strong> fees & educational package
                  {receipt.items && receipt.items.length > 0
                    ? ` (${receipt.items.map((i) => i.name).join(", ")})`
                    : ""}
                </span>
              </div>
            </div>

            {/* Row 4: Parent & Guardian particulars */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2.5 text-sm text-slate-800">
              <span className="font-bold text-slate-800 uppercase tracking-wide shrink-0">
                Payer / Guardian:
              </span>
              <div className="flex-1 border-b border-dotted border-slate-300 pb-1 flex flex-wrap items-center justify-between gap-3">
                <span><strong>{receipt.parentName}</strong> (Tel: <strong className="font-mono text-slate-900">{receipt.parentPhone}</strong>)</span>
                <span className="text-xs text-slate-600 font-medium">
                  Payment Method: <strong className="text-slate-900">{receipt.paymentMethod}</strong>
                  {receipt.bankReference ? ` • Ref: ${receipt.bankReference}` : ""}
                </span>
              </div>
            </div>

            {/* BOTTOM SECTION: Boxed Amount + Rubber Stamp + Signatures */}
            <div className="pt-6 flex flex-col md:flex-row items-end justify-between gap-6">
              {/* Boxed Amount on the Left (Traditional double-border box) */}
              <div className="w-full md:max-w-md space-y-3.5">
                <div className="border-4 border-double border-slate-900 bg-white p-4 rounded-xl shadow-xs inline-block w-full">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                    Amount Paid:
                  </div>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight flex items-baseline justify-between">
                    <span>{formatNaira(receipt.amountPaid)}</span>
                    <span className="text-2xl text-slate-400 font-serif">=</span>
                  </div>
                </div>

                {/* Ledger Balance Summary */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Term Bill:</span>
                    <strong className="font-mono text-slate-900 text-sm">{formatNaira(receipt.totalTermBill)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Paid to Date:</span>
                    <strong className="font-mono text-slate-900 text-sm">{formatNaira(receipt.newTotalPaid)}</strong>
                  </div>
                  <div className={`flex justify-between pt-1.5 border-t border-slate-200 font-black ${
                    receipt.balanceRemaining === 0 ? "text-emerald-800" : "text-amber-800"
                  }`}>
                    <span>Balance Remaining:</span>
                    <span className="font-mono text-sm sm:text-base">
                      {receipt.balanceRemaining === 0 ? "₦0.00 (NIL / CLEARED)" : formatNaira(receipt.balanceRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Authentic Bursary Rubber Stamp & Signature */}
              <div className="w-full md:w-auto flex flex-col items-center sm:items-end text-center sm:text-right relative">
                {/* SVG Official Circular Rubber Stamp */}
                <div className="relative inline-block mb-3">
                  <svg
                    viewBox="0 0 140 140"
                    className="w-32 h-32 text-blue-900/85 drop-shadow-xs rotate-[-6deg] select-none"
                    style={{ filter: "contrast(140%)" }}
                  >
                    {/* Outer rings */}
                    <circle cx="70" cy="70" r="66" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="70" cy="70" r="61" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                    <circle cx="70" cy="70" r="44" fill="none" stroke="currentColor" strokeWidth="1.5" />

                    {/* Circular top text path */}
                    <path id="topCurve" d="M 18,70 A 52,52 0 0,1 122,70" fill="none" />
                    <text className="text-[8.5px] font-black tracking-wider uppercase fill-current">
                      <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
                        AL-FURQAN INT&apos;L ACADEMY
                      </textPath>
                    </text>

                    {/* Circular bottom text path */}
                    <path id="bottomCurve" d="M 122,70 A 52,52 0 0,1 18,70" fill="none" />
                    <text className="text-[8.5px] font-black tracking-wider uppercase fill-current">
                      <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
                        ★ BURSARY DEPT • VERIFIED ★
                      </textPath>
                    </text>

                    {/* Inner stamp badge */}
                    <text x="70" y="58" textAnchor="middle" className="text-[10px] font-black fill-current">
                      OFFICIAL
                    </text>
                    <text x="70" y="74" textAnchor="middle" className="text-[14px] font-black tracking-widest fill-current">
                      PAID
                    </text>
                    <text x="70" y="87" textAnchor="middle" className="text-[9px] font-bold fill-current">
                      {receiptDate}
                    </text>
                  </svg>

                  {/* Overlapping Cursive Signature */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span
                      className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-wider rotate-[-8deg] opacity-90 select-none"
                      style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive" }}
                    >
                      Ibrahim Danladi
                    </span>
                  </div>
                </div>

                {/* Signature Line & Bursar Title */}
                <div className="w-52 border-b-2 border-slate-900 pb-1 text-center">
                  <span className="text-sm font-bold text-slate-950">
                    {school?.bursarName || "Alhaji Ibrahim S. Danladi"}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-1">
                  Chief Bursar / Cashier
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: FULL DETAILED STATEMENT & ITEM SCHEDULE */
          <div className="relative z-10 py-7 space-y-7">
            {/* Student & Payment Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-100/90 p-5 rounded-2xl border border-slate-200 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Student Name:</span>
                <strong className="text-slate-950 text-base">{receipt.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Admission No:</span>
                <strong className="font-mono text-slate-950 text-base">{receipt.regNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Class:</span>
                <strong className="text-slate-950 text-base">{receipt.studentClass}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Payment Status:</span>
                <span className={`inline-block font-black px-3 py-1 rounded-md text-xs mt-0.5 ${
                  isFullPayment ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {receipt.paymentStatus === "FULL" ? "CLEARED IN FULL" : "PARTIAL INSTALLMENT"}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Fee Item & Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {receipt.items && receipt.items.length > 0 ? (
                    receipt.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {it.name}
                          {it.description && <span className="block text-xs font-normal text-slate-500 mt-0.5">{it.description}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-semibold">
                            {it.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 text-base">
                          {formatNaira(it.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 px-4 text-slate-400 font-mono">1</td>
                      <td className="py-3 px-4 font-bold text-slate-900">Tuition & Termly School Fees</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-semibold">Tuition</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 text-base">
                        {formatNaira(receipt.amountPaid)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Ledger Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm space-y-1.5">
                <span className="font-bold text-slate-900 block mb-1">Payment Particulars:</span>
                <div>Channel: <strong className="text-slate-900">{receipt.paymentMethod}</strong></div>
                <div>Reference No: <strong className="font-mono text-slate-900">{receipt.bankReference || "N/A"}</strong></div>
                <div>Payer: <strong className="text-slate-900">{receipt.parentName}</strong> ({receipt.parentPhone})</div>
                <div className="text-xs text-slate-500 pt-1">
                  Official note: {receipt.notes || "Official electronic receipt verified by Bursary."}
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm space-y-2.5">
                <div className="flex justify-between text-slate-600">
                  <span>Term Total Invoice:</span>
                  <span className="font-mono font-bold text-slate-900">{formatNaira(receipt.totalTermBill)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Previous Payments:</span>
                  <span className="font-mono font-bold text-slate-900">{formatNaira(receipt.previousTotalPaid)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-y border-slate-300 font-bold text-emerald-950 text-base">
                  <span>AMOUNT PAID (THIS RECEIPT):</span>
                  <span className="font-mono text-lg">{formatNaira(receipt.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-950 text-base">
                  <span>OUTSTANDING BALANCE:</span>
                  <span className="font-mono">{formatNaira(receipt.balanceRemaining)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

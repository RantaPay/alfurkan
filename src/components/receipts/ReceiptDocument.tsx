"use client";

import { useState } from "react";
import { Receipt, SchoolProfile } from "@/lib/types";
import { formatNaira, amountInWords } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ScrollText,
  Printer,
  Sparkles,
} from "lucide-react";

interface ReceiptDocumentProps {
  receipt: Receipt;
  school?: SchoolProfile | null;
  hideActions?: boolean;
  selectedFormat?: "thermal" | "traditional" | "statement";
  onFormatSelect?: (format: "thermal" | "traditional" | "statement") => void;
}

export function ReceiptDocument({
  receipt,
  school,
  selectedFormat,
  onFormatSelect,
}: ReceiptDocumentProps) {
  const [internalFormat, setInternalFormat] = useState<"thermal" | "traditional" | "statement">("thermal");

  const viewFormat = selectedFormat || internalFormat;
  const setViewFormat = (fmt: "thermal" | "traditional" | "statement") => {
    setInternalFormat(fmt);
    if (onFormatSelect) onFormatSelect(fmt);
  };

  const isFullPayment = receipt.paymentStatus === "FULL" || receipt.balanceRemaining === 0;
  const writtenAmount = amountInWords(receipt.amountPaid);
  const serialNo = receipt.receiptNumber.replace(/^AFIC-RCP-/, "AFIA/ ");

  // Formatted date
  const receiptDate =
    receipt.date ||
    new Date(receipt.timestamp).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const bankDisplayName =
    receipt.bankName ||
    (receipt.bankReference?.includes("GTB")
      ? "GTBank"
      : receipt.bankReference?.includes("TAJ")
      ? "Taj Bank"
      : receipt.bankReference?.includes("ZEB")
      ? "Zenith Bank"
      : receipt.bankReference?.includes("FBN")
      ? "First Bank"
      : school?.bankName || "Jaiz Bank");

  return (
    <div className="space-y-5 max-w-4xl mx-auto font-sans">
      {/* Format Selector Bar (Hidden during printing) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1 mr-1">
            Print Format:
          </span>

          {/* POS Thermal Printer Option (Requested) */}
          <button
            type="button"
            onClick={() => setViewFormat("thermal")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewFormat === "thermal"
                ? "bg-[#075E54] text-white shadow-xs ring-2 ring-emerald-500/20"
                : "text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white"
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>POS Thermal Roll (80mm)</span>
            <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-950 hidden md:inline">
              POS Ready
            </span>
          </button>

          {/* Standard Paper Voucher Slip */}
          <button
            type="button"
            onClick={() => setViewFormat("traditional")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewFormat === "traditional"
                ? "bg-[#075E54] text-white shadow-xs ring-2 ring-emerald-500/20"
                : "text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white"
            }`}
          >
            <ScrollText className="h-4 w-4" />
            <span>Standard Slip (A4 / Letter)</span>
          </button>

          {/* Detailed Statement */}
          <button
            type="button"
            onClick={() => setViewFormat("statement")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewFormat === "statement"
                ? "bg-[#075E54] text-white shadow-xs ring-2 ring-emerald-500/20"
                : "text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Detailed Ledger Statement</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-[#075E54] hover:bg-[#064e46] text-white font-black text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            title="Click to print this receipt directly to your printer"
          >
            <Printer className="h-4 w-4 text-emerald-300" />
            <span>Print Receipt Now</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. THERMAL POS RECEIPT LAYOUT (80mm Thermal Printer Optimized) */}
      {/* ============================================================== */}
      {viewFormat === "thermal" ? (
        <div className="w-full flex justify-center">
          {/* Dynamic Thermal Print Stylesheet */}
          <style>{`
            @media print {
              @page {
                size: 80mm auto;
                margin: 0mm;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              #printable-receipt {
                width: 76mm !important;
                max-width: 76mm !important;
                margin: 0 auto !important;
                padding: 2mm 1.5mm !important;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                font-size: 11px !important;
                line-height: 1.35 !important;
                color: #000000 !important;
                background: #ffffff !important;
              }
            }
          `}</style>

          <div
            id="printable-receipt"
            className="thermal-receipt w-full max-w-[340px] sm:max-w-[360px] bg-white text-slate-950 p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-300 font-mono text-xs relative select-text"
            style={{
              boxShadow: "0 12px 30px -6px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          >
            {/* Top Serrated Edge Graphic Simulation */}
            <div className="print:hidden text-center text-slate-300 text-[10px] tracking-widest select-none pb-2 -mt-1">
              ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
            </div>

            {/* Void Banner if Cancelled */}
            {receipt.isVoided && (
              <div className="mb-3 p-2 bg-rose-100 text-rose-950 border-2 border-rose-600 text-center font-black text-xs uppercase tracking-wider">
                *** VOID / REVOKED RECEIPT ***
                <div className="text-[10px] font-bold mt-0.5">
                  {receipt.voidReason || "Duplicate Entry"}
                </div>
              </div>
            )}

            {/* Header: School Crest & Titles */}
            <div className="text-center space-y-1 pb-3">
              {school?.logoUrl && (
                <div className="flex justify-center mb-1.5">
                  <img
                    src={school.logoUrl}
                    alt="School Crest"
                    className="w-12 h-12 object-contain grayscale contrast-150"
                  />
                </div>
              )}
              <h2 className="text-sm sm:text-base font-black tracking-tight uppercase leading-snug">
                {school?.name || "AL-FURQAN INTERNATIONAL ACADEMY"}
              </h2>
              <p className="text-[10px] font-bold italic text-slate-700">
                {school?.motto || "Knowledge & Guidance"}
              </p>
              <p className="text-[10px] text-slate-600 leading-tight">
                {school?.address || "Along Dass Road, New GRA, Bauchi"}
              </p>
              <p className="text-[10px] text-slate-600 font-mono">
                Tel: {school?.phone || "+234 804 430 5624"}
              </p>
              <div className="pt-1.5 font-mono text-slate-400 select-none text-[11px]">
                ================================
              </div>
              <div className="text-xs font-black tracking-widest uppercase">
                OFFICIAL CASHIER / ACCOUNTS RECEIPT
              </div>
              <div className="font-mono text-slate-400 select-none text-[11px]">
                ================================
              </div>
            </div>

            {/* Receipt Particulars */}
            <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-600">RECEIPT NO:</span>
                <strong className="font-black text-slate-900">{serialNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">DATE:</span>
                <span className="font-bold">{receiptDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">ACADEMIC TERM:</span>
                <span>{receipt.term} ({receipt.session || "2026/2027"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">CASHIER / ACCOUNTANT:</span>
                <span className="truncate max-w-[170px] text-right font-medium">
                  {receipt.issuedBy || school?.accountantName || "Alhaji Ibrahim S. Danladi"}
                </span>
              </div>
            </div>

            {/* Student & Payer Info */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-600">STUDENT:</span>
                <strong className="font-black text-slate-900 text-right truncate max-w-[190px]">
                  {receipt.studentName}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">REG NO:</span>
                <strong className="font-bold">{receipt.regNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">CLASS:</span>
                <strong className="font-black">{receipt.studentClass}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">DEPOSITOR / PAYER:</span>
                <span className="text-right truncate max-w-[180px] font-bold">{receipt.parentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">PHONE:</span>
                <span>{receipt.parentPhone}</span>
              </div>
            </div>

            {/* Payment Channel / Bank */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-600">PAYMENT METHOD:</span>
                <strong className="font-bold">{receipt.paymentMethod}</strong>
              </div>
              {receipt.paymentMethod !== "Cash" && bankDisplayName !== "Cash" && (
                <div className="flex justify-between">
                  <span className="text-slate-600">RECEIVING BANK:</span>
                  <strong className="font-bold">{bankDisplayName}</strong>
                </div>
              )}

            </div>

            {/* Itemized Fee Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-700 pb-1 border-b border-dotted border-slate-300">
                <span>ITEM DESCRIPTION</span>
                <span>AMOUNT (₦)</span>
              </div>
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[190px]">{it.name}</span>
                    <span className="font-bold">{formatNaira(it.amount)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-[11px]">
                  <span>Tuition / School Fees</span>
                  <span className="font-bold">{formatNaira(receipt.amountPaid)}</span>
                </div>
              )}
            </div>

            {/* Financial Ledger Totals */}
            <div className="py-2.5 space-y-1 border-b-2 border-slate-900 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Total Term Bill:</span>
                <span>{formatNaira(receipt.totalTermBill)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Prior Paid:</span>
                <span>{formatNaira(receipt.previousTotalPaid)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dotted border-slate-400 text-sm font-black text-slate-950">
                <span>AMOUNT PAID NOW:</span>
                <span>{formatNaira(receipt.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Total Paid to Date:</span>
                <span className="font-bold">{formatNaira(receipt.newTotalPaid)}</span>
              </div>
              <div className={`flex justify-between pt-1 font-black ${
                receipt.balanceRemaining === 0 ? "text-emerald-900" : "text-amber-950"
              }`}>
                <span>BALANCE DUE:</span>
                <span>
                  {receipt.balanceRemaining === 0 ? "₦0.00 (CLEARED)" : formatNaira(receipt.balanceRemaining)}
                </span>
              </div>
            </div>

            {/* Status Box */}
            <div className="my-2.5 p-2 text-center border-2 border-slate-900 rounded-md">
              <span className="text-xs font-black tracking-wider uppercase">
                STATUS: {isFullPayment ? "★ PAID IN FULL (CLEARED) ★" : "★ PARTIAL PAYMENT INSTALLMENT ★"}
              </span>
            </div>

            {/* Authorized Signature Line */}
            <div className="py-2 border-t border-dashed border-slate-400 text-center space-y-0.5">
              <div className="pt-3 border-b border-slate-400 w-36 mx-auto" />
              <div className="text-[10px] font-black text-slate-900 uppercase">
                {school?.accountantName || "Alhaji Ibrahim S. Danladi"}
              </div>
              <div className="text-[9px] text-slate-600 uppercase tracking-wider">
                Authorized Cashier & Accounts Dept • Verified
              </div>
            </div>

            {/* Footer Notes */}
            <div className="pt-2 text-center text-[9px] text-slate-600 space-y-0.5">
              <p>Official Receipt • Fees paid are non-refundable.</p>
              <p>Keep this slip safe for student gate clearance.</p>
              <p className="font-bold text-slate-900">*** AL-FURQAN INTERNATIONAL COLLEGE ***</p>
              <div className="pt-2 text-slate-400 select-none tracking-widest text-[10px]">
                ✂ - - - - - - - - - - - - - - - - - - - -
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2 & 3. STANDARD A4/A5 PAPER SLIP & DETAILED STATEMENT LAYOUTS  */
        /* ============================================================== */
        <div
          id="printable-receipt"
          className="bg-[#FCFBF7] text-slate-900 rounded-xl shadow-md border-2 border-slate-300 p-4 sm:p-5.5 max-w-xl mx-auto relative overflow-hidden print:shadow-none print:border print:border-slate-400 print:p-3.5 print:max-w-[155mm] font-sans"
          style={{
            boxShadow: "0 6px 18px -3px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0,0,0,0.03)",
          }}
        >
          {/* Subtle Bank-Security Paper Guilloche Border */}
          <div className="absolute inset-1.5 border border-slate-300/80 rounded-lg pointer-events-none" />
          <div className="absolute inset-2.5 border border-dashed border-slate-300/60 rounded-md pointer-events-none" />

          {/* Centered Watermark of School Logo */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden">
            <img
              src={school?.logoUrl || "/logo.png"}
              alt="School Crest Watermark"
              className="w-40 h-40 sm:w-48 sm:h-48 object-contain opacity-[0.06] grayscale contrast-125 mix-blend-multiply"
            />
          </div>

          {/* Void Stamp Overlay if Receipt is Cancelled */}
          {receipt.isVoided && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none z-30">
              <div className="border-4 border-rose-600/70 text-rose-700/90 px-5 py-1.5 rounded-lg font-black text-2xl sm:text-4xl tracking-widest uppercase rotate-[-22deg] shadow-lg bg-rose-50/50 backdrop-blur-[1px]">
                REVOKED / VOID
              </div>
              <div className="text-[11px] font-bold text-rose-800 rotate-[-22deg] mt-1.5 bg-white/90 px-3 py-0.5 rounded border border-rose-300 shadow-xs">
                Cancelled on {receipt.voidedAt ? new Date(receipt.voidedAt).toLocaleDateString() : receiptDate} • {receipt.voidReason || "Duplicate Entry"}
              </div>
            </div>
          )}

          {/* TOP HEADER: School Crest, Institution Title & Serial */}
          <div className="relative z-10 pb-2.5 border-b-2 border-slate-900/20">
            <div className="flex items-start justify-between gap-2.5">
              {/* Left: School Crest Logo */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg p-1 bg-white border border-emerald-900/30 shadow-2xs flex items-center justify-center overflow-hidden">
                  <img
                    src={school?.logoUrl || "/logo.png"}
                    alt={school?.name || "Al-Furqan"}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* Center: Official Institutional Header */}
              <div className="flex-1 text-center px-1.5">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-snug">
                  {school?.name || "AL-FURQAN INTERNATIONAL ACADEMY"}
                </h1>
                <p className="text-[11px] font-bold text-emerald-900 italic mt-0.5">
                  {school?.motto || "Knowledge and Guidance"} • العلم والتربية
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5 font-medium leading-tight">
                  {school?.address || "Along Dass Road / 10 Dukku Close, New GRA, Bauchi, Bauchi State, Nigeria"}
                </p>
                <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                  Tel: <strong className="text-slate-700">{school?.phone || "+234 804 430 5624 / +234 806 977 0538"}</strong> • Email: <strong className="text-slate-700">{school?.email || "admin@alfurqanintlacademy.com"}</strong>
                </p>
              </div>

              {/* Right: Receipt Serial Number & Date */}
              <div className="shrink-0 text-right space-y-0.5">
                <div className="inline-block border border-rose-800/80 bg-rose-50 text-rose-900 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">
                  ORIGINAL
                </div>
                <div className="text-xs text-slate-700 font-bold">
                  No:{" "}
                  <span className={`font-mono font-black text-sm sm:text-base ${receipt.isVoided ? "line-through text-rose-600" : "text-rose-700"}`}>
                    {serialNo}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Date: <strong className="text-slate-900 underline font-mono text-xs sm:text-sm">{receiptDate}</strong>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Term: <strong className="text-slate-800">{receipt.term}</strong> • Sess: <strong className="text-slate-800">{receipt.session || "2026/2027"}</strong>
                </div>
              </div>
            </div>

            {/* Banner Title: Official Receipt */}
            <div className="text-center mt-2.5 pt-2 border-t border-slate-300 flex items-center justify-center gap-3">
              <span className="h-px bg-slate-400 flex-1 max-w-[80px]" />
              <span className="text-xs sm:text-sm font-black tracking-widest text-slate-900 uppercase px-2">
                Official Cashier & Accounts Receipt
              </span>
              <span className="h-px bg-slate-400 flex-1 max-w-[80px]" />
            </div>
          </div>

          {/* VIEW 2: TRADITIONAL TREASURY PAPER SLIP */}
          {viewFormat === "traditional" ? (
            <div className="relative z-10 py-2.5 space-y-2.5">
              {/* Row 1: Received from */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5">
                <span className="text-xs sm:text-[13px] font-black text-slate-900 uppercase tracking-wide shrink-0">
                  RECEIVED from:
                </span>
                <div className="flex-1 border-b border-dotted border-slate-400 pb-0.5 flex flex-wrap items-baseline justify-between gap-1.5">
                  <span className="text-sm sm:text-base font-black text-slate-950 tracking-wide">
                    {receipt.studentName}
                  </span>
                  <span className="text-[11px] text-slate-700 font-semibold">
                    Adm / Reg No: <strong className="font-mono text-slate-950 font-black text-xs sm:text-sm">{receipt.regNumber}</strong> • Class: <strong className="text-slate-950 text-xs sm:text-sm">{receipt.studentClass}</strong>
                  </span>
                </div>
              </div>

              {/* Row 2: The sum of (AMOUNT IN WORDS) */}
              <div className="space-y-0.5">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5">
                  <span className="text-xs sm:text-[13px] font-black text-slate-900 uppercase tracking-wide shrink-0">
                    the sum of:
                  </span>
                  <div className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                    <span className="text-xs sm:text-[13px] font-bold text-slate-900 italic leading-snug">
                      {writtenAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Being (Purpose) */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5">
                <span className="text-xs sm:text-[13px] font-black text-slate-900 uppercase tracking-wide shrink-0">
                  being:
                </span>
                <div className="flex-1 border-b border-dotted border-slate-400 pb-0.5 flex flex-wrap items-baseline justify-between gap-1.5">
                  <span className="text-xs sm:text-[12.5px] font-semibold text-slate-900">
                    {receipt.paymentStatus === "FULL" ? "Full Settlement of" : "Part-Payment installment towards"}{" "}
                    <strong>{receipt.term}, {receipt.session}</strong> fees &amp; educational package
                    {receipt.items && receipt.items.length > 0
                      ? ` (${receipt.items.map((i) => i.name).join(", ")})`
                      : ""}
                  </span>
                </div>
              </div>

              {/* Row 4: Parent & Guardian particulars */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 text-[11px] sm:text-xs text-slate-800">
                <span className="font-bold text-slate-800 uppercase tracking-wide shrink-0">
                  Depositor / Payer:
                </span>
                <div className="flex-1 border-b border-dotted border-slate-300 pb-0.5 flex flex-wrap items-center justify-between gap-1.5">
                  <span><strong>{receipt.parentName}</strong> (Tel: <strong className="font-mono text-slate-900">{receipt.parentPhone}</strong>)</span>
                  <span className="text-[10.5px] text-slate-600 font-medium">
                    Method: <strong className="text-slate-900">{receipt.paymentMethod}</strong>
                    {receipt.paymentMethod !== "Cash" && bankDisplayName !== "Cash" ? (
                      <> • Bank: <strong className="text-slate-900">{bankDisplayName}</strong></>
                    ) : null}
                    {receipt.bankReference ? <> • Ref: <strong className="font-mono">{receipt.bankReference}</strong></> : null}
                  </span>
                </div>
              </div>

              {/* BOTTOM SECTION: Boxed Amount + Rubber Stamp + Signatures */}
              <div className="pt-2 flex flex-col md:flex-row items-end justify-between gap-3">
                {/* Boxed Amount on the Left */}
                <div className="w-full md:max-w-xs space-y-1.5">
                  <div className="border-2 border-double border-slate-900 bg-white p-2 rounded-lg shadow-2xs inline-block w-full">
                    <div className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-0.5">
                      Amount Paid:
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-950 tracking-tight flex items-baseline justify-between">
                      <span>{formatNaira(receipt.amountPaid)}</span>
                      <span className="text-lg text-slate-400 font-serif">=</span>
                    </div>
                  </div>

                  {/* Ledger Balance Summary */}
                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-[11px] space-y-0.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Term Bill:</span>
                      <strong className="font-mono text-slate-900">{formatNaira(receipt.totalTermBill)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Paid to Date:</span>
                      <strong className="font-mono text-slate-900">{formatNaira(receipt.newTotalPaid)}</strong>
                    </div>
                    <div className={`flex justify-between pt-0.5 border-t border-slate-200 font-black ${
                      receipt.balanceRemaining === 0 ? "text-emerald-800" : "text-amber-800"
                    }`}>
                      <span>Balance Remaining:</span>
                      <span className="font-mono text-[11px] sm:text-xs">
                        {receipt.balanceRemaining === 0 ? "₦0.00 (NIL / CLEARED)" : formatNaira(receipt.balanceRemaining)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Authentic Accounts Rubber Stamp & Signature */}
                <div className="w-full md:w-auto flex flex-col items-center sm:items-end text-center sm:text-right relative">
                  <div className="relative inline-block mb-1.5">
                    <svg
                      viewBox="0 0 140 140"
                      className="w-20 h-20 sm:w-22 sm:h-22 text-blue-900/85 drop-shadow-xs rotate-[-6deg] select-none"
                      style={{ filter: "contrast(140%)" }}
                    >
                      <circle cx="70" cy="70" r="66" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="70" cy="70" r="61" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                      <circle cx="70" cy="70" r="44" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path id="topCurve" d="M 18,70 A 52,52 0 0,1 122,70" fill="none" />
                      <text className="text-[8.5px] font-black tracking-wider uppercase fill-current">
                        <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
                          AL-FURQAN INT&apos;L ACADEMY
                        </textPath>
                      </text>
                      <path id="bottomCurve" d="M 122,70 A 52,52 0 0,1 18,70" fill="none" />
                      <text className="text-[8.5px] font-black tracking-wider uppercase fill-current">
                        <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
                          ★ CASHIER & ACCOUNTS • VERIFIED ★
                        </textPath>
                      </text>
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

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span
                        className="text-lg sm:text-xl font-bold text-slate-900 tracking-wider rotate-[-8deg] opacity-90 select-none"
                        style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive" }}
                      >
                        Ibrahim Danladi
                      </span>
                    </div>
                  </div>

                  <div className="w-36 border-b border-slate-900 pb-0.5 text-center">
                    <span className="text-[11px] font-bold text-slate-950">
                      {school?.accountantName || "Alhaji Ibrahim S. Danladi"}
                    </span>
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                    Chief Accountant / Desk Cashier
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 3: FULL DETAILED STATEMENT & ITEM SCHEDULE */
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
                      <th className="py-3 px-4">Fee Item &amp; Description</th>
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
                        <td className="py-3 px-4 font-bold text-slate-900">Tuition &amp; Termly School Fees</td>
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
                  {receipt.paymentMethod !== "Cash" && bankDisplayName !== "Cash" && (
                    <div>Bank: <strong className="text-slate-900">{bankDisplayName}</strong></div>
                  )}
                  {receipt.bankReference && (
                    <div>Transaction Ref: <strong className="font-mono text-slate-900">{receipt.bankReference}</strong></div>
                  )}
                  <div>Payer: <strong className="text-slate-900">{receipt.parentName}</strong> ({receipt.parentPhone})</div>
                  <div className="text-xs text-slate-500 pt-1">
                    Official note: {receipt.notes || "Official electronic receipt verified by Accounts."}
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
      )}
    </div>
  );
}

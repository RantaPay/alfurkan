"use client";

import Image from "next/image";
import { Receipt, SchoolProfile } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { ShieldCheck, CheckCircle2, Clock, QrCode as QrIcon, AlertCircle } from "lucide-react";

interface ReceiptDocumentProps {
  receipt: Receipt;
  school?: SchoolProfile;
  hideActions?: boolean;
}

export function ReceiptDocument({ receipt, school }: ReceiptDocumentProps) {
  const isFullPayment = receipt.paymentStatus === "FULL" || receipt.balanceRemaining === 0;

  return (
    <div
      id="printable-receipt"
      className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200/90 max-w-3xl mx-auto relative overflow-hidden print:shadow-none print:border-none print:p-4 print:max-w-full"
    >
      {/* Background Watermark Stamp */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] select-none">
        <span
          className={`text-7xl sm:text-9xl font-black rotate-[-25deg] tracking-widest uppercase ${
            receipt.isVoided ? "text-rose-600 opacity-20" : ""
          }`}
        >
          {receipt.isVoided ? "VOID / CANCELLED" : isFullPayment ? "PAID IN FULL" : "PARTIAL PAYMENT"}
        </span>
      </div>

      {/* Top Header: School Branding & Crest */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b-2 border-slate-900/10">
        <div className="flex items-center gap-4 text-center sm:text-left">
          {school?.logoUrl ? (
            <div className="h-16 w-16 rounded-2xl border border-slate-200 p-1.5 bg-white shadow-md shrink-0 flex items-center justify-center overflow-hidden">
              <img src={school.logoUrl} alt={school.name} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#128C7E] flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0 print:border print:border-slate-800">
              AF
            </div>
          )}
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {school?.name || "AL-FURQAN INTERNATIONAL COLLEGE"}
              </h1>
              <ShieldCheck className="h-5 w-5 text-[#075E54] shrink-0" />
            </div>
            <p className="text-xs font-semibold text-emerald-800 italic mt-0.5">
              &quot;{school?.motto || "Knowledge, Discipline & Excellence"}&quot;
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md">
              {school?.address || "Plot 14, Islamic Crescent, Off Airport Road, Gwarinpa, Abuja"} • Tel: {school?.phone || "+234 803 456 7890"}
            </p>
          </div>
        </div>

        {/* Receipt Number & Date Badge */}
        <div className="text-center sm:text-right shrink-0">
          <span className={`inline-block px-3 py-1 rounded-full font-mono font-bold text-xs border ${
            receipt.isVoided 
              ? "bg-rose-100 text-rose-800 border-rose-300"
              : "bg-slate-100 text-slate-800 border-slate-200"
          }`}>
            {receipt.isVoided ? "VOIDED / REVOKED RECEIPT" : "OFFICIAL DIGITAL RECEIPT"}
          </span>
          <div className="mt-2 text-xs font-bold text-slate-500">
            Receipt No:{" "}
            <span className={`font-mono text-sm font-black ${receipt.isVoided ? "line-through text-rose-700" : "text-slate-900"}`}>
              {receipt.receiptNumber}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            Date Issued: <strong className="text-slate-700">{receipt.date}</strong>
          </div>
          <div className="text-[11px] text-slate-500">
            Term: <strong>{receipt.term} ({receipt.session})</strong>
          </div>
        </div>
      </div>

      {/* Dynamic Status Banner: VOIDED vs FULL vs PARTIAL */}
      <div className="my-6">
        {receipt.isVoided ? (
          <div className="rounded-2xl bg-rose-50 border-2 border-rose-500/50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-rose-950 text-sm sm:text-base tracking-wide">
                    RECEIPT REVOKED • CANCELLED & VOID
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                    INVALIDATED
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-1">
                  Cancellation Reason: <strong>&quot;{receipt.voidReason || "Payment Revoked / Duplicate Entry"}&quot;</strong>
                </p>
                <div className="text-[11px] text-rose-700/80 mt-0.5">
                  Voided By: <strong>{receipt.voidedBy || "Bursar"}</strong> • {receipt.voidedAt ? new Date(receipt.voidedAt).toLocaleString() : ""}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 bg-white/80 px-4 py-2 rounded-xl border border-rose-200">
              <div className="text-[10px] font-bold text-rose-600 uppercase">Ledger Status</div>
              <div className="text-sm font-black text-rose-800 uppercase">REVERSED IN LEDGER</div>
            </div>
          </div>
        ) : isFullPayment ? (
          <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-500/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-900 text-sm tracking-wide">
                    PAID IN FULL • CLEARED
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                    GATE & EXAM PASS
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Student fees for this academic term are 100% settled. No outstanding balance.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-emerald-700 uppercase">Balance Remaining</div>
              <div className="text-lg font-black text-emerald-900 font-mono">₦0.00</div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-500/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-950 text-sm tracking-wide">
                    PARTIAL PAYMENT
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white">
                    INSTALLMENT RECORDED
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Partial payment received. Outstanding balance must be settled before mid-term examination.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-amber-800 uppercase">Outstanding Balance</div>
              <div className="text-lg font-black text-amber-700 font-mono">
                {formatNaira(receipt.balanceRemaining)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Information Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 mb-6">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
          Student & Parent Particulars
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 text-xs">
          <div>
            <span className="text-slate-500 block">Student Full Name:</span>
            <strong className="text-slate-900 text-sm font-black">{receipt.studentName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Admission / Reg No:</span>
            <span className="font-mono font-black text-slate-900 text-sm">{receipt.regNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Class / Arm:</span>
            <strong className="text-slate-900">{receipt.studentClass}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Parent / Guardian:</span>
            <strong className="text-slate-800">{receipt.parentName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Parent Contact:</span>
            <span className="font-mono font-bold text-slate-800">{receipt.parentPhone}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Payment Method & Channel:</span>
            <strong className="text-[#075E54]">
              {receipt.paymentMethod} {receipt.bankReference ? `(${receipt.bankReference})` : ""}
            </strong>
          </div>
        </div>
      </div>

      {/* Itemized Fee Breakdown Table */}
      <div className="mb-6">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          Itemized Payment Breakdown
        </div>
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Fee Item / Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {item.name}
                      {item.description && (
                        <span className="block text-[11px] font-normal text-slate-500">
                          {item.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatNaira(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 px-4 text-slate-400 font-mono">1</td>
                  <td className="py-3 px-4 font-bold text-slate-800">School Tuition Fees</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      Tuition
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatNaira(receipt.amountPaid)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Settlement Ledger Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-900 mb-1">Official Notes & Instructions:</div>
          <p className="leading-relaxed">
            {receipt.notes || "This is a computer-generated, tamper-proof electronic school fees receipt issued by the Bursary Department of Al-Furqan International College."}
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Keep this digital receipt safely. It serves as your student clearance for admission into class, textbooks collection, and examination halls.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-600">
            <span>Total Term Invoice:</span>
            <span className="font-mono font-bold text-slate-900">
              {formatNaira(receipt.totalTermBill)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Previous Payments:</span>
            <span className="font-mono font-bold text-slate-700">
              {formatNaira(receipt.previousTotalPaid)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-y border-slate-200 font-bold text-emerald-800">
            <span className="text-sm font-black">AMOUNT PAID (THIS RECEIPT):</span>
            <span className="font-mono text-base font-black text-emerald-900">
              {formatNaira(receipt.amountPaid)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>Cumulative Total Paid:</span>
            <span className="font-mono font-bold text-slate-900">
              {formatNaira(receipt.newTotalPaid)}
            </span>
          </div>
          <div className={`flex justify-between items-center pt-1 font-black ${receipt.balanceRemaining > 0 ? "text-amber-700" : "text-emerald-700"}`}>
            <span>OUTSTANDING BALANCE DUE:</span>
            <span className="font-mono text-base">
              {formatNaira(receipt.balanceRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Official Signatures, QR Code & Security Stamp */}
      <div className="pt-6 border-t-2 border-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Tamper-Proof QR Code */}
        <div className="flex items-center gap-3">
          {receipt.qrCodeDataUrl ? (
            <img
              src={receipt.qrCodeDataUrl}
              alt="Receipt Verification QR"
              className="h-20 w-20 rounded-xl border border-slate-300 p-1 bg-white shadow-xs"
            />
          ) : (
            <div className="h-20 w-20 rounded-xl border border-slate-300 bg-slate-100 flex items-center justify-center">
              <QrIcon className="h-8 w-8 text-slate-400" />
            </div>
          )}
          <div>
            <div className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
              <span>SCAN TO VERIFY</span>
              <ShieldCheck className="h-3.5 w-3.5 text-[#075E54]" />
            </div>
            <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight mt-0.5">
              Scan with any mobile camera to verify receipt authenticity and student gate pass status.
            </p>
            <div className="font-mono text-[9px] text-slate-400 mt-1">
              SecHash: {receipt.securityHash}
            </div>
          </div>
        </div>

        {/* Bursar Signature & Official Stamp */}
        <div className="text-center sm:text-right">
          <div className="inline-block border-b-2 border-slate-900 pb-1 px-8 text-center">
            <span className="font-serif italic font-bold text-slate-800 text-sm tracking-wide">
              Ibrahim S. Danladi
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 mt-1">
            {school?.bursarName || "Alhaji Ibrahim S. Danladi"}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Authorized Bursar • Al-Furqan College
          </div>
          <div className="inline-flex items-center gap-1 mt-1 text-[9px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="h-3 w-3" />
            Digitally Sealed & Authorized
          </div>
        </div>
      </div>
    </div>
  );
}

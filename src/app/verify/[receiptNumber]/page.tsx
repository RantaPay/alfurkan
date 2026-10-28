"use client";

import { Receipt } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyReceiptPage() {
  const params = useParams();
  const receiptNumber = params?.receiptNumber as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!receiptNumber) return;
    const verify = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/receipts?number=${encodeURIComponent(receiptNumber)}`);
        const data = await res.json();
        if (data.success && data.receipt) {
          setReceipt(data.receipt);
        } else {
          setError("Receipt not found or invalid QR code.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to verify receipt");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [receiptNumber]);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Verification Header */}
        <div className="bg-[#075E54] p-5 text-center relative overflow-hidden">
          <div className="h-16 w-16 rounded-lg bg-white p-1.5 shadow-lg mx-auto mb-2 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Alfurqan Crest" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-base font-semibold tracking-tight text-white">
            Alfurqan International Academy
          </h1>
          <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
            Verify a receipt
          </p>
        </div>

        {/* Verification Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Verifying digital certificate...</p>
            </div>
          ) : error || !receipt ? (
            <div className="py-8 text-center space-y-3">
              <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
              <h2 className="text-base font-bold text-slate-900">Verification Failed</h2>
              <p className="text-xs text-slate-500">
                This receipt code was not issued by Alfurqan International Academy or is invalid.
              </p>
            </div>
          ) : (
            <>
              {receipt.isVoided ? (
                <>
                  <div className="p-4 rounded-lg bg-rose-500/15 border-2 border-rose-500/50 text-center space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-rose-700 font-semibold text-xs  tracking-normal">
                      <AlertTriangle className="h-4 w-4" />
                      <span>RECEIPT REVOKED • VOID & INVALID</span>
                    </div>
                    <div className="text-xl font-semibold text-rose-800 font-mono line-through">
                      {receipt.receiptNumber}
                    </div>
                    <p className="text-xs font-bold text-rose-700">
                      Reason: &quot;{receipt.voidReason || "Payment Revoked / Cancelled"}&quot;
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Voided by {receipt.voidedBy || "Accountant"} on {receipt.voidedAt ? new Date(receipt.voidedAt).toLocaleDateString() : ""}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 text-white font-semibold text-sm shadow-lg shadow-rose-600/30">
                      <AlertTriangle className="h-5 w-5" />
                      <span>RECEIPT REVOKED</span>
                    </div>
                    <p className="text-[11px] text-rose-700 mt-2 font-semibold">
                      This receipt was cancelled by Accounts. Direct inquiries to the Accounts Office.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Authenticity Verified Banner */}
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs  tracking-normal">
                      <ShieldCheck className="h-4 w-4" />
                      <span>VERIFIED RECEIPT</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-900 font-mono">
                      {receipt.receiptNumber}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Issued on {receipt.date} • {receipt.term} ({receipt.session})
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="text-center">
                    {receipt.paymentStatus === "FULL" ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>CLEARED • FULL PAYMENT</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20">
                        <Clock className="h-5 w-5" />
                        <span>PARTIAL PAYMENT • ₦{receipt.balanceRemaining.toLocaleString()} REMAINING</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Student Particulars */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-900 text-sm font-semibold">{receipt.studentName}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Admission No:</span>
                  <span className="font-mono font-bold text-emerald-700">{receipt.regNumber}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Class:</span>
                  <strong className="text-slate-900">{receipt.studentClass}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Amount Paid:</span>
                  <strong className="font-mono text-emerald-700 text-sm">
                    {formatNaira(receipt.amountPaid)}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Outstanding Debt:</span>
                  <strong className={`font-mono text-sm ${receipt.balanceRemaining > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                    {formatNaira(receipt.balanceRemaining)}
                  </strong>
                </div>
              </div>

              {/* Security Audit Seal */}
              <div className="text-center pt-2">
                <div className="font-mono text-[10px] text-slate-500">
                  Audit Hash: {receipt.securityHash}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Issued by: <strong>{receipt.issuedBy}</strong>
                </div>
              </div>
            </>
          )}

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-brand underline"
            >
              Back to Alfurqan Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

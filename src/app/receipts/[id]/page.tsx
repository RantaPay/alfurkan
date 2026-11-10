"use client";
import { Dialog } from "@/components/ui/dialog";

import { ReceiptDocument } from "@/components/receipts/ReceiptDocument";
import { Receipt, SchoolProfile } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Download,
  Loader2,
  MessageSquare,
  Printer,
  Share2,
  ShieldAlert,
  X
} from "lucide-react";
import { returnLabel, safeReturnPath } from "@/lib/return-path";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function ReceiptBackLink() {
  const from = useSearchParams().get("from");
  const backTo = safeReturnPath(from, "/");
  return <BackLink href={backTo} label={from ? returnLabel(backTo) : "Dashboard"} />;
}

export default function ReceiptViewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeFormat, setActiveFormat] = useState<"thermal" | "traditional" | "statement">("traditional");

  // Voiding State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("Bank transfer bounced / invalid payment proof");
  const [customVoidReason, setCustomVoidReason] = useState("");
  const [voidError, setVoidError] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidSuccess, setVoidSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const [recRes, schoolRes] = await Promise.all([
          fetch(`/api/receipts`),
          fetch(`/api/settings`),
        ]);

        const recData = await recRes.json();
        const schoolData = await schoolRes.json();

        if (recData.success) {
          const found = recData.receipts.find((r: Receipt) => r.id === id);
          if (found) {
            setReceipt(found);
          } else {
            setError("Receipt not found.");
          }
        }
        if (schoolData.success) {
          setSchool(schoolData.school);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receipt) return;
    if (activeFormat === "thermal") {
      setActiveFormat("traditional");
      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }
    const element = document.getElementById("printable-receipt");
    if (!element) return;

    setIsDownloadingPdf(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FCFBF7",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AlFurqan_Receipt_${receipt.receiptNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed, falling back to print", err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVoidReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) return;
    setVoidError("");

    const finalReason = voidReason === "Other" ? customVoidReason.trim() : voidReason;
    if (!finalReason) {
      setVoidError("Please specify a cancellation reason.");
      return;
    }

    try {
      setIsVoiding(true);
      const res = await fetch("/api/receipts/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: receipt.id,
          reason: finalReason,
          voidedBy: school?.accountantName || "Authorized Administrator",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      setReceipt(data.receipt);
      setIsVoidModalOpen(false);
      setVoidSuccess(true);
      setTimeout(() => setVoidSuccess(false), 5000);
    } catch (err: any) {
      setVoidError(err.message || "Failed to void receipt.");
    } finally {
      setIsVoiding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-100 flex items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-dvh bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-900">Receipt Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested school receipt could not be found.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isFull = receipt.paymentStatus === "FULL";

  // WhatsApp Pre-composed Message for parent
  const parentWaUrl = `https://wa.me/234${receipt.parentPhone.replace(/^0/, "")}?text=${encodeURIComponent(
    `Assalamu Alaikum ${receipt.parentName},\n\nFee Receipt Confirmation for ${receipt.studentName} (${receipt.regNumber}) at Alfurqan International Academy.\n\n• Receipt No: ${receipt.receiptNumber}\n• Amount Paid: ${formatNaira(receipt.amountPaid)}\n• Status: ${receipt.isVoided ? "CANCELLED / REVOKED" : isFull ? "PAID IN FULL (CLEARED)" : `PARTIAL PAYMENT (Balance Remaining: ${formatNaira(receipt.balanceRemaining)})`}\n• Date: ${receipt.date}\n\nView and download your clearance receipt:\n${typeof window !== "undefined" ? window.location.href : `https://alfurqan.edu.ng/receipts/${receipt.id}`}\n\nWarm regards,\nCashier & Accounts Department\nAlfurqan International Academy`
  )}`;

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="print:hidden sticky top-4 z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <Suspense fallback={<BackLink href="/" label="Dashboard" />}>
                <ReceiptBackLink />
              </Suspense>
              <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
              <span className={`truncate font-mono text-sm font-semibold ${receipt.isVoided ? "line-through text-rose-700" : "text-slate-800"}`}>
                {receipt.receiptNumber}
              </span>
              {receipt.isVoided && (
                <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                  Voided
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                aria-label={copied ? "Link copied" : "Copy link"}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
              </button>
              {!receipt.isVoided ? (
                <button
                  type="button"
                  onClick={() => {
                    setVoidError("");
                    setIsVoidModalOpen(true);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  title="Cancel this receipt and reverse the payment"
                >
                  <Ban className="h-4 w-4" />
                  <span>Void</span>
                </button>
              ) : (
                <span className="inline-flex h-9 items-center gap-1.5 px-2.5 text-sm font-semibold text-rose-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Cancelled</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 p-3 min-[840px]:flex-row min-[840px]:items-center min-[840px]:justify-between">
            <div role="tablist" aria-label="Receipt format" className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 min-[840px]:flex">
              {([
                ["traditional", "A4 paper"],
                ["thermal", "Thermal roll"],
                ["statement", "Statement"],
              ] as const).map(([format, label]) => (
                <button
                  key={format}
                  type="button"
                  role="tab"
                  aria-selected={activeFormat === format}
                  onClick={() => setActiveFormat(format)}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold sm:text-sm ${
                    activeFormat === format
                      ? "bg-white text-[#075E54] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 min-[840px]:flex">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#075E54] px-3 text-sm font-semibold text-white hover:bg-[#128C7E] min-[840px]:px-4"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                disabled={isDownloadingPdf}
                onClick={handleDownloadPdf}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 min-[840px]:px-4"
              >
                {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="sm:hidden">{isDownloadingPdf ? "Saving" : "PDF"}</span>
                <span className="hidden sm:inline">{isDownloadingPdf ? "Saving PDF" : "Download PDF"}</span>
              </button>
              <a
                href={parentWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-white min-[840px]:px-4 ${
                  receipt.isVoided ? "bg-slate-500 hover:bg-slate-600" : "bg-[#25D366] hover:bg-[#1EBE5D]"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="truncate">{receipt.isVoided ? "Notice" : "WhatsApp"}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Void Success Notification Toast */}
        {voidSuccess && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 text-rose-600 shrink-0" />
            <span>
              Receipt {receipt.receiptNumber} has been successfully voided. Student balance has been automatically adjusted.
            </span>
          </div>
        )}

        {/* The Official Printable Digital Receipt Document */}
        <ReceiptDocument
          receipt={receipt}
          school={school || undefined}
          hideActions
          selectedFormat={activeFormat}
          onFormatSelect={setActiveFormat}
        />
      </div>

      {/* Void Confirmation Modal */}
      {isVoidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Dialog label="Cancel receipt" onClose={() => { if (!isVoiding) setIsVoidModalOpen(false); }} className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-base font-semibold">Void Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoidModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-lg border border-rose-200 text-rose-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>Payment Reversal Warning</span>
              </div>
              <p className="leading-relaxed">
                Voiding receipt <strong className="font-mono">{receipt.receiptNumber}</strong> will reverse the payment of <strong className="font-mono">{formatNaira(receipt.amountPaid)}</strong> for <strong>{receipt.studentName}</strong> in the term(s) covered by this receipt.
              </p>
            </div>

            {voidError && (
              <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{voidError}</span>
              </div>
            )}

            <form onSubmit={handleVoidReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Bank transfer bounced / invalid payment proof">
                    Bank transfer bounced / invalid bank proof
                  </option>
                  <option value="Duplicate payment entry by mistake">
                    Duplicate payment entry by mistake
                  </option>
                  <option value="Incorrect student selected during issuance">
                    Incorrect student selected during issuance
                  </option>
                  <option value="Payment reversal or parent refund processed">
                    Payment reversal or parent refund processed
                  </option>
                  <option value="Other">Other (Specify Below)</option>
                </select>
              </div>

              {voidReason === "Other" && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Specify Custom Reason
                  </label>
                  <textarea
                    rows={2}
                    value={customVoidReason}
                    onChange={(e) => setCustomVoidReason(e.target.value)}
                    placeholder="Provide detailed explanation for cancellation audit trail..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Authorized action: Voiding will flag this receipt as cancelled and return the payment amount to the student&apos;s pending balance.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVoidModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVoiding}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  <span>{isVoiding ? "Voiding..." : "Confirm Void"}</span>
                </button>
              </div>
            </form>
          </Dialog>
        </div>
      )}
    </div>
  );
}

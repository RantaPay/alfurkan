"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReceiptDocument } from "@/components/receipts/ReceiptDocument";
import { Receipt, SchoolProfile } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  Printer,
  ArrowLeft,
  MessageSquare,
  Share2,
  CheckCircle2,
  Download,
  AlertCircle,
  Building2,
  Ban,
  AlertTriangle,
  Lock,
  Loader2,
  X,
  ShieldAlert,
  ScrollText,
} from "lucide-react";

export default function ReceiptViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeFormat, setActiveFormat] = useState<"thermal" | "traditional" | "statement">("thermal");

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

  const handlePrintThermal = () => {
    setActiveFormat("thermal");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintStandard = () => {
    setActiveFormat("traditional");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadPdf = async () => {
    if (!receipt) return;
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Receipt Not Found</h2>
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

  const isFull = receipt.paymentStatus === "FULL" || receipt.balanceRemaining === 0;

  // WhatsApp Pre-composed Message for parent
  const parentWaUrl = `https://wa.me/234${receipt.parentPhone.replace(/^0/, "")}?text=${encodeURIComponent(
    `Assalamu Alaikum ${receipt.parentName},\n\nFee Receipt Confirmation for ${receipt.studentName} (${receipt.regNumber}) at Al-Furqan International Academy.\n\n• Receipt No: ${receipt.receiptNumber}\n• Amount Paid: ${formatNaira(receipt.amountPaid)}\n• Status: ${receipt.isVoided ? "CANCELLED / REVOKED" : isFull ? "PAID IN FULL (CLEARED)" : `PARTIAL PAYMENT (Balance Remaining: ${formatNaira(receipt.balanceRemaining)})`}\n• Date: ${receipt.date}\n\nView and download your clearance receipt:\n${typeof window !== "undefined" ? window.location.href : `https://alfurqan.edu.ng/receipts/${receipt.id}`}\n\nWarm regards,\nCashier & Accounts Department\nAl-Furqan International Academy`
  )}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Floating Action Bar (Hidden during print) */}
        <div className="print:hidden bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 sticky top-4 z-40">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-bold"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <span className={`font-mono text-sm font-black ${receipt.isVoided ? "line-through text-rose-700" : "text-slate-800"}`}>
              {receipt.receiptNumber}
            </span>
            {receipt.isVoided && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                VOIDED
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Share to Parent WhatsApp Button */}
            <a
              href={parentWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-white px-4 py-2.5 rounded-xl text-sm font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                receipt.isVoided ? "bg-slate-500 hover:bg-slate-600 opacity-80" : "bg-[#25D366] hover:bg-[#1EBE5D]"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5 fill-white" />
              <span>{receipt.isVoided ? "Send Notice via WA" : "Send to Parent WhatsApp"}</span>
            </a>

            {/* Direct 1-Click PDF Download Button */}
            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download high-resolution .pdf document"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-4.5 w-4.5" />
                  <span>Download PDF (.pdf)</span>
                </>
              )}
            </button>

            {/* Direct Thermal POS 80mm Print Button */}
            <button
              type="button"
              onClick={handlePrintThermal}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Print directly to POS Thermal Receipt Printer (80mm Roll)"
            >
              <Printer className="h-4 w-4 text-emerald-400" />
              <span>Print POS Slip (80mm)</span>
            </button>

            {/* Standard A4 Voucher Print Button */}
            <button
              type="button"
              onClick={handlePrintStandard}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Print standard A4 slip on office desktop printer"
            >
              <ScrollText className="h-4 w-4" />
              <span>Print A4</span>
            </button>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>

            {/* Void / Cancel Receipt Trigger */}
            {!receipt.isVoided ? (
              <button
                type="button"
                onClick={() => {
                  setVoidError("");
                  setIsVoidModalOpen(true);
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer"
                title="Cancel receipt and reverse student payment in ledger"
              >
                <Ban className="h-4 w-4 text-rose-600" />
                <span>Void Receipt</span>
              </button>
            ) : (
              <span className="text-rose-600 text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <span>Cancelled</span>
              </span>
            )}
          </div>
        </div>

        {/* Void Success Notification Toast */}
        {voidSuccess && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 text-rose-600 shrink-0" />
            <span>
              Receipt {receipt.receiptNumber} has been successfully voided. Student ledger and debt balance have been automatically adjusted.
            </span>
          </div>
        )}

        {/* The Official Printable Digital Receipt Document */}
        <ReceiptDocument
          receipt={receipt}
          school={school || undefined}
          selectedFormat={activeFormat}
          onFormatSelect={setActiveFormat}
        />

        {/* Print instructions notice (Hidden in print) */}
        <div className="print:hidden text-center text-xs text-slate-500 py-4">
          Tip: Click <strong>&quot;Download PDF (.pdf)&quot;</strong> to directly save a high-res PDF copy, or <strong>&quot;Send to Parent WhatsApp&quot;</strong> to forward official clearance to the parent.
        </div>
      </div>

      {/* Void Confirmation Modal */}
      {isVoidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-base font-black">Void Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoidModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-rose-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>Financial Ledger Reversal Warning</span>
              </div>
              <p className="leading-relaxed">
                Voiding receipt <strong className="font-mono">{receipt.receiptNumber}</strong> will reverse the payment of <strong className="font-mono">{formatNaira(receipt.amountPaid)}</strong> from <strong>{receipt.studentName}&apos;s</strong> ledger. Their debt balance will increase back to the unpaid amount.
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
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  <span>{isVoiding ? "Voiding..." : "Confirm Void"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

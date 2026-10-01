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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading official digital receipt...</p>
        </div>
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
            The requested school receipt could not be retrieved from the database.
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
    `Assalamu Alaikum ${receipt.parentName},\n\nOfficial Fee Receipt Confirmation for ${receipt.studentName} (${receipt.regNumber}) at Al-Furqan International College.\n\n• Receipt No: ${receipt.receiptNumber}\n• Amount Paid: ${formatNaira(receipt.amountPaid)}\n• Status: ${isFull ? "PAID IN FULL (CLEARED)" : `PARTIAL PAYMENT (Balance Remaining: ${formatNaira(receipt.balanceRemaining)})`}\n• Date: ${receipt.date}\n\nView and download your official clearance receipt:\n${typeof window !== "undefined" ? window.location.href : `https://alfurqan.edu.ng/receipts/${receipt.id}`}\n\nWarm regards,\nBursary Department\nAl-Furqan International College`
  )}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Floating Action Bar (Hidden during print) */}
        <div className="print:hidden bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 sticky top-4 z-40">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <span className="font-mono text-xs font-black text-slate-800">
              {receipt.receiptNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Share to Parent WhatsApp Button */}
            <a
              href={parentWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 fill-white" />
              <span>Send to Parent WhatsApp</span>
            </a>

            {/* Print / Save as PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#075E54] hover:bg-[#128C7E] text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Download PDF</span>
            </button>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* The Official Printable Digital Receipt Document */}
        <ReceiptDocument receipt={receipt} school={school || undefined} />

        {/* Print instructions notice (Hidden in print) */}
        <div className="print:hidden text-center text-xs text-slate-500 py-4">
          Tip: Click <strong>&quot;Print / Download PDF&quot;</strong> to save a clean PDF copy or print via your thermal/desktop printer.
        </div>
      </div>
    </div>
  );
}

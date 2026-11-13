"use client";

import { Dialog } from "@/components/ui/dialog";
import { decideOutbox, downloadForOffline, syncOutbox } from "@/lib/offline/sync";
import { readOutbox, readSnapshot, type OutboxReceipt } from "@/lib/offline/store";
import { useConnection } from "@/lib/offline/useConnection";
import { Download, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function savedLabel(savedAt: string | null): string {
  if (!savedAt) return "Download for offline";
  const saved = new Date(savedAt);
  if (Number.isNaN(saved.getTime())) return "Saved for offline";
  return `Saved ${saved.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
}

export function OfflineControls() {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [entries, setEntries] = useState<OutboxReceipt[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const online = useConnection();

  const refresh = () => {
    readSnapshot().then((snapshot) => setSavedAt(snapshot?.savedAt || null)).catch(() => undefined);
    readOutbox().then(setEntries).catch(() => undefined);
  };

  useEffect(() => {
    refresh();
    const onChange = () => {
      refresh();
      if (navigator.onLine) syncOutbox().catch(() => undefined);
    };
    window.addEventListener("online", onChange);
    window.addEventListener("alfurqan-offline", refresh);
    document.addEventListener("visibilitychange", onChange);
    if (typeof navigator !== "undefined" && navigator.onLine) syncOutbox().catch(() => undefined);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("alfurqan-offline", refresh);
      document.removeEventListener("visibilitychange", onChange);
    };
  }, []);

  const waiting = entries.filter((entry) => entry.status === "waiting" || entry.status === "syncing");
  const decisions = entries.filter((entry) => entry.status === "needs_decision");
  const reprints = entries.filter((entry) => entry.status === "reprint");

  const download = async () => {
    setBusy(true);
    setError("");
    try {
      await downloadForOffline();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download the accounts copy.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <span
        role="status"
        aria-live="polite"
        title={online ? "Connected. Receipts sync to the database." : "No connection. New receipts stay on this computer until you are back online."}
        className={`inline-flex h-9 items-center gap-2 rounded-full border px-2.5 text-xs font-semibold ${
          online ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
        {online ? "Online" : "Offline"}
      </span>
      <button
        type="button"
        onClick={() => (decisions.length || reprints.length ? setOpen(true) : download())}
        disabled={busy || (!online && !savedAt)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        title={error || savedLabel(savedAt)}
      >
        {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        <span className="hidden md:inline">
          {busy ? "Downloading" : decisions.length ? `${decisions.length} to review` : waiting.length ? `${waiting.length} waiting` : savedLabel(savedAt)}
        </span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
        <Dialog label="Offline receipts" onClose={() => setOpen(false)} className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
          <h2 className="text-base font-semibold text-slate-900">Receipts waiting on this computer</h2>
          <div className="mt-4 space-y-3">
            {decisions.map((entry) => (
              <div key={entry.clientReceiptId} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{String(entry.payload.studentName || "Receipt")} · {entry.provisionalRef}</p>
                <p className="mt-1 text-slate-600">{entry.message}</p>
                {entry.conflict && <p className="mt-1 font-mono text-xs text-slate-700">Already recorded as {entry.conflict.receiptNumber}</p>}
                <div className="mt-3 flex gap-2">
                  <button type="button" className="rounded-lg bg-[#075E54] px-3 py-1.5 text-xs font-semibold text-white" onClick={() => decideOutbox(entry.clientReceiptId, true).then(refresh)}>Record again</button>
                  <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700" onClick={() => decideOutbox(entry.clientReceiptId, false).then(refresh)}>Discard</button>
                </div>
              </div>
            ))}
            {reprints.map((entry) => (
              <div key={entry.clientReceiptId} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{entry.officialNumber || entry.provisionalRef}</p>
                <p className="mt-1 text-slate-600">{entry.message}</p>
                {entry.officialId && <Link href={`/receipts/${entry.officialId}`} className="mt-2 inline-block text-xs font-semibold text-[#075E54]">Open official receipt</Link>}
              </div>
            ))}
            {!decisions.length && !reprints.length && <p className="text-sm text-slate-500">Nothing needs a decision.</p>}
          </div>
        </Dialog>
        </div>
      )}
    </>
  );
}

"use client";

import { classifySyncResult } from "@/lib/offline/sync-result";
import { readOutbox, saveOutbox, writeSnapshot, type OutboxReceipt } from "@/lib/offline/store";

let refreshing = false;

function publish() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("alfurqan-offline"));
}

async function postReceipt(entry: OutboxReceipt) {
  const response = await fetch("/api/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...entry.payload,
      clientReceiptId: entry.clientReceiptId,
      confirmDuplicate: entry.confirmDuplicate === true,
      provisionalBill: entry.provisionalBill,
      provisionalBalance: entry.provisionalBalance,
    }),
  });
  const data = await response.json().catch(() => ({ success: false, error: "The server did not answer." }));
  return { response, data };
}

async function syncBody() {
  const entries = await readOutbox();
  let blocked = false;
  for (const entry of entries) {
    if (entry.status !== "waiting") continue;
    if (blocked) break;
    await saveOutbox({ ...entry, status: "syncing" });
    publish();
    try {
      const { response, data } = await postReceipt(entry);
      if (!response.ok || !data.success) {
        const status = classifySyncResult({ ok: false, code: data.code });
        if (data.code === "SYNC_UNAVAILABLE") {
          await saveOutbox({ ...entry, status: "waiting", message: "The database is not ready for offline sync yet." });
          blocked = true;
        } else {
          await saveOutbox({
            ...entry,
            status,
            message: data.error || "This receipt needs a decision.",
            conflict: data.duplicate,
          });
        }
        continue;
      }
      const status = classifySyncResult({ ok: true, reprint: data.reprint === true });
      await saveOutbox({
        ...entry,
        status,
        officialId: data.receipt.id,
        officialNumber: data.receipt.receiptNumber,
        message: status === "reprint" ? "The official balance changed. Reprint this receipt." : undefined,
      });
    } catch {
      await saveOutbox({ ...entry, status: "waiting", message: "The connection dropped. It will be tried again." });
      blocked = true;
    }
  }
  publish();
  const remaining = await readOutbox();
  if (!remaining.some((entry) => entry.status === "waiting" || entry.status === "syncing") && !refreshing) {
    refreshing = true;
    try {
      const response = await fetch("/api/offline/snapshot");
      const data = await response.json();
      if (response.ok && data.success) await writeSnapshot(data.snapshot);
    } catch {
      // Keep the previous copy.
    } finally {
      refreshing = false;
      publish();
    }
  }
}

export async function syncOutbox(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.onLine) return;
  if (!navigator.locks) {
    await syncBody();
    return;
  }
  await navigator.locks.request("alfurqan-receipt-sync", async () => {
    await syncBody();
  });
}

export async function downloadForOffline(): Promise<string> {
  const response = await fetch("/api/offline/snapshot");
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || "Unable to download the accounts copy.");
  await writeSnapshot(data.snapshot);
  publish();
  await syncOutbox();
  return data.snapshot.savedAt as string;
}

export async function decideOutbox(clientReceiptId: string, confirm: boolean): Promise<void> {
  const entries = await readOutbox();
  const entry = entries.find((item) => item.clientReceiptId === clientReceiptId);
  if (!entry) return;
  if (!confirm) {
    const { removeOutbox } = await import("@/lib/offline/store");
    await removeOutbox(clientReceiptId);
    publish();
    return;
  }
  await saveOutbox({ ...entry, status: "waiting", confirmDuplicate: true, message: undefined });
  publish();
  await syncOutbox();
}

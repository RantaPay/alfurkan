"use client";

import { ReceiptDocument } from "@/components/receipts/ReceiptDocument";
import { loadJson } from "@/lib/offline/store";
import { elementToPdfFile, shareReceiptFile, whatsappPhone } from "@/lib/share-receipt";
import type { Receipt, SchoolProfile } from "@/lib/types";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createElement } from "react";

export function ShareReceiptButton({ receipt, className }: { receipt: Receipt; className?: string }) {
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-12000px;top:0;width:820px;background:#FCFBF7;";
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      let school: SchoolProfile | undefined;
      try {
        const data = await loadJson("/api/settings");
        school = data.school;
      } catch {
        school = undefined;
      }
      root.render(createElement(ReceiptDocument, { receipt, school, hideActions: true, selectedFormat: "traditional" }));
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      const element = host.querySelector("#printable-receipt");
      if (!(element instanceof HTMLElement)) return;
      const file = await elementToPdfFile(element, `AlFurqan_Receipt_${receipt.receiptNumber}.pdf`);
      await shareReceiptFile(file, whatsappPhone(receipt.parentPhone));
    } catch (err) {
      if (!(err instanceof Error) || err.name !== "AbortError") console.error("WhatsApp share failed", err);
    } finally {
      root.unmount();
      host.remove();
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={share} disabled={busy} className={className} title="Send the A4 receipt PDF on WhatsApp">
      <MessageSquare className="h-4 w-4" />
    </button>
  );
}

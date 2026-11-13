"use client";

import { Dialog } from "@/components/ui/dialog";
import type { Receipt, ReceiptItem } from "@/lib/types";
import { useState } from "react";

const CATEGORIES = ["Tuition", "Books", "Uniform", "PTA", "Transport", "Excursion", "Development", "Other"] as const;
const METHODS = ["Bank Transfer", "Bank Deposit", "POS", "Cash"] as const;
const TERMS = ["1st Term", "2nd Term", "3rd Term", "Whole Session"] as const;

export function EditReceiptDialog({ receipt, onClose, onSaved }: { receipt: Receipt; onClose: () => void; onSaved: (receipt: Receipt) => void }) {
  const [items, setItems] = useState<ReceiptItem[]>(receipt.items?.length ? receipt.items.map((item) => ({ ...item })) : [{ name: "Tuition / School Fees", category: "Tuition", amount: receipt.amountPaid }]);
  const [paymentMethod, setPaymentMethod] = useState(receipt.paymentMethod);
  const [bankName, setBankName] = useState(receipt.bankName || "");
  const [bankReference, setBankReference] = useState(receipt.bankReference || "");
  const [date, setDate] = useState(receipt.date);
  const [depositorName, setDepositorName] = useState(receipt.parentName || "");
  const [depositorPhone, setDepositorPhone] = useState(receipt.parentPhone || "");
  const [term, setTerm] = useState(receipt.term);
  const [notes, setNotes] = useState(receipt.notes || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/receipts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: receipt.id,
          items: items.map((item) => ({ name: item.name, category: item.category, amount: Number(item.amount), description: item.description })),
          paymentMethod,
          bankName,
          bankReference,
          date,
          depositorName,
          depositorPhone,
          notes,
          term,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save this receipt.");
      onSaved(data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this receipt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <Dialog label="Edit receipt" onClose={onClose} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-slate-900">Edit {receipt.receiptNumber}</h2>
        <p className="mt-1 text-sm text-slate-500">The receipt number stays the same. This student’s balance is calculated again from the correction.</p>
        <form onSubmit={save} className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_8rem_6rem] gap-2">
              <input value={item.name} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" aria-label="Fee name" />
              <select value={item.category} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, category: event.target.value as ReceiptItem["category"] } : row))} className="h-10 rounded-lg border border-slate-200 px-2 text-sm" aria-label="Fee category">
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
              <input type="number" min="0" step="0.01" value={item.amount} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, amount: Number(event.target.value) } : row))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" aria-label="Amount" />
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { name: "", category: "Other", amount: 0 }])} className="text-sm font-semibold text-[#075E54]">Add fee</button>
          <div className="grid grid-cols-2 gap-2">
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as Receipt["paymentMethod"])} className="h-10 rounded-lg border border-slate-200 px-2 text-sm" aria-label="Payment method">
              {METHODS.map((method) => <option key={method}>{method}</option>)}
            </select>
            <select value={TERMS.includes(term as typeof TERMS[number]) ? term : TERMS[0]} onChange={(event) => setTerm(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-2 text-sm" aria-label="Payment period">
              {TERMS.map((period) => <option key={period}>{period}</option>)}
            </select>
            <input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Bank" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" aria-label="Bank" />
            <input value={bankReference} onChange={(event) => setBankReference(event.target.value)} placeholder="Reference" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" aria-label="Reference" />
            <input value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" aria-label="Payment date" />
            <input value={depositorPhone} onChange={(event) => setDepositorPhone(event.target.value)} placeholder="Parent phone" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" aria-label="Parent phone" />
          </div>
          <input value={depositorName} onChange={(event) => setDepositorName(event.target.value)} placeholder="Payer name" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" aria-label="Payer name" />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" aria-label="Note" />
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-600">Cancel</button>
            <button type="submit" disabled={saving} className="h-10 rounded-lg bg-[#075E54] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving" : "Save correction"}</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

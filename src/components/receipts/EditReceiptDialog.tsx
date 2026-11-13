"use client";

import { Dialog } from "@/components/ui/dialog";
import { OTHER_FEE_OPTIONS, PRESET_FEE_OPTIONS, STANDARD_FEE_OPTIONS } from "@/features/receipts/fee-options";

import { loadJson } from "@/lib/offline/store";
import type { BankAccountConfig, Receipt, ReceiptItem } from "@/lib/types";
import { useEffect, useState } from "react";

const TERMS = ["1st Term", "2nd Term", "3rd Term", "Whole Session"] as const;

function toDateInput(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
}

export function EditReceiptDialog({ receipt, onClose, onSaved }: { receipt: Receipt; onClose: () => void; onSaved: (receipt: Receipt) => void }) {
  const [items, setItems] = useState<ReceiptItem[]>(receipt.items?.length ? receipt.items.map((item) => ({ ...item })) : [{ name: "Tuition / School Fees", category: "Tuition", amount: receipt.amountPaid }]);
  const [paymentMethod, setPaymentMethod] = useState(receipt.paymentMethod);
  const [bankName, setBankName] = useState(receipt.bankName || (receipt.paymentMethod === "Cash" ? "Cash" : ""));
  const [date, setDate] = useState(toDateInput(receipt.date));
  const [depositorName, setDepositorName] = useState(receipt.parentName || "");
  const [depositorPhone, setDepositorPhone] = useState(receipt.parentPhone || "");
  const [term, setTerm] = useState(receipt.term);
  const [banks, setBanks] = useState<BankAccountConfig[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadJson("/api/settings")
      .then((data) => setBanks(data.school?.bankAccounts || []))
      .catch(() => setBanks([]));
  }, []);

  const bankOptions = banks.some((bank) => bank.bankName === bankName) || bankName === "Cash" || !bankName
    ? banks
    : [{ id: "current", bankName, accountNumber: "", accountName: "", isDefault: false }, ...banks];

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
          items: items.map((item) => ({ name: item.name, category: item.category, amount: Number(item.amount) })),
          paymentMethod,
          bankName,
          date,
          depositorName,
          depositorPhone,
          notes: "",
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
      <Dialog label="Edit receipt" onClose={onClose} className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-slate-900">Edit {receipt.receiptNumber}</h2>
        <p className="mt-1 text-sm text-slate-500">The receipt number stays the same. This student’s balance is calculated again from the correction.</p>
        <form onSubmit={save} className="mt-4 space-y-4">
          {items.map((item, index) => {
            const isStandard = STANDARD_FEE_OPTIONS.some((option) => option.name === item.name);
            const isOtherPreset = OTHER_FEE_OPTIONS.some((option) => option.name === item.name && option.name !== "CUSTOM");
            const isCustom = !isStandard && !isOtherPreset;
            return (
              <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_7rem]">
                <label className="text-xs font-semibold text-slate-500">
                  Standard Fees
                  <select
                    aria-label="Standard Fees"
                    value={isStandard ? item.name : ""}
                    onChange={(event) => {
                      const found = STANDARD_FEE_OPTIONS.find((option) => option.name === event.target.value);
                      if (!found) return;
                      setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, name: found.name, category: found.category, amount: 0 } : row));
                    }}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
                  >
                    <option value="">-- Select Standard Fee --</option>
                    {STANDARD_FEE_OPTIONS.map((option) => <option key={option.name} value={option.name}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-amber-800">
                  Others
                  <select
                    aria-label="Others"
                    value={isOtherPreset ? item.name : isCustom ? "CUSTOM" : ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "CUSTOM") {
                        setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, name: PRESET_FEE_OPTIONS.some((option) => option.name === row.name) ? "" : row.name, category: "Other" } : row));
                        return;
                      }
                      const found = OTHER_FEE_OPTIONS.find((option) => option.name === value);
                      if (!found) return;
                      setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, name: found.name, category: found.category } : row));
                    }}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
                  >
                    <option value="">-- Others (Select Fee) --</option>
                    {OTHER_FEE_OPTIONS.map((option) => <option key={option.name} value={option.name}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-500">
                  Amount
                  <input type="number" min="0" step="0.01" value={item.amount} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, amount: Number(event.target.value) } : row))} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold" aria-label="Amount" />
                </label>
                {isCustom && (
                  <input value={item.name} onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value, category: "Other" } : row))} placeholder="Fee name" className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm md:col-span-3" aria-label="Custom fee name" />
                )}
              </div>
            );
          })}
          <button type="button" onClick={() => setItems([...items, { name: "Tuition / School Fees", category: "Tuition", amount: 0 }])} className="text-sm font-semibold text-[#075E54]">Add fee</button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-700">
              Payment method
              <select
                aria-label="Payment method"
                value={paymentMethod}
                onChange={(event) => {
                  const value = event.target.value as Receipt["paymentMethod"];
                  setPaymentMethod(value);
                  if (value === "Cash") setBankName("Cash");
                  else if (bankName === "Cash") setBankName(banks[0]?.bankName || "");
                }}
                className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"
              >
                <option value="Bank Transfer">Direct Bank Transfer</option>
                <option value="Bank Deposit">Bank Teller Deposit</option>
                <option value="POS">School POS Machine</option>
                <option value="Cash">Cash</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Receiving bank
              <select aria-label="Receiving bank" value={bankName} onChange={(event) => setBankName(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold">
                {bankOptions.map((bank) => (
                  <option key={bank.id} value={bank.bankName}>{bank.accountNumber ? `${bank.bankName} (${bank.accountNumber})` : bank.bankName}</option>
                ))}
                {!bankOptions.some((bank) => bank.bankName === "Cash") && <option value="Cash">Cash</option>}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Payment date
              <input aria-label="Payment date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold" />
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Payment period
            <select aria-label="Payment period" value={TERMS.includes(term as typeof TERMS[number]) ? term : TERMS[0]} onChange={(event) => setTerm(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold">
              {TERMS.map((period) => <option key={period}>{period}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={depositorName} onChange={(event) => setDepositorName(event.target.value)} placeholder="Payer name" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" aria-label="Payer name" />
            <input value={depositorPhone} onChange={(event) => setDepositorPhone(event.target.value)} placeholder="Parent phone" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" aria-label="Parent phone" />
          </div>
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

"use client";
import { useReceiptForm } from "@/features/receipts/useReceiptForm";
type Props = { form: Pick<ReturnType<typeof useReceiptForm>, "bankReference" | "setBankReference" | "notes" | "setNotes" | "depositorName" | "setDepositorName" | "paymentMethod" | "setPaymentMethod" | "receivingBank" | "setReceivingBank" | "receivingDate" | "setReceivingDate" | "configuredBanks"> };
export function ReceiptPaymentSection({ form }: Props) {
  const { bankReference, setBankReference, notes, setNotes, depositorName, setDepositorName, paymentMethod, setPaymentMethod, receivingBank, setReceivingBank, receivingDate, setReceivingDate, configuredBanks } = form;
  return (<>
    {/* STEP 3: Payment method, Receiving Bank & Receiving Date */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <div>
        <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
          3. Payment method
        </label>
        <select aria-label="3. Payment method"
          value={paymentMethod}
          onChange={(e: any) => {
            const val = e.target.value;
            setPaymentMethod(val);
            if (val === "Cash") {
              setReceivingBank("Cash");
            } else if (receivingBank === "Cash") {
              setReceivingBank(configuredBanks[0]?.bankName || "");
            }
          }}
          className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
        >
          <option value="Bank Transfer">Direct Bank Transfer</option>
          <option value="Bank Deposit">Bank Teller Deposit</option>
          <option value="POS">School POS Machine</option>
          <option value="Cash">Cash</option>
        </select>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
          Receiving Bank / Account
        </label>
        <select aria-label="Receiving Bank / Account"
          value={receivingBank}
          onChange={(e) => setReceivingBank(e.target.value)}
          className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
        >
          {configuredBanks.length > 0 ? (
            <>
              {configuredBanks.map((b) => (
                <option key={b.id} value={b.bankName}>
                  {b.bankName} ({b.accountNumber}){b.isDefault ? " • Default" : ""}
                </option>
              ))}
              <option value="Cash">Cash</option>
            </>
          ) : (
            <>
              <option value="">No bank configured in settings</option>
              <option value="Cash">Cash</option>
            </>
          )}
        </select>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
          Payment Date (Paid to Bank)
        </label>
        <input aria-label="Payment Date (Paid to Bank)"
          type="date"
          value={receivingDate}
          onChange={(e) => setReceivingDate(e.target.value)}
          className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
        />
      </div>
    </div>

    {/* STEP 4: Payer details */}
    <div className="p-4 sm:p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800">
          4. Payer details
        </label>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
          Optional
        </span>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Payer name <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <input aria-label="Payer name"
          type="text"
          value={depositorName}
          onChange={(e) => setDepositorName(e.target.value)}
          placeholder="e.g. Musa Garba (Optional — defaults to parent name if blank)"
          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
        />
        <span className="text-[11px] text-slate-500 mt-1 block">
          Optional: leave blank to use the parent name.
        </span>
      </div>
    </div>


    <div className="grid gap-4 sm:grid-cols-2">
      <label className="field-label">Bank reference (optional)<input className="field-control mt-1.5" value={bankReference} onChange={event => setBankReference(event.target.value)} placeholder="Transaction reference" /></label>
      <label className="field-label">Notes (optional)<input className="field-control mt-1.5" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Additional payment details" /></label>
    </div>
  </>);
}

"use client";
import { DuplicateReceiptDialog } from "@/features/receipts/components/DuplicateReceiptDialog";
import { ReceiptItemsSection } from "@/features/receipts/components/ReceiptItemsSection";
import { ReceiptPayerSection } from "@/features/receipts/components/ReceiptPayerSection";
import { ReceiptPaymentSection } from "@/features/receipts/components/ReceiptPaymentSection";


import { Dialog } from "@/components/ui/dialog";
import { useReceiptForm, type ReceiptModalProps } from "@/features/receipts/useReceiptForm";
import { formatNaira } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
export { OTHER_FEE_OPTIONS, PRESET_FEE_OPTIONS, STANDARD_FEE_OPTIONS } from "@/features/receipts/fee-options";


export function ReceiptModal(props: ReceiptModalProps) {
  return props.isOpen ? <ReceiptForm key={props.preselectedStudent?.id || "new"} {...props} /> : null;
}

function ReceiptForm(props: ReceiptModalProps) {
  const form = useReceiptForm(props);
  const { selectedStudent, depositorName, isExternalPayer, externalPayerName, isSubmitting, errorMessage, isCheckingDuplicate, items, paymentPeriod, totalAmount, isLedgerReady, obligations, projectedLedger, studentTotalBill, currentAllocatedTotal, currentBalance, projectedBalance, willBeFull, handleSubmit, onClose } = form;
  if (!props.isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(event) => { if (event.target === event.currentTarget && !isSubmitting && !isCheckingDuplicate) onClose(); }}
    >
      <Dialog label="Issue receipt" onClose={() => { if (!isSubmitting && !isCheckingDuplicate) onClose(); }}
        className="relative flex flex-col w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden my-auto max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#075E54] text-white px-5 sm:px-7 py-4.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-white p-1 flex items-center justify-center border border-white/30 overflow-hidden shadow-xs shrink-0">
              <img src="/logo.png" alt="Alfurqan Crest" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-sm sm:text-base leading-tight">
                <span>Issue Receipt</span>
                <Sparkles className="h-4 w-4 text-[#FFB21D]" />
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                Alfurqan International Academy • Accounts Desk
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting || isCheckingDuplicate} onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {errorMessage && (
            <div role="alert" className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <ReceiptPayerSection form={form} />

{/* Student Debt & Invoice Overview Card */}
          {selectedStudent && (
            <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="text-slate-500">{paymentPeriod === "Whole Session" ? "Session Bill:" : "Term Bill:"}</span>
                <strong className="text-slate-900 font-mono ml-1.5 font-bold">
                  {formatNaira(studentTotalBill)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Paid So Far:</span>
                <strong className="text-slate-900 font-mono ml-1.5 font-bold">
                  {formatNaira(currentAllocatedTotal)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Current Debt:</span>
                <strong className="text-amber-800 font-mono font-semibold ml-1.5">
                  {formatNaira(currentBalance)}
                </strong>
              </div>
            </div>
          )}

          <ReceiptItemsSection form={form} />

<ReceiptPaymentSection form={form} />

{/* Live Dynamic Status Forecast Stamp */}
          {selectedStudent && (
            <div className="p-4 rounded-lg border flex items-center justify-between gap-3 shadow-xs bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  className={`h-5 w-5 ${willBeFull ? "text-emerald-600" : "text-amber-600"}`}
                />
                <div>
                  <div className="text-sm font-semibold">
                    {!isLedgerReady ? (
                      <span className="text-slate-600">CHECKING PAYMENT HISTORY…</span>
                    ) : willBeFull ? (
                      <span className="text-emerald-900 ">
                        RECEIPT BADGE: 🟢 FULL PAYMENT (CLEARED)
                      </span>
                    ) : (
                      <span className="text-amber-900 ">
                        RECEIPT BADGE: 🟡 PARTIAL PAYMENT
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {!isLedgerReady ? "Please wait for the payment history for this period." : willBeFull
                      ? `The selected ${paymentPeriod.toLowerCase()} payment will be cleared.`
                      : `Outstanding balance remaining will be ${formatNaira(
                          projectedBalance
                        )}.`}
                  </div>
                  {isLedgerReady && obligations.Tuition > 0 && (
                    <div className="text-xs font-semibold text-amber-900 mt-1">
                      School fees paid now: {formatNaira(items.filter((item) => item.category === "Tuition").reduce((sum, item) => sum + item.amount, 0))}
                      {" • "}School fees remaining: {formatNaira(projectedLedger.balances.Tuition)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting || isCheckingDuplicate} onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isCheckingDuplicate ||
                (!selectedStudent && !isExternalPayer && !externalPayerName.trim() && !depositorName.trim()) ||
                totalAmount <= 0
              }
              className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-40 text-white text-sm sm:text-base font-semibold px-6 py-3 rounded-xl shadow-lg transition-all  active:translate-y-px flex items-center gap-2 cursor-pointer"
            >
              {isCheckingDuplicate ? (
                <span>Checking...</span>
              ) : isSubmitting ? (
                <span>Generating Receipt...</span>
              ) : (
                <>
                  <span>Issue Receipt</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>

      <DuplicateReceiptDialog form={form} />


    </div>
  );
}

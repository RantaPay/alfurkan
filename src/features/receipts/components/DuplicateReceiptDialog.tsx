"use client";
import { Dialog } from "@/components/ui/dialog";
import { useReceiptForm } from "@/features/receipts/useReceiptForm";
import { formatNaira } from "@/lib/utils";
import {
  AlertTriangle
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useReceiptForm>, "detectedDuplicate" | "setDetectedDuplicate" | "handleSubmit"> };
export function DuplicateReceiptDialog({ form }: Props) {
  const { detectedDuplicate, setDetectedDuplicate, handleSubmit } = form;
  return (<>
    {/* Duplicate Receipt Warning Alert Dialog */}
    {detectedDuplicate && (
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
        <Dialog label="Possible duplicate receipt" onClose={() => setDetectedDuplicate(null)} className="w-full max-w-lg bg-white rounded-xl shadow-lg border-2 border-amber-400 overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Duplicate Receipt Detected</h3>
              <p className="text-xs text-amber-100 font-medium">An identical receipt already exists in the system</p>
            </div>
          </div>

          {/* Content: Focus ONLY on Student Name & Reg No, Amount & Fee Purpose, and Date */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              The system has detected an already issued receipt (<span className="font-bold text-slate-900 font-mono">#{detectedDuplicate.receiptNumber}</span>) with the same details:
            </p>

            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 divide-y divide-amber-200/60 text-sm">
              {/* 1. Student Name & Reg No */}
              <div className="pb-3 flex items-start justify-between gap-3">
                <span className="text-xs font-bold text-amber-900  tracking-normal">
                  Student Name & Reg No
                </span>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{detectedDuplicate.studentName}</span>
                  <span className="text-xs font-mono font-semibold text-slate-600 block">
                    {detectedDuplicate.regNumber && detectedDuplicate.regNumber !== "N/A"
                      ? detectedDuplicate.regNumber
                      : "External / Not Registered"}
                  </span>
                </div>
              </div>

              {/* 2. Amount & Fee Purpose */}
              <div className="py-3 flex items-start justify-between gap-3">
                <span className="text-xs font-bold text-amber-900  tracking-normal">
                  Amount & Fee Purpose
                </span>
                <div className="text-right">
                  <span className="font-semibold text-[#075E54] text-base block">
                    {formatNaira(detectedDuplicate.amountPaid)}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 block">
                    {detectedDuplicate.feePurpose}
                  </span>
                </div>
              </div>

              {/* 3. Date */}
              <div className="pt-3 flex items-start justify-between gap-3">
                <span className="text-xs font-bold text-amber-900  tracking-normal">
                  Date
                </span>
                <span className="font-bold text-slate-900">
                  {detectedDuplicate.date}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Do you want to cancel, or continue and issue this duplicate receipt anyway?
            </p>
          </div>

          {/* Actions: Cancel or Continue Anyway */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDetectedDuplicate(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setDetectedDuplicate(null);
                handleSubmit(undefined, true);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all  active:translate-y-px cursor-pointer"
            >
              Continue Anyway
            </button>
          </div>
        </Dialog>
      </div>
    )}
  </>);
}

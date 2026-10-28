"use client";
import { OTHER_FEE_OPTIONS, PRESET_FEE_OPTIONS, STANDARD_FEE_OPTIONS } from "@/features/receipts/fee-options";
import { useReceiptForm } from "@/features/receipts/useReceiptForm";
import { formatNaira } from "@/lib/utils";
import {
  Plus,
  Trash2
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useReceiptForm>, "searchQuery" | "setSearchQuery" | "selectedStudent" | "depositorName" | "setDepositorName" | "isExternalPayer" | "setIsExternalPayer" | "externalPayerName" | "setExternalPayerName" | "items" | "setItems" | "totalAmount" | "handleAddItem" | "handleRemoveItem" | "handleUpdateItemAmount"> };
export function ReceiptItemsSection({ form }: Props) {
  const { searchQuery, setSearchQuery, selectedStudent, depositorName, setDepositorName, isExternalPayer, setIsExternalPayer, externalPayerName, setExternalPayerName, items, setItems, totalAmount, handleAddItem, handleRemoveItem, handleUpdateItemAmount } = form;
  return (<>
    {/* STEP 2: Itemized Fee Categories */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800">
          2. Fee items
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleAddItem("Tuition", "Tuition / School Fees", 0)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            + Tuition
          </button>
          <button
            type="button"
            onClick={() => handleAddItem("Books", "Notebook", 0)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            + Notebook
          </button>
          <button
            type="button"
            onClick={() => handleAddItem("Books", "Textbooks", 0)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            + Textbooks
          </button>
          <button
            type="button"
            onClick={() => handleAddItem("Uniform", "School Uniform", 0)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            + Uniform
          </button>
          <button
            type="button"
            onClick={() => handleAddItem("PTA", "Sport Wears", 0)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            + Sport Wears
          </button>
          <button
            type="button"
            onClick={() => {
              handleAddItem("Other", "CUSTOM", 0);
              if (!selectedStudent) setIsExternalPayer(true);
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
          >
            + Other Fee
          </button>
        </div>
      </div>

      <div className="space-y-2.5 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
        {items.map((item, idx) => {
          const isStandard = STANDARD_FEE_OPTIONS.some((p) => p.name === item.name);
          const isOtherPreset = OTHER_FEE_OPTIONS.some((p) => p.name === item.name && p.name !== "CUSTOM");
          const isCustom = !isStandard && !isOtherPreset;
          const isOther = isOtherPreset || isCustom;

          return (
            <div
              key={idx}
              className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-end gap-2.5">
                {/* Dropdown 1: Standard Fees */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[10px] font-semibold  tracking-normal text-slate-500 mb-1">
                    Standard Fees
                  </label>
                  <select aria-label="Standard Fees"
                    value={isStandard ? item.name : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const found = STANDARD_FEE_OPTIONS.find((p) => p.name === val);
                      if (found) {
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, name: found.name, category: found.category }
                              : it
                          )
                        );
                      }
                    }}
                    className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${isStandard
                        ? "border-[#075E54] bg-emerald-50/50 text-slate-900 ring-2 ring-[#075E54]/20"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    <option value="">-- Select Standard Fee --</option>
                    {STANDARD_FEE_OPTIONS.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown 2: Others */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[10px] font-semibold  tracking-normal text-amber-800 mb-1">
                    Others
                  </label>
                  <select aria-label="Others"
                    value={isOther ? (isCustom ? "CUSTOM" : item.name) : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (val === "CUSTOM") {
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? {
                                ...it,
                                name: PRESET_FEE_OPTIONS.some((p) => p.name === it.name) ? "" : it.name,
                                category: "Other",
                              }
                              : it
                          )
                        );
                        if (!selectedStudent) {
                          setIsExternalPayer(true);
                          if (searchQuery.trim() && !externalPayerName) {
                            setExternalPayerName(searchQuery.trim());
                            if (!depositorName) setDepositorName(searchQuery.trim());
                            setSearchQuery("");
                          }
                        }
                      } else {
                        const found = OTHER_FEE_OPTIONS.find((p) => p.name === val);
                        if (found) {
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === idx
                                ? { ...it, name: found.name, category: found.category }
                                : it
                            )
                          );
                          if (found.allowExternal && !selectedStudent) {
                            setIsExternalPayer(true);
                            if (searchQuery.trim() && !externalPayerName) {
                              setExternalPayerName(searchQuery.trim());
                              if (!depositorName) setDepositorName(searchQuery.trim());
                              setSearchQuery("");
                            }
                          }
                        }
                      }
                    }}
                    className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${isOther
                        ? "border-amber-600 bg-amber-50/50 text-slate-900 ring-2 ring-amber-600/20"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    <option value="">-- Others (Select Fee) --</option>
                    {OTHER_FEE_OPTIONS.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fee Amount & Trash Button */}
                <div className="flex items-end gap-2 shrink-0">
                  <div className="w-32 sm:w-36">
                    <label className="block text-[10px] font-semibold  tracking-normal text-slate-500 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-xs sm:text-sm text-slate-400 font-mono font-bold">
                        ₦
                      </span>
                      <input
                        type="number" aria-label={`Amount for fee item ${idx + 1}`}
                        value={item.amount || ""}
                        onChange={(e) => handleUpdateItemAmount(idx, Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button" aria-label={`Remove fee item ${idx + 1}`}
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                    className="h-11 px-2.5 text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer transition-colors flex items-center justify-center shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Custom description field if 'Custom / Other Fee' is selected or non-preset name */}
              {isCustom && (
                <div className="pt-0.5">
                  <input
                    type="text" aria-label={`Custom fee name ${idx + 1}`}
                    value={item.name}
                    onChange={(e) => {
                      const customName = e.target.value;
                      setItems((prev) =>
                        prev.map((it, i) =>
                          i === idx ? { ...it, name: customName, category: "Other" } : it
                        )
                      );
                    }}
                    placeholder="Type custom fee title (e.g. Graduation Gown, ID Card Replacement)..."
                    className="w-full h-10 px-3.5 rounded-lg border border-emerald-300 bg-emerald-50/20 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    autoFocus
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Add item button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  name: isExternalPayer ? "Hall rent" : "Tuition / School Fees",
                  category: isExternalPayer ? "Other" : "Tuition",
                  amount: 0,
                },
              ])
            }
            className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-[#075E54] hover:bg-emerald-50/40 text-slate-600 hover:text-[#075E54] rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add fee item</span>
          </button>
        </div>

        <div className="flex justify-between items-center pt-2 px-1 text-sm">
          <span className="font-bold text-slate-600">Total payment:</span>
          <span className="font-mono text-lg font-semibold text-[#075E54]">
            {formatNaira(totalAmount)}
          </span>
        </div>
      </div>
    </div>


  </>);
}

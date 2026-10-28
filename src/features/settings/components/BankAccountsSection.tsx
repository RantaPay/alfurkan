"use client";
import { useSettingsForm } from "@/features/settings/useSettingsForm";
import {
  CheckCircle2,
  CreditCard,
  Edit2,
  Plus,
  Trash2
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useSettingsForm>, "activeTab" | "school" | "handleOpenAddBank" | "handleOpenEditBank" | "handleDeleteBank" | "handleSetDefaultBank"> };
export function BankAccountsSection({ form }: Props) {
  const { activeTab, school, handleOpenAddBank, handleOpenEditBank, handleDeleteBank, handleSetDefaultBank } = form;
  return (<>
    {/* TAB 2: Receiving Bank Accounts */}
    {activeTab === "banks" && (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                School Collection & Bank Accounts
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Configure verified bank accounts used by parents for direct transfers and teller deposits
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddBank}
              className="bg-[#075E54] hover:bg-[#128C7E] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Bank Account</span>
            </button>
          </div>

          {/* Bank Account Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(school.bankAccounts || []).map((acc, index) => (
              <div
                key={acc.id || index}
                className={`p-5 rounded-lg border transition-all relative flex flex-col justify-between ${acc.isDefault
                    ? "border-emerald-500 bg-emerald-50/30 shadow-sm ring-1 ring-emerald-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                        <CreditCard className="h-4.5 w-4.5 text-[#075E54]" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-base leading-tight">
                          {acc.bankName}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium line-clamp-1">
                          {acc.accountName}
                        </span>
                      </div>
                    </div>
                    {acc.isDefault && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Primary
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 mb-4">
                    <span className="text-[11px] font-bold  tracking-normal text-slate-400 block">
                      NUBAN Account Number
                    </span>
                    <span className="font-mono text-lg font-semibold text-slate-900 tracking-normal block">
                      {acc.accountNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {!acc.isDefault ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultBank(acc.id)}
                      className="text-xs font-bold text-[#075E54] hover:underline cursor-pointer"
                    >
                      Set as Primary
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Default Account
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditBank(index)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Account"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBank(index)}
                      disabled={(school.bankAccounts || []).length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}



  </>);
}

"use client";
import { ConcessionsSection } from "@/features/settings/components/ConcessionsSection";
import { FeeHistorySection } from "@/features/settings/components/FeeHistorySection";

import { useSettingsForm } from "@/features/settings/useSettingsForm";
import {
  Calendar,
  DollarSign,
  Plus,
  RotateCcw,
  Save,
  Trash2
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useSettingsForm>, "activeTab" | "school" | "setSchool" | "feeRevisionNote" | "setFeeRevisionNote" | "setSelectedHistorySnapshot" | "setIsSnapshotModalOpen" | "savingFees" | "savingConcessions" | "handleFeeChange" | "handleAddClassLevel" | "handleRemoveClassLevel" | "handleLoadAllSchoolClasses" | "handleSaveFeeSchedule" | "handleSaveConcessions" | "handleRestoreSnapshot"> };
export function FeeScheduleSection({ form }: Props) {
  const { activeTab, school, setSchool, feeRevisionNote, setFeeRevisionNote, savingFees, handleFeeChange, handleAddClassLevel, handleRemoveClassLevel, handleLoadAllSchoolClasses, handleSaveFeeSchedule } = form;
  return (<>
    {/* TAB 4: Class Fee Schedule */}
    {activeTab === "fees" && (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Card 1: Fee Schedule Configuration & Active Term/Session */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#075E54]" />
                <span>Standard Term Fee Schedule per Class Level</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Configure school fees per class level. All arms (A, B, C) of each class automatically share the same school fees.
              </p>
            </div>

            {/* Active Period Badges */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-[#075E54] border border-emerald-200">
                <Calendar className="h-3.5 w-3.5 text-[#075E54]" />
                <span>Active Term: {school.currentTerm}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                <span>{school.currentSession}</span>
              </span>
            </div>
          </div>

          {/* Term & Session Configuration Bar */}
          <div className="bg-slate-50/80 rounded-lg p-4 sm:p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#075E54]" />
              <span className="text-xs font-semibold  tracking-normal text-slate-800">
                Target Academic Period for this Fee Schedule
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Academic Session */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold  tracking-normal text-slate-600 mb-1">
                  Academic Session
                </label>
                <input aria-label="Academic Session"
                  type="text"
                  value={school.currentSession}
                  onChange={(e) => setSchool({ ...school, currentSession: e.target.value })}
                  placeholder="e.g. 2026/2027 Academic Session"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                />
              </div>

              {/* Academic Term */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold  tracking-normal text-slate-600 mb-1">
                  Academic Term
                </label>
                <select aria-label="Academic Term"
                  value={school.currentTerm}
                  onChange={(e) => setSchool({ ...school, currentTerm: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none cursor-pointer"
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>

              {/* Revision Note */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold  tracking-normal text-slate-600 mb-1">
                  Revision Note / Reason (Optional)
                </label>
                <input aria-label="Revision Note / Reason (Optional)"
                  type="text"
                  value={feeRevisionNote}
                  onChange={(e) => setFeeRevisionNote(e.target.value)}
                  placeholder="e.g. Board approval for new session"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-medium text-slate-900 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table for Class Fee Schedule */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs font-semibold  tracking-normal text-slate-700 flex items-center gap-1.5">
              <span>Configured Class Levels</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                {(school.feeStructure || []).length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLoadAllSchoolClasses}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:translate-y-px text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reload School Classes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = prompt("Enter Class Level name (e.g. Basic 1, JSS 1, SS 1, Creche):");
                  if (name && name.trim()) {
                    handleAddClassLevel(name.trim());
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-[#075E54] hover:bg-[#128C7E] active:translate-y-px text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Class Level</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-3.5">Class Level</th>
                  <th className="py-3 px-3">Tuition Fee (₦)</th>
                  <th className="py-3 px-3">Notebook / Textbooks (₦)</th>
                  <th className="py-3 px-3">Uniform (₦)</th>
                  <th className="py-3 px-3">Sport Wears (₦)</th>
                  <th className="py-3 px-3.5 text-right font-semibold text-emerald-900 bg-emerald-50/70">
                    Total Bill (₦)
                  </th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {(school.feeStructure || []).map((fee, idx) => (
                  <tr key={fee.classLevel || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3.5 font-semibold text-slate-900 bg-slate-50/30">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#075E54]"></span>
                        <span>{fee.classLevel}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={fee.tuitionFee}
                        onChange={(e) =>
                          handleFeeChange(idx, "tuitionFee", Number(e.target.value) || 0)
                        }
                        className="w-28 h-9 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={fee.booksFee}
                        onChange={(e) =>
                          handleFeeChange(idx, "booksFee", Number(e.target.value) || 0)
                        }
                        className="w-24 h-9 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={fee.uniformFee}
                        onChange={(e) =>
                          handleFeeChange(idx, "uniformFee", Number(e.target.value) || 0)
                        }
                        className="w-24 h-9 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={fee.sportsWearFee ?? fee.ptaLevy ?? 0}
                        onChange={(e) =>
                          handleFeeChange(idx, "sportsWearFee", Number(e.target.value) || 0)
                        }
                        className="w-24 h-9 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-3.5 text-right font-semibold text-slate-900 bg-emerald-50/70 font-mono text-sm">
                      ₦{fee.totalBill.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveClassLevel(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={`Remove ${fee.classLevel}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button for Fee Schedule */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              Saving applies this fee schedule across all student arms (A, B, C) and updates their school fee balances.
            </div>
            <button
              type="button"
              onClick={handleSaveFeeSchedule}
              disabled={savingFees}
              className="bg-[#075E54] hover:bg-[#128C7E] active:translate-y-px text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{savingFees ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <ConcessionsSection form={form} />

        <FeeHistorySection form={form} />


      </div>
    )}


  </>);
}

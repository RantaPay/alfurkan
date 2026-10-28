"use client";
import { useSettingsForm } from "@/features/settings/useSettingsForm";
import { DEFAULT_CONCESSIONS } from "@/lib/student-importer";
import {
  Save,
  Sparkles
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useSettingsForm>, "school" | "setSchool" | "savingConcessions" | "handleSaveConcessions"> };
export function ConcessionsSection({ form }: Props) {
  const { school, setSchool, savingConcessions, handleSaveConcessions } = form;
  return (<>
    {/* Card 2: Special Category Fees (SR, YR, ADF, Dual) */}
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#075E54]" />
            <span>Special Category Fees</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Set fees for students with special category tags (SR, YR, ADF, and Dual).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pre-Nursery / Nursery / Pre-Basic (SR or YR) */}
        <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold  text-slate-700">
            Pre-Nursery &amp; Nursery (SR / YR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={school.concessions?.preNurseryNurseryPb ?? 21500}
              onChange={(e) =>
                setSchool({
                  ...school,
                  concessions: {
                    ...(school.concessions || DEFAULT_CONCESSIONS),
                    preNurseryNurseryPb: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
            />
          </div>
        </div>

        {/* Basic 1 - 6 (SR or YR) */}
        <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold  text-slate-700">
            Basic 1 - 6 (SR / YR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={school.concessions?.basic ?? 24000}
              onChange={(e) =>
                setSchool({
                  ...school,
                  concessions: {
                    ...(school.concessions || DEFAULT_CONCESSIONS),
                    basic: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
            />
          </div>
        </div>

        {/* JSS 1 - 2 (SR or YR) */}
        <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold  text-slate-700">
            JSS 1 - 2 (SR / YR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={school.concessions?.jss1_2 ?? 30000}
              onChange={(e) =>
                setSchool({
                  ...school,
                  concessions: {
                    ...(school.concessions || DEFAULT_CONCESSIONS),
                    jss1_2: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
            />
          </div>
        </div>

        {/* JSS 3 (SR or YR) */}
        <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold  text-slate-700">
            JSS 3 (SR / YR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={school.concessions?.jss3 ?? 45000}
              onChange={(e) =>
                setSchool({
                  ...school,
                  concessions: {
                    ...(school.concessions || DEFAULT_CONCESSIONS),
                    jss3: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
            />
          </div>
        </div>

        {/* SS 1 (SR or YR) */}
        <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold  text-slate-700">
            SS 1 (SR / YR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={school.concessions?.ss1 ?? 35000}
              onChange={(e) =>
                setSchool({
                  ...school,
                  concessions: {
                    ...(school.concessions || DEFAULT_CONCESSIONS),
                    ss1: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
            />
          </div>
        </div>

        {/* SS 2 - 3 (SR or YR) */}
        <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold  text-slate-700">
            SS 2 - 3 (SR / YR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={school.concessions?.ss2_3 ?? 52500}
              onChange={(e) =>
                setSchool({
                  ...school,
                  concessions: {
                    ...(school.concessions || DEFAULT_CONCESSIONS),
                    ss2_3: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
            />
          </div>
        </div>

        {/* Dual SR & YR */}
        <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold  text-slate-700">
            Dual Category (SR + YR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={school.concessions?.dualSrYr ?? 5000}
              onChange={(e) =>
                setSchool({
                  ...school,
                  concessions: {
                    ...(school.concessions || DEFAULT_CONCESSIONS),
                    dualSrYr: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
            />
          </div>
        </div>

        {/* ADF */}
        <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold  text-slate-700">
            ADF
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={school.concessions?.adf ?? 0}
              onChange={(e) =>
                setSchool({
                  ...school,
                  concessions: {
                    ...(school.concessions || DEFAULT_CONCESSIONS),
                    adf: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 font-medium">
          Saving updates special category fees across all students.
        </div>
        <button
          type="button"
          onClick={handleSaveConcessions}
          disabled={savingConcessions}
          className="bg-[#075E54] hover:bg-[#128C7E] active:translate-y-px text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{savingConcessions ? "Saving..." : "Save"}</span>
        </button>
      </div>
    </div>


  </>);
}

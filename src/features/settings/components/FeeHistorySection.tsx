"use client";
import { useSettingsForm } from "@/features/settings/useSettingsForm";
import {
  Clock,
  Eye,
  History,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useSettingsForm>, "school" | "setSelectedHistorySnapshot" | "setIsSnapshotModalOpen" | "handleRestoreSnapshot"> };
export function FeeHistorySection({ form }: Props) {
  const { school, setSelectedHistorySnapshot, setIsSnapshotModalOpen, handleRestoreSnapshot } = form;
  return (<>
    {/* Card 3: Previous Records of Fee Updates (History & Audit Trail) */}
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-[#075E54]" />
            <span>Previous Records of Fee Updates & Audit Trail</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            History of fee changes across academic sessions and terms. View past rates or reload them into the schedule.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span>{(school.feeScheduleHistory || []).length} Revisions Recorded</span>
        </span>
      </div>

      {/* History Records Table */}
      {(school.feeScheduleHistory || []).length === 0 ? (
        <div className="text-center py-10 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400">
          <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No past fee updates recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Whenever you save a fee schedule, a permanent revision snapshot will be created here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-3.5">Revision Date & Time</th>
                <th className="py-3 px-3">Session & Term</th>
                <th className="py-3 px-3">Authorized By</th>
                <th className="py-3 px-3">Class Rates Snapshot</th>
                <th className="py-3 px-3">Revision Notes</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {(school.feeScheduleHistory || []).map((entry, idx) => {
                const dateObj = new Date(entry.updatedAt);
                const formattedDate = isNaN(dateObj.getTime())
                  ? entry.updatedAt
                  : dateObj.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }) +
                  " • " +
                  dateObj.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                return (
                  <tr key={entry.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800 block text-xs">
                        {formattedDate}
                      </span>
                      {idx === 0 && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold  tracking-normal bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Latest Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {entry.term}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {entry.session}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#075E54]" />
                        <span>{entry.updatedBy}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(entry.schedule || []).slice(0, 4).map((cls) => (
                          <span
                            key={cls.classLevel}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <span className="font-sans font-semibold text-slate-500">{cls.classLevel}:</span>
                            <span>₦{cls.totalBill.toLocaleString()}</span>
                          </span>
                        ))}
                        {(entry.schedule || []).length > 4 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">
                            +{entry.schedule.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-600 line-clamp-2 italic font-normal">
                        {entry.notes || "Standard scheduled update"}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHistorySnapshot(entry);
                            setIsSnapshotModalOpen(true);
                          }}
                          className="p-1.5 text-[#075E54] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                          title="View Full Breakdown Snapshot"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(entry)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                          title="Load this revision's rates into editor"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </>);
}

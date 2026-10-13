"use client";

import { useState, useMemo } from "react";
import { Student } from "@/lib/types";
import {
  X,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  ShieldCheck,
  Check,
} from "lucide-react";

interface SessionPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onPromotionComplete: () => void;
}

const LEVEL_FLOW = [
  { from: "Pre-Nursery", to: "Nursery 1", color: "from-pink-500/10 to-rose-500/10 border-pink-200" },
  { from: "Nursery 1", to: "Nursery 2", color: "from-rose-500/10 to-orange-500/10 border-rose-200" },
  { from: "Nursery 2", to: "Basic 1", color: "from-orange-500/10 to-amber-500/10 border-orange-200" },
  { from: "Basic 1", to: "Basic 2", color: "from-amber-500/10 to-yellow-500/10 border-amber-200" },
  { from: "Basic 2", to: "Basic 3", color: "from-yellow-500/10 to-lime-500/10 border-yellow-200" },
  { from: "Basic 3", to: "Basic 4", color: "from-lime-500/10 to-emerald-500/10 border-lime-200" },
  { from: "Basic 4", to: "Basic 5", color: "from-emerald-500/10 to-teal-500/10 border-emerald-200" },
  { from: "Basic 5", to: "Basic 6", color: "from-teal-500/10 to-cyan-500/10 border-teal-200" },
  { from: "Basic 6", to: "JSS 1", color: "from-cyan-500/10 to-blue-500/10 border-cyan-200" },
  { from: "JSS 1", to: "JSS 2", color: "from-blue-500/10 to-indigo-500/10 border-blue-200" },
  { from: "JSS 2", to: "JSS 3", color: "from-indigo-500/10 to-purple-500/10 border-indigo-200" },
  { from: "JSS 3", to: "SS 1", color: "from-purple-500/10 to-emerald-500/10 border-purple-200" },
  { from: "SS 1", to: "SS 2", color: "from-emerald-500/10 to-teal-500/10 border-emerald-200" },
  { from: "SS 2", to: "SS 3", color: "from-teal-500/10 to-amber-500/10 border-teal-200" },
  { from: "SS 3", to: "Graduated Alumni", color: "from-amber-500/10 to-orange-500/10 border-amber-200" },
];

export function SessionPromotionModal({
  isOpen,
  onClose,
  students,
  onPromotionComplete,
}: SessionPromotionModalProps) {
  const [targetSession, setTargetSession] = useState("2027/2028 Academic Session");
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRosterPreview, setShowRosterPreview] = useState(false);
  const [previewSearch, setPreviewSearch] = useState("");
  const [successResult, setSuccessResult] = useState<{
    updatedCount: number;
    breakdown?: Record<string, number>;
  } | null>(null);

  // Complete list of levels ordered from earliest to graduating
  const ALL_LEVELS = [
    "Pre-Nursery", "Nursery 1", "Nursery 2",
    "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6",
    "JSS 1", "JSS 2", "JSS 3",
    "SS 1", "SS 2", "SS 3",
  ];

  // Helper to extract level
  const extractLevel = (className: string) => {
    for (const lvl of ALL_LEVELS) {
      if (className.startsWith(lvl)) return lvl;
    }
    return className.split(" ")[0] || "Other";
  };

  // Helper to calculate target class name
  const getNextClassName = (current: string) => {
    const lvl = extractLevel(current);
    const map: Record<string, string> = {
      "Pre-Nursery": "Nursery 1",
      "Nursery 1": "Nursery 2",
      "Nursery 2": "Basic 1",
      "Basic 1": "Basic 2",
      "Basic 2": "Basic 3",
      "Basic 3": "Basic 4",
      "Basic 4": "Basic 5",
      "Basic 5": "Basic 6",
      "Basic 6": "JSS 1",
      "JSS 1": "JSS 2",
      "JSS 2": "JSS 3",
      "JSS 3": "SS 1",
      "SS 1": "SS 2",
      "SS 2": "SS 3",
      "SS 3": "Graduated Alumni",
    };
    const nextLvl = map[lvl] || current;
    if (nextLvl === "Graduated Alumni") return "Graduated Alumni";
    const arm = current.replace(lvl, "").trim();
    return arm ? `${nextLvl} ${arm}` : nextLvl;
  };

  // Compute breakdown counts
  const breakdownCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "JSS 1": 0,
      "JSS 2": 0,
      "JSS 3": 0,
      "SS 1": 0,
      "SS 2": 0,
      "SS 3": 0,
      "Graduated": 0,
      "Other": 0,
    };
    students.forEach((s) => {
      const lvl = extractLevel(s.class);
      if (s.class.toLowerCase().includes("graduated")) {
        counts["Graduated"] = (counts["Graduated"] || 0) + 1;
      } else if (counts[lvl] !== undefined) {
        counts[lvl] = (counts[lvl] || 0) + 1;
      } else {
        counts["Other"] = (counts["Other"] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const activePromotableStudents = students.filter(
    (s) => !s.class.toLowerCase().includes("graduated")
  );

  const filteredPreviewList = useMemo(() => {
    const q = previewSearch.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.regNumber.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q)
    );
  }, [students, previewSearch]);

  if (!isOpen) return null;

  const handleExecuteAutoPromotion = async () => {
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "auto_promote_all",
          operator: "Chief Accountant & Administrator",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessResult({
          updatedCount: data.updatedCount,
          breakdown: data.breakdown,
        });
        onPromotionComplete();
      } else {
        alert("Failed to auto-promote students: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Network error while executing auto-promotion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessResult(null);
    setConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-100 text-[#075E54]">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Auto-Promote All Students
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#075E54] border border-emerald-200">
                  New Session
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Advance all active students to their next class in 1 click at the start of a new academic session.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {successResult ? (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-100 text-[#075E54] ring-8 ring-emerald-50">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Session Rollover Completed Successfully!
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                  All <span className="font-bold text-[#075E54]">{successResult.updatedCount} students</span> have been automatically promoted to their new class levels for the new session.
                </p>
              </div>

              {/* Repeating Students Instruction */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left max-w-xl mx-auto space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  What about repeating students?
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  If any student failed or was retained to repeat their class, simply find that student in the table and click the <span className="font-semibold underline">Edit</span> button on their row. You can set them back to their repeated class and tag them as <span className="font-semibold text-amber-900">Repeating Student</span> in seconds.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#075E54] hover:bg-[#128C7E] text-white font-semibold rounded-xl text-sm shadow-sm transition-all"
                >
                  Done & Return to Students List
                </button>
              </div>
            </div>
          ) : (
            /* Default Promotion View */
            <>
              {/* Session Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
                    Academic Year Rollover
                  </span>
                  <div className="flex items-center gap-2.5 text-base font-bold">
                    <span>2026/2027 Session</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span className="text-emerald-300">{targetSession}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Target Session:</span>
                  <input
                    type="text"
                    value={targetSession}
                    onChange={(e) => setTargetSession(e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                  />
                </div>
              </div>

              {/* Class Movement Matrix */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                  <span>Class Progression Matrix</span>
                  <span className="text-slate-400 font-normal">
                    Total Active Students: {activePromotableStudents.length}
                  </span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {LEVEL_FLOW.map((flow) => {
                    const count = breakdownCounts[flow.from] || 0;
                    return (
                      <div
                        key={flow.from}
                        className={`p-3 rounded-2xl border bg-gradient-to-br ${flow.color} flex flex-col justify-between`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                          <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200">
                            {flow.from}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          <span className="bg-emerald-100 text-[#075E54] px-2 py-0.5 rounded-lg border border-emerald-200">
                            {flow.to}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Promoting:</span>
                          <span className="font-extrabold text-slate-900 text-sm">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Repeating Students Guidance Card */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-3">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    How Repeating Students Work
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Clicking <strong className="text-amber-900">Auto-Promote All</strong> will advance every student automatically into their next class level.
                    <br />
                    Afterwards, the Accountant and Admin can simply locate any individual student who is repeating and click their <strong className="text-amber-900">Edit (pencil)</strong> button to set them back to their repeated class and toggle <strong className="text-amber-900">Repeating Student</strong>.
                  </p>
                </div>
              </div>

              {/* Collapsible Student Roster Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRosterPreview(!showRosterPreview)}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    Preview Student Progression Roster ({students.length} Total)
                  </span>
                  {showRosterPreview ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {showRosterPreview && (
                  <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student by name, reg number, or class..."
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {filteredPreviewList.map((s) => {
                        const nextClass = getNextClassName(s.class);
                        return (
                          <div key={s.id} className="py-2 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-slate-900">{s.fullName}</span>
                              <span className="text-[10px] text-slate-400 ml-2">({s.regNumber})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                {s.class}
                              </span>
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#075E54] font-semibold border border-emerald-200">
                                {nextClass}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirmPromotion"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#075E54] focus:ring-[#075E54] cursor-pointer"
                />
                <label
                  htmlFor="confirmPromotion"
                  className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none"
                >
                  <strong className="text-slate-900">I confirm the Session Rollover</strong>. I understand that all {activePromotableStudents.length} active students will automatically advance to their next class level, and any repeating students will be adjusted individually afterwards.
                </label>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!successResult && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteAutoPromotion}
              disabled={!confirmed || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 ${
                confirmed && !isSubmitting
                  ? "bg-[#075E54] hover:bg-[#128C7E] text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {isSubmitting
                ? "Promoting All Students..."
                : `⚡ Auto-Promote All (${activePromotableStudents.length} Students)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

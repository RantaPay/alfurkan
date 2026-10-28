"use client";
import { ConfirmationDialog, useConfirmation } from "@/components/ui/confirmation";
import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/feedback";

import {
  calculateStudentBill,
  DEFAULT_CONCESSIONS,
  detectStudentCategory,
} from "@/lib/student-importer";
import { ClassFeeConfig, ConcessionCategoryConfig, Student } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  GraduationCap,
  Save,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onStudentUpdated: () => void;
}

const CLASS_LEVELS = [
  "Pre-Nursery",
  "Nursery 1",
  "Nursery 2",
  "Pre-Basic",
  "Basic 1",
  "Basic 2",
  "Basic 3",
  "Basic 4",
  "Basic 5",
  "Basic 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SS 1",
  "SS 2",
  "SS 3",
];


export function EditStudentModal(props: EditStudentModalProps) {
  return props.isOpen && props.student ? <StudentEditor key={props.student.id} {...props} student={props.student} /> : null;
}

function initialClass(student: Student) {
  let classLevel = "JSS 1", classArm = "Diamond";
      const trimmed = (student.class || "").trim();
      const matchedLevel = CLASS_LEVELS.find((lvl) => trimmed.toLowerCase().startsWith(lvl.toLowerCase()));
      if (matchedLevel) {
        classLevel = (matchedLevel);
        const remainder = trimmed.slice(matchedLevel.length).trim();
        classArm = (remainder || "A");
      } else if (/^pb\b/i.test(trimmed) || trimmed.toLowerCase().startsWith("pre basic") || trimmed.toLowerCase().startsWith("pre-basic")) {
        classLevel = ("Pre-Basic");
        const remainder = trimmed.replace(/^(pb|pre\s*[- ]?\s*basic)\s*/i, "").trim();
        classArm = (remainder || "A");
      } else {
        const parts = trimmed.split(" ");
        if (parts.length >= 2) {
          const potentialLevel = `${parts[0]} ${parts[1]}`;
          if (CLASS_LEVELS.includes(potentialLevel)) {
            classLevel = (potentialLevel);
            classArm = (parts.slice(2).join(" ") || "A");
          } else {
            classLevel = (parts[0]);
            classArm = (parts.slice(1).join(" ") || "A");
          }
        } else {
          classLevel = (trimmed || "Basic 1");
          classArm = ("A");
        }
      }
  return { classLevel, classArm };
}

function StudentEditor({
  isOpen,
  onClose,
  student,
  onStudentUpdated,
}: EditStudentModalProps & { student: Student }) {
  const { confirmation, requestConfirmation } = useConfirmation();
  const [errorMessage, setErrorMessage] = useState("");
  const [fullName, setFullName] = useState(student.fullName);
  const [classLevel, setClassLevel] = useState(() => initialClass(student).classLevel);
  const [classArm, setClassArm] = useState(() => initialClass(student).classArm);
  const [isRepeating, setIsRepeating] = useState(!!student.isRepeating);
  const [totalTermBill, setTotalTermBill] = useState(student.totalTermBill);
  const [parentName, setParentName] = useState(student.parentName || "");
  const [parentPhone, setParentPhone] = useState(student.parentPhone || "");
  const [parentEmail, setParentEmail] = useState(student.parentEmail || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feeSchedule, setFeeSchedule] = useState<ClassFeeConfig[]>([]);
  const [concessions, setConcessions] = useState<ConcessionCategoryConfig>(DEFAULT_CONCESSIONS);

  // Load fee schedule and concessions from settings to auto-fill bills
  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            if (d.school?.feeStructure) {
              setFeeSchedule(d.school.feeStructure);
            }
            if (d.school?.concessions) {
              setConcessions(d.school.concessions);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);


  if (!isOpen || !student) return null;

  const currentConstructedClass = classArm ? `${classLevel} ${classArm}`.trim() : classLevel;

  // Auto-fill bill based on fee schedule & category
  const handleAutoFillFee = () => {
    const calculated = calculateStudentBill(fullName, currentConstructedClass, feeSchedule, concessions);
    setTotalTermBill(calculated);
  };

  const handleSelectCategory = (cat: "REGULAR" | "SR" | "YR" | "DUAL_SR_YR" | "ADF") => {
    const clean = fullName.replace(/\s*\((SR|YR|ADF|SR\/YR|YR\/SR)\)\s*/gi, " ").trim();
    let updatedName = clean;
    if (cat === "SR") updatedName = `${clean} (SR)`;
    else if (cat === "YR") updatedName = `${clean} (YR)`;
    else if (cat === "DUAL_SR_YR") updatedName = `${clean} (SR/YR)`;
    else if (cat === "ADF") updatedName = `${clean} (ADF)`;

    setFullName(updatedName);
    const calculated = calculateStudentBill(updatedName, currentConstructedClass, feeSchedule, concessions);
    setTotalTermBill(calculated);
  };

  const currentCategory = detectStudentCategory(fullName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: student.id,
          fullName: fullName.trim(),
          class: currentConstructedClass,
          isRepeating,
          totalTermBill: Number(totalTermBill),
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          parentEmail: parentEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onStudentUpdated();
        onClose();
      } else {
        setErrorMessage("Failed to update student: " + (data.error || "Unknown error"));
      }
    } catch {
      setErrorMessage("Network error updating student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    if (!await requestConfirmation(`Are you sure you want to delete ${student.fullName}? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students?id=${student.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onStudentUpdated();
        onClose();
      } else {
        setErrorMessage("Failed to delete student: " + (data.error || "Unknown error"));
      }
    } catch {
      setErrorMessage("Network error deleting student.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <Dialog label="Edit student" onClose={() => { if (!(isSubmitting || isDeleting)) onClose(); }} className="bg-white rounded-xl max-w-lg w-full max-h-[92dvh] shadow-lg border border-slate-200 overflow-x-hidden overflow-y-auto">

        {errorMessage && <InlineNotice>{errorMessage}</InlineNotice>}
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-[#075E54]">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Edit Student &amp; Class Placement
              </h3>
              <p className="text-xs text-slate-500 font-mono">{student.regNumber}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting || isDeleting} aria-label="Close edit student" onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
              Student Full Name
            </label>
            <input aria-label="Student Full Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            />
          </div>

          {/* Special Category Tag Selector */}
          <div>
            <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
              Category Tag
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectCategory("REGULAR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentCategory === "REGULAR"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory("SR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentCategory === "SR"
                    ? "bg-[#075E54] text-white border-[#075E54] shadow-xs"
                    : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                (SR)
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory("YR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentCategory === "YR"
                    ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                    : "bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100"
                }`}
              >
                (YR)
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory("DUAL_SR_YR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentCategory === "DUAL_SR_YR"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                }`}
              >
                (SR/YR) Dual
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory("ADF")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentCategory === "ADF"
                    ? "bg-indigo-700 text-white border-indigo-700 shadow-xs"
                    : "bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100"
                }`}
              >
                (ADF)
              </button>
            </div>
          </div>

          {/* Class Placement: Level & Arm */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                Class Level
              </label>
              <select aria-label="Class Level"
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
              >
                {CLASS_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                Class Arm / Stream
              </label>
              <input aria-label="Class Arm / Stream"
                type="text"
                value={classArm}
                placeholder="e.g. Diamond, Science, Arts, A, B"
                onChange={(e) => setClassArm(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>
          </div>

          {/* Repeating Student Toggle Card */}
          <div
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              isRepeating
                ? "border-amber-400 bg-amber-50/70 ring-1 ring-amber-400"
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
            }`}
            onClick={() => setIsRepeating(!isRepeating)}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isRepeating}
                onChange={(e) => setIsRepeating(e.target.checked)}
                className="mt-1 h-4.5 w-4.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-900 block text-sm">
                  Mark as Repeating Student (Retained in Class)
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  Check if the student is repeating {classLevel}. A &quot;Repeating&quot; badge will be shown.
                </span>
              </div>
            </label>
          </div>

          {/* Term Fee Bill */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold  tracking-normal text-slate-800">
                Total Term Bill (₦)
              </label>
              <button
                type="button"
                onClick={handleAutoFillFee}
                className="text-xs font-bold text-[#075E54] hover:underline cursor-pointer flex items-center gap-1"
                title="Fetch bill from Fee Schedule and Special Category rates"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Auto-fill from Fee Schedule</span>
              </button>
            </div>
            <input
              type="number"
              required
              value={totalTermBill}
              onChange={(e) => setTotalTermBill(Number(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono font-semibold text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            />
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Current Paid: {formatNaira(student.totalPaid)}</span>
              <span>
                New Balance:{" "}
                <strong className="text-slate-900 font-mono">
                  {formatNaira(Math.max(0, totalTermBill - student.totalPaid))}
                </strong>
              </span>
            </div>
          </div>

          {/* Parent Details */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                Parent / Guardian Name
              </label>
              <input aria-label="Parent / Guardian Name"
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                Parent Phone
              </label>
              <input aria-label="Parent Phone"
                type="text"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>
          </div>

          <label className="field-label">Parent email (optional)
            <input type="email" className="field-control mt-1.5" value={parentEmail} onChange={event => setParentEmail(event.target.value)} />
          </label>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting || isDeleting} aria-label="Close edit student" onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="bg-[#075E54] hover:bg-[#128C7E] active:translate-y-px text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>
        </form>
      </Dialog>
      <ConfirmationDialog {...confirmation} />
    </div>
  );
}

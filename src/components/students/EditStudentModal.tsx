"use client";

import { useState, useEffect } from "react";
import { Student, ClassFeeConfig } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  X,
  UserCheck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Save,
} from "lucide-react";

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onStudentUpdated: () => void;
}

const CLASS_LEVELS = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];
const CLASS_ARMS = ["Diamond", "Gold", "Science", "Arts", "Commercial", "A", "B", "C"];

export function EditStudentModal({
  isOpen,
  onClose,
  student,
  onStudentUpdated,
}: EditStudentModalProps) {
  const [fullName, setFullName] = useState("");
  const [classLevel, setClassLevel] = useState("JSS 1");
  const [classArm, setClassArm] = useState("Diamond");
  const [isRepeating, setIsRepeating] = useState(false);
  const [totalTermBill, setTotalTermBill] = useState(0);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeSchedule, setFeeSchedule] = useState<ClassFeeConfig[]>([]);

  // Load fee schedule from settings to auto-fill bills
  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.school?.feeStructure) {
            setFeeSchedule(d.school.feeStructure);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Pre-populate student state
  useEffect(() => {
    if (student) {
      setFullName(student.fullName);
      setIsRepeating(!!student.isRepeating);
      setTotalTermBill(student.totalTermBill);
      setParentName(student.parentName);
      setParentPhone(student.parentPhone);
      setParentEmail(student.parentEmail || "");

      // Split class string into level and arm if possible
      const parts = student.class.split(" ");
      if (parts.length >= 2) {
        const potentialLevel = `${parts[0]} ${parts[1]}`;
        if (CLASS_LEVELS.includes(potentialLevel)) {
          setClassLevel(potentialLevel);
          setClassArm(parts.slice(2).join(" ") || "Diamond");
        } else {
          setClassLevel(parts[0]);
          setClassArm(parts.slice(1).join(" ") || "Diamond");
        }
      } else {
        setClassLevel("JSS 1");
        setClassArm("Diamond");
      }
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const currentConstructedClass = classArm ? `${classLevel} ${classArm}`.trim() : classLevel;

  // Auto-fill bill based on fee schedule for selected classLevel
  const handleAutoFillFee = () => {
    const feeMatch = feeSchedule.find(
      (f) => f.classLevel.toLowerCase() === classLevel.toLowerCase()
    );
    if (feeMatch && feeMatch.totalBill > 0) {
      setTotalTermBill(feeMatch.totalBill);
    } else {
      alert(`No fee schedule found for ${classLevel}. Please enter manually.`);
    }
  };

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
        alert("Failed to update student: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error updating student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-[#075E54]">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Edit Student &amp; Class Placement
              </h3>
              <p className="text-xs text-slate-500 font-mono">{student.regNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
              Student Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            />
          </div>

          {/* Class Placement: Level & Arm */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Class Level
              </label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
              >
                {CLASS_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Class Arm / Stream
              </label>
              <input
                type="text"
                value={classArm}
                placeholder="e.g. Diamond, Science, Arts"
                onChange={(e) => setClassArm(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>
          </div>

          {/* Repeating Student Toggle Card */}
          <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
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
                <span className="font-black text-slate-900 block text-sm">
                  Mark as Repeating Student (Retained in Class)
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  Check this if the student did not promote and is repeating {classLevel} this academic session. A &quot;Repeating&quot; badge will be visible in the ledger.
                </span>
              </div>
            </label>
          </div>

          {/* Term Fee Bill */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                Total Term Bill (₦)
              </label>
              <button
                type="button"
                onClick={handleAutoFillFee}
                className="text-xs font-bold text-[#075E54] hover:underline cursor-pointer flex items-center gap-1"
                title="Fetch bill from Class Fee Schedule in Settings"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Auto-fill from {classLevel} Fee Schedule</span>
              </button>
            </div>
            <input
              type="number"
              required
              value={totalTermBill}
              onChange={(e) => setTotalTermBill(Number(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono font-black text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-[#075E54]"
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
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Parent / Guardian Name
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Parent Phone
              </label>
              <input
                type="text"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : "Save Class & Ledger"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

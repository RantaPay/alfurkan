"use client";

import { useState, useEffect, useMemo } from "react";
import { formatNaira } from "@/lib/utils";
import { getBillForClass } from "@/lib/student-importer";
import {
  X,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: () => void;
}

const CLASS_OPTIONS = [
  "Pre-Nursery A", "Pre-Nursery B",
  "Nursery 1 A", "Nursery 1 B", "Nursery 1 C", "Nursery 1 D",
  "Nursery 2 A", "Nursery 2 B", "Nursery 2 C",
  "Pre-Basic A", "Pre-Basic B", "Pre-Basic C", "Pre-Basic D",
  "Basic 1 A", "Basic 1 B", "Basic 1 C",
  "Basic 2 A", "Basic 2 B", "Basic 2 C",
  "Basic 3 A", "Basic 3 B", "Basic 3 C",
  "Basic 4 A", "Basic 4 B", "Basic 4 C",
  "Basic 5 A", "Basic 5 B", "Basic 5 C",
  "Basic 6 A", "Basic 6 B",
  "JSS 1 A", "JSS 1 B", "JSS 1 C",
  "JSS 2 A", "JSS 2 B", "JSS 2 C",
  "JSS 3 A", "JSS 3 B", "JSS 3 C",
  "SS 1 A", "SS 1 B", "SS 1 C",
  "SS 2 A", "SS 2 B", "SS 2 C",
  "SS 3 A", "SS 3 B", "SS 3 C",
];

export function AddStudentModal({
  isOpen,
  onClose,
  onStudentAdded,
}: AddStudentModalProps) {
  // Single Student State
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("JSS 1 A");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [totalTermBill, setTotalTermBill] = useState(0);
  const [regNumber, setRegNumber] = useState("");
  const [feeStructure, setFeeStructure] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dynamic class options incorporating any custom classes from fee structure
  const classOptions = useMemo(() => {
    const list = [...CLASS_OPTIONS];
    if (feeStructure.length > 0) {
      feeStructure.forEach((f: any) => {
        const lvl = (f.classLevel || "").trim();
        if (!lvl) return;
        const normLvl = lvl.replace(/[^a-z0-9]/gi, "").toLowerCase();
        const exists = list.some((opt) => {
          const normOpt = opt.replace(/[^a-z0-9]/gi, "").toLowerCase();
          return normOpt.startsWith(normLvl) || normLvl.startsWith(normOpt);
        });
        if (!exists) {
          list.push(`${lvl} A`, `${lvl} B`, `${lvl} C`);
        }
      });
    }
    return list;
  }, [feeStructure]);

  // Load fee structure from settings on open and auto-populate bill
  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.school?.feeStructure) {
            setFeeStructure(data.school.feeStructure);
            setTotalTermBill((prev) => (prev === 0 ? getBillForClass(studentClass, data.school.feeStructure) : prev));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleClassChange = (newClass: string) => {
    setStudentClass(newClass);
    if (feeStructure.length > 0) {
      const bill = getBillForClass(newClass, feeStructure);
      if (bill > 0) {
        setTotalTermBill(bill);
      }
    }
  };

  if (!isOpen) return null;

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          class: studentClass,
          gender,
          parentName: parentName.trim() || "Parent / Guardian",
          parentPhone: parentPhone.trim() || "",
          parentEmail: parentEmail.trim() || undefined,
          totalTermBill,
          regNumber: regNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: `${data.student.fullName} has been enrolled successfully!` });
      onStudentAdded();
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to add student" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName("");
    setParentName("");
    setParentPhone("");
    setParentEmail("");
    setRegNumber("");
    setMessage(null);
    if (feeStructure.length > 0) {
      setTotalTermBill(getBillForClass(studentClass, feeStructure));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#075E54] text-white px-6 py-5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Enroll Student</h2>
              <p className="text-xs text-emerald-100 font-medium">
                Add a new student to the official school register
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border border-rose-200 text-rose-900"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Fatima Muhammad Bello"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Class</label>
                <select
                  value={studentClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
                >
                  {classOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Gender</label>
                <div className="flex gap-2 h-11">
                  <button
                    type="button"
                    onClick={() => setGender("Male")}
                    className={`flex-1 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      gender === "Male"
                        ? "bg-[#075E54] text-white border-[#075E54]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("Female")}
                    className={`flex-1 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      gender === "Female"
                        ? "bg-[#075E54] text-white border-[#075E54]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Muhammad Bello"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Parent Phone Number
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="e.g. 0806 977 0538"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Term Bill Amount (₦)
                </label>
                <input
                  type="number"
                  value={totalTermBill}
                  onChange={(e) => setTotalTermBill(Number(e.target.value) || 0)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {formatNaira(totalTermBill)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Admission / Reg Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="Auto-assigned if left empty"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !fullName.trim()}
                className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-xs flex items-center gap-2"
              >
                {isSubmitting ? "Enrolling..." : "Enroll Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

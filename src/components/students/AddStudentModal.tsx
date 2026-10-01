"use client";

import { useState } from "react";
import { Student } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  X,
  UserPlus,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
} from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: () => void;
}

export function AddStudentModal({
  isOpen,
  onClose,
  onStudentAdded,
}: AddStudentModalProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single Student State
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("JSS 1 Diamond");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [totalTermBill, setTotalTermBill] = useState(165000);
  const [regNumber, setRegNumber] = useState("");

  // Bulk Import State
  const [bulkText, setBulkText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          parentName: parentName || "Parent/Guardian",
          parentPhone: parentPhone || "08000000000",
          parentEmail,
          totalTermBill,
          regNumber: regNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: `Enrolled ${data.student.fullName} (${data.student.regNumber}) successfully!` });
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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Parse CSV or newline text
      const lines = bulkText.trim().split("\n");
      const parsedList: any[] = [];

      for (const line of lines) {
        if (!line.trim() || line.toLowerCase().startsWith("full name") || line.toLowerCase().startsWith("name")) continue;
        const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
        if (parts.length >= 2) {
          parsedList.push({
            fullName: parts[0],
            class: parts[1] || "JSS 1",
            gender: parts[2] === "Female" ? "Female" : "Male",
            parentName: parts[3] || "Parent",
            parentPhone: parts[4] || "08000000000",
            totalTermBill: Number(parts[5]) || 165000,
            regNumber: parts[6] || undefined,
          });
        }
      }

      if (parsedList.length === 0) {
        throw new Error("No valid student rows detected. Check CSV format.");
      }

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedList),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: `Successfully imported ${data.count} students into database!` });
      onStudentAdded();
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1800);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to import bulk students" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName("");
    setParentName("");
    setParentPhone("");
    setRegNumber("");
    setBulkText("");
    setMessage(null);
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,Full Name,Class,Gender,Parent Name,Parent Phone,Term Bill,Reg Number\n" +
      "Musa Aliyu,JSS 1 Gold,Male,Alhaji Aliyu,08031234567,165000,AFIC/2026/0120\n" +
      "Hauwa Ibrahim,JSS 2 Diamond,Female,Dr. Ibrahim,08098765432,175000,AFIC/2026/0121\n" +
      "Bilal Umar,SS 1 Science,Male,Engr. Umar,08123456789,210000,AFIC/2026/0122";

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "AlFurqan_Sample_Students_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="bg-[#075E54] text-white px-5 sm:px-7 py-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5" />
            <div>
              <h2 className="text-sm sm:text-base font-black">Enroll New Al-Furqan Students</h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Single registration or bulk CSV sheet import
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setActiveTab("single"); setMessage(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "single"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Single Student
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("bulk"); setMessage(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "bulk"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Bulk CSV Import</span>
            </button>
          </div>

          {activeTab === "bulk" && (
            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="text-[11px] font-bold text-[#075E54] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>Sample CSV</span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4">
          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
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

          {activeTab === "single" ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maryam Farouk Bello"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class / Arm *</label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  >
                    <option value="JSS 1 Diamond">JSS 1 Diamond</option>
                    <option value="JSS 1 Gold">JSS 1 Gold</option>
                    <option value="JSS 2 Diamond">JSS 2 Diamond</option>
                    <option value="JSS 2 Gold">JSS 2 Gold</option>
                    <option value="JSS 3 Emerald">JSS 3 Emerald</option>
                    <option value="SS 1 Science">SS 1 Science</option>
                    <option value="SS 1 Arts">SS 1 Arts</option>
                    <option value="SS 2 Science">SS 2 Science</option>
                    <option value="SS 2 Arts">SS 2 Arts</option>
                    <option value="SS 3 Science">SS 3 Science</option>
                    <option value="SS 3 Arts">SS 3 Arts</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Alhaji Farouk Bello"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="e.g. 08031234567"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Term Bill (₦)</label>
                  <input
                    type="number"
                    value={totalTermBill}
                    onChange={(e) => setTotalTermBill(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Custom Reg Number (Leave empty to auto-assign)
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="Auto: AFIC/2026/01XX"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim()}
                  className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Paste Student Rows (CSV format)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Format: <code>Full Name, Class, Gender, Parent Name, Parent Phone, Term Bill</code>
                </p>
                <textarea
                  rows={7}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Zainab Umar, JSS 1 Gold, Female, Alhaji Umar, 08031234567, 165000\nFaruk Danladi, JSS 2 Diamond, Male, Engr Danladi, 08098765432, 175000`}
                  className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {bulkText.trim() ? `${bulkText.trim().split("\n").length} student row(s) ready` : "Paste rows above"}
                </span>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !bulkText.trim()}
                    className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? "Importing..." : "Import Students"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

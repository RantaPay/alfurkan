"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Filter,
  Trash2,
  Database,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Layers,
  ChevronRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { formatNaira } from "@/lib/utils";
import confetti from "canvas-confetti";

interface DatabaseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export function DatabaseImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: DatabaseImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview result from server
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [importCompleted, setImportCompleted] = useState<boolean>(false);
  const [completionStats, setCompletionStats] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (selectedFile: File) => {
    setErrorMessage(null);
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls") && !ext.endsWith(".csv")) {
      setErrorMessage("Please select a valid Excel (.xlsx, .xls) or CSV spreadsheet file.");
      return;
    }
    setFile(selectedFile);
    setPreviewData(null);
    setImportCompleted(false);
  };

  const handleAnalyzeFile = async () => {
    if (!file) return;
    setIsLoadingPreview(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "preview");

      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to analyze student spreadsheet.");
      }

      setPreviewData(data.result);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while analyzing the file.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    setIsExecuting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "execute");

      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to import students.");
      }

      setCompletionStats(data);
      setImportCompleted(true);

      // Confetti burst
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#075E54", "#128C7E", "#25D366", "#FFB21D"],
        });
      } catch (err) {}

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while importing students.");
    } finally {
      setIsExecuting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setImportCompleted(false);
    setCompletionStats(null);
    setErrorMessage(null);
    setSelectedClassFilter("ALL");
    setSearchQuery("");
  };

  // Filter students for preview
  const filteredStudents = (previewData?.students || []).filter((s: any) => {
    const matchesClass = selectedClassFilter === "ALL" || s.class === selectedClassFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.regNumber.toLowerCase().includes(q) ||
      s.class.toLowerCase().includes(q);
    return matchesClass && matchesQuery;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#075E54] text-white px-6 py-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Database className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Upload Student List
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Upload and organize student records from your school spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-semibold flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* STEP 3: COMPLETION VIEW */}
          {importCompleted ? (
            <div className="text-center py-8 px-4 space-y-5">
              <div className="h-18 w-18 rounded-full bg-emerald-100 text-[#075E54] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Student List Uploaded Successfully!
                </h3>
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  Successfully added <strong>{completionStats?.insertedCount} students</strong> across{" "}
                  <strong>{completionStats?.classesCount} classes</strong> to the school portal.
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center">
                  <div className="text-xs text-slate-500 font-bold">Total Students</div>
                  <div className="text-xl font-black font-mono text-[#075E54] mt-0.5">
                    {completionStats?.insertedCount}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center">
                  <div className="text-xs text-slate-500 font-bold">Total Classes</div>
                  <div className="text-xl font-black font-mono text-slate-800 mt-0.5">
                    {completionStats?.classesCount}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center">
                  <div className="text-xs text-slate-500 font-bold">New IDs Assigned</div>
                  <div className="text-xl font-black font-mono text-amber-700 mt-0.5">
                    {completionStats?.missingRegCount || 0}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center">
                  <div className="text-xs text-slate-500 font-bold">Duplicate IDs Fixed</div>
                  <div className="text-xl font-black font-mono text-blue-700 mt-0.5">
                    {completionStats?.duplicateCount || 0}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#064e46] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  View Students List
                </button>
              </div>
            </div>
          ) : !previewData ? (
            /* STEP 1: FILE UPLOAD & OPTIONS */
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  file
                    ? "border-[#075E54] bg-emerald-50/30"
                    : "border-slate-300 hover:border-[#075E54] hover:bg-slate-50/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSelectFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-100/70 text-[#075E54] flex items-center justify-center shadow-xs">
                    <FileSpreadsheet className="h-8 w-8 text-[#075E54]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {file ? file.name : "Choose or drag & drop your student spreadsheet"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {file
                        ? `${(file.size / 1024).toFixed(1)} KB • Ready to review and enroll students`
                        : "Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets with multiple class sheets"}
                    </p>
                  </div>

                  {file && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Spreadsheet Selected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Protection Guarantee Notice */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                <ShieldCheck className="h-4 w-4 text-[#075E54] shrink-0" />
                <span>
                  <strong>Safe Sync Guaranteed:</strong> Importing or updating students will never delete past receipts, payment balances, or audit histories.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!file || isLoadingPreview}
                  onClick={handleAnalyzeFile}
                  className="px-5 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#064e46] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingPreview ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Reading &amp; Organizing Roster...</span>
                    </>
                  ) : (
                    <>
                      <span>Review Student List</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: REVIEW PREVIEW */
            <div className="space-y-5">
              {/* Top Metrics Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Users className="h-3.5 w-3.5" />
                    <span>Total Students</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950 mt-1">
                    {previewData.totalStudents}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Classes Found</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-blue-950 mt-1">
                    {previewData.classes.length}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Formatting Notes</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-950 mt-1">
                    {previewData.warningCount}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Review Status</span>
                  </div>
                  <div className="text-xs font-black text-emerald-700 uppercase mt-2 tracking-wider">
                    ★ Ready to Import
                  </div>
                </div>
              </div>

              {/* Edge Case Warning Details Banner */}
              {previewData.warnings && previewData.warnings.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Automatic Formatting Adjustments ({previewData.warnings.length} items):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800 max-h-24 overflow-y-auto">
                    {previewData.warnings.map((w: any, idx: number) => (
                      <li key={idx}>
                        <strong>{w.sheet}</strong>: {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Class Filter Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                  <span>Class Breakdown (Click to filter preview table):</span>
                  <span>{previewData.classes.length} Classes</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setSelectedClassFilter("ALL")}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedClassFilter === "ALL"
                        ? "bg-[#075E54] text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    All Classes ({previewData.totalStudents})
                  </button>
                  {previewData.classes.map((cls: any) => (
                    <button
                      key={cls.name}
                      type="button"
                      onClick={() => setSelectedClassFilter(cls.name)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        selectedClassFilter === cls.name
                          ? "bg-[#075E54] text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cls.name} ({cls.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Student Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search preview by name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Showing {filteredStudents.length} of {previewData.totalStudents} students
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Reg Number</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3">Class</th>
                        <th className="py-2 px-3">Gender</th>
                        <th className="py-2 px-3 text-right">Term Bill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.slice(0, 50).map((st: any, i: number) => (
                        <tr key={st.regNumber + i} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {st.regNumber}
                            {st.isAutoAssignedReg && (
                              <span className="ml-1 text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-sans font-bold">
                                Pending ID
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-950">
                            {st.fullName}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{st.class}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                st.gender === "Female"
                                  ? "bg-pink-100 text-pink-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {st.gender}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                            {st.totalTermBill > 0 ? formatNaira(st.totalTermBill) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetState}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ← Choose Different File
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isExecuting}
                    onClick={handleExecuteImport}
                    className="px-6 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#064e46] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isExecuting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving {previewData.totalStudents} Students...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm &amp; Save {previewData.totalStudents} Students</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Student } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { Search, PlusCircle, UserCheck, Clock, AlertTriangle, ArrowRight } from "lucide-react";

interface QuickStudentSearchProps {
  onSelectStudent: (student: Student) => void;
}

export function QuickStudentSearch({ onSelectStudent }: QuickStudentSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/students?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.students.slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by student registration number (e.g. AFIC/2026/0101) or name to issue receipt..."
          className="w-full h-13 pl-12 pr-4 rounded-2xl border-2 border-slate-200 bg-white text-sm text-slate-900 font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#075E54] placeholder:text-slate-400 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {query && (
        <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>
              {loading ? "Searching..." : `Found ${results.length} student${results.length === 1 ? "" : "s"}`}
            </span>
            <span className="text-[10px] text-emerald-800 font-bold">
              Click &quot;Issue Receipt&quot; to generate receipt
            </span>
          </div>

          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {results.map((student) => (
                <div
                  key={student.id}
                  className="p-4 hover:bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-[#075E54] flex items-center justify-center font-bold text-xs shrink-0">
                      {student.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-slate-900">
                          {student.fullName}
                        </strong>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {student.regNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-700">{student.class}</span>
                        <span>•</span>
                        <span>Parent: {student.parentPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900">
                        Paid: {formatNaira(student.totalPaid)}
                      </div>
                      <div
                        className={`text-[11px] font-bold ${
                          student.balanceRemaining > 0 ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        {student.balanceRemaining > 0
                          ? `Debt: ${formatNaira(student.balanceRemaining)}`
                          : "Fully Cleared"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectStudent(student);
                        setQuery("");
                      }}
                      className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Issue Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No students found matching &quot;{query}&quot;. Try typing the registration number (e.g. AFIC/2026/0101).
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

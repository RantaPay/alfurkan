"use client";
import { useStudentSearch } from "@/features/students/useStudentSearch";
import type { Student } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function QuickStudentSearch({ onSelectStudent }: { onSelectStudent: (student: Student) => void }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading, error } = useStudentSearch(query);
  const container = useRef<HTMLDivElement>(null);
  const resultsId = useId();
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const select = (student: Student) => { onSelectStudent(student); setQuery(""); setIsOpen(false); };
  return <div ref={container} className="relative w-full" onKeyDown={event => { if (event.key === "Escape") setIsOpen(false); }}>
    <form className="relative flex gap-2" onSubmit={event => { event.preventDefault(); if (results[0]) select(results[0]); }}>
      <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" /><input aria-label="Search students" aria-controls={isOpen ? resultsId : undefined} type="search" value={query} onFocus={() => setIsOpen(true)} onChange={event => { setQuery(event.target.value); setIsOpen(true); }} placeholder="Student name or admission number" className="field-control pl-10" /></div>
      <button type="submit" className="button-primary" disabled={loading || !results.length}><span className="hidden sm:inline">Select student</span><ArrowRight className="h-4 w-4" /><span className="sr-only sm:hidden">Select first student</span></button>
    </form>
    {isOpen && query.trim() && <div id={resultsId} className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg">
      <div role="status" className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">{loading ? "Searching students…" : error || (results.length ? "Select a student to record their payment" : "No students found. Try a different name or admission number.")}</div>
      {results.slice(0, 6).map(student => <button type="button" key={student.id} onClick={() => select(student)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 p-4 text-left hover:bg-emerald-50"><span><span className="block text-sm font-semibold">{student.fullName}</span><span className="mt-1 block text-xs text-slate-500">{student.regNumber} · {student.class}</span></span><span className="shrink-0 text-right"><span className="block text-xs text-slate-500">Balance</span><span className="text-sm font-medium tabular-nums">{formatNaira(student.balanceRemaining)}</span></span></button>)}
    </div>}
  </div>;
}

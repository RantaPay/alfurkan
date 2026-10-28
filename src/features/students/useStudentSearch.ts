"use client";
import type { Student } from "@/lib/types";
import { useEffect, useState } from "react";

export function useStudentSearch(query: string, enabled = true) {
  const [state, setState] = useState<{ query: string; students: Student[]; error: string }>({ query: "", students: [], error: "" });
  useEffect(() => {
    if (!enabled || !query.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/students?query=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to search students. Please try again.");
        if (!controller.signal.aborted) setState({ query, students: data.students, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setState({ query, students: [], error: error instanceof Error ? error.message : "Unable to search students." });
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, enabled]);
  const active = enabled && !!query.trim();
  const current = active && state.query === query;
  return { results: current ? state.students : [], loading: active && !current, error: current ? state.error : "" };
}

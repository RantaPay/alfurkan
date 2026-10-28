"use client";
import { useCallback, useEffect, useState } from "react";

/** Discard responses for old filters and abort pending work on navigation. */
export function useApiResource<T>(url: string) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ url: string; data: T | null; loading: boolean; error: string }>({ url, data: null, loading: true, error: "" });
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setState({ url, data: null, loading: true, error: "" });
      try {
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load records. Please try again.");
        if (!controller.signal.aborted) setState({ url, data, loading: false, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setState({ url, data: null, loading: false, error: error instanceof Error ? error.message : "Unable to load records. Please try again." });
      }
    });
    return () => controller.abort();
  }, [url, revision]);
  return { data: state.url === url ? state.data : null, loading: state.url !== url || state.loading, error: state.url === url ? state.error : "", reload };
}

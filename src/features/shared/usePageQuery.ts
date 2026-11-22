"use client";

import { currentPath, queryMatches, queryString, readQuery } from "@/lib/return-path";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Keeps a page's filters in the address so leaving and coming back restores them. */
export function usePageQuery<T extends Record<string, string>>(defaults: T) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  const incomingRef = useRef(searchParams.toString());
  const [values, setValues] = useState(() => readQuery(searchParams, defaults));
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const update = (patch: Partial<T>) => {
    const next = { ...valuesRef.current, ...patch };
    valuesRef.current = next;
    setValues(next);
    const params = new URLSearchParams(incomingRef.current);
    if (queryMatches(defaultsRef.current, next, params)) return;
    const query = queryString(defaultsRef.current, next);
    incomingRef.current = query;
    const url = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event("alfurqan-query"));
  };

  return [values, update] as const;
}

export function useCurrentPath() {
  const pathname = usePathname() || "/";
  const params = useSearchParams();
  const [path, setPath] = useState(() => currentPath(pathname, params));

  useEffect(() => {
    const read = () => setPath(currentPath(window.location.pathname, new URLSearchParams(window.location.search)));
    read();
    window.addEventListener("alfurqan-query", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("alfurqan-query", read);
      window.removeEventListener("popstate", read);
    };
  }, [pathname, params]);

  return path;
}

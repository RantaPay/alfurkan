"use client";

import { currentPath, queryMatches, queryString, readQuery } from "@/lib/return-path";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

/** Keeps a page's filters in the address so leaving and coming back restores them. */
export function usePageQuery<T extends Record<string, string>>(defaults: T) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
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
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return [values, update] as const;
}

export function useCurrentPath() {
  const pathname = usePathname() || "/";
  return currentPath(pathname, useSearchParams());
}

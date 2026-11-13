"use client";

import { isConnectionOnline } from "@/lib/offline/connection";
import { useEffect } from "react";

/** Offline link clicks load the saved screen itself, instead of a partial navigation that stays on the dashboard. */
export function OfflineNavigation() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isConnectionOnline()) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

"use client";

import { setConnectionOnline } from "@/lib/offline/connection";
import { useEffect, useState } from "react";

async function probeConnection(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  const signal = typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(4000) : undefined;
  try {
    const response = await fetch("/api/health", { cache: "no-store", signal });
    return response.ok;
  } catch {
    return false;
  }
}

/** Browser events plus a real request. A Wi-Fi name with no internet counts as offline. */
export function useConnection() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let fails = 0;
    const apply = (value: boolean) => {
      setConnectionOnline(value);
      if (!cancelled) setOnline(value);
    };
    const check = async () => {
      const connected = await probeConnection();
      if (connected) {
        fails = 0;
        apply(true);
        return;
      }
      if (!navigator.onLine) {
        fails = 0;
        apply(false);
        return;
      }
      fails += 1;
      if (fails >= 2) apply(false);
    };
    const onOffline = () => {
      fails = 0;
      apply(false);
    };
    check();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, 20000);
    window.addEventListener("online", check);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return online;
}

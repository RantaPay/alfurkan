"use client";
import { useSyncExternalStore } from "react";
const key = "alfurqan_hide_sensitive_figures";
const eventName = "alfurqan-privacy-change";
function read() { try { return localStorage.getItem(key) === "true"; } catch { return false; } }
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(eventName, callback); };
}
export function usePrivacy() {
  const hideSensitive = useSyncExternalStore(subscribe, read, () => false);
  const toggleSensitive = () => {
    try { localStorage.setItem(key, String(!read())); } catch { return; }
    window.dispatchEvent(new Event(eventName));
  };
  return { hideSensitive, toggleSensitive };
}

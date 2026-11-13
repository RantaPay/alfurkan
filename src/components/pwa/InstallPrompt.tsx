"use client";

import { useAuth } from "@/lib/auth-context";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function dismissKey(userId: string) {
  return `alfurqan-pwa-install-dismissed:${userId}`;
}

function alreadyInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

export function InstallPrompt() {
  const { user } = useAuth();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [offered, setOffered] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
  }, [user?.id]);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setOffered(true);
    };
    const onInstalled = () => {
      if (user) localStorage.setItem(dismissKey(user.id), "1");
      setPromptEvent(null);
      setHidden(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [user]);

  const dismissed = user ? localStorage.getItem(dismissKey(user.id)) === "1" : true;
  if (!user || hidden || !offered || dismissed || alreadyInstalled()) return null;

  const close = () => {
    localStorage.setItem(dismissKey(user.id), "1");
    setHidden(true);
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") close();
  };

  return (
    <div className="print:hidden fixed bottom-4 right-4 z-40 w-[min(100%-2rem,22rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Install the app to enable offline functionality</p>
          <button
            type="button"
            onClick={install}
            disabled={!promptEvent}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#075E54] px-3 text-sm font-semibold text-white hover:bg-[#128C7E] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Install
          </button>
        </div>
        <button type="button" onClick={close} aria-label="Close install prompt" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

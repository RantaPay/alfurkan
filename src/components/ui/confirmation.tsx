"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "./dialog";

export function useConfirmation() {
  const [message, setMessage] = useState("");
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  useEffect(() => () => { resolver.current?.(false); }, []);
  const requestConfirmation = (text: string) => new Promise<boolean>(resolve => {
    resolver.current?.(false);
    resolver.current = resolve;
    setMessage(text);
  });
  const resolveConfirmation = (confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setMessage("");
  };
  return { confirmation: { message, onResolve: resolveConfirmation }, requestConfirmation };
}

export function ConfirmationDialog({ message, onResolve }: { message: string; onResolve: (confirmed: boolean) => void }) {
  if (!message) return null;
  return <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/60 p-4"><Dialog label="Confirm action" onClose={() => onResolve(false)} className="max-h-[90dvh] overflow-y-auto w-full max-w-md rounded-xl bg-white p-6 shadow-lg"><h2 className="text-lg font-semibold text-slate-900">Confirm action</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p><div className="mt-6 flex justify-end gap-3"><button type="button" className="button-secondary" onClick={() => onResolve(false)}>Cancel</button><button type="button" className="button-primary" onClick={() => onResolve(true)}>Continue</button></div></Dialog></div>;
}

"use client";

import { useState } from "react";
import { Lock, X, AlertCircle, ShieldCheck } from "lucide-react";

interface BursarPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function BursarPinModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Bursar Authorization Required",
  description = "Enter the 4-digit Bursar Security PIN to authorize this sensitive action.",
}: BursarPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!pin || pin.length < 4) {
      setError("Please enter the complete 4-digit PIN.");
      return;
    }

    try {
      setLoading(true);
      // Fetch current bursar pin from settings
      const res = await fetch("/api/settings");
      const data = await res.json();
      const expectedPin = data.school?.bursarPin || "1234";

      if (pin === expectedPin) {
        setPin("");
        onSuccess();
      } else {
        setError("Incorrect Bursar PIN. Default is 1234 (changeable in Settings).");
      }
    } catch (err: any) {
      setError("Authorization verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Bursar 4-Digit Passcode
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="••••"
              className="w-full h-12 text-center font-mono text-2xl tracking-[0.5em] font-black rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-[#075E54] focus:ring-4 focus:ring-emerald-50 transition-all"
            />
            <span className="block text-[10px] text-slate-400 text-center mt-1">
              Default system PIN: <strong className="font-mono text-slate-600">1234</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{loading ? "Verifying..." : "Authorize"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

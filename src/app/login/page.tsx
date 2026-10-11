"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  KeyRound,
  ArrowRight,
  School,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/";

  const { user, loginWithPassword, loginWithPin } = useAuth();

  const [mode, setMode] = useState<"password" | "pin">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (mode === "pin") {
        if (!pin || pin.length < 4) {
          setError("Please enter the complete 4-digit Accountant / Cashier PIN.");
          setLoading(false);
          return;
        }
        result = await loginWithPin(pin);
      } else {
        if (!email.trim() || !password) {
          setError("Please enter both email and password.");
          setLoading(false);
          return;
        }
        result = await loginWithPassword(email.trim(), password);
      }

      if (result.success) {
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#075E54", "#128C7E", "#FFB21D"],
          });
        } catch {}

        setTimeout(() => {
          router.push(redirectUrl);
        }, 500);
      } else {
        setError(result.error || "Login failed. Please check credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: "accountant" | "admin") => {
    setError("");
    if (role === "accountant") {
      setEmail("accountant@alfurqan.edu.ng");
      setPassword("accountant2026");
      setPin("1234");
    } else {
      setEmail("admin@alfurqan.edu.ng");
      setPassword("admin2026");
      setPin("9988");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#032d28] text-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#075E54]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#FFB21D]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top Branding Card */}
        <div className="text-center space-y-3">
          <div className="h-20 w-20 rounded-3xl bg-white p-2 shadow-2xl shadow-emerald-950/50 mx-auto flex items-center justify-center border-2 border-emerald-500/20">
            <img src="/logo.png" alt="Al-Furqan Crest" className="h-full w-full object-contain" />
          </div>

          <div>
            <div className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase mb-1">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Al-Furqan International Academy
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Official Cashier & Accountant Finance Clearance Portal
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 text-slate-900 space-y-5">
          {/* Mode Selector Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError("");
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email & Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("pin");
                setError("");
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "pin"
                  ? "bg-[#075E54] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Cashier & Accountant PIN</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "password" ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="accountant@alfurqan.edu.ng"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E54] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E54] focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                  Enter 4-Digit Accountant / Cashier Security Passcode
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full h-14 text-center font-mono text-3xl tracking-[0.5em] font-black rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-[#075E54] focus:ring-4 focus:ring-emerald-50 transition-all text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Fast login for authorized Cashiers, Accountants & Finance Desk Staff
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{loading ? "Authenticating..." : "Authorize & Enter Portal"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
              Quick 1-Click Cashier & Staff Login (Preset Accounts)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("accountant")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-black text-slate-800 group-hover:text-emerald-800">
                  🔑 Chief Accountant Danladi
                </div>
                <div className="text-[9px] text-slate-400 font-mono">PIN: 1234</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("admin")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-black text-slate-800 group-hover:text-amber-800">
                  🛡️ Principal Shehu
                </div>
                <div className="text-[9px] text-slate-400 font-mono">PIN: 9988</div>
              </button>
            </div>
          </div>
        </div>

        {/* Public Gate Check Footnote */}
        <div className="text-center space-y-2">
          <p className="text-[11px] text-slate-400">
            Parents & Gatekeepers: To verify receipt QR codes without login, visit{" "}
            <Link href="/receipts" className="text-emerald-400 font-bold hover:underline">
              Public Verification
            </Link>
          </p>
          <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <Lock className="h-3 w-3" />
            <span>256-bit Encrypted Cashier & Accounts Terminal • Al-Furqan College</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

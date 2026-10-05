"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { SchoolProfile } from "@/lib/types";
import {
  Building2,
  Save,
  CheckCircle2,
  CreditCard,
  Calendar,
  ShieldCheck,
  Upload,
  Lock,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function SettingsPage() {
  const [school, setSchool] = useState<SchoolProfile>({
    name: "Al-Furqan International College",
    shortName: "Al-Furqan",
    motto: "Knowledge, Discipline & Excellence",
    address: "Plot 14, Islamic Crescent, Off Airport Road, Gwarinpa, Abuja, Nigeria",
    email: "bursary@alfurqan.edu.ng",
    phone: "+234 803 456 7890 / +234 812 345 6789",
    currentTerm: "1st Term",
    currentSession: "2026/2027 Academic Session",
    bankName: "Jaiz Bank",
    accountNumber: "0012489301",
    accountName: "Al-Furqan International College - Fees",
    bursarName: "Alhaji Ibrahim S. Danladi",
    logoUrl: "",
    bursarPin: "1234",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.school) {
          setSchool(data.school);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSchool((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(school),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <SidebarLayout
        schoolName={school.name}
        currentTerm={`${school.currentTerm} (${school.currentSession})`}
        logoUrl={school.logoUrl}
      >
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            School Configuration & Bursary Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure school profile branding, bank details, and active academic session
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Settings saved successfully. Official receipts will reflect these details.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: School Identity */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="h-5 w-5 text-[#075E54]" />
              <h2 className="text-sm font-black text-slate-900">School Identity & Branding</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Official School Name (Header on Receipts)
                </label>
                <input
                  type="text"
                  value={school.name}
                  onChange={(e) => setSchool({ ...school, name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Motto</label>
                <input
                  type="text"
                  value={school.motto}
                  onChange={(e) => setSchool({ ...school, motto: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Contacts</label>
                <input
                  type="text"
                  value={school.phone}
                  onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">School Physical Address</label>
                <input
                  type="text"
                  value={school.address}
                  onChange={(e) => setSchool({ ...school, address: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              {/* Logo / Crest Upload */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-2">
                  Official School Crest / Logo
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center p-1.5 bg-slate-50 relative overflow-hidden shrink-0 shadow-xs">
                    {school.logoUrl ? (
                      <img src={school.logoUrl} alt="School Crest" className="h-full w-full object-contain" />
                    ) : (
                      <div className="h-full w-full rounded-xl bg-gradient-to-tr from-[#075E54] to-[#128C7E] flex items-center justify-center text-white font-black text-xl">
                        AF
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <p className="font-medium text-slate-600">
                      Upload your official school badge or crest (.png, .jpg, .svg). It will be printed on all digital receipts and verification screens.
                    </p>
                    <div className="flex items-center gap-3 pt-0.5">
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 text-xs border border-slate-300">
                        <Upload className="h-3.5 w-3.5 text-[#075E54]" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      {school.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setSchool({ ...school, logoUrl: "" })}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold hover:underline cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Official Bank Account for Parent Payments */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="h-5 w-5 text-[#075E54]" />
              <h2 className="text-sm font-black text-slate-900">
                School Bank Account (For Parent Direct Transfers)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={school.bankName}
                  onChange={(e) => setSchool({ ...school, bankName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Number (NUBAN)</label>
                <input
                  type="text"
                  value={school.accountNumber}
                  onChange={(e) => setSchool({ ...school, accountNumber: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={school.accountName}
                  onChange={(e) => setSchool({ ...school, accountName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Bursar & Session Calendar */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="h-5 w-5 text-[#075E54]" />
              <h2 className="text-sm font-black text-slate-900">Bursar & Academic Term Calendar</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Active Term</label>
                <select
                  value={school.currentTerm}
                  onChange={(e) => setSchool({ ...school, currentTerm: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Session</label>
                <input
                  type="text"
                  value={school.currentSession}
                  onChange={(e) => setSchool({ ...school, currentSession: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Authorized Bursar Name</label>
                <input
                  type="text"
                  value={school.bursarName}
                  onChange={(e) => setSchool({ ...school, bursarName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Bursar Passcode & Security */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="h-5 w-5 text-[#075E54]" />
              <h2 className="text-sm font-black text-slate-900">
                Bursar Authorization PIN & Void Protection
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bursar Security PIN (4 Digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={school.bursarPin || "1234"}
                  onChange={(e) => setSchool({ ...school, bursarPin: e.target.value.replace(/\D/g, "") })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-mono font-black text-slate-900 tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  This passcode is required to authorize voiding/cancelling receipts or performing ledger reversals. Default: <strong>1234</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-7 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </main>
      </SidebarLayout>
    </AuthGuard>
  );
}

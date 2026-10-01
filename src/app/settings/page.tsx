"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SchoolProfile } from "@/lib/types";
import {
  Building2,
  Save,
  CheckCircle2,
  CreditCard,
  Calendar,
  ShieldCheck,
} from "lucide-react";

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <Navbar schoolName={school.name} currentTerm={`${school.currentTerm} (${school.currentSession})`} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
    </div>
  );
}

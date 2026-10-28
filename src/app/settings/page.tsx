"use client";
import { ConfirmationDialog } from "@/components/ui/confirmation";
import { InlineNotice, LoadingRows } from "@/components/ui/feedback";
import { BankAccountsSection } from "@/features/settings/components/BankAccountsSection";
import { FeeScheduleSection } from "@/features/settings/components/FeeScheduleSection";
import { SchoolIdentitySection } from "@/features/settings/components/SchoolIdentitySection";
import { SettingsDialogs } from "@/features/settings/components/SettingsDialogs";
import { StaffSection } from "@/features/settings/components/StaffSection";


import { AuthGuard } from "@/components/auth/AuthGuard";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useSettingsForm } from "@/features/settings/useSettingsForm";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Layers,
  Save,
  ShieldCheck,
  Users
} from "lucide-react";


export default function SettingsPage() {
  const form = useSettingsForm();
  const { activeTab, setActiveTab, school, staffUsers, loading, saving, savedSuccess, statusMessage, handleSaveSettings } = form;
  return (
    <AuthGuard>
      <SidebarLayout
        schoolName={school.name}
        currentTerm={`${school.currentTerm} (${school.currentSession})`}
        logoUrl={school.logoUrl}
      >
        <main className="app-page space-y-6">
          {form.errorMessage && <InlineNotice>{form.errorMessage}</InlineNotice>}
          {/* Header & Sticky Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-[#075E54] border border-emerald-200">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                    Settings
                  </h1>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    Manage school profile, fee schedules, bank accounts, and staff access
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={saving || loading || !!form.loadError}
                className="bg-[#075E54] hover:bg-[#128C7E] active:translate-y-px text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{statusMessage || "Settings saved successfully."}</span>
            </div>
          )}

          {/* Tab Navigation Navigation Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveTab("identity")}
              className={`pb-3.5 px-4 font-bold text-sm sm:text-base border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "identity"
                  ? "border-[#075E54] text-[#075E54] font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-4.5 w-4.5" />
              <span>School Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("banks")}
              className={`pb-3.5 px-4 font-bold text-sm sm:text-base border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "banks"
                  ? "border-[#075E54] text-[#075E54] font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <CreditCard className="h-4.5 w-4.5" />
              <span>Bank Accounts ({school.bankAccounts?.length || 0})</span>
            </button>


            <button
              type="button"
              onClick={() => setActiveTab("fees")}
              className={`pb-3.5 px-4 font-bold text-sm sm:text-base border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "fees"
                  ? "border-[#075E54] text-[#075E54] font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-4.5 w-4.5" />
              <span>Class Fee Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`pb-3.5 px-4 font-bold text-sm sm:text-base border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "staff"
                  ? "border-[#075E54] text-[#075E54] font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Administrators ({staffUsers.length})</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          {form.loadError ? <InlineNotice onRetry={form.reloadSettings}>{form.loadError}</InlineNotice> : loading ? (
            <div className="panel p-6"><LoadingRows label="Loading settings" /></div>
          ) : (
            <>
              <SchoolIdentitySection form={form} />

<BankAccountsSection form={form} />

<FeeScheduleSection form={form} />

<StaffSection form={form} />

{/* Bottom Save Bar */}
          <div className="flex items-center justify-end pt-4 pb-12 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={saving || loading || !!form.loadError}
                  className="bg-[#075E54] hover:bg-[#128C7E] active:translate-y-px text-white px-8 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{saving ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </>
          )}
        </main>
      </SidebarLayout>

      <SettingsDialogs form={form} />
      <ConfirmationDialog {...form.confirmation} />


    </AuthGuard>
  );
}

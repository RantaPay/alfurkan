"use client";
import { useSettingsForm } from "@/features/settings/useSettingsForm";
import {
  Upload
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useSettingsForm>, "activeTab" | "school" | "setSchool" | "syncSchoolToDb" | "handleLogoUpload"> };
export function SchoolIdentitySection({ form }: Props) {
  const { activeTab, school, setSchool, syncSchoolToDb, handleLogoUpload } = form;
  return (<>
    {/* TAB 1: School Identity & Crest */}
    {activeTab === "identity" && (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Official Institution Profile</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Information rendered on student receipts, statement headers, and verification portals
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                Full School Name (Receipt Header)
              </label>
              <input aria-label="Full School Name (Receipt Header)"
                type="text"
                value={school.name}
                onChange={(e) => setSchool({ ...school, name: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-semibold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                Short School Name / Acronym
              </label>
              <input aria-label="Short School Name / Acronym"
                type="text"
                value={school.shortName}
                onChange={(e) => setSchool({ ...school, shortName: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                School Motto
              </label>
              <input aria-label="School Motto"
                type="text"
                value={school.motto}
                onChange={(e) => setSchool({ ...school, motto: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                Campus Physical Address
              </label>
              <input aria-label="Campus Physical Address"
                type="text"
                value={school.address}
                onChange={(e) => setSchool({ ...school, address: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                Official Contact Phone Numbers
              </label>
              <input aria-label="Official Contact Phone Numbers"
                type="text"
                value={school.phone}
                onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                Accounts & Finance Email
              </label>
              <input aria-label="Accounts & Finance Email"
                type="email"
                value={school.email}
                onChange={(e) => setSchool({ ...school, email: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            {/* Term & Session */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                Active Term
              </label>
              <select aria-label="Active Term"
                value={school.currentTerm}
                onChange={(e) => setSchool({ ...school, currentTerm: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-semibold text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
              >
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                Academic Session
              </label>
              <input aria-label="Academic Session"
                type="text"
                value={school.currentSession}
                onChange={(e) => setSchool({ ...school, currentSession: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-semibold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-1.5">
                Chief Accountant / Signatory Name (Receipt Stamp &amp; Signature)
              </label>
              <input aria-label="Chief Accountant / Signatory Name (Receipt Stamp &amp; Signature)"
                type="text"
                value={school.accountantName || ""}
                onChange={(e) => setSchool({ ...school, accountantName: e.target.value })}
                placeholder="e.g. Aminu S. Boro"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
              <p className="text-xs text-slate-500 mt-1">
                This name appears as the authorized signature and inside the official paid stamp on all receipts.
              </p>
            </div>
          </div>

          {/* Crest Upload */}
          <div className="pt-6 border-t border-slate-100">
            <label className="block text-xs sm:text-sm font-semibold  tracking-normal text-slate-800 mb-2">
              Official School Crest / Badge
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center p-2 bg-slate-50 relative overflow-hidden shrink-0 shadow-sm">
                {school.logoUrl ? (
                  <img
                    src={school.logoUrl}
                    alt="School Crest"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="h-full w-full rounded-xl bg-[#075E54] flex items-center justify-center text-white font-semibold text-2xl">
                    AF
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-medium">
                  Upload your official crest (.png, .jpg, .svg, max 2MB). This seal appears at the header of all printed receipts and audit slips.
                </p>
                <div className="flex items-center gap-3">
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-colors inline-flex items-center gap-2 text-xs sm:text-sm border border-slate-300">
                    <Upload className="h-4 w-4 text-[#075E54]" />
                    <span>Upload Crest Image</span>
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
                      onClick={async () => {
                        const updated = { ...school, logoUrl: "" };
                        setSchool(updated);
                        await syncSchoolToDb(updated, "School crest reset successfully.");
                      }}
                      className="text-rose-600 hover:text-rose-800 text-xs sm:text-sm font-bold hover:underline cursor-pointer"
                    >
                      Reset to Default Badge
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}


  </>);
}

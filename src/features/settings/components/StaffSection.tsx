"use client";
import { useSettingsForm } from "@/features/settings/useSettingsForm";
import {
  KeyRound,
  Plus
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useSettingsForm>, "activeTab" | "staffUsers" | "handleOpenAddStaff" | "handleOpenResetPassword" | "handleDeleteStaff"> };
export function StaffSection({ form }: Props) {
  const { activeTab, staffUsers, handleOpenAddStaff, handleOpenResetPassword, handleDeleteStaff } = form;
  return (<>
    {/* TAB 5: Staff & Cashiers */}
    {activeTab === "staff" && (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Administrators &amp; Access Management
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Create and manage administrators who can log in to the portal and issue receipts. All administrators sign in with their email and password.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddStaff}
              className="bg-[#075E54] hover:bg-[#128C7E] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Administrator</span>
            </button>
          </div>

          {/* Administrators Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4 text-center">Password</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {staffUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 block text-sm">
                          {user.name}
                        </span>
                        <span className="text-xs text-slate-500 block font-mono">{user.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold  tracking-normal inline-block bg-purple-100 text-purple-900 border border-purple-200">
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-700">{user.title}</td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenResetPassword(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#075E54] hover:bg-emerald-50 text-slate-700 hover:text-[#075E54] font-bold text-xs transition-colors cursor-pointer"
                        title="Reset or change password for this administrator"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-[#075E54]" />
                        <span>Reset Password</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {staffUsers.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(user.id, user.name)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold hover:underline cursor-pointer"
                        >
                          Remove Access
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold italic">
                          Primary Admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}


  </>);
}

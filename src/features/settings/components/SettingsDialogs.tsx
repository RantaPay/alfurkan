"use client";
import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/feedback";
import { useSettingsForm } from "@/features/settings/useSettingsForm";
import {
  CreditCard,
  History,
  KeyRound,
  RotateCcw,
  Users,
  X
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useSettingsForm>, "errorMessage" | "isBankModalOpen" | "setIsBankModalOpen" | "editingBankIndex" | "bankModalData" | "setBankModalData" | "isStaffModalOpen" | "setIsStaffModalOpen" | "staffModalData" | "setStaffModalData" | "isResetPasswordModalOpen" | "setIsResetPasswordModalOpen" | "resetTargetUser" | "newPasswordInput" | "setNewPasswordInput" | "isSavingPassword" | "selectedHistorySnapshot" | "isSnapshotModalOpen" | "setIsSnapshotModalOpen" | "handleSaveBankModal" | "handleRestoreSnapshot" | "handleSaveStaff" | "handleSaveResetPassword"> };
export function SettingsDialogs({ form }: Props) {
  const { errorMessage, isBankModalOpen, setIsBankModalOpen, editingBankIndex, bankModalData, setBankModalData, isStaffModalOpen, setIsStaffModalOpen, staffModalData, setStaffModalData, isResetPasswordModalOpen, setIsResetPasswordModalOpen, resetTargetUser, newPasswordInput, setNewPasswordInput, isSavingPassword, selectedHistorySnapshot, isSnapshotModalOpen, setIsSnapshotModalOpen, handleSaveBankModal, handleRestoreSnapshot, handleSaveStaff, handleSaveResetPassword } = form;
  return (<>
    {/* Modal 1: Add / Edit Bank Account */}
    {isBankModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
        <Dialog label="Bank account" onClose={() => setIsBankModalOpen(false)} className="bg-white rounded-xl max-w-md w-full max-h-[92dvh] shadow-lg border border-slate-200 overflow-x-hidden overflow-y-auto">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#075E54]" />
              <h3 className="text-base font-semibold text-slate-900">
                {editingBankIndex !== null ? "Edit Bank Account" : "Add Receiving Bank"}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Close bank account" onClick={() => setIsBankModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {errorMessage && <InlineNotice>{errorMessage}</InlineNotice>}
          <div className="p-6 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                Bank Name
              </label>
              <input aria-label="Bank Name"
                type="text"
                placeholder="e.g. Jaiz Bank, GTBank, Zenith Bank"
                value={bankModalData.bankName}
                onChange={(e) =>
                  setBankModalData({ ...bankModalData, bankName: e.target.value })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                Account Number (10 Digits)
              </label>
              <input aria-label="Account Number (10 Digits)"
                type="text"
                maxLength={10}
                placeholder="e.g. 0012489301"
                value={bankModalData.accountNumber}
                onChange={(e) =>
                  setBankModalData({
                    ...bankModalData,
                    accountNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                Official Account Name
              </label>
              <input aria-label="Official Account Name"
                type="text"
                placeholder="e.g. Alfurqan International Academy"
                value={bankModalData.accountName}
                onChange={(e) =>
                  setBankModalData({ ...bankModalData, accountName: e.target.value })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankModalData.isDefault || false}
                  onChange={(e) =>
                    setBankModalData({ ...bankModalData, isDefault: e.target.checked })
                  }
                  className="h-4.5 w-4.5 rounded text-[#075E54] focus:ring-[#075E54]"
                />
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  Designate as Primary School Account
                </span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              aria-label="Close bank account" onClick={() => setIsBankModalOpen(false)}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveBankModal}
              className="bg-[#075E54] hover:bg-[#128C7E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm cursor-pointer"
            >
              Save
            </button>
          </div>
        </Dialog>
      </div>
    )}

    {/* Modal 2: Add Administrator Account */}
    {isStaffModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
        <Dialog label="Staff account" onClose={() => setIsStaffModalOpen(false)} className="bg-white rounded-xl max-w-md w-full max-h-[92dvh] shadow-lg border border-slate-200 overflow-x-hidden overflow-y-auto">
          <form onSubmit={handleSaveStaff}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#075E54]" />
                <h3 className="text-base font-semibold text-slate-900">Add Administrator</h3>
              </div>
              <button
                type="button"
                aria-label="Close staff account" onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && <InlineNotice>{errorMessage}</InlineNotice>}
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                  Full Name
                </label>
                <input aria-label="Full Name"
                  type="text"
                  required
                  placeholder="e.g. Amina Mohammed"
                  value={staffModalData.name}
                  onChange={(e) =>
                    setStaffModalData({ ...staffModalData, name: e.target.value })
                  }
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                  Login Email Address
                </label>
                <input aria-label="Login Email Address"
                  type="email"
                  required
                  placeholder="e.g. admin2@alfurqan.edu.ng"
                  value={staffModalData.email}
                  onChange={(e) =>
                    setStaffModalData({ ...staffModalData, email: e.target.value })
                  }
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                  Login Password
                </label>
                <input aria-label="Login Password"
                  type="password"
                  required
                  placeholder="Enter login password"
                  value={staffModalData.password}
                  onChange={(e) =>
                    setStaffModalData({ ...staffModalData, password: e.target.value })
                  }
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                    Role
                  </label>
                  <select aria-label="Role"
                    value={staffModalData.role}
                    onChange={(e) =>
                      setStaffModalData({
                        ...staffModalData,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Cashier">Cashier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                    Designation Title
                  </label>
                  <input aria-label="Designation Title"
                    type="text"
                    required
                    placeholder="e.g. School Administrator"
                    value={staffModalData.title}
                    onChange={(e) =>
                      setStaffModalData({ ...staffModalData, title: e.target.value })
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                aria-label="Close staff account" onClick={() => setIsStaffModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#075E54] hover:bg-[#128C7E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </Dialog>
      </div>
    )}

    {/* Modal 2B: Reset Password Modal */}
    {isResetPasswordModalOpen && resetTargetUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
        <Dialog label="Reset password" onClose={() => setIsResetPasswordModalOpen(false)} className="bg-white rounded-xl max-w-md w-full max-h-[92dvh] shadow-lg border border-slate-200 overflow-x-hidden overflow-y-auto">
          <form onSubmit={handleSaveResetPassword}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#075E54]" />
                <h3 className="text-base font-semibold text-slate-900">
                  Reset Password
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close reset password" onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && <InlineNotice>{errorMessage}</InlineNotice>}
            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                Changing password for: <strong className="text-slate-900">{resetTargetUser.name}</strong> ({resetTargetUser.email})
              </div>

              <div>
                <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1.5">
                  New Password
                </label>
                <input aria-label="New Password"
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                aria-label="Close reset password" onClick={() => setIsResetPasswordModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPassword || !newPasswordInput.trim()}
                className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm cursor-pointer"
              >
                {isSavingPassword ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Dialog>
      </div>
    )}
    {/* Modal 3: View Historical Fee Schedule Revision Breakdown */}
    {isSnapshotModalOpen && selectedHistorySnapshot && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <Dialog label="Fee history" onClose={() => setIsSnapshotModalOpen(false)} className="bg-white rounded-xl max-w-2xl w-full shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-[#075E54] rounded-xl border border-emerald-200">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Fee Schedule Revision Snapshot
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedHistorySnapshot.term} • {selectedHistorySnapshot.session}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close fee history" onClick={() => setIsSnapshotModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block ">Updated On</span>
                <span className="font-mono font-bold text-slate-800">
                  {new Date(selectedHistorySnapshot.updatedAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block ">Authorized By</span>
                <span className="font-bold text-slate-800">
                  {selectedHistorySnapshot.updatedBy}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 block ">Revision Note</span>
                <span className="font-medium text-slate-700 italic">
                  {selectedHistorySnapshot.notes || "Standard Schedule"}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Class Level</th>
                    <th className="py-2.5 px-3 text-right">Tuition</th>
                    <th className="py-2.5 px-3 text-right">Notebook/Textbooks</th>
                    <th className="py-2.5 px-3 text-right">Uniform</th>
                    <th className="py-2.5 px-3 text-right">Sport Wears</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-emerald-900 bg-emerald-50/70">Total Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {(selectedHistorySnapshot.schedule || []).map((row) => (
                    <tr key={row.classLevel} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{row.classLevel}</td>
                      <td className="py-2 px-3 text-right font-mono">₦{row.tuitionFee.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono">₦{row.booksFee.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono">₦{row.uniformFee.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono">₦{(row.sportsWearFee ?? row.ptaLevy ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800 bg-emerald-50/70">
                        ₦{row.totalBill.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleRestoreSnapshot(selectedHistorySnapshot)}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 text-[#075E54]" />
              <span>Load Rates into Current Editor</span>
            </button>

            <button
              type="button"
              aria-label="Close fee history" onClick={() => setIsSnapshotModalOpen(false)}
              className="bg-[#075E54] hover:bg-[#128C7E] text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </Dialog>
      </div>
    )}

  </>);
}

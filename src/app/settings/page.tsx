"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import {
  Building2,
  Save,
  CheckCircle2,
  CreditCard,
  Calendar,
  ShieldCheck,
  Upload,
  Lock,
  Plus,
  Trash2,
  Edit2,
  FileText,
  DollarSign,
  Users,
  Eye,
  KeyRound,
  X,
  Layers,
  HelpCircle,
  AlertCircle,
  History,
  RotateCcw,
  Sparkles,
  Clock,
  ArrowRight,
  Check,
  Database,
  UserPlus,
  FileSpreadsheet,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  SchoolProfile,
  BankAccountConfig,
  ClassFeeConfig,
  StaffUser,
  FeeScheduleHistoryEntry,
} from "@/lib/types";

type SettingsTab = "identity" | "banks" | "fees" | "staff";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("identity");

  // School profile state
  const [school, setSchool] = useState<SchoolProfile>({
    name: "Al-Furqan International Academy",
    shortName: "Al-Furqan",
    motto: "Knowledge and Guidance",
    address: "Along Dass Road, Bauchi State",
    email: "admin@alfurqanintlacademy.com",
    phone: "+234 806 977 0538",
    currentTerm: "1st Term",
    currentSession: "2026/2027 Session",
    bankName: "",
    accountNumber: "",
    accountName: "",
    accountantName: "Administrator",
    logoUrl: "",
    accountantPin: "",
    receiptPrefix: "AFIA/",
    receiptFooterNote:
      "Receipt • Valid only with authorized Stamp • Fees paid are non-refundable after term commencement • All payments subject to bank clearance",
    defaultReceiptFormat: "traditional",
    showStamp: true,
    bankAccounts: [],
    feeStructure: [],
  });

  // Staff users state
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Status flags
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Modals state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);
  const [bankModalData, setBankModalData] = useState<BankAccountConfig>({
    id: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    isDefault: false,
  });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffModalData, setStaffModalData] = useState<{
    id?: string;
    name: string;
    email: string;
    role: "Admin" | "Cashier" | "Accountant";
    password: string;
    title: string;
  }>({
    name: "",
    email: "",
    role: "Admin",
    password: "",
    title: "School Administrator",
  });

  // Reset Password State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<StaffUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Fee schedule revision & history state
  const [feeRevisionNote, setFeeRevisionNote] = useState("");
  const [selectedHistorySnapshot, setSelectedHistorySnapshot] = useState<FeeScheduleHistoryEntry | null>(null);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [savingFees, setSavingFees] = useState(false);

  // Load Settings and Staff
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [settingsRes, staffRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/staff"),
        ]);

        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.school) {
          setSchool(settingsData.school);
        }

        const staffData = await staffRes.json();
        if (staffData.success && staffData.users) {
          setStaffUsers(staffData.users);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setStatusMessage("");
    }, 4000);
  };

  const syncSchoolToDb = async (updated: SchoolProfile, successMsg?: string) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success && data.school) {
        setSchool(data.school);
        if (successMsg) showNotification(successMsg);
        return data.school;
      } else if (data.error) {
        console.error("Settings sync error:", data.error);
      }
    } catch (err) {
      console.error("Failed to sync settings to database:", err);
    }
    return updated;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        const newLogo = reader.result as string;
        const updated = { ...school, logoUrl: newLogo };
        setSchool(updated);
        await syncSchoolToDb(updated, "School crest updated successfully.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(school),
      });
      const data = await res.json();
      if (data.success) {
        setSchool(data.school);
        showNotification("Saved successfully.");
      } else {
        alert("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Network error saving settings");
    } finally {
      setSaving(false);
    }
  };

  // Bank Account Handlers
  const handleOpenAddBank = () => {
    setEditingBankIndex(null);
    setBankModalData({
      id: `bank_${Date.now()}`,
      bankName: "",
      accountNumber: "",
      accountName: school.name ? `${school.name} - Tuition` : "Al-Furqan Academy",
      isDefault: (school.bankAccounts || []).length === 0,
    });
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (index: number) => {
    const target = school.bankAccounts?.[index];
    if (!target) return;
    setEditingBankIndex(index);
    setBankModalData({ ...target });
    setIsBankModalOpen(true);
  };

  const handleSaveBankModal = async () => {
    if (!bankModalData.bankName.trim() || !bankModalData.accountNumber.trim()) {
      alert("Please provide bank name and account number.");
      return;
    }

    const accounts = [...(school.bankAccounts || [])];

    if (bankModalData.isDefault) {
      accounts.forEach((acc) => {
        acc.isDefault = false;
      });
    }

    if (editingBankIndex !== null) {
      accounts[editingBankIndex] = bankModalData;
    } else {
      accounts.push(bankModalData);
    }

    // Ensure at least one is default
    if (!accounts.some((a) => a.isDefault) && accounts.length > 0) {
      accounts[0].isDefault = true;
    }

    const updated = { ...school, bankAccounts: accounts };
    setSchool(updated);
    setIsBankModalOpen(false);
    await syncSchoolToDb(updated, "Bank account saved successfully.");
  };

  const handleDeleteBank = async (index: number) => {
    const accounts = [...(school.bankAccounts || [])];
    const removed = accounts.splice(index, 1)[0];
    if (removed && removed.isDefault && accounts.length > 0) {
      accounts[0].isDefault = true;
    }
    const updated = { ...school, bankAccounts: accounts };
    setSchool(updated);
    await syncSchoolToDb(
      updated,
      `Bank account ${removed?.bankName || ""} removed successfully.`
    );
  };

  const handleSetDefaultBank = async (id: string) => {
    const accounts = (school.bankAccounts || []).map((b) => ({
      ...b,
      isDefault: b.id === id,
    }));
    const updated = { ...school, bankAccounts: accounts };
    setSchool(updated);
    await syncSchoolToDb(updated, "Default receiving bank updated successfully.");
  };

  // Fee Schedule Handlers
  const handleFeeChange = (
    classIndex: number,
    field: keyof Omit<ClassFeeConfig, "classLevel" | "totalBill" | "developmentLevy" | "ptaLevy">,
    val: number
  ) => {
    const list = [...(school.feeStructure || [])];
    const target = { ...list[classIndex], [field]: val };
    const sportsWear = target.sportsWearFee ?? target.ptaLevy ?? 0;
    target.totalBill =
      (target.tuitionFee || 0) +
      (target.booksFee || 0) +
      (target.uniformFee || 0) +
      sportsWear;
    list[classIndex] = target;
    setSchool({ ...school, feeStructure: list });
  };

  const handleAddClassLevel = async (levelName: string) => {
    const list = [...(school.feeStructure || [])];
    if (list.some((item) => item.classLevel.toLowerCase() === levelName.toLowerCase())) {
      alert(`Class level ${levelName} is already configured in the fee schedule.`);
      return;
    }

    list.push({
      classLevel: levelName,
      tuitionFee: 0,
      booksFee: 0,
      uniformFee: 0,
      sportsWearFee: 0,
      totalBill: 0,
    });
    const updated = { ...school, feeStructure: list };
    setSchool(updated);
    await syncSchoolToDb(updated, `Added ${levelName} to Fee Schedule successfully.`);
  };

  const handleRemoveClassLevel = async (index: number) => {
    const list = [...(school.feeStructure || [])];
    const removed = list.splice(index, 1);
    const updated = { ...school, feeStructure: list };
    setSchool(updated);
    await syncSchoolToDb(
      updated,
      `Removed ${removed[0]?.classLevel || "class"} from Fee Schedule successfully.`
    );
  };

  const handleLoadAllSchoolClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success && Array.isArray(data.classes)) {
        const dbClasses: string[] = data.classes;
        const currentFees = school.feeStructure || [];
        const merged = dbClasses.map((classLevel) => {
          const existing = currentFees.find(
            (c) => c.classLevel.toLowerCase() === classLevel.toLowerCase()
          );
          return (
            existing || {
              classLevel,
              tuitionFee: 0,
              booksFee: 0,
              uniformFee: 0,
              sportsWearFee: 0,
              totalBill: 0,
            }
          );
        });

        const updated = { ...school, feeStructure: merged };
        setSchool(updated);
        await syncSchoolToDb(updated, "Loaded all school classes successfully.");
      }
    } catch (err) {
      console.error("Failed to load classes from database:", err);
    }
  };

  const handleSaveFeeSchedule = async () => {
    setSavingFees(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...school,
          feeRevisionNote: feeRevisionNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSchool(data.school);
        setFeeRevisionNote("");
        showNotification("Saved successfully.");
      } else {
        alert("Failed to save fee schedule: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Network error saving fee schedule");
    } finally {
      setSavingFees(false);
    }
  };

  const handleRestoreSnapshot = async (entry: FeeScheduleHistoryEntry) => {
    if (
      confirm(
        `Load historical fee rates from "${entry.term} • ${entry.session}" into the editor? You can review or adjust them before saving.`
      )
    ) {
      const updated = {
        ...school,
        feeStructure: entry.schedule.map((f) => ({ ...f })),
      };
      setSchool(updated);
      setFeeRevisionNote(
        `Restored from historical revision dated ${new Date(entry.updatedAt).toLocaleDateString("en-GB")}`
      );
      setIsSnapshotModalOpen(false);
      await syncSchoolToDb(
        updated,
        `Restored fee rates from ${entry.term} (${entry.session}) successfully.`
      );
    }
  };

  // Staff & Admin Management Handlers
  const handleOpenAddStaff = () => {
    setStaffModalData({
      name: "",
      email: "",
      role: "Admin",
      password: "",
      title: "School Administrator",
    });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffModalData.name.trim() || !staffModalData.email.trim() || !staffModalData.password.trim()) {
      alert("Name, email address, and password are required.");
      return;
    }

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffModalData.name.trim(),
          email: staffModalData.email.trim().toLowerCase(),
          role: staffModalData.role,
          password: staffModalData.password.trim(),
          title: staffModalData.title.trim() || "School Administrator",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsStaffModalOpen(false);
        // Refresh staff list
        const refreshed = await fetch("/api/staff").then((r) => r.json());
        if (refreshed.success) setStaffUsers(refreshed.users);
        showNotification("Administrator account created successfully.");
      } else {
        alert("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error saving administrator account");
    }
  };

  const handleOpenResetPassword = (targetUser: StaffUser) => {
    setResetTargetUser(targetUser);
    setNewPasswordInput("");
    setIsResetPasswordModalOpen(true);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPasswordInput.trim()) {
      alert("Please enter a new password.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetTargetUser.id,
          password: newPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsResetPasswordModalOpen(false);
        showNotification(`Password updated successfully for ${resetTargetUser.name}.`);
      } else {
        alert(data.error || "Failed to update password");
      }
    } catch (err) {
      alert("Network error updating password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteStaff = async (userId: string, userName: string) => {
    if (staffUsers.length <= 1) {
      alert("Cannot delete the only remaining administrator account.");
      return;
    }
    if (!confirm(`Are you sure you want to remove administrator access for ${userName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/staff?id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setStaffUsers((prev) => prev.filter((u) => u.id !== userId));
        showNotification(`Removed access for ${userName}.`);
      } else {
        alert(data.error || "Failed to remove staff");
      }
    } catch {
      alert("Network error removing administrator");
    }
  };

  return (
    <AuthGuard>
      <SidebarLayout
        schoolName={school.name}
        currentTerm={`${school.currentTerm} (${school.currentSession})`}
        logoUrl={school.logoUrl}
      >
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header & Sticky Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-[#075E54] border border-emerald-200">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    School &amp; Bursary Settings
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
                disabled={saving}
                className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
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
                  ? "border-[#075E54] text-[#075E54] font-black"
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
                  ? "border-[#075E54] text-[#075E54] font-black"
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
                  ? "border-[#075E54] text-[#075E54] font-black"
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
                  ? "border-[#075E54] text-[#075E54] font-black"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Administrators ({staffUsers.length})</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-24 text-center">
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: School Identity & Crest */}
              {activeTab === "identity" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Official Institution Profile</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Information rendered on student receipts, statement headers, and verification portals
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Full School Name (Receipt Header)
                    </label>
                    <input
                      type="text"
                      value={school.name}
                      onChange={(e) => setSchool({ ...school, name: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Short School Name / Acronym
                    </label>
                    <input
                      type="text"
                      value={school.shortName}
                      onChange={(e) => setSchool({ ...school, shortName: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      School Motto
                    </label>
                    <input
                      type="text"
                      value={school.motto}
                      onChange={(e) => setSchool({ ...school, motto: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Campus Physical Address
                    </label>
                    <input
                      type="text"
                      value={school.address}
                      onChange={(e) => setSchool({ ...school, address: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Official Contact Phone Numbers
                    </label>
                    <input
                      type="text"
                      value={school.phone}
                      onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Accounts & Finance Email
                    </label>
                    <input
                      type="email"
                      value={school.email}
                      onChange={(e) => setSchool({ ...school, email: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>

                  {/* Term & Session */}
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Active Term
                    </label>
                    <select
                      value={school.currentTerm}
                      onChange={(e) => setSchool({ ...school, currentTerm: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-black text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
                    >
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Academic Session
                    </label>
                    <input
                      type="text"
                      value={school.currentSession}
                      onChange={(e) => setSchool({ ...school, currentSession: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Chief Accountant / Bursar Name
                    </label>
                    <input
                      type="text"
                      value={school.accountantName || ""}
                      onChange={(e) => setSchool({ ...school, accountantName: e.target.value })}
                      placeholder="e.g. Alhaji Ibrahim S. Danladi"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>
                </div>

                {/* Crest Upload */}
                <div className="pt-6 border-t border-slate-100">
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-2">
                    Official School Crest / Badge
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center p-2 bg-slate-50 relative overflow-hidden shrink-0 shadow-sm">
                      {school.logoUrl ? (
                        <img
                          src={school.logoUrl}
                          alt="School Crest"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="h-full w-full rounded-xl bg-gradient-to-tr from-[#075E54] to-[#128C7E] flex items-center justify-center text-white font-black text-2xl">
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

          {/* TAB 2: Receiving Bank Accounts */}
          {activeTab === "banks" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      School Collection & Bank Accounts
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Configure verified bank accounts used by parents for direct transfers and teller deposits
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddBank}
                    className="bg-[#075E54] hover:bg-[#128C7E] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Bank Account</span>
                  </button>
                </div>

                {/* Bank Account Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(school.bankAccounts || []).map((acc, index) => (
                    <div
                      key={acc.id || index}
                      className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        acc.isDefault
                          ? "border-emerald-500 bg-emerald-50/30 shadow-sm ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                              <CreditCard className="h-4.5 w-4.5 text-[#075E54]" />
                            </span>
                            <div>
                              <h3 className="font-black text-slate-900 text-base leading-tight">
                                {acc.bankName}
                              </h3>
                              <span className="text-xs text-slate-500 font-medium line-clamp-1">
                                {acc.accountName}
                              </span>
                            </div>
                          </div>
                          {acc.isDefault && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 mb-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            NUBAN Account Number
                          </span>
                          <span className="font-mono text-lg font-black text-slate-900 tracking-wider block">
                            {acc.accountNumber}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        {!acc.isDefault ? (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultBank(acc.id)}
                            className="text-xs font-bold text-[#075E54] hover:underline cursor-pointer"
                          >
                            Set as Primary
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Default Account
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditBank(index)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Account"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBank(index)}
                            disabled={(school.bankAccounts || []).length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* TAB 4: Class Fee Schedule */}
          {activeTab === "fees" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Card 1: Fee Schedule Configuration & Active Term/Session */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#075E54]" />
                      <span>Standard Term Fee Schedule per Class Level</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      Configure school fees per class level. All arms (A, B, C) of each class automatically share the same school fees.
                    </p>
                  </div>

                  {/* Active Period Badges */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-[#075E54] border border-emerald-200">
                      <Calendar className="h-3.5 w-3.5 text-[#075E54]" />
                      <span>Active Term: {school.currentTerm}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                      <span>{school.currentSession}</span>
                    </span>
                  </div>
                </div>

                {/* Term & Session Configuration Bar */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#075E54]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Target Academic Period for this Fee Schedule
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    {/* Academic Session */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                        Academic Session
                      </label>
                      <input
                        type="text"
                        value={school.currentSession}
                        onChange={(e) => setSchool({ ...school, currentSession: e.target.value })}
                        placeholder="e.g. 2026/2027 Academic Session"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                      />
                    </div>

                    {/* Academic Term */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                        Academic Term
                      </label>
                      <select
                        value={school.currentTerm}
                        onChange={(e) => setSchool({ ...school, currentTerm: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none cursor-pointer"
                      >
                        <option value="1st Term">1st Term</option>
                        <option value="2nd Term">2nd Term</option>
                        <option value="3rd Term">3rd Term</option>
                      </select>
                    </div>

                    {/* Revision Note */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                        Revision Note / Reason (Optional)
                      </label>
                      <input
                        type="text"
                        value={feeRevisionNote}
                        onChange={(e) => setFeeRevisionNote(e.target.value)}
                        placeholder="e.g. Board approval for new session"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 font-medium text-slate-900 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Table for Class Fee Schedule */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>Configured Class Levels</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {(school.feeStructure || []).length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadAllSchoolClasses}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reload School Classes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt("Enter Class Level name (e.g. Basic 1, JSS 1, SS 1, Creche):");
                        if (name && name.trim()) {
                          handleAddClassLevel(name.trim());
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Class Level</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                        <th className="py-3 px-3.5">Class Level</th>
                        <th className="py-3 px-3">Tuition Fee (₦)</th>
                        <th className="py-3 px-3">Notebook / Textbooks (₦)</th>
                        <th className="py-3 px-3">Uniform (₦)</th>
                        <th className="py-3 px-3">Sport Wears (₦)</th>
                        <th className="py-3 px-3.5 text-right font-black text-emerald-900 bg-emerald-50/70">
                          Total Bill (₦)
                        </th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {(school.feeStructure || []).map((fee, idx) => (
                        <tr key={fee.classLevel || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3.5 font-black text-slate-900 bg-slate-50/30">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#075E54]"></span>
                              <span>{fee.classLevel}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              value={fee.tuitionFee}
                              onChange={(e) =>
                                handleFeeChange(idx, "tuitionFee", Number(e.target.value) || 0)
                              }
                              className="w-28 h-9 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              value={fee.booksFee}
                              onChange={(e) =>
                                handleFeeChange(idx, "booksFee", Number(e.target.value) || 0)
                              }
                              className="w-24 h-9 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              value={fee.uniformFee}
                              onChange={(e) =>
                                handleFeeChange(idx, "uniformFee", Number(e.target.value) || 0)
                              }
                              className="w-24 h-9 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              value={fee.sportsWearFee ?? fee.ptaLevy ?? 0}
                              onChange={(e) =>
                                handleFeeChange(idx, "sportsWearFee", Number(e.target.value) || 0)
                              }
                              className="w-24 h-9 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#075E54] focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-3.5 text-right font-black text-slate-900 bg-emerald-50/70 font-mono text-sm">
                            ₦{fee.totalBill.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveClassLevel(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Remove ${fee.classLevel}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Save Button for Fee Schedule */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">
                    Saving applies this fee schedule across all student arms (A, B, C) and updates their school fee balances.
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveFeeSchedule}
                    disabled={savingFees}
                    className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingFees ? "Saving..." : "Save"}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Previous Records of Fee Updates (History & Audit Trail) */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <History className="h-5 w-5 text-[#075E54]" />
                      <span>Previous Records of Fee Updates & Audit Trail</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      Historical ledger of fee changes across academic sessions and terms. View past rates or reload them into the schedule.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{(school.feeScheduleHistory || []).length} Revisions Recorded</span>
                  </span>
                </div>

                {/* History Records Table */}
                {(school.feeScheduleHistory || []).length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">No past fee updates recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Whenever you save a fee schedule, a permanent revision snapshot will be created here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                          <th className="py-3 px-3.5">Revision Date & Time</th>
                          <th className="py-3 px-3">Session & Term</th>
                          <th className="py-3 px-3">Authorized By</th>
                          <th className="py-3 px-3">Class Rates Snapshot</th>
                          <th className="py-3 px-3">Revision Notes</th>
                          <th className="py-3 px-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {(school.feeScheduleHistory || []).map((entry, idx) => {
                          const dateObj = new Date(entry.updatedAt);
                          const formattedDate = isNaN(dateObj.getTime())
                            ? entry.updatedAt
                            : dateObj.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }) +
                              " • " +
                              dateObj.toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              });

                          return (
                            <tr key={entry.id || idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="font-mono font-bold text-slate-800 block text-xs">
                                  {formattedDate}
                                </span>
                                {idx === 0 && (
                                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Latest Active
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="font-black text-slate-900 text-xs sm:text-sm">
                                  {entry.term}
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                  {entry.session}
                                </div>
                              </td>

                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                  <ShieldCheck className="h-3.5 w-3.5 text-[#075E54]" />
                                  <span>{entry.updatedBy}</span>
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {(entry.schedule || []).slice(0, 4).map((cls) => (
                                    <span
                                      key={cls.classLevel}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200"
                                    >
                                      <span className="font-sans font-semibold text-slate-500">{cls.classLevel}:</span>
                                      <span>₦{cls.totalBill.toLocaleString()}</span>
                                    </span>
                                  ))}
                                  {(entry.schedule || []).length > 4 && (
                                    <span className="text-[10px] text-slate-400 font-bold self-center">
                                      +{entry.schedule.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span className="text-xs text-slate-600 line-clamp-2 italic font-normal">
                                  {entry.notes || "Standard scheduled update"}
                                </span>
                              </td>

                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedHistorySnapshot(entry);
                                      setIsSnapshotModalOpen(true);
                                    }}
                                    className="p-1.5 text-[#075E54] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                                    title="View Full Breakdown Snapshot"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRestoreSnapshot(entry)}
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                                    title="Load this revision's rates into editor"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Staff & Cashiers */}
          {activeTab === "staff" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
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
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
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
                              <span className="font-black text-slate-900 block text-sm">
                                {user.name}
                              </span>
                              <span className="text-xs text-slate-500 block font-mono">{user.email}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block bg-purple-100 text-purple-900 border border-purple-200">
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

              {/* Bottom Save Bar */}
              <div className="flex items-center justify-end pt-4 pb-12 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={saving}
                  className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-8 py-3 rounded-2xl text-sm sm:text-base font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
                </button>
              </div>
            </>
          )}
        </main>
      </SidebarLayout>

      {/* Modal 1: Add / Edit Bank Account */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#075E54]" />
                <h3 className="text-base font-black text-slate-900">
                  {editingBankIndex !== null ? "Edit Bank Account" : "Add Receiving Bank"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Bank Name
                </label>
                <input
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
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Account Number (10 Digits)
                </label>
                <input
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
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Official Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Al-Furqan International Academy"
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
                onClick={() => setIsBankModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBankModal}
                className="bg-[#075E54] hover:bg-[#128C7E] text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm cursor-pointer"
              >
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add Administrator Account */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <form onSubmit={handleSaveStaff}>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#075E54]" />
                  <h3 className="text-base font-black text-slate-900">Add Administrator</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Full Name
                  </label>
                  <input
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
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Login Email Address
                  </label>
                  <input
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
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Login Password
                  </label>
                  <input
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
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Role
                    </label>
                    <select
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
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Designation Title
                    </label>
                    <input
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
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#075E54] hover:bg-[#128C7E] text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm cursor-pointer"
                >
                  Create Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2B: Reset Password Modal */}
      {isResetPasswordModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <form onSubmit={handleSaveResetPassword}>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-[#075E54]" />
                  <h3 className="text-base font-black text-slate-900">
                    Reset Password
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700">
                  Changing password for: <strong className="text-slate-900">{resetTargetUser.name}</strong> ({resetTargetUser.email})
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    New Password
                  </label>
                  <input
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
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword || !newPasswordInput.trim()}
                  className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm cursor-pointer"
                >
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal 3: View Historical Fee Schedule Revision Breakdown */}
      {isSnapshotModalOpen && selectedHistorySnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-[#075E54] rounded-xl border border-emerald-200">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Fee Schedule Revision Snapshot
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedHistorySnapshot.term} • {selectedHistorySnapshot.session}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSnapshotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Updated On</span>
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
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Authorized By</span>
                  <span className="font-bold text-slate-800">
                    {selectedHistorySnapshot.updatedBy}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Revision Note</span>
                  <span className="font-medium text-slate-700 italic">
                    {selectedHistorySnapshot.notes || "Standard Schedule"}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                      <th className="py-2.5 px-3">Class Level</th>
                      <th className="py-2.5 px-3 text-right">Tuition</th>
                      <th className="py-2.5 px-3 text-right">Notebook/Textbooks</th>
                      <th className="py-2.5 px-3 text-right">Uniform</th>
                      <th className="py-2.5 px-3 text-right">Sport Wears</th>
                      <th className="py-2.5 px-3 text-right font-black text-emerald-900 bg-emerald-50/70">Total Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {(selectedHistorySnapshot.schedule || []).map((row) => (
                      <tr key={row.classLevel} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-black text-slate-900">{row.classLevel}</td>
                        <td className="py-2 px-3 text-right font-mono">₦{row.tuitionFee.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono">₦{row.booksFee.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono">₦{row.uniformFee.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono">₦{(row.sportsWearFee ?? row.ptaLevy ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-emerald-800 bg-emerald-50/70">
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
                onClick={() => setIsSnapshotModalOpen(false)}
                className="bg-[#075E54] hover:bg-[#128C7E] text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-black shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </AuthGuard>
  );
}

"use client";
import { useConfirmation } from "@/components/ui/confirmation";

import { DEFAULT_CONCESSIONS } from "@/lib/student-importer";
import {
  BankAccountConfig,
  ClassFeeConfig,
  FeeScheduleHistoryEntry,
  SchoolProfile,
  StaffUser,
} from "@/lib/types";
import { useEffect, useState } from "react";

export type SettingsTab = "identity" | "banks" | "fees" | "staff";

export function useSettingsForm() {
  const { confirmation, requestConfirmation } = useConfirmation();
  const [loadError, setLoadError] = useState("");
  const [loadRevision, setLoadRevision] = useState(0);
  const reloadSettings = () => setLoadRevision(value => value + 1);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("identity");

  // School profile state
  const [school, setSchool] = useState<SchoolProfile>({
    name: "Alfurqan International Academy",
    shortName: "Alfurqan",
    motto: "Knowledge and Guidance",
    address: "Along Dass Road, Bauchi State",
    email: "admin@alfurqanintlacademy.com",
    phone: "+234 806 977 0538",
    currentTerm: "1st Term",
    currentSession: "2026/2027 Session",
    bankName: "",
    accountNumber: "",
    accountName: "",
    accountantName: "Aminu S. Boro",
    logoUrl: "",
    accountantPin: "",
    receiptPrefix: "AFIA/",
    receiptFooterNote:
      "Receipt • Valid only with authorized Stamp • Fees paid are non-refundable after term commencement • All payments subject to bank clearance",
    defaultReceiptFormat: "traditional",
    showStamp: true,
    bankAccounts: [],
    feeStructure: [],
    concessions: DEFAULT_CONCESSIONS,
  });

  // Staff users state
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);

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
  const [savingConcessions, setSavingConcessions] = useState(false);

  // Load Settings and Staff
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const [settingsRes, staffRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/staff"),
        ]);

        const settingsData = await settingsRes.json();
        if (!settingsRes.ok || !settingsData.success || !settingsData.school) throw new Error(settingsData.error || "Unable to load settings. Reload this page to try again.");
        if (settingsData.success && settingsData.school) {
          setSchool({
            ...settingsData.school,
            concessions: settingsData.school.concessions || DEFAULT_CONCESSIONS,
          });
        }

        const staffData = await staffRes.json();
        if (staffData.success && staffData.users) {
          setStaffUsers(staffData.users);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadRevision]);

  const showNotification = (msg: string) => {
    setErrorMessage("");
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
        setErrorMessage(data.error);
      }
    } catch (err) {
      setErrorMessage("Unable to save settings. Please try again.");
    }
    return updated;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Logo image should be under 2MB.");
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
    setErrorMessage("");
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
        setErrorMessage("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Network error saving settings");
    } finally {
      setSaving(false);
    }
  };

  // Bank Account Handlers
  const handleOpenAddBank = () => {
    setErrorMessage("");
    setEditingBankIndex(null);
    setBankModalData({
      id: `bank_${Date.now()}`,
      bankName: "",
      accountNumber: "",
      accountName: school.name ? `${school.name} - Tuition` : "Alfurqan Academy",
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
      setErrorMessage("Please provide bank name and account number.");
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
      setErrorMessage(`Class level ${levelName} is already configured in the fee schedule.`);
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
    setErrorMessage("");
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
        setErrorMessage("Failed to save fee schedule: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Network error saving fee schedule");
    } finally {
      setSavingFees(false);
    }
  };

  const handleSaveConcessions = async () => {
    setErrorMessage("");
    setSavingConcessions(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concessions: school.concessions || DEFAULT_CONCESSIONS,
        }),
      });
      const data = await res.json();
      if (data.success && data.school) {
        setSchool(data.school);
        showNotification("Saved successfully.");
      } else {
        setErrorMessage("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Network error saving special category fees");
    } finally {
      setSavingConcessions(false);
    }
  };

  const handleRestoreSnapshot = async (entry: FeeScheduleHistoryEntry) => {
    if (
      await requestConfirmation(
        `Load historical fee rates from "${entry.term} • ${entry.session}" and save them as the current fee schedule?`
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
    setErrorMessage("");
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
      setErrorMessage("Name, email address, and password are required.");
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
        setErrorMessage("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setErrorMessage("Network error saving administrator account");
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
      setErrorMessage("Please enter a new password.");
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
        setErrorMessage(data.error || "Failed to update password");
      }
    } catch (err) {
      setErrorMessage("Network error updating password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteStaff = async (userId: string, userName: string) => {
    if (staffUsers.length <= 1) {
      setErrorMessage("Cannot delete the only remaining administrator account.");
      return;
    }
    if (!await requestConfirmation(`Are you sure you want to remove administrator access for ${userName}?`)) {
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
        setErrorMessage(data.error || "Failed to remove staff");
      }
    } catch {
      setErrorMessage("Network error removing administrator");
    }
  };


  return { loadError, reloadSettings, confirmation, errorMessage, activeTab, setActiveTab, school, setSchool, staffUsers, loading, saving, savedSuccess, statusMessage, isBankModalOpen, setIsBankModalOpen, editingBankIndex, bankModalData, setBankModalData, isStaffModalOpen, setIsStaffModalOpen, staffModalData, setStaffModalData, isResetPasswordModalOpen, setIsResetPasswordModalOpen, resetTargetUser, newPasswordInput, setNewPasswordInput, isSavingPassword, feeRevisionNote, setFeeRevisionNote, selectedHistorySnapshot, setSelectedHistorySnapshot, isSnapshotModalOpen, setIsSnapshotModalOpen, savingFees, savingConcessions, syncSchoolToDb, handleLogoUpload, handleSaveSettings, handleOpenAddBank, handleOpenEditBank, handleSaveBankModal, handleDeleteBank, handleSetDefaultBank, handleFeeChange, handleAddClassLevel, handleRemoveClassLevel, handleLoadAllSchoolClasses, handleSaveFeeSchedule, handleSaveConcessions, handleRestoreSnapshot, handleOpenAddStaff, handleSaveStaff, handleOpenResetPassword, handleSaveResetPassword, handleDeleteStaff };
}

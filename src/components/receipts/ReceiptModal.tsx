"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Student, Receipt, ReceiptItem, FeeCategory, ClassFeeConfig, ConcessionCategoryConfig } from "@/lib/types";
import { getStudentFeeObligations } from "@/lib/student-importer";
import { formatNaira } from "@/lib/utils";
import confetti from "canvas-confetti";
import { PAYMENT_PERIODS, isPaymentPeriod, type PaymentPeriod } from "@/lib/fee-ledger";
import { allocatePeriodItems, calculatePeriodFeeBalance, isTermPeriod, type TermPeriod } from "@/lib/payment-period";
import {
  X,
  Search,
  Check,
  Plus,
  Trash2,
  Receipt as ReceiptIcon,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Calendar,
  UserCheck,
  UserPlus,
} from "lucide-react";

export interface PresetFeeOption {
  name: string;
  category: FeeCategory;
  label: string;
  group: "Standard" | "Others";
  allowExternal?: boolean;
}

export const STANDARD_FEE_OPTIONS: PresetFeeOption[] = [
  // Standard Academic & School Fees
  { name: "Tuition / School Fees", category: "Tuition", label: "Tuition / School Fees", group: "Standard" },
  { name: "Notebook", category: "Books", label: "Notebook", group: "Standard" },
  { name: "Textbooks", category: "Books", label: "Textbooks", group: "Standard" },
  { name: "School Uniform", category: "Uniform", label: "School Uniform", group: "Standard" },
  { name: "Sport Wears", category: "PTA", label: "Sport Wears", group: "Standard" },
  { name: "Transport / Bus Service", category: "Transport", label: "Transport / Bus Service", group: "Standard" },
  { name: "Laboratory & Practical Fees", category: "Development", label: "Laboratory & Practical Fees", group: "Standard" },
  { name: "Excursion & Field Trip", category: "Excursion", label: "Excursion & Field Trip", group: "Standard" },
];

export const OTHER_FEE_OPTIONS: PresetFeeOption[] = [
  // Others (Miscellaneous & External Revenues)
  { name: "Badge fee", category: "Other", label: "Badge fee", group: "Others" },
  { name: "Certificate and testimonials", category: "Other", label: "Certificate and testimonials", group: "Others", allowExternal: true },
  { name: "Admission form fees", category: "Other", label: "Admission form fees", group: "Others", allowExternal: true },
  { name: "Examination fees", category: "Other", label: "Examination fees", group: "Others" },
  { name: "Sale of scrapped assets", category: "Other", label: "Sale of scrapped assets", group: "Others", allowExternal: true },
  { name: "Hall rent", category: "Other", label: "Hall rent", group: "Others", allowExternal: true },
  { name: "Jamb center fees", category: "Other", label: "Jamb center fees", group: "Others", allowExternal: true },
  { name: "Alfurqan clinic fees", category: "Other", label: "Alfurqan clinic fees", group: "Others", allowExternal: true },
  { name: "Previous Term Debt", category: "Other", label: "Debt (Previous Term)", group: "Others" },
  { name: "CUSTOM", category: "Other", label: "Custom / Other Fee (Specify below)", group: "Others", allowExternal: true },
];

export const PRESET_FEE_OPTIONS: PresetFeeOption[] = [
  ...STANDARD_FEE_OPTIONS,
  ...OTHER_FEE_OPTIONS,
];

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudent?: Student | null;
  onReceiptCreated?: (receipt: any) => void;
}

export function ReceiptModal({
  isOpen,
  onClose,
  preselectedStudent,
  onReceiptCreated,
}: ReceiptModalProps) {
  const router = useRouter();

  // Student selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    preselectedStudent || null
  );

  // Depositor / Payer state (pre-filled with student's parent by default, but customizable)
  const [depositorName, setDepositorName] = useState(preselectedStudent?.parentName || "");
  const [depositorPhone, setDepositorPhone] = useState(preselectedStudent?.parentPhone || "");

  // Walk-in / External payer state (for Hall rent, scrap, jamb, clinic, admission forms, etc.)
  const [isExternalPayer, setIsExternalPayer] = useState(false);
  const [externalPayerName, setExternalPayerName] = useState("");
  const [externalCategory, setExternalCategory] = useState("");

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<
    "Bank Transfer" | "Bank Deposit" | "POS" | "Cash"
  >("Bank Transfer");
  const [receivingBank, setReceivingBank] = useState("");
  const [receivingDate, setReceivingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bankReference, setBankReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Duplicate receipt detection state
  const [detectedDuplicate, setDetectedDuplicate] = useState<{
    id: string;
    receiptNumber: string;
    studentName: string;
    regNumber: string;
    amountPaid: number;
    date: string;
    feePurpose: string;
  } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Itemized categories breakdown (default to 0)
  const [items, setItems] = useState<ReceiptItem[]>([
    { name: "Tuition / School Fees", category: "Tuition", amount: 0 },
  ]);

  // Sync preselected student
  useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudent(preselectedStudent);
      setDepositorName(preselectedStudent.parentName || "");
      setDepositorPhone(preselectedStudent.parentPhone || "");
      // Amount input starts empty so cashier manually types amount paid
      setItems([
        { name: "Tuition / School Fees", category: "Tuition", amount: 0 },
      ]);
    }
  }, [preselectedStudent]);

  // Configured bank accounts and fee structure from settings
  const [configuredBanks, setConfiguredBanks] = useState<
    { id: string; bankName: string; accountNumber: string; isDefault?: boolean }[]
  >([]);
  const [feeStructure, setFeeStructure] = useState<ClassFeeConfig[]>([]);
  const [concessions, setConcessions] = useState<ConcessionCategoryConfig | undefined>(undefined);
  const [activeTerm, setActiveTerm] = useState<TermPeriod>("1st Term");
  const [activeSession, setActiveSession] = useState("");
  const [paymentPeriod, setPaymentPeriod] = useState<PaymentPeriod>("1st Term");
  const [paidLedger, setPaidLedger] = useState<{
    studentId: string;
    session: string;
    receipts: Receipt[];
  } | null>(null);

  // Reset receiving date to today and load bank accounts whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setReceivingDate(new Date().toISOString().split("T")[0]);
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            if (d.school?.feeStructure && Array.isArray(d.school.feeStructure)) {
              setFeeStructure(d.school.feeStructure);
            }
            setConcessions(d.school?.concessions);
            setActiveTerm(isTermPeriod(d.school?.currentTerm) ? d.school.currentTerm : "1st Term");
            setPaymentPeriod(isPaymentPeriod(d.school?.currentTerm) ? d.school.currentTerm : "1st Term");
            setActiveSession((d.school?.currentSession || "").replace(/\bAcademic\s*/gi, "").trim());
            if (d.school?.bankAccounts && d.school.bankAccounts.length > 0) {
              setConfiguredBanks(d.school.bankAccounts);
              const def = d.school.bankAccounts.find((b: any) => b.isDefault) || d.school.bankAccounts[0];
              if (def && paymentMethod !== "Cash") {
                setReceivingBank(def.bankName);
              }
            } else {
              setConfiguredBanks([]);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    const studentId = selectedStudent?.id;
    if (!studentId) return;

    fetch(`/api/receipts?studentId=${encodeURIComponent(studentId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        const receipts = (data.receipts || []).filter((receipt: Receipt) => receipt.session === activeSession);
        setPaidLedger({ studentId, session: activeSession, receipts });
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [selectedStudent?.id, activeSession, isOpen]);

  // Live search for students
  useEffect(() => {
    if (!searchQuery.trim() || selectedStudent) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/students?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.students);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStudent]);

  if (!isOpen) return null;

  // Calculate total amount from items
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const isLedgerReady = !selectedStudent || (
    paidLedger?.studentId === selectedStudent.id &&
    paidLedger.session === activeSession
  );
  const priorReceipts = isLedgerReady && selectedStudent ? paidLedger?.receipts || [] : [];

  // Preview the same category-specific allocation the server will persist.
  const obligations = selectedStudent
    ? getStudentFeeObligations(
        selectedStudent.fullName,
        selectedStudent.class,
        feeStructure,
        concessions,
        selectedStudent.totalTermBill
      )
    : { Tuition: 0, Books: 0, Uniform: 0, PTA: 0 };
  const currentLedger = calculatePeriodFeeBalance(obligations, priorReceipts, paymentPeriod, activeTerm);
  const projectedItems = allocatePeriodItems(items, paymentPeriod, activeTerm, obligations, priorReceipts);
  const projectedLedger = calculatePeriodFeeBalance(obligations, [
    ...priorReceipts, { term: paymentPeriod, amountPaid: totalAmount, items: projectedItems },
  ], paymentPeriod, activeTerm);
  const studentTotalBill = currentLedger.totalBill;
  const currentAllocatedTotal = currentLedger.totalPaid;
  const currentBalance = currentLedger.balanceRemaining;
  const projectedBalance = projectedLedger.balanceRemaining;
  const willBeFull = studentTotalBill > 0 && projectedBalance === 0;

  const handleAddItem = (category: FeeCategory, defaultName: string, defaultAmount: number) => {
    setItems((prev) => [
      ...prev,
      { name: defaultName, category, amount: defaultAmount },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemAmount = (index: number, newAmount: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, amount: newAmount } : item))
    );
  };

  const handleSubmit = async (e?: React.FormEvent, allowDuplicateOverride = false) => {
    if (e) e.preventDefault();

    const isAnyExternalFee = items.some((it) => {
      const match = PRESET_FEE_OPTIONS.find((p) => p.name === it.name);
      return match?.allowExternal;
    });

    const effectivelyExternal = isExternalPayer || (!selectedStudent && isAnyExternalFee);

    if (!selectedStudent && !effectivelyExternal) {
      setErrorMessage("Please select a student or enter an external payer name.");
      return;
    }

    const payerName = effectivelyExternal
      ? (externalPayerName.trim() || depositorName.trim() || searchQuery.trim())
      : selectedStudent?.fullName || "";

    if (!payerName) {
      setErrorMessage("Please enter the customer / payer's full name.");
      return;
    }

    if (totalAmount <= 0) {
      setErrorMessage("Total payment amount must be greater than zero.");
      return;
    }

    // Duplicate detection check
    if (!allowDuplicateOverride) {
      setIsCheckingDuplicate(true);
      try {
        const checkRes = await fetch("/api/receipts/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName: payerName,
            regNumber: selectedStudent ? selectedStudent.regNumber : "N/A",
            amountPaid: totalAmount,
            date: receivingDate,
            term: selectedStudent ? paymentPeriod : activeTerm,
            session: activeSession,
            items,
          }),
        });
        const checkData = await checkRes.json();
        if (checkData.success && checkData.isDuplicate && checkData.duplicate) {
          setDetectedDuplicate(checkData.duplicate);
          setIsCheckingDuplicate(false);
          return;
        }
      } catch (err) {
        console.warn("Duplicate check error:", err);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent?.id || null,
          studentName: payerName,
          studentClass: selectedStudent ? selectedStudent.class : (externalCategory.trim() || "General"),
          regNumber: selectedStudent ? selectedStudent.regNumber : "N/A",
          amountPaid: totalAmount,
          term: selectedStudent ? paymentPeriod : activeTerm,
          paymentMethod,
          bankName: receivingBank,
          date: receivingDate,
          bankReference,
          depositorName: depositorName.trim() || payerName,
          depositorPhone: depositorPhone.trim() || (selectedStudent ? selectedStudent.parentPhone : ""),
          items,
          notes,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create receipt");
      }

      // Celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#075E54", "#128C7E", "#FFB21D", "#25D366"],
        });
      } catch (err) {
        // Confetti optional
      }

      if (onReceiptCreated) {
        onReceiptCreated(data.receipt);
      }

      onClose();
      router.push(`/receipts/${data.receipt.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while issuing receipt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#075E54] text-white px-5 sm:px-7 py-4.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white p-1 flex items-center justify-center border border-white/30 overflow-hidden shadow-xs shrink-0">
              <img src="/logo.png" alt="Alfurqan Crest" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-sm sm:text-base leading-tight">
                <span>Issue Receipt</span>
                <Sparkles className="h-4 w-4 text-[#FFB21D]" />
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                Alfurqan International Academy • Accounts Desk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Select Student or External Payer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                1. {isExternalPayer ? "External Payer Details" : "Student Selection"}
              </label>

              {/* Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsExternalPayer(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    !isExternalPayer
                      ? "bg-[#075E54] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExternalPayer(true);
                    setSelectedStudent(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    isExternalPayer
                      ? "bg-[#075E54] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  External Payer
                </button>
              </div>
            </div>

            {isExternalPayer ? (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-amber-700" />
                    <span>External payment (no student account required)</span>
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                    Customer / Payer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={externalPayerName}
                    onChange={(e) => {
                      setExternalPayerName(e.target.value);
                      if (!depositorName) setDepositorName(e.target.value);
                    }}
                    placeholder="Type name (e.g. Alhaji Musa, Bello Sani, JAMB Candidate, Clinic Patient)"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      Payer Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={depositorPhone}
                      onChange={(e) => setDepositorPhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      Category / Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={externalCategory}
                      onChange={(e) => setExternalCategory(e.target.value)}
                      placeholder="e.g. Hall Rent, Scrap Buyer, Applicant"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                    />
                  </div>
                </div>
              </div>
            ) : selectedStudent ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#128C7E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedStudent.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm sm:text-base">
                      {selectedStudent.fullName}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 mt-0.5">
                      <span className="font-mono font-bold text-slate-700">
                        {selectedStudent.regNumber}
                      </span>
                      <span>•</span>
                      <strong className="text-slate-800">{selectedStudent.class}</strong>
                      <span>•</span>
                      <span>Parent: {selectedStudent.parentPhone}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 underline shrink-0 cursor-pointer"
                >
                  Change Student
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (searchResults.length > 0) {
                          const std = searchResults[0];
                          setSelectedStudent(std);
                          setDepositorName(std.parentName || "");
                          setDepositorPhone(std.parentPhone || "");
                          setSearchQuery("");
                          setSearchResults([]);
                          setItems([
                            { name: "Tuition / School Fees", category: "Tuition", amount: 0 },
                          ]);
                        } else if (searchQuery.trim()) {
                          setIsExternalPayer(true);
                          setExternalPayerName(searchQuery.trim());
                          if (!depositorName) setDepositorName(searchQuery.trim());
                          setSearchQuery("");
                        }
                      }
                    }}
                    placeholder="Search by student registration number (e.g. P453, N1636, JS201) or name..."
                    className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] placeholder:text-slate-400 shadow-inner bg-slate-50/50"
                  />
                </div>

                {isSearching && (
                  <div className="py-2.5 px-3 flex items-center justify-center">
                    <div className="h-4 w-4 border-2 border-[#075E54] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                  <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-xs text-amber-900 font-medium">
                      Student not registered in database?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExternalPayer(true);
                        setExternalPayerName(searchQuery.trim());
                        if (!depositorName) setDepositorName(searchQuery.trim());
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="px-2.5 py-1 text-xs font-black bg-[#075E54] hover:bg-[#128C7E] text-white rounded-lg cursor-pointer"
                    >
                      Use as External Payer
                    </button>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl divide-y divide-slate-100">
                    {searchResults.map((std) => (
                      <div
                        key={std.id}
                        onClick={() => {
                          setSelectedStudent(std);
                          setDepositorName(std.parentName || "");
                          setDepositorPhone(std.parentPhone || "");
                          setSearchQuery("");
                          setItems([
                            { name: "Tuition / School Fees", category: "Tuition", amount: 0 },
                          ]);
                        }}
                        className="p-3.5 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900">{std.fullName}</div>
                          <div className="text-xs text-slate-500">
                            <span className="font-mono font-bold text-emerald-800">
                              {std.regNumber}
                            </span>{" "}
                            • {std.class}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-500 block">
                            Bal: {formatNaira(std.balanceRemaining)}
                          </span>
                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                              std.status === "FULL"
                                ? "bg-emerald-100 text-emerald-800"
                                : std.status === "PARTIAL"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {std.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {!isExternalPayer && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div>
                <label htmlFor="receipt-payment-period" className="text-xs font-bold text-slate-800">Payment period</label>
                <p className="text-[11px] text-slate-500">{activeSession}</p>
              </div>
              <select
                id="receipt-payment-period"
                value={paymentPeriod}
                disabled={!activeSession || isSubmitting || isCheckingDuplicate}
                onChange={(event) => {
                  if (isPaymentPeriod(event.target.value)) {
                    setPaymentPeriod(event.target.value);
                    setDetectedDuplicate(null);
                  }
                }}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
              >
                {PAYMENT_PERIODS.map((period) => <option key={period} value={period}>{period}</option>)}
              </select>
            </div>
          )}

          {!isExternalPayer && paymentPeriod === "Whole Session" && (
            <p className="text-[11px] text-slate-500 -mt-2">Covers tuition for all three terms. Other fee items are recorded separately for {activeTerm.toLowerCase()}.</p>
          )}

          {/* Student Debt & Invoice Overview Card */}
          {selectedStudent && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="text-slate-500">{paymentPeriod === "Whole Session" ? "Session Bill:" : "Term Bill:"}</span>
                <strong className="text-slate-900 font-mono ml-1.5 font-bold">
                  {formatNaira(studentTotalBill)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Paid So Far:</span>
                <strong className="text-slate-900 font-mono ml-1.5 font-bold">
                  {formatNaira(currentAllocatedTotal)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Current Debt:</span>
                <strong className="text-amber-800 font-mono font-black ml-1.5">
                  {formatNaira(currentBalance)}
                </strong>
              </div>
            </div>
          )}

          {/* STEP 2: Itemized Fee Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                2. Fee Items Breakdown
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddItem("Tuition", "Tuition / School Fees", 0)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Tuition
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("Books", "Notebook", 0)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Notebook
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("Books", "Textbooks", 0)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Textbooks
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("Uniform", "School Uniform", 0)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Uniform
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("PTA", "Sport Wears", 0)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Sport Wears
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddItem("Other", "CUSTOM", 0);
                    if (!selectedStudent) setIsExternalPayer(true);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                >
                  + Other Fee
                </button>
              </div>
            </div>

            <div className="space-y-2.5 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
              {items.map((item, idx) => {
                const isStandard = STANDARD_FEE_OPTIONS.some((p) => p.name === item.name);
                const isOtherPreset = OTHER_FEE_OPTIONS.some((p) => p.name === item.name && p.name !== "CUSTOM");
                const isCustom = !isStandard && !isOtherPreset;
                const isOther = isOtherPreset || isCustom;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-end gap-2.5">
                      {/* Dropdown 1: Standard Fees */}
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Standard Fees
                        </label>
                        <select
                          value={isStandard ? item.name : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const found = STANDARD_FEE_OPTIONS.find((p) => p.name === val);
                            if (found) {
                              setItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? { ...it, name: found.name, category: found.category }
                                    : it
                                )
                              );
                            }
                          }}
                          className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            isStandard
                              ? "border-[#075E54] bg-emerald-50/50 text-slate-900 ring-2 ring-[#075E54]/20"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <option value="">-- Select Standard Fee --</option>
                          {STANDARD_FEE_OPTIONS.map((opt) => (
                            <option key={opt.name} value={opt.name}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dropdown 2: Others */}
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">
                          Others
                        </label>
                        <select
                          value={isOther ? (isCustom ? "CUSTOM" : item.name) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            if (val === "CUSTOM") {
                              setItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        name: PRESET_FEE_OPTIONS.some((p) => p.name === it.name) ? "" : it.name,
                                        category: "Other",
                                      }
                                    : it
                                )
                              );
                              if (!selectedStudent) {
                                setIsExternalPayer(true);
                                if (searchQuery.trim() && !externalPayerName) {
                                  setExternalPayerName(searchQuery.trim());
                                  if (!depositorName) setDepositorName(searchQuery.trim());
                                  setSearchQuery("");
                                }
                              }
                            } else {
                              const found = OTHER_FEE_OPTIONS.find((p) => p.name === val);
                              if (found) {
                                setItems((prev) =>
                                  prev.map((it, i) =>
                                    i === idx
                                      ? { ...it, name: found.name, category: found.category }
                                      : it
                                  )
                                );
                                if (found.allowExternal && !selectedStudent) {
                                  setIsExternalPayer(true);
                                  if (searchQuery.trim() && !externalPayerName) {
                                    setExternalPayerName(searchQuery.trim());
                                    if (!depositorName) setDepositorName(searchQuery.trim());
                                    setSearchQuery("");
                                  }
                                }
                              }
                            }
                          }}
                          className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            isOther
                              ? "border-amber-600 bg-amber-50/50 text-slate-900 ring-2 ring-amber-600/20"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <option value="">-- Others (Select Fee) --</option>
                          {OTHER_FEE_OPTIONS.map((opt) => (
                            <option key={opt.name} value={opt.name}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Fee Amount & Trash Button */}
                      <div className="flex items-end gap-2 shrink-0">
                        <div className="w-32 sm:w-36">
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Amount
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-xs sm:text-sm text-slate-400 font-mono font-bold">
                              ₦
                            </span>
                            <input
                              type="number"
                              value={item.amount || ""}
                              onChange={(e) => handleUpdateItemAmount(idx, Number(e.target.value))}
                              placeholder="0.00"
                              className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                            />
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className="h-11 px-2.5 text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer transition-colors flex items-center justify-center shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Custom description field if 'Custom / Other Fee' is selected or non-preset name */}
                    {isCustom && (
                      <div className="pt-0.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const customName = e.target.value;
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, name: customName, category: "Other" } : it
                              )
                            );
                          }}
                          placeholder="Type custom fee title (e.g. Graduation Gown, ID Card Replacement)..."
                          className="w-full h-10 px-3.5 rounded-lg border border-emerald-300 bg-emerald-50/20 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#075E54]"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add item button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) => [
                      ...prev,
                      {
                        name: isExternalPayer ? "Hall rent" : "Tuition / School Fees",
                        category: isExternalPayer ? "Other" : "Tuition",
                        amount: 0,
                      },
                    ])
                  }
                  className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-[#075E54] hover:bg-emerald-50/40 text-slate-600 hover:text-[#075E54] rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Another Fee Item</span>
                </button>
              </div>

              <div className="flex justify-between items-center pt-2 px-1 text-sm">
                <span className="font-bold text-slate-600">Total Receipt Amount:</span>
                <span className="font-mono text-lg font-black text-[#075E54]">
                  {formatNaira(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: Payment Channel, Receiving Bank & Receiving Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                3. Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => {
                  const val = e.target.value;
                  setPaymentMethod(val);
                  if (val === "Cash") {
                    setReceivingBank("Cash");
                  } else if (receivingBank === "Cash") {
                    setReceivingBank(configuredBanks[0]?.bankName || "");
                  }
                }}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
              >
                <option value="Bank Transfer">Direct Bank Transfer</option>
                <option value="Bank Deposit">Bank Teller Deposit</option>
                <option value="POS">School POS Machine</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Receiving Bank / Account
              </label>
              <select
                value={receivingBank}
                onChange={(e) => setReceivingBank(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
              >
                {configuredBanks.length > 0 ? (
                  <>
                    {configuredBanks.map((b) => (
                      <option key={b.id} value={b.bankName}>
                        {b.bankName} ({b.accountNumber}){b.isDefault ? " • Default" : ""}
                      </option>
                    ))}
                    <option value="Cash">Cash</option>
                  </>
                ) : (
                  <>
                    <option value="">No bank configured in settings</option>
                    <option value="Cash">Cash</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Payment Date (Paid to Bank)
              </label>
              <input
                type="date"
                value={receivingDate}
                onChange={(e) => setReceivingDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer"
              />
            </div>
          </div>

          {/* STEP 4: Depositor / Payer Particulars */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                4. Depositor / Payer Particulars
              </label>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Optional
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Name of Depositor / Payer <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder="e.g. Musa Garba (Optional — defaults to parent name if blank)"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Optional: leave blank to use the parent name.
              </span>
            </div>
          </div>

          {/* Live Dynamic Status Forecast Stamp */}
          {selectedStudent && (
            <div className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  className={`h-5 w-5 ${willBeFull ? "text-emerald-600" : "text-amber-600"}`}
                />
                <div>
                  <div className="text-sm font-black">
                    {!isLedgerReady ? (
                      <span className="text-slate-600">CHECKING PAYMENT HISTORY…</span>
                    ) : willBeFull ? (
                      <span className="text-emerald-900 uppercase">
                        RECEIPT BADGE: 🟢 FULL PAYMENT (CLEARED)
                      </span>
                    ) : (
                      <span className="text-amber-900 uppercase">
                        RECEIPT BADGE: 🟡 PARTIAL PAYMENT
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {!isLedgerReady ? "Please wait for the payment history for this period." : willBeFull
                      ? `The selected ${paymentPeriod.toLowerCase()} payment will be cleared.`
                      : `Outstanding balance remaining will be ${formatNaira(
                          projectedBalance
                        )}.`}
                  </div>
                  {isLedgerReady && obligations.Tuition > 0 && (
                    <div className="text-xs font-semibold text-amber-900 mt-1">
                      School fees paid now: {formatNaira(items.filter((item) => item.category === "Tuition").reduce((sum, item) => sum + item.amount, 0))}
                      {" • "}School fees remaining: {formatNaira(projectedLedger.balances.Tuition)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isCheckingDuplicate ||
                (!selectedStudent && !isExternalPayer && !externalPayerName.trim() && !depositorName.trim()) ||
                totalAmount <= 0
              }
              className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-40 text-white text-sm sm:text-base font-black px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {isCheckingDuplicate ? (
                <span>Checking...</span>
              ) : isSubmitting ? (
                <span>Generating Receipt...</span>
              ) : (
                <>
                  <span>Issue Receipt</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Receipt Warning Alert Dialog */}
      {detectedDuplicate && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Duplicate Receipt Detected</h3>
                <p className="text-xs text-amber-100 font-medium">An identical receipt already exists in the system</p>
              </div>
            </div>

            {/* Content: Focus ONLY on Student Name & Reg No, Amount & Fee Purpose, and Date */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                The system has detected an already issued receipt (<span className="font-bold text-slate-900 font-mono">#{detectedDuplicate.receiptNumber}</span>) with the same details:
              </p>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 divide-y divide-amber-200/60 text-sm">
                {/* 1. Student Name & Reg No */}
                <div className="pb-3 flex items-start justify-between gap-3">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Student Name & Reg No
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{detectedDuplicate.studentName}</span>
                    <span className="text-xs font-mono font-semibold text-slate-600 block">
                      {detectedDuplicate.regNumber && detectedDuplicate.regNumber !== "N/A"
                        ? detectedDuplicate.regNumber
                        : "External / Not Registered"}
                    </span>
                  </div>
                </div>

                {/* 2. Amount & Fee Purpose */}
                <div className="py-3 flex items-start justify-between gap-3">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Amount & Fee Purpose
                  </span>
                  <div className="text-right">
                    <span className="font-black text-[#075E54] text-base block">
                      {formatNaira(detectedDuplicate.amountPaid)}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 block">
                      {detectedDuplicate.feePurpose}
                    </span>
                  </div>
                </div>

                {/* 3. Date */}
                <div className="pt-3 flex items-start justify-between gap-3">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Date
                  </span>
                  <span className="font-bold text-slate-900">
                    {detectedDuplicate.date}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Do you want to cancel, or continue and issue this duplicate receipt anyway?
              </p>
            </div>

            {/* Actions: Cancel or Continue Anyway */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetectedDuplicate(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetectedDuplicate(null);
                  handleSubmit(undefined, true);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-black text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

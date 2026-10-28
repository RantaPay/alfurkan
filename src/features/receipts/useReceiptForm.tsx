"use client";
import { useStudentSearch } from "@/features/students/useStudentSearch";

import { isPaymentPeriod, type PaymentPeriod } from "@/lib/fee-ledger";
import { allocatePeriodItems, calculatePeriodFeeBalance, isTermPeriod, type TermPeriod } from "@/lib/payment-period";
import { getStudentFeeObligations } from "@/lib/student-importer";
import { ClassFeeConfig, ConcessionCategoryConfig, FeeCategory, Receipt, ReceiptItem, Student } from "@/lib/types";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PRESET_FEE_OPTIONS } from "./fee-options";

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudent?: Student | null;
  onReceiptCreated?: (receipt: Receipt) => void;
}

export function useReceiptForm({
  isOpen,
  onClose,
  preselectedStudent,
  onReceiptCreated,
}: ReceiptModalProps) {
  const router = useRouter();

  // Student selection state
  const [searchQuery, setSearchQuery] = useState("");
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
    let cancelled = false;
    if (isOpen) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
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
              if (def) {
                setReceivingBank(current => current || def.bankName);
              }
            } else {
              setConfiguredBanks([]);
            }
          }
        })
        .catch(() => { });
    }
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    const studentId = selectedStudent?.id;
    if (!isOpen || !studentId) return;

    fetch(`/api/receipts?studentId=${encodeURIComponent(studentId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        const receipts = (data.receipts || []).filter((receipt: Receipt) => receipt.session === activeSession);
        setPaidLedger({ studentId, session: activeSession, receipts });
      })
      .catch(() => { });

    return () => { cancelled = true; };
  }, [selectedStudent?.id, activeSession, isOpen]);

  const { results: searchResults, loading: isSearching, error: searchError } = useStudentSearch(searchQuery, isOpen && !selectedStudent && !isExternalPayer);

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
    if (isSubmitting || isCheckingDuplicate) return;

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
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#075E54", "#128C7E", "#FFB21D", "#25D366"],
        });
      } catch {
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


  return { searchQuery, setSearchQuery, searchResults, searchError, isSearching, selectedStudent, setSelectedStudent, depositorName, setDepositorName, depositorPhone, setDepositorPhone, isExternalPayer, setIsExternalPayer, externalPayerName, setExternalPayerName, externalCategory, setExternalCategory, paymentMethod, setPaymentMethod, receivingBank, setReceivingBank, receivingDate, setReceivingDate, bankReference, setBankReference, notes, setNotes, isSubmitting, errorMessage, detectedDuplicate, setDetectedDuplicate, isCheckingDuplicate, items, setItems, configuredBanks, activeTerm, activeSession, paymentPeriod, setPaymentPeriod, totalAmount, isLedgerReady, obligations, projectedLedger, studentTotalBill, currentAllocatedTotal, currentBalance, projectedBalance, willBeFull, handleAddItem, handleRemoveItem, handleUpdateItemAmount, handleSubmit, isOpen, onClose };
}

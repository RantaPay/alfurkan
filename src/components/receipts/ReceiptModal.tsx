"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Student, ReceiptItem, FeeCategory } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  X,
  Search,
  Check,
  Plus,
  Trash2,
  Receipt as ReceiptIcon,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

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

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<
    "Bank Transfer" | "Bank Deposit" | "POS" | "Cash"
  >("Bank Transfer");
  const [bankReference, setBankReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Itemized categories breakdown
  const [items, setItems] = useState<ReceiptItem[]>([
    { name: "Tuition / School Fees", category: "Tuition", amount: 100000 },
    { name: "Textbooks Pack", category: "Books", amount: 25000 },
  ]);

  // Sync preselected student
  useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudent(preselectedStudent);
      // Auto-populate initial suggested tuition amount based on student's remaining balance
      const remaining = preselectedStudent.balanceRemaining > 0 ? preselectedStudent.balanceRemaining : preselectedStudent.totalTermBill;
      setItems([
        { name: "School Fees / Tuition", category: "Tuition", amount: remaining },
      ]);
    }
  }, [preselectedStudent]);

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

  // Calculate what the new balance will be
  const currentTotalPaid = selectedStudent?.totalPaid || 0;
  const newCumulativeTotal = currentTotalPaid + totalAmount;
  const projectedBalance = selectedStudent
    ? Math.max(0, selectedStudent.totalTermBill - newCumulativeTotal)
    : 0;
  const willBeFull = projectedBalance === 0;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setErrorMessage("Please select a student first.");
      return;
    }
    if (totalAmount <= 0) {
      setErrorMessage("Total payment amount must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          amountPaid: totalAmount,
          paymentMethod,
          bankReference,
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
              <img src="/logo.png" alt="Al-Furqan Crest" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-sm sm:text-base leading-tight">
                <span>Issue Official School Receipt</span>
                <Sparkles className="h-4 w-4 text-[#FFB21D]" />
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                Al-Furqan International Academy • Verified Bursary Clearance
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

          {/* STEP 1: Select Student */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              1. Student Selection
            </label>

            {selectedStudent ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#128C7E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedStudent.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm sm:text-base">
                      {selectedStudent.fullName}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
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
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 underline shrink-0 cursor-pointer"
                >
                  Change Student
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
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
                          setSearchQuery("");
                          setSearchResults([]);
                          const rem = std.balanceRemaining > 0 ? std.balanceRemaining : std.totalTermBill;
                          setItems([
                            { name: "School Fees / Tuition", category: "Tuition", amount: rem },
                          ]);
                        }
                      }
                    }}
                    placeholder="Search by student registration number (e.g. AFIC/2026/0101) or name..."
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] placeholder:text-slate-400 shadow-inner bg-slate-50/50"
                  />
                </div>

                {isSearching && (
                  <div className="text-xs text-slate-400 font-medium py-2 px-3">
                    Searching student database...
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl divide-y divide-slate-100">
                    {searchResults.map((std) => (
                      <div
                        key={std.id}
                        onClick={() => {
                          setSelectedStudent(std);
                          setSearchQuery("");
                          setSearchResults([]);
                          const rem = std.balanceRemaining > 0 ? std.balanceRemaining : std.totalTermBill;
                          setItems([
                            { name: "School Fees / Tuition", category: "Tuition", amount: rem },
                          ]);
                        }}
                        className="p-3 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{std.fullName}</div>
                          <div className="text-[11px] text-slate-500">
                            <span className="font-mono font-bold text-emerald-800">
                              {std.regNumber}
                            </span>{" "}
                            • {std.class}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-slate-500 block">
                            Bal: {formatNaira(std.balanceRemaining)}
                          </span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
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

          {/* Student Debt & Invoice Overview Card */}
          {selectedStudent && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Total Term Bill:</span>
                <strong className="text-slate-900 font-mono ml-1.5">
                  {formatNaira(selectedStudent.totalTermBill)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Paid So Far:</span>
                <strong className="text-slate-900 font-mono ml-1.5">
                  {formatNaira(selectedStudent.totalPaid)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Current Debt:</span>
                <strong className="text-amber-800 font-mono font-black ml-1.5">
                  {formatNaira(selectedStudent.balanceRemaining)}
                </strong>
              </div>
            </div>
          )}

          {/* STEP 2: Itemized Fee Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                2. Fee Items Breakdown
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddItem("Tuition", "Tuition Part Payment", 50000)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Tuition
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("Books", "Books & Exercise Pack", 25000)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Books
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("Uniform", "College Uniform (2 Sets)", 15000)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Uniform
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("PTA", "PTA Termly Levy", 5000)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + PTA
                </button>
              </div>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setItems((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, name: newName } : it))
                      );
                    }}
                    placeholder="Fee item title"
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#075E54]"
                  />

                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-mono">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={item.amount || ""}
                      onChange={(e) => handleUpdateItemAmount(idx, Number(e.target.value))}
                      placeholder="Amount"
                      className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#075E54]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 px-1 text-xs">
                <span className="font-bold text-slate-600">Total Receipt Amount:</span>
                <span className="font-mono text-base font-black text-[#075E54]">
                  {formatNaira(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: Payment Channel & Bank Verification Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                3. Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              >
                <option value="Bank Transfer">Direct Bank Transfer</option>
                <option value="Bank Deposit">Bank Teller Deposit</option>
                <option value="POS">School POS Machine</option>
                <option value="Cash">Cash at Bursary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Bank Narration / Reference
              </label>
              <input
                type="text"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                placeholder="e.g. TRF/NIP/20260927/83921"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
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
                  <div className="text-xs font-black">
                    {willBeFull ? (
                      <span className="text-emerald-900 uppercase">
                        RECEIPT BADGE: 🟢 FULL PAYMENT (CLEARED)
                      </span>
                    ) : (
                      <span className="text-amber-900 uppercase">
                        RECEIPT BADGE: 🟡 PARTIAL PAYMENT
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {willBeFull
                      ? "Outstanding balance will become ₦0.00. Student is granted full clearance."
                      : `Outstanding balance remaining will be ${formatNaira(
                          projectedBalance
                        )}.`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedStudent || totalAmount <= 0}
              className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-40 text-white text-xs sm:text-sm font-black px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Generating Receipt...</span>
              ) : (
                <>
                  <span>Issue & View Official Receipt</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

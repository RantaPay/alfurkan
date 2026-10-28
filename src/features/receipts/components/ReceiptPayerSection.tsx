"use client";
import { useReceiptForm } from "@/features/receipts/useReceiptForm";
import { PAYMENT_PERIODS, isPaymentPeriod } from "@/lib/fee-ledger";
import { formatNaira } from "@/lib/utils";
import {
  Search,
  UserCheck
} from "lucide-react";
type Props = { form: Pick<ReturnType<typeof useReceiptForm>, "searchError" | "searchQuery" | "setSearchQuery" | "searchResults" | "isSearching" | "selectedStudent" | "setSelectedStudent" | "depositorName" | "setDepositorName" | "depositorPhone" | "setDepositorPhone" | "isExternalPayer" | "setIsExternalPayer" | "externalPayerName" | "setExternalPayerName" | "externalCategory" | "setExternalCategory" | "isSubmitting" | "setDetectedDuplicate" | "isCheckingDuplicate" | "setItems" | "activeTerm" | "activeSession" | "paymentPeriod" | "setPaymentPeriod"> };
export function ReceiptPayerSection({ form }: Props) {
  const { searchError, searchQuery, setSearchQuery, searchResults, isSearching, selectedStudent, setSelectedStudent, depositorName, setDepositorName, depositorPhone, setDepositorPhone, isExternalPayer, setIsExternalPayer, externalPayerName, setExternalPayerName, externalCategory, setExternalCategory, isSubmitting, setDetectedDuplicate, isCheckingDuplicate, setItems, activeTerm, activeSession, paymentPeriod, setPaymentPeriod } = form;
  return (<>
    {/* STEP 1: Select Student or External Payer */}
    {searchError && <p role="alert" className="text-sm text-rose-700">{searchError}</p>}
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs sm:text-sm font-semibold  tracking-normal text-slate-800">
          1. {isExternalPayer ? "External Payer Details" : "Student Selection"}
        </label>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setIsExternalPayer(false);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!isExternalPayer
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
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isExternalPayer
                ? "bg-[#075E54] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            External Payer
          </button>
        </div>
      </div>

      {isExternalPayer ? (
        <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-amber-700" />
              <span>External payment (no student account required)</span>
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1">
              Payer name *
            </label>
            <input aria-label="Payer name *"
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
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1">
                Payer Phone (Optional)
              </label>
              <input aria-label="Payer Phone (Optional)"
                type="text"
                value={depositorPhone}
                onChange={(e) => setDepositorPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold  tracking-normal text-slate-800 mb-1">
                Category / Description (Optional)
              </label>
              <input aria-label="Category / Description (Optional)"
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
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-lg bg-[#075E54] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {selectedStudent.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm sm:text-base">
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
              aria-label="Search students" placeholder="Student name or admission number"
              className="w-full h-12 pl-11 pr-4 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] placeholder:text-slate-400 shadow-inner bg-slate-50/50"
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
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-[#075E54] hover:bg-[#128C7E] text-white rounded-lg cursor-pointer"
              >
                Use as External Payer
              </button>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100">
              {searchResults.map((std) => (
                <button type="button"
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
                  className="w-full text-left p-3.5 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition-colors"
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
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${std.status === "FULL"
                          ? "bg-emerald-100 text-emerald-800"
                          : std.status === "PARTIAL"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                    >
                      {std.status}
                    </span>
                  </div>
                </button>
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


  </>);
}

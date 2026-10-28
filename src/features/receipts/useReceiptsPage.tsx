"use client";
import { useApiResource } from "@/features/shared/useApiResource";

import { Receipt } from "@/lib/types";
import { useState } from "react";



export function useReceiptsPage() {
  const { data, loading, error, reload } = useApiResource<{ receipts: Receipt[] }>("/api/receipts");
  const receipts = data?.receipts || [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FULL" | "PARTIAL" | "VOIDED">("ALL");
  const [bankFilter, setBankFilter] = useState("ALL");
  const uniqueBanks = Array.from(
    new Set(receipts.map((r) => r.bankName?.trim()).filter(Boolean))
  ) as string[];

  const filtered = receipts.filter((r) => {
    let matchesStatus = true;
    if (statusFilter === "FULL") matchesStatus = !r.isVoided && r.paymentStatus === "FULL";
    else if (statusFilter === "PARTIAL") matchesStatus = !r.isVoided && (r.paymentStatus === "PARTIAL" && r.balanceRemaining > 0);
    else if (statusFilter === "VOIDED") matchesStatus = !!r.isVoided;

    let matchesBank = true;
    if (bankFilter !== "ALL") {
      const bLower = bankFilter.toLowerCase();
      matchesBank =
        (!!r.bankName && r.bankName.toLowerCase().includes(bLower)) ||
        (bLower === "cash" && r.paymentMethod.toLowerCase().includes("cash"));
    }

    const q = query.toLowerCase().trim();
    const matchesQuery =
      !q ||
      r.receiptNumber.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.regNumber.toLowerCase().includes(q) ||
      (r.bankReference && r.bankReference.toLowerCase().includes(q)) ||
      (r.bankName && r.bankName.toLowerCase().includes(q));

    return matchesStatus && matchesBank && matchesQuery;
  });


  return { error, reload, query, setQuery, statusFilter, setStatusFilter, bankFilter, setBankFilter, loading, uniqueBanks, filtered };
}

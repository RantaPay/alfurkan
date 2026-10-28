"use client";
import { useApiResource } from "@/features/shared/useApiResource";
import { usePrivacy } from "@/features/shared/usePrivacy";
import type { ReportSummary } from "@/lib/types";

import { Receipt, Student } from "@/lib/types";
import { useEffect, useState } from "react";



export function useDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);
  const receiptsResource = useApiResource<{ receipts: Receipt[] }>("/api/receipts?limit=15");
  const reportResource = useApiResource<{ summary: ReportSummary }>("/api/reports");
  const receipts = receiptsResource.data?.receipts || [];
  const stats = reportResource.data?.summary;
  const loading = receiptsResource.loading || reportResource.loading;
  const error = receiptsResource.error || reportResource.error;
  const loadData = () => { receiptsResource.reload(); reportResource.reload(); };
  const [receiptFilter, setReceiptFilter] = useState<"ALL" | "FULL" | "PARTIAL">("ALL");
  const { hideSensitive, toggleSensitive } = usePrivacy();

  const handleOpenIssueModal = (student?: Student) => {
    if (student) {
      setSelectedStudentForReceipt(student);
    } else {
      setSelectedStudentForReceipt(null);
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("action") !== "issue") return;
    const frame = requestAnimationFrame(() => {
      setSelectedStudentForReceipt(null);
      setIsModalOpen(true);
      url.searchParams.delete("action");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const filteredReceipts = receipts.filter((r) => {
    if (receiptFilter === "ALL") return true;
    return r.paymentStatus === receiptFilter;
  });


  return { error, isModalOpen, setIsModalOpen, isAddStudentOpen, setIsAddStudentOpen, isImportModalOpen, setIsImportModalOpen, selectedStudentForReceipt, stats, loading, receiptFilter, setReceiptFilter, hideSensitive, toggleSensitive, loadData, handleOpenIssueModal, filteredReceipts };
}

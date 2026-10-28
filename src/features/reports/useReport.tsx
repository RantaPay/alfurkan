"use client";
import { useApiResource } from "@/features/shared/useApiResource";
import { usePrivacy } from "@/features/shared/usePrivacy";
import { exportReportCSV, exportReportPDF } from "./export-report";

import { ReportSummary, SchoolProfile, Student } from "@/lib/types";
import { useState } from "react";



export function useReport() {
  const [term, setTerm] = useState("1st Term");
  const [classFilter, setClassFilter] = useState("ALL");
  const [bankFilter, setBankFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FULL" | "PARTIAL" | "UNPAID">("ALL");
  const { hideSensitive, toggleSensitive } = usePrivacy();

  const params = new URLSearchParams();
  if (term) params.set("term", term);
  if (classFilter !== "ALL") params.set("class", classFilter);
  if (bankFilter !== "ALL") params.set("bank", bankFilter);
  if (statusFilter !== "ALL") params.set("status", statusFilter);
  const { data, loading, error, reload } = useApiResource<{ students: Student[]; summary: ReportSummary; school: SchoolProfile }>(`/api/reports?${params}`);
  const students = data?.students || [];
  const summary = data?.summary || null;
  const school = data?.school || null;

  // Reset all filters helper
  const handleResetFilters = () => {
    setClassFilter("ALL");
    setBankFilter("ALL");
    setStatusFilter("ALL");
  };

  const hasActiveFilters = classFilter !== "ALL" || bankFilter !== "ALL" || statusFilter !== "ALL";

  const handleExportCSV = () => exportReportCSV({ students, summary, school, classFilter, bankFilter, statusFilter, term });
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    if (!students.length) return;
    setIsDownloadingPdf(true);
    try {
      await exportReportPDF({ students, summary, school, classFilter, bankFilter, statusFilter, term });
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };


  return { error, reload, term, setTerm, classFilter, setClassFilter, bankFilter, setBankFilter, statusFilter, setStatusFilter, students, summary, school, loading, hideSensitive, toggleSensitive, handleResetFilters, hasActiveFilters, handleExportCSV, isDownloadingPdf, handleDownloadPDF };
}

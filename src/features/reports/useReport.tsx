"use client";
import { useApiResource } from "@/features/shared/useApiResource";
import { usePrivacy } from "@/features/shared/usePrivacy";
import type { AccountReportApplied, AccountReportOptions, ReportStudentRow } from "@/lib/report-query";
import type { ReportSummary, SchoolProfile } from "@/lib/types";
import { useEffect, useState } from "react";
import { exportReportCSV, exportReportPDF } from "./export-report";

type ReportPayload = {
  students: ReportStudentRow[];
  summary: ReportSummary;
  school: SchoolProfile;
  options: AccountReportOptions;
  applied: AccountReportApplied;
};

const EMPTY_OPTIONS: AccountReportOptions = {
  classLevels: [],
  arms: [],
  banks: [],
  feeTypes: [],
  terms: ["ALL", "1st Term", "2nd Term", "3rd Term", "Whole Session"],
};

export function useReport() {
  const [term, setTerm] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [armFilter, setArmFilter] = useState("ALL");
  const [bankFilter, setBankFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feeFilter, setFeeFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { hideSensitive, toggleSensitive } = usePrivacy();

  const params = new URLSearchParams({ view: "accounts" });
  if (term) params.set("term", term);
  if (classFilter !== "ALL") params.set("class", classFilter);
  if (armFilter !== "ALL") params.set("arm", armFilter);
  if (bankFilter !== "ALL") params.set("bank", bankFilter);
  if (statusFilter !== "ALL") params.set("status", statusFilter);
  if (feeFilter !== "ALL") params.set("fee", feeFilter);
  if (fromDate) params.set("from", fromDate);
  if (toDate) params.set("to", toDate);
  const query = params.toString();

  const { data, loading, error, reload } = useApiResource<ReportPayload>(`/api/reports?${query}`);
  const students = data?.students || [];
  const summary = data?.summary || null;
  const school = data?.school || null;
  const options = data?.options || EMPTY_OPTIONS;
  const applied = data?.applied;
  const defaultTerm = ["1st Term", "2nd Term", "3rd Term"].includes(school?.currentTerm || "")
    ? school?.currentTerm || ""
    : applied?.term || "";

  useEffect(() => {
    if (!term && applied?.term) setTerm(applied.term);
  }, [applied?.term, term]);

  const handleResetFilters = () => {
    setClassFilter("ALL");
    setArmFilter("ALL");
    setBankFilter("ALL");
    setStatusFilter("ALL");
    setFeeFilter("ALL");
    setFromDate("");
    setToDate("");
    setTerm(defaultTerm || "1st Term");
  };

  const hasActiveFilters = classFilter !== "ALL" || armFilter !== "ALL" || bankFilter !== "ALL" || statusFilter !== "ALL" || feeFilter !== "ALL" || fromDate !== "" || toDate !== "" || (Boolean(term) && Boolean(defaultTerm) && term !== defaultTerm);
  const paymentSlice = bankFilter !== "ALL" || feeFilter !== "ALL" || fromDate !== "" || toDate !== "";
  const exportInput = {
    students,
    summary,
    school,
    classFilter,
    armFilter,
    bankFilter,
    statusFilter,
    feeFilter,
    term: applied?.term || term || "1st Term",
    fromDate,
    toDate,
    session: applied?.session || school?.currentSession || "",
  };

  const handleExportCSV = () => exportReportCSV(exportInput);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const handleDownloadPDF = async () => {
    if (!students.length) return;
    setIsDownloadingPdf(true);
    try {
      await exportReportPDF(exportInput);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return {
    error, reload, term, setTerm, classFilter, setClassFilter, armFilter, setArmFilter,
    bankFilter, setBankFilter, statusFilter, setStatusFilter, feeFilter, setFeeFilter,
    fromDate, setFromDate, toDate, setToDate, students, summary, school, options, applied,
    loading, hideSensitive, toggleSensitive, handleResetFilters, hasActiveFilters, paymentSlice,
    handleExportCSV, isDownloadingPdf, handleDownloadPDF,
  };
}

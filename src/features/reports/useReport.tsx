"use client";
import { useApiResource } from "@/features/shared/useApiResource";
import { usePrivacy } from "@/features/shared/usePrivacy";
import type { AccountReportApplied, AccountReportOptions, ReportStudentRow } from "@/lib/report-query";
import type { ReportSummary, SchoolProfile } from "@/lib/types";
import { useEffect, useState } from "react";
import { usePageQuery } from "@/features/shared/usePageQuery";
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

const TERMS = new Set(["", "ALL", "1st Term", "2nd Term", "3rd Term", "Whole Session"]);
const REPORT_STATUSES = new Set(["ALL", "FULL", "PARTIAL", "UNPAID"]);
const day = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

export function useReport() {
  const [filters, updateFilters] = usePageQuery({
    term: "",
    class: "ALL",
    arm: "ALL",
    bank: "ALL",
    status: "ALL",
    fee: "ALL",
    from: "",
    to: "",
  });
  const term = TERMS.has(filters.term) ? filters.term : "";
  const classFilter = filters.class || "ALL";
  const armFilter = filters.arm || "ALL";
  const bankFilter = filters.bank || "ALL";
  const statusFilter = REPORT_STATUSES.has(filters.status) ? filters.status : "ALL";
  const feeFilter = filters.fee || "ALL";
  const fromDate = day(filters.from);
  const toDate = day(filters.to);
  const setTerm = (value: string) => updateFilters({ term: value });
  const setClassFilter = (value: string) => updateFilters({ class: value });
  const setArmFilter = (value: string) => updateFilters({ arm: value });
  const setBankFilter = (value: string) => updateFilters({ bank: value });
  const setStatusFilter = (value: string) => updateFilters({ status: value });
  const setFeeFilter = (value: string) => updateFilters({ fee: value });
  const setFromDate = (value: string) => updateFilters({ from: value });
  const setToDate = (value: string) => updateFilters({ to: value });
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
    updateFilters({
      class: "ALL",
      arm: "ALL",
      bank: "ALL",
      status: "ALL",
      fee: "ALL",
      from: "",
      to: "",
      term: defaultTerm || "1st Term",
    });
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

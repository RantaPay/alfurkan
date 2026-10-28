"use client";
import { ReportFilters } from "@/features/reports/components/ReportFilters";
import { ReportStudentsTable } from "@/features/reports/components/ReportStudentsTable";
import { ReportSummary } from "@/features/reports/components/ReportSummary";

import { InlineNotice } from "@/components/ui/feedback";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useReport } from "@/features/reports/useReport";
import {
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet
} from "lucide-react";


export default function ReportsPage() {
  const form = useReport();
  const { error, reload, students, hideSensitive, toggleSensitive, handleExportCSV, isDownloadingPdf, handleDownloadPDF } = form;
  return (
    <AuthGuard>
      <SidebarLayout>
        <main className="app-page space-y-6">
        {error && <InlineNotice onRetry={reload}>{error}</InlineNotice>}
        {/* Page Title & Export Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track fee collections, identify outstanding balances, and filter reports by class or bank account
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sensitive Figures Eye Mask Toggle */}
            <button
              type="button"
              onClick={toggleSensitive}
              aria-label={hideSensitive ? "Show sensitive figures" : "Hide sensitive figures"}
              title={hideSensitive ? "Show sensitive figures" : "Hide sensitive figures (Mask with asterisks)"}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                hideSensitive
                  ? "bg-emerald-50 text-[#075E54] border-emerald-300 hover:bg-emerald-100 ring-2 ring-emerald-500/20"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              {hideSensitive ? (
                <>
                  <Eye className="h-4.5 w-4.5 text-[#075E54]" />
                  <span>Show Figures</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4.5 w-4.5 text-slate-500" />
                  <span>Hide Figures</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={students.length === 0}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
              <span>Download Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf || students.length === 0}
              className="bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4.5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4.5 w-4.5" />
              <span>{isDownloadingPdf ? "Preparing PDF..." : "Download PDF Report"}</span>
            </button>
          </div>
        </div>

        <ReportFilters form={form} />

<ReportSummary form={form} />

<ReportStudentsTable form={form} />


      </main>
      </SidebarLayout>
    </AuthGuard>
  );
}

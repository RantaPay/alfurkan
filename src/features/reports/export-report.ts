import type { ReportStudentRow } from "@/lib/report-query";
import type { ReportSummary, SchoolProfile } from "@/lib/types";
export type ReportExport = {
  students: ReportStudentRow[];
  summary: ReportSummary | null;
  school: SchoolProfile | null;
  classFilter: string;
  armFilter: string;
  bankFilter: string;
  statusFilter: string;
  feeFilter: string;
  term: string;
  fromDate: string;
  toDate: string;
  session: string;
};
// Export to CSV Function
export function exportReportCSV({ students, classFilter, armFilter, bankFilter, statusFilter, feeFilter, term, fromDate, toDate }: ReportExport) {
  if (!students.length) return;

  const headers = [
    "Student Name",
    "Registration Number",
    "Class",
    "Parent Name",
    "Parent Phone",
    "Receipt Numbers",
    "Receiving Bank",
    "Received In Filter (NGN)",
    "Term Bill (NGN)",
    "Outstanding Debt (NGN)",
    "Payment Status",
    "Last Payment Date",
  ];

  const rows = students.map((s) => [
    `"${s.fullName.replace(/"/g, "\"\"")}"`,
    `"${s.regNumber}"`,
    `"${s.class}"`,
    `"${(s.parentName || "").replace(/"/g, "\"\"")}"`,
    `"${s.parentPhone}"`,
    `"${s.receipts.map((receipt) => receipt.receiptNumber).join("; ")}"`,
    `"${s.paymentBank || "N/A"}"`,
    s.receivedAmount,
    s.totalTermBill,
    s.balanceRemaining,
    s.status,
    s.lastPaymentDate || "N/A",
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);

  const safeClass = classFilter.replace(/\s+/g, "_");
  const safeBank = bankFilter.replace(/\s+/g, "_");
  link.setAttribute(
    "download",
    `AlFurqan_${safeClass}_${armFilter}_${safeBank}_${feeFilter.replace(/\s+/g, "_")}_${statusFilter}_${term.replace(/\s+/g, "_")}_${fromDate || "start"}_${toDate || "end"}_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


const reportStatusLabels: Record<string, string> = {
  ALL: "All payment statuses",
  FULL: "Paid in full",
  PARTIAL: "Partially paid",
  UNPAID: "Unpaid",
};

/** Build school account statements independently of the download action. */
export async function createReportPDF({ students, summary, school, classFilter, armFilter, bankFilter, statusFilter, feeFilter, term, fromDate, toDate, session }: ReportExport) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const brand: [number, number, number] = [7, 94, 84];
  const ink: [number, number, number] = [30, 41, 59];
  const muted: [number, number, number] = [100, 116, 139];
  const border: [number, number, number] = [218, 225, 231];
  const generatedAt = new Date();
  const date = generatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = generatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const schoolName = school?.name || "Alfurqan International Academy";
  const sessionLabel = session || school?.currentSession || "Session not specified";
  const channel = bankFilter === "ALL" ? "All collection channels" : bankFilter;
  const classLabel = `${classFilter === "ALL" ? "All classes" : classFilter}${armFilter !== "ALL" ? ` ${armFilter}` : ""}`;
  const feeLabel = feeFilter === "ALL" ? "All fees" : feeFilter;
  const dateLabel = fromDate || toDate ? `${fromDate || "start"} to ${toDate || "end"}` : "All payment dates";
  const statusLabel = reportStatusLabels[statusFilter] || "All payment statuses";
  const amount = (value: number) => Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const title = "Fee collection statement";
  const institutionLines = doc.setFontSize(13).splitTextToSize(schoolName, contentWidth - 65) as string[];
  const headerBottom = 16 + Math.max(0, institutionLines.length - 1) * 5;
  const detailY = headerBottom + 13;
  const summaryY = detailY + 30;
  const tableY = summaryY + 27;

  doc.setProperties({ title: `${title} - ${channel}`, subject: `${term} | ${sessionLabel}`, author: schoolName, creator: "Alfurqan Pay" });

  const drawHeader = (firstPage: boolean) => {
    doc.setFillColor(...brand);
    doc.rect(margin, 9, 11, 1.2, "F");
    doc.setTextColor(...brand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(institutionLines, margin, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text("School accounts", pageWidth - margin, 15, { align: "right" });
    doc.text(`Issued: ${date}  ${time}`, pageWidth - margin, 20, { align: "right" });
    if (firstPage) {
      const contact = [school?.address, school?.phone, school?.email].filter(Boolean).join("  |  ");
      if (contact) doc.text(doc.splitTextToSize(contact, contentWidth - 65), margin, headerBottom + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(...ink);
      doc.text(title, margin, detailY);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...ink);
      doc.text(`${title} | Continued`, margin, headerBottom + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text(doc.splitTextToSize(`${channel}  |  ${term}  |  ${sessionLabel}`, contentWidth), margin, headerBottom + 12);
    }
  };

  drawHeader(true);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.25);
  doc.line(margin, detailY + 4, pageWidth - margin, detailY + 4);
  doc.setFontSize(8);
  const metadata = [
    ["Collection channel", channel],
    ["Academic period", `${term} | ${sessionLabel}`],
    ["Class / arm / status", `${classLabel} | ${statusLabel}`],
    ["Fee / payment dates", `${feeLabel} | ${dateLabel}`],
  ];
  metadata.forEach(([label, value], index) => {
    const y = detailY + 9 + index * 4.5;
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin, y);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 42, y, { maxWidth: contentWidth - 42 });
  });

  // Retain the supplied report figures and their existing calculation rules.
  doc.setFillColor(245, 248, 248);
  doc.rect(margin, summaryY, contentWidth, 20, "F");
  const metrics = [
    ["Fees assessed (NGN)", amount(summary?.expectedRevenue || 0)],
    ["Received in this filter (NGN)", amount(summary?.collectedRevenue || 0)],
    ["Outstanding balance (NGN)", amount(summary?.outstandingDebt || 0)],
    ["Student accounts", String(students.length)],
  ];
  metrics.forEach(([label, value], index) => {
    const x = margin + index * contentWidth / 4 + 4;
    if (index) {
      doc.setDrawColor(...border);
      doc.line(x - 4, summaryY + 4, x - 4, summaryY + 16);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text(label, x, summaryY + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...ink);
    doc.text(value, x, summaryY + 13);
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text("Currency: Nigerian naira (NGN). Received amounts and receipt numbers follow the filters on this statement.", margin, summaryY + 25);

  autoTable(doc, {
    startY: tableY,
    margin: { top: headerBottom + 18, bottom: 22, left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "plain",
    showHead: "everyPage",
    rowPageBreak: "avoid",
    head: [["No.", "Student", "Class", "Receipts", "Received\n(NGN)", "Term bill\n(NGN)", "Balance\n(NGN)", "Status", "Bank"]],
    body: students.map((student, index) => [
      String(index + 1).padStart(2, "0"),
      `${student.fullName}\n${student.regNumber}`,
      student.class,
      student.receipts.map((receipt) => receipt.receiptNumber).join("\n") || "-",
      amount(student.receivedAmount),
      student.totalTermBill > 0 ? amount(student.totalTermBill) : "-",
      student.totalTermBill === 0 ? "-" : amount(Math.max(0, student.balanceRemaining)),
      student.totalTermBill === 0 ? "No fee assessed" : reportStatusLabels[student.status] || student.status,
      student.paymentBank && student.paymentBank !== "—" ? student.paymentBank : "-",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      textColor: ink,
      cellPadding: { top: 2, bottom: 2, left: 2.2, right: 2.2 },
      minCellHeight: 9,
      valign: "middle",
      overflow: "linebreak",
      lineWidth: { bottom: 0.15 },
      lineColor: border,
    },
    headStyles: { fillColor: brand, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7, minCellHeight: 11 },
    alternateRowStyles: { fillColor: [247, 249, 250] },
    columnStyles: {
      0: { cellWidth: 12, halign: "center", textColor: muted },
      1: { cellWidth: 48, fontStyle: "bold" },
      2: { cellWidth: 28 },
      3: { cellWidth: 36, font: "courier", fontSize: 7 },
      4: { cellWidth: 28, halign: "right", font: "courier" },
      5: { cellWidth: 28, halign: "right", font: "courier" },
      6: { cellWidth: 28, halign: "right", font: "courier", fontStyle: "bold" },
      7: { cellWidth: 26, fontSize: 7 },
      8: { cellWidth: 35, fontSize: 7 },
    },
    willDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(false); },
    didParseCell: (data) => {
      if (data.section === "head" && [4, 5, 6].includes(data.column.index)) data.cell.styles.halign = "right";
    },
  });

  // Add page counts after all rows have been laid out, so every page uses the final total.
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(...border);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text("School accounts | Fee collection statement", margin, pageHeight - 11);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 11, { align: "right" });
    doc.setFontSize(6.5);
    doc.text(`Prepared by: ${school?.accountantName || "Accounts Office"}`, margin, pageHeight - 7);
    doc.text(`${students.length} student accounts | ${date}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }
  return doc;
}

export async function exportReportPDF(report: ReportExport) {
  const doc = await createReportPDF(report);
  const safePart = (value: string) => value.replace(/[^a-z0-9-]+/gi, "_").replace(/^_|_$/g, "");
  const bank = report.bankFilter === "ALL" ? "All_Channels" : safePart(report.bankFilter);
  doc.save(`Alfurqan_Fee_Collection_Statement_${bank}_${safePart(report.classFilter)}_${safePart(report.armFilter)}_${safePart(report.feeFilter)}_${safePart(report.term)}_${report.fromDate || "start"}_${report.toDate || "end"}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

import type { ReportSummary, SchoolProfile, Student } from "@/lib/types";
export type ReportExport = { students: Student[]; summary: ReportSummary | null; school: SchoolProfile | null; classFilter: string; bankFilter: string; statusFilter: string; term: string };
// Export to CSV Function
export function exportReportCSV({ students, classFilter, bankFilter, statusFilter, term }: ReportExport) {
  if (!students.length) return;

  const headers = [
    "Student Name",
    "Registration Number",
    "Class",
    "Parent Name",
    "Parent Phone",
    "Receiving Bank",
    "Total Term Bill (NGN)",
    "Total Paid (NGN)",
    "Outstanding Debt (NGN)",
    "Payment Status",
    "Last Payment Date",
  ];

  const rows = students.map((s) => [
    `"${s.fullName}"`,
    `"${s.regNumber}"`,
    `"${s.class}"`,
    `"${s.parentName}"`,
    `"${s.parentPhone}"`,
    `"${s.paymentBank || 'N/A'}"`,
    s.totalTermBill,
    s.totalPaid,
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
    `AlFurqan_${safeClass}_${safeBank}_${statusFilter}_Report_${term.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export async function exportReportPDF({ students, summary, school, classFilter, bankFilter, statusFilter, term }: ReportExport) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const formatPdfCurrency = (amount: number) => {
    return "NGN " + (Number(amount) || 0).toLocaleString();
  };

  // Header: School Name & Motto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(7, 94, 84);
  doc.text(school?.name || "ALFURQAN INTERNATIONAL ACADEMY", 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${school?.motto || "Knowledge & Guidance"} • ${school?.address || "Along Dass Road, Bauchi State"}`,
    14,
    21
  );

  // Title & Generation Metadata
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  const activeSession = school?.currentSession || "2026/2027";
  doc.text(`Fee Collection & Debtor Report — ${term} (${activeSession})`, 14, 29);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const statusLabel =
    statusFilter === "ALL"
      ? "All Students"
      : statusFilter === "FULL"
        ? "Full Payment (Cleared)"
        : statusFilter === "PARTIAL"
          ? "Part Payment Debtors"
          : "Unpaid Defaulters";
  doc.text(
    `Generated on: ${dateStr} • Filters: Class [${classFilter === "ALL" ? "All Classes" : classFilter}], Bank [${bankFilter === "ALL" ? "All Banks" : bankFilter}], Status [${statusLabel}]`,
    14,
    34
  );

  // Summary Box Banner
  doc.setFillColor(245, 247, 248);
  doc.roundedRect(14, 37, 269, 13, 2, 2, "F");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);

  const billedStr = formatPdfCurrency(summary?.expectedRevenue || 0);
  const paidStr = formatPdfCurrency(summary?.collectedRevenue || 0);
  const debtStr = formatPdfCurrency(summary?.outstandingDebt || 0);
  const countStr = `${students.length} Students`;

  doc.text(`Total Billed: ${billedStr}`, 18, 45);
  doc.text(`Total Collected: ${paidStr}`, 80, 45);
  doc.setTextColor(180, 40, 40);
  doc.text(`Outstanding Debt: ${debtStr}`, 155, 45);
  doc.setTextColor(30, 30, 30);
  doc.text(`Total Records: ${countStr}`, 235, 45);

  // Prepare table rows
  const tableBody = students.map((s, idx) => [
    String(idx + 1),
    s.fullName,
    s.regNumber,
    s.class,
    s.parentName ? `${s.parentName} (${s.parentPhone || ""})` : s.parentPhone || "—",
    s.totalTermBill > 0 ? formatPdfCurrency(s.totalTermBill) : "—",
    s.totalPaid > 0 ? formatPdfCurrency(s.totalPaid) : "—",
    s.totalTermBill === 0 ? "—" : s.balanceRemaining > 0 ? formatPdfCurrency(s.balanceRemaining) : "₦0",
    s.totalTermBill === 0 ? "Nil" : s.status === "FULL" ? "CLEARED" : s.status === "PARTIAL" ? "PARTIAL" : "UNPAID",
    s.paymentBank || "—",
  ]);

  autoTable(doc, {
    startY: 53,
    head: [
      [
        "#",
        "Student Name",
        "Admission No",
        "Class",
        "Parent & Phone",
        "Term Bill",
        "Paid to Date",
        "Balance Due",
        "Status",
        "Bank",
      ],
    ],
    body: tableBody,
    headStyles: {
      fillColor: [7, 94, 84],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 45, fontStyle: "bold" },
      2: { cellWidth: 24, fontStyle: "bold" },
      3: { cellWidth: 20 },
      4: { cellWidth: 50 },
      5: { cellWidth: 26, halign: "right" },
      6: { cellWidth: 26, halign: "right" },
      7: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      8: { cellWidth: 22, halign: "center" },
      9: { cellWidth: 22 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(130, 130, 130);
      doc.text(
        `Alfurqan International Academy • Debtor Report • Page ${data.pageNumber} of ${pageCount} • Bursary & Accounts`,
        14,
        202
      );
    },
  });

  const safeClass = classFilter.replace(/\s+/g, "_");
  const safeTerm = term.replace(/\s+/g, "_");
  doc.save(
    `AlFurqan_${safeClass}_Debtor_Report_${safeTerm}_${new Date().toISOString().split("T")[0]}.pdf`
  );

}

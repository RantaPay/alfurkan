import type { Receipt, Student } from "@/lib/types";

export async function downloadStudentPaymentReport(student: Pick<Student, "fullName" | "regNumber" | "class" | "parentName" | "totalTermBill" | "balanceRemaining">, receipts: Receipt[]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const active = receipts.filter((receipt) => !receipt.isVoided);
  const totalPaid = active.reduce((sum, receipt) => sum + Number(receipt.amountPaid || 0), 0);
  const money = (value: number) => Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  doc.setProperties({ title: `Payments - ${student.fullName}`, author: "Alfurqan Pay", creator: "Alfurqan Pay" });
  doc.setFontSize(16);
  doc.setTextColor(7, 94, 84);
  doc.text("Student payment report", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(student.fullName, 14, 28);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text([student.regNumber, student.class, student.parentName].filter(Boolean).join("  ·  "), 14, 34);
  doc.text(`Receipts: ${active.length}    Paid: NGN ${money(totalPaid)}    Balance: NGN ${money(student.balanceRemaining)}    Bill: NGN ${money(student.totalTermBill)}`, 14, 41);
  autoTable(doc, {
    startY: 48,
    head: [["Receipt", "Date", "Fees", "Bank", "Amount", "Balance", "Status"]],
    body: receipts.map((receipt) => [
      receipt.receiptNumber,
      receipt.date,
      receipt.items?.map((item) => item.name).join(", ") || "School fees",
      receipt.bankName || receipt.paymentMethod,
      money(receipt.amountPaid),
      money(receipt.balanceRemaining),
      receipt.isVoided ? "Cancelled" : receipt.paymentStatus === "FULL" ? "Paid in full" : "Part paid",
    ]),
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [7, 94, 84], textColor: 255 },
    margin: { left: 14, right: 14 },
  });
  const safeName = student.fullName.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "") || "student";
  doc.save(`AlFurqan_${safeName}_payments.pdf`);
}

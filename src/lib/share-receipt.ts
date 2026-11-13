/** Turns a parent phone into a WhatsApp number, or null when it cannot open a chat. */
export function whatsappPhone(phone?: string | null): string | null {
  let digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234") && digits.length > 10) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length < 10 || digits.length > 11) return null;
  return `234${digits}`;
}

export async function elementToPdfFile(element: HTMLElement, filename: string): Promise<File> {
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#FCFBF7",
  });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, pdfHeight);
  return new File([pdf.output("blob")], filename, { type: "application/pdf" });
}

/** Hands the A4 PDF to WhatsApp. A saved parent number opens that chat; otherwise WhatsApp asks who to send it to. */
export async function shareReceiptFile(file: File, phone: string | null): Promise<void> {
  const payload = { files: [file], title: file.name.replace(/\.pdf$/i, "") };
  if (typeof navigator.share === "function" && navigator.canShare?.(payload)) {
    await navigator.share(payload);
    return;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  window.open(phone ? `https://wa.me/${phone}` : "https://web.whatsapp.com/send", "_blank", "noopener,noreferrer");
}

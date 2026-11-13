import { NextResponse } from "next/server";
import { getReceipts, createReceipt, getReceiptByNumber, getStudentReceipts, updateReceipt } from "@/lib/data-store";
import { isPaymentPeriod } from "@/lib/fee-ledger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptNumber = searchParams.get("number");
    const studentId = searchParams.get("studentId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    if (receiptNumber) {
      const receipt = await getReceiptByNumber(receiptNumber);
      if (!receipt) {
        return NextResponse.json({ success: false, error: "Receipt not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, receipt });
    }

    if (studentId) {
      const receipts = await getStudentReceipts(studentId);
      return NextResponse.json({ success: true, count: receipts.length, receipts });
    }

    const receipts = await getReceipts(limit);
    return NextResponse.json({ success: true, count: receipts.length, receipts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: "Receipt not found" }, { status: 400 });
    if (body.term !== undefined && !isPaymentPeriod(body.term)) {
      return NextResponse.json({ success: false, error: "Select a valid payment period." }, { status: 400 });
    }
    const receipt = await updateReceipt(body.id, {
      items: body.items || [],
      paymentMethod: body.paymentMethod || "Cash",
      bankName: body.bankName,
      bankReference: body.bankReference,
      date: body.date,
      depositorName: body.depositorName,
      depositorPhone: body.depositorPhone,
      notes: body.notes,
      term: body.term,
    });
    return NextResponse.json({ success: true, receipt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to save this receipt.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      amountPaid,
      paymentMethod,
      bankReference,
      bankName,
      date,
      depositorName,
      payerName,
      depositorPhone,
      payerPhone,
      items,
      notes,
    } = body;

    const finalPayerName = (body.studentName || depositorName || payerName || "").trim();
    if (body.term !== undefined && !isPaymentPeriod(body.term)) {
      return NextResponse.json({ success: false, error: "Select a valid payment period." }, { status: 400 });
    }
    if ((!studentId && !finalPayerName) || !amountPaid || Number(amountPaid) <= 0) {
      return NextResponse.json(
        { success: false, error: "Payer Name / Student and a valid payment amount are required." },
        { status: 400 }
      );
    }

    const receipt = await createReceipt({
      studentId: studentId || null,
      studentName: body.studentName || finalPayerName,
      studentClass: body.studentClass || "General",
      regNumber: body.regNumber || "N/A",
      amountPaid: Number(amountPaid),
      paymentMethod: paymentMethod || "Bank Transfer",
      bankReference,
      bankName: bankName || undefined,
      date: date || undefined,
      depositorName: depositorName || payerName || undefined,
      depositorPhone: depositorPhone || payerPhone || undefined,
      items: items || [],
      term: body.term,
      session: body.session,
      notes,
      clientReceiptId: body.clientReceiptId,
      confirmDuplicate: body.confirmDuplicate === true,
    });

    const provisionalBalance = Number(body.provisionalBalance);
    const provisionalBill = Number(body.provisionalBill);
    const reprint = !!body.clientReceiptId && (
      (Number.isFinite(provisionalBalance) && Math.abs(provisionalBalance - receipt.balanceRemaining) > 0.01) ||
      (Number.isFinite(provisionalBill) && Math.abs(provisionalBill - receipt.totalTermBill) > 0.01)
    );
    return NextResponse.json({ success: true, receipt, reprint }, { status: 201 });
  } catch (error: any) {
    const code = error?.code as string | undefined;
    const status = code === "DUPLICATE" || code === "SESSION_CHANGED" ? 409 : code === "SYNC_UNAVAILABLE" ? 503 : code === "STUDENT_MISSING" ? 409 : 500;
    return NextResponse.json({ success: false, error: error.message, code, duplicate: error.duplicate }, { status });
  }
}

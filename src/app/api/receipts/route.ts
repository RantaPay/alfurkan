import { NextResponse } from "next/server";
import { getReceipts, createReceipt, getReceiptByNumber } from "@/lib/data-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptNumber = searchParams.get("number");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    if (receiptNumber) {
      const receipt = await getReceiptByNumber(receiptNumber);
      if (!receipt) {
        return NextResponse.json({ success: false, error: "Receipt not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, receipt });
    }

    const receipts = await getReceipts(limit);
    return NextResponse.json({ success: true, count: receipts.length, receipts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    if (!studentId || !amountPaid || amountPaid <= 0) {
      return NextResponse.json(
        { success: false, error: "Student ID and a valid payment amount are required." },
        { status: 400 }
      );
    }

    const receipt = await createReceipt({
      studentId,
      amountPaid: Number(amountPaid),
      paymentMethod: paymentMethod || "Bank Transfer",
      bankReference,
      bankName: bankName || undefined,
      date: date || undefined,
      depositorName: depositorName || payerName || undefined,
      depositorPhone: depositorPhone || payerPhone || undefined,
      items: items || [],
      notes,
    });

    return NextResponse.json({ success: true, receipt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

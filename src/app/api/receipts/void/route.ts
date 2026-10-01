import { NextResponse } from "next/server";
import { voidReceipt } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { receiptId, reason, voidedBy } = body;

    if (!receiptId || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "Receipt ID and a valid reason for cancellation are required." },
        { status: 400 }
      );
    }

    const receipt = await voidReceipt(receiptId, reason, voidedBy);
    return NextResponse.json({ success: true, receipt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

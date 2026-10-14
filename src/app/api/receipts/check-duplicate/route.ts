import { NextRequest, NextResponse } from "next/server";
import { findDuplicateReceipt } from "@/lib/data-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const duplicate = await findDuplicateReceipt({
      studentName: body.studentName,
      regNumber: body.regNumber,
      amountPaid: Number(body.amountPaid),
      date: body.date,
      items: body.items || [],
    });

    if (duplicate) {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        duplicate: {
          id: duplicate.id,
          receiptNumber: duplicate.receiptNumber,
          studentName: duplicate.studentName,
          regNumber: duplicate.regNumber,
          amountPaid: duplicate.amountPaid,
          date: duplicate.date,
          feePurpose:
            duplicate.items && duplicate.items.length > 0
              ? duplicate.items.map((i) => i.name).join(", ")
              : "Tuition / School Fees",
        },
      });
    }

    return NextResponse.json({
      success: true,
      isDuplicate: false,
      duplicate: null,
    });
  } catch (error: any) {
    console.error("Duplicate receipt check failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check duplicate receipt" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getReportData } from "@/lib/data-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term") || undefined;
    const month = searchParams.get("month") || undefined;
    const classFilter = searchParams.get("class") || undefined;
    const statusFilter = searchParams.get("status") || undefined;
    const bankFilter = searchParams.get("bank") || undefined;

    const data = await getReportData(term, month, classFilter, statusFilter, bankFilter);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getReportData } from "@/lib/data-store";
import { getAccountReport } from "@/server/report-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("view") === "accounts") {
      const data = await getAccountReport({
        term: searchParams.get("term") || undefined,
        classLevel: searchParams.get("class") || undefined,
        arm: searchParams.get("arm") || undefined,
        status: searchParams.get("status") || undefined,
        bank: searchParams.get("bank") || undefined,
        fee: searchParams.get("fee") || undefined,
        from: searchParams.get("from") || undefined,
        to: searchParams.get("to") || undefined,
      });
      return NextResponse.json({ success: true, ...data });
    }

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

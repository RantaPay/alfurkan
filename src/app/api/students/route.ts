import { NextResponse } from "next/server";
import { getStudents, getStudentByRegNumber } from "@/lib/data-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const classFilter = searchParams.get("class") || undefined;
    const statusFilter = searchParams.get("status") || undefined;
    const regNumber = searchParams.get("regNumber");

    if (regNumber) {
      const student = await getStudentByRegNumber(regNumber);
      return NextResponse.json({ success: true, student });
    }

    const students = await getStudents(query, classFilter, statusFilter);
    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

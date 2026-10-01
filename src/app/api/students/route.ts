import { NextResponse } from "next/server";
import { getStudents, getStudentByRegNumber, createStudent, importStudentsBulk } from "@/lib/data-store";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if bulk import
    if (Array.isArray(body)) {
      const createdList = await importStudentsBulk(body);
      return NextResponse.json({ success: true, count: createdList.length, students: createdList }, { status: 201 });
    }

    // Single student creation
    const { fullName, class: studentClass, parentName, parentPhone, parentEmail, totalTermBill, gender, regNumber } = body;
    if (!fullName || !studentClass) {
      return NextResponse.json({ success: false, error: "Student Name and Class are required." }, { status: 400 });
    }

    const student = await createStudent({
      fullName,
      class: studentClass,
      gender: gender || "Male",
      parentName: parentName || "Parent/Guardian",
      parentPhone: parentPhone || "08000000000",
      parentEmail,
      totalTermBill: Number(totalTermBill) || 165000,
      regNumber,
    });

    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

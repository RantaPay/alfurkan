import { NextResponse } from "next/server";
import {
  getStudents,
  getStudentByRegNumber,
  createStudent,
  importStudentsBulk,
  updateStudent,
  deleteStudent,
  promoteStudentsSession,
  autoPromoteAllStudents,
} from "@/lib/data-store";

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
    const { fullName, class: studentClass, parentName, parentPhone, parentEmail, totalTermBill, gender, regNumber, isRepeating } = body;
    if (!fullName || !studentClass) {
      return NextResponse.json({ success: false, error: "Student Name and Class are required." }, { status: 400 });
    }

    const student = await createStudent({
      fullName,
      class: studentClass,
      gender: gender || "Male",
      parentName: parentName || "Parent/Guardian",
      parentPhone: parentPhone || "",
      parentEmail,
      totalTermBill: Number(totalTermBill) || 0,
      regNumber,
      isRepeating: !!isRepeating,
    });

    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "auto_promote_all") {
      const operator = body.operator || "Chief Accountant & Admin";
      const result = await autoPromoteAllStudents(operator);
      return NextResponse.json({ ...result });
    }

    if (body.action === "promote_session") {
      const { promotions, operator } = body;
      if (!Array.isArray(promotions) || promotions.length === 0) {
        return NextResponse.json(
          { success: false, error: "Promotions array is required." },
          { status: 400 }
        );
      }
      const result = await promoteStudentsSession(promotions, operator);
      return NextResponse.json({ ...result });
    }

    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Student ID is required for update." },
        { status: 400 }
      );
    }

    const updated = await updateStudent(id, updates);
    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Student ID is required." },
        { status: 400 }
      );
    }

    await deleteStudent(id);
    return NextResponse.json({ success: true, message: "Student deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


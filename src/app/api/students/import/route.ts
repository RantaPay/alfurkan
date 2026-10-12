import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStudentWorkbook } from "@/lib/student-importer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "preview"; // "preview" | "execute"
    const wipeExistingData = formData.get("wipeExistingData") === "true";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Please select an Excel (.xlsx, .xls) or CSV file to upload." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Load fee structure from settings if configured
    const school = await prisma.schoolProfile.findUnique({ where: { id: "default" } });
    let feeStructure = undefined;
    if (school?.feeStructureJson) {
      try {
        const parsed = JSON.parse(school.feeStructureJson);
        if (Array.isArray(parsed) && parsed.length > 0) feeStructure = parsed;
      } catch {}
    }

    // Parse workbook dynamically
    const parseResult = parseStudentWorkbook(buffer, file.name, feeStructure);

    if (parseResult.totalStudents === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No student records could be detected in this file. Please verify the spreadsheet format.",
        },
        { status: 400 }
      );
    }

    // If dry-run preview, return parsed statistics without writing to database
    if (mode === "preview") {
      return NextResponse.json({
        success: true,
        mode: "preview",
        result: parseResult,
      });
    }

    // Execute actual database migration
    if (wipeExistingData) {
      // Clean up receipts first due to relations, then existing students
      await prisma.$transaction([
        prisma.receiptItem.deleteMany(),
        prisma.receipt.deleteMany(),
        prisma.student.deleteMany(),
      ]);
    }

    // Prepare student insert payloads
    const studentPayloads = parseResult.students.map((s) => ({
      regNumber: s.regNumber,
      fullName: s.fullName,
      class: s.class,
      gender: s.gender,
      parentName: s.parentName,
      parentPhone: s.parentPhone || "",
      parentEmail: s.parentEmail || null,
      totalTermBill: s.totalTermBill || 0,
      totalPaid: 0,
      balanceRemaining: s.totalTermBill || 0,
      status: "UNPAID",
      isRepeating: false,
    }));

    // Chunked batch insertion for optimal performance
    const CHUNK_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < studentPayloads.length; i += CHUNK_SIZE) {
      const chunk = studentPayloads.slice(i, i + CHUNK_SIZE);
      const res = await prisma.student.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += res.count;
    }

    return NextResponse.json({
      success: true,
      mode: "execute",
      insertedCount: totalInserted,
      totalParsed: parseResult.totalStudents,
      classesCount: parseResult.classes.length,
      duplicateCount: parseResult.duplicateCount,
      missingRegCount: parseResult.missingRegCount,
      warnings: parseResult.warnings,
      classes: parseResult.classes,
    });
  } catch (error: any) {
    console.error("Student Import Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process and import student database.",
      },
      { status: 500 }
    );
  }
}

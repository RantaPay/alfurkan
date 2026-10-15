import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStudentWorkbook } from "@/lib/student-importer";
import { createDatabaseBackup } from "@/lib/backup-service";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "preview"; // "preview" | "execute"

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

    // AUTOMATED SAFETY: Always create a full snapshot backup before executing any import
    try {
      await createDatabaseBackup("PRE_STUDENT_IMPORT");
    } catch (backupErr) {
      console.warn("Pre-import automated backup warning:", backupErr);
    }

    // CRITICAL INTEGRITY RULE: Receipts and audit records must NEVER be deleted.
    // Fetch all existing students to safely merge and preserve payment history
    const allExistingStudents = await prisma.student.findMany({
      select: {
        id: true,
        regNumber: true,
        totalPaid: true,
        totalTermBill: true,
        status: true,
      },
    });

    const existingMap = new Map(
      allExistingStudents.map((s) => [s.regNumber.toUpperCase().trim(), s])
    );

    const toInsert: any[] = [];
    const toUpdate: { id: string; data: any }[] = [];

    for (const s of parseResult.students) {
      const regKey = (s.regNumber || "").toUpperCase().trim();
      const existing = regKey ? existingMap.get(regKey) : null;
      const effectiveBill = Number(s.totalTermBill) || 0;

      if (existing) {
        // PRESERVE payment history! Never wipe payments already made
        const prevPaid = Number(existing.totalPaid) || 0;
        const newBalance = Math.max(0, effectiveBill - prevPaid);
        const newStatus = effectiveBill === 0 ? "UNPAID" : newBalance === 0 ? "FULL" : prevPaid > 0 ? "PARTIAL" : "UNPAID";

        toUpdate.push({
          id: existing.id,
          data: {
            fullName: s.fullName,
            class: s.class,
            gender: s.gender || "Male",
            parentName: s.parentName || "",
            parentPhone: s.parentPhone || "",
            parentEmail: s.parentEmail || null,
            totalTermBill: effectiveBill,
            balanceRemaining: newBalance,
            status: newStatus,
          },
        });
      } else {
        toInsert.push({
          regNumber: s.regNumber,
          fullName: s.fullName,
          class: s.class,
          gender: s.gender || "Male",
          parentName: s.parentName || "",
          parentPhone: s.parentPhone || "",
          parentEmail: s.parentEmail || null,
          totalTermBill: effectiveBill,
          totalPaid: 0,
          balanceRemaining: effectiveBill,
          status: "UNPAID",
          isRepeating: false,
        });
      }
    }

    // Execute inserts in chunks
    let totalInserted = 0;
    const CHUNK_SIZE = 100;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const res = await prisma.student.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += res.count;
    }

    // Execute updates
    let totalUpdated = 0;
    for (const item of toUpdate) {
      await prisma.student.update({
        where: { id: item.id },
        data: item.data,
      });
      totalUpdated += 1;
    }

    return NextResponse.json({
      success: true,
      mode: "execute",
      insertedCount: totalInserted,
      updatedCount: totalUpdated,
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

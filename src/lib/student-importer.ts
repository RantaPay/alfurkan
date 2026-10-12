import * as XLSX from "xlsx";
import { CreateStudentInput } from "./types";

export interface ParsedStudentItem {
  index: number;
  sheetName: string;
  originalRow: number;
  regNumber: string;
  isAutoAssignedReg: boolean;
  fullName: string;
  class: string;
  gender: "Male" | "Female";
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  totalTermBill: number;
  tags?: string[];
  warnings: string[];
}

export interface ClassSummary {
  name: string;
  count: number;
  level: string;
  termBill: number;
}

export interface ParseResult {
  filename: string;
  totalStudents: number;
  classes: ClassSummary[];
  duplicateCount: number;
  missingRegCount: number;
  warningCount: number;
  warnings: {
    sheet: string;
    row: number;
    regNumber: string;
    studentName: string;
    message: string;
    type: "duplicate_reg" | "missing_reg" | "name_quirk" | "info";
  }[];
  students: ParsedStudentItem[];
}

// Known common Islamic/Nigerian female first names for accurate gender detection
const FEMALE_NAMES = new Set([
  "aisha", "aishatu", "aysha", "fatima", "fatimah", "maryam", "meryem", "khadija", "khadijah",
  "asma'u", "asmau", "amina", "aminatu", "maimuna", "maimunatu", "zarah", "zara", "zahra",
  "zainab", "zeinab", "halima", "halimah", "hafsat", "hafsa", "balkisu", "bilkisu", "bilkis",
  "rukayyah", "rukayya", "sa'adatu", "saadatu", "sa'ada", "hauwa", "hauwa'u", "amatullah",
  "amaturrahman", "fadila", "fadhila", "fakriyya", "fakhriyya", "azeema", "habiba", "habibah",
  "haseena", "hasina", "nabila", "nabilah", "umusalma", "umm-salma", "ummukhursum", "ummu-kursum",
  "sadiya", "sadiyah", "safiyya", "safiyyah", "rabiatu", "rabia", "miskeenah", "faiza", "faizah",
  "husna", "salma", "salmah", "lubabatu", "ruqayya", "shafa'atu", "samira", "samirah", "jameela",
  "jamila", "nusaiba", "nuseiba", "farida", "faridah", "sumayya", "sumayyah", "munira", "munirah"
]);

/**
 * Standardize messy school sheet titles and names into canonical class names
 */
export function standardizeClassName(sheetName: string, title?: string): string {
  const combined = ((title || "") + " " + sheetName).toUpperCase();
  
  // Extract Arm: A, B, C, D (last letter of sheetName or standalone letter)
  const arm = sheetName.match(/[a-d]$/i)?.[0]?.toUpperCase() || 
              (title ? title.match(/\b([A-D])\b/i)?.[1]?.toUpperCase() : null) || 
              sheetName.match(/\s+([A-D])$/i)?.[1]?.toUpperCase() || 
              "A";

  // Pre-Nursery
  if (combined.includes("PRENURSERY") || combined.includes("PRE-NURSERY") || /^PN\b/i.test(sheetName)) {
    return `Pre-Nursery ${arm}`;
  }

  // Nursery 1
  if (combined.includes("NURSERY ONE") || combined.includes("NURSERY 1") || /^N\s*1/i.test(sheetName)) {
    return `Nursery 1 ${arm}`;
  }

  // Nursery 2
  if (combined.includes("NURSERY TWO") || combined.includes("NURSERY 2") || /^N\s*2/i.test(sheetName)) {
    return `Nursery 2 ${arm}`;
  }

  // Primary / Basic 1 to 6
  const numberWords = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX"];
  for (let b = 1; b <= 6; b++) {
    const word = numberWords[b - 1];
    if (
      combined.includes(`BASIC ${word}`) ||
      combined.includes(`BASIC ${b}`) ||
      combined.includes(`PRIMARY ${word}`) ||
      combined.includes(`PRIMARY ${b}`) ||
      new RegExp(`^B\\s*${b}`, "i").test(sheetName)
    ) {
      return `Basic ${b} ${arm}`;
    }
  }

  // JSS 1 to 3
  const secWords = ["ONE", "TWO", "THREE"];
  for (let j = 1; j <= 3; j++) {
    const word = secWords[j - 1];
    if (
      combined.includes(`JUNIOR SECONDARY ${word}`) ||
      combined.includes(`JUNIOR SECONDARY ${j}`) ||
      combined.includes(`JSS ${j}`) ||
      combined.includes(`JSS${j}`) ||
      new RegExp(`^JS\\s*${j}`, "i").test(sheetName)
    ) {
      return `JSS ${j} ${arm}`;
    }
  }

  // SS 1 to 3
  for (let s = 1; s <= 3; s++) {
    const word = secWords[s - 1];
    if (
      combined.includes(`SENIOR SECONDARY ${word}`) ||
      combined.includes(`SENIOR SECONDARY ${s}`) ||
      combined.includes(`SS ${s}`) ||
      combined.includes(`SS${s}`) ||
      new RegExp(`^SS\\s*${s}`, "i").test(sheetName)
    ) {
      return `SS ${s} ${arm}`;
    }
  }

  // Fallback: cleanup sheetName
  return sheetName.trim();
}

/**
 * Determine term bill dynamically based on configured fee schedule from settings.
 * Returns 0 if not configured.
 */
export function getBillForClass(
  className: string,
  feeStructure?: { classLevel: string; totalBill: number }[]
): number {
  if (feeStructure && feeStructure.length > 0) {
    const cleanClass = className.toLowerCase().trim();
    const match = feeStructure.find((f) => {
      const lvl = f.classLevel.toLowerCase().trim();
      return cleanClass.startsWith(lvl) || cleanClass.includes(lvl) || lvl.includes(cleanClass);
    });
    if (match && match.totalBill > 0) {
      return match.totalBill;
    }
  }
  return 0;
}

/**
 * Infer gender from name and class characteristics
 */
export function inferGender(fullName: string, className: string): "Male" | "Female" {
  const parts = fullName.trim().split(/\s+/);
  const firstWord = (parts[0] || "").toLowerCase().replace(/[^a-z']/g, "");

  if (FEMALE_NAMES.has(firstWord)) {
    return "Female";
  }

  // In secondary & Pre-Nursery B arms at Al-Furqan, arm B is typically predominantly female
  if (
    className.includes("SS 1 B") ||
    className.includes("SS 2 B") ||
    className.includes("SS 3 B") ||
    className.includes("JSS 1 B") ||
    className.includes("JSS 2 B") ||
    className.includes("JSS 3 B") ||
    className.includes("Pre-Nursery B")
  ) {
    if (
      !firstWord.startsWith("abdul") &&
      !firstWord.startsWith("muhammad") &&
      !firstWord.startsWith("ahmad") &&
      !firstWord.startsWith("ibrahim") &&
      !firstWord.startsWith("umar")
    ) {
      return "Female";
    }
  }

  return "Male";
}

/**
 * Proper-case a student name while preserving tags and Arabic prefixes
 */
export function normalizeStudentName(rawName: string): { fullName: string; tags: string[] } {
  // Extract tags like (ADF), (SR), (BoT), (YR)
  const tags: string[] = [];
  const tagMatches = rawName.match(/\(([^)]+)\)/g);
  if (tagMatches) {
    for (const m of tagMatches) {
      tags.push(m.replace(/[()]/g, "").trim());
    }
  }

  // Clean words
  const words = rawName
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  const formattedWords = words.map((w) => {
    // Preserve tag blocks like (ADF)
    if (w.startsWith("(") && w.endsWith(")")) {
      return w.toUpperCase();
    }
    // Handle Al- or El- prefixes
    if (w.toLowerCase().startsWith("al-")) {
      return "Al-" + w.slice(3, 4).toUpperCase() + w.slice(4).toLowerCase();
    }
    if (w.toLowerCase().startsWith("el-")) {
      return "El-" + w.slice(3, 4).toUpperCase() + w.slice(4).toLowerCase();
    }
    // General title-casing
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });

  return {
    fullName: formattedWords.join(" "),
    tags,
  };
}

/**
 * Infer parent/guardian name from student's name
 */
export function inferParentName(studentFullName: string): string {
  // Strip tags like (ADF)
  const cleanName = studentFullName.replace(/\([^)]*\)/g, "").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    // Take father / grandfather name
    const surname = parts.slice(1).join(" ");
    return `Alhaji ${surname}`;
  }
  return `Parent of ${cleanName}`;
}

/**
 * Parse an uploaded workbook Buffer/ArrayBuffer end-to-end
 */
export function parseStudentWorkbook(
  buffer: ArrayBuffer | Buffer,
  filename: string,
  feeStructure?: { classLevel: string; totalBill: number }[]
): ParseResult {
  const wb = XLSX.read(buffer, { type: Buffer.isBuffer(buffer) ? "buffer" : "array" });
  
  const parsedStudents: ParsedStudentItem[] = [];
  const warnings: ParseResult["warnings"] = [];
  const seenRegNumbers = new Map<string, { student: ParsedStudentItem; sheet: string; row: number }>();
  const classCountMap = new Map<string, number>();

  let duplicateCount = 0;
  let missingRegCount = 0;

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!data || data.length === 0) continue;

    // Detect Title in Row 0 or first non-empty row
    let sheetTitle = "";
    let headerRowIdx = -1;

    for (let r = 0; r < Math.min(10, data.length); r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;
      
      const firstCell = String(row[0] || "").trim();
      if (!sheetTitle && firstCell && row.length === 1) {
        sheetTitle = firstCell;
      }

      // Check if this row is the column header (Admission No, Name, etc.)
      const rowText = row.map((c) => String(c || "").toLowerCase()).join(" ");
      if (
        rowText.includes("admission") ||
        rowText.includes("adm") ||
        rowText.includes("reg no") ||
        rowText.includes("reg. no") ||
        rowText.includes("s/n") ||
        rowText.includes("name")
      ) {
        headerRowIdx = r;
        break;
      }
    }

    // Default to Row 1 as header if not explicitly found
    if (headerRowIdx === -1) {
      headerRowIdx = 1;
    }

    const standardClass = standardizeClassName(sheetName, sheetTitle);

    // Process data rows
    for (let r = headerRowIdx + 1; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;

      // Extract Admission No and Name Cells
      let rawRegNo = String(row[0] || "").trim();
      
      // In case col 0 is S/N and col 1 is Reg No
      let nameStartCol = 1;
      if (/^\d+$/.test(rawRegNo) && row.length > 2 && /^[A-Z]\d+/i.test(String(row[1] || "").trim())) {
        rawRegNo = String(row[1] || "").trim();
        nameStartCol = 2;
      }

      // Extract all name fragments (supports multiple columns or single box with spaces)
      const nameParts: string[] = [];
      for (let col = nameStartCol; col < row.length; col++) {
        const val = row[col];
        if (val !== null && val !== undefined && String(val).trim() !== "") {
          nameParts.push(String(val).trim());
        }
      }

      const combinedRawName = nameParts.join(" ").replace(/\s+/g, " ").trim();
      
      // If row has neither reg nor name, skip empty row
      if (!rawRegNo && !combinedRawName) continue;

      // Skip header repetitions
      if (rawRegNo.toLowerCase().includes("admission") || combinedRawName.toLowerCase().includes("name")) {
        continue;
      }

      const studentWarnings: string[] = [];
      let isAutoAssigned = false;
      let finalRegNumber = rawRegNo;

      // EDGE CASE 1: Missing Admission Number
      if (!finalRegNumber) {
        missingRegCount++;
        isAutoAssigned = true;
        // Generate clean provisional reg number based on class code and row
        const cleanClassCode = standardClass.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        finalRegNumber = `${cleanClassCode}-PENDING-${String(r + 1).padStart(3, "0")}`;
        
        studentWarnings.push(`Missing admission number in spreadsheet - provisional ${finalRegNumber} assigned`);
        warnings.push({
          sheet: sheetName,
          row: r + 1,
          regNumber: finalRegNumber,
          studentName: combinedRawName,
          message: `Missing admission number - assigned provisional ID ${finalRegNumber}`,
          type: "missing_reg",
        });
      }

      // EDGE CASE 2: Duplicate Admission Number
      if (seenRegNumbers.has(finalRegNumber)) {
        const existing = seenRegNumbers.get(finalRegNumber)!;
        duplicateCount++;

        // Disambiguate so Prisma unique constraint won't fail
        const cleanClassCode = standardClass.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        const disambiguatedReg = `${finalRegNumber}-${cleanClassCode}`;
        
        studentWarnings.push(
          `Duplicate Admission No: '${finalRegNumber}' was already used by ${existing.student.fullName} in ${existing.student.class}. Assigned '${disambiguatedReg}' to avoid database collision.`
        );
        warnings.push({
          sheet: sheetName,
          row: r + 1,
          regNumber: finalRegNumber,
          studentName: combinedRawName,
          message: `Duplicate Admission No '${finalRegNumber}' also found in ${existing.student.class} (${existing.student.fullName}). Disambiguated as '${disambiguatedReg}'.`,
          type: "duplicate_reg",
        });

        finalRegNumber = disambiguatedReg;
      }

      // Format Student Name & Tags
      const { fullName, tags } = normalizeStudentName(combinedRawName);

      // Infer Gender
      const gender = inferGender(fullName, standardClass);

      // Calculate Class Term Bill (dynamic based on configured fee schedule)
      const totalTermBill = getBillForClass(standardClass, feeStructure);

      // Infer Parent Name
      const parentName = inferParentName(fullName);

      const parsedStudent: ParsedStudentItem = {
        index: parsedStudents.length + 1,
        sheetName,
        originalRow: r + 1,
        regNumber: finalRegNumber,
        isAutoAssignedReg: isAutoAssigned,
        fullName,
        class: standardClass,
        gender,
        parentName,
        parentPhone: "",
        parentEmail: "",
        totalTermBill,
        tags,
        warnings: studentWarnings,
      };

      seenRegNumbers.set(finalRegNumber, {
        student: parsedStudent,
        sheet: sheetName,
        row: r + 1,
      });

      parsedStudents.push(parsedStudent);

      // Update class counter
      classCountMap.set(standardClass, (classCountMap.get(standardClass) || 0) + 1);
    }
  }

  // Generate class summaries sorted by school level
  const classOrder = [
    "Pre-Nursery", "Nursery 1", "Nursery 2",
    "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6",
    "JSS 1", "JSS 2", "JSS 3",
    "SS 1", "SS 2", "SS 3",
  ];

  const classSummaries: ClassSummary[] = Array.from(classCountMap.entries())
    .map(([name, count]) => {
      const bill = getBillForClass(name, feeStructure);
      return {
        name,
        count,
        level: name.split(" ")[0] || "General",
        termBill: bill,
      };
    })
    .sort((a, b) => {
      const getIndex = (str: string) => {
        const found = classOrder.findIndex((co) => str.startsWith(co));
        return found === -1 ? 99 : found;
      };
      const idxA = getIndex(a.name);
      const idxB = getIndex(b.name);
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name);
    });

  return {
    filename,
    totalStudents: parsedStudents.length,
    classes: classSummaries,
    duplicateCount,
    missingRegCount,
    warningCount: warnings.length,
    warnings,
    students: parsedStudents,
  };
}

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PostgreSQL database migration for Al-Furqan Pay...");

  const dbFilePath = path.join(process.cwd(), "data", "alfurqan-db.json");
  let jsonDB: any = null;

  try {
    const raw = await fs.readFile(dbFilePath, "utf-8");
    jsonDB = JSON.parse(raw);
    console.log(`📂 Read existing JSON database with ${jsonDB.students?.length || 0} students and ${jsonDB.receipts?.length || 0} receipts.`);
  } catch (err) {
    console.warn("⚠️ Could not read data/alfurqan-db.json, using defaults.");
  }

  // 1. School Profile
  const schoolData = jsonDB?.school || {
    name: "Al-Furqan International Academy",
    shortName: "Al-Furqan",
    motto: "Knowledge and Guidance",
    address: "Plot 14, Islamic Crescent, Off Airport Road, Gwarinpa, Abuja, Nigeria",
    email: "bursary@alfurqan.edu.ng",
    phone: "+234 803 456 7890 / +234 812 345 6789",
    currentTerm: "1st Term",
    currentSession: "2026/2027 Academic Session",
    bankName: "Jaiz Bank",
    accountNumber: "0012489301",
    accountName: "Al-Furqan International College - Fees",
    bursarName: "Alhaji Ibrahim S. Danladi",
    bursarPin: "1234",
    logoUrl: "/logo.png",
  };

  await prisma.schoolProfile.upsert({
    where: { id: "default" },
    update: {
      name: schoolData.name,
      shortName: schoolData.shortName || "Al-Furqan",
      motto: schoolData.motto || "Knowledge and Guidance",
      address: schoolData.address,
      email: schoolData.email,
      phone: schoolData.phone,
      currentTerm: schoolData.currentTerm,
      currentSession: schoolData.currentSession,
      bankName: schoolData.bankName,
      accountNumber: schoolData.accountNumber,
      accountName: schoolData.accountName,
      bursarName: schoolData.bursarName,
      bursarPin: schoolData.bursarPin || "1234",
      logoUrl: schoolData.logoUrl || "/logo.png",
    },
    create: {
      id: "default",
      name: schoolData.name,
      shortName: schoolData.shortName || "Al-Furqan",
      motto: schoolData.motto || "Knowledge and Guidance",
      address: schoolData.address,
      email: schoolData.email,
      phone: schoolData.phone,
      currentTerm: schoolData.currentTerm,
      currentSession: schoolData.currentSession,
      bankName: schoolData.bankName,
      accountNumber: schoolData.accountNumber,
      accountName: schoolData.accountName,
      bursarName: schoolData.bursarName,
      bursarPin: schoolData.bursarPin || "1234",
      logoUrl: schoolData.logoUrl || "/logo.png",
    },
  });
  console.log("✅ School profile seeded into PostgreSQL.");

  // 2. Staff Users
  const staffUsers = [
    {
      id: "usr_bursar",
      name: "Alhaji Ibrahim S. Danladi",
      email: "bursar@alfurqan.edu.ng",
      role: "Bursar",
      pin: "1234",
      password: "bursar2026",
      title: "Chief Bursar & Head of Finance",
    },
    {
      id: "usr_admin",
      name: "Dr. Shehu Danladi",
      email: "admin@alfurqan.edu.ng",
      role: "Admin",
      pin: "9988",
      password: "admin2026",
      title: "Principal & College Director",
    },
  ];

  for (const staff of staffUsers) {
    await prisma.staffUser.upsert({
      where: { email: staff.email },
      update: staff,
      create: staff,
    });
  }
  console.log(`✅ ${staffUsers.length} Staff users seeded.`);

  // 3. Students
  if (jsonDB?.students && Array.isArray(jsonDB.students)) {
    for (const s of jsonDB.students) {
      await prisma.student.upsert({
        where: { regNumber: s.regNumber },
        update: {
          fullName: s.fullName,
          class: s.class,
          gender: s.gender || "Male",
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          parentEmail: s.parentEmail,
          totalTermBill: Number(s.totalTermBill) || 165000,
          totalPaid: Number(s.totalPaid) || 0,
          balanceRemaining: Number(s.balanceRemaining) || 0,
          status: s.status || "UNPAID",
          lastPaymentDate: s.lastPaymentDate,
        },
        create: {
          id: s.id,
          regNumber: s.regNumber,
          fullName: s.fullName,
          class: s.class,
          gender: s.gender || "Male",
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          parentEmail: s.parentEmail,
          totalTermBill: Number(s.totalTermBill) || 165000,
          totalPaid: Number(s.totalPaid) || 0,
          balanceRemaining: Number(s.balanceRemaining) || 0,
          status: s.status || "UNPAID",
          lastPaymentDate: s.lastPaymentDate,
        },
      });
    }
    console.log(`✅ ${jsonDB.students.length} Students migrated to PostgreSQL.`);
  }

  // 4. Receipts & Items
  if (jsonDB?.receipts && Array.isArray(jsonDB.receipts)) {
    for (const r of jsonDB.receipts) {
      // Find matching student
      let student = await prisma.student.findUnique({
        where: { id: r.studentId },
      });
      if (!student) {
        student = await prisma.student.findUnique({
          where: { regNumber: r.regNumber },
        });
      }
      if (!student) continue;

      const receipt = await prisma.receipt.upsert({
        where: { receiptNumber: r.receiptNumber },
        update: {
          amountPaid: Number(r.amountPaid),
          totalTermBill: Number(r.totalTermBill),
          previousTotalPaid: Number(r.previousTotalPaid),
          newTotalPaid: Number(r.newTotalPaid),
          balanceRemaining: Number(r.balanceRemaining),
          paymentStatus: r.paymentStatus,
          paymentMethod: r.paymentMethod,
          bankReference: r.bankReference,
          term: r.term,
          session: r.session,
          date: r.date,
          issuedBy: r.issuedBy,
          qrCodeDataUrl: r.qrCodeDataUrl,
          securityHash: r.securityHash,
          notes: r.notes,
          isVoided: !!r.isVoided,
          voidReason: r.voidReason,
          voidedAt: r.voidedAt ? new Date(r.voidedAt) : null,
          voidedBy: r.voidedBy,
        },
        create: {
          id: r.id,
          receiptNumber: r.receiptNumber,
          studentId: student.id,
          regNumber: r.regNumber,
          studentName: r.studentName,
          studentClass: r.studentClass,
          parentName: r.parentName,
          parentPhone: r.parentPhone,
          parentEmail: r.parentEmail,
          amountPaid: Number(r.amountPaid),
          totalTermBill: Number(r.totalTermBill),
          previousTotalPaid: Number(r.previousTotalPaid),
          newTotalPaid: Number(r.newTotalPaid),
          balanceRemaining: Number(r.balanceRemaining),
          paymentStatus: r.paymentStatus,
          paymentMethod: r.paymentMethod,
          bankReference: r.bankReference,
          term: r.term,
          session: r.session,
          date: r.date,
          issuedBy: r.issuedBy,
          qrCodeDataUrl: r.qrCodeDataUrl,
          securityHash: r.securityHash,
          notes: r.notes,
          isVoided: !!r.isVoided,
          voidReason: r.voidReason,
          voidedAt: r.voidedAt ? new Date(r.voidedAt) : null,
          voidedBy: r.voidedBy,
        },
      });

      // Clear old items and recreate
      await prisma.receiptItem.deleteMany({
        where: { receiptId: receipt.id },
      });

      if (r.items && Array.isArray(r.items)) {
        for (const item of r.items) {
          await prisma.receiptItem.create({
            data: {
              receiptId: receipt.id,
              name: item.name,
              category: item.category,
              amount: Number(item.amount),
              description: item.description,
            },
          });
        }
      }
    }
    console.log(`✅ ${jsonDB.receipts.length} Receipts & Items migrated to PostgreSQL.`);
  }

  // 5. Audit Log
  await prisma.auditLog.create({
    data: {
      action: "DATABASE_MIGRATION",
      performedBy: "System Migration",
      details: JSON.stringify({
        source: "alfurqan-db.json",
        target: "PostgreSQL alfurqan_pay",
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log("🎉 PostgreSQL Database migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

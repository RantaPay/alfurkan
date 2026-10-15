require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

async function createBackup(reason = "DEVELOPER_CLI") {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, "-");
  const filename = `backup_${timestampStr}_${reason.toLowerCase()}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  console.log("Fetching database snapshot...");
  const [receipts, students, auditLogs, schoolProfile] = await Promise.all([
    prisma.receipt.findMany({
      include: { items: true },
      orderBy: { timestamp: "asc" },
    }),
    prisma.student.findMany({
      orderBy: { fullName: "asc" },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "asc" },
    }),
    prisma.schoolProfile.findUnique({
      where: { id: "default" },
    }),
  ]);

  const payload = {
    version: "1.0",
    createdAt: now.toISOString(),
    reason,
    stats: {
      receiptCount: receipts.length,
      studentCount: students.length,
      auditLogCount: auditLogs.length,
    },
    data: {
      schoolProfile,
      students,
      receipts,
      auditLogs,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  fs.writeFileSync(filepath, jsonString, "utf8");

  console.log(`\n🎉 Backup saved successfully!`);
  console.log(`Location: ${filepath}`);
  console.log(`Size: ${(Buffer.byteLength(jsonString) / 1024).toFixed(1)} KB`);
  console.log(`Receipts saved: ${receipts.length}`);
  console.log(`Students saved: ${students.length}`);
  console.log(`Audit Logs saved: ${auditLogs.length}`);
}

createBackup()
  .catch((e) => {
    console.error("Backup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

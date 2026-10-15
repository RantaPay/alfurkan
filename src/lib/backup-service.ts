import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

/**
 * Ensures backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export interface BackupMetadata {
  filename: string;
  filepath: string;
  sizeBytes: number;
  timestamp: string;
  reason: string;
  counts: {
    receipts: number;
    students: number;
    auditLogs: number;
  };
}

/**
 * Creates an immutable full snapshot backup of all receipts, students, audit logs, and settings
 */
export async function createDatabaseBackup(reason = "MANUAL"): Promise<BackupMetadata> {
  ensureBackupDir();

  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, "-");
  const filename = `backup_${timestampStr}_${reason.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Fetch all core datasets
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

  const backupPayload = {
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

  const jsonString = JSON.stringify(backupPayload, null, 2);
  fs.writeFileSync(filepath, jsonString, "utf8");

  // Record backup creation in AuditLog
  try {
    await prisma.auditLog.create({
      data: {
        action: "BACKUP_CREATED",
        performedBy: "SYSTEM_AUTOMATION",
        details: JSON.stringify({
          filename,
          reason,
          receiptCount: receipts.length,
          studentCount: students.length,
          sizeBytes: Buffer.byteLength(jsonString),
        }),
      },
    });
  } catch (err) {
    console.warn("Could not log backup to AuditLog:", err);
  }

  // Keep latest 30 backups, prune older
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("backup_") && f.endsWith(".json"))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      for (const oldFile of files.slice(30)) {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, oldFile.name));
        } catch {}
      }
    }
  } catch {}

  return {
    filename,
    filepath,
    sizeBytes: Buffer.byteLength(jsonString),
    timestamp: now.toISOString(),
    reason,
    counts: {
      receipts: receipts.length,
      students: students.length,
      auditLogs: auditLogs.length,
    },
  };
}

/**
 * Lists available backups
 */
export function listBackups(): BackupMetadata[] {
  ensureBackupDir();
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup_") && f.endsWith(".json"));

  const list: BackupMetadata[] = [];
  for (const f of files) {
    try {
      const fullPath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(fullPath);
      list.push({
        filename: f,
        filepath: fullPath,
        sizeBytes: stat.size,
        timestamp: stat.mtime.toISOString(),
        reason: f.split("_")[2] || "SYSTEM",
        counts: { receipts: 0, students: 0, auditLogs: 0 },
      });
    } catch {}
  }

  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

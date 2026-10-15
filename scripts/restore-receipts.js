require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const QRCode = require("qrcode");

const prisma = new PrismaClient();

const receiptDefinitions = [
  {
    receiptNumber: "2026-27/0001",
    studentRegNumber: "J1205",
    amountPaid: 30000,
    paymentMethod: "Bank Transfer",
    bankName: "Ja'iz Bank Plc",
    timestamp: new Date("2026-10-13T11:51:38.857Z"),
    date: "13 Oct 2026",
    issuedBy: "Administrator",
    bankReference: "TRF/NIP/513885",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0002",
    studentRegNumber: "B1243",
    amountPaid: 22500,
    paymentMethod: "Bank Transfer",
    bankName: "Ja'iz Bank Plc",
    timestamp: new Date("2026-10-13T11:58:07.559Z"),
    date: "13 Oct 2026",
    issuedBy: "Administrator",
    bankReference: "TRF/NIP/580755",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0003",
    studentRegNumber: "B1894",
    amountPaid: 22500,
    paymentMethod: "Bank Transfer",
    bankName: "Ja'iz Bank Plc",
    timestamp: new Date("2026-10-13T11:59:04.327Z"),
    date: "13 Oct 2026",
    issuedBy: "Administrator",
    bankReference: "TRF/NIP/590432",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0004",
    studentRegNumber: "N1642",
    amountPaid: 20000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T13:10:38.804Z"),
    date: "13 Oct 2026",
    issuedBy: "Administrator",
    bankReference: "TRF/NIP/103880",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0005",
    studentRegNumber: "B1829",
    amountPaid: 24000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T12:00:00.000Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/970619",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0006",
    studentRegNumber: "S829",
    amountPaid: 97500,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T15:49:08.703Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/490870",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0007",
    studentRegNumber: "J1151",
    amountPaid: 10000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T16:06:55.879Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/065587",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0008",
    studentRegNumber: "S883",
    amountPaid: 97500,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T16:22:48.193Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/224819",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0009",
    studentRegNumber: "J1128",
    amountPaid: 55000,
    paymentMethod: "Bank Transfer",
    bankName: "Ja'iz Bank Plc",
    timestamp: new Date("2026-10-13T16:28:16.336Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/281633",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0010",
    studentRegNumber: "S889",
    amountPaid: 97500,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T16:30:58.059Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/305805",
    isVoided: true,
    voidReason: "wrong deposit date",
    voidedAt: new Date("2026-10-13T16:35:28.617Z"),
    voidedBy: "Aminu S. Boro",
  },
  {
    receiptNumber: "2026-27/0011",
    studentRegNumber: "S889",
    amountPaid: 97500,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T16:37:29.843Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/372984",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0012",
    studentRegNumber: "S974",
    amountPaid: 65000,
    paymentMethod: "Bank Transfer",
    bankName: "Ja'iz Bank Plc",
    timestamp: new Date("2026-10-13T16:40:40.785Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/404078",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0013",
    studentRegNumber: "S742",
    amountPaid: 97500,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T16:45:17.135Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/451713",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0014",
    studentRegNumber: "S977",
    amountPaid: 78000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-13T16:48:37.939Z"),
    date: "13 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/483793",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0015",
    studentRegNumber: "J1151",
    amountPaid: 20000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-14T14:01:50.978Z"),
    date: "14 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/015097",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0016",
    studentRegNumber: "B1848",
    amountPaid: 45000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-14T16:14:46.031Z"),
    date: "14 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/144603",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0017",
    studentRegNumber: "P476",
    amountPaid: 40000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-14T16:16:16.650Z"),
    date: "14 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/161665",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0018",
    studentRegNumber: "B1720",
    amountPaid: 24000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-14T16:38:18.469Z"),
    date: "14 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/381846",
    isVoided: false,
  },
  {
    receiptNumber: "2026-27/0019",
    studentRegNumber: "B1961",
    amountPaid: 24000,
    paymentMethod: "Bank Transfer",
    bankName: "Access Bank Plc",
    timestamp: new Date("2026-10-14T16:39:32.319Z"),
    date: "14 Oct 2026",
    issuedBy: "Aminu S. Boro",
    bankReference: "TRF/NIP/393231",
    isVoided: false,
  },
];

async function main() {
  console.log("Starting restoration of 19 receipts...");

  // Student cumulative payments tracker
  const studentPaidTracker = {};

  for (const def of receiptDefinitions) {
    const student = await prisma.student.findUnique({
      where: { regNumber: def.studentRegNumber },
    });

    if (!student) {
      console.error(`ERROR: Student with regNumber ${def.studentRegNumber} not found!`);
      continue;
    }

    const prevTotalPaid = studentPaidTracker[student.id] || 0;
    const effectiveBill = student.totalTermBill;

    let newTotalPaid;
    let balanceRemaining;
    let paymentStatus;

    if (def.isVoided) {
      newTotalPaid = def.amountPaid;
      balanceRemaining = 0;
      paymentStatus = "FULL";
    } else {
      newTotalPaid = prevTotalPaid + def.amountPaid;
      balanceRemaining = Math.max(0, effectiveBill - newTotalPaid);
      paymentStatus = balanceRemaining === 0 ? "FULL" : "PARTIAL";
      studentPaidTracker[student.id] = newTotalPaid;
    }

    // QR Code
    const verifyUrl = `https://alfurqan.edu.ng/verify/${def.receiptNumber}`;
    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 200,
        color: { dark: "#075E54", light: "#ffffff" },
      });
    } catch (e) {
      console.warn("QR generation warning:", e.message);
    }

    const securityHash = `AIA-HASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const defaultNotes = `${paymentStatus === "FULL" ? "Full payment cleared" : "Partial payment recorded"}. Verified by Accounts.`;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber: def.receiptNumber,
        student: { connect: { id: student.id } },
        regNumber: student.regNumber,
        studentName: student.fullName,
        studentClass: student.class,
        parentName: student.parentName,
        parentPhone: student.parentPhone || "",
        parentEmail: student.parentEmail || null,
        amountPaid: def.amountPaid,
        totalTermBill: effectiveBill,
        previousTotalPaid: prevTotalPaid,
        newTotalPaid: newTotalPaid,
        balanceRemaining: balanceRemaining,
        paymentStatus: paymentStatus,
        paymentMethod: def.paymentMethod,
        bankReference: def.bankReference,
        bankName: def.bankName,
        term: "1st Term",
        session: "2026/2027 Session",
        date: def.date,
        timestamp: def.timestamp,
        issuedBy: def.issuedBy,
        qrCodeDataUrl: qrCodeDataUrl,
        securityHash: securityHash,
        notes: defaultNotes,
        isVoided: def.isVoided,
        voidReason: def.voidReason || null,
        voidedAt: def.voidedAt || null,
        voidedBy: def.voidedBy || null,
        items: {
          create: [
            {
              name: "Tuition / School Fees",
              category: "Tuition",
              amount: def.amountPaid,
            },
          ],
        },
      },
    });

    // Update student if non-voided
    if (!def.isVoided) {
      await prisma.student.update({
        where: { id: student.id },
        data: {
          totalPaid: newTotalPaid,
          balanceRemaining: balanceRemaining,
          status: balanceRemaining === 0 ? "FULL" : "PARTIAL",
          lastPaymentDate: def.date,
        },
      });
    }

    console.log(
      `✓ Restored receipt ${def.receiptNumber} for ${student.fullName} (${student.regNumber}) - ₦${def.amountPaid} [${def.isVoided ? "VOIDED" : paymentStatus}]`
    );
  }

  const finalReceiptCount = await prisma.receipt.count();
  console.log(`\n🎉 Restoration completed successfully! Total receipts in DB: ${finalReceiptCount}`);
}

main()
  .catch((e) => {
    console.error("Restoration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

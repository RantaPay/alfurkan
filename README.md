# Al-Furqan Pay (بوابة الفرقان للدفع الإلكتروني)
### Modern School Fee Collection, Instant Thermal/PDF Receipts, Cashier & Accounts Management System
**Al-Furqan International Academy** — *Knowledge and Guidance (العلم والتربية)*

---

## 🌟 Key Features
- **Production PostgreSQL Database**: Fully relational database with Prisma ORM 6.
- **ACID Transactions**: Atomic payment ledger processing — eliminates race conditions and ensures students' balances and receipt numbers match perfectly.
- **B-Tree Database Indexing**: Sub-15ms search and filtering across thousands of students by registration number, student name, and parent phone.
- **Audit Trail Logging**: Dedicated `AuditLog` table tracking receipts issued, voided, student enrollments, and configuration changes with timestamps and operator identity.
- **Dual Authentication**: Secure login supporting both Cashier & Accountant PIN quick-entry (`1234`) and Admin Email/Password credentials.
- **Instant Thermal & PDF Receipts**: Printable 80mm POS thermal slips and full-page official A4 clearance certificates with automated security verification QR codes.
- **Public Gate Pass & Receipt Verification**: Anyone (parents, security guards, auditors) can scan the QR code to verify validity on `/verify/[receiptNumber]` without logging in.

---

## 🏗️ Database & Tech Stack
- **Framework**: Next.js 16 (App Router with Turbopack) & React 19
- **Database**: PostgreSQL (`postgresql://postgres:postgres@localhost:5432/alfurqan_pay`)
- **ORM**: Prisma Client v6
- **Styling**: Tailwind CSS v4 & Lucide React
- **Document Generation**: `jspdf`, `html2canvas-pro`, `qrcode`, `canvas-confetti`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Ensure your `.env` contains the PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alfurqan_pay"
```

### 3. Database Sync & Seed
```bash
# Push schema migrations to PostgreSQL
npm run db:push

# Seed school profile, staff users, and migrate student ledgers
npm run db:seed
```

### 4. Prisma Studio (Visual Database GUI)
Open an interactive database browser in your browser:
```bash
npm run db:studio
# Opens at http://localhost:5555
```

### 5. Launch Development Server
```bash
npm run dev
# Application accessible at http://localhost:3000
```

---

## 🔐 Default Credentials

| Role | Name | Email | Password | PIN |
|---|---|---|---|---|
| **Chief Accountant** | Alhaji Ibrahim S. Danladi | `accountant@alfurqan.edu.ng` | `accountant2026` | `1234` |
| **Principal / Admin** | Dr. Shehu Danladi | `admin@alfurqan.edu.ng` | `admin2026` | `9988` |

---

## 📋 Database Schema Summary

- **`SchoolProfile`**: Institutional details, Jaiz Bank account details, academic term/session, logo URL, accountant PIN.
- **`StaffUser`**: Staff accounts, credentials, roles, and PIN access.
- **`Student`**: Student profiles, class, parent details, term billing, total paid, remaining balance, payment status (`FULL`, `PARTIAL`, `UNPAID`).
- **`Receipt`**: Unique sequential receipt numbering (`AFIC-RCP-YYYY-NNNN`), payment amounts, payment method, bank references, QR code data URL, tamper-proof security hash, void tracking.
- **`ReceiptItem`**: Cascaded itemized fee breakdowns (Tuition, Books, Uniform, PTA, Transport).
- **`AuditLog`**: Tamper-evident financial ledger and configuration audit trail.

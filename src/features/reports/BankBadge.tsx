import type { Student } from "@/lib/types";
import { Landmark } from "lucide-react";
// Helper to style bank badge
export function BankBadge({ student }: { student: Student }) {
  if (student.status === "UNPAID" && (!student.paidBanks || student.paidBanks.length === 0)) {
    return <span className="text-slate-400 font-mono text-xs">—</span>;
  }

  const banks = student.paidBanks && student.paidBanks.length > 0
    ? student.paidBanks
    : student.paymentBank && student.paymentBank !== "—"
      ? student.paymentBank.split(", ").filter(Boolean)
      : [];

  if (banks.length === 0) {
    return <span className="text-slate-400 font-mono text-xs">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {banks.map((b, i) => {
        const lower = b.toLowerCase();
        let colorClass = "bg-slate-100 text-slate-700 border-slate-200";

        if (lower.includes("gtb")) {
          colorClass = "bg-orange-50 text-orange-800 border-orange-200";
        } else if (lower.includes("jaiz")) {
          colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
        } else if (lower.includes("zenith")) {
          colorClass = "bg-rose-50 text-rose-800 border-rose-200";
        } else if (lower.includes("taj")) {
          colorClass = "bg-teal-50 text-teal-800 border-teal-200";
        } else if (lower.includes("first")) {
          colorClass = "bg-blue-50 text-blue-800 border-blue-200";
        } else if (lower.includes("cash")) {
          colorClass = "bg-amber-50 text-amber-800 border-amber-200";
        }

        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border tracking-tight ${colorClass}`}
          >
            <Landmark className="h-3 w-3 shrink-0" />
            <span>{b}</span>
          </span>
        );
      })}
    </div>
  );
}


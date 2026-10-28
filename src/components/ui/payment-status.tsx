import type { PaymentStatus as Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export const PAYMENT_STATUS_LABELS: Record<Status, string> = { FULL: "Paid in full", PARTIAL: "Part paid", UNPAID: "Unpaid" };
export function PaymentStatus({ status, voided = false }: { status: Status; voided?: boolean }) {
  return <span className={cn("inline-flex whitespace-nowrap items-center rounded-md px-2 py-1 text-xs font-medium", voided ? "bg-rose-50 text-rose-800" : status === "FULL" ? "bg-emerald-50 text-emerald-800" : status === "PARTIAL" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600")}>{voided ? "Cancelled" : PAYMENT_STATUS_LABELS[status]}</span>;
}

import { cn } from "@/lib/utils";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export function InlineNotice({ children, tone = "error", onRetry }: { children: ReactNode; tone?: "error" | "success" | "info"; onRetry?: () => void }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-700")}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      {onRetry && <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 font-semibold hover:underline"><RefreshCw className="h-3.5 w-3.5" />Try again</button>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mx-auto flex max-w-sm flex-col items-center px-5 py-12 text-center"><Inbox className="mb-4 h-7 w-7 text-slate-400" aria-hidden="true" /><p className="font-semibold text-slate-900">{title}</p>{description && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>}{action && <div className="mt-5">{action}</div>}</div>;
}

export function LoadingRows({ rows = 4, label = "Loading records" }: { rows?: number; label?: string }) {
  return <div role="status" aria-label={label} className="space-y-4 py-5"><span className="sr-only">{label}</span>{Array.from({ length: rows }, (_, index) => <div key={index} className="flex gap-5"><span className="skeleton h-4 w-1/3" /><span className="skeleton h-4 flex-1" /><span className="skeleton h-4 w-1/6" /></div>)}</div>;
}

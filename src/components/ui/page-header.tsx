import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>{description && <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-slate-500">{description}</p>}</div>{actions && <div className="flex flex-wrap items-center gap-2 sm:pt-1">{actions}</div>}</div>;
}

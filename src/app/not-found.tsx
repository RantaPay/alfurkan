import Link from "next/link";
export default function NotFound() {
  return <main className="flex min-h-dvh items-center justify-center px-6"><div className="max-w-md"><p className="text-sm font-semibold text-brand">Alfurqan Pay · 404</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1><p className="mt-3 text-slate-500">This page may have moved, or the address may be incomplete.</p><Link href="/" className="button-primary mt-6">Back to overview</Link></div></main>;
}

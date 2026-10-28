"use client";

import { Dialog } from "@/components/ui/dialog";
import { useApiResource } from "@/features/shared/useApiResource";
import { useAuth } from "@/lib/auth-context";
import type { SchoolProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BarChart3, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Receipt, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarLayoutProps {
  children: React.ReactNode;
  onOpenIssueModal?: () => void;
  schoolName?: string;
  currentTerm?: string;
  logoUrl?: string;
}

const navigation = [
  { label: "Accounts", items: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Receipts", href: "/receipts", icon: Receipt },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Students", href: "/students", icon: Users },
  ] },
  { label: "Administration", items: [{ name: "Settings", href: "/settings", icon: Settings }] },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="space-y-7 px-3 py-6">
    {navigation.map((group) => <div key={group.label}>
      <p className="mb-2 px-3 text-[11px] font-medium tracking-wide text-slate-400">{group.label}</p>
      <ul className="space-y-1">{group.items.map(({ name, href, icon: Icon }) => {
        const active = href === "/" ? pathname === href : pathname.startsWith(href);
        return <li key={href}><Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors", active ? "bg-emerald-50 font-semibold text-[#075E54]" : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900")}><Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />{name}</Link></li>;
      })}</ul>
    </div>)}
  </nav>;
}

export function SidebarLayout({ children, onOpenIssueModal, schoolName: providedSchoolName, currentTerm: providedTerm, logoUrl: providedLogo }: SidebarLayoutProps) {
  const { data } = useApiResource<{ school: SchoolProfile }>("/api/settings");
  const schoolName = providedSchoolName || data?.school.name || "Alfurqan International Academy";
  const currentTerm = providedTerm || (data?.school ? `${data.school.currentTerm} · ${data.school.currentSession}` : "Loading academic period…");
  const logoUrl = providedLogo || data?.school.logoUrl || "/logo.png";
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setIsMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  const handleIssueClick = () => {
    setIsMobileOpen(false);
    if (onOpenIssueModal) onOpenIssueModal();
    else router.push("/?action=issue");
  };
  const initials = user?.name.split(" ").filter(Boolean).map((name) => name[0]).slice(0, 2).join("").toUpperCase() || "AF";

  return <div className="min-h-dvh bg-[#F8FAFC] text-slate-900">
    <a className="skip-link print:hidden" href="#main-content">Skip to content</a>
    <header className="sticky top-0 z-40 h-17 border-b border-slate-200 border-t-[3px] border-t-[#075E54] bg-white print:hidden">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setIsMobileOpen(true)} aria-label="Open navigation" aria-expanded={isMobileOpen} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
          <button type="button" onClick={() => setIsDesktopOpen((open) => !open)} aria-label={isDesktopOpen ? "Collapse navigation" : "Expand navigation"} aria-expanded={isDesktopOpen} className="hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:block">{isDesktopOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}</button>
          <Link href="/" className="flex min-w-0 items-center gap-3"><img src={logoUrl || "/logo.png"} alt={schoolName} className="h-9 w-9 shrink-0 object-contain" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900"><span className="hidden sm:inline">{schoolName}</span><span className="sm:hidden">Alfurqan Pay</span></p><p className="mt-0.5 text-[11px] text-slate-500">School accounts</p></div></Link>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <button type="button" onClick={handleIssueClick} className="button-accent"><Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Issue receipt</span><span className="sm:hidden">Receipt</span></button>
          {user ? <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-200 sm:pl-5">
            <span className="hidden h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-xs font-semibold text-[#075E54] sm:flex">{initials}</span>
            <div className="hidden xl:block"><p className="text-sm font-medium">{user.name}</p><p className="text-[11px] text-slate-500">{user.role}</p></div>
            <button type="button" onClick={() => logout()} aria-label="Sign out" title="Sign out" className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><LogOut className="h-4 w-4" /></button>
          </div> : <Link href="/login" className="text-sm font-medium text-[#075E54]">Sign in</Link>}
        </div>
      </div>
    </header>
    {isMobileOpen && <Dialog label="Navigation" onClose={() => setIsMobileOpen(false)} className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onClick={() => setIsMobileOpen(false)}>
      <aside className="flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-lg" onClick={(event) => event.stopPropagation()}>
        <div className="flex h-17 items-center justify-between border-b border-slate-200 px-5"><span className="text-sm font-semibold">Alfurqan Pay</span><button type="button" onClick={() => setIsMobileOpen(false)} aria-label="Close navigation" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        <div className="flex-1 overflow-y-auto"><NavigationLinks onNavigate={() => setIsMobileOpen(false)} /></div>
        <p className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">{currentTerm}</p>
      </aside>
    </Dialog>}
    <div className="flex">
      <aside inert={!isDesktopOpen} aria-label="Sidebar" className={cn("fixed bottom-0 left-0 top-17 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 print:hidden lg:flex", !isDesktopOpen && "-translate-x-full")}>
        <div className="flex-1 overflow-y-auto"><NavigationLinks /></div>
        <div className="border-t border-slate-100 px-6 py-5"><p className="text-[11px] text-slate-400">Academic period</p><p className="mt-1 text-xs font-medium text-slate-600">{currentTerm}</p></div>
      </aside>
      <div id="main-content" tabIndex={-1} className={cn("min-w-0 flex-1 outline-none transition-[padding] duration-200 print:pl-0", isDesktopOpen && "lg:pl-60")}>{children}</div>
    </div>
  </div>;
}

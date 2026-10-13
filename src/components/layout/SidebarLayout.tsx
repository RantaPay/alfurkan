"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Users,
  Settings,
  PlusCircle,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  QrCode,
  Sparkles,
} from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
  onOpenIssueModal?: () => void;
  schoolName?: string;
  currentTerm?: string;
  logoUrl?: string;
}

export function SidebarLayout({
  children,
  onOpenIssueModal,
  schoolName = "Alfurqan International Academy",
  currentTerm = "1st Term 2026/2027",
  logoUrl = "/logo.png",
}: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Desktop sidebar open/collapse state (default expanded)
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  // Mobile sidebar slide-out drawer state (default closed)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navigation Items (Vertical in Sidebar)
  const navGroups = [
    {
      group: "BURSARY & ACCOUNTS",
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Receipts", href: "/receipts", icon: Receipt },
        { name: "Debtor Reports", href: "/reports", icon: BarChart3 },
        { name: "Students", href: "/students", icon: Users },
      ],
    },
    {
      group: "ADMINISTRATION",
      items: [
        { name: "School Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  // Auto-close mobile drawer upon navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsDesktopOpen((prev) => !prev);
    } else {
      setIsMobileOpen((prev) => !prev);
    }
  };

  const handleIssueClick = () => {
    setIsMobileOpen(false);
    if (onOpenIssueModal) {
      onOpenIssueModal();
    } else {
      router.push("/?action=issue");
    }
  };

  const staffInitials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AF";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* ========================================================= */}
      {/* 1. STICKY TOP HEADER (Global Navigation & Branding)       */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 w-full h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs print:hidden">
        <div className="w-full px-4 sm:px-6 flex items-center justify-between h-full">
          {/* Left: Sidebar Toggle + School Crest & Name */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Sidebar Collapse / Slide-Out Toggle Button */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
              title={isDesktopOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-label="Toggle navigation sidebar"
            >
              <Menu className="h-5 w-5 lg:hidden" />
              <span className="hidden lg:inline-flex items-center">
                {isDesktopOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5 text-[#075E54]" />
                )}
              </span>
            </button>

            {/* School Crest Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-2xl border border-slate-200 p-0.5 bg-white shadow-xs group-hover:scale-105 transition-all overflow-hidden flex items-center justify-center shrink-0">
                <img src={logoUrl || "/logo.png"} alt={schoolName} className="h-full w-full object-contain" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 font-black text-slate-900 text-base sm:text-lg leading-tight">
                  <span className="line-clamp-1">{schoolName}</span>
                  <ShieldCheck className="h-4.5 w-4.5 text-[#075E54] shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                    Bursary &amp; Accounts
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{currentTerm}</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right: Issue New Receipt + Staff Profile & Logout */}
          <div className="flex items-center gap-3">
            {/* Primary Action: Issue New Receipt */}
            <button
              type="button"
              onClick={handleIssueClick}
              className="bg-[#FFB21D] hover:bg-[#EAA315] active:scale-95 text-slate-950 font-black text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Issue New Receipt</span>
              <span className="sm:hidden">Issue</span>
            </button>

            {/* Staff User Profile Card */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="h-9 w-9 rounded-full bg-[#075E54] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {staffInitials}
                </div>

                <div className="hidden sm:block text-left">
                  <div className="text-sm font-black text-slate-900 leading-tight">
                    {user.name.split(" ")[0]} {user.name.split(" ").slice(-1)[0]}
                  </div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    {user.role}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign Out of Portal"
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. BODY CONTAINER: SIDEBAR + MAIN CONTENT                */}
      {/* ========================================================= */}
      <div className="flex-1 flex relative">
        {/* ------------------------------------------------------- */}
        {/* A. MOBILE BACKDROP (When drawer is open on mobile)      */}
        {/* ------------------------------------------------------- */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ------------------------------------------------------- */}
        {/* B. MOBILE SLIDE-OUT DRAWER (Slides in from Left)        */}
        {/* ------------------------------------------------------- */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white flex flex-col border-r border-slate-200/90 shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out print:hidden ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Mobile Navigation"
        >
          {/* Mobile Drawer Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl border border-slate-200 p-0.5 bg-white shadow-xs overflow-hidden flex items-center justify-center shrink-0">
                <img src={logoUrl || "/logo.png"} alt={schoolName} className="h-full w-full object-contain" />
              </div>
              <span className="font-black text-slate-900 text-xs uppercase tracking-wide">
                Cashier & Accounts Menu
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          {/* Mobile Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-1.5">
                <div className="px-3.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-[#075E54] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <span className="h-2 w-2 rounded-full bg-emerald-300" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* ------------------------------------------------------- */}
        {/* C. DESKTOP PERMANENT / COLLAPSIBLE SIDEBAR             */}
        {/* ------------------------------------------------------- */}
        <aside
          className={`hidden lg:flex flex-col fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200/90 shadow-xs transition-transform duration-300 ease-in-out print:hidden ${
            isDesktopOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Desktop Navigation Sidebar"
        >
          {/* Vertical Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-7">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-1.5">
                <div className="px-3.5 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] font-bold transition-all ${
                        isActive
                          ? "bg-[#075E54] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <span className="h-2 w-2 rounded-full bg-emerald-300" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* ------------------------------------------------------- */}
        {/* D. MAIN CONTENT AREA                                    */}
        {/* ------------------------------------------------------- */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out print:pl-0 ${
            isDesktopOpen ? "lg:pl-64" : "lg:pl-0"
          }`}
        >
          <div className="flex-1 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

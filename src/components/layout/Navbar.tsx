"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Receipt,
  BarChart3,
  Users,
  Settings,
  PlusCircle,
  Building2,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  User as UserIcon,
} from "lucide-react";

interface NavbarProps {
  onOpenIssueModal?: () => void;
  schoolName?: string;
  currentTerm?: string;
  logoUrl?: string;
}

export function Navbar({
  onOpenIssueModal,
  schoolName = "Al-Furqan International College",
  currentTerm = "1st Term 2026/2027",
  logoUrl = "/logo.png",
}: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/", icon: Building2 },
    { name: "Receipts Ledger", href: "/receipts", icon: Receipt },
    { name: "Debtor Reports", href: "/reports", icon: BarChart3 },
    { name: "Students", href: "/students", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & School Header */}
          <Link href="/" className="flex items-center gap-3 group">
            {logoUrl ? (
              <div className="h-11 w-11 rounded-2xl border border-slate-200 p-1 bg-white shadow-xs group-hover:scale-105 transition-all overflow-hidden flex items-center justify-center">
                <img src={logoUrl} alt={schoolName} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#128C7E] flex items-center justify-center text-white shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-all">
                <span className="font-black text-xl tracking-wider">AF</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm sm:text-base leading-tight">
                <span>{schoolName}</span>
                <ShieldCheck className="h-4 w-4 text-[#075E54] shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Bursary & Digital Receipt OS
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentTerm}
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Header Button */}
          <div className="flex items-center gap-3">
            {onOpenIssueModal ? (
              <button
                type="button"
                onClick={onOpenIssueModal}
                className="bg-[#FFB21D] hover:bg-[#EAA315] active:scale-95 text-slate-900 text-xs sm:text-sm font-black px-4 sm:px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Issue New Receipt</span>
                <span className="sm:hidden">Issue</span>
              </button>
            ) : (
              <Link
                href="/?action=issue"
                className="bg-[#FFB21D] hover:bg-[#EAA315] active:scale-95 text-slate-900 text-xs sm:text-sm font-black px-4 sm:px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Issue New Receipt</span>
                <span className="sm:hidden">Issue</span>
              </Link>
            )}

            {/* Staff User Profile & Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-black text-slate-800 leading-tight">
                    {user.name.split(" ")[0]} {user.name.split(" ").slice(-1)[0]}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    {user.role}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign Out of Portal"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-slate-100 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

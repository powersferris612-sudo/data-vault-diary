import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Wallet, PieChart, Receipt, PiggyBank,
  BarChart3, CalendarDays, Target, Settings, Menu, X,
} from "lucide-react";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/budget", label: "Budget", icon: PieChart },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/savings", label: "Savings", icon: PiggyBank },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/all-months", label: "All Months", icon: CalendarDays },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [path]);

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface/40 backdrop-blur sticky top-0 h-screen">
        <Brand />
        <Nav path={path} />
        <Footer />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-display text-lg">h</div>
          <span className="font-display text-lg">habib · finance</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md hover:bg-surface-2"><Menu className="w-5 h-5" /></button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface border-r border-border flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-display text-lg">h</div>
                <span className="font-display text-lg">habib · finance</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-surface-2"><X className="w-5 h-5" /></button>
            </div>
            <Nav path={path} />
            <Footer />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="px-5 pt-6 pb-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display text-xl">h</div>
      <div>
        <div className="font-display text-xl leading-none">habib</div>
        <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">finance · v1</div>
      </div>
    </div>
  );
}

function Nav({ path }: { path: string }) {
  return (
    <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        const Icon = n.icon;
        return (
          <Link
            key={n.to} to={n.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{n.label}</span>
            {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  return (
    <div className="px-5 py-4 border-t border-border text-[11px] text-muted-foreground">
      Tracking since May 2026 · PKR
    </div>
  );
}

import { ClientOnly } from "@tanstack/react-router";

export function ClientGate({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <ClientOnly fallback={fallback}>{children}</ClientOnly>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground max-w-xl">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="px-5 sm:px-8 lg:px-12 py-8 max-w-7xl mx-auto">{children}</div>;
}

export function StatCard({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: "primary" | "danger" | "warning" | "investment" }) {
  const color =
    accent === "primary" ? "text-success" :
    accent === "danger" ? "text-danger" :
    accent === "warning" ? "text-warning" :
    accent === "investment" ? "text-investment" : "";
  return (
    <div className="card p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl tabular-nums ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground italic py-6 text-center">{children}</div>;
}

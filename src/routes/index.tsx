import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  loadProfile, loadYear, ensureMonth, totalExpenses, totalInvested,
  savedAmount, savingsRate, fmtMoney, fmtMoneyExact, BUDGET_LABELS, type Budget, MONTH_NAMES,
} from "@/lib/finance-store";
import { useCurrentMonth, useDataVersion } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, StatCard, Section } from "@/components/Primitives";
import { MonthYearSelector, mk } from "@/components/MonthYearSelector";
import { AlertCircle, CheckCircle2, ClipboardList, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Habib Finance" },
      { name: "description", content: "Monthly snapshot of income, budget, expenses, savings and investments." },
    ],
  }),
  component: () => <ClientGate fallback={<div className="p-10 text-muted-foreground">Loading…</div>}><Dashboard /></ClientGate>,
});

const PIE_COLORS = ["oklch(0.78 0.14 165)", "oklch(0.75 0.14 220)", "oklch(0.72 0.16 295)", "oklch(0.82 0.14 75)", "oklch(0.68 0.21 25)", "oklch(0.7 0.14 195)", "oklch(0.78 0.16 130)", "oklch(0.7 0.18 320)"];

function Dashboard() {
  useDataVersion();
  const profile = loadProfile();
  const { year, month, setYM } = useCurrentMonth();
  const monthData = useMemo(() => ensureMonth(year, month - 1), [year, month, useDataVersion]); // eslint-disable-line
  const m = monthData;

  const expensesTotal = totalExpenses(m);
  const invested = totalInvested(m);
  const saved = savedAmount(m);
  const rate = savingsRate(m);

  // Budget vs actual (lifestyle + fixed buckets only)
  const budgetCats: (keyof Budget)[] = ["parents","loans","travel","food","transport","shopping","mobile","misc"];
  const budgetVsActual = budgetCats.map(c => {
    const planned = (m.budget as any)[c] ?? 0;
    const actual = m.expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0);
    return { name: BUDGET_LABELS[c].split(" ")[0], planned, actual };
  });

  // Donut by category
  const byCat: Record<string, number> = {};
  for (const e of m.expenses) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
  const donut = Object.entries(byCat).map(([k, v]) => ({ name: BUDGET_LABELS[k as keyof Budget] || k, value: v }));

  // Reminder banner state
  const c = m.completeness;
  const completeCount = [c.incomeLogged, c.budgetSet, c.expensesAdded, c.investmentsLogged].filter(Boolean).length;
  const today = new Date();
  const isCurrentRealMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const banner = completeCount === 0
    ? { tone: "warn", text: `You haven't filled in your data for ${MONTH_NAMES[month-1]} ${year} yet.` }
    : completeCount < 4
      ? { tone: "info", text: `You started ${MONTH_NAMES[month-1]} ${year} but haven't finished — ${completeCount}/4 done.` }
      : { tone: "ok", text: `${MONTH_NAMES[month-1]} ${year} is fully up to date.${isCurrentRealMonth ? "" : ""}` };

  return (
    <PageContainer>
      <PageHeader
        title={`Hello, ${profile.name}.`}
        subtitle="Your money, in plain sight. Pick a month and stay on top of it."
        right={<MonthYearSelector year={year} month={month} onChange={setYM} />}
      />

      {/* Reminder banner */}
      <div className={`card p-4 mb-6 flex items-start gap-3 border-l-4 ${
        banner.tone === "warn" ? "border-l-warning" : banner.tone === "info" ? "border-l-accent" : "border-l-success"
      }`}>
        {banner.tone === "ok" ? <CheckCircle2 className="w-5 h-5 text-success mt-0.5" /> : <AlertCircle className="w-5 h-5 text-warning mt-0.5" />}
        <div className="flex-1">
          <div className="text-sm">{banner.text}</div>
          {banner.tone !== "ok" && (
            <div className="mt-2 flex flex-wrap gap-2">
              {!c.incomeLogged && <Link to="/income" className="chip hover:text-foreground">Add income →</Link>}
              {!c.budgetSet && <Link to="/budget" className="chip hover:text-foreground">Set budget →</Link>}
              {!c.expensesAdded && <Link to="/expenses" className="chip hover:text-foreground">Log expenses →</Link>}
              {!c.investmentsLogged && <Link to="/savings" className="chip hover:text-foreground">Log investments →</Link>}
            </div>
          )}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Income" value={fmtMoney(m.income.total)} sub={`Salary + extras`} accent="primary" />
        <StatCard label="Expenses" value={fmtMoney(expensesTotal)} sub={`${m.expenses.length} entries`} accent="danger" />
        <StatCard label="Saved" value={fmtMoney(saved + invested)} sub={`Inc. ${fmtMoney(invested)} invested`} accent="primary" />
        <StatCard label="Savings rate" value={`${rate}%`} sub={`Goal ${Math.round((profile.savingsGoal/Math.max(m.income.total,1))*100)}%`} accent={rate >= 30 ? "primary" : rate >= 15 ? "warning" : "danger"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Budget vs Actual */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Budget vs Actual</h2>
            <Link to="/budget" className="text-xs text-muted-foreground hover:text-foreground">Edit budget →</Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={budgetVsActual} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--color-muted) 50%, transparent)" }}
                  contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => fmtMoneyExact(Number(v))}
                />
                <Bar dataKey="planned" fill="var(--color-accent)" radius={[6, 6, 0, 0]} name="Planned" />
                <Bar dataKey="actual" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Where it went</h2>
          </div>
          <div className="h-72">
            {donut.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No expenses yet</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donut} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {donut.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoneyExact(Number(v))} />
                  <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Checklist + investments */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Section title={`${MONTH_NAMES[month-1]} Checklist`}>
          <ul className="space-y-2 text-sm">
            <ChecklistItem to="/income" done={c.incomeLogged} label="Income logged" />
            <ChecklistItem to="/budget" done={c.budgetSet} label="Budget planned" />
            <ChecklistItem to="/expenses" done={c.expensesAdded} label={`Expenses added (${m.expenses.length} entries · need 5+)`} />
            <ChecklistItem to="/savings" done={c.investmentsLogged} label="Investments updated" />
          </ul>
        </Section>

        <Section title="Investments this month" action={<Link to="/savings" className="text-xs text-muted-foreground hover:text-foreground">Open →</Link>}>
          <div className="grid grid-cols-2 gap-3">
            {(["emergencyFund","mutualFunds","govCertificates","stocks"] as const).map(k => (
              <div key={k} className="rounded-lg bg-surface-2 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{BUDGET_LABELS[k]}</div>
                <div className="font-display text-lg tabular-nums mt-1">{fmtMoney(m.investments[k].contributed)}</div>
                <div className="text-[11px] text-muted-foreground">total {fmtMoney(m.investments[k].totalToDate)}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Quick actions">
          <div className="grid grid-cols-1 gap-2">
            <Link to="/income" className="btn btn-ghost justify-start"><Plus className="w-4 h-4" /> Add income</Link>
            <Link to="/expenses" className="btn btn-ghost justify-start"><Plus className="w-4 h-4" /> Add expense</Link>
            <Link to="/savings" className="btn btn-ghost justify-start"><Plus className="w-4 h-4" /> Log investment</Link>
            <Link to="/all-months" className="btn btn-ghost justify-start"><ClipboardList className="w-4 h-4" /> All months</Link>
          </div>
        </Section>
      </div>

      <YearGlance year={year} />
    </PageContainer>
  );
}

function ChecklistItem({ to, done, label }: { to: any; done: boolean; label: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 px-3 py-2 -mx-3 rounded-md hover:bg-surface-2">
        <span className={`w-4 h-4 rounded border grid place-items-center text-[10px] ${done ? "bg-success border-success text-primary-foreground" : "border-border"}`}>
          {done ? "✓" : ""}
        </span>
        <span className={done ? "" : "text-muted-foreground"}>{label}</span>
      </Link>
    </li>
  );
}

function YearGlance({ year }: { year: number }) {
  const y = loadYear(year);
  const monthsArr = Array.from({ length: 12 }, (_, i) => {
    const k = mk(i + 1);
    const m = y.months[k];
    return { name: MONTH_NAMES[i].slice(0, 3), saved: m ? savedAmount(m) + totalInvested(m) : 0, has: !!m };
  });
  return (
    <Section title={`${year} at a glance`}>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={monthsArr}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(v)} />
            <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoneyExact(Number(v))} />
            <Bar dataKey="saved" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

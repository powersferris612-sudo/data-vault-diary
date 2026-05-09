import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ensureMonth, updateMonth, fmtMoney, fmtMoneyExact, BUDGET_LABELS, MONTH_NAMES, type Investments, loadProfile } from "@/lib/finance-store";
import { useCurrentMonth, useDataVersion } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, Section, StatCard } from "@/components/Primitives";
import { MonthYearSelector, mk } from "@/components/MonthYearSelector";

export const Route = createFileRoute("/savings")({
  head: () => ({ meta: [{ title: "Savings · Habib Finance" }, { name: "description", content: "Emergency fund and investment portfolios." }] }),
  component: () => <ClientGate><SavingsPage /></ClientGate>,
});

const KEYS: (keyof Investments)[] = ["emergencyFund","mutualFunds","govCertificates","stocks"];
const COLORS = ["oklch(0.78 0.14 165)", "oklch(0.72 0.16 295)", "oklch(0.75 0.14 220)", "oklch(0.82 0.14 75)"];

function SavingsPage() {
  useDataVersion();
  const profile = loadProfile();
  const { year, month, setYM } = useCurrentMonth();
  const m = useMemo(() => ensureMonth(year, month - 1), [year, month, useDataVersion]); // eslint-disable-line
  const monthKey = mk(month);
  const [draft, setDraft] = useState<Investments>(m.investments);

  useEffect(() => setDraft(m.investments), [year, month]); // eslint-disable-line

  const set = (k: keyof Investments, field: "contributed" | "totalToDate" | "returnRate", v: string) =>
    setDraft(d => ({ ...d, [k]: { ...d[k], [field]: Number(v) || 0 } }));

  const save = () => updateMonth(year, monthKey, x => ({ ...x, investments: draft }));

  const totalInvested = KEYS.reduce((s, k) => s + (draft[k].totalToDate || 0), 0);
  const monthlyContrib = KEYS.reduce((s, k) => s + (draft[k].contributed || 0), 0);
  const projectedValue = KEYS.reduce((s, k) => s + (draft[k].totalToDate * (1 + (draft[k].returnRate || 0) / 100)), 0);

  const donut = KEYS.map(k => ({ name: BUDGET_LABELS[k as keyof typeof BUDGET_LABELS], value: draft[k].totalToDate || 0 }));

  const emergencyTarget = 390000;
  const efPct = Math.min(100, Math.round((draft.emergencyFund.totalToDate / emergencyTarget) * 100));

  return (
    <PageContainer>
      <PageHeader title="Savings & Investments" subtitle={`${MONTH_NAMES[month-1]} ${year} portfolio`}
        right={<div className="flex gap-2 items-center"><MonthYearSelector year={year} month={month} onChange={setYM} /><button className="btn btn-primary" onClick={save}>Save</button></div>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Portfolio total" value={fmtMoney(totalInvested)} accent="investment" />
        <StatCard label="This month" value={fmtMoney(monthlyContrib)} accent="primary" />
        <StatCard label="Projected (1y)" value={fmtMoney(projectedValue)} accent="warning" sub="At entered return rates" />
        <StatCard label="Emergency fund" value={`${efPct}%`} sub={`${fmtMoneyExact(draft.emergencyFund.totalToDate)} / ${fmtMoneyExact(emergencyTarget)}`} accent={efPct >= 75 ? "primary" : "warning"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {KEYS.map((k, i) => (
            <Section key={k} title={BUDGET_LABELS[k as keyof typeof BUDGET_LABELS]} action={<span className="chip" style={{ color: COLORS[i] }}>● bucket</span>}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">This month contribution</label>
                  <input type="number" className="input mt-1 tabular-nums" value={draft[k].contributed} onChange={e => set(k, "contributed", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Total to date</label>
                  <input type="number" className="input mt-1 tabular-nums" value={draft[k].totalToDate} onChange={e => set(k, "totalToDate", e.target.value)} />
                </div>
                {k !== "emergencyFund" && (
                  <div>
                    <label className="text-xs text-muted-foreground">Annual return %</label>
                    <input type="number" className="input mt-1 tabular-nums" value={draft[k].returnRate || 0} onChange={e => set(k, "returnRate", e.target.value)} />
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                  Est. value: <span className="text-foreground tabular-nums">{fmtMoneyExact(draft[k].totalToDate * (1 + (draft[k].returnRate || 0) / 100))}</span>
                </div>
              </div>
            </Section>
          ))}
        </div>

        <Section title="Distribution">
          <div className="h-72">
            {totalInvested === 0 ? <div className="h-full grid place-items-center text-sm text-muted-foreground">No investments yet</div> : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donut} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {donut.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoneyExact(Number(v))} />
                  <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      <Section title="Emergency fund progress">
        <div className="text-xs text-muted-foreground mb-2">Target: {fmtMoneyExact(emergencyTarget)} (≈ 6 months of essentials, {profile.currency})</div>
        <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${efPct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{fmtMoneyExact(draft.emergencyFund.totalToDate)}</span>
          <span className="text-muted-foreground">{fmtMoneyExact(emergencyTarget)}</span>
        </div>
      </Section>
    </PageContainer>
  );
}

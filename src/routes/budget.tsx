import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ensureMonth, updateMonth, fmtMoney, fmtMoneyExact, BUDGET_LABELS, MONTH_NAMES, type Budget } from "@/lib/finance-store";
import { useCurrentMonth, useDataVersion } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, Section, StatCard } from "@/components/Primitives";
import { MonthYearSelector, mk } from "@/components/MonthYearSelector";

export const Route = createFileRoute("/budget")({
  head: () => ({ meta: [{ title: "Budget · Habib Finance" }, { name: "description", content: "Plan your monthly budget across categories." }] }),
  component: () => <ClientGate><BudgetPage /></ClientGate>,
});

const FIXED: (keyof Budget)[] = ["parents","loans","travel"];
const LIFESTYLE: (keyof Budget)[] = ["food","transport","shopping","mobile","misc"];
const SAVINGS: (keyof Budget)[] = ["emergencyFund","mutualFunds","govCertificates","stocks"];

function BudgetPage() {
  useDataVersion();
  const { year, month, setYM } = useCurrentMonth();
  const m = useMemo(() => ensureMonth(year, month - 1), [year, month, useDataVersion]); // eslint-disable-line
  const monthKey = mk(month);
  const [draft, setDraft] = useState<Budget>(m.budget);

  useEffect(() => setDraft(m.budget), [year, month]); // eslint-disable-line

  const total = (Object.entries(draft) as [keyof Budget, any][])
    .filter(([k]) => k !== "custom")
    .reduce((s, [, v]) => s + (Number(v) || 0), 0);
  const savingsTotal = SAVINGS.reduce((s, k) => s + (Number(draft[k]) || 0), 0);
  const fixedTotal = FIXED.reduce((s, k) => s + (Number(draft[k]) || 0), 0);
  const lifestyleTotal = LIFESTYLE.reduce((s, k) => s + (Number(draft[k]) || 0), 0);
  const remaining = (m.income.total || 0) - total;

  const set = (k: keyof Budget, v: string) => setDraft(d => ({ ...d, [k]: Number(v) || 0 }));
  const save = () => updateMonth(year, monthKey, x => ({ ...x, budget: draft }));

  return (
    <PageContainer>
      <PageHeader title="Budget" subtitle={`Plan for ${MONTH_NAMES[month-1]} ${year}`} right={
        <div className="flex gap-2 items-center">
          <MonthYearSelector year={year} month={month} onChange={setYM} />
          <button className="btn btn-primary" onClick={save}>Save plan</button>
        </div>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Income" value={fmtMoney(m.income.total)} accent="primary" />
        <StatCard label="Planned spend" value={fmtMoney(fixedTotal + lifestyleTotal)} accent="danger" />
        <StatCard label="Planned save" value={fmtMoney(savingsTotal)} accent="investment" />
        <StatCard label="Unallocated" value={fmtMoney(remaining)} accent={remaining < 0 ? "danger" : "primary"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <BudgetGroup title="Fixed obligations" keys={FIXED} draft={draft} onChange={set} />
        <BudgetGroup title="Lifestyle" keys={LIFESTYLE} draft={draft} onChange={set} />
        <BudgetGroup title="Savings & Investments" keys={SAVINGS} draft={draft} onChange={set} accent="investment" />
      </div>

      <div className="mt-6">
        <Section title="Total snapshot">
          <div className="text-sm text-muted-foreground">Total planned: <span className="text-foreground font-medium">{fmtMoneyExact(total)}</span></div>
        </Section>
      </div>
    </PageContainer>
  );
}

function BudgetGroup({ title, keys, draft, onChange, accent }: {
  title: string; keys: (keyof Budget)[]; draft: Budget;
  onChange: (k: keyof Budget, v: string) => void; accent?: "investment";
}) {
  const sum = keys.reduce((s, k) => s + (Number(draft[k]) || 0), 0);
  return (
    <Section title={title} action={<span className={`chip ${accent === "investment" ? "text-investment" : ""}`}>{fmtMoney(sum)}</span>}>
      <div className="space-y-3">
        {keys.map(k => (
          <div key={k} className="flex items-center gap-3">
            <label className="text-sm flex-1 text-muted-foreground">{BUDGET_LABELS[k]}</label>
            <input
              type="number"
              className="input max-w-[140px] text-right tabular-nums"
              value={(draft[k] as number) || 0}
              onChange={e => onChange(k, e.target.value)}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

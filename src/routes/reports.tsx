import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { loadYear, fmtMoney, fmtMoneyExact, MONTH_NAMES, totalExpenses, totalInvested, savedAmount, savingsRate, listAllYears } from "@/lib/finance-store";
import { useDataVersion } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, Section, StatCard } from "@/components/Primitives";
import { mk } from "@/components/MonthYearSelector";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Habib Finance" }, { name: "description", content: "Trends, insights and yearly overview." }] }),
  component: () => <ClientGate><ReportsPage /></ClientGate>,
});

function ReportsPage() {
  useDataVersion();
  const years = listAllYears();
  const [year, setYear] = useState(years[years.length - 1] || 2026);
  const y = useMemo(() => loadYear(year), [year, useDataVersion]); // eslint-disable-line

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const m = y.months[mk(i + 1)];
    return {
      month: MONTH_NAMES[i].slice(0, 3),
      income: m?.income.total || 0,
      expenses: m ? totalExpenses(m) : 0,
      saved: m ? savedAmount(m) + totalInvested(m) : 0,
      rate: m ? savingsRate(m) : 0,
      food: m ? m.expenses.filter(e => e.category === "food").reduce((s,e)=>s+e.amount,0) : 0,
      transport: m ? m.expenses.filter(e => e.category === "transport").reduce((s,e)=>s+e.amount,0) : 0,
      shopping: m ? m.expenses.filter(e => e.category === "shopping").reduce((s,e)=>s+e.amount,0) : 0,
      loans: m ? m.expenses.filter(e => e.category === "loans").reduce((s,e)=>s+e.amount,0) : 0,
      parents: m ? m.expenses.filter(e => e.category === "parents").reduce((s,e)=>s+e.amount,0) : 0,
    };
  });

  const sum = y.summary;
  const filledCount = Object.keys(y.months).length;
  const projected = filledCount ? Math.round((sum.totalSaved || 0) / filledCount * 12) : 0;

  // Insights
  const insights: string[] = [];
  const filled = monthly.filter(x => x.income > 0);
  if (filled.length >= 2) {
    const last = filled[filled.length - 1], prev = filled[filled.length - 2];
    if (last.food > prev.food) insights.push(`You spent ${fmtMoneyExact(last.food - prev.food)} more on food in ${last.month} vs ${prev.month}.`);
    if (last.rate > prev.rate) insights.push(`Your savings rate improved by ${last.rate - prev.rate}% this month.`);
    else if (last.rate < prev.rate) insights.push(`Your savings rate dropped by ${prev.rate - last.rate}% — review lifestyle spending.`);
  }
  if (sum.bestSavingMonth) insights.push(`Best saving month so far: ${sum.bestSavingMonth}.`);
  if (sum.worstSpendingMonth) insights.push(`Highest spending month: ${sum.worstSpendingMonth}.`);

  return (
    <PageContainer>
      <PageHeader title="Reports & insights" subtitle="Trends across your year" right={
        <select className="input max-w-[120px]" value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(yy => <option key={yy} value={yy}>{yy}</option>)}
        </select>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total earned" value={fmtMoney(sum.totalEarned || 0)} accent="primary" />
        <StatCard label="Total spent" value={fmtMoney(sum.totalSpent || 0)} accent="danger" />
        <StatCard label="Total saved" value={fmtMoney(sum.totalSaved || 0)} accent="primary" sub={`Avg ${fmtMoney(sum.averageMonthlySavings || 0)}/mo`} />
        <StatCard label="Year-end projection" value={fmtMoney(projected)} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Section title="Savings trend">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoneyExact(Number(v))} />
                <Line type="monotone" dataKey="saved" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Saved" />
                <Line type="monotone" dataKey="income" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} name="Income" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Spending by category">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoneyExact(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="loans" stackId="a" fill="oklch(0.68 0.21 25)" name="Loans" />
                <Bar dataKey="parents" stackId="a" fill="oklch(0.78 0.14 165)" name="Parents" />
                <Bar dataKey="food" stackId="a" fill="oklch(0.82 0.14 75)" name="Food" />
                <Bar dataKey="transport" stackId="a" fill="oklch(0.75 0.14 220)" name="Transport" />
                <Bar dataKey="shopping" stackId="a" fill="oklch(0.72 0.16 295)" name="Shopping" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <Section title="Insights" action={<Sparkles className="w-4 h-4 text-warning" />}>
        {insights.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-4">Add at least two months of data to unlock insights.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {insights.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                {s.includes("more") || s.includes("dropped") || s.includes("Highest") ? <TrendingDown className="w-4 h-4 mt-0.5 text-danger" /> : <TrendingUp className="w-4 h-4 mt-0.5 text-success" />}
                <span>{s}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageContainer>
  );
}

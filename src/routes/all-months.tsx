import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { loadYear, fmtMoney, MONTH_NAMES, totalExpenses, totalInvested, savedAmount, savingsRate, listAllYears, resetMonth } from "@/lib/finance-store";
import { useDataVersion, useCurrentMonth } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, Section } from "@/components/Primitives";
import { mk } from "@/components/MonthYearSelector";
import { Pencil, RotateCcw, Lock } from "lucide-react";

export const Route = createFileRoute("/all-months")({
  head: () => ({ meta: [{ title: "All Months · Habib Finance" }, { name: "description", content: "Every month at a glance — edit any of them." }] }),
  component: () => <ClientGate><AllMonthsPage /></ClientGate>,
});

function AllMonthsPage() {
  useDataVersion();
  const { setYM } = useCurrentMonth();
  const years = listAllYears();
  const [year, setYear] = useState(years[years.length - 1] || 2026);
  const y = useMemo(() => loadYear(year), [year, useDataVersion]); // eslint-disable-line

  const today = new Date();
  const trackingStart = year === 2026 ? 5 : 1;

  const rows = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const k = mk(monthNum);
    const m = y.months[k];
    const isFuture = year > today.getFullYear() || (year === today.getFullYear() && monthNum > today.getMonth() + 1);
    const beforeStart = monthNum < trackingStart && !m;
    const c = m?.completeness;
    const status = beforeStart || isFuture ? "future"
      : !m ? "empty"
      : (c?.incomeLogged && c?.budgetSet && c?.expensesAdded && c?.investmentsLogged) ? "complete"
      : "partial";
    return {
      key: k, monthNum, name: MONTH_NAMES[i],
      income: m?.income.total || 0,
      expenses: m ? totalExpenses(m) : 0,
      saved: m ? savedAmount(m) + totalInvested(m) : 0,
      rate: m ? savingsRate(m) : 0,
      status,
      isCurrent: year === today.getFullYear() && monthNum === today.getMonth() + 1,
    };
  });

  const yTotals = rows.reduce((a, r) => ({
    income: a.income + r.income, expenses: a.expenses + r.expenses, saved: a.saved + r.saved,
    completeCount: a.completeCount + (r.status === "complete" ? 1 : 0),
  }), { income: 0, expenses: 0, saved: 0, completeCount: 0 });
  const avgRate = yTotals.income ? Math.round((yTotals.saved / yTotals.income) * 100) : 0;

  const goEdit = (monthNum: number) => {
    setYM(year, monthNum);
  };

  return (
    <PageContainer>
      <PageHeader title="All months" subtitle="Every month side-by-side. Click any month to edit." right={
        <select className="input max-w-[120px]" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[...years, year + 1].filter((v, i, a) => a.indexOf(v) === i).map(yy => <option key={yy} value={yy}>{yy}</option>)}
        </select>
      } />

      <Section title={`${year} overview`}>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2 font-normal">Month</th>
                <th className="text-right px-3 py-2 font-normal">Income</th>
                <th className="text-right px-3 py-2 font-normal">Expenses</th>
                <th className="text-right px-3 py-2 font-normal">Saved</th>
                <th className="text-right px-3 py-2 font-normal">Rate</th>
                <th className="text-left px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.key} className={`hover:bg-surface-2 ${r.isCurrent ? "bg-surface-2/50 ring-1 ring-inset ring-primary/30" : ""} ${r.status === "future" ? "opacity-50" : ""}`}>
                  <td className="px-3 py-3 font-medium">{r.name} {year}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.income ? fmtMoney(r.income) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.expenses ? fmtMoney(r.expenses) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.income ? fmtMoney(r.saved) : "—"}</td>
                  <td className={`px-3 py-3 text-right tabular-nums ${r.rate >= 30 ? "text-success" : r.rate >= 15 ? "text-warning" : r.rate > 0 ? "text-danger" : "text-muted-foreground"}`}>
                    {r.income ? `${r.rate}%` : "—"}
                  </td>
                  <td className="px-3 py-3"><StatusBadge s={r.status} /></td>
                  <td className="px-3 py-3 text-right">
                    {r.status === "future" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="w-3 h-3" /></span>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Link to="/" onClick={() => goEdit(r.monthNum)} className="btn btn-ghost py-1 px-2 text-xs"><Pencil className="w-3 h-3" /> Edit</Link>
                        {r.status !== "empty" && (
                          <button onClick={() => { if (confirm(`Reset expenses for ${r.name} ${year}?`)) resetMonth(year, r.key); }} className="btn btn-ghost py-1 px-2 text-xs"><RotateCcw className="w-3 h-3" /></button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="px-3 py-3 font-display text-base">Total {year}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium">{fmtMoney(yTotals.income)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium">{fmtMoney(yTotals.expenses)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium text-success">{fmtMoney(yTotals.saved)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium">{avgRate}% avg</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{yTotals.completeCount}/12 complete</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>
    </PageContainer>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    complete: { label: "✅ Complete", cls: "text-success" },
    partial:  { label: "📝 Partial",  cls: "text-warning" },
    empty:    { label: "⚠️ Empty",    cls: "text-muted-foreground" },
    future:   { label: "🔒 Future",   cls: "text-muted-foreground" },
  };
  const it = map[s];
  return <span className={`text-xs ${it.cls}`}>{it.label}</span>;
}

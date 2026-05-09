import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ensureMonth, updateMonth, fmtMoney, fmtMoneyExact, BUDGET_LABELS, MONTH_NAMES, type Budget, type Expense, type ExpenseTag } from "@/lib/finance-store";
import { useCurrentMonth, useDataVersion } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, Section, StatCard } from "@/components/Primitives";
import { MonthYearSelector, mk } from "@/components/MonthYearSelector";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Expenses · Habib Finance" }, { name: "description", content: "Log and review monthly expenses." }] }),
  component: () => <ClientGate><ExpensesPage /></ClientGate>,
});

const CATS: (keyof Budget)[] = ["food","transport","shopping","mobile","misc","parents","loans","travel"];
const TAGS: ExpenseTag[] = ["lifestyle","fixed","investment","saving"];

function ExpensesPage() {
  useDataVersion();
  const { year, month, setYM } = useCurrentMonth();
  const m = useMemo(() => ensureMonth(year, month - 1), [year, month, useDataVersion]); // eslint-disable-line
  const monthKey = mk(month);

  const [cat, setCat] = useState<keyof Budget>("food");
  const [amt, setAmt] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [note, setNote] = useState(""); const [tag, setTag] = useState<ExpenseTag>("lifestyle");
  const [filter, setFilter] = useState<"all" | keyof Budget>("all");

  const add = () => {
    if (!amt) return;
    const e: Expense = { id: crypto.randomUUID(), category: cat as string, amount: Number(amt), date, note, tag };
    updateMonth(year, monthKey, x => ({ ...x, expenses: [e, ...x.expenses] }));
    setAmt(""); setNote("");
  };
  const remove = (id: string) => updateMonth(year, monthKey, x => ({ ...x, expenses: x.expenses.filter(e => e.id !== id) }));

  const total = m.expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = m.expenses.reduce((acc, e) => { acc[e.category as string] = (acc[e.category as string] || 0) + e.amount; return acc; }, {} as Record<string, number>);
  const list = filter === "all" ? m.expenses : m.expenses.filter(e => e.category === filter);

  return (
    <PageContainer>
      <PageHeader title="Expenses" subtitle={`${MONTH_NAMES[month-1]} ${year} — ${m.expenses.length} entries`}
        right={<MonthYearSelector year={year} month={month} onChange={setYM} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total spent" value={fmtMoney(total)} accent="danger" />
        <StatCard label="Income" value={fmtMoney(m.income.total)} accent="primary" />
        <StatCard label="Remaining (vs income)" value={fmtMoney(m.income.total - total)} accent={(m.income.total - total) > 0 ? "primary" : "danger"} />
        <StatCard label="Avg / day" value={fmtMoney(Math.round(total / new Date(year, month, 0).getDate()))} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Section title="Add expense">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select className="input mt-1" value={cat} onChange={e => setCat(e.target.value as keyof Budget)}>
                {CATS.map(c => <option key={c} value={c}>{BUDGET_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tag</label>
              <select className="input mt-1" value={tag} onChange={e => setTag(e.target.value as ExpenseTag)}>
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Amount</label>
              <input type="number" className="input mt-1" value={amt} onChange={e => setAmt(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Date</label>
              <input type="date" className="input mt-1" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Note</label>
              <input className="input mt-1" value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <button className="btn btn-primary col-span-2 justify-self-start" onClick={add}><Plus className="w-4 h-4" /> Add</button>
          </div>
        </Section>

        <Section title="Budget remaining" action={<span className="chip">{filter === "all" ? "All categories" : BUDGET_LABELS[filter]}</span>}>
          <ul className="space-y-2 text-sm">
            {CATS.map(c => {
              const planned = m.budget[c] as number || 0;
              const spent = byCat[c] || 0;
              const left = planned - spent;
              const pct = planned ? Math.min(100, Math.round((spent / planned) * 100)) : 0;
              return (
                <li key={c} className="cursor-pointer" onClick={() => setFilter(filter === c ? "all" : c)}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{BUDGET_LABELS[c]}</span>
                    <span className={`tabular-nums ${left < 0 ? "text-danger" : "text-muted-foreground"}`}>{fmtMoneyExact(spent)} / {fmtMoneyExact(planned)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className={`h-full ${left < 0 ? "bg-danger" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Quick filter">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter("all")} className={`chip ${filter === "all" ? "text-foreground border-foreground" : ""}`}>All</button>
            {CATS.map(c => (
              <button key={c} onClick={() => setFilter(c)} className={`chip ${filter === c ? "text-foreground border-foreground" : ""}`}>{BUDGET_LABELS[c]}</button>
            ))}
          </div>
        </Section>
      </div>

      <Section title="All expenses">
        {list.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-6 text-center">No expenses yet.</div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left px-2 py-2 font-normal">Date</th>
                  <th className="text-left px-2 py-2 font-normal">Category</th>
                  <th className="text-left px-2 py-2 font-normal">Tag</th>
                  <th className="text-left px-2 py-2 font-normal">Note</th>
                  <th className="text-right px-2 py-2 font-normal">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map(e => (
                  <tr key={e.id} className="hover:bg-surface-2">
                    <td className="px-2 py-3 tabular-nums text-muted-foreground">{e.date}</td>
                    <td className="px-2 py-3">{BUDGET_LABELS[e.category as keyof Budget] || e.category}</td>
                    <td className="px-2 py-3"><span className="chip">{e.tag}</span></td>
                    <td className="px-2 py-3 text-muted-foreground">{e.note}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{fmtMoneyExact(e.amount)}</td>
                    <td className="px-2 py-3 text-right"><button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-danger"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}

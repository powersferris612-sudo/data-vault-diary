import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ensureMonth, updateMonth, fmtMoney, fmtMoneyExact, MONTH_NAMES, type AdditionalIncome } from "@/lib/finance-store";
import { useCurrentMonth, useDataVersion } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, Section, StatCard } from "@/components/Primitives";
import { MonthYearSelector, mk } from "@/components/MonthYearSelector";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/income")({
  head: () => ({ meta: [{ title: "Income · Habib Finance" }, { name: "description", content: "Track salary and additional income." }] }),
  component: () => <ClientGate><IncomePage /></ClientGate>,
});

function IncomePage() {
  useDataVersion();
  const { year, month, setYM } = useCurrentMonth();
  const m = useMemo(() => ensureMonth(year, month - 1), [year, month, useDataVersion]); // eslint-disable-line
  const monthKey = mk(month);
  const [salary, setSalary] = useState(m.income.salary || 250000);
  const [src, setSrc] = useState(""); const [amt, setAmt] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0,10)); const [note, setNote] = useState("");

  // Reset state when month changes
  useMemoSync(() => { setSalary(m.income.salary || 250000); }, [year, month]);

  const saveSalary = () => updateMonth(year, monthKey, x => ({ ...x, income: { ...x.income, salary: Number(salary) || 0 } }));
  const addExtra = () => {
    if (!src || !amt) return;
    const item: AdditionalIncome = { id: crypto.randomUUID(), source: src, amount: Number(amt), date, note };
    updateMonth(year, monthKey, x => ({ ...x, income: { ...x.income, additional: [...x.income.additional, item] } }));
    setSrc(""); setAmt(""); setNote("");
  };
  const remove = (id: string) => updateMonth(year, monthKey, x => ({ ...x, income: { ...x.income, additional: x.income.additional.filter(a => a.id !== id) } }));

  const extrasSum = m.income.additional.reduce((s, a) => s + a.amount, 0);

  return (
    <PageContainer>
      <PageHeader title="Income" subtitle={`${MONTH_NAMES[month-1]} ${year} earnings`} right={<MonthYearSelector year={year} month={month} onChange={setYM} />} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Salary" value={fmtMoney(m.income.salary)} accent="primary" />
        <StatCard label="Additional" value={fmtMoney(extrasSum)} sub={`${m.income.additional.length} entries`} />
        <StatCard label="Total" value={fmtMoney(m.income.total)} accent="primary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Monthly salary">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Amount (PKR)</label>
              <input type="number" className="input mt-1" value={salary} onChange={e => setSalary(Number(e.target.value))} />
            </div>
            <button className="btn btn-primary" onClick={saveSalary}>Save</button>
          </div>
        </Section>

        <Section title="Add extra income">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Source</label>
              <input className="input mt-1" placeholder="Freelancing, gift…" value={src} onChange={e => setSrc(e.target.value)} />
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
            <button className="btn btn-primary col-span-2 justify-self-start" onClick={addExtra}><Plus className="w-4 h-4" />Add income</button>
          </div>
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Additional income entries">
          {m.income.additional.length === 0 ? (
            <div className="text-sm text-muted-foreground italic py-6 text-center">No extra income yet.</div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-2 py-2 font-normal">Source</th>
                    <th className="text-left px-2 py-2 font-normal">Date</th>
                    <th className="text-left px-2 py-2 font-normal">Note</th>
                    <th className="text-right px-2 py-2 font-normal">Amount</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {m.income.additional.map(a => (
                    <tr key={a.id} className="hover:bg-surface-2">
                      <td className="px-2 py-3">{a.source}</td>
                      <td className="px-2 py-3 text-muted-foreground tabular-nums">{a.date}</td>
                      <td className="px-2 py-3 text-muted-foreground">{a.note}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{fmtMoneyExact(a.amount)}</td>
                      <td className="px-2 py-3 text-right"><button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-danger"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </PageContainer>
  );
}

// tiny helper to sync state across deps without effects elsewhere
import { useEffect } from "react";
function useMemoSync(fn: () => void, deps: any[]) { useEffect(fn, deps); } // eslint-disable-line

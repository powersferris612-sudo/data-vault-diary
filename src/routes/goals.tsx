import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { loadProfile, saveProfile, fmtMoney, fmtMoneyExact, BUDGET_LABELS, type Goal } from "@/lib/finance-store";
import { useDataVersion } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, Section } from "@/components/Primitives";
import { Trash2, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [{ title: "Goals · Habib Finance" }, { name: "description", content: "Track your financial goals." }] }),
  component: () => <ClientGate><GoalsPage /></ClientGate>,
});

const BUCKETS: Goal["bucket"][] = ["emergencyFund","mutualFunds","govCertificates","stocks","general"];

function GoalsPage() {
  useDataVersion();
  const [profile, setProfile] = useState(loadProfile());
  const [name, setName] = useState(""); const [target, setTarget] = useState(""); const [date, setDate] = useState(""); const [bucket, setBucket] = useState<Goal["bucket"]>("general");

  const persist = (next: typeof profile) => { saveProfile(next); setProfile(next); window.dispatchEvent(new CustomEvent("hf:data-changed")); };

  const add = () => {
    if (!name || !target) return;
    const g: Goal = { id: crypto.randomUUID(), name, target: Number(target), saved: 0, targetDate: date || new Date().toISOString().slice(0,10), bucket };
    persist({ ...profile, goals: [...profile.goals, g] });
    setName(""); setTarget(""); setDate("");
  };
  const update = (id: string, patch: Partial<Goal>) => {
    persist({ ...profile, goals: profile.goals.map(g => g.id === id ? { ...g, ...patch } : g) });
  };
  const remove = (id: string) => persist({ ...profile, goals: profile.goals.filter(g => g.id !== id) });

  const monthlyRate = profile.savingsGoal || 1;

  return (
    <PageContainer>
      <PageHeader title="Goals" subtitle="What you're working toward" />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 space-y-3">
          {profile.goals.length === 0 && (
            <div className="card p-6 text-sm text-muted-foreground italic text-center">No goals yet. Add one →</div>
          )}
          {profile.goals.map(g => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            const remaining = g.target - g.saved;
            const monthsLeft = remaining > 0 ? Math.ceil(remaining / monthlyRate) : 0;
            return (
              <div key={g.id} className={`card p-5 ${g.done ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-xl">{g.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Target {fmtMoneyExact(g.target)} · by {g.targetDate} · {BUDGET_LABELS[g.bucket as keyof typeof BUDGET_LABELS] || g.bucket}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => update(g.id, { done: !g.done })} className="btn btn-ghost py-1 px-2 text-xs"><Check className="w-3 h-3" /> {g.done ? "Reopen" : "Done"}</button>
                    <button onClick={() => remove(g.id)} className="btn btn-ghost py-1 px-2 text-xs text-danger"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground tabular-nums">{fmtMoneyExact(g.saved)} / {fmtMoneyExact(g.target)} ({pct}%)</span>
                  <span className="text-muted-foreground">{monthsLeft > 0 ? `~${monthsLeft} mo at ${fmtMoney(monthlyRate)}/mo` : "🎉 Reached"}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Update saved amount:</label>
                  <input type="number" defaultValue={g.saved} onBlur={e => update(g.id, { saved: Number(e.target.value) || 0 })} className="input max-w-[160px] tabular-nums text-right" />
                </div>
              </div>
            );
          })}
        </div>

        <Section title="Add a goal">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <input className="input mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="Hajj fund, car, laptop…" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Target amount</label>
              <input type="number" className="input mt-1" value={target} onChange={e => setTarget(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Target date</label>
              <input type="date" className="input mt-1" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bucket</label>
              <select className="input mt-1" value={bucket} onChange={e => setBucket(e.target.value as any)}>
                {BUCKETS.map(b => <option key={b} value={b}>{BUDGET_LABELS[b as keyof typeof BUDGET_LABELS] || b}</option>)}
              </select>
            </div>
            <button className="btn btn-primary w-full" onClick={add}><Plus className="w-4 h-4" /> Add goal</button>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

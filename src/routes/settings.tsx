import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { loadProfile, saveProfile, exportYear, importYearFromFile, listAllYears } from "@/lib/finance-store";
import { useDataVersion } from "@/lib/use-current-month";
import { ClientGate, PageContainer, PageHeader, Section } from "@/components/Primitives";
import { Download, Upload, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Habib Finance" }, { name: "description", content: "Profile, defaults and data management." }] }),
  component: () => <ClientGate><SettingsPage /></ClientGate>,
});

function SettingsPage() {
  useDataVersion();
  const [profile, setProfile] = useState(loadProfile());
  const fileRef = useRef<HTMLInputElement>(null);
  const years = listAllYears();
  const [msg, setMsg] = useState("");

  const persist = (next: typeof profile) => { saveProfile(next); setProfile(next); };

  const handleImport = async (file: File) => {
    try {
      const y = await importYearFromFile(file);
      setMsg(`Imported ${y}.json successfully.`);
    } catch (e: any) { setMsg(`Error: ${e.message}`); }
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Your profile and the data folder" />

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Section title="Profile">
          <div className="space-y-3">
            <Field label="Name"><input className="input" value={profile.name} onChange={e => persist({ ...profile, name: e.target.value })} /></Field>
            <Field label="Currency"><input className="input" value={profile.currency} onChange={e => persist({ ...profile, currency: e.target.value })} /></Field>
            <Field label="Monthly salary"><input type="number" className="input tabular-nums" value={profile.monthlySalary} onChange={e => persist({ ...profile, monthlySalary: Number(e.target.value) })} /></Field>
            <Field label="Monthly savings goal"><input type="number" className="input tabular-nums" value={profile.savingsGoal} onChange={e => persist({ ...profile, savingsGoal: Number(e.target.value) })} /></Field>
          </div>
        </Section>

        <Section title="Data folder" action={<span className="chip">browser storage</span>}>
          <p className="text-sm text-muted-foreground mb-4">
            Your data lives entirely in this browser, organized just like a <code className="text-xs">data/</code> folder — one JSON per year. Use Export to download a real <code className="text-xs">.json</code> backup, or Import to restore one.
          </p>
          <div className="space-y-2">
            {years.map(y => (
              <div key={y} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                <div className="text-sm tabular-nums">{y}.json</div>
                <button onClick={() => exportYear(y)} className="btn btn-ghost text-xs"><Download className="w-3 h-3" /> Export</button>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <div className="text-sm">Import yearly file</div>
              <button onClick={() => fileRef.current?.click()} className="btn btn-ghost text-xs"><Upload className="w-3 h-3" /> Choose .json</button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
            </div>
          </div>
          {msg && <div className="mt-3 text-xs text-success">{msg}</div>}
        </Section>
      </div>

      <Section title="Danger zone" action={<AlertTriangle className="w-4 h-4 text-danger" />}>
        <p className="text-sm text-muted-foreground mb-3">This wipes all locally stored finance data. Export first if you want a backup.</p>
        <button
          onClick={() => {
            if (!confirm("Erase ALL finance data from this browser? This cannot be undone.")) return;
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i)!; if (k.startsWith("hf:")) localStorage.removeItem(k);
            }
            location.reload();
          }}
          className="btn btn-danger"
        >Erase everything</button>
      </Section>
    </PageContainer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

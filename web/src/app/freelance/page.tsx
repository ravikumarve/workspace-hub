import { ApiOffline, Card, PageHeader, SectionTitle } from "@/components/shell";
import { FreelanceActions } from "@/components/workspace-actions";
import { getJson } from "@/lib/api";

export const dynamic = "force-dynamic";

interface FreelanceData {
  leads: { file: string; rows: number }[];
  total_leads: number;
  queue: Record<string, string>[];
  ranked: Record<string, string>[];
  sites: string[];
  templates: string[];
  ledger: { state: string | null; ledger_date: string | null } | null;
}

export default async function FreelancePage() {
  let d: FreelanceData;
  try {
    d = (await getJson<{ data: FreelanceData }>("/api/source/freelance")).data;
  } catch {
    return <ApiOffline />;
  }

  const stats = [
    { label: "Total leads", value: d.total_leads, cls: "text-sky-400" },
    { label: "Lead CSVs", value: d.leads.length, cls: "text-zinc-100" },
    { label: "Client sites", value: d.sites.length, cls: "text-emerald-400" },
    { label: "Templates", value: d.templates.length, cls: "text-amber-400" },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="💼 Freelance Ops"
        sub={`Lead pipeline · outreach · client sites from Freelance/`}
        active="Freelance"
      />

      <FreelanceActions />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[8px] border border-[var(--linear-border)] bg-[rgba(255,255,255,0.02)] p-4">
            <div className={`text-3xl font-bold tabular-nums ${s.cls}`}>{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-[var(--linear-ink-faint)]">{s.label}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Lead CSVs</SectionTitle>
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-[var(--linear-border)]">
              {d.leads.map((l) => (
                <tr key={l.file} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="py-1.5 font-mono text-[var(--linear-ink-soft)]">{l.file}</td>
                  <td className="py-1.5 text-right tabular-nums text-[var(--linear-ink-faint)]">{l.rows} rows</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Top Ranked Prospects (by reviews)</SectionTitle>
          <table className="w-full text-left text-xs">
            <thead className="text-[var(--linear-ink-faint)]">
              <tr>
                <th className="pb-2 font-medium">Business</th>
                <th className="pb-2 font-medium">City</th>
                <th className="pb-2 text-right font-medium">Rating</th>
                <th className="pb-2 text-right font-medium">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--linear-border)]">
              {d.ranked.map((r) => (
                <tr key={`${r.name}-${r.place_id ?? r.city}`} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="max-w-[180px] truncate py-1.5 pr-2 text-[var(--linear-ink-soft)]">{r.name}</td>
                  <td className="py-1.5 text-[var(--linear-ink-faint)]">{r.city}</td>
                  <td className="py-1.5 text-right tabular-nums text-[var(--linear-ink)]">⭐ {r.rating}</td>
                  <td className="py-1.5 text-right tabular-nums text-[var(--linear-ink-faint)]">{r.review_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <SectionTitle>Client Sites (live portfolio proof) — click to open</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {d.sites.map((s) => (
            <a
              key={s}
              href={`http://localhost:8787/api/source/freelance`}
              target="_blank"
              title="Open in Freelance folder — sites/*"
              className="rounded-[6px] border border-[var(--linear-border)] bg-[var(--linear-panel)] px-2.5 py-1.5 font-mono text-xs text-emerald-300 hover:bg-[rgba(255,255,255,0.04)] hover:border-[var(--linear-accent)] transition-colors"
            >
              {s}
            </a>
          ))}
        </div>
      </Card>
    </main>
  );
}

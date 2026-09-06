import { ApiOffline, Card, PageHeader, SectionTitle } from "@/components/shell";
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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className={`text-3xl font-bold tabular-nums ${s.cls}`}>{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{s.label}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Lead CSVs</SectionTitle>
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-zinc-800/60">
              {d.leads.map((l) => (
                <tr key={l.file}>
                  <td className="py-1.5 font-mono text-zinc-300">{l.file}</td>
                  <td className="py-1.5 text-right tabular-nums text-zinc-400">{l.rows} rows</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Top Ranked Prospects (by reviews)</SectionTitle>
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2">Business</th>
                <th className="pb-2">City</th>
                <th className="pb-2 text-right">Rating</th>
                <th className="pb-2 text-right">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {d.ranked.map((r) => (
                <tr key={`${r.name}-${r.place_id ?? r.city}`}>
                  <td className="max-w-[180px] truncate py-1.5 pr-2 text-zinc-300">{r.name}</td>
                  <td className="py-1.5 text-zinc-500">{r.city}</td>
                  <td className="py-1.5 text-right tabular-nums">⭐ {r.rating}</td>
                  <td className="py-1.5 text-right tabular-nums text-zinc-400">{r.review_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <SectionTitle>Client Sites (live portfolio proof)</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {d.sites.map((s) => (
            <span
              key={s}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 font-mono text-xs text-emerald-300"
            >
              {s}
            </span>
          ))}
        </div>
      </Card>
    </main>
  );
}

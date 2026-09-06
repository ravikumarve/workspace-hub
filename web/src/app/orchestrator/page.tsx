import { ApiOffline, Card, PageHeader, SectionTitle } from "@/components/shell";
import { getJson } from "@/lib/api";

export const dynamic = "force-dynamic";

interface OrchestratorData {
  counts: Record<string, number>;
  builds: string[];
  runs: { when: string; point: string; mirror: string }[];
  agents_sample: { id: number; directive: string }[];
  ledger: { state: string | null; ledger_date: string | null } | null;
}

export default async function OrchestratorPage() {
  let d: OrchestratorData;
  try {
    d = (await getJson<{ data: OrchestratorData }>("/api/source/orchestrator")).data;
  } catch {
    return <ApiOffline />;
  }

  const entries = Object.entries(d.counts);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="🧠 Orchestrator Pool"
        sub={`pool.json · builds · seeds from Infomations/orchestrator`}
        active="Orchestrator"
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-2xl font-bold tabular-nums text-violet-300">{v}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">{k}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Recent Runs (highest-leverage questions)</SectionTitle>
          <ul className="space-y-3">
            {d.runs.map((r) => (
              <li key={r.when} className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span>{r.when}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-200">{r.point}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-violet-300/80">{r.mirror}</p>
              </li>
            ))}
            {d.runs.length === 0 && (
              <li className="text-sm text-zinc-500">No runs recorded in pool.json</li>
            )}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle>Builds</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {d.builds.map((b) => (
                <span
                  key={b}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 font-mono text-xs text-sky-300"
                >
                  {b}
                </span>
              ))}
              {d.builds.length === 0 && (
                <span className="text-sm text-zinc-500">No builds yet</span>
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle>Agent Directives (sample)</SectionTitle>
            <ul className="space-y-2">
              {d.agents_sample.map((a, i) => (
                <li key={`${a.id}-${i}`} className="line-clamp-2 text-xs text-zinc-400">
                  <span className="mr-1.5 font-mono text-zinc-600">#{a.id}</span>
                  {a.directive}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}

import { Card, PageHeader, SectionTitle } from "@/components/shell";
import { CONFIG } from "@/lib/config";
import { getJson, tierBadge, type Overview } from "@/lib/api";

export const dynamic = "force-dynamic";

interface SystemInfo {
  disks: { mount: string; total_gb: number; used_gb: number; free_gb: number; pct: number }[];
  memory: { total_gb: number; used_gb: number; pct: number };
  load: number[];
  ports: number[];
}

function pctColor(pct: number): string {
  return pct >= CONFIG.diskRedPct
    ? "bg-red-500"
    : pct >= CONFIG.diskAmberPct
      ? "bg-amber-500"
      : "bg-emerald-500";
}

export default async function Home() {
  let data: Overview;
  let sys: SystemInfo | null = null;
  try {
    data = await getJson<Overview>("/api/overview");
    sys = await getJson<SystemInfo>("/api/system").catch(() => null);
  } catch {
    return (
      <main className="p-10">
        <h1 className="text-xl font-semibold text-red-400">Hub API offline</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Start it with:{" "}
          <code className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs">
            cd backend && uvicorn api:app --port 8787
          </code>
        </p>
      </main>
    );
  }

  const total = Object.values(data.counts).reduce((a, b) => a + b, 0);
  const stats = [
    { label: "Projects", value: total, cls: "text-zinc-100" },
    { label: "DONE", value: data.counts.DONE ?? 0, cls: "text-emerald-400" },
    { label: "RUNNING", value: data.counts.RUNNING ?? 0, cls: "text-amber-400" },
    { label: "Open directives", value: data.action_queue.length, cls: "text-sky-400" },
  ];

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="⌘ Workspace Hub"
        sub={
          data.last_scan
            ? `Last scan ${data.last_scan.ran_at.slice(0, 16).replace("T", " ")} · ${data.last_scan.duration_s}s`
            : "never scanned"
        }
        active="Overview"
      />

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className={`text-3xl font-bold tabular-nums ${s.cls}`}>{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{s.label}</div>
          </div>
        ))}
      </section>

      {/* System sentinel + Staleness radar */}
      <div className="grid gap-6 lg:grid-cols-2">
        {sys && (
          <Card>
            <SectionTitle>🩺 System Sentinel — Latitude 3460</SectionTitle>
            <div className="space-y-3">
              {sys.disks.map((d) => (
                <div key={d.mount}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-mono text-zinc-300">{d.mount}</span>
                    <span className="tabular-nums text-zinc-500">
                      {d.free_gb}G free of {d.total_gb}G ({d.pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${pctColor(d.pct)}`}
                      style={{ width: `${Math.min(d.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                  RAM {sys.memory.used_gb}/{sys.memory.total_gb}G ({sys.memory.pct}%)
                </span>
                <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                  load {sys.load.join(" · ")}
                </span>
                <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                  {sys.ports.length} ports listening
                </span>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <SectionTitle>🕰️ Staleness Radar — untouched ≥{CONFIG.stalenessDays} days</SectionTitle>
          <ul className="space-y-1.5">
            {data.stale.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-xs">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tierBadge(s.tier).cls}`}
                >
                  {s.tier}
                </span>
                <span className="font-medium text-zinc-200">{s.name}</span>
                <span className="ml-auto tabular-nums text-zinc-500">
                  {s.days == null ? "no data" : `${s.days}d silent`}
                </span>
              </li>
            ))}
            {data.stale.length === 0 && (
              <li className="text-sm text-zinc-500">Nothing stale — everything touched in the last 30 days.</li>
            )}
          </ul>
          {data.parked_count > 0 && (
            <p className="mt-3 text-[11px] text-zinc-600">
              {data.parked_count} parked projects excluded (DO NOT TOUCH list)
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Money List */}
        <section className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            💸 The Money List
          </h2>
          <ol className="space-y-2.5">
            {data.money_list.map((m) => (
              <li key={m.item_no} className="flex gap-2 text-sm leading-snug">
                <span className="font-mono text-zinc-600">{m.item_no}.</span>
                <span className="text-zinc-300">{m.text}</span>
              </li>
            ))}
            {data.money_list.length === 0 && (
              <li className="text-sm text-zinc-500">Money list not found in root AGENTS.md</li>
            )}
          </ol>
        </section>

        {/* Action Queue */}
        <section className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            ⚡ Action Queue — Next Turn Directives
          </h2>
          <ul className="space-y-3">
            {data.action_queue.map((a) => {
              const tb = tierBadge(a.tier);
              return (
                <li key={a.name} className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tb.cls}`}>
                      {a.tier}
                    </span>
                    <span className="font-medium text-sm">{a.name}</span>
                    <span className="ml-auto text-[11px] text-zinc-600">{a.ledger_date}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                    {a.next_directive}
                  </p>
                </li>
              );
            })}
            {data.action_queue.length === 0 && (
              <li className="text-sm text-zinc-500">No open directives — run a scan.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}

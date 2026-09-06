import { ApiOffline, Card, PageHeader } from "@/components/shell";
import { getJson, tierBadge } from "@/lib/api";

export const dynamic = "force-dynamic";

interface Entry {
  project: string;
  tier: string;
  date: string;
  title: string;
  state: string | null;
}

export default async function TimelinePage() {
  let entries: Entry[];
  try {
    entries = await getJson<Entry[]>("/api/timeline?limit=80");
  } catch {
    return <ApiOffline />;
  }

  // Group by calendar day
  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const day = e.date.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(e);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title="🗓️ Timeline"
        sub={`${entries.length} ledger entries across all projects — newest first`}
        active="Timeline"
      />

      <div className="space-y-6">
        {[...groups.entries()].map(([day, items]) => (
          <div key={day} className="relative pl-6">
            <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500" />
            <div className="absolute left-[4.5px] top-5 bottom-0 w-px bg-zinc-800" />
            <h2 className="mb-2 font-mono text-sm font-semibold text-sky-400">{day}</h2>
            <Card className="space-y-3">
              {items.map((e, i) => (
                <div key={`${e.project}-${e.date}-${i}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tierBadge(e.tier).cls}`}
                    >
                      {e.tier}
                    </span>
                    <span className="text-sm font-medium">{e.project}</span>
                    <span className="ml-auto font-mono text-[10px] text-zinc-600">
                      {e.date.slice(11, 16)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{e.title}</p>
                </div>
              ))}
            </Card>
          </div>
        ))}
        {entries.length === 0 && (
          <Card>
            <p className="text-sm text-zinc-500">
              No timeline entries — run a scan (POST /api/scan).
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}

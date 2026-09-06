import { ApiOffline, Card, PageHeader, SectionTitle } from "@/components/shell";
import { getJson } from "@/lib/api";

export const dynamic = "force-dynamic";

interface PortfolioData {
  planets: { id: string; screenshots: number; in_hub: boolean }[];
  planet_count: number;
  screenshot_folders: { name: string; count: number }[];
  git: {
    git_branch: string | null;
    git_last_commit: string | null;
    git_dirty: number | null;
    dirty_count: number;
  } | null;
  scripts: string[];
}

export default async function PortfolioPage() {
  let d: PortfolioData;
  try {
    d = (await getJson<{ data: PortfolioData }>("/api/source/portfolio")).data;
  } catch {
    return <ApiOffline />;
  }

  const withSc = d.planets.filter((p) => p.screenshots > 0).length;
  const withoutSc = d.planets.length - withSc;
  const inHub = d.planets.filter((p) => p.in_hub).length;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="🌌 Portfolio"
        sub={`${d.planet_count} planets · ${inHub} synced with hub · ${d.git?.git_branch ?? "-"} · ${d.git?.dirty_count ?? 0} dirty files`}
        active="Portfolio"
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-3xl font-bold tabular-nums text-violet-300">{d.planet_count}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">Planets</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-3xl font-bold tabular-nums text-emerald-400">{withSc}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">With screenshots</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-3xl font-bold tabular-nums text-amber-400">{withoutSc}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">Missing shots</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-3xl font-bold tabular-nums text-sky-400">{inHub}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">In hub</div>
        </div>
      </section>

      <Card>
        <SectionTitle>Planets → Hub sync</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {d.planets.map((p) => (
            <div
              key={p.id}
              className={`rounded-lg border px-3 py-2 text-xs ${p.in_hub ? "border-zinc-800 bg-zinc-950/60" : "border-amber-500/20 bg-amber-500/5"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium text-zinc-200">{p.id}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${p.screenshots > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {p.screenshots} shots
                </span>
              </div>
              <div className="mt-1 flex gap-1">
                <span className={`text-[10px] ${p.in_hub ? "text-emerald-400" : "text-amber-400"}`}>
                  {p.in_hub ? "● in hub" : "○ not in hub"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Screenshot folders (on disk)</SectionTitle>
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-zinc-800/60">
              {d.screenshot_folders.map((f) => (
                <tr key={f.name}>
                  <td className="py-1.5 font-mono text-zinc-300">{f.name}</td>
                  <td className="py-1.5 text-right tabular-nums text-zinc-500">{f.count} files</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Git & Scripts</SectionTitle>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Branch</span>
              <span className="font-mono text-zinc-200">{d.git?.git_branch ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Last commit</span>
              <span className="max-w-[260px] truncate text-zinc-300" title={d.git?.git_last_commit ?? ""}>
                {d.git?.git_last_commit ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Dirty files</span>
              <span className={`tabular-nums ${d.git?.dirty_count ? "text-amber-400" : "text-emerald-400"}`}>
                {d.git?.dirty_count ?? 0}
              </span>
            </div>
            <div className="pt-2">
              <span className="text-zinc-500">Scripts: </span>
              <span className="font-mono text-zinc-300">{d.scripts.join(" · ") || "-"}</span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

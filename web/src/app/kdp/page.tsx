import { ApiOffline, Card, PageHeader, SectionTitle } from "@/components/shell";
import { getJson, stateBadge } from "@/lib/api";

export const dynamic = "force-dynamic";

interface KdpData {
  books: { name: string; title: string; pages: number; has_pdf: boolean; has_cover: boolean }[];
  gaps: Record<string, string>[];
  keywords: Record<string, string>[];
  ledger: { state: string | null; ledger_date: string | null } | null;
}

export default async function KdpPage() {
  let d: KdpData;
  try {
    d = (await getJson<{ data: KdpData }>("/api/source/kdp")).data;
  } catch {
    return <ApiOffline />;
  }
  const sb = stateBadge(d.ledger?.state ?? null);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="📚 KDP Funnel"
        sub={`${d.books.length} books in pipeline · market research from Infomations/kdp`}
        active="KDP"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Books</SectionTitle>
          <ul className="space-y-2">
            {d.books.map((b) => (
              <li key={b.name} className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">{b.title}</div>
                <div className="mt-1.5 flex gap-1.5 text-[11px]">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                    {b.pages} pages
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      b.has_pdf ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {b.has_pdf ? "PDF ✓" : "no PDF"}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      b.has_cover ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {b.has_cover ? "cover ✓" : "no cover"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {d.ledger && (
            <p className="mt-3 text-[11px] text-zinc-500">
              <span className={`rounded px-1.5 py-0.5 ${sb.cls}`}>{sb.label}</span>{" "}
              ledger {d.ledger.ledger_date}
            </p>
          )}
        </Card>

        <Card>
          <SectionTitle>🔥 Top Gap Ideas (by opportunity score)</SectionTitle>
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2">Title</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Demand/mo</th>
                <th className="pb-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {d.gaps.map((g) => (
                <tr key={g.asin}>
                  <td className="max-w-[220px] truncate py-1.5 pr-2 text-zinc-300" title={g.title}>
                    {g.title}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">${g.price}</td>
                  <td className="py-1.5 text-right tabular-nums">{g.monthly_demand}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums text-amber-400">
                    {g.opportunity_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <SectionTitle>Keywords</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {d.keywords.map((k) => (
            <span
              key={k.keyword}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-xs"
            >
              <span className="text-zinc-200">{k.keyword}</span>
              <span className="ml-2 text-zinc-500">
                demand {k.demand_score} · opp {k.opportunity}
              </span>
            </span>
          ))}
        </div>
      </Card>
    </main>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell";
import { SearchBox } from "@/components/search-box";
import { VerifyButton } from "@/components/verify-button";
import { CONFIG } from "@/lib/config";
import { getJson, stateBadge, tierBadge, type Project } from "@/lib/api";

export const dynamic = "force-dynamic";

const FILTERS = ["ALL", "RUNNING", "DONE"] as const;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; q?: string }>;
}) {
  const { tier, q } = await searchParams;
  const active = FILTERS.includes((tier ?? "ALL").toUpperCase() as never)
    ? (tier ?? "ALL").toUpperCase()
    : "ALL";

  let projects: Project[];
  try {
    const sp = new URLSearchParams();
    if (active !== "ALL") sp.set("tier", active);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    projects = await getJson<Project[]>(`/api/projects${qs ? `?${qs}` : ""}`);
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

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <PageHeader
        title="Projects"
        sub={`${projects.length} indexed`}
        active="Projects"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 text-sm">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "ALL" ? "/projects" : `/projects?tier=${f}`}
              className={`rounded-lg px-3 py-1.5 ${
                active === f
                  ? "bg-zinc-800 font-medium"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              {f}
            </Link>
          ))}
        </div>
        <Suspense fallback={<div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-900" />}>
          <SearchBox />
        </Suspense>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const tb = tierBadge(p.tier);
          const sb = stateBadge(p.state);
          return (
            <article
              key={p.name}
              className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tb.cls}`}>
                  {p.tier}
                </span>
                <h2 className="font-semibold text-sm truncate">{p.name}</h2>
                {p.git_dirty != null && p.git_dirty > 0 && (
                  <span
                    title={`${p.git_dirty} uncommitted changes`}
                    className="ml-auto h-2 w-2 shrink-0 rounded-full bg-orange-400"
                  />
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className={`rounded px-1.5 py-0.5 ${sb.cls}`}>{sb.label}</span>
                {p.score != null ? (
                  <span
                    title={`verified ${p.verified_at ?? "unknown"} · ${p.score_fails ?? 0} FAILs`}
                    className={`rounded px-1.5 py-0.5 font-semibold tabular-nums ${
                      p.score >= CONFIG.scoreGate
                        ? "bg-emerald-500/15 text-emerald-400"
                        : p.score >= CONFIG.scoreWarnGate
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {p.score}/100{p.score_fails ? ` · ${p.score_fails}✗` : ""}
                  </span>
                ) : (
                  <VerifyButton name={p.name} />
                )}
                {p.stack && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">{p.stack}</span>
                )}
                {p.git_branch && (
                  <span className="font-mono text-zinc-500">⑂ {p.git_branch}</span>
                )}
              </div>

              {p.ledger_title && (
                <p className="mt-2 line-clamp-1 text-[11px] text-zinc-500" title={p.ledger_title}>
                  {p.ledger_title}
                </p>
              )}

              {p.next_directive && (
                <p className="mt-2 line-clamp-3 rounded-lg bg-zinc-950/70 p-2 text-[11px] leading-relaxed text-sky-300/90">
                  <span className="font-semibold text-sky-400">NEXT:</span> {p.next_directive}
                </p>
              )}

              <div className="mt-auto pt-3 flex items-center justify-between text-[10px] text-zinc-600">
                <span>{p.git_last_date?.slice(0, 10) ?? "no git"}</span>
                <span>
                  {p.has_readme ? "README" : "—"} · {p.has_license ? "LICENSE" : "—"}
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

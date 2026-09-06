export const API =
  process.env.NEXT_PUBLIC_HUB_API_URL ??
  process.env.HUB_API_URL ??
  "http://127.0.0.1:8787";

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Hub API ${res.status} on ${path}`);
  return res.json();
}

export interface Project {
  name: string;
  path: string;
  tier: "DONE" | "RUNNING";
  state: string | null;
  next_directive: string | null;
  ledger_date: string | null;
  ledger_title: string | null;
  git_branch: string | null;
  git_last_commit: string | null;
  git_last_date: string | null;
  git_dirty: number | null;
  stack: string | null;
  has_readme: number;
  has_license: number;
  score: number | null;
  score_fails: number | null;
  verified_at: string | null;
}

export interface Overview {
  counts: Record<string, number>;
  states: { state: string; n: number }[];
  last_scan: {
    ran_at: string;
    n_done: number;
    n_running: number;
    duration_s: number;
  } | null;
  money_list: { item_no: number; text: string }[];
  action_queue: Pick<
    Project,
    "name" | "tier" | "state" | "next_directive" | "ledger_date"
  >[];
  stale: { name: string; tier: string; days: number | null; last: string | null }[];
  parked_count: number;
}

export function stateBadge(state: string | null): {
  label: string;
  cls: string;
} {
  const s = (state ?? "").toLowerCase();
  if (!s) return { label: "no ledger", cls: "bg-zinc-800 text-zinc-400" };
  if (s.startsWith("success") || s.startsWith("✅"))
    return { label: "success", cls: "bg-emerald-500/15 text-emerald-400" };
  if (s.startsWith("blocked"))
    return { label: "blocked", cls: "bg-red-500/15 text-red-400" };
  if (s.startsWith("ongoing"))
    return { label: "ongoing", cls: "bg-sky-500/15 text-sky-400" };
  return { label: s.slice(0, 24), cls: "bg-violet-500/15 text-violet-300" };
}

export function tierBadge(tier: string): { cls: string } {
  return tier === "RUNNING"
    ? { cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
    : { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
}

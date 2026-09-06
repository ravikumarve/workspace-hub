"use client";
import { useState } from "react";

const API =
  process.env.NEXT_PUBLIC_HUB_API_URL ?? "http://127.0.0.1:8787";

export function VerifyButton({ name }: { name: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function run() {
    setState("loading");
    try {
      const r = await fetch(`${API}/api/verify/${encodeURIComponent(name)}`, {
        method: "POST",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail ?? "failed");
      setMsg(`${d.score}/100`);
      setState("done");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "error");
      setState("error");
    }
  }

  if (state === "done")
    return (
      <span
        title="verified — refresh to persist badge"
        className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold tabular-nums text-emerald-400"
      >
        {msg} ✓
      </span>
    );
  if (state === "error")
    return (
      <span
        title={msg}
        className="rounded bg-red-500/15 px-1.5 py-0.5 text-red-400"
      >
        error
      </span>
    );

  return (
    <button
      onClick={run}
      disabled={state === "loading"}
      className="rounded border border-dashed border-zinc-700 px-1.5 py-0.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50"
    >
      {state === "loading" ? "verifying…" : "verify →"}
    </button>
  );
}

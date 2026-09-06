"use client";
import { useState } from "react";
import { ActionButton, CommandBar } from "./shell";

const API = process.env.NEXT_PUBLIC_HUB_API_URL || "http://127.0.0.1:8787";

export function OverviewActions() {
  const [log, setLog] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(path: string, label: string) {
    setBusy(label);
    setLog(null);
    try {
      const r = await fetch(`${API}${path}`, { method: "POST" });
      const j = await r.json();
      setLog(`${label}: ${r.ok ? "ok" : "fail"} — ${JSON.stringify(j).slice(0, 400)}`);
    } catch (e) {
      setLog(`${label} failed: ${String(e).slice(0, 200)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <CommandBar>
        <ActionButton variant="primary" disabled={!!busy} onClick={() => run("/api/actions/scan", "Scan")}>
          {busy === "Scan" ? "Scanning…" : "↻ Scan now"}
        </ActionButton>
        <ActionButton disabled={!!busy} onClick={() => run("/api/actions/freelance/preview?limit=3", "Preview 3 leads")}>
          {busy === "Preview 3 leads" ? "Previewing…" : "◈ Preview 3 leads"}
        </ActionButton>
        <ActionButton variant="subtle" onClick={() => (window.location.href = "/freelance")}>
          Go Freelance →
        </ActionButton>
        <span className="ml-auto text-xs text-[var(--linear-ink-faint)]">Linear theme · Operate mode · 402 systems</span>
      </CommandBar>
      {log && <div className="rounded-[6px] border border-[var(--linear-border)] bg-[var(--linear-panel)] p-3 font-mono text-xs text-[var(--linear-ink-soft)] whitespace-pre-wrap">{log}</div>}
    </div>
  );
}

export function FreelanceActions() {
  const [log, setLog] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function preview() {
    setBusy(true);
    setLog(null);
    try {
      const r = await fetch(`${API}/api/actions/freelance/preview?limit=3`, { method: "POST" });
      const j = await r.json();
      setLog(j.stdout || JSON.stringify(j).slice(0, 600));
    } catch (e) {
      setLog(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      <CommandBar>
        <ActionButton variant="primary" disabled={busy} onClick={preview}>
          {busy ? "Running injector --dry-run…" : "▶ Dry-run 3 leads → /tmp/ws-preview"}
        </ActionButton>
        <ActionButton variant="subtle" onClick={() => window.open("http://localhost:8787/api/source/freelance", "_blank")}>
          Raw JSON
        </ActionButton>
      </CommandBar>
      {log && <pre className="max-h-64 overflow-auto rounded-[6px] border border-[var(--linear-border)] bg-[var(--linear-panel)] p-3 text-xs text-[var(--linear-ink-soft)] whitespace-pre-wrap">{log}</pre>}
    </div>
  );
}

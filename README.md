# ⌘ Workspace Hub

Local-first Mission Control for the entire opencode_projects portfolio:
**35 projects · KDP funnel · freelance ops · orchestrator — one pane of glass.**

## Architecture (Phase 1)

```
UI      Next.js 15 + Tailwind v4   → localhost:3000   (web/)
API     FastAPI + SQLite           → localhost:8787   (backend/api.py)
Indexer Read-only Python scanner   → data/hub.db      (backend/indexer.py)
```

The indexer walks `../DONE` + `../RUNNING`, parses each project's AGENTS.md
session ledger (State, Next Turn Directive), git metadata (branch, last commit,
dirty count) and stack manifests — into a single SQLite file. **Source projects
are never written to.**

## Run

```bash
./run.sh          # starts API + UI detached
# first index (or after changes): curl -X POST localhost:8787/api/scan
```

## Endpoints

| Route | Purpose |
|---|---|
| `GET /api/overview` | counts, states, Money List, Action Queue |
| `GET /api/projects?tier=RUNNING&q=nyaya` | filter/search |
| `POST /api/scan` | re-index (~3.5s for 35 projects) |

## Roadmap

- **Phase 2** — KDP funnel view (`Infomations/kdp`), Freelance lead pipeline
  (`Freelance/leads/*.csv`), Orchestrator pool status (`pool.json`)
- **Phase 1.5** — product-verifier score column (subprocess call per project)
- **Phase 3** — actions: open-in-editor, mark listing published, revenue tracking

## 💾 Session Memory Ledger

### [2026-08-26 15:20] — Workspace Hub Tier 1 SHIPPED (Verifier + Sentinel + Radar + Timeline)
- **State:** Success — all features live & browser-verified
- **MCP Data Used:** none external; recon of product-verifier CLI (--json shape: score/counts/findings)
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** Verifier runs ON-DEMAND via POST /api/verify/{name} (~25s/project) with results cached in projects.score/score_fails/verified_at and preserved across re-scans (prev_scores map) — never in scan loop. Staleness radar computes from git_last_date+ledger_date, excludes 17 parked projects parsed from root DO-NOT-TOUCH section. System sentinel is live-computed (df/proc-meminfo/ss), not stored. Timeline = all 327 ledger entries in dedicated table.
- **Key Outputs:** /api/system, /api/timeline, POST /api/verify/{name}, overview.stale; UI: System Sentinel card (disk bars amber@80.5% root!), Staleness Radar (MemoryLane- 207d, nanobot 153d…), score badges on project cards, /timeline day-grouped stream.
- **Gotchas:** duplicate-import collision when editing page.tsx twice (read before edit!); React key collisions on duplicate ledger dates (index-suffix keys); pkill bracket pattern + separate start command to avoid shell wedge.
- **Next Turn Directive:** Tier 2 (revenue tracker + money kanban) the day Nyaya goes live; or execute Money List #1 now — hub shows Kavach 70/100 gate-passing as proof verifier works.

### [2026-08-25 13:35] — Workspace Hub Phase 2 SHIPPED (KDP + Freelance + Orchestrator views)
- **State:** Success — all 5 pages live & browser-verified
- **MCP Data Used:** none external; targeted recon of kdp/{books,data}, Freelance/leads CSVs, orchestrator/pool.json shapes
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** Generic `sources` table (key → JSON snapshot) instead of per-domain relational tables — one API endpoint `/api/source/{key}` serves kdp|freelance|orchestrator. Shared UI shell components (Nav/PageHeader/ApiOffline/Card) in `web/src/components/shell.tsx`. Scan now ~6s (35 projects + 3 sources).
- **Key Outputs:** indexer.py scan_{kdp,freelance,orchestrator}(); web pages /kdp /freelance /orchestrator; nav expanded to 5 tabs. Data: 4 KDP books + 10 gap ideas; 426 freelance leads across 15 CSVs + 9 client sites; pool 44 agents/59 reports/15 births/4 runs.
- **Ops gotchas:** uvicorn does NOT hot-reload — restart after api.py/indexer.py edits; `pkill -f "uvicorn api:app"` self-matches the tool shell's own argv (use `[u]vicorn` bracket pattern or kill by PID); POST /api/scan on an old process indexes with OLD code — after code edits run `python3 backend/indexer.py` directly.
- **Next Turn Directive:** Phase 1.5 — product-verifier score column on project cards; Phase 3 — actions (open-in-editor, mark published, revenue tracking). Or stop building and execute Money List #1 (publish Nyaya).

### [2026-08-22 17:45] — Workspace Hub Phase 1 SHIPPED
- **State:** Success — full stack live & browser-verified
- **MCP Data Used:** none external; bash tree recon of opencode_projects + portfolio + Freelance + Infomations
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** Read-only indexer → single hub.db; AGENTS.md ledgers are the data source (zero manual entry); FastAPI sync endpoints over sqlite3; Next.js server components with no-store fetch; Tailwind v4 gotcha fixed via @layer base in globals.css; servers must start via `( … setsid nohup … & )` subshell pattern or shell-tool timeouts kill them.
- **Key Outputs:** backend/{indexer.py,api.py}, web/ (Overview + Projects pages), run.sh, data/hub.db (13 DONE + 22 RUNNING, 7 money items, 9 directives)
- **Next Turn Directive:** Phase 2 — add KDP funnel + Freelance leads + Orchestrator pool views; or Phase 1.5 verifier score column.

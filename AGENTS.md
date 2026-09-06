# 🧭 Workspace Hub — AGENTS.md
# Project: Workspace Hub (Mission Control for opencode_projects)
# Stack: Next.js 15 + Tailwind v4 (web) · FastAPI + SQLite (backend) · Python indexer
# Host: Dell Latitude 3460 (Ubuntu) — CPU-only, disk-sensitive
# Purpose: Single pane of glass for 35 projects (DONE 13 + RUNNING 22), KDP funnel, Freelance ops, Orchestrator pool

## 🧠 Architecture
- **UI:** Next.js 15 App Router, Tailwind v4, 6 pages (Overview, Projects, KDP, Freelance, Orchestrator, Timeline), shared shell components
- **API:** FastAPI on :8787, SQLite `data/hub.db` (WAL + busy_timeout), sync endpoints via threadpool
- **Indexer:** Read-only Python scanner walks DONE/RUNNING, parses AGENTS.md session ledgers, git metadata, manifests → single hub.db. Sources NEVER written to.
- **Run:** `./run.sh` starts both services detached; `POST /api/scan` re-indexes (~4s); `POST /api/verify/{name}` scores one project (~25s, cached)

## 🔑 Resource Rules (Latitude 3460)
- No heavy Docker/K8s/LLM training
- Map-first: `tree -L 2` or `code_tree` before reading any project
- No secrets in code — `.env` only, never commit `.env`
- After 3 failed attempts: STOP, output "STUCK: [Reason]"
- Max 5 chained tools without checking state
- Background servers MUST start via `( … setsid nohup … & )` subshell — shell-tool timeout kills otherwise

## 🛠️ Conventions
- `HUB_API_URL` / `NEXT_PUBLIC_HUB_API_URL` env for API base (fallback `http://127.0.0.1:8787`)
- Staleness threshold: 30 days (excludes 16 parked from root DO-NOT-TOUCH list)
- Score gate: 70/100, 0 FAILs before Gumroad listing
- Disk sentinel amber: 75%, red: 85%

## 💾 Session Memory Ledger (prepend latest at top)

### [2026-09-04 17:00] — Portfolio Wired ✅ (13 planets, screenshot gap flagged, 7 pages)
- **State:** Success — portfolio analyzed (Next 16.2 + Motion, 12 products, 550 files, 7.02 quality) + hub source `portfolio` added (13 planets, 7 with shots, 6 missing, 12/13 synced)
- **MCP Data Used:** code_tree (portfolio 71 findings, 2 critical: 130-line generateTexture, 89-line OrbitalVortex), tree recon, git status, projects.ts regex parse
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** `scan_portfolio()` regex-parses `projects.ts` (ids + screenshot counts) + `Screenshots/` disk scan + `git_info` (32 dirty) → generic `sources` table (no new table); nav 6→7 tabs; `web/.next` on FUSE needs `next start` (not dev) or `mv` not `rm -rf`
- **Key Outputs:** `/portfolio` (planet grid with hub sync + screenshot coverage + git/scripts); scan 2.26s (13 planets, 9 sc folders, main 32 dirty); build green, all 7 pages 200 on :3001
- **Next Turn Directive:** Fill 6 missing screenshot sets (kavach/taxchain/audienceos/forgeswarm/lazarus) or polish: parallelize git calls already done, add hub tests

### [2026-09-04 16:00] — Tier 1 Complete ✅ (all 6 robustness + polish fixes, duplicate-key patched)
- **State:** Success — 0 console errors, all 6 pages 200, `npm run build` green
- **Fixes in this pass:** `orchestrator/page.tsx:82` `key={a.id}` → `key={`${a.id}-${i}`}` (pool has duplicate id `1`); `projects/page.tsx` `SearchBox` wrapped in `Suspense fallback` (Next 15 `useSearchParams` bailout); `api.py:system()` split → `_disk_info/_mem_info/_port_info` (54→3×~15 lines)
- **Verification:** `build` green, `pytest` 11/11 hub + 9/9 verifier, `ControlPlane AI` now shows cached `64/100` badge, no "2 Issues" toast
- **MCP Data Used:** code_tree re-check (hub critical 3→1, verifier 4→1 high-complexity), browser screenshots
- **Next Turn Directive:** Tier 2 revenue tracker only after Nyaya listing — hub is done, ship the product

### [2026-09-04 16:00] — Fix Everything: Hub Parallel + Tests + Verifier Hardening ✅
- **State:** Success — 20 tests (11 hub + 9 verifier), scan 4s→2.85s, verifier high-complexity 4→1
- **MCP Data Used:** code_tree (Workspace 86→109 findings, verifier 221→217; avgComplexity 5.06→4.23), pytest, npm build
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** `ThreadPoolExecutor(max_workers=2)` for git I/O (Latitude Protocol); split `check_frontend`→`_check_frontend_scripts/_tooling`, `_manifest_deps`→3 helpers, `check_api_backend`→`_check_api_framework/_quality`, `check_auth_perms`→3 helpers; SQL injection now catches `cursor.execute(f"...")`; hub: `test_indexer.py:5`, `test_api.py:6` (LIKE-escape, parked filter, overview); verifier: `tests/test_verifier_detect:4`, `test_verifier_checks:5`; FUSE `.fuse_hidden` on DATA partition — use `mv` not `rm -rf` for `web/.next`
- **Key Outputs:** Scan 2.85s (was 3.5s), 11 hub tests pass, 9 verifier tests pass, `web` build 4.29kB, verifier self-score 52/100 (1 FAIL — no LICENSE, expected)
- **Next Turn Directive:** Add `loading.tsx` suspense for SearchBox (Next 15 warning) + hub `vitest` alternative (bus error on Latitude); then revenue tracker after Nyaya listing

### [2026-09-04 15:00] — Session A continued: Verify Links + Search + Config Extraction ✅
- **State:** Success — 3 features browser-verified on :3001
- **MCP Data Used:** none external; targeted file reads for wiring
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** `VerifyButton` client island (POST /api/verify, 24s, cached) on unscored cards; `SearchBox` debounced 400ms via `useSearchParams` + `router.push` preserving `tier`; `config.json` single source (stalenessDays/scoreGate/disk thresholds) read by `api.py` via `_cfg()` + `web/src/lib/config.ts` for badge colors
- **Key Outputs:** `web/src/components/verify-button.tsx`, `search-box.tsx`, `config.json` + `web/src/lib/config.ts`; `projects/page.tsx` now supports `?tier=&q=`; `api.py` LIKE-escape + CORS + config-driven thresholds; build passes (4.29kB projects); search `q=nyaya`→1 result verified
- **Next Turn Directive:** Tier 2 revenue tracker (only after Nyaya listing) or polish: parallelize git calls, add tests

### [2026-09-04 14:30] — Session A: Robustness Hardening ✅ (2G disk + 6 fixes + port move)
- **State:** Success — build passes, 6 robustness fixes browser-verified on :3001
- **MCP Data Used:** code_tree AST (86 findings, 2 critical), npm build type-check, live DB/API probes
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** WAL+busy_timeout on SQLite; LIKE-escape with `ESCAPE '\'`; CORS `GET,POST` only; `NEXT_PUBLIC_HUB_API_URL` env; `run.sh` idempotent via `ss -tlnp` port checks; `AutoScan` client component (30m poll); `loading.tsx`/`error.tsx` boundaries; fixed parked parser (`never sell` artifact → 16 clean); port move :3000→:3001 (CertifyAI conflict)
- **Disk:** 80% (18G free) → 77% (20G free), +2G via `go clean -cache/-modcache` + `~/.cache/opencode/packages`. Remaining 1G needs `sudo journalctl --vacuum-size=100M && sudo apt clean`. Sentinel now correctly shows 16 parked excluded.
- **Key Outputs:** All 6 pages 200, API CORS tightened, LIKE-escape verified (`q=%25`→0 results), run.sh double-run correctly skips, auto-scan mounted in layout
- **Next Turn Directive:** Session A continued — verify links on cards, search box, config extraction; or Tier 2 revenue tracker after Nyaya listing

### [2026-08-26 15:20] — Workspace Hub Tier 1 SHIPPED (Verifier + Sentinel + Radar + Timeline)
- **State:** Success — all features live & browser-verified
- **MCP Data Used:** product-verifier CLI recon (--json: score/counts/findings)
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** Verifier = on-demand POST /api/verify/{name} cached in DB; Staleness radar excludes 16 parked; System sentinel live-computed; Timeline = 327 entries
- **Key Outputs:** /api/system, /api/timeline, POST /api/verify/{name}, score badges, System Sentinel card, Staleness Radar, /timeline page
- **Next Turn Directive:** Tier 2 (revenue tracker + money kanban) after Nyaya goes live; or execute Money List #1 now

### [2026-08-25 13:35] — Workspace Hub Phase 2 SHIPPED (KDP + Freelance + Orchestrator views)
- **State:** Success — all 5 pages live & browser-verified
- **MCP Data Used:** targeted recon of Infomations/kdp/{books,data}, Freelance/leads CSVs, Infomations/orchestrator/pool.json
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** Generic `sources` table (key → JSON) + single `/api/source/{key}` endpoint; shared shell components
- **Key Outputs:** /kdp (4 books, gap ideas), /freelance (426 leads, 9 sites), /orchestrator (44 agents/59 reports/15 births/4 runs)
- **Next Turn Directive:** Phase 1 / Tier 1 — verifier scores, staleness radar, disk sentinel, timeline

### [2026-08-22 17:45] — Workspace Hub Phase 1 SHIPPED (Mission Control dashboard)
- **State:** Success — full stack live & browser-verified
- **MCP Data Used:** bash tree recon only
- **Agents Deployed:** Orchestrator (direct execution)
- **Architectural Decision:** Read-only indexer → single hub.db + FastAPI + Next.js; AGENTS.md ledgers as data source; @layer base fix for Tailwind v4 body CSS; setsid nohup pattern for background servers
- **Key Outputs:** backend/{indexer.py,api.py}, web/ (Overview+Projects), run.sh, data/hub.db (13 DONE + 22 RUNNING)
- **Next Turn Directive:** Phase 2 — add KDP, Freelance, Orchestrator views

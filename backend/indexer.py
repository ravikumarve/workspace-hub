#!/usr/bin/env python3
"""Workspace Hub indexer — read-only scanner for opencode_projects.

Walks DONE/ + RUNNING/, parses AGENTS.md session ledgers, git metadata,
and stack manifests into a single SQLite index (data/hub.db).
NEVER writes to source projects.
"""
from __future__ import annotations

import csv
import json
import re
import sqlite3
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

WS_ROOT = Path(__file__).resolve().parents[1]      # Workspace/
OP_ROOT = WS_ROOT.parent                            # opencode_projects/
DATA_DIR = WS_ROOT / "data"
DB_PATH = DATA_DIR / "hub.db"

TIERS = ("DONE", "RUNNING")

ENTRY_RE = re.compile(r"^###\s*\[([^\]]+)\]\s*[—–-]+\s*(.+?)\s*$", re.MULTILINE)
FIELD_RE = re.compile(r"^-\s*\*\*(.+?)\*\*:?\s*(.+?)\s*$", re.MULTILINE)


# ---------------------------------------------------------------- ledgers ---
def parse_ledger(project_dir: Path) -> dict | None:
    """Parse the LATEST (first) session entry from <project>/AGENTS.md."""
    md = project_dir / "AGENTS.md"
    if not md.is_file():
        return None
    try:
        text = md.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None
    m = ENTRY_RE.search(text)
    if not m:
        return None
    nxt = text.find("\n### ", m.end())
    block = text[m.end(): nxt if nxt != -1 else len(text)]
    fields = {k.strip().rstrip(":"): v.strip() for k, v in FIELD_RE.findall(block)}
    return {
        "ledger_date": m.group(1).strip(),
        "ledger_title": m.group(2).strip(),
        "state": fields.get("State"),
        "next_directive": fields.get("Next Turn Directive") or fields.get("Next Step"),
    }


def parse_ledger_all(project_dir: Path, tier: str, name: str) -> list[dict]:
    """Parse EVERY session entry from <project>/AGENTS.md for the timeline."""
    md = project_dir / "AGENTS.md"
    if not md.is_file():
        return []
    try:
        text = md.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []
    entries = []
    matches = list(ENTRY_RE.finditer(text))
    for i, m in enumerate(matches):
        nxt = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[m.end():nxt]
        fields = {k.strip().rstrip(":"): v.strip() for k, v in FIELD_RE.findall(block)}
        entries.append({
            "project": name,
            "tier": tier,
            "date": m.group(1).strip(),
            "title": m.group(2).strip(),
            "state": fields.get("State"),
        })
    return entries


def parse_parked() -> list[str]:
    """Names from the root AGENTS.md 'DO NOT TOUCH' section."""
    root_md = OP_ROOT / "AGENTS.md"
    try:
        text = root_md.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []
    sec = re.search(
        r"##\s*🚫\s*DO NOT TOUCH.*?(?=\n##\s|\Z)", text, re.DOTALL
    )
    if not sec:
        return []
    names: list[str] = []
    for line in sec.group(0).splitlines():
        line = re.sub(r"^-\s*", "", line.strip())
        if not line or line.startswith("#"):
            continue
        for part in line.split(","):
            raw = part.strip()
            # "YoutubeOnAuto: internal revenue engine — keep running" → "YoutubeOnAuto"
            raw = raw.split(":")[0].strip()
            raw = raw.split(" (")[0].strip()
            if raw and " " not in raw and not raw.startswith(("—", "-", "parked")):
                names.append(raw)
    return names


# -------------------------------------------------------------- verifier ----
VERIFIER = OP_ROOT / "product-verifier" / "verify_product.py"


def _verifier_timeout() -> int:
    try:
        return int(json.loads((WS_ROOT / "config.json").read_text(encoding="utf-8")).get("verifyTimeoutSec", 90))
    except (OSError, json.JSONDecodeError, ValueError):
        return 90


def run_verifier(project_path: str, timeout_s: int | None = None) -> dict:
    if timeout_s is None:
        timeout_s = _verifier_timeout()
    """Run product-verifier on one project; return score summary."""
    try:
        r = subprocess.run(
            [sys.executable, str(VERIFIER), project_path, "--json"],
            capture_output=True, text=True, timeout=timeout_s,
        )
    except subprocess.TimeoutExpired:
        return {"error": f"verifier timeout after {timeout_s}s"}
    if r.returncode not in (0, 1):
        return {"error": (r.stderr or "verifier failed")[:200]}
    try:
        d = json.loads(r.stdout)
    except json.JSONDecodeError:
        return {"error": "bad verifier output"}
    counts = d.get("counts", {})
    return {
        "score": d.get("score"),
        "fails": counts.get("FAIL", 0),
        "warns": counts.get("WARN", 0),
        "verified_at": d.get("generated"),
    }


# ------------------------------------------------------------------- git ----
def _git(project_dir: Path, *args: str) -> str:
    try:
        r = subprocess.run(
            ["git", "-C", str(project_dir), *args],
            capture_output=True, text=True, timeout=10,
        )
        return r.stdout.strip() if r.returncode == 0 else ""
    except (OSError, subprocess.TimeoutExpired):
        return ""


def git_info(project_dir: Path) -> dict:
    if not _git(project_dir, "rev-parse", "--is-inside-work-tree"):
        return {}
    subject, _, date = _git(
        project_dir, "log", "-1", "--format=%s%x1f%cI"
    ).partition("\x1f")
    dirty = len(_git(project_dir, "status", "--porcelain").splitlines())
    return {
        "git_branch": _git(project_dir, "rev-parse", "--abbrev-ref", "HEAD") or None,
        "git_last_commit": (subject[:120] or None),
        "git_last_date": date or None,
        "git_dirty": dirty,
    }


# -------------------------------------------------------------- manifests ---
def detect_stack(project_dir: Path) -> str | None:
    stacks: list[str] = []
    pkg = project_dir / "package.json"
    if pkg.is_file():
        try:
            data = json.loads(pkg.read_text(encoding="utf-8", errors="replace"))
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            if "next" in deps:
                stacks.append("Next.js")
            elif "react" in deps:
                stacks.append("React")
            elif deps:
                stacks.append("Node")
        except json.JSONDecodeError:
            stacks.append("Node")
    req = project_dir / "requirements.txt"
    pyproject = project_dir / "pyproject.toml"
    if req.is_file() or pyproject.is_file():
        label = "Python"
        try:
            txt = (req if req.is_file() else pyproject).read_text(
                encoding="utf-8", errors="replace"
            ).lower()
            if "fastapi" in txt:
                label = "FastAPI"
            elif "reflex" in txt:
                label = "Reflex"
        except OSError:
            pass
        stacks.append(label)
    if (project_dir / "go.mod").is_file():
        stacks.append("Go")
    return " + ".join(stacks) if stacks else None


# ------------------------------------------------------------ money list ----
def parse_money_list() -> list[tuple[int, str]]:
    root_md = OP_ROOT / "AGENTS.md"
    try:
        text = root_md.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []
    sec = re.search(r"##\s*💸\s*THE MONEY LIST(.*?)(?=\n##\s|\Z)", text, re.DOTALL)
    if not sec:
        return []
    items = []
    for line in sec.group(1).splitlines():
        m = re.match(r"\s*(\d+)\.\s+(.+?)\s*$", line)
        if m:
            items.append((int(m.group(1)), m.group(2)))
    return items


# --------------------------------------------------------- ops sources ------
def read_csv_rows(path: Path, limit: int = 10, order_by: str | None = None) -> list[dict]:
    if not path.is_file():
        return []
    try:
        with open(path, newline="", encoding="utf-8", errors="replace") as fh:
            rows = list(csv.DictReader(fh))
    except OSError:
        return []

    def num(r: dict) -> float:
        try:
            return float(r.get(order_by, 0) or 0)
        except (TypeError, ValueError):
            return 0.0

    if order_by and rows and order_by in rows[0]:
        rows.sort(key=num, reverse=True)
    return rows[:limit]


def scan_kdp() -> dict:
    kdp = OP_ROOT / "Infomations" / "kdp"
    books = []
    books_dir = kdp / "books"
    if books_dir.is_dir():
        for b in sorted(p for p in books_dir.iterdir() if p.is_dir()):
            spec: dict = {}
            if (b / "spec.json").is_file():
                try:
                    spec = json.loads((b / "spec.json").read_text(errors="replace"))
                except (OSError, json.JSONDecodeError):
                    pass
            books.append({
                "name": b.name,
                "title": spec.get("title") or b.name.replace("-", " ")[:60],
                "pages": len(list((b / "pages").glob("*"))) if (b / "pages").is_dir() else 0,
                "has_pdf": any(b.glob("*.pdf")),
                "has_cover": (b / "cover_front.png").is_file(),
            })
    return {
        "books": books,
        "gaps": read_csv_rows(kdp / "data" / "gap_ideas.csv", 10, "opportunity_score"),
        "keywords": read_csv_rows(kdp / "data" / "keywords.csv", 10, "opportunity"),
        "ledger": parse_ledger(kdp),
    }


def scan_freelance() -> dict:
    fl = OP_ROOT / "Freelance"
    leads = []
    leads_dir = fl / "leads"
    if leads_dir.is_dir():
        for f in sorted(leads_dir.glob("*.csv")):
            try:
                with open(f, newline="", encoding="utf-8", errors="replace") as fh:
                    n = sum(1 for _ in csv.DictReader(fh))
            except OSError:
                n = 0
            leads.append({"file": f.name, "rows": n})
    return {
        "leads": leads,
        "total_leads": sum(l["rows"] for l in leads),
        "queue": read_csv_rows(leads_dir / "outreach_queue.csv", 8),
        "ranked": read_csv_rows(leads_dir / "ranked_prospects.csv", 8, "review_count"),
        "sites": sorted(p.name for p in (fl / "sites").iterdir() if p.is_dir())
        if (fl / "sites").is_dir() else [],
        "templates": sorted(p.name for p in (fl / "templates").iterdir() if p.is_dir())
        if (fl / "templates").is_dir() else [],
        "ledger": parse_ledger(fl),
    }


def scan_orchestrator() -> dict:
    orc = OP_ROOT / "Infomations" / "orchestrator"
    pool: dict = {}
    try:
        pool = json.loads((orc / "pool.json").read_text(errors="replace"))
    except (OSError, json.JSONDecodeError):
        pass
    return {
        "counts": {k: len(v) for k, v in pool.items() if isinstance(v, list)},
        "builds": sorted(p.name for p in (orc / "builds").iterdir() if p.is_dir())
        if (orc / "builds").is_dir() else [],
        "runs": pool.get("runs", [])[-5:],
        "agents_sample": pool.get("agents", [])[:5],
        "ledger": parse_ledger(orc),
    }


def scan_portfolio() -> dict:
    pf = Path("/media/matrix/DATA/portfolio")
    # Parse projects.ts: extract ids + screenshot/link counts via lightweight regex
    planets: list[dict] = []
    hub_names = {p.name.lower() for p in (OP_ROOT / "DONE").iterdir() if p.is_dir()}
    hub_names |= {p.name.lower() for p in (OP_ROOT / "RUNNING").iterdir() if p.is_dir()}
    try:
        text = (pf / "src" / "data" / "projects.ts").read_text(encoding="utf-8", errors="replace")
        # split on id: 'xxx' markers
        import re as _re
        ids = _re.findall(r"id:\s*['\"]([^'\"]+)['\"]", text)
        # screenshot blocks: screenshots: [ ... ]
        sc_counts = [len(_re.findall(r"/screenshots/", m)) for m in _re.findall(r"screenshots:\s*\[([^\]]*)\]", text, _re.DOTALL)]
        for i, pid in enumerate(ids):
            planets.append({
                "id": pid,
                "screenshots": sc_counts[i] if i < len(sc_counts) else 0,
                "in_hub": pid.lower() in hub_names or any(pid.lower() in n for n in hub_names),
            })
    except (OSError, ValueError):
        pass

    # Screenshots on disk
    sc_dir = pf / "Screenshots"
    sc_folders = []
    if sc_dir.is_dir():
        for d in sorted(sc_dir.iterdir()):
            if d.is_dir():
                sc_folders.append({"name": d.name, "count": len(list(d.iterdir()))})

    # git status
    g = git_info(pf)
    g["dirty_count"] = len(subprocess.run(["git", "-C", str(pf), "status", "--porcelain"], capture_output=True, text=True, timeout=5).stdout.strip().splitlines()) if g else 0

    # package.json scripts
    pkg_scripts: list[str] = []
    try:
        pkg = json.loads((pf / "package.json").read_text(encoding="utf-8"))
        pkg_scripts = list(pkg.get("scripts", {}).keys())
    except (OSError, json.JSONDecodeError):
        pass

    return {
        "planets": planets,
        "planet_count": len(planets),
        "screenshot_folders": sc_folders,
        "git": g,
        "scripts": pkg_scripts,
        "ledger": parse_ledger(pf),
    }


SOURCES: dict[str, callable] = {
    "kdp": scan_kdp,
    "freelance": scan_freelance,
    "orchestrator": scan_orchestrator,
    "portfolio": scan_portfolio,
}


# ------------------------------------------------------------------ main ----
SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
    name            TEXT PRIMARY KEY,
    path            TEXT NOT NULL,
    tier            TEXT NOT NULL,
    state           TEXT,
    next_directive  TEXT,
    ledger_date     TEXT,
    ledger_title    TEXT,
    git_branch      TEXT,
    git_last_commit TEXT,
    git_last_date   TEXT,
    git_dirty       INTEGER,
    stack           TEXT,
    has_readme      INTEGER DEFAULT 0,
    has_license     INTEGER DEFAULT 0,
    score           INTEGER,
    updated_at      TEXT
);
CREATE TABLE IF NOT EXISTS money_list (
    item_no INTEGER PRIMARY KEY,
    text    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scans (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ran_at     TEXT NOT NULL,
    n_done     INTEGER,
    n_running  INTEGER,
    duration_s REAL
);
CREATE TABLE IF NOT EXISTS sources (
    key        TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    scanned_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS timeline (
    project TEXT NOT NULL,
    tier    TEXT NOT NULL,
    date    TEXT NOT NULL,
    title   TEXT NOT NULL,
    state   TEXT
);
CREATE TABLE IF NOT EXISTS parked (
    name TEXT PRIMARY KEY
);
"""


def _scan_project(args: tuple[str, Path]) -> dict:
    """Per-project I/O: ledger + git + stack. Pure function for thread pool."""
    tier, proj = args
    ledger = parse_ledger(proj) or {}
    return {
        "name": proj.name,
        "path": str(proj),
        "tier": tier,
        "state": ledger.get("state"),
        "next_directive": ledger.get("next_directive"),
        "ledger_date": ledger.get("ledger_date"),
        "ledger_title": ledger.get("ledger_title"),
        **git_info(proj),
        "stack": detect_stack(proj),
        "has_readme": int((proj / "README.md").is_file()),
        "has_license": int((proj / "LICENSE").is_file()),
    }


def run_scan(verbose: bool = True) -> dict:
    t0 = datetime.now(timezone.utc)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.execute("PRAGMA journal_mode=WAL;")
    con.execute("PRAGMA busy_timeout=5000;")
    con.executescript(SCHEMA)

    # Migration: verifier columns on pre-Tier1 databases
    cols = {r[1] for r in con.execute("PRAGMA table_info(projects)")}
    for col, typ in (("score", "INTEGER"), ("score_fails", "INTEGER"), ("verified_at", "TEXT")):
        if col not in cols:
            con.execute(f"ALTER TABLE projects ADD COLUMN {col} {typ}")

    # Preserve verifier scores across re-scans
    prev_scores = {
        r[0]: (r[1], r[2], r[3])
        for r in con.execute(
            "SELECT name, score, score_fails, verified_at FROM projects "
            "WHERE score IS NOT NULL"
        )
    }
    con.execute("DELETE FROM projects")

    counts = {"DONE": 0, "RUNNING": 0}
    now_iso = t0.isoformat(timespec="seconds")

    # Collect all project dirs first; git I/O runs with 2 workers (Latitude Protocol)
    all_projects: list[tuple[str, Path]] = []
    for tier in TIERS:
        tier_dir = OP_ROOT / tier
        if not tier_dir.is_dir():
            continue
        for proj in sorted(
            p for p in tier_dir.iterdir() if p.is_dir() and not p.name.startswith(".")
        ):
            all_projects.append((tier, proj))

    with ThreadPoolExecutor(max_workers=2) as ex:
        scanned = list(ex.map(_scan_project, all_projects))

    for row in sorted(scanned, key=lambda r: (r["tier"], r["name"])):
        tier = row["tier"]
        row["score"] = None
        row["updated_at"] = now_iso
        db_cols = ", ".join(row)
        ph = ", ".join("?" * len(row))
        con.execute(f"INSERT INTO projects ({db_cols}) VALUES ({ph})", tuple(row.values()))
        counts[tier] += 1
        if verbose:
            print(f"  [{tier}] {row['name']}: state={row['state']!r} stack={row['stack']!r}")

    # Restore preserved verifier scores
    for name, (score, fails, vat) in prev_scores.items():
        con.execute(
            "UPDATE projects SET score=?, score_fails=?, verified_at=? WHERE name=?",
            (score, fails, vat, name),
        )

    # Timeline: every ledger entry, newest first
    con.execute("DELETE FROM timeline")
    for tier in TIERS:
        tier_dir = OP_ROOT / tier
        if not tier_dir.is_dir():
            continue
        for proj in sorted(p for p in tier_dir.iterdir() if p.is_dir() and not p.name.startswith(".")):
            entries = parse_ledger_all(proj, tier, proj.name)
            con.executemany(
                "INSERT INTO timeline VALUES (?, ?, ?, ?, ?)",
                [
                    (e["project"], e["tier"], e["date"], e["title"], e["state"])
                    for e in entries
                ],
            )

    con.execute("DELETE FROM parked")
    con.executemany(
        "INSERT OR IGNORE INTO parked VALUES (?)", [(n,) for n in parse_parked()]
    )

    con.execute("DELETE FROM money_list")
    con.executemany("INSERT INTO money_list VALUES (?, ?)", parse_money_list())

    for key, fn in SOURCES.items():
        con.execute(
            "INSERT OR REPLACE INTO sources VALUES (?, ?, ?)",
            (key, json.dumps(fn()), now_iso),
        )

    duration = (datetime.now(timezone.utc) - t0).total_seconds()
    con.execute(
        "INSERT INTO scans (ran_at, n_done, n_running, duration_s) VALUES (?, ?, ?, ?)",
        (now_iso, counts["DONE"], counts["RUNNING"], round(duration, 2)),
    )
    con.commit()
    con.close()
    summary = {
        "done": counts["DONE"],
        "running": counts["RUNNING"],
        "duration_s": round(duration, 2),
    }
    if verbose:
        print(f"Scan complete: {summary}")
    return summary


if __name__ == "__main__":
    run_scan()

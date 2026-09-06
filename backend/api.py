#!/usr/bin/env python3
"""Workspace Hub API — FastAPI over hub.db (localhost:8787).

Run from backend/:  uvicorn api:app --port 8787
"""
from __future__ import annotations

import json
import os
import shutil
import sqlite3
import subprocess
from datetime import date, datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from indexer import DB_PATH, WS_ROOT, run_scan, run_verifier

CONFIG_PATH = WS_ROOT / "config.json"
_DEFAULT_CFG = {
    "stalenessDays": 30,
    "timelineMaxLimit": 300,
}


def _cfg() -> dict:
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return _DEFAULT_CFG


app = FastAPI(title="Workspace Hub", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def q(sql: str, params: tuple = ()) -> list[dict]:
    if not DB_PATH.exists():
        raise HTTPException(503, "hub.db missing — POST /api/scan first")
    con = sqlite3.connect(DB_PATH, timeout=5)
    con.row_factory = sqlite3.Row
    try:
        return [dict(r) for r in con.execute(sql, params)]
    finally:
        con.close()


@app.get("/api/health")
def health():
    return {"ok": True, "db": DB_PATH.exists()}


@app.post("/api/scan")
def scan():
    return run_scan(verbose=False)


@app.get("/api/projects")
def projects(
    tier: str | None = None,
    q_: str | None = Query(None, alias="q"),
):
    sql = "SELECT * FROM projects WHERE 1=1"
    params: list = []
    if tier:
        sql += " AND tier = ?"
        params.append(tier.upper())
    if q_:
        q_esc = q_.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        sql += " AND (name LIKE ? ESCAPE '\\' OR next_directive LIKE ? ESCAPE '\\' OR ledger_title LIKE ? ESCAPE '\\')"
        params += [f"%{q_esc}%"] * 3
    sql += " ORDER BY tier DESC, name"
    return q(sql, tuple(params))


@app.get("/api/source/{key}")
def source(key: str):
    rows = q("SELECT data, scanned_at FROM sources WHERE key = ?", (key,))
    if not rows:
        raise HTTPException(404, f"source '{key}' not indexed — POST /api/scan first")
    return {"scanned_at": rows[0]["scanned_at"], "data": json.loads(rows[0]["data"])}


def _disk_info():
    disks = []
    for mnt in ("/", "/media/matrix/DATA"):
        try:
            u = shutil.disk_usage(mnt)
            disks.append({
                "mount": mnt,
                "total_gb": round(u.total / 2**30, 1),
                "used_gb": round(u.used / 2**30, 1),
                "free_gb": round(u.free / 2**30, 1),
                "pct": round(u.used / u.total * 100, 1),
            })
        except OSError:
            pass
    return disks


def _mem_info():
    try:
        info = {}
        with open("/proc/meminfo") as fh:
            for line in fh:
                k, v = line.split(":", 1)
                info[k] = int(v.strip().split()[0]) / 2**20
        return {
            "total_gb": round(info.get("MemTotal", 0), 1),
            "used_gb": round(info.get("MemTotal", 0) - info.get("MemAvailable", 0), 1),
            "pct": round((info["MemTotal"] - info["MemAvailable"]) / info["MemTotal"] * 100, 1)
            if info.get("MemTotal")
            else 0,
        }
    except (OSError, ValueError, KeyError):
        return {}


def _port_info() -> list[int]:
    ports: list[int] = []
    try:
        out = subprocess.run(
            ["ss", "-tln"], capture_output=True, text=True, timeout=5
        ).stdout
        for line in out.splitlines()[1:]:
            parts = line.split()
            if len(parts) >= 4 and ":" in parts[3]:
                try:
                    ports.append(int(parts[3].rsplit(":", 1)[1]))
                except ValueError:
                    pass
        ports = sorted(set(ports))
    except (OSError, subprocess.TimeoutExpired):
        pass
    return ports


@app.get("/api/system")
def system():
    """Live host sentinel — disk, load, memory, listening ports."""
    return {
        "disks": _disk_info(),
        "memory": _mem_info(),
        "load": [round(x, 2) for x in os.getloadavg()],
        "ports": _port_info(),
    }


@app.get("/api/timeline")
def timeline(limit: int = 60):
    cfg = _cfg()
    return q(
        "SELECT project, tier, date, title, state FROM timeline "
        "ORDER BY date DESC, project LIMIT ?",
        (min(limit, cfg.get("timelineMaxLimit", 300)),),
    )


@app.post("/api/verify/{name}")
def verify(name: str):
    rows = q("SELECT path FROM projects WHERE name = ?", (name,))
    if not rows:
        raise HTTPException(404, f"project '{name}' not indexed")
    result = run_verifier(rows[0]["path"])
    if "error" in result:
        raise HTTPException(500, result["error"])
    con = sqlite3.connect(DB_PATH, timeout=5)
    try:
        con.execute(
            "UPDATE projects SET score=?, score_fails=?, verified_at=? WHERE name=?",
            (result["score"], result["fails"], result["verified_at"], name),
        )
        con.commit()
    finally:
        con.close()
    return result


@app.get("/api/overview")
def overview():
    counts = q("SELECT tier, COUNT(*) AS n FROM projects GROUP BY tier")
    states = q(
        "SELECT COALESCE(state,'Unknown') AS state, COUNT(*) AS n "
        "FROM projects GROUP BY state ORDER BY n DESC"
    )
    last_scan = q(
        "SELECT ran_at, n_done, n_running, duration_s FROM scans ORDER BY id DESC LIMIT 1"
    )
    money = q("SELECT item_no, text FROM money_list ORDER BY item_no")
    queue = q(
        "SELECT name, tier, state, next_directive, ledger_date FROM projects "
        "WHERE next_directive IS NOT NULL "
        "ORDER BY CASE tier WHEN 'RUNNING' THEN 0 ELSE 1 END, ledger_date DESC"
    )

    # Staleness radar — excluding parked projects (threshold from config.json)
    parked = {r["name"] for r in q("SELECT name FROM parked")}
    today = date.today()
    stale_days = _cfg().get("stalenessDays", 30)
    stale = []
    for r in q("SELECT name, tier, git_last_date, ledger_date FROM projects"):
        if r["name"] in parked:
            continue
        dates = [d[:10] for d in (r["git_last_date"], r["ledger_date"]) if d]
        if not dates:
            stale.append({"name": r["name"], "tier": r["tier"], "days": None, "last": None})
            continue
        latest = max(dates)
        try:
            days = (today - datetime.strptime(latest, "%Y-%m-%d").date()).days
        except ValueError:
            continue
        if days >= stale_days:
            stale.append({"name": r["name"], "tier": r["tier"], "days": days, "last": latest})
    stale.sort(key=lambda x: x["days"] if x["days"] is not None else 9999, reverse=True)

    return {
        "counts": {c["tier"]: c["n"] for c in counts},
        "states": states,
        "last_scan": last_scan[0] if last_scan else None,
        "money_list": money,
        "action_queue": queue[:12],
        "stale": stale[:10],
        "parked_count": len(parked),
    }

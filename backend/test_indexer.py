import json
import tempfile
from pathlib import Path

import indexer


def _write_ledger(tmp: Path, text: str) -> Path:
    d = tmp / "Proj"
    d.mkdir()
    (d / "AGENTS.md").write_text(text, encoding="utf-8")
    return d


def test_parse_ledger_latest(tmp_path):
    d = _write_ledger(
        tmp_path,
        "### [2026-08-26 15:20] — Latest\n- **State:** Success\n- **Next Turn Directive:** Do X\n\n### [2026-08-22 00:26] — Older\n- **State:** Blocked\n",
    )
    r = indexer.parse_ledger(d)
    assert r["state"] == "Success"
    assert r["next_directive"] == "Do X"
    assert r["ledger_date"] == "2026-08-26 15:20"


def test_parse_ledger_all(tmp_path):
    d = _write_ledger(
        tmp_path,
        "### [2026-08-27 13:55] — A\n- **State:** Success\n### [2026-08-26 14:10] — B\n- **State:** Success\n",
    )
    rows = indexer.parse_ledger_all(d, "RUNNING", "Proj")
    assert len(rows) == 2
    assert rows[0]["title"] == "A"
    assert rows[1]["title"] == "B"


def test_parse_parked_filters_artifacts(tmp_path, monkeypatch):
    # root AGENTS.md with the tricky YoutubeOnAuto line
    root = tmp_path / "opencode_projects"
    root.mkdir()
    (root / "AGENTS.md").write_text(
        "## 🚫 DO NOT TOUCH WITHOUT EXPLICIT USER REQUEST\n"
        "- TaxChain, AudienceOS\n"
        "- YoutubeOnAuto: internal engine — keep running, never sell\n"
        "- nanobot: NOT YOURS TO SELL\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(indexer, "OP_ROOT", root)
    names = indexer.parse_parked()
    assert "TaxChain" in names
    assert "AudienceOS" in names
    assert "YoutubeOnAuto" in names
    assert "nanobot" in names
    assert "never sell" not in names
    assert "internal engine" not in names


def test_detect_stack_node(tmp_path):
    d = tmp_path / "P"
    d.mkdir()
    (d / "package.json").write_text('{"dependencies":{"next":"15.0.0"}}', encoding="utf-8")
    assert indexer.detect_stack(d) == "Next.js"


def test_read_csv_rows_sort(tmp_path):
    f = tmp_path / "g.csv"
    f.write_text("name,score\nb,1\na,10\n", encoding="utf-8")
    rows = indexer.read_csv_rows(f, limit=2, order_by="score")
    assert rows[0]["name"] == "a"

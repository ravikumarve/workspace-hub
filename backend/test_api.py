from fastapi.testclient import TestClient

import api


client = TestClient(api.app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_projects_like_escape():
    # q="%" must not wildcard-match everything
    r = client.get("/api/projects", params={"q": "%"})
    assert r.status_code == 200
    # no project is literally named "%", so 0 results
    assert r.json() == []


def test_projects_filter_tier():
    r = client.get("/api/projects", params={"tier": "DONE"})
    assert r.status_code == 200
    for row in r.json():
        assert row["tier"] == "DONE"


def test_overview_has_stale_and_parked():
    r = client.get("/api/overview")
    assert r.status_code == 200
    d = r.json()
    assert "stale" in d
    assert "parked_count" in d
    assert isinstance(d["parked_count"], int)


def test_verify_unknown_404():
    r = client.post("/api/verify/__no_such_project__")
    assert r.status_code == 404


def test_system_shape():
    r = client.get("/api/system")
    assert r.status_code == 200
    d = r.json()
    assert "disks" in d and "memory" in d and "load" in d

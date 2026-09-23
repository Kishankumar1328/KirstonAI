from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

def test_health():
    assert client.get("/health").status_code == 200

def test_list_scores():
    r = client.get("/api/v1/scores")
    assert r.status_code == 200
    assert len(r.json()["scores"]) >= 3

def test_submit_score():
    r = client.post("/api/v1/scores", json={"player": "TestPlayer", "score": 300})
    assert r.status_code == 201
    assert r.json()["entry"]["score"] == 300

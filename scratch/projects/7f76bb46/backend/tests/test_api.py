from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

def test_health():
    assert client.get("/health").status_code == 200

def test_list():
    r = client.get("/api/v1/comments")
    assert r.status_code == 200
    assert "comments" in r.json()

def test_create():
    r = client.post("/api/v1/comments", json={"name": "Test", "description": "Test item"})
    assert r.status_code == 201

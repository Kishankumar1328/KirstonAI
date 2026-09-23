from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200

def test_list():
    res = client.get("/api/v1/classics")
    assert res.status_code == 200
    assert "items" in res.json()

def test_create():
    res = client.post("/api/v1/classics", json={"name": "New Classic"})
    assert res.status_code == 201

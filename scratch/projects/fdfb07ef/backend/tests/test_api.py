from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_items():
    response = client.get("/api/v1/items")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1

def test_create_item():
    response = client.post("/api/v1/items", json={"name": "Test Item", "status": "pending"})
    assert response.status_code == 201
    item = response.json()["item"]
    assert item["name"] == "Test Item"

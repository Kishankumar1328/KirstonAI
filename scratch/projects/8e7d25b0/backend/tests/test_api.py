from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_scores():
    response = client.get("/api/v1/scores")
    assert response.status_code == 200
    assert len(response.json()["scores"]) >= 1

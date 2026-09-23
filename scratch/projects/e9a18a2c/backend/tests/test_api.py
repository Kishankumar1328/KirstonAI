from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

def test_health():
    assert client.get("/health").status_code == 200

def test_list_tasks():
    r = client.get("/api/v1/tasks")
    assert r.status_code == 200
    assert len(r.json()["tasks"]) > 0

def test_create_task():
    r = client.post("/api/v1/tasks", json={"title": "Test Task", "priority": "high"})
    assert r.status_code == 201
    assert r.json()["task"]["status"] == "todo"

def test_update_task_status():
    r = client.post("/api/v1/tasks", json={"title": "Update Me"})
    task_id = r.json()["task"]["id"]
    r2 = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "in_progress"})
    assert r2.status_code == 200
    assert r2.json()["task"]["status"] == "in_progress"

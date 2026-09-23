import pytest


def test_coding_agent_generate_initial_project(client):
    """Test generating a brand new full-stack project via Coding Agent."""
    payload = {
        "prompt": "Build a complete real-time Task Management system with authentication and FastAPI backend.",
    }
    res = client.post("/api/v1/coding-agent/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "project_id" in data
    assert data["status"] == "completed"
    assert data["message"] == "PROJECT READY"
    assert len(data["files"]) >= 5
    assert len(data["steps"]) == 10
    assert "/download" in data["download_url"]
    assert "generation_source" in data


def test_coding_agent_stateful_update_project(client):
    """Test updating an existing project statefully via multi-turn follow-up prompt."""
    # 1. Create project
    res1 = client.post("/api/v1/coding-agent/generate", json={"prompt": "Build initial blog platform"})
    assert res1.status_code == 200
    pid = res1.json()["project_id"]

    # 2. Update existing project
    res2 = client.post("/api/v1/coding-agent/generate", json={
        "prompt": "Add authentication and comment moderation endpoints",
        "project_id": pid
    })
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["project_id"] == pid
    assert data2["status"] == "completed"


def test_coding_agent_get_file_content(client):
    """Test retrieving text content of a generated project file."""
    res_gen = client.post("/api/v1/coding-agent/generate", json={"prompt": "Build simple app"})
    assert res_gen.status_code == 200
    pid = res_gen.json()["project_id"]

    res_file = client.get(f"/api/v1/coding-agent/project/{pid}/file?path=README.md")
    assert res_file.status_code == 200
    content = res_file.json()["content"]
    # README should have some meaningful content regardless of LLM or template
    assert len(content) > 20


def test_coding_agent_download_zip(client):
    """Test downloading the packaged project ZIP archive."""
    res_gen = client.post("/api/v1/coding-agent/generate", json={"prompt": "Build simple app for zip download"})
    assert res_gen.status_code == 200
    pid = res_gen.json()["project_id"]

    res_zip = client.get(f"/api/v1/coding-agent/project/{pid}/download")
    assert res_zip.status_code == 200
    assert res_zip.headers["content-type"] == "application/zip"
    assert len(res_zip.content) > 0


def test_coding_agent_list_projects(client):
    """Test listing all generated projects."""
    # Ensure at least one project exists
    client.post("/api/v1/coding-agent/generate", json={"prompt": "Build a notes app"})

    res = client.get("/api/v1/coding-agent/projects")
    assert res.status_code == 200
    data = res.json()
    assert "projects" in data
    assert "total" in data
    assert data["total"] >= 1
    assert isinstance(data["projects"], list)


def test_coding_agent_delete_project(client):
    """Test deleting a generated project."""
    res_gen = client.post("/api/v1/coding-agent/generate", json={"prompt": "Build app to delete"})
    assert res_gen.status_code == 200
    pid = res_gen.json()["project_id"]

    # Delete it
    res_del = client.delete(f"/api/v1/coding-agent/project/{pid}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "deleted"

    # Verify it's gone
    res_get = client.get(f"/api/v1/coding-agent/project/{pid}")
    assert res_get.status_code == 404


def test_coding_agent_empty_prompt(client):
    """Test empty prompt returns 400 Bad Request."""
    res = client.post("/api/v1/coding-agent/generate", json={"prompt": ""})
    assert res.status_code == 400


def test_coding_agent_invalid_project_id(client):
    """Test that an invalid project_id for a file fetch returns 400 or 404."""
    res = client.get("/api/v1/coding-agent/project/../../etc/passwd/file?path=README.md")
    assert res.status_code in (400, 404, 422)

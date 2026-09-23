def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy", "service": "antigravity"}

def test_readiness_check(client):
    res = client.get("/health/ready")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"

def test_conversation_api_flow(client):
    # Create conversation
    create_res = client.post("/api/v1/conversations", json={"title": "API Test Chat"})
    assert create_res.status_code == 200
    conv_data = create_res.json()
    thread_id = conv_data["id"]
    assert conv_data["title"] == "API Test Chat"

    # List conversations
    list_res = client.get("/api/v1/conversations")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # Rename conversation
    patch_res = client.patch(f"/api/v1/conversations/{thread_id}", json={"title": "Updated RAG Title"})
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Updated RAG Title"

    # Stream Chat
    chat_res = client.post("/api/v1/chat/stream", json={"thread_id": thread_id, "message": "What is RAG?"})
    assert chat_res.status_code == 200
    assert "text/event-stream" in chat_res.headers["content-type"]
    body = chat_res.text
    assert "event: token" in body
    assert "event: message_complete" in body

    # Search (using keyword 'RAG' which matches message content and title)
    search_res = client.get("/api/v1/search?q=RAG")
    assert search_res.status_code == 200
    assert search_res.json()["total"] >= 1

    # Delete conversation
    del_res = client.delete(f"/api/v1/conversations/{thread_id}")
    assert del_res.status_code == 200

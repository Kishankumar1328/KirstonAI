import pytest


def test_generate_3d_object_valid(client):
    """Test generating a 3D asset from a natural language prompt."""
    payload = {
        "prompt": "Futuristic red cyberpunk sports car with glowing neon headlights",
        "style": "scifi",
        "wireframe": False,
        "roughness": 0.3,
        "metalness": 0.8,
    }
    res = client.post("/api/v1/3d-generator/generate", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["prompt"] == payload["prompt"]
    assert data["status"] == "completed"
    assert data["format"] == "glb"
    assert data["vertex_count"] > 0
    assert data["face_count"] > 0
    assert data["file_size_bytes"] > 500
    assert f"/api/v1/3d-generator/assets/{data['id']}.glb" in data["file_url"]
    assert f"/api/v1/3d-generator/download/{data['id']}" in data["download_url"]


def test_stream_glb_asset(client):
    """Test streaming the binary GLB 2.0 asset and verifying GLTF header."""
    # 1. Generate an asset
    payload = {"prompt": "Medieval fantasy sword with golden hilt"}
    gen_res = client.post("/api/v1/3d-generator/generate", json=payload)
    assert gen_res.status_code == 201
    asset_id = gen_res.json()["id"]

    # 2. Fetch the binary stream
    asset_res = client.get(f"/api/v1/3d-generator/assets/{asset_id}.glb")
    assert asset_res.status_code == 200
    assert "model/gltf-binary" in asset_res.headers["content-type"]
    content = asset_res.content
    assert len(content) > 100
    # First 4 bytes must be 'glTF' (0x46546C67)
    assert content[:4] == b"glTF"


def test_download_3d_asset(client):
    """Test downloading the 3D model as an attachment file."""
    # 1. Generate an asset
    payload = {"prompt": "Ancient stone castle tower"}
    gen_res = client.post("/api/v1/3d-generator/generate", json=payload)
    assert gen_res.status_code == 201
    asset_id = gen_res.json()["id"]

    # 2. Download
    dl_res = client.get(f"/api/v1/3d-generator/download/{asset_id}")
    assert dl_res.status_code == 200
    assert "attachment" in dl_res.headers.get("content-disposition", "").lower()
    assert dl_res.content[:4] == b"glTF"


def test_get_generation_detail(client):
    """Test retrieving details of a single 3D generation."""
    gen_res = client.post("/api/v1/3d-generator/generate", json={"prompt": "Glowing crystal cluster"})
    assert gen_res.status_code == 201
    asset_id = gen_res.json()["id"]

    detail_res = client.get(f"/api/v1/3d-generator/{asset_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == asset_id
    assert detail_res.json()["prompt"] == "Glowing crystal cluster"


def test_list_3d_history(client):
    """Test listing 3D generation history."""
    # Ensure at least one asset exists
    client.post("/api/v1/3d-generator/generate", json={"prompt": "Sci-Fi drone spacecraft"})

    history_res = client.get("/api/v1/3d-generator/history")
    assert history_res.status_code == 200
    data = history_res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    assert isinstance(data["items"], list)


def test_regenerate_3d_object(client):
    """Test regenerating a 3D asset with altered seed/style."""
    gen_res = client.post("/api/v1/3d-generator/generate", json={"prompt": "Combat mech robot"})
    assert gen_res.status_code == 201
    asset_id = gen_res.json()["id"]

    regen_res = client.post(f"/api/v1/3d-generator/regenerate/{asset_id}", json={
        "style": "pbr_photoreal",
        "seed": 424242
    })
    assert regen_res.status_code == 200
    assert regen_res.json()["status"] == "completed"
    assert regen_res.json()["vertex_count"] > 0


def test_delete_3d_object(client):
    """Test deleting a 3D generation."""
    gen_res = client.post("/api/v1/3d-generator/generate", json={"prompt": "Temporary wooden chair"})
    assert gen_res.status_code == 201
    asset_id = gen_res.json()["id"]

    del_res = client.delete(f"/api/v1/3d-generator/{asset_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # Subsequent fetch should be 404
    get_res = client.get(f"/api/v1/3d-generator/{asset_id}")
    assert get_res.status_code == 404


def test_empty_prompt_validation(client):
    """Test that empty or whitespace-only prompts return 400 Bad Request."""
    res = client.post("/api/v1/3d-generator/generate", json={"prompt": "   "})
    assert res.status_code == 400


def test_engines_status(client):
    """Test retrieving available 3D engines and API status."""
    res = client.get("/api/v1/3d-generator/engines")
    assert res.status_code == 200
    data = res.json()
    assert "engines" in data
    assert len(data["engines"]) >= 2
    engine_ids = [e["id"] for e in data["engines"]]
    assert "aimlapi-3d" in engine_ids
    assert "neural-parametric-glb" in engine_ids


def test_validate_3d_geometry_endpoint(client):
    """Test validating 3D mesh geometry and retrieving accuracy metrics."""
    gen_res = client.post("/api/v1/3d-generator/generate", json={"prompt": "Symmetrical silver mechanical drone"})
    assert gen_res.status_code == 201
    asset_id = gen_res.json()["id"]

    val_res = client.post("/api/v1/3d-generator/validate", json={"asset_id": asset_id})
    assert val_res.status_code == 200
    data = val_res.json()
    assert "accuracy" in data
    assert "topology" in data
    assert "dimensions" in data
    assert data["accuracy"].get("overall_score", 0) > 0


def test_export_3d_multi_format(client):
    """Test exporting 3D asset as OBJ string and 3D-print binary STL."""
    gen_res = client.post("/api/v1/3d-generator/generate", json={"prompt": "Vintage brass compass"})
    assert gen_res.status_code == 201
    asset_id = gen_res.json()["id"]

    # Test OBJ export
    obj_res = client.get(f"/api/v1/3d-generator/export/{asset_id}?format=obj")
    assert obj_res.status_code == 200
    assert "v " in obj_res.text
    assert "f " in obj_res.text

    # Test STL export (3D print ready)
    stl_res = client.get(f"/api/v1/3d-generator/export/{asset_id}?format=stl")
    assert stl_res.status_code == 200
    assert len(stl_res.content) > 84
    assert stl_res.content.startswith(b"KirstonAI")


@pytest.mark.parametrize("prompt", [
    "Red formula racing car",
    "Iron combat mech warrior",
    "Ancient fantasy castle with towers",
    "Lush pine tree and foliage",
    "Damascus steel sword with sapphire pommel",
    "Glowing emerald crystal cluster",
    "Ergonomic modern office chair",
    "Stealth orbital starship fighter",
    "Pirate gold treasure chest",
    "Alien geometric hypercube relic",
])
def test_various_prompts_synthesis(client, prompt):
    """Verify procedural and neural mesh synthesis succeeds for various object classes."""
    res = client.post("/api/v1/3d-generator/generate", json={"prompt": prompt})
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "completed"
    assert data["vertex_count"] > 0
    assert data["face_count"] > 0
    assert data.get("accuracy_score", 0) > 0

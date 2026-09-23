import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.species_registry import SPECIES_REGISTRY, SpeciesNLPParser

client = TestClient(app)


def test_species_library_endpoint(client):
    """Validates GET /api/v1/3d-generator/species returns all taxonomy categories."""
    response = client.get("/api/v1/3d-generator/species")
    assert response.status_code == 200
    data = response.json()
    assert "species" in data
    assert data["total"] >= 20
    assert "animals" in data["categories"]
    assert "fish" in data["categories"]
    assert "reptiles" in data["categories"]
    assert "birds" in data["categories"]

    # Verify Tiger
    tiger = next((sp for sp in data["species"] if sp["id"] == "bengal_tiger"), None)
    assert tiger is not None
    assert tiger["name"] == "Bengal Tiger"
    assert "run" in tiger["available_animations"]
    assert tiger["default_environment"] == "jungle"


def test_species_nlp_parser_extraction():
    """Tests natural language parsing of prompt into species, action, and environment."""
    p1 = "Create a realistic Bengal tiger roaring and running through a jungle"
    res1 = SpeciesNLPParser.extract_attributes(p1)
    assert res1["species_name"] == "Bengal Tiger"
    assert res1["species_category"] == "animals"
    assert res1["species_action"] == "run"
    assert res1["species_environment"] == "jungle"

    p2 = "Great White Shark swimming in deep ocean"
    res2 = SpeciesNLPParser.extract_attributes(p2)
    assert res2["species_name"] == "Great White Shark"
    assert res2["species_category"] == "fish"
    assert res2["species_action"] == "swim"
    assert res2["species_environment"] == "ocean"

    p3 = "Bald Eagle soaring and flying high in sky"
    res3 = SpeciesNLPParser.extract_attributes(p3)
    assert res3["species_name"] == "Bald Eagle"
    assert res3["species_category"] == "birds"
    assert res3["species_action"] == "fly"
    assert res3["species_environment"] == "sky"

    p4 = "Venomous King Cobra slithering and coiling"
    res4 = SpeciesNLPParser.extract_attributes(p4)
    assert res4["species_name"] == "King Cobra"
    assert res4["species_category"] == "reptiles"
    assert res4["species_action"] == "slither"


@pytest.mark.parametrize("prompt,expected_species,expected_cat", [
    ("Bengal tiger hunting in tall grass", "Bengal Tiger", "animals"),
    ("Great white shark hunting in ocean water", "Great White Shark", "fish"),
    ("Bald eagle flying above mountains", "Bald Eagle", "birds"),
    ("King cobra slithering in jungle", "King Cobra", "reptiles"),
    ("Emperor penguin waddling on ice", "Emperor Penguin", "birds"),
    ("Saltwater crocodile resting by riverbank", "Saltwater Crocodile", "reptiles"),
])
def test_species_3d_generation(client, prompt, expected_species, expected_cat):
    """Tests generating real binary GLB 3D assets with species metadata."""
    payload = {
        "prompt": prompt,
        "style": "pbr_photoreal"
    }
    response = client.post("/api/v1/3d-generator/generate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["species_name"] == expected_species
    assert data["species_category"] == expected_cat
    assert data["file_size_bytes"] > 0
    assert data["vertex_count"] > 0

    # Test GLB stream
    glb_res = client.get(data["file_url"])
    assert glb_res.status_code == 200
    assert glb_res.content.startswith(b"glTF")

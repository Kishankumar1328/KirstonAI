import pytest
from app.services.geometry_validation import (
    MeshValidator,
    MeshCleaner,
    ProportionValidator,
    AccuracyEvaluator,
)


def test_mesh_cleaner_vertex_welding():
    """Validates that MeshCleaner welds coincident vertices within tolerance and snaps centerline."""
    # 4 positions, 2 of which are coincident within 0.0001 threshold
    positions = [
        (0.00005, 1.0, 0.0),  # Near X=0 centerline
        (0.00008, 1.0, 0.0),  # Coincident with vertex 0
        (1.0, 0.0, 0.0),
        (0.0, 1.0, 1.0),
    ]
    faces = [
        (0, 2, 3),
        (1, 2, 3),
    ]

    cleaned_pos, cleaned_faces, welded_v, removed_f = MeshCleaner.clean_mesh(
        positions, faces, weld_tolerance=0.0001, enforce_symmetry_centerline=True
    )

    assert welded_v >= 1
    assert len(cleaned_pos) < len(positions)
    # Check X=0 snapping
    assert cleaned_pos[0][0] == 0.0


def test_mesh_validator_non_manifold_detection():
    """Validates that MeshValidator detects non-manifold edges when >2 faces share an edge."""
    positions = [
        (0.0, 0.0, 0.0),
        (1.0, 0.0, 0.0),
        (0.5, 1.0, 0.0),
        (0.5, -1.0, 0.0),
        (0.5, 0.0, 1.0),
    ]
    # 3 faces sharing edge (0, 1)
    faces = [
        (0, 1, 2),
        (0, 1, 3),
        (0, 1, 4),
    ]

    audit = MeshValidator.audit_mesh(positions, faces)
    assert audit["non_manifold_edges"] >= 1
    assert audit["is_manifold"] is False


def test_proportion_validator():
    """Validates landmark proportion checks for quadruped and aquatic archetypes."""
    # Quadruped bounding box (Depth=1.8, Width=1.0, Height=1.0)
    quad_res = ProportionValidator.validate_proportions((1.0, 1.0, 1.8), archetype_category="quadruped")
    assert quad_res["passed"] is True
    assert quad_res["archetype"] == "quadruped"

    # Aquatic bounding box (Depth=3.0, Height=1.0, Width=1.0)
    aqua_res = ProportionValidator.validate_proportions((1.0, 1.0, 3.0), archetype_category="fish")
    assert aqua_res["passed"] is True
    assert aqua_res["archetype"] == "aquatic"


def test_accuracy_evaluator_score():
    """Validates accuracy score computation for clean geometry vs degraded geometry."""
    positions = [
        (-1.0, 0.0, -1.0), (1.0, 0.0, -1.0), (1.0, 0.0, 1.0), (-1.0, 0.0, 1.0),
        (0.0, 2.0, 0.0)
    ]
    faces = [
        (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4),
        (0, 2, 1), (0, 3, 2)  # Base
    ]

    audit = MeshValidator.audit_mesh(positions, faces)
    prop = ProportionValidator.validate_proportions(audit["bounding_box"]["size"], "pyramid")
    acc = AccuracyEvaluator.evaluate_accuracy(positions, faces, audit, prop)

    assert acc["overall_score"] >= 80.0
    assert acc["status"] in ["EXCELLENT", "GOOD"]
    assert "overall_score" in acc
    assert "topology_score" in acc

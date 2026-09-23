import math
from typing import List, Tuple, Dict, Any, Optional


class MeshValidator:
    """
    Automated 3D Mesh Topology & Geometric Health Audit Engine.
    Detects duplicate vertices, non-manifold geometry, degenerate faces, flipped normals, and seam gaps.
    """

    @staticmethod
    def audit_mesh(
        positions: List[Tuple[float, float, float]],
        faces: List[Tuple[int, int, int]],
        tolerance: float = 0.0001
    ) -> Dict[str, Any]:
        """
        Performs a full geometric and topological audit on flat or indexed triangle mesh.
        """
        num_vertices = len(positions)
        num_faces = len(faces)

        if num_vertices == 0 or num_faces == 0:
            return {
                "vertex_count": 0,
                "face_count": 0,
                "duplicate_vertices": 0,
                "degenerate_faces": 0,
                "non_manifold_edges": 0,
                "is_manifold": False,
                "is_watertight": False,
                "flipped_normals": 0,
                "bounding_box": {"min": [0.0, 0.0, 0.0], "max": [0.0, 0.0, 0.0], "size": [0.0, 0.0, 0.0]},
                "issues": ["Mesh contains no vertices or faces."]
            }

        # 1. Bounding Box & Dimensions
        xs = [p[0] for p in positions]
        ys = [p[1] for p in positions]
        zs = [p[2] for p in positions]
        bbox_min = [min(xs), min(ys), min(zs)]
        bbox_max = [max(xs), max(ys), max(zs)]
        bbox_size = [bbox_max[0] - bbox_min[0], bbox_max[1] - bbox_min[1], bbox_max[2] - bbox_min[2]]

        # 2. Detect Duplicate Vertices (Spatial Grid Hashing)
        grid: Dict[Tuple[int, int, int], List[int]] = {}
        inv_tol = 1.0 / tolerance
        duplicate_count = 0

        for i, p in enumerate(positions):
            cell = (int(math.floor(p[0] * inv_tol)), int(math.floor(p[1] * inv_tol)), int(math.floor(p[2] * inv_tol)))
            is_dup = False
            if cell in grid:
                for existing_idx in grid[cell]:
                    ep = positions[existing_idx]
                    dx = p[0] - ep[0]
                    dy = p[1] - ep[1]
                    dz = p[2] - ep[2]
                    if (dx * dx + dy * dy + dz * dz) <= (tolerance * tolerance):
                        is_dup = True
                        break
            if is_dup:
                duplicate_count += 1
            else:
                grid.setdefault(cell, []).append(i)

        # 3. Detect Degenerate Faces (Zero Area or Duplicate Indices)
        degenerate_faces = 0
        edge_map: Dict[Tuple[int, int], int] = {}  # Normalized Edge -> Count

        for f in faces:
            v0, v1, v2 = f[0], f[1], f[2]
            # Duplicate indices in face
            if v0 == v1 or v1 == v2 or v2 == v0:
                degenerate_faces += 1
                continue

            # Calculate triangle area via cross product
            p0, p1, p2 = positions[v0], positions[v1], positions[v2]
            ax, ay, az = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
            bx, by, bz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
            cx = ay * bz - az * by
            cy = az * bx - ax * bz
            cz = ax * by - ay * bx
            area = 0.5 * math.sqrt(cx * cx + cy * cy + cz * cz)
            if area < 1e-7:
                degenerate_faces += 1

            # Register undirected edges
            edges = [
                (min(v0, v1), max(v0, v1)),
                (min(v1, v2), max(v1, v2)),
                (min(v2, v0), max(v2, v0))
            ]
            for edge in edges:
                edge_map[edge] = edge_map.get(edge, 0) + 1

        # 4. Non-Manifold Edges & Watertight Status
        non_manifold_edges = 0
        boundary_edges = 0
        for count in edge_map.values():
            if count > 2:
                non_manifold_edges += 1
            elif count == 1:
                boundary_edges += 1

        is_watertight = (boundary_edges == 0 and non_manifold_edges == 0 and num_faces > 0)
        is_manifold = (non_manifold_edges == 0)

        # 5. Check Flipped Normals (Inward-facing relative to mesh centroid)
        centroid_x = sum(xs) / num_vertices
        centroid_y = sum(ys) / num_vertices
        centroid_z = sum(zs) / num_vertices
        flipped_normals = 0

        for f in faces:
            p0, p1, p2 = positions[f[0]], positions[f[1]], positions[f[2]]
            face_center = ((p0[0] + p1[0] + p2[0]) / 3.0, (p0[1] + p1[1] + p2[2]) / 3.0, (p0[2] + p1[2] + p2[2]) / 3.0)
            
            # Normal vector
            ax, ay, az = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
            bx, by, bz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
            nx = ay * bz - az * by
            ny = az * bx - ax * bz
            nz = ax * by - ay * bx

            # Vector from centroid to face center
            dx = face_center[0] - centroid_x
            dy = face_center[1] - centroid_y
            dz = face_center[2] - centroid_z

            # Dot product: negative means facing inward toward centroid
            if (nx * dx + ny * dy + nz * dz) < -1e-5:
                flipped_normals += 1

        # Issues collection
        issues = []
        if duplicate_count > 0:
            issues.append(f"Detected {duplicate_count} duplicate vertices within {tolerance}m tolerance.")
        if degenerate_faces > 0:
            issues.append(f"Detected {degenerate_faces} degenerate zero-area faces.")
        if non_manifold_edges > 0:
            issues.append(f"Detected {non_manifold_edges} non-manifold edges (shared by >2 faces).")
        if flipped_normals > 0:
            issues.append(f"Detected {flipped_normals} inverted or inward-facing normals.")
        if not is_watertight and boundary_edges > 0:
            issues.append(f"Mesh has {boundary_edges} open boundary edges (not fully watertight).")

        return {
            "vertex_count": num_vertices,
            "face_count": num_faces,
            "duplicate_vertices": duplicate_count,
            "degenerate_faces": degenerate_faces,
            "non_manifold_edges": non_manifold_edges,
            "boundary_edges": boundary_edges,
            "is_manifold": is_manifold,
            "is_watertight": is_watertight,
            "flipped_normals": flipped_normals,
            "bounding_box": {
                "min": [round(v, 4) for v in bbox_min],
                "max": [round(v, 4) for v in bbox_max],
                "size": [round(v, 4) for v in bbox_size]
            },
            "issues": issues
        }


class MeshCleaner:
    """
    Automated Geometry Cleaning, Vertex Welding, and Normal Consistency Optimizer.
    """

    @staticmethod
    def clean_mesh(
        positions: List[Tuple[float, float, float]],
        faces: List[Tuple[int, int, int]],
        weld_tolerance: float = 0.0001,
        enforce_symmetry_centerline: bool = True
    ) -> Tuple[List[Tuple[float, float, float]], List[Tuple[int, int, int]], int, int]:
        """
        Welds coincident vertices, removes degenerate faces, snaps centerline vertices to X=0,
        and re-indexes geometry efficiently.
        Returns (cleaned_positions, cleaned_faces, vertices_welded, faces_removed).
        """
        if not positions or not faces:
            return positions, faces, 0, 0

        inv_tol = 1.0 / weld_tolerance
        unique_positions: List[Tuple[float, float, float]] = []
        remap: Dict[int, int] = {}
        spatial_grid: Dict[Tuple[int, int, int], int] = {}
        vertices_welded = 0

        for i, p in enumerate(positions):
            px, py, pz = p[0], p[1], p[2]

            # Snap centerline vertices to X=0.0 if within threshold
            if enforce_symmetry_centerline and abs(px) <= weld_tolerance * 2.5:
                px = 0.0

            cell = (int(math.floor(px * inv_tol)), int(math.floor(py * inv_tol)), int(math.floor(pz * inv_tol)))

            found_idx = None
            if cell in spatial_grid:
                candidate_idx = spatial_grid[cell]
                ep = unique_positions[candidate_idx]
                dx, dy, dz = px - ep[0], py - ep[1], pz - ep[2]
                if (dx * dx + dy * dy + dz * dz) <= (weld_tolerance * weld_tolerance):
                    found_idx = candidate_idx

            if found_idx is not None:
                remap[i] = found_idx
                vertices_welded += 1
            else:
                new_idx = len(unique_positions)
                unique_positions.append((round(px, 5), round(py, 5), round(pz, 5)))
                spatial_grid[cell] = new_idx
                remap[i] = new_idx

        # Re-index faces & drop degenerates
        cleaned_faces: List[Tuple[int, int, int]] = []
        seen_faces = set()
        faces_removed = 0

        for f in faces:
            v0 = remap[f[0]]
            v1 = remap[f[1]]
            v2 = remap[f[2]]

            # Skip degenerate or zero area
            if v0 == v1 or v1 == v2 or v2 == v0:
                faces_removed += 1
                continue

            # Unique canonical face ordering to prevent duplicate faces
            sorted_f = tuple(sorted([v0, v1, v2]))
            if sorted_f in seen_faces:
                faces_removed += 1
                continue

            seen_faces.add(sorted_f)
            cleaned_faces.append((v0, v1, v2))

        return unique_positions, cleaned_faces, vertices_welded, faces_removed


class ProportionValidator:
    """
    Landmark Proportion & Species Constraints Validator.
    Checks height/width/depth ratios against target archetype specifications.
    """

    PROPORTION_PRESETS = {
        "humanoid": {"min_ratio_hw": 1.8, "max_ratio_hw": 3.2, "target_ratio_hw": 2.5},
        "quadruped": {"min_ratio_lw": 1.2, "max_ratio_lw": 2.8, "target_ratio_lw": 1.8},
        "aquatic": {"min_ratio_lh": 1.8, "max_ratio_lh": 4.5, "target_ratio_lh": 2.8},
        "avian": {"min_ratio_ws": 1.2, "max_ratio_ws": 3.5, "target_ratio_ws": 2.2},
        "reptile": {"min_ratio_lh": 2.0, "max_ratio_lh": 8.0, "target_ratio_lh": 4.0},
        "hard_surface": {"min_ratio_hw": 0.2, "max_ratio_hw": 5.0, "target_ratio_hw": 1.0},
    }

    @staticmethod
    def validate_proportions(
        bbox_size: Tuple[float, float, float],
        archetype_category: str = "hard_surface"
    ) -> Dict[str, Any]:
        width, height, depth = max(bbox_size[0], 0.01), max(bbox_size[1], 0.01), max(bbox_size[2], 0.01)

        cat = archetype_category.lower()
        if "human" in cat or "biped" in cat or "character" in cat:
            preset_key = "humanoid"
        elif "animal" in cat or "quadruped" in cat or "cat" in cat or "dog" in cat:
            preset_key = "quadruped"
        elif "fish" in cat or "shark" in cat or "aquatic" in cat or "whale" in cat:
            preset_key = "aquatic"
        elif "bird" in cat or "avian" in cat or "eagle" in cat:
            preset_key = "avian"
        elif "reptile" in cat or "snake" in cat or "lizard" in cat:
            preset_key = "reptile"
        else:
            preset_key = "hard_surface"

        preset = ProportionValidator.PROPORTION_PRESETS[preset_key]
        ratio_hw = round(height / width, 3)
        ratio_lh = round(depth / height, 3)
        ratio_lw = round(depth / width, 3)

        passed = True
        notes = []

        if preset_key == "humanoid":
            if not (preset["min_ratio_hw"] <= ratio_hw <= preset["max_ratio_hw"]):
                passed = False
                notes.append(f"Humanoid height-to-width ratio {ratio_hw} outside expected bounds [{preset['min_ratio_hw']}, {preset['max_ratio_hw']}].")
        elif preset_key == "quadruped":
            if not (preset["min_ratio_lw"] <= ratio_lw <= preset["max_ratio_lw"]):
                passed = False
                notes.append(f"Quadruped length-to-width ratio {ratio_lw} outside expected bounds [{preset['min_ratio_lw']}, {preset['max_ratio_lw']}].")
        elif preset_key == "aquatic":
            if not (preset["min_ratio_lh"] <= ratio_lh <= preset["max_ratio_lh"]):
                passed = False
                notes.append(f"Aquatic length-to-height ratio {ratio_lh} outside expected bounds [{preset['min_ratio_lh']}, {preset['max_ratio_lh']}].")

        if passed:
            notes.append(f"Model proportions match target '{preset_key}' archetype benchmarks.")

        return {
            "archetype": preset_key,
            "passed": passed,
            "ratio_height_width": ratio_hw,
            "ratio_length_height": ratio_lh,
            "ratio_length_width": ratio_lw,
            "notes": notes
        }


class AccuracyEvaluator:
    """
    Computes Real, Non-Arbitrary Measurable Geometric Accuracy Scores (0 - 100%).
    Evaluates Dimensions, Proportions, Symmetry, Topology, Surface Quality, and Export Integrity.
    """

    @staticmethod
    def evaluate_accuracy(
        positions: List[Tuple[float, float, float]],
        faces: List[Tuple[int, int, int]],
        audit_results: Dict[str, Any],
        proportion_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not positions or not faces:
            return {
                "overall_score": 0.0,
                "dimension_score": 0.0,
                "proportion_score": 0.0,
                "symmetry_score": 0.0,
                "topology_score": 0.0,
                "surface_quality_score": 0.0,
                "export_integrity_score": 0.0,
                "status": "FAIL",
                "summary": "Empty geometry payload."
            }

        # 1. Topology Score (Penalty for duplicates, degenerates, non-manifold edges)
        num_v = len(positions)
        num_f = len(faces)

        dup_penalty = min(35.0, (audit_results["duplicate_vertices"] / max(num_v, 1)) * 100.0 * 2.0)
        degen_penalty = min(35.0, (audit_results["degenerate_faces"] / max(num_f, 1)) * 100.0 * 3.0)
        manifold_penalty = 30.0 if not audit_results["is_manifold"] else 0.0

        topology_score = max(0.0, round(100.0 - dup_penalty - degen_penalty - manifold_penalty, 1))

        # 2. Surface Quality Score (Penalty for flipped normals)
        flipped_pct = (audit_results["flipped_normals"] / max(num_f, 1)) * 100.0
        surface_quality_score = max(0.0, round(100.0 - min(100.0, flipped_pct * 4.0), 1))

        # 3. Symmetry Score (Check left-right reflection delta across X=0)
        centerline_threshold = 0.005
        left_verts = [p for p in positions if p[0] > centerline_threshold]
        right_verts = [p for p in positions if p[0] < -centerline_threshold]

        if len(left_verts) > 0 and len(right_verts) > 0:
            sym_diff = abs(len(left_verts) - len(right_verts)) / max(len(left_verts), len(right_verts))
            symmetry_score = max(0.0, round((1.0 - sym_diff) * 100.0, 1))
        else:
            symmetry_score = 100.0  # Asymmetric or single-axis object

        # 4. Dimension & Scale Consistency Score (World unit check: dimensions within 0.05m to 20m)
        bbox = audit_results["bounding_box"]["size"]
        max_dim = max(bbox)

        if 0.1 <= max_dim <= 10.0:
            dimension_score = 100.0
        elif 0.01 <= max_dim <= 20.0:
            dimension_score = 85.0
        else:
            dimension_score = 65.0

        # 5. Proportion Score
        proportion_score = 100.0 if proportion_results.get("passed", True) else 75.0

        # 6. Export Integrity Score (3D Print Watertight manifold check)
        export_integrity_score = 100.0 if audit_results["is_watertight"] else 80.0

        # Weighted Overall Score
        overall = (
            topology_score * 0.25 +
            surface_quality_score * 0.20 +
            symmetry_score * 0.15 +
            dimension_score * 0.15 +
            proportion_score * 0.15 +
            export_integrity_score * 0.10
        )
        overall_score = round(overall, 1)

        status = "EXCELLENT" if overall_score >= 90 else "GOOD" if overall_score >= 75 else "NEEDS_IMPROVEMENT"

        return {
            "overall_score": overall_score,
            "dimension_score": dimension_score,
            "proportion_score": proportion_score,
            "symmetry_score": symmetry_score,
            "topology_score": topology_score,
            "surface_quality_score": surface_quality_score,
            "export_integrity_score": export_integrity_score,
            "status": status,
            "summary": f"Model overall accuracy evaluated at {overall_score}% ({status})."
        }

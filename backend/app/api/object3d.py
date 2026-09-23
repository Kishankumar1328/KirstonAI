import os
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.object3d import (
    Generate3DRequest,
    Regenerate3DRequest,
    Validate3DRequest,
    Object3DResponse,
    Object3DListResponse,
    EngineStatusResponse,
    SpeciesLibraryResponse,
)
from app.services.object3d_service import Object3DService
from app.utils.logging import logger

router = APIRouter(prefix="/api/v1/3d-generator", tags=["3D Object Generator"])


@router.get("/species", response_model=SpeciesLibraryResponse)
def get_species_library():
    """Returns the comprehensive biological species library (Animals, Fish, Reptiles, Birds)."""
    return Object3DService.get_species_library()


@router.post("/generate", response_model=Object3DResponse, status_code=status.HTTP_201_CREATED)
def generate_3d_object(
    payload: Generate3DRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a 3D object asset from a natural-language prompt using AI 3D engines
    (AIML API TripoSR / Neural Parametric GLB 2.0).
    """
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    try:
        res = Object3DService.generate_3d(db, current_user.id, payload)
        return res
    except Exception as e:
        logger.error(f"[3D Generator API] Error generating 3D model: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"3D Generation failed: {str(e)}")


@router.get("/history", response_model=Object3DListResponse)
def list_generation_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists past 3D object generations for the authenticated user."""
    return Object3DService.list_history(db, current_user.id, limit=limit, offset=offset)


@router.get("/engines", response_model=EngineStatusResponse)
def get_engines():
    """Returns available 3D engines, cloud API connectivity, and active models."""
    return Object3DService.get_engine_status()


@router.get("/assets/{id}.glb")
def stream_glb_asset(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Streams the binary GLB 2.0 (model/gltf-binary) file for WebGL Three.js viewport rendering.
    """
    file_path = Object3DService.get_glb_file_path(db, id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="3D Asset file not found.")

    return FileResponse(
        path=file_path,
        media_type="model/gltf-binary",
        filename=f"object_{id}.glb",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400",
        }
    )


@router.get("/download/{id}")
def download_3d_asset(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Downloads the 3D model as an attachment (.glb).
    """
    record = Object3DService.get_generation(db, id)
    if not record:
        raise HTTPException(status_code=404, detail="3D Generation not found.")

    file_path = Object3DService.get_glb_file_path(db, id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="3D Asset file not found on disk.")

    safe_name = "".join(c for c in record.prompt[:30] if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_") or "3d_asset"
    filename = f"{safe_name}_{id[:8]}.glb"

    return FileResponse(
        path=file_path,
        media_type="model/gltf-binary",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/{id}", response_model=Object3DResponse)
def get_generation_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves metadata and status of a single 3D object generation."""
    record = Object3DService.get_generation(db, id, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="3D generation record not found.")
    return record


@router.post("/regenerate/{id}", response_model=Object3DResponse)
def regenerate_3d_object(
    id: str,
    payload: Regenerate3DRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerates a 3D asset with updated seed or parameters."""
    return Object3DService.regenerate_3d(db, id, current_user.id, payload)


@router.post("/validate")
def validate_3d_geometry(
    payload: Validate3DRequest,
    db: Session = Depends(get_db)
):
    """
    Performs on-demand 3D mesh geometric audit, duplicate vertex detection,
    non-manifold check, landmark proportion validation, and real accuracy scoring.
    """
    if payload.asset_id:
        record = Object3DService.get_generation(db, payload.asset_id)
        if not record:
            raise HTTPException(status_code=404, detail="3D asset not found.")

        def _parse_json(val):
            if isinstance(val, str):
                try:
                    import json
                    return json.loads(val)
                except Exception:
                    return {}
            return val or {}

        return {
            "accuracy": _parse_json(record.accuracy_metrics),
            "topology": _parse_json(record.topology_health),
            "dimensions": _parse_json(record.dimensions_meters)
        }
    elif payload.positions and payload.faces:
        return Object3DService.validate_mesh_data(payload.positions, payload.faces, payload.archetype_category or "hard_surface")
    else:
        raise HTTPException(status_code=400, detail="Provide asset_id or raw positions and faces.")


@router.get("/export/{id}")
def export_3d_asset(
    id: str,
    format: str = Query("glb", description="Export format: 'glb', 'obj', 'stl'"),
    db: Session = Depends(get_db)
):
    """
    Exports and downloads the 3D model asset in requested format (.glb, .obj, .stl).
    Supports 3D print ready watertight binary STL files.
    """
    try:
        content_bytes, media_type, ext = Object3DService.export_asset_file(db, id, format_type=format)
        record = Object3DService.get_generation(db, id)
        prompt_slug = "".join(c for c in (record.prompt if record else "asset")[:25] if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_") or "model"
        filename = f"{prompt_slug}_{id[:8]}{ext}"

        return Response(
            content=content_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Allow-Origin": "*",
            }
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"[3D Generator Export API] Failed exporting asset {id} format {format}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_3d_object(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a 3D generation record and its associated GLB asset."""
    success = Object3DService.delete_generation(db, id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="3D generation not found or already deleted.")
    return {"status": "deleted", "id": id}

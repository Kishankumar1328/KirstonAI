import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class Generate3DRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1500, description="Natural language prompt describing the 3D asset")
    negative_prompt: Optional[str] = Field(None, max_length=500, description="Negative prompt")
    engine: Optional[str] = Field("auto", description="3D generator engine: 'auto', 'aimlapi-3d', 'triposr', or 'neural-parametric-glb'")
    style: Optional[str] = Field("game_ready", description="Visual aesthetic style: game_ready, pbr_photoreal, scifi, stylized_clay, isometric_voxel")
    texture_resolution: Optional[str] = Field("1024", description="Texture resolution: 512, 1024, 2048")
    wireframe: Optional[bool] = Field(False, description="Default wireframe preview mode")
    roughness: Optional[float] = Field(0.4, ge=0.0, le=1.0, description="PBR surface roughness")
    metalness: Optional[float] = Field(0.2, ge=0.0, le=1.0, description="PBR surface metalness")
    seed: Optional[int] = Field(None, description="Random generation seed for deterministic output")
    image_url: Optional[str] = Field(None, description="Optional reference image URL for Image-to-3D")
    # Species-Aware Parameters
    species_name: Optional[str] = Field(None, description="Explicit biological species name (e.g. 'Bengal Tiger')")
    species_category: Optional[str] = Field(None, description="Category: 'animals', 'fish', 'reptiles', 'birds'")
    species_action: Optional[str] = Field(None, description="Species action animation: 'walk', 'run', 'swim', 'fly', 'slither', 'idle', 'attack', etc.")
    species_environment: Optional[str] = Field(None, description="Habitat environment: 'jungle', 'ocean', 'savannah', 'sky', 'arctic'")


class Regenerate3DRequest(BaseModel):
    prompt: Optional[str] = Field(None, description="Optional modified prompt")
    engine: Optional[str] = Field(None, description="3D generator engine")
    style: Optional[str] = Field(None, description="Visual aesthetic style")
    seed: Optional[int] = Field(None, description="New seed")
    species_name: Optional[str] = Field(None, description="Species name")
    species_action: Optional[str] = Field(None, description="Species action")
    species_environment: Optional[str] = Field(None, description="Species environment")


class AccuracyMetrics(BaseModel):
    overall_score: float = 100.0
    dimension_score: float = 100.0
    proportion_score: float = 100.0
    symmetry_score: float = 100.0
    topology_score: float = 100.0
    surface_quality_score: float = 100.0
    export_integrity_score: float = 100.0
    status: str = "EXCELLENT"
    summary: str = "Model accuracy evaluated successfully."


class TopologyHealth(BaseModel):
    duplicate_vertices: int = 0
    degenerate_faces: int = 0
    non_manifold_edges: int = 0
    boundary_edges: int = 0
    is_manifold: bool = True
    is_watertight: bool = True
    flipped_normals: int = 0
    issues: List[str] = []


class Validate3DRequest(BaseModel):
    asset_id: Optional[str] = None
    positions: Optional[List[List[float]]] = None
    faces: Optional[List[List[int]]] = None
    archetype_category: Optional[str] = "hard_surface"


class Object3DResponse(BaseModel):
    id: str
    prompt: str
    negative_prompt: Optional[str] = None
    model_engine: str
    format: str
    status: str
    file_url: Optional[str] = None
    download_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size_bytes: int = 0
    vertex_count: int = 0
    face_count: int = 0
    generation_time_ms: int = 0
    parameters: Optional[Dict[str, Any]] = None
    species_name: Optional[str] = None
    species_category: Optional[str] = None
    species_action: Optional[str] = None
    species_environment: Optional[str] = None
    species_rig: Optional[str] = None
    species_metadata: Optional[Dict[str, Any]] = None
    accuracy_score: Optional[float] = 100.0
    accuracy_metrics: Optional[Dict[str, Any]] = None
    topology_health: Optional[Dict[str, Any]] = None
    dimensions_meters: Optional[Dict[str, float]] = None
    error_message: Optional[str] = None
    created_at: datetime

    @field_validator("parameters", "species_metadata", "accuracy_metrics", "topology_health", "dimensions_meters", mode="before")
    @classmethod
    def parse_json_fields(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v

    model_config = ConfigDict(from_attributes=True)


class SpeciesDetail(BaseModel):
    id: str
    name: str
    scientific_name: str
    category: str
    habitat: str
    movement_type: str
    size_dimensions: Dict[str, Any]
    rig_type: str
    available_animations: List[str]
    default_environment: str
    palette: Dict[str, Any]
    camera_preset: Dict[str, Any]
    description: str


class SpeciesLibraryResponse(BaseModel):
    total: int
    categories: List[str]
    species: List[SpeciesDetail]


class Object3DListResponse(BaseModel):
    items: List[Object3DResponse]
    total: int


class EngineInfo(BaseModel):
    id: str
    name: str
    description: str
    status: str  # "online", "active", "fallback"
    supported_formats: List[str]
    capabilities: List[str]


class EngineStatusResponse(BaseModel):
    default_engine: str
    engines: List[EngineInfo]
    aimlapi_connected: bool
    aimlapi_has_credits: bool
    aimlapi_status_message: str

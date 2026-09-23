export type SpeciesCategory = 'all' | 'animals' | 'fish' | 'reptiles' | 'birds';

export type AnimationAction = 
  | 'idle'
  | 'walk'
  | 'run'
  | 'swim'
  | 'fly'
  | 'wing_flap'
  | 'glide'
  | 'takeoff'
  | 'land'
  | 'perch'
  | 'slither'
  | 'crawl'
  | 'coil'
  | 'strike'
  | 'attack'
  | 'jump'
  | 'eat'
  | 'dive'
  | 'turn'
  | 'flutter';

export type StageEnvironment = 'studio' | 'jungle' | 'ocean' | 'savannah' | 'sky' | 'arctic';

export interface SpeciesDetail {
  id: string;
  name: string;
  scientific_name: string;
  category: 'animals' | 'fish' | 'reptiles' | 'birds';
  habitat: string;
  movement_type: string;
  size_dimensions: {
    length_m: number;
    height_m: number;
    weight_kg: number;
  };
  rig_type: string;
  available_animations: AnimationAction[];
  default_environment: StageEnvironment;
  palette: {
    primary: [number, number, number, number];
    secondary: [number, number, number, number];
    accent: [number, number, number, number];
  };
  camera_preset: {
    distance: number;
    target_y: number;
    fov: number;
  };
  description: string;
  icon?: string;
}

export interface SpeciesLibraryResponse {
  total: number;
  categories: string[];
  species: SpeciesDetail[];
}

export interface AccuracyMetrics {
  overall_score: number;
  dimension_score: number;
  proportion_score: number;
  symmetry_score: number;
  topology_score: number;
  surface_quality_score: number;
  export_integrity_score: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | string;
  summary: string;
}

export interface TopologyHealth {
  duplicate_vertices: number;
  degenerate_faces: number;
  non_manifold_edges: number;
  boundary_edges: number;
  is_manifold: boolean;
  is_watertight: boolean;
  flipped_normals: number;
  issues: string[];
}

export interface Object3DItem {
  id: string;
  prompt: string;
  negative_prompt?: string | null;
  model_engine: string;
  format: string;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  file_url: string;
  download_url: string;
  thumbnail_url?: string | null;
  file_size_bytes: number;
  vertex_count: number;
  face_count: number;
  generation_time_ms: number;
  parameters?: {
    style?: string;
    texture_resolution?: string;
    wireframe?: boolean;
    roughness?: number;
    metalness?: number;
    seed?: number;
    image_url?: string;
    species_name?: string;
    species_action?: string;
    species_environment?: string;
  } | null;
  species_name?: string | null;
  species_category?: string | null;
  species_action?: string | null;
  species_environment?: string | null;
  species_rig?: string | null;
  species_metadata?: SpeciesDetail | null;
  accuracy_score?: number;
  accuracy_metrics?: AccuracyMetrics | null;
  topology_health?: TopologyHealth | null;
  dimensions_meters?: { x: number; y: number; z: number } | null;
  error_message?: string | null;
  created_at: string;
}

export interface Generate3DParams {
  prompt: string;
  negative_prompt?: string;
  engine?: string;
  style?: string;
  texture_resolution?: string;
  wireframe?: boolean;
  roughness?: number;
  metalness?: number;
  seed?: number;
  image_url?: string;
  species_name?: string;
  species_category?: string;
  species_action?: string;
  species_environment?: string;
}

export interface Regenerate3DParams {
  prompt?: string;
  engine?: string;
  style?: string;
  seed?: number;
  species_name?: string;
  species_action?: string;
  species_environment?: string;
}

export interface EngineInfo {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'active' | 'fallback' | string;
  supported_formats: string[];
  capabilities: string[];
}

export interface EngineStatus {
  default_engine: string;
  engines: EngineInfo[];
  aimlapi_connected: boolean;
  aimlapi_has_credits: boolean;
  aimlapi_status_message: string;
}

export interface ViewportSettings {
  wireframe: boolean;
  showGrid: boolean;
  shadingMode: 'pbr' | 'wireframe' | 'matcap' | 'clay';
  environmentBg: StageEnvironment;
  autoRotate: boolean;
  rotationSpeed: number;
  lightIntensity: number;
  showRulers?: boolean;
  showNormals?: boolean;
  showQuadView?: boolean;
  showHeatmap?: boolean;
}

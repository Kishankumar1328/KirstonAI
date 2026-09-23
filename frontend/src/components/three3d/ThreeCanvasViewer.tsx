import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Layers,
  Grid,
  Sun,
  Eye,
  Play,
  Pause,
  Square,
  Download,
  Box,
  Cpu,
  Info,
  Sliders,
  Sparkles,
  AlertCircle,
  Film,
  FastForward,
  Repeat,
  Compass,
} from 'lucide-react';
import {
  Object3DItem,
  ViewportSettings,
  SpeciesDetail,
  AnimationAction,
  StageEnvironment,
} from '../../types/object3d';

interface ThreeCanvasViewerProps {
  currentModel: Object3DItem | null;
  isLoading: boolean;
  activeSpecies?: SpeciesDetail | null;
  activeAction?: AnimationAction;
  onActionChange?: (action: AnimationAction) => void;
  onDownloadGlb?: () => void;
  onRegenerate?: () => void;
}

export const ThreeCanvasViewer: React.FC<ThreeCanvasViewerProps> = ({
  currentModel,
  isLoading,
  activeSpecies,
  activeAction = 'idle',
  onActionChange,
  onDownloadGlb,
  onRegenerate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animActionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const animFrameIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Environment & Animation State
  const [stageEnv, setStageEnv] = useState<StageEnvironment>('studio');
  const [isPlaying, setIsPlaying] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(4.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelStats, setModelStats] = useState<{
    vertices: number;
    faces: number;
    dimensions: { x: number; y: number; z: number };
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(true);

  // Viewport Settings
  const [settings, setSettings] = useState<ViewportSettings>({
    wireframe: false,
    showGrid: true,
    shadingMode: 'pbr',
    environmentBg: 'studio',
    autoRotate: false,
    rotationSpeed: 1.0,
    lightIntensity: 1.0,
  });

  // Determine active environment
  const effectiveEnv: StageEnvironment =
    activeSpecies?.default_environment ||
    (currentModel?.species_environment as StageEnvironment) ||
    stageEnv;

  // ── 1. Setup Adaptive Scene, Camera & Lighting ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3.8, 2.4, 4.8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 40;
    controls.minDistance = 0.4;
    controls.target.set(0, 0.9, 0);
    controlsRef.current = controls;

    // Model Container Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Dynamic Lights Container
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;

    // Grid Floor
    const grid = new THREE.GridHelper(16, 16, 0x76b900, 0x1f272e);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    // ── Animation Loop ───────────────────────────────────────────────────────
    let lastTime = performance.now();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update Orbit Controls
      controls.update();

      // Playback Clock
      if (isPlaying) {
        const timeSec = (now / 1000) * animSpeed;
        setCurrentTime((prev) => (prev + delta * animSpeed) % duration);

        // A. GLTF Mixer playback
        if (animMixerRef.current) {
          animMixerRef.current.update(delta * animSpeed);
        }

        // B. Real-Time Procedural Kinematic Species Part Animator
        if (modelGroupRef.current) {
          applyKinematicRigAnimation(modelGroupRef.current, activeAction, timeSec, activeSpecies?.category);
        }

        // C. Particle System animation
        if (particlesRef.current) {
          const positions = particlesRef.current.geometry.attributes.position;
          if (positions) {
            const arr = positions.array as Float32Array;
            for (let i = 1; i < arr.length; i += 3) {
              if (effectiveEnv === 'ocean') {
                arr[i] += delta * 0.8; // Rising bubbles
                if (arr[i] > 6) arr[i] = -0.5;
              } else if (effectiveEnv === 'arctic') {
                arr[i] -= delta * 0.6; // Falling snow
                if (arr[i] < 0) arr[i] = 6.0;
              } else if (effectiveEnv === 'sky') {
                arr[i - 1] -= delta * 3.5; // Wind streaks
                if (arr[i - 1] < -8) arr[i - 1] = 8.0;
              }
            }
            positions.needsUpdate = true;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // ── 2. Update Adaptive Environment Stage & Lighting ────────────────────────
  useEffect(() => {
    if (!sceneRef.current || !lightsGroupRef.current) return;

    const scene = sceneRef.current;
    const lights = lightsGroupRef.current;
    lights.clear();

    // Remove old particle system
    if (particlesRef.current) {
      scene.remove(particlesRef.current);
      particlesRef.current.geometry.dispose();
      particlesRef.current = null;
    }

    if (effectiveEnv === 'ocean') {
      // 🌊 Deep Ocean Environment
      scene.background = new THREE.Color(0x001224);
      scene.fog = new THREE.FogExp2(0x001224, 0.04);

      // Key Caustic Light
      const key = new THREE.DirectionalLight(0x00e5ff, 2.2);
      key.position.set(0, 10, 2);
      lights.add(key);

      // Deep Blue Ambient
      const amb = new THREE.AmbientLight(0x002d5a, 1.2);
      lights.add(amb);

      // Turquoise Rim Light
      const rim = new THREE.DirectionalLight(0x00ffaa, 1.5);
      rim.position.set(0, -4, -5);
      lights.add(rim);

      // Rising Bubble / Plankton Particles
      const particleCount = 200;
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 12;
        pos[i + 1] = Math.random() * 6;
        pos[i + 2] = (Math.random() - 0.5) * 12;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0x88f0ff,
        size: 0.08,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geom, mat);
      scene.add(points);
      particlesRef.current = points;

      if (gridHelperRef.current) gridHelperRef.current.visible = false;
    } else if (effectiveEnv === 'jungle' || effectiveEnv === 'savannah') {
      // 🌴 Jungle / Savannah Sunlight Environment
      const bgColor = effectiveEnv === 'jungle' ? 0x08140e : 0x14100a;
      scene.background = new THREE.Color(bgColor);
      scene.fog = new THREE.FogExp2(bgColor, 0.03);

      // Warm Sunlight
      const sun = new THREE.DirectionalLight(0xfffaed, 2.0);
      sun.position.set(6, 12, 6);
      sun.castShadow = true;
      lights.add(sun);

      // Green / Amber Fill
      const fill = new THREE.DirectionalLight(
        effectiveEnv === 'jungle' ? 0x44bb55 : 0xdd8833,
        0.8
      );
      fill.position.set(-6, 4, -4);
      lights.add(fill);

      // Ambient
      const amb = new THREE.AmbientLight(0xffffff, 0.55);
      lights.add(amb);

      if (gridHelperRef.current) {
        gridHelperRef.current.visible = settings.showGrid;
      }
    } else if (effectiveEnv === 'sky') {
      // ☁️ High Altitude Sky Environment
      scene.background = new THREE.Color(0x0a1a36);
      scene.fog = new THREE.FogExp2(0x0a1a36, 0.025);

      const sun = new THREE.DirectionalLight(0xffffff, 2.5);
      sun.position.set(4, 10, 4);
      lights.add(sun);

      const skyAmb = new THREE.AmbientLight(0x60a5fa, 0.85);
      lights.add(skyAmb);

      // Cloud floor plane
      const cloudGeo = new THREE.PlaneGeometry(30, 30);
      const cloudMat = new THREE.MeshBasicMaterial({
        color: 0x22385c,
        transparent: true,
        opacity: 0.35,
      });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.rotation.x = -Math.PI / 2;
      cloudMesh.position.y = -1.5;
      lights.add(cloudMesh);

      if (gridHelperRef.current) gridHelperRef.current.visible = false;
    } else if (effectiveEnv === 'arctic') {
      // ❄️ Arctic Glacial Snow
      scene.background = new THREE.Color(0x0a1420);
      scene.fog = new THREE.FogExp2(0x0a1420, 0.035);

      const iceLight = new THREE.DirectionalLight(0xd0e8ff, 2.0);
      iceLight.position.set(4, 8, 4);
      lights.add(iceLight);

      const amb = new THREE.AmbientLight(0x7090b0, 0.8);
      lights.add(amb);

      if (gridHelperRef.current) gridHelperRef.current.visible = settings.showGrid;
    } else {
      // 🎮 Tech Dark Studio (Default)
      scene.background = new THREE.Color(0x090d10);
      scene.fog = null;

      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(5, 8, 5);
      lights.add(key);

      const fill = new THREE.DirectionalLight(0x76b900, 0.6); // Nvidia green tint fill
      fill.position.set(-5, 4, -3);
      lights.add(fill);

      const rim = new THREE.DirectionalLight(0x00e5ff, 0.8);
      rim.position.set(0, 6, -6);
      lights.add(rim);

      const amb = new THREE.AmbientLight(0xffffff, 0.5);
      lights.add(amb);

      if (gridHelperRef.current) gridHelperRef.current.visible = settings.showGrid;
    }
  }, [effectiveEnv, settings.showGrid]);

  // ── 3. Load 3D Asset (GLB/GLTF) into Scene ─────────────────────────────────
  useEffect(() => {
    if (!currentModel || !modelGroupRef.current || !sceneRef.current) return;

    setLoadError(null);
    const modelGroup = modelGroupRef.current;

    // Clear previous model meshes
    while (modelGroup.children.length > 0) {
      const child = modelGroup.children[0];
      modelGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
    }

    if (animMixerRef.current) {
      animMixerRef.current.stopAllAction();
      animMixerRef.current = null;
      animActionsRef.current.clear();
    }

    const loader = new GLTFLoader();
    const assetUrl = currentModel.file_url.startsWith('http')
      ? currentModel.file_url
      : `${import.meta.env.VITE_API_BASE_URL || ''}${currentModel.file_url}`;

    loader.load(
      assetUrl,
      (gltf) => {
        const root = gltf.scene;

        // Auto-center and normalize scale
        const bbox = new THREE.Box3().setFromObject(root);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = maxDim > 0 ? 2.4 / maxDim : 1.0;
        root.scale.setScalar(scaleFactor);

        // Center base on grid floor
        root.position.x = -center.x * scaleFactor;
        root.position.y = -bbox.min.y * scaleFactor;
        root.position.z = -center.z * scaleFactor;

        // Apply Shading / Ensure Fully Solid PBR Materials
        root.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                const stdMat = m as THREE.MeshStandardMaterial;
                stdMat.wireframe = settings.wireframe;
                if (!settings.wireframe) {
                  stdMat.transparent = false;
                  stdMat.opacity = 1.0;
                  stdMat.depthWrite = true;
                  stdMat.depthTest = true;
                }
                stdMat.needsUpdate = true;
              });
            }
          }
        });

        modelGroup.add(root);

        // Count vertices & faces
        let vCount = 0;
        let fCount = 0;
        root.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const geom = (node as THREE.Mesh).geometry;
            if (geom) {
              vCount += geom.attributes.position ? geom.attributes.position.count : 0;
              fCount += geom.index ? geom.index.count / 3 : 0;
            }
          }
        });

        setModelStats({
          vertices: vCount || currentModel.vertex_count,
          faces: fCount || currentModel.face_count,
          dimensions: {
            x: Number(size.x.toFixed(2)),
            y: Number(size.y.toFixed(2)),
            z: Number(size.z.toFixed(2)),
          },
        });

        // Setup Embedded Animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(root);
          animMixerRef.current = mixer;
          gltf.animations.forEach((clip) => {
            const act = mixer.clipAction(clip);
            animActionsRef.current.set(clip.name.toLowerCase(), act);
          });
          const firstAction = animActionsRef.current.values().next().value;
          if (firstAction) firstAction.play();
        }

        // Camera auto-framing preset from species
        if (cameraRef.current && controlsRef.current) {
          const dist = activeSpecies?.camera_preset?.distance || 4.2;
          const targetY = activeSpecies?.camera_preset?.target_y || 0.9;
          cameraRef.current.position.set(dist * 0.8, dist * 0.5, dist);
          controlsRef.current.target.set(0, targetY, 0);
          controlsRef.current.update();
        }
      },
      undefined,
      (err) => {
        console.error('Error loading 3D GLB model:', err);
        setLoadError('Failed loading 3D asset binary. Please try regenerating.');
      }
    );
  }, [currentModel?.id, activeSpecies?.id]);

  // ── 3.1. Dynamically Synchronize Fully Solid vs Wireframe Material State ────
  useEffect(() => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            const stdMat = m as THREE.MeshStandardMaterial;
            stdMat.wireframe = settings.wireframe;
            if (!settings.wireframe) {
              stdMat.transparent = false;
              stdMat.opacity = 1.0;
              stdMat.depthWrite = true;
              stdMat.depthTest = true;
            }
            stdMat.needsUpdate = true;
          });
        }
      }
    });
  }, [settings.wireframe]);

  // ── 4. Real-Time Procedural Kinematic Species Rig Part Animator ─────────────
  const applyKinematicRigAnimation = (
    group: THREE.Group,
    action: AnimationAction,
    time: number,
    category?: string
  ) => {
    const isRunning = action === 'run';
    const isWalking = action === 'walk';
    const isSwimming = action === 'swim' || action === 'dive';
    const isFlying = action === 'fly' || action === 'wing_flap';
    const isGliding = action === 'glide';
    const isSlithering = action === 'slither' || action === 'crawl';
    const isAttacking = action === 'attack' || action === 'strike';
    const isJumping = action === 'jump';

    const gaitFreq = isRunning ? 7.0 : isWalking ? 3.5 : 2.0;

    group.traverse((node) => {
      const name = node.name.toLowerCase();

      // ── A. Legs & Flippers (Quadruped vs Bipedal vs Swimming) ──
      if (name.includes('leg') || name.includes('flipper') || name.includes('tire') || name.includes('foot')) {
        const isBipedal = category === 'birds' || name.includes('stilt');
        const isSwimmingFlipper = (name.includes('flipper') && (isSwimming || category === 'fish' || name.includes('whale') || name.includes('dolphin')));
        
        if (isSwimmingFlipper) {
           // Paddling / Rowing for turtles or whales
           node.rotation.z = Math.sin(time * 3.0) * 0.15;
           node.rotation.x = Math.cos(time * 3.0) * 0.15;
        } else if (isWalking || isRunning) {
          const isLeft = name.includes('left') || name.includes('-_0') || name.includes('-_1') || name.includes('-_0.12');
          
          let phase = 0;
          if (isBipedal) {
             // Bipedal alternating legs
             phase = isLeft ? 0 : Math.PI;
          } else {
             // Quadruped diagonal phasing
             const isFront = name.includes('front') || name.includes('0.5') || name.includes('0.4');
             phase = (isLeft ? 0 : Math.PI) + (isFront ? 0 : Math.PI);
          }
          const swingAngle = Math.sin(time * gaitFreq + phase) * (isRunning ? 0.6 : 0.35);
          node.rotation.x = swingAngle;
        } else if (isAttacking) {
          node.rotation.x = Math.sin(time * 10) * 0.15;
        } else if (isJumping) {
          node.rotation.x = Math.sin(time * 3) * 0.45;
        } else {
          node.rotation.x = 0; // Neutral stance
          node.rotation.z = 0;
        }
      }

      // ── B. Avian Wings (Flapping, Gliding, Hovering) ──
      if (name.includes('wing') || name.includes('forewing') || name.includes('feather')) {
        const isHummingbird = name.includes('rapidwing');
        if (isHummingbird && (isFlying || action === 'idle')) {
           // Hyper-fast figure-8 hovering
           const isLeft = name.includes('left') || name.includes('-0.15');
           const hoverFreq = 30.0; // Very fast
           const flapAngle = Math.sin(time * hoverFreq) * 0.8;
           node.rotation.z = isLeft ? -flapAngle : flapAngle;
           node.rotation.x = Math.cos(time * hoverFreq) * 0.4;
        } else if (isFlying) {
          const isLeft = name.includes('left') || name.includes('-1');
          const flapAngle = Math.sin(time * (isRunning ? 9.0 : 6.0)) * 0.55;
          node.rotation.z = isLeft ? -flapAngle : flapAngle;
          node.rotation.x = Math.cos(time * 6.0) * 0.15; // Wrist pitch
        } else if (isGliding) {
          // Subtle aerodynamic dihedral tilt
          const isLeft = name.includes('left') || name.includes('-1');
          node.rotation.z = isLeft ? -0.15 + Math.sin(time * 2) * 0.05 : 0.15 - Math.sin(time * 2) * 0.05;
        } else {
          node.rotation.z = 0;
          node.rotation.x = 0;
        }
      }

      // ── C. Tails & Fins & Tentacles (Marine Locomotion) ──
      if (name.includes('tail') || name.includes('fin') || name.includes('fluke') || name.includes('mantle') || name.includes('tentacle')) {
        const isMarineMammal = name.includes('whale') || name.includes('dolphin') || name.includes('fluke');
        const isTentacle = name.includes('tentacle');

        if (isTentacle) {
           // Octopus undulating tentacles
           const waveFreq = 2.0;
           // Add index offset for radiating tentacles
           const idxStr = name.split('_').pop();
           const idxOffset = idxStr ? parseInt(idxStr) * 0.5 : 0;
           node.rotation.x = Math.sin(time * waveFreq + idxOffset) * 0.2;
           node.rotation.z = Math.cos(time * waveFreq + idxOffset) * 0.15;
        } else if (isMarineMammal) {
           // Whales & Dolphins: Vertical fluke motion (Pitch)
           if (isSwimming || isSlithering) {
             const waveFreq = isRunning ? 6.5 : 3.8;
             node.rotation.x = Math.sin(time * waveFreq) * 0.4;
           } else {
             node.rotation.x = Math.sin(time * 1.5) * 0.08;
           }
        } else {
           // Fish & Sharks: Horizontal tail motion (Yaw)
           if (isSwimming || isSlithering) {
             const waveFreq = isRunning ? 6.5 : 3.8;
             node.rotation.y = Math.sin(time * waveFreq) * (name.includes('tail') ? 0.5 : 0.3);
             node.rotation.z = Math.cos(time * waveFreq) * 0.12;
           } else if (action === 'flutter') {
             node.rotation.y = Math.sin(time * 10.0) * 0.4;
           } else {
             node.rotation.y = Math.sin(time * 1.5) * 0.08;
           }
        }
      }

      // ── D. Serpentine Spine / Necks (Slithering vs Sway) ──
      if (name.includes('cobra') || name.includes('coil') || name.includes('hood') || name.includes('neck')) {
        const isLongNeck = name.includes('neck') && !name.includes('snake') && !name.includes('cobra');
        if (isLongNeck) {
           // Giraffe, Flamingo majestic sway
           node.rotation.y = Math.sin(time * 1.0) * 0.05;
           node.rotation.z = Math.cos(time * 1.2) * 0.02;
        } else if (isSlithering) {
          // Snake slithering
          node.rotation.y = Math.sin(time * 4.2) * 0.4;
          node.position.x = Math.sin(time * 4.2) * 0.15;
        } else if (isAttacking) {
          // Strike coil spring forward
          node.position.z = Math.sin(time * 8.0) * 0.25;
          node.rotation.x = Math.sin(time * 8.0) * 0.3;
        } else {
          node.rotation.y = Math.sin(time * 1.2) * 0.05;
        }
      }

      // ── E. Head & Jaw Breathing & Alert Scanning ──
      if (name.includes('head') || name.includes('jaw') || name.includes('snout') || name.includes('beak')) {
        if (action === 'attack') {
          node.rotation.x = Math.sin(time * 6.0) * 0.35; // Roaring / Biting
        } else if (action === 'eat') {
          node.rotation.x = -0.4 + Math.sin(time * 4.0) * 0.2; // Grazing down
        } else {
          // Idle ambient scanning
          node.rotation.y = Math.sin(time * 1.2) * 0.12;
          node.rotation.x = Math.sin(time * 2.0) * 0.04;
        }
      }

      // ── F. Torso Breathing & Vertical Stride Bob ──
      if (name.includes('torso') || name.includes('body') || name.includes('chassis')) {
        if (isWalking || isRunning) {
          node.position.y = Math.abs(Math.sin(time * gaitFreq)) * (isRunning ? 0.12 : 0.05);
        } else if (isFlying) {
          node.position.y = Math.sin(time * 3.0) * 0.15;
        } else {
          // Idle respiration breathing expansion
          node.scale.set(
            1.0 + Math.sin(time * 2.0) * 0.015,
            1.0 + Math.sin(time * 2.0) * 0.02,
            1.0 + Math.sin(time * 2.0) * 0.015
          );
        }
      }
    });
  };

  // Reset Camera View
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const dist = activeSpecies?.camera_preset?.distance || 4.2;
    const targetY = activeSpecies?.camera_preset?.target_y || 0.9;
    cameraRef.current.position.set(dist * 0.8, dist * 0.5, dist);
    controlsRef.current.target.set(0, targetY, 0);
    controlsRef.current.update();
  };

  // Filter supported animations for the active species
  const supportedActions: AnimationAction[] = activeSpecies?.available_animations || [
    'idle',
    'walk',
    'run',
    'attack',
  ];

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#080B0D] rounded-2xl border border-[#22292F] overflow-hidden shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing outline-none" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in text-white space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#76B900] to-emerald-400 p-0.5 animate-spin shadow-glow-nvidia">
            <div className="w-full h-full bg-[#0E1215] rounded-2xl flex items-center justify-center">
              <Box className="w-6 h-6 text-[#76B900]" />
            </div>
          </div>
          <p className="text-sm font-bold font-mono tracking-wide text-gray-200">
            Synthesizing 3D Kinematic Mesh...
          </p>
          <span className="text-[11px] font-mono text-[#76B900]">
            Extracting Anatomy, Rig Skeleton & Textures
          </span>
        </div>
      )}

      {/* Load Error Notification */}
      {loadError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2 shadow-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Top Left: Species & Model Title Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-[#0E1316]/90 backdrop-blur-md border border-[#242D34] shadow-lg flex items-center gap-2">
          <span className="text-base">{activeSpecies?.icon || '🐾'}</span>
          <div>
            <h3 className="text-xs font-bold text-white font-mono leading-none">
              {activeSpecies?.name || currentModel?.species_name || currentModel?.prompt?.slice(0, 24) || '3D Viewport'}
            </h3>
            <p className="text-[10px] text-[#76B900] font-mono mt-0.5">
              {currentModel?.species_rig || 'Procedural Kinematics Active'}
            </p>
          </div>
        </div>

        {/* Environment Stage Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0E1316]/80 backdrop-blur-md border border-[#242D34] text-[10px] font-mono text-cyan-400">
          <Compass className="w-3 h-3" />
          <span className="capitalize">{effectiveEnv} Stage</span>
        </div>
      </div>

      {/* Top Right: Viewport Display Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {/* Toggle Solid / Wireframe Shading */}
        <button
          onClick={() => setSettings((s) => ({ ...s, wireframe: !s.wireframe }))}
          title={settings.wireframe ? "Switch to Fully Solid Shading" : "Switch to Wireframe Mode"}
          className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm ${
            !settings.wireframe
              ? 'bg-[#76B900]/20 text-[#76B900] border-[#76B900]/60 hover:bg-[#76B900]/30 shadow-glow-nvidia'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/60 hover:bg-amber-500/30'
          }`}
        >
          {!settings.wireframe ? (
            <>
              <Box className="w-3.5 h-3.5 text-[#76B900]" />
              <span className="hidden sm:inline">Solid (PBR)</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Wireframe</span>
            </>
          )}
        </button>

        {/* Toggle Grid */}
        <button
          onClick={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
          title="Toggle Floor Grid"
          className={`p-2 rounded-xl backdrop-blur-md border transition ${
            settings.showGrid
              ? 'bg-[#182229] text-[#76B900] border-[#76B900]/40'
              : 'bg-[#0E1316]/80 text-gray-400 border-[#242D34] hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          title="Reset Camera View"
          className="p-2 rounded-xl bg-[#0E1316]/80 backdrop-blur-md border border-[#242D34] text-gray-300 hover:text-white hover:bg-[#182026] transition"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title="Toggle Fullscreen"
          className="p-2 rounded-xl bg-[#0E1316]/80 backdrop-blur-md border border-[#242D34] text-gray-300 hover:text-white hover:bg-[#182026] transition"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Top Right: Mesh Stats Inspector */}
      {showInspector && modelStats && (
        <div className="absolute top-14 right-3 z-10 w-48 p-3 rounded-xl bg-[#0E1316]/90 backdrop-blur-md border border-[#242D34] shadow-xl text-[10px] font-mono text-gray-300 space-y-1.5 hidden md:block select-none animate-fade-in">
          <div className="flex items-center justify-between text-gray-400 pb-1 border-b border-[#1E252C]">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#76B900]" /> Mesh Stats
            </span>
            <span className="text-[#76B900] font-bold">GLTF 2.0</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <div>
              <p className="text-gray-500 text-[9px]">VERTICES</p>
              <p className="font-bold text-white">{modelStats.vertices.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[9px]">TRIANGLES</p>
              <p className="font-bold text-white">{modelStats.faces.toLocaleString()}</p>
            </div>
          </div>
          <div className="pt-1 border-t border-[#1E252C] text-gray-400 space-y-0.5">
            <p>Size: <span className="text-gray-200">{modelStats.dimensions.x} × {modelStats.dimensions.y} × {modelStats.dimensions.z} m</span></p>
            <p>Weight: <span className="text-gray-200">{activeSpecies?.size_dimensions?.weight_kg || 50} kg</span></p>
          </div>
        </div>
      )}

      {/* ── Bottom Floating Animation & Action Control Toolbar ─────────────── */}
      <div className="absolute bottom-3 inset-x-3 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-[#0C1114]/92 backdrop-blur-md border border-[#242E36] shadow-2xl">
        {/* Left: Play/Pause/Stop + Speed Controls */}
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl font-bold transition flex items-center justify-center ${
              isPlaying
                ? 'bg-[#76B900] text-black shadow-glow-nvidia'
                : 'bg-[#1A232A] text-white border border-[#2D3A44] hover:bg-[#222E37]'
            }`}
            title={isPlaying ? 'Pause Animation' : 'Play Animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Stop / Reset Timeline */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            title="Stop & Reset"
            className="p-2 rounded-xl bg-[#141B20] text-gray-400 hover:text-white border border-[#222B32] transition"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#141B20] px-2 py-1 rounded-xl border border-[#222B32] text-xs font-mono">
            <FastForward className="w-3 h-3 text-gray-400" />
            <select
              value={animSpeed}
              onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-gray-200 outline-none cursor-pointer text-[11px]"
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="1.0">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
            </select>
          </div>
        </div>

        {/* Center: Supported Species Action Quick-Triggers */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          <span className="text-[10px] font-mono text-gray-400 shrink-0 hidden lg:inline mr-1">
            ANIMATION:
          </span>
          {supportedActions.map((act) => {
            const isActive = activeAction === act;
            return (
              <button
                key={act}
                onClick={() => onActionChange && onActionChange(act)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#76B900] text-black shadow-glow-nvidia'
                    : 'bg-[#141B20] text-gray-300 hover:text-white hover:bg-[#1D252C] border border-[#242D34]'
                }`}
              >
                <span>{isActive ? '▶' : '•'}</span>
                <span className="capitalize">{act.replace('_', ' ')}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Export & Regenerate CTA Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              title="Regenerate Model"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#141B20] hover:bg-[#1C252C] border border-[#242D34] text-xs font-mono text-gray-300 hover:text-white transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#76B900]" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}

          {currentModel?.id && (
            <div className="flex items-center gap-1">
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/3d-generator/export/${currentModel.id}?format=glb`}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#76B900] to-emerald-500 hover:from-[#659e00] hover:to-emerald-400 text-black font-extrabold text-xs font-mono shadow-glow-nvidia transition"
                title="Download Binary GLTF 2.0 Asset"
              >
                <Download className="w-3.5 h-3.5" />
                <span>GLB</span>
              </a>
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/3d-generator/export/${currentModel.id}?format=obj`}
                download
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#141B20] hover:bg-[#1E272E] border border-[#2A343C] text-gray-300 text-xs font-mono font-bold transition"
                title="Export Wavefront OBJ Mesh"
              >
                <span>OBJ</span>
              </a>
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/3d-generator/export/${currentModel.id}?format=stl`}
                download
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold transition"
                title="Export 3D Print Ready Binary STL"
              >
                <span>STL 🖨️</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

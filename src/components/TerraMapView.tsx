import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { terraRegions, terraCities, type TerraRegion } from '../data/terraRegions';
import { terraHexCells } from '../data/terraHexGrid';
import { storyRegistry, getStoryAccessState, type StoryListItem } from '../data/storyRegistry';
import { StorySplashModal } from './StorySplashModal';
import {
  TACTICAL_ROUTES,
  MAP_ERAS,
  solveLabelCollisions,
  type RouteCategory,
  type ScreenLabelCandidate,
} from './map/terraRoutesData';
import {
  MAP_CENTER_X,
  MAP_CENTER_Y,
  WATER_LEVEL,
  buildTerraHexAssets,
  createMachinedHexMaterial,
  createWarTableWaterMaterial,
  createWarTableBezelGroup,
  isWaterCellType,
  type TerraMapLens,
  type MachinedHexUniforms,
} from './map/terraHexEngine';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Compass,
  GitBranch,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MapPin,
  Layers,
  Route,
  Box,
  Search,
  Map as MapIcon,
  HelpCircle,
  Keyboard,
  PanelTopClose,
  PanelTopOpen,
  Play,
  Pause,
  Clock,
  Hexagon,
} from 'lucide-react';
import { playClickSound, playTabSwitchSound, playOpenSound, playCloseSound } from '../utils/soundEffects';
import { resolveAssetUrl } from '../utils/assetUrl';

interface TerraMapViewProps {
  onSelectStory: (id: string) => void;
  initialFocusRegionId?: string | null;
  onConsumeInitialRegion?: () => void;
  onNavigateToChronicleStory?: (storyId: string) => void;
  isHeaderCollapsed?: boolean;
  onToggleHeaderCollapse?: () => void;
}

interface MobilePreviewCardData {
  type: 'city' | 'route';
  id: string;
  title: string;
  subtitle: string;
  code?: string;
  description: string;
  storyId?: string;
  regionId?: string;
  badgeColor?: string;
}

export const TerraMapView: React.FC<TerraMapViewProps> = ({
  onSelectStory,
  initialFocusRegionId,
  onConsumeInitialRegion,
  onNavigateToChronicleStory,
  isHeaderCollapsed,
  onToggleHeaderCollapse,
}) => {
  const [pinnedRegionId, setPinnedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [splashStory, setSplashStory] = useState<StoryListItem | null>(null);

  // 3 Tactical Cartography Lenses + CNC Engraving Overlay Toggle
  const [mapLens, setMapLens] = useState<TerraMapLens>('tactical');
  const [chronicleEraIdx, setChronicleEraIdx] = useState<0 | 1 | 2 | 3 | 4>(1);
  const [isEraPlaying, setIsEraPlaying] = useState<boolean>(false);
  const [showHexLattice, setShowHexLattice] = useState<boolean>(true);
  const [showElevation, setShowElevation] = useState<boolean>(true);
  const [showLogos, setShowLogos] = useState<boolean>(true);
  const [showCities, setShowCities] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [routeFilter, setRouteFilter] = useState<'all' | RouteCategory>('main');

  const [isSectorListOpen, setIsSectorListOpen] = useState<boolean>(false);
  const [sectorSearch, setSectorSearch] = useState<string>('');
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);

  const [isTouchOrMobile, setIsTouchOrMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  });
  const [isLandscapeMobile, setIsLandscapeMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight <= 520 && window.innerWidth > window.innerHeight;
  });
  const [mobilePreviewCard, setMobilePreviewCard] = useState<MobilePreviewCardData | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetTouchStartY = useRef<number | null>(null);

  useEffect(() => {
    const handleWindowMetrics = () => {
      setIsTouchOrMobile(
        window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
      );
      setIsLandscapeMobile(
        window.innerHeight <= 520 && window.innerWidth > window.innerHeight
      );
    };
    window.addEventListener('resize', handleWindowMetrics);
    return () => window.removeEventListener('resize', handleWindowMetrics);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => window.clearTimeout(t);
  }, [isHeaderCollapsed]);

  // Chronicle playback auto-advance timer
  useEffect(() => {
    if (mapLens !== 'chronicle' || !isEraPlaying) return;
    const timer = window.setInterval(() => {
      setChronicleEraIdx((prev) => ((prev + 1) % MAP_ERAS.length) as 0 | 1 | 2 | 3 | 4);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [mapLens, isEraPlaying]);

  const handleOpenStoryPopup = useCallback(
    (storyId: string) => {
      const found = storyRegistry.find((s) => s.id === storyId);
      if (found) {
        playOpenSound();
        setSplashStory(found);
      } else {
        onSelectStory(storyId);
      }
    },
    [onSelectStory]
  );

  // Mount & 3D WebGL Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const regionPinRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const cityPinRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const routePinRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const keysDownRef = useRef<Set<string>>(new Set());
  const legendOpenRef = useRef<boolean>(false);
  const splashStoryRef = useRef<StoryListItem | null>(null);

  // Telemetry DOM Direct Refs (Zero React Re-render at 60/120Hz)
  const telemetryCoordRef = useRef<HTMLSpanElement>(null);
  const telemetryAngleRef = useRef<HTMLSpanElement>(null);
  const telemetryZoomRef = useRef<HTMLSpanElement>(null);
  const telemetrySectorRef = useRef<HTMLSpanElement>(null);
  const telemetryYawSliderRef = useRef<HTMLInputElement>(null);
  const telemetryYawTextRef = useRef<HTMLSpanElement>(null);

  const camStateRef = useRef({
    targetX: 0,
    targetZ: -25,
    currentX: 0,
    currentZ: -25,
    targetRadius: 515,
    currentRadius: 515,
    targetPolar: (49 * Math.PI) / 180,
    currentPolar: (49 * Math.PI) / 180,
    targetAzimuth: 0,
    currentAzimuth: 0,
  });

  // Sync state to refs for WebGL render loop
  const hoveredRegionRef = useRef<string | null>(null);
  const hoveredPinRegionRef = useRef<string | null>(null);
  const pinnedRegionRef = useRef<string | null>(null);
  const mapLensRef = useRef<TerraMapLens>(mapLens);
  const chronicleEraRef = useRef<number>(chronicleEraIdx);
  const showHexLatticeRef = useRef<boolean>(showHexLattice);
  const showElevationRef = useRef<boolean>(showElevation);
  const showCitiesRef = useRef<boolean>(showCities);
  const showRoutesRef = useRef<boolean>(showRoutes);
  const routeFilterRef = useRef<'all' | RouteCategory>(routeFilter);

  useEffect(() => {
    legendOpenRef.current = isLegendOpen;
  }, [isLegendOpen]);

  useEffect(() => {
    splashStoryRef.current = splashStory;
  }, [splashStory]);

  useEffect(() => {
    hoveredRegionRef.current = hoveredRegionId;
  }, [hoveredRegionId]);

  useEffect(() => {
    pinnedRegionRef.current = pinnedRegionId;
  }, [pinnedRegionId]);

  useEffect(() => {
    mapLensRef.current = mapLens;
  }, [mapLens]);

  useEffect(() => {
    chronicleEraRef.current = chronicleEraIdx;
  }, [chronicleEraIdx]);

  useEffect(() => {
    showHexLatticeRef.current = showHexLattice;
  }, [showHexLattice]);

  useEffect(() => {
    showElevationRef.current = showElevation;
  }, [showElevation]);

  useEffect(() => {
    showCitiesRef.current = showCities;
  }, [showCities]);

  useEffect(() => {
    showRoutesRef.current = showRoutes;
  }, [showRoutes]);

  useEffect(() => {
    routeFilterRef.current = routeFilter;
  }, [routeFilter]);

  const regionLookup = useMemo(() => {
    const map = new Map<string, TerraRegion>();
    terraRegions.forEach((r) => map.set(r.id, r));
    return map;
  }, []);

  const pinnedRegion = pinnedRegionId ? regionLookup.get(pinnedRegionId) || null : null;

  const pinnedRegionStories = useMemo<StoryListItem[]>(() => {
    if (!pinnedRegion) return [];
    return pinnedRegion.relatedStoryIds
      .map((id) => storyRegistry.find((s) => s.id === id))
      .filter((s): s is StoryListItem => Boolean(s));
  }, [pinnedRegion]);

  const pinnedRegionCities = useMemo(() => {
    if (!pinnedRegion) return [];
    return terraCities.filter((c) => c.regionId === pinnedRegion.id);
  }, [pinnedRegion]);

  const pinnedRegionRoutes = useMemo(() => {
    if (!pinnedRegion) return [];
    return TACTICAL_ROUTES.filter((rt) => rt.regionIds.includes(pinnedRegion.id));
  }, [pinnedRegion]);

  const filteredRegions = useMemo(() => {
    const q = sectorSearch.trim().toLowerCase();
    if (!q) return terraRegions;
    return terraRegions.filter(
      (r) =>
        r.nameKo.toLowerCase().includes(q) ||
        r.nameEn.toLowerCase().includes(q) ||
        (r.capital && r.capital.toLowerCase().includes(q))
    );
  }, [sectorSearch]);

  const flyToPixelCoords = useCallback((px: number, py: number, zoomRadius = 335, pitchDeg = 45) => {
    const cam = camStateRef.current;
    cam.targetX = px - MAP_CENTER_X;
    cam.targetZ = py - MAP_CENTER_Y;
    cam.targetRadius = zoomRadius;
    cam.targetPolar = mapLensRef.current === 'blueprint' ? 0.001 : (pitchDeg * Math.PI) / 180;
  }, []);

  const handleSelectRegion = useCallback(
    (regionId: string) => {
      playClickSound();
      setPinnedRegionId(regionId);
      setSelectedCityId(null);
      setMobilePreviewCard(null);
      setSheetDragY(0);
      if (window.innerWidth < 768) {
        setIsSectorListOpen(false);
      }
      const reg = regionLookup.get(regionId);
      if (reg) {
        flyToPixelCoords(
          reg.emblemPixelCoords.x,
          reg.emblemPixelCoords.y,
          335,
          mapLensRef.current === 'blueprint' ? 0 : 45
        );
        if (telemetrySectorRef.current) {
          telemetrySectorRef.current.textContent = `${reg.nameKo} (${reg.nameEn.toUpperCase()})`;
        }
      }
    },
    [regionLookup, flyToPixelCoords]
  );

  // Receive external focus requests (Chronicle / Command Palette)
  useEffect(() => {
    if (!initialFocusRegionId) return;
    if (!regionLookup.has(initialFocusRegionId)) {
      onConsumeInitialRegion?.();
      return;
    }
    const raf = requestAnimationFrame(() => {
      handleSelectRegion(initialFocusRegionId);
      onConsumeInitialRegion?.();
    });
    return () => cancelAnimationFrame(raf);
  }, [initialFocusRegionId, regionLookup, handleSelectRegion, onConsumeInitialRegion]);

  const handleSwitchLens = (lens: TerraMapLens) => {
    playTabSwitchSound();
    setMapLens(lens);
    const cam = camStateRef.current;
    if (lens === 'blueprint') {
      setIsEraPlaying(false);
      cam.targetPolar = 0.001;
      cam.targetAzimuth = 0;
      cam.targetRadius = Math.max(540, Math.min(680, cam.targetRadius));
    } else {
      if (cam.targetPolar < 0.15) {
        cam.targetPolar = (49 * Math.PI) / 180;
      }
      if (lens === 'chronicle') {
        setShowRoutes(true);
      }
    }
  };

  const handleSetAzimuthDegrees = (degrees: number) => {
    if (mapLensRef.current === 'blueprint') return;
    camStateRef.current.targetAzimuth = (degrees * Math.PI) / 180;
  };

  const handleResetCamera = () => {
    playClickSound();
    setPinnedRegionId(null);
    setHoveredRegionId(null);
    setSelectedCityId(null);
    const cam = camStateRef.current;
    cam.targetX = 0;
    cam.targetZ = -25;
    cam.targetAzimuth = 0;
    if (mapLensRef.current === 'blueprint') {
      cam.targetRadius = 600;
      cam.targetPolar = 0.001;
    } else {
      cam.targetRadius = 515;
      cam.targetPolar = (49 * Math.PI) / 180;
    }
  };

  const handleZoom = (delta: number) => {
    playClickSound();
    const cam = camStateRef.current;
    cam.targetRadius = Math.max(180, Math.min(920, cam.targetRadius + delta));
  };

  const handleRotateYaw = (deltaRad: number) => {
    if (mapLensRef.current === 'blueprint') return;
    playClickSound();
    camStateRef.current.targetAzimuth += deltaRad;
  };

  // =========================================================================
  // THREE.JS PRECISION ANODIZED HEX WAR-TABLE + IBL + SPRING CASCADE PIPELINE
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 800;
    const mountStartMs = performance.now();

    // 1. Scene & Atmospheric Obsidian Backdrop
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07090e');
    scene.fog = new THREE.FogExp2(0x07090e, 0.00084);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 5, 2600);

    // 3. Renderer + Studio IBL + 3-Point Key/Rim Lighting + PCF Shadows
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
    roomEnv.dispose();
    scene.environment = envRenderTarget.texture;
    scene.environmentIntensity = 0.48;

    const keyLight = new THREE.DirectionalLight(0xfff6e8, 2.35);
    keyLight.position.set(280, 420, 210);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -520;
    keyLight.shadow.camera.right = 520;
    keyLight.shadow.camera.top = 540;
    keyLight.shadow.camera.bottom = -540;
    keyLight.shadow.camera.near = 60;
    keyLight.shadow.camera.far = 1100;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.08;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7cc4fa, 1.35);
    rimLight.position.set(-320, 220, -280);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0x475569, 0x090b10, 0.65);
    scene.add(hemiLight);

    // 4x MSAA + HalfFloatType HDR Composer for crisp metallic edges & selective glow
    const maxSamples = Math.min(4, renderer.capabilities.maxSamples || 0);
    const composerTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      samples: maxSamples,
    });
    const composer = new EffectComposer(renderer, composerTarget);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.26, 0.36, 0.88);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    // 4. Precision Machined Anodized Hex Monolith InstancedMesh
    const hexAssets = buildTerraHexAssets();
    const hexCount = terraHexCells.length;
    const tileStateData = new Float32Array(hexCount * 4);
    const tileBaseColorAttr = new THREE.InstancedBufferAttribute(hexAssets.baseColors, 3);
    const tileStateAttr = new THREE.InstancedBufferAttribute(tileStateData, 4);
    tileStateAttr.setUsage(THREE.DynamicDrawUsage);

    hexAssets.hexGeo.setAttribute('aTileBaseColor', tileBaseColorAttr);
    hexAssets.hexGeo.setAttribute('aTileState', tileStateAttr);

    const hexMat = createMachinedHexMaterial();
    const hexShaderUniforms = hexMat.userData.shaderUniforms as MachinedHexUniforms;
    const hexMesh = new THREE.InstancedMesh(hexAssets.hexGeo, hexMat, hexCount);
    hexMesh.castShadow = true;
    hexMesh.receiveShadow = true;
    hexMesh.frustumCulled = false;

    const currentHeights = new Float32Array(hexCount);
    const heightVelocities = new Float32Array(hexCount);
    const dummyMat = new THREE.Matrix4();
    const tileRegionIds = terraHexCells.map((c) => c.regionId);
    const tileIsWater = terraHexCells.map((c) => isWaterCellType(c.type));

    for (let i = 0; i < hexCount; i++) {
      const c = terraHexCells[i];
      const startY = tileIsWater[i] ? hexAssets.baseHeights[i] : -2.2;
      currentHeights[i] = startY;
      dummyMat.makeTranslation(c.x - MAP_CENTER_X, startY, c.y - MAP_CENTER_Y);
      hexMesh.setMatrixAt(i, dummyMat);
      tileStateData[i * 4 + 0] = 0; // focusWeight
      tileStateData[i * 4 + 1] = 0; // dimWeight
      tileStateData[i * 4 + 2] = hexAssets.biomeCodes[i];
      tileStateData[i * 4 + 3] = 0; // liftAmount
    }
    hexMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    hexMesh.instanceMatrix.needsUpdate = true;
    scene.add(hexMesh);

    const regionCentroidHexIdx = new Map<string, number>();
    terraRegions.forEach((r) => {
      regionCentroidHexIdx.set(
        r.id,
        hexAssets.findClosestHexIndex(r.emblemPixelCoords.x, r.emblemPixelCoords.y)
      );
    });

    // 5. Smoked-Glass Ocean Plane + Physical Titanium Console Bezel
    const waterGeo = new THREE.CircleGeometry(660, 96);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = createWarTableWaterMaterial();
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = WATER_LEVEL;
    scene.add(waterMesh);

    const bezelGroup = createWarTableBezelGroup();
    scene.add(bezelGroup);

    // 6. Machined Nation Perimeter Borders (Synchronized vertically with Kinetic Tile Lift)
    const borderGroup = new THREE.Group();
    scene.add(borderGroup);
    const regionBorderMeshes = new Map<
      string,
      {
        line: THREE.LineSegments;
        mat: THREE.LineBasicMaterial;
        defaultColor: THREE.Color;
      }
    >();

    hexAssets.regionBordersData.forEach((entry, regionId) => {
      const bGeo = new THREE.BufferGeometry();
      bGeo.setAttribute('position', new THREE.BufferAttribute(entry.positions, 3));
      const bMat = new THREE.LineBasicMaterial({
        color: entry.defaultColor.clone(),
        transparent: true,
        opacity: 0.58,
      });
      const lineSegs = new THREE.LineSegments(bGeo, bMat);
      borderGroup.add(lineSegs);
      regionBorderMeshes.set(regionId, {
        line: lineSegs,
        mat: bMat,
        defaultColor: entry.defaultColor,
      });
    });

    // 7. Northern Polar Anomaly Orbital Ring & Subtle Atmospheric Dust Motes
    const anomalyRingGeo = new THREE.TorusGeometry(42, 0.28, 8, 96);
    const anomalyRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const anomalyRing = new THREE.Mesh(anomalyRingGeo, anomalyRingMat);
    anomalyRing.position.set(320 - MAP_CENTER_X, 5.5, 138 - MAP_CENTER_Y);
    anomalyRing.rotation.x = Math.PI / 2 - 0.12;
    scene.add(anomalyRing);

    const moteCount = 140;
    const motePositions = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      const s1 = Math.sin(i * 12.9898) * 43758.5453;
      const s2 = Math.sin(i * 78.233 + 1.5) * 29431.1234;
      const s3 = Math.sin(i * 41.123 + 3.1) * 18374.5123;
      const rx = s1 - Math.floor(s1);
      const ry = s2 - Math.floor(s2);
      const rz = s3 - Math.floor(s3);
      motePositions[i * 3 + 0] = (rx - 0.5) * 760;
      motePositions[i * 3 + 1] = 16 + ry * 42;
      motePositions[i * 3 + 2] = (rz - 0.5) * 860;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 1.4,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const moteCloud = new THREE.Points(moteGeo, moteMat);
    scene.add(moteCloud);

    // 8. Architectural Optical City Beacons + Rhodes Flagship Telemetry Halo (Dynamically Y-Synced)
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    const capPlateGeo = new THREE.CylinderGeometry(1.55, 1.55, 0.35, 4);
    capPlateGeo.rotateY(Math.PI / 4);
    const capHaloGeo = new THREE.RingGeometry(1.75, 2.15, 4);
    capHaloGeo.rotateX(-Math.PI / 2);
    const majorBaseRingGeo = new THREE.RingGeometry(2.6, 3.3, 24);
    majorBaseRingGeo.rotateX(-Math.PI / 2);
    const minorBaseRingGeo = new THREE.RingGeometry(1.65, 2.1, 20);
    minorBaseRingGeo.rotateX(-Math.PI / 2);
    const rhodesPulseGeo = new THREE.RingGeometry(4.0, 5.1, 32);
    rhodesPulseGeo.rotateX(-Math.PI / 2);
    const majorOpticalShaftGeo = new THREE.CylinderGeometry(0.14, 0.36, 21, 6, 1, true);
    majorOpticalShaftGeo.translate(0, 10.5, 0);

    const rhodesBeacon: { mesh: THREE.Mesh | null; mat: THREE.MeshBasicMaterial | null } = {
      mesh: null,
      mat: null,
    };

    interface CityBeaconEntry {
      city: (typeof terraCities)[number];
      hexIdx: number;
      anchorGroup: THREE.Group;
      stemHeight: number;
    }
    const cityEntries: CityBeaconEntry[] = [];

    terraCities.forEach((city) => {
      const hexIdx = hexAssets.findClosestHexIndex(city.pixelCoords.x, city.pixelCoords.y);
      const wx = city.pixelCoords.x - MAP_CENTER_X;
      const wz = city.pixelCoords.y - MAP_CENTER_Y;
      const startElev = Math.max(WATER_LEVEL + 0.15, hexAssets.baseHeights[hexIdx]);

      const isRhodes = city.type === 'rhodes';
      const isCapital = city.type === 'capital';
      const isMajor = isRhodes || isCapital;
      const beaconColor = isRhodes ? 0xffffff : isCapital ? 0xf5dd1b : 0x94a3b8;
      const stemHeight = isMajor ? 21 : 12;

      const anchorGroup = new THREE.Group();
      anchorGroup.position.set(wx, startElev, wz);
      cityGroup.add(anchorGroup);

      const baseRingMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: isMajor ? 0.68 : 0.36,
        side: THREE.DoubleSide,
      });
      const baseRing = new THREE.Mesh(isMajor ? majorBaseRingGeo : minorBaseRingGeo, baseRingMat);
      baseRing.position.set(0, 0.14, 0);
      anchorGroup.add(baseRing);

      if (isRhodes) {
        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0xf5dd1b,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const pulseRing = new THREE.Mesh(rhodesPulseGeo, pulseMat);
        pulseRing.position.set(0, 0.22, 0);
        anchorGroup.add(pulseRing);
        rhodesBeacon.mesh = pulseRing;
        rhodesBeacon.mat = pulseMat;
      }

      if (isMajor) {
        const shaftMat = new THREE.MeshBasicMaterial({
          color: beaconColor,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        });
        anchorGroup.add(new THREE.Mesh(majorOpticalShaftGeo, shaftMat));
      }

      const stemPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, stemHeight, 0)];
      const stemGeo = new THREE.BufferGeometry().setFromPoints(stemPts);
      const stemMat = new THREE.LineBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: isMajor ? 0.85 : 0.44,
      });
      anchorGroup.add(new THREE.Line(stemGeo, stemMat));

      const capMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: isMajor ? 0.98 : 0.78,
      });
      const capPlate = new THREE.Mesh(capPlateGeo, capMat);
      capPlate.position.set(0, stemHeight + 0.22, 0);
      if (!isMajor) capPlate.scale.setScalar(0.72);
      anchorGroup.add(capPlate);

      if (isMajor) {
        const capHalo = new THREE.Mesh(capHaloGeo, baseRingMat);
        capHalo.position.set(0, stemHeight - 1.35, 0);
        anchorGroup.add(capHalo);
      }

      cityEntries.push({ city, hexIdx, anchorGroup, stemHeight });
    });

    // 9. 3D TubeGeometry Parabolic Route Ribbons + Subtle HDR Bloom Glow
    const routesGroup = new THREE.Group();
    scene.add(routesGroup);
    interface RouteArcEntry {
      route: (typeof TACTICAL_ROUTES)[number];
      tubeMat: THREE.MeshBasicMaterial;
      glowMat: THREE.MeshBasicMaterial;
      anchorMat: THREE.MeshBasicMaterial;
      pulseMesh: THREE.Mesh;
      pulseMat: THREE.MeshBasicMaterial;
      curve: THREE.QuadraticBezierCurve3;
      progress: number;
      speed: number;
    }
    const routeEntries: RouteArcEntry[] = [];
    const pulseGeo = new THREE.SphereGeometry(1.75, 10, 10);
    const routeAnchorGeo = new THREE.RingGeometry(1.9, 2.65, 24);
    routeAnchorGeo.rotateX(-Math.PI / 2);

    TACTICAL_ROUTES.forEach((rt, rIdx) => {
      const fromIdx = hexAssets.findClosestHexIndex(rt.fromPixel.x, rt.fromPixel.y);
      const toIdx = hexAssets.findClosestHexIndex(rt.toPixel.x, rt.toPixel.y);
      const x1 = rt.fromPixel.x - MAP_CENTER_X;
      const z1 = rt.fromPixel.y - MAP_CENTER_Y;
      const x2 = rt.toPixel.x - MAP_CENTER_X;
      const z2 = rt.toPixel.y - MAP_CENTER_Y;
      const y1 = Math.max(WATER_LEVEL + 0.4, hexAssets.baseHeights[fromIdx] + 1.2);
      const y2 = Math.max(WATER_LEVEL + 0.4, hexAssets.baseHeights[toIdx] + 1.2);
      const dist = Math.hypot(x2 - x1, z2 - z1);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const peakY =
        Math.max(y1, y2) + Math.min(48, Math.max(18, dist * 0.22)) + (rt.arcHeightOffset || 0);

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3(midX, peakY, midZ),
        new THREE.Vector3(x2, y2, z2)
      );

      const hdrRouteCol = new THREE.Color(rt.color).multiplyScalar(1.38);

      const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.65, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: hdrRouteCol,
        transparent: true,
        opacity: 0.9,
      });
      routesGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

      const glowGeo = new THREE.TubeGeometry(curve, 48, 1.35, 6, false);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(rt.color),
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      });
      routesGroup.add(new THREE.Mesh(glowGeo, glowMat));

      const anchorMat = new THREE.MeshBasicMaterial({
        color: hdrRouteCol,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      });
      const startAnchor = new THREE.Mesh(routeAnchorGeo, anchorMat);
      startAnchor.position.set(x1, y1 - 0.85, z1);
      const endAnchor = new THREE.Mesh(routeAnchorGeo, anchorMat);
      endAnchor.position.set(x2, y2 - 0.85, z2);
      routesGroup.add(startAnchor, endAnchor);

      const pulseMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(rt.color).multiplyScalar(1.55),
        transparent: true,
        opacity: 0.98,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      routesGroup.add(pulseMesh);
      routeEntries.push({
        route: rt,
        tubeMat,
        glowMat,
        anchorMat,
        pulseMesh,
        pulseMat,
        curve,
        progress: (rIdx * 0.17) % 1,
        speed: 0.0034 + (rIdx % 3) * 0.0007,
      });
    });

    // 10. Pointer, Multi-Touch & Native O(1) Instanced Hex Raycasting
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let isPointerDown = false;
    let pointerButton = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragDistance = 0;

    const activeTouchPoints = new Map<number, { x: number; y: number }>();
    let lastPinchDist = 0;
    let lastPinchAngle = 0;
    let lastMidX = 0;
    let lastMidY = 0;
    let initialPinchDist = 0;
    let initialPinchAngle = 0;
    let initialMidX = 0;
    let initialMidY = 0;
    let multiTouchMode: 'undecided' | 'zoom' | 'tilt' | 'rotate' = 'undecided';
    let wasMultiTouchSession = false;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const updateHoveredRegion = (nextId: string | null) => {
      if (hoveredRegionRef.current !== nextId) {
        hoveredRegionRef.current = nextId;
        setHoveredRegionId(nextId);
      }
      if (telemetrySectorRef.current) {
        if (nextId) {
          const r = regionLookup.get(nextId);
          if (r) telemetrySectorRef.current.textContent = `${r.nameKo} (${r.nameEn.toUpperCase()})`;
        } else if (pinnedRegionRef.current) {
          const r = regionLookup.get(pinnedRegionRef.current);
          if (r) telemetrySectorRef.current.textContent = `${r.nameKo} (${r.nameEn.toUpperCase()})`;
        } else {
          telemetrySectorRef.current.textContent = '중립 지역';
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (splashStoryRef.current !== null || legendOpenRef.current) return;

      const targetEl = e.target as HTMLElement | null;
      if (
        !targetEl ||
        targetEl.closest('[data-hud-panel="true"]') ||
        targetEl.closest('[data-map-pin="true"]') ||
        targetEl.closest('[data-modal="true"]')
      ) {
        return;
      }

      const now = performance.now();
      const timeDiff = now - lastTapTime;
      const distDiff = Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY);
      if (timeDiff < 320 && distDiff < 28 && (e.button === 0 || e.pointerType === 'touch')) {
        lastTapTime = 0;
        playClickSound();
        camStateRef.current.targetRadius = Math.max(180, camStateRef.current.targetRadius - 130);
        return;
      }
      lastTapTime = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;

      if (e.pointerType === 'touch') {
        activeTouchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activeTouchPoints.size >= 2) {
          wasMultiTouchSession = true;
          const pts = Array.from(activeTouchPoints.values());
          lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          lastPinchAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
          lastMidX = (pts[0].x + pts[1].x) / 2;
          lastMidY = (pts[0].y + pts[1].y) / 2;
          initialPinchDist = lastPinchDist;
          initialPinchAngle = lastPinchAngle;
          initialMidX = lastMidX;
          initialMidY = lastMidY;
          multiTouchMode = 'undecided';
          return;
        }
      }

      isPointerDown = true;
      pointerButton = e.button;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      dragDistance = 0;
      container.style.cursor = e.button === 2 || e.shiftKey ? 'all-scroll' : 'grabbing';
    };

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (splashStoryRef.current !== null || legendOpenRef.current) {
        if (isPointerDown) {
          isPointerDown = false;
          activeTouchPoints.clear();
          container.style.cursor = 'default';
        }
        return;
      }

      if (e.pointerType === 'touch' && activeTouchPoints.has(e.pointerId)) {
        activeTouchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activeTouchPoints.size >= 2) {
          const pts = Array.from(activeTouchPoints.values());
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const currentAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          const cam = camStateRef.current;

          if (mapLensRef.current === 'blueprint') {
            cam.targetPolar = 0.001;
            cam.targetAzimuth = 0;
            if (lastPinchDist > 0) {
              const deltaDist = dist - lastPinchDist;
              cam.targetRadius = Math.max(180, Math.min(920, cam.targetRadius - deltaDist * 1.45));
              const deltaMidX = midX - lastMidX;
              const deltaMidY = midY - lastMidY;
              const cHeight = container.clientHeight || 600;
              const unitsPerPixel = (2 * cam.currentRadius * 0.36397023) / cHeight;
              cam.targetX = Math.max(-380, Math.min(380, cam.targetX - deltaMidX * unitsPerPixel));
              cam.targetZ = Math.max(-440, Math.min(440, cam.targetZ - deltaMidY * unitsPerPixel));
              cam.currentX = cam.targetX;
              cam.currentZ = cam.targetZ;
            }
          } else {
            if (multiTouchMode === 'undecided') {
              const distDelta = Math.abs(dist - initialPinchDist);
              const midYDelta = Math.abs(midY - initialMidY);
              const midXDelta = Math.abs(midX - initialMidX);
              let angleDiff = currentAngle - initialPinchAngle;
              while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
              while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
              const angleDeltaPx = Math.abs(angleDiff) * (dist * 0.5);

              const maxDelta = Math.max(distDelta, midYDelta, midXDelta, angleDeltaPx);
              if (maxDelta >= 10) {
                if (distDelta >= midYDelta && distDelta >= angleDeltaPx && distDelta >= midXDelta) {
                  multiTouchMode = 'zoom';
                } else if (midYDelta > distDelta && midYDelta >= angleDeltaPx) {
                  multiTouchMode = 'tilt';
                } else {
                  multiTouchMode = 'rotate';
                }
              }
            }

            if (lastPinchDist > 0) {
              if (multiTouchMode === 'zoom') {
                const deltaDist = dist - lastPinchDist;
                cam.targetRadius = Math.max(180, Math.min(920, cam.targetRadius - deltaDist * 1.45));
              } else if (multiTouchMode === 'tilt') {
                const deltaMidY = midY - lastMidY;
                cam.targetPolar = Math.max(
                  (10 * Math.PI) / 180,
                  Math.min((72 * Math.PI) / 180, cam.targetPolar - deltaMidY * 0.0045)
                );
              } else if (multiTouchMode === 'rotate') {
                let deltaAngle = currentAngle - lastPinchAngle;
                while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
                while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
                if (Math.abs(deltaAngle) > 0.005) cam.targetAzimuth -= deltaAngle * 1.35;
                const deltaMidX = midX - lastMidX;
                if (Math.abs(deltaMidX) > 0.5) cam.targetAzimuth -= deltaMidX * 0.0055;
              }
            }
          }
          lastPinchDist = dist;
          lastPinchAngle = currentAngle;
          lastMidX = midX;
          lastMidY = midY;
          return;
        }
      }

      if (isPointerDown && e.pointerType !== 'touch' && e.buttons === 0) {
        isPointerDown = false;
        container.style.cursor = 'grab';
      }

      if (isPointerDown) {
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        dragDistance += Math.hypot(dx, dy);
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;

        const cam = camStateRef.current;
        const isOrbitAction =
          pointerButton === 2 ||
          pointerButton === 1 ||
          (e.buttons & 2) !== 0 ||
          (e.buttons & 4) !== 0 ||
          e.shiftKey;

        if (isOrbitAction && mapLensRef.current !== 'blueprint') {
          cam.targetAzimuth -= dx * 0.0055;
          cam.targetPolar = Math.max(
            (10 * Math.PI) / 180,
            Math.min((72 * Math.PI) / 180, cam.targetPolar - dy * 0.0045)
          );
        } else if (mapLensRef.current === 'blueprint') {
          cam.targetPolar = 0.001;
          cam.targetAzimuth = 0;
          const cHeight = container.clientHeight || 600;
          const unitsPerPixel = (2 * cam.currentRadius * 0.36397023) / cHeight;
          cam.targetX = Math.max(-380, Math.min(380, cam.targetX - dx * unitsPerPixel));
          cam.targetZ = Math.max(-440, Math.min(440, cam.targetZ - dy * unitsPerPixel));
          cam.currentX = cam.targetX;
          cam.currentZ = cam.targetZ;
        } else {
          const panScale = cam.currentRadius * 0.0014;
          const cosA = Math.cos(cam.currentAzimuth);
          const sinA = Math.sin(cam.currentAzimuth);
          const moveX = (-dx * cosA - dy * sinA) * panScale;
          const moveZ = (dx * sinA - dy * cosA) * panScale;
          cam.targetX = Math.max(-380, Math.min(380, cam.targetX + moveX));
          cam.targetZ = Math.max(-440, Math.min(440, cam.targetZ + moveZ));
        }
        return;
      }

      const targetEl = e.target as HTMLElement | null;
      if (
        !targetEl ||
        !container.parentElement?.contains(targetEl) ||
        targetEl.closest('[data-hud-panel="true"]') ||
        targetEl.closest('[data-map-pin="true"]') ||
        targetEl.closest('[data-modal="true"]')
      ) {
        return;
      }

      if (hoveredPinRegionRef.current) {
        updateHoveredRegion(hoveredPinRegionRef.current);
        container.style.cursor = 'pointer';
        return;
      }

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);

      const hits = raycaster.intersectObject(hexMesh, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const hitIdx = hits[0].instanceId;
        const hitCell = terraHexCells[hitIdx];
        const hitRegId = hitCell?.regionId || null;

        if (telemetryCoordRef.current && hitCell) {
          const hVal = Math.max(0, Math.round(currentHeights[hitIdx] * 115));
          telemetryCoordRef.current.textContent = `X:${Math.round(hitCell.x)} Y:${Math.round(hitCell.y)} · ${hVal}M`;
        }
        updateHoveredRegion(hitRegId);
        container.style.cursor = hitRegId ? 'pointer' : 'grab';
      } else {
        updateHoveredRegion(null);
        container.style.cursor = 'grab';
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        activeTouchPoints.delete(e.pointerId);
        if (activeTouchPoints.size === 1) {
          const remaining = Array.from(activeTouchPoints.values())[0];
          lastPointerX = remaining.x;
          lastPointerY = remaining.y;
          lastPinchDist = 0;
          lastPinchAngle = 0;
          lastMidX = 0;
          lastMidY = 0;
          multiTouchMode = 'undecided';
          return;
        }
        if (activeTouchPoints.size === 0 && wasMultiTouchSession) {
          wasMultiTouchSession = false;
          lastPinchDist = 0;
          lastPinchAngle = 0;
          lastMidX = 0;
          lastMidY = 0;
          multiTouchMode = 'undecided';
          isPointerDown = false;
          return;
        }
      }

      if (!isPointerDown) return;
      const wasDragging = dragDistance >= 6;
      const btn = pointerButton;
      isPointerDown = false;
      container.style.cursor = hoveredRegionRef.current ? 'pointer' : 'grab';

      if (splashStoryRef.current !== null || legendOpenRef.current) return;

      const targetEl = e.target as HTMLElement | null;
      if (
        !wasDragging &&
        btn === 0 &&
        !e.shiftKey &&
        targetEl &&
        !targetEl.closest('[data-hud-panel="true"]') &&
        !targetEl.closest('[data-map-pin="true"]') &&
        !targetEl.closest('[data-modal="true"]') &&
        container.parentElement?.contains(targetEl)
      ) {
        const rect = container.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObject(hexMesh, false);
        if (hits.length > 0 && hits[0].instanceId !== undefined) {
          const hitCell = terraHexCells[hits[0].instanceId];
          if (hitCell?.regionId) {
            handleSelectRegion(hitCell.regionId);
            return;
          }
        }
        setPinnedRegionId(null);
        setMobilePreviewCard(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && legendOpenRef.current) {
        playCloseSound();
        setIsLegendOpen(false);
        return;
      }

      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const code = e.code;
      if (e.key === '+' || e.key === '=' || code === 'NumpadAdd' || code === 'KeyE') {
        handleZoom(-90);
        return;
      }
      if (e.key === '-' || e.key === '_' || code === 'NumpadSubtract' || code === 'KeyQ') {
        handleZoom(90);
        return;
      }

      if (
        code === 'KeyW' ||
        code === 'KeyA' ||
        code === 'KeyS' ||
        code === 'KeyD' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight' ||
        code === 'ShiftLeft' ||
        code === 'ShiftRight'
      ) {
        if (code.startsWith('Arrow')) e.preventDefault();
        keysDownRef.current.add(code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };

    const handleWindowBlur = () => {
      isPointerDown = false;
      activeTouchPoints.clear();
      wasMultiTouchSession = false;
      multiTouchMode = 'undecided';
      container.style.cursor = 'grab';
      keysDownRef.current.clear();
    };

    const handleWheel = (e: WheelEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('[data-hud-panel="true"]')) return;
      e.preventDefault();
      camStateRef.current.targetRadius = Math.max(
        180,
        Math.min(920, camStateRef.current.targetRadius + e.deltaY * 0.42)
      );
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const viewportRoot = container.parentElement || container;
    viewportRoot.addEventListener('pointerdown', handlePointerDown);
    viewportRoot.addEventListener('wheel', handleWheel, { passive: false });
    viewportRoot.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowBlur);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 11. 60/120fps Spring-Cascade Loop + Collision-Free Label Projection
    let animFrameId = 0;
    const projVec = new THREE.Vector3();
    let currentElevScale = 1.0;
    let currentBlueprintMix = 0.0;
    let prevPinnedId: string | null = null;
    let prevHoveredId: string | null = null;
    let pinWaveStart = -10;
    let hoverWaveStart = -10;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const cam = camStateRef.current;

      // Keyboard WASD Pan
      const activeKeys = keysDownRef.current;
      if (activeKeys.size > 0 && !splashStoryRef.current && !legendOpenRef.current) {
        const isBoost = activeKeys.has('ShiftLeft') || activeKeys.has('ShiftRight');
        const basePanSpeed = cam.currentRadius * 0.0036 * (isBoost ? 2.4 : 1.0);
        const sinA = Math.sin(cam.currentAzimuth);
        const cosA = Math.cos(cam.currentAzimuth);

        let forward = 0;
        let strafe = 0;
        if (activeKeys.has('KeyW') || activeKeys.has('ArrowUp')) forward += 1;
        if (activeKeys.has('KeyS') || activeKeys.has('ArrowDown')) forward -= 1;
        if (activeKeys.has('KeyD') || activeKeys.has('ArrowRight')) strafe += 1;
        if (activeKeys.has('KeyA') || activeKeys.has('ArrowLeft')) strafe -= 1;

        if (forward !== 0 || strafe !== 0) {
          const len = Math.hypot(forward, strafe);
          const normF = (forward / len) * basePanSpeed;
          const normS = (strafe / len) * basePanSpeed;
          cam.targetX = Math.max(-380, Math.min(380, cam.targetX - sinA * normF + cosA * normS));
          cam.targetZ = Math.max(-440, Math.min(440, cam.targetZ - cosA * normF - sinA * normS));
        }
      }

      const lens = mapLensRef.current;
      const isBlueprint = lens === 'blueprint';
      if (isBlueprint) {
        cam.targetPolar = 0.001;
        cam.targetAzimuth = 0;
      }

      const damp = isBlueprint && isPointerDown ? 1.0 : isBlueprint ? 0.28 : 0.12;
      cam.currentX += (cam.targetX - cam.currentX) * damp;
      cam.currentZ += (cam.targetZ - cam.currentZ) * damp;
      cam.currentRadius += (cam.targetRadius - cam.currentRadius) * damp;
      cam.currentPolar += (cam.targetPolar - cam.currentPolar) * damp;
      cam.currentAzimuth += (cam.targetAzimuth - cam.currentAzimuth) * damp;

      const sinP = Math.sin(cam.currentPolar);
      const cosP = Math.cos(cam.currentPolar);
      const sinA = Math.sin(cam.currentAzimuth);
      const cosA = Math.cos(cam.currentAzimuth);

      camera.position.set(
        cam.currentX + cam.currentRadius * sinP * sinA,
        cam.currentRadius * cosP,
        cam.currentZ + cam.currentRadius * sinP * cosA
      );
      camera.lookAt(cam.currentX, 0, cam.currentZ);
      camera.updateMatrixWorld();

      // Update Telemetry Readouts
      const rawYawDeg = Math.round((cam.currentAzimuth * 180) / Math.PI);
      const normalizedYaw = ((rawYawDeg % 360) + 360) % 360;
      if (telemetryAngleRef.current) {
        telemetryAngleRef.current.textContent = `${Math.round((cam.currentPolar * 180) / Math.PI)}° / ${normalizedYaw}°`;
      }
      if (telemetryZoomRef.current) {
        telemetryZoomRef.current.textContent = `${Math.round((515 / cam.currentRadius) * 100)}%`;
      }
      if (telemetryYawSliderRef.current && document.activeElement !== telemetryYawSliderRef.current) {
        telemetryYawSliderRef.current.value = String(normalizedYaw);
      }
      if (telemetryYawTextRef.current) {
        telemetryYawTextRef.current.textContent = `${normalizedYaw}°`;
      }

      const nowMs = performance.now();
      const elapsedSec = nowMs * 0.001;
      const mountElapsed = (nowMs - mountStartMs) * 0.001;
      const pinnedId = pinnedRegionRef.current;
      const hoveredId = hoveredRegionRef.current;

      if (pinnedId !== prevPinnedId) {
        prevPinnedId = pinnedId;
        pinWaveStart = mountElapsed;
      }
      if (hoveredId !== prevHoveredId) {
        prevHoveredId = hoveredId;
        hoverWaveStart = mountElapsed;
      }

      const targetElevScale = isBlueprint ? 0.0 : showElevationRef.current ? 1.0 : 0.0;
      currentElevScale += (targetElevScale - currentElevScale) * 0.14;
      currentBlueprintMix += ((isBlueprint ? 1.0 : 0.0) - currentBlueprintMix) * 0.16;

      // Update Anodized Hex Shader Uniforms
      hexShaderUniforms.uTime.value = elapsedSec;
      hexShaderUniforms.uBlueprintMix.value = currentBlueprintMix;
      hexShaderUniforms.uShowEngraving.value = showHexLatticeRef.current ? 1.0 : 0.0;

      // Active Chronicle Era lookup
      const activeEra = MAP_ERAS[chronicleEraRef.current] || MAP_ERAS[0];
      const activeEraRegions = new Set(activeEra.activeRegionIds);

      // Update 4,706 Instanced Monoliths with Radial Spring-Cascade Physics (Zero GC allocations)
      const instArray = hexMesh.instanceMatrix.array as Float32Array;
      const flattenedLand = 2.9;
      let matrixDirty = false;
      let stateDirty = false;

      for (let i = 0; i < hexCount; i++) {
        const regId = tileRegionIds[i];
        const baseH = hexAssets.baseHeights[i];
        const isWater = tileIsWater[i];
        const bootUnlocked = mountElapsed >= hexAssets.bootDelays[i];

        let lift = 0;
        let targetFocus = 0;
        let targetDim = 0;

        if (isBlueprint) {
          const isPin = regId !== null && regId === pinnedId;
          const isHov = regId !== null && regId === hoveredId;
          targetFocus = isPin ? 1.0 : isHov ? 0.72 : 0;
          targetDim = pinnedId && !isPin ? 0.75 : 0;
        } else if (lens === 'chronicle') {
          if (regId && activeEraRegions.has(regId)) {
            lift = regId === pinnedId ? 3.8 : 2.6;
            targetFocus = regId === pinnedId ? 1.0 : 0.76;
          } else if (!isWater) {
            lift = 3.1 - baseH;
            targetDim = 0.84;
          }
        } else if (!isWater) {
          const isPin = regId !== null && regId === pinnedId;
          const isHov = regId !== null && regId === hoveredId;

          if (isPin) {
            const elapsedPin = mountElapsed - pinWaveStart;
            const waveOpen = elapsedPin >= hexAssets.regionRadialDelays[i];
            lift = waveOpen ? 3.8 : 0;
            targetFocus = 1.0;
          } else if (isHov) {
            const elapsedHov = mountElapsed - hoverWaveStart;
            const waveOpen = elapsedHov >= hexAssets.regionRadialDelays[i] * 0.65;
            lift = waveOpen ? 1.9 : 0;
            targetFocus = 0.72;
            targetDim = pinnedId ? 0.35 : 0;
          } else if (pinnedId) {
            lift = -0.75;
            targetDim = 0.78;
          }
        }

        const sculptedY = isWater ? baseH : Math.max(WATER_LEVEL + 0.3, baseH + lift);
        let targetY = isWater
          ? baseH
          : flattenedLand + (sculptedY - flattenedLand) * currentElevScale;

        if (!bootUnlocked && !isWater) {
          targetY = -2.2;
        }

        const stiffness = bootUnlocked ? 0.16 : 0.18;
        const damping = 0.72;
        const currY = currentHeights[i];
        let vel = (heightVelocities[i] + (targetY - currY) * stiffness) * damping;
        let nextY = currY + vel;
        if (Math.abs(targetY - nextY) < 0.003 && Math.abs(vel) < 0.003) {
          nextY = targetY;
          vel = 0;
        }
        currentHeights[i] = nextY;
        heightVelocities[i] = vel;

        if (Math.abs(nextY - currY) > 0.0005) {
          instArray[i * 16 + 13] = nextY;
          matrixDirty = true;
        }

        const stIdx = i * 4;
        const prevFocus = tileStateData[stIdx];
        const prevDim = tileStateData[stIdx + 1];
        const nextFocus = prevFocus + (targetFocus - prevFocus) * 0.18;
        const nextDim = prevDim + (targetDim - prevDim) * 0.18;
        if (
          Math.abs(nextFocus - prevFocus) > 0.002 ||
          Math.abs(nextDim - prevDim) > 0.002 ||
          Math.abs(tileStateData[stIdx + 3] - lift) > 0.01
        ) {
          tileStateData[stIdx] = nextFocus;
          tileStateData[stIdx + 1] = nextDim;
          tileStateData[stIdx + 3] = lift;
          stateDirty = true;
        }
      }

      if (matrixDirty) hexMesh.instanceMatrix.needsUpdate = true;
      if (stateDirty) tileStateAttr.needsUpdate = true;

      // Update Smoked-Glass Ocean & War-Table Bezel
      waterMat.uniforms.uTime.value = elapsedSec;
      waterMat.uniforms.uBlueprintMix.value = currentBlueprintMix;
      waterMesh.visible = !isBlueprint;
      bezelGroup.visible = !isBlueprint;

      // Rotate Northern Orbital Ring + Drift Atmospheric Motes
      anomalyRing.rotation.z = elapsedSec * 0.12;
      anomalyRing.visible = !isBlueprint;
      moteCloud.rotation.y = elapsedSec * 0.012;
      moteCloud.visible = !isBlueprint;

      // Dynamic City Anchor Y-Sync + Rhodes Pulse Ring
      cityGroup.visible = !isBlueprint && showCitiesRef.current;
      cityEntries.forEach((ce) => {
        ce.anchorGroup.position.y = Math.max(WATER_LEVEL + 0.15, currentHeights[ce.hexIdx]) + 0.04;
      });
      if (rhodesBeacon.mesh && rhodesBeacon.mat) {
        const pulse = (elapsedSec * 0.45) % 1;
        rhodesBeacon.mesh.scale.setScalar(1 + pulse * 1.55);
        rhodesBeacon.mat.opacity = isBlueprint ? 0 : (1 - pulse) * 0.62;
      }

      // Nation Perimeter Highlighting synchronized to live kinetic tile elevation
      regionBorderMeshes.forEach((bObj, regId) => {
        const isPin = regId === pinnedId;
        const isHov = regId === hoveredId;
        const isEraActive = lens === 'chronicle' && activeEraRegions.has(regId);

        const repIdx = regionCentroidHexIdx.get(regId);
        if (repIdx !== undefined) {
          const repBaseAtScale =
            flattenedLand + (hexAssets.baseHeights[repIdx] - flattenedLand) * currentElevScale;
          const repLiftActual = currentHeights[repIdx] - repBaseAtScale;
          bObj.line.scale.set(1, Math.max(0.001, currentElevScale), 1);
          bObj.line.position.y =
            flattenedLand * (1 - currentElevScale) + repLiftActual + 0.16 * (1 - currentElevScale);
        }

        if (isPin) {
          bObj.mat.color.setRGB(1.45, 1.25, 0.16);
          bObj.mat.opacity = 1.0;
        } else if (isHov) {
          bObj.mat.color.setRGB(1.15, 1.15, 1.2);
          bObj.mat.opacity = 0.95;
        } else if (lens === 'chronicle') {
          bObj.mat.color.copy(bObj.defaultColor);
          bObj.mat.opacity = isEraActive ? 0.85 : 0.14;
        } else {
          bObj.mat.color.copy(bObj.defaultColor);
          bObj.mat.opacity = pinnedId ? 0.14 : isBlueprint ? 0.68 : 0.54;
        }
      });

      // Trajectory Ribbons (Filter by Category or Chronicle Era)
      const routesOn = showRoutesRef.current || lens === 'chronicle';
      routesGroup.visible = routesOn;
      routesGroup.scale.set(1, isBlueprint ? 0.02 : Math.max(0.15, currentElevScale), 1);
      routesGroup.position.y = isBlueprint ? 2.95 : 0;
      const activeFilter = routeFilterRef.current;

      const routeIsActiveMap = new Map<string, boolean>();
      routeEntries.forEach((re) => {
        const matchesCat =
          lens === 'chronicle'
            ? re.route.eraIndex <= activeEra.index
            : activeFilter === 'all' || re.route.category === activeFilter;
        const isCurrentEra = lens === 'chronicle' ? re.route.eraIndex === activeEra.index : true;
        const isPinMatch = !pinnedId || re.route.regionIds.includes(pinnedId);
        const isRelevant = routesOn && matchesCat && isPinMatch;
        routeIsActiveMap.set(re.route.id, isRelevant && isCurrentEra);

        const baseOp = !routesOn || !matchesCat ? 0 : isRelevant ? (isCurrentEra ? 0.92 : 0.25) : 0.07;
        re.tubeMat.opacity = baseOp;
        re.glowMat.opacity = !routesOn || !matchesCat ? 0 : isRelevant && isCurrentEra ? 0.20 : 0.02;
        re.anchorMat.opacity = baseOp * 0.72;
        re.pulseMat.opacity = !routesOn || !matchesCat ? 0 : isRelevant && isCurrentEra ? 0.98 : 0.1;
        re.pulseMesh.visible = routesOn && matchesCat && (isCurrentEra || !pinnedId);
        if (routesOn && matchesCat) {
          re.progress = (re.progress + re.speed) % 1;
          re.curve.getPointAt(re.progress, re.pulseMesh.position);
        }
      });

      composer.render();

      // Project & Solve 2D Screen-Space Collisions for HUD Pins
      const cWidth = container.clientWidth;
      const cHeight = container.clientHeight;
      const isShortViewport = cHeight <= 520;
      const heightRatio = THREE.MathUtils.clamp(cHeight / 620, 0.52, 1.0);
      const baseZoomScale = THREE.MathUtils.clamp(515 / cam.currentRadius, 0.68, 1.22);
      const zoomScale = baseZoomScale * heightRatio;
      const halfW = cWidth / 2;
      const halfH = cHeight / 2;

      const labelCandidates: ScreenLabelCandidate[] = [];
      const regCoords = new Map<string, { sx: number; sy: number; scale: number; dim: boolean }>();
      const cityCoords = new Map<string, { sx: number; sy: number; scale: number }>();
      const routeCoords = new Map<string, { sx: number; sy: number; scale: number }>();

      terraRegions.forEach((reg) => {
        const wx = reg.emblemPixelCoords.x - MAP_CENTER_X;
        const wz = reg.emblemPixelCoords.y - MAP_CENTER_Y;
        const repIdx = regionCentroidHexIdx.get(reg.id);
        const localH = repIdx !== undefined ? currentHeights[repIdx] : 6.0;
        const wy = isBlueprint ? 3.2 : localH + 2.8;

        projVec.set(wx, wy, wz).project(camera);
        if (projVec.z > 1) return;

        const sx = projVec.x * halfW + halfW;
        const sy = -projVec.y * halfH + halfH;
        const regScale = isShortViewport ? zoomScale * 0.88 : zoomScale;
        const isPin = reg.id === pinnedId;
        const isHov = reg.id === hoveredId;
        const dimInChronicle = lens === 'chronicle' && !activeEraRegions.has(reg.id) && !isPin && !isHov;

        regCoords.set(reg.id, { sx, sy, scale: regScale, dim: dimInChronicle });
        labelCandidates.push({
          id: `reg:${reg.id}`,
          x: sx,
          y: sy,
          width: 96 * regScale,
          height: 44 * regScale,
          priority: isPin ? 1000 : isHov ? 920 : dimInChronicle ? 120 : 500 + reg.relatedStoryIds.length * 4,
          forceShow: isPin || isHov,
        });
      });

      cityEntries.forEach((ce) => {
        const city = ce.city;
        const isRhodes = city.type === 'rhodes';
        const isCapital = city.type === 'capital';
        const isPin = city.regionId === pinnedId;
        const isHov = city.regionId === hoveredId;

        if (pinnedId && !isPin) return;
        const capitalLimit = isShortViewport ? 410 : 525;
        const visibleByZoom =
          isRhodes || isPin || isHov || (isCapital ? cam.currentRadius < capitalLimit : cam.currentRadius < 340);
        if (!visibleByZoom) return;

        const wx = city.pixelCoords.x - MAP_CENTER_X;
        const wz = city.pixelCoords.y - MAP_CENTER_Y;
        const localH = Math.max(WATER_LEVEL + 0.15, currentHeights[ce.hexIdx]);
        const wy = isBlueprint ? 3.2 : localH + ce.stemHeight + 1.8;

        projVec.set(wx, wy, wz).project(camera);
        if (projVec.z > 1) return;

        const sx = projVec.x * halfW + halfW;
        const sy = -projVec.y * halfH + halfH;
        const cScale = (isRhodes || isCapital || isPin || isHov ? zoomScale : zoomScale * 0.92) * (isShortViewport ? 0.82 : 1.0);
        cityCoords.set(city.id, { sx, sy, scale: cScale });

        labelCandidates.push({
          id: `city:${city.id}`,
          x: sx,
          y: sy,
          width: 92 * cScale,
          height: 22 * cScale,
          priority: isPin ? 840 : isRhodes ? 820 : isHov ? 760 : isCapital ? 340 : 190,
          forceShow: isPin || isRhodes,
        });
      });

      routeEntries.forEach((re) => {
        const rt = re.route;
        if (!routeIsActiveMap.get(rt.id)) return;
        re.curve.getPointAt(rt.labelT ?? 0.5, projVec);
        projVec.y = isBlueprint ? 3.2 : projVec.y * Math.max(0.15, currentElevScale) + 2.2;
        projVec.project(camera);
        if (projVec.z > 1) return;

        const sx = projVec.x * halfW + halfW;
        const sy = -projVec.y * halfH + halfH;
        const rScale = zoomScale * (isShortViewport ? 0.85 : 1.0);
        routeCoords.set(rt.id, { sx, sy, scale: rScale });

        labelCandidates.push({
          id: `route:${rt.id}`,
          x: sx,
          y: sy,
          width: 78 * rScale,
          height: 22 * rScale,
          priority: lens === 'chronicle' || pinnedId ? 700 : 280,
          forceShow: Boolean(pinnedId),
        });
      });

      const acceptedIds = solveLabelCollisions(labelCandidates, cWidth, cHeight);

      terraRegions.forEach((reg) => {
        const el = regionPinRefs.current.get(reg.id);
        if (!el) return;
        const pos = regCoords.get(reg.id);
        const show = pos && acceptedIds.has(`reg:${reg.id}`);
        if (!pos || !show) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        el.style.transform = `translate3d(${pos.sx}px, ${pos.sy}px, 0) translate(-50%, -50%) scale(${pos.scale})`;
        el.style.opacity = pinnedId ? (reg.id === pinnedId ? '1' : reg.id === hoveredId ? '0.9' : '0.35') : pos.dim ? '0.28' : '1';
        el.style.pointerEvents = 'auto';
      });

      terraCities.forEach((city) => {
        const el = cityPinRefs.current.get(city.id);
        if (!el) return;
        const pos = cityCoords.get(city.id);
        if (!pos || !acceptedIds.has(`city:${city.id}`)) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        el.style.transform = `translate3d(${pos.sx}px, ${pos.sy}px, 0) translate(-50%, -50%) scale(${pos.scale})`;
        el.style.opacity = '0.96';
        el.style.pointerEvents = 'auto';
      });

      routeEntries.forEach((re) => {
        const el = routePinRefs.current.get(re.route.id);
        if (!el) return;
        const pos = routeCoords.get(re.route.id);
        if (!pos || !acceptedIds.has(`route:${re.route.id}`)) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        el.style.transform = `translate3d(${pos.sx}px, ${pos.sy}px, 0) translate(-50%, -50%) scale(${pos.scale})`;
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      });
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw <= 0 || nh <= 0) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      composer.setSize(nw, nh);
      bloomPass.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      viewportRoot.removeEventListener('pointerdown', handlePointerDown);
      viewportRoot.removeEventListener('wheel', handleWheel);
      viewportRoot.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowBlur);
      window.removeEventListener('blur', handleWindowBlur);

      scene.traverse((obj) => {
        if ('geometry' in obj && obj.geometry instanceof THREE.BufferGeometry) {
          obj.geometry.dispose();
        }
        if ('material' in obj && obj.material) {
          const mat = obj.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      hexAssets.dispose();
      envRenderTarget.dispose();
      pmrem.dispose();
      bloomPass.dispose();
      composer.dispose();
      composerTarget.dispose();
      renderer.dispose();
    };
  }, [regionLookup, handleSelectRegion]);

  return (
    <div
      className={`relative w-full shrink-0 ${
        isHeaderCollapsed
          ? 'h-[100dvh] md:h-screen max-h-[100dvh] md:max-h-screen'
          : 'h-[calc(100dvh-6.25rem)] md:h-[calc(100vh-3.5rem)] max-h-[calc(100dvh-6.25rem)] md:max-h-[calc(100vh-3.5rem)]'
      } bg-[#07090e] overflow-hidden select-none`}
    >
      {/* =========================================================================
          1. WEBGL 3D WAR-TABLE VIEWPORT & COLLISION-FREE PINS
      ========================================================================= */}
      <div className="relative w-full h-full overflow-hidden touch-none">
        <div ref={mountRef} className="w-full h-full touch-none" />

        {/* Soft Edge Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_66%,rgba(6,8,12,0.72)_100%)]" />

        {/* Projected Nation Emblem Callouts */}
        {showLogos && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {terraRegions.map((reg) => {
              const isPinned = pinnedRegionId === reg.id;
              const isHovered = hoveredRegionId === reg.id;
              const isActive = isPinned || isHovered;

              return (
                <div
                  key={reg.id}
                  data-map-pin="true"
                  ref={(el) => {
                    if (el) regionPinRefs.current.set(reg.id, el);
                    else regionPinRefs.current.delete(reg.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRegion(reg.id);
                  }}
                  onPointerEnter={() => {
                    hoveredPinRegionRef.current = reg.id;
                    hoveredRegionRef.current = reg.id;
                    setHoveredRegionId(reg.id);
                    if (telemetrySectorRef.current) {
                      telemetrySectorRef.current.textContent = `${reg.nameKo} (${reg.nameEn.toUpperCase()})`;
                    }
                  }}
                  onPointerLeave={() => {
                    if (hoveredPinRegionRef.current === reg.id) {
                      hoveredPinRegionRef.current = null;
                    }
                  }}
                  className={`absolute top-0 left-0 cursor-pointer flex flex-col items-center transition-opacity duration-200 ${
                    isActive ? 'z-30' : 'z-10'
                  }`}
                >
                  {reg.logoUrl && (
                    <div
                      className={`relative ${
                        isLandscapeMobile ? 'w-5 h-5' : 'w-7 h-7 sm:w-9 sm:h-9'
                      } flex items-center justify-center transition-opacity duration-150 ${
                        isActive ? 'opacity-100' : 'opacity-90'
                      }`}
                    >
                      <img
                        src={resolveAssetUrl(reg.logoUrl)}
                        alt={reg.nameKo}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
                      />
                    </div>
                  )}

                  <div
                    style={
                      !isPinned && !isHovered && reg.badgeColor
                        ? { borderLeftColor: reg.badgeColor, borderLeftWidth: '2.5px' }
                        : undefined
                    }
                    className={`mt-0.5 ${
                      isLandscapeMobile
                        ? 'px-1 py-0 text-[8.5px]'
                        : 'px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px]'
                    } rounded-[2px] border font-mono transition-colors duration-150 flex items-center gap-1 sm:gap-1.5 backdrop-blur-md shadow-md ${
                      isPinned
                        ? 'bg-[#f5dd1b] text-black border-[#f5dd1b] font-extrabold shadow-lg'
                        : isHovered
                        ? 'bg-zinc-100 text-black border-white font-bold shadow-md'
                        : 'bg-[#0b0e14]/88 text-zinc-100 border-white/[0.14]'
                    }`}
                  >
                    <span className="tracking-tight whitespace-nowrap font-sans font-semibold">
                      {reg.nameKo}
                    </span>
                    {reg.relatedStoryIds.length > 0 && !isLandscapeMobile && (
                      <span
                        className={`text-[8.5px] sm:text-[9px] px-1 rounded-[1px] font-mono ${
                          isPinned || isHovered
                            ? 'bg-black/20 text-black font-black'
                            : 'bg-white/10 text-[#f5dd1b]'
                        }`}
                      >
                        {reg.relatedStoryIds.length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Projected Architectural City Pins */}
        {showCities && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {terraCities.map((city) => {
              const isSelected = selectedCityId === city.id;
              const isRhodes = city.type === 'rhodes';
              const isCapital = city.type === 'capital';

              return (
                <div
                  key={city.id}
                  data-map-pin="true"
                  ref={(el) => {
                    if (el) cityPinRefs.current.set(city.id, el);
                    else cityPinRefs.current.delete(city.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    setSelectedCityId(isSelected ? null : city.id);
                    flyToPixelCoords(
                      city.pixelCoords.x,
                      city.pixelCoords.y,
                      255,
                      mapLens === 'blueprint' ? 0 : 42
                    );
                    if (isTouchOrMobile) {
                      setPinnedRegionId(null);
                      const reg = terraRegions.find((r) => r.id === city.regionId);
                      setMobilePreviewCard({
                        type: 'city',
                        id: city.id,
                        code: city.type.toUpperCase(),
                        title: `${city.nameKo} (${city.nameEn})`,
                        subtitle: reg ? `소속 세력: ${reg.nameKo}` : city.regionId,
                        description: reg?.description || '핵심 이동도시 및 전략 거점입니다.',
                        storyId: reg?.relatedStoryIds?.[0],
                        regionId: city.regionId,
                        badgeColor: isRhodes ? '#e4e4e7' : '#f5dd1b',
                      });
                    } else {
                      setMobilePreviewCard(null);
                      setPinnedRegionId(city.regionId);
                    }
                  }}
                  className="absolute top-0 left-0 pointer-events-auto cursor-pointer z-20 group transition-opacity duration-200"
                >
                  <div
                    className={`flex items-center gap-1 ${
                      isLandscapeMobile
                        ? 'px-1 py-0 text-[8.5px]'
                        : 'px-1.5 py-0.5 text-[9.5px] sm:text-[10px]'
                    } font-mono border backdrop-blur-sm transition-colors ${
                      isRhodes
                        ? 'bg-[#14171f]/95 border-zinc-200 text-white font-bold shadow-lg'
                        : isSelected
                        ? 'bg-[#f5dd1b] border-white text-black font-bold'
                        : isCapital
                        ? 'bg-[#0e1118]/90 border-[#f5dd1b]/50 text-zinc-100 hover:border-[#f5dd1b]'
                        : 'bg-[#0b0e14]/86 border-white/15 text-zinc-300 hover:text-white hover:border-white/35'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rotate-45 ${
                        isRhodes ? 'bg-white' : isCapital ? 'bg-[#f5dd1b]' : 'bg-zinc-400'
                      }`}
                    />
                    <span className="whitespace-nowrap font-sans">{city.nameKo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Projected 3D Trajectory Capsules */}
        {(showRoutes || mapLens === 'chronicle') && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {TACTICAL_ROUTES.map((rt) => {
              const isRelevant = !pinnedRegionId || rt.regionIds.includes(pinnedRegionId);
              return (
                <div
                  key={rt.id}
                  data-map-pin="true"
                  ref={(el) => {
                    if (el) routePinRefs.current.set(rt.id, el);
                    else routePinRefs.current.delete(rt.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isTouchOrMobile) {
                      playClickSound();
                      setPinnedRegionId(null);
                      setMobilePreviewCard({
                        type: 'route',
                        id: rt.id,
                        code: rt.code,
                        title: rt.shortLabel,
                        subtitle: `기동 경로 코드: ${rt.code}`,
                        description: rt.fullLabel,
                        storyId: rt.storyId,
                        regionId: rt.regionIds[0],
                        badgeColor: rt.color,
                      });
                    } else {
                      handleOpenStoryPopup(rt.storyId);
                    }
                  }}
                  title={`${rt.fullLabel} (클릭하여 스토리 정보 팝업 열기)`}
                  className={`absolute top-0 left-0 pointer-events-auto cursor-pointer group transition-opacity duration-200 ${
                    isRelevant ? 'z-20' : 'z-10'
                  }`}
                >
                  <div
                    className={`${
                      isLandscapeMobile ? 'px-1 py-0.2 text-[8.5px]' : 'px-1.5 py-0.5 text-[9.5px] sm:text-[10px]'
                    } rounded-[2px] bg-[#0b0e14]/92 backdrop-blur-md border border-white/15 group-hover:border-[#f5dd1b] font-mono flex items-center gap-1 sm:gap-1.5 shadow-lg transition-all`}
                  >
                    <span className="w-1.5 h-1.5 rounded-[1px] flex-shrink-0" style={{ backgroundColor: rt.color }} />
                    <span className="text-zinc-100 group-hover:text-[#f5dd1b] font-bold tracking-tight transition-colors">
                      {rt.code}
                    </span>
                    <span
                      className={`text-zinc-300 group-hover:text-white font-sans text-[10px] transition-all duration-200 overflow-hidden whitespace-nowrap ${
                        pinnedRegionId && isRelevant
                          ? 'max-w-xs opacity-100 ml-0.5'
                          : 'max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-0.5'
                      }`}
                    >
                      {rt.shortLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MOBILE 2-STEP PREVIEW MINI CARD */}
        {mobilePreviewCard && (
          <div
            data-hud-panel="true"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute bottom-14 left-3 right-3 sm:left-auto sm:right-4 sm:w-88 z-40 prts-glass rounded-[2px] border border-white/20 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] animate-fadeIn pointer-events-auto"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold text-black flex-shrink-0"
                  style={{ backgroundColor: mobilePreviewCard.badgeColor || '#f5dd1b' }}
                >
                  {mobilePreviewCard.code}
                </span>
                <span className="text-xs font-bold text-white truncate">{mobilePreviewCard.title}</span>
              </div>
              <button
                onClick={() => setMobilePreviewCard(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-[2px] bg-white/5 cursor-pointer flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mb-1.5 truncate">
              {mobilePreviewCard.subtitle}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 mb-3 break-keep">
              {mobilePreviewCard.description}
            </p>
            <div className="flex items-center gap-2">
              {mobilePreviewCard.storyId && (
                <button
                  onClick={() => handleOpenStoryPopup(mobilePreviewCard.storyId!)}
                  className="flex-1 h-8 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black text-xs font-bold font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <span>관련 스토리 열기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {mobilePreviewCard.regionId && (
                <button
                  onClick={() => handleSelectRegion(mobilePreviewCard.regionId!)}
                  className="h-8 px-3 rounded-[2px] bg-[#17191f] hover:bg-[#22252d] border border-white/15 text-zinc-200 text-xs font-mono cursor-pointer transition-colors"
                >
                  세력 정보
                </button>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            2-A. MOBILE TOP COMPACT DOCK (< 768px)
        ========================================================================= */}
        <div
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="md:hidden absolute top-2 left-2 right-2 z-30 flex flex-col gap-1.5 pointer-events-none"
        >
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <div className="flex-1 prts-glass rounded-[2px] p-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 ml-1 flex-shrink-0" />
              <input
                type="text"
                value={sectorSearch}
                onFocus={() => setIsSectorListOpen(true)}
                onChange={(e) => {
                  setSectorSearch(e.target.value);
                  if (!isSectorListOpen) setIsSectorListOpen(true);
                }}
                placeholder="지역 · 수도 검색..."
                className="w-full h-6 bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none"
              />
              {sectorSearch && (
                <button
                  onClick={() => setSectorSearch('')}
                  className="p-0.5 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => {
                  playClickSound();
                  setIsSectorListOpen(!isSectorListOpen);
                }}
                className="h-6 px-1.5 rounded-[2px] bg-white/[0.06] text-[10px] font-mono text-zinc-200 flex items-center gap-0.5 cursor-pointer flex-shrink-0"
              >
                <span>{filteredRegions.length}</span>
                {isSectorListOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="prts-glass rounded-[2px] p-1 flex items-center gap-0.5 text-[10.5px] font-mono">
              <button
                onClick={() => handleSwitchLens('tactical')}
                className={`h-6 px-1.5 rounded-[1px] font-bold cursor-pointer ${
                  mapLens === 'tactical' ? 'bg-zinc-100 text-black' : 'text-zinc-400'
                }`}
              >
                전술
              </button>
              <button
                onClick={() => handleSwitchLens('chronicle')}
                className={`h-6 px-1.5 rounded-[1px] font-bold cursor-pointer ${
                  mapLens === 'chronicle' ? 'bg-[#f5dd1b] text-black' : 'text-zinc-400'
                }`}
              >
                연대기
              </button>
              <button
                onClick={() => handleSwitchLens('blueprint')}
                className={`h-6 px-1.5 rounded-[1px] font-bold cursor-pointer ${
                  mapLens === 'blueprint' ? 'bg-zinc-100 text-black' : 'text-zinc-400'
                }`}
              >
                2D
              </button>
            </div>

            <button
              onClick={() => {
                playOpenSound();
                setIsLegendOpen(true);
              }}
              aria-label="범례 및 조작"
              className="prts-glass w-8 h-8 rounded-[2px] flex items-center justify-center text-zinc-300 cursor-pointer flex-shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {isSectorListOpen && (
            <div className="pointer-events-auto prts-glass rounded-[2px] overflow-hidden shadow-2xl animate-fadeIn">
              <div className="overflow-y-auto divide-y divide-white/[0.05] max-h-52">
                {filteredRegions.map((reg) => {
                  const isPinned = pinnedRegionId === reg.id;
                  return (
                    <button
                      key={reg.id}
                      onClick={() => handleSelectRegion(reg.id)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isPinned
                          ? 'bg-white/[0.08] text-white border-l-2 border-l-[#f5dd1b]'
                          : 'hover:bg-white/[0.04] text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-[1px] flex-shrink-0" style={{ backgroundColor: reg.badgeColor }} />
                        <div className="truncate">
                          <span className="text-xs font-bold">{reg.nameKo}</span>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase ml-1.5">{reg.nameEn}</span>
                        </div>
                      </div>
                      {reg.relatedStoryIds.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[1px] bg-white/[0.06] text-zinc-300">
                          {reg.relatedStoryIds.length}편
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pointer-events-auto flex items-center gap-1 overflow-x-auto no-scrollbar">
            <div className="prts-glass rounded-[2px] p-1 flex items-center gap-1 text-[11px] flex-shrink-0">
              <button
                onClick={() => {
                  playClickSound();
                  setShowHexLattice(!showHexLattice);
                }}
                className={`h-6 px-2 rounded-[1px] flex items-center gap-1 cursor-pointer ${
                  showHexLattice ? 'bg-white/[0.1] text-white font-bold' : 'text-zinc-500'
                }`}
              >
                <Hexagon className="w-3 h-3" />
                <span>각인</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  if (mapLens === 'blueprint') {
                    handleSwitchLens('tactical');
                    setShowElevation(true);
                  } else {
                    setShowElevation(!showElevation);
                  }
                }}
                className={`h-6 px-2 rounded-[1px] flex items-center gap-1 cursor-pointer ${
                  mapLens !== 'blueprint' && showElevation ? 'bg-white/[0.1] text-white font-bold' : 'text-zinc-500'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>고저차</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowLogos(!showLogos);
                }}
                className={`h-6 px-2 rounded-[1px] cursor-pointer ${
                  showLogos ? 'bg-white/[0.1] text-white font-bold' : 'text-zinc-500'
                }`}
              >
                국가
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowCities(!showCities);
                }}
                className={`h-6 px-2 rounded-[1px] flex items-center gap-1 cursor-pointer ${
                  showCities ? 'bg-white/[0.1] text-white font-bold' : 'text-zinc-500'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>거점</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowRoutes(!showRoutes);
                }}
                className={`h-6 px-2 rounded-[1px] flex items-center gap-1 cursor-pointer ${
                  showRoutes || mapLens === 'chronicle' ? 'bg-white/[0.1] text-[#f5dd1b] font-bold' : 'text-zinc-500'
                }`}
              >
                <Route className="w-3 h-3" />
                <span>경로</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2-B. DESKTOP TOP-LEFT REGION SEARCH & DIRECTORY (hidden md:flex)
        ========================================================================= */}
        <div
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className={`hidden md:flex absolute ${
            isLandscapeMobile ? 'top-2 left-2 w-48' : 'top-4 left-4 w-68 sm:w-76'
          } z-30 flex-col pointer-events-none`}
        >
          <div className="pointer-events-auto prts-glass rounded-[2px] p-1.5 shadow-xl flex items-center gap-1.5">
            <div className="relative flex-1 flex items-center">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={sectorSearch}
                onFocus={() => setIsSectorListOpen(true)}
                onChange={(e) => {
                  setSectorSearch(e.target.value);
                  if (!isSectorListOpen) setIsSectorListOpen(true);
                }}
                placeholder={isLandscapeMobile ? '지역 · 국가 검색...' : '테라 22개 권역 · 수도 검색...'}
                className={`w-full ${
                  isLandscapeMobile ? 'h-6 text-[11px] pl-7 pr-5' : 'h-7 text-xs pl-8 pr-6'
                } bg-[#10131a] hover:bg-[#151922] focus:bg-[#090b10] border border-transparent focus:border-[#f5dd1b]/60 rounded-[2px] text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors`}
              />
              {sectorSearch && (
                <button
                  onClick={() => setSectorSearch('')}
                  className="absolute right-1.5 p-0.5 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                playClickSound();
                setIsSectorListOpen(!isSectorListOpen);
              }}
              title={isSectorListOpen ? '지역 목록 접기' : '지역 목록 펼치기'}
              className={`${
                isLandscapeMobile ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-[11px]'
              } rounded-[2px] bg-[#10131a] hover:bg-[#1a1e28] text-zinc-300 hover:text-white border border-white/[0.08] flex items-center gap-1 font-mono transition-colors cursor-pointer flex-shrink-0`}
            >
              <Compass className={isLandscapeMobile ? 'w-3 h-3 text-zinc-300' : 'w-3.5 h-3.5 text-zinc-300'} />
              <span>{filteredRegions.length}</span>
              {isSectorListOpen ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
            </button>
          </div>

          {isSectorListOpen && (
            <div className="pointer-events-auto mt-1.5 prts-glass rounded-[2px] overflow-hidden shadow-xl animate-fadeIn">
              <div className="overflow-y-auto divide-y divide-white/[0.05] max-h-68">
                {filteredRegions.map((reg) => {
                  const isPinned = pinnedRegionId === reg.id;
                  return (
                    <button
                      key={reg.id}
                      onClick={() => handleSelectRegion(reg.id)}
                      onPointerEnter={() => {
                        hoveredRegionRef.current = reg.id;
                        setHoveredRegionId(reg.id);
                      }}
                      onPointerLeave={() => {
                        hoveredRegionRef.current = null;
                        setHoveredRegionId(null);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isPinned
                          ? 'bg-white/[0.08] text-white border-l-2 border-l-[#f5dd1b]'
                          : 'hover:bg-white/[0.05] text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-[1px] flex-shrink-0" style={{ backgroundColor: reg.badgeColor }} />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{reg.nameKo}</div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase truncate">{reg.nameEn}</div>
                        </div>
                      </div>
                      {reg.relatedStoryIds.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#10131a] text-zinc-400">
                          {reg.relatedStoryIds.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            3. DESKTOP TOP-RIGHT 3-LENS SWITCHER & LAYER CONTROLS (hidden md:flex)
        ========================================================================= */}
        <div
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className={`hidden md:flex absolute ${
            isLandscapeMobile ? 'top-2 right-2 gap-1' : 'top-4 right-4 gap-1.5'
          } z-30 flex-col items-end pointer-events-none`}
        >
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
            {/* 3 Tactical Lenses Switcher */}
            <div className="pointer-events-auto prts-glass rounded-[2px] p-0.5 sm:p-1 flex items-center gap-0.5 text-xs shadow-xl">
              <button
                onClick={() => handleSwitchLens('tactical')}
                className={`${
                  isLandscapeMobile ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-xs'
                } rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                  mapLens === 'tactical' ? 'bg-zinc-100 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>전술 지형</span>
              </button>
              <button
                onClick={() => handleSwitchLens('chronicle')}
                className={`${
                  isLandscapeMobile ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-xs'
                } rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                  mapLens === 'chronicle' ? 'bg-[#f5dd1b] text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>연대기 궤적</span>
              </button>
              <button
                onClick={() => handleSwitchLens('blueprint')}
                className={`${
                  isLandscapeMobile ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-xs'
                } rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                  mapLens === 'blueprint' ? 'bg-zinc-100 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>2D 도면</span>
              </button>
            </div>

            {/* Clean Layer Toggles */}
            <div className="pointer-events-auto prts-glass rounded-[2px] p-0.5 sm:p-1 flex items-center gap-0.5 text-xs shadow-xl">
              <button
                onClick={() => {
                  playClickSound();
                  setShowHexLattice(!showHexLattice);
                }}
                title="CNC 헥스 각인·적층 디테일 토글"
                className={`${
                  isLandscapeMobile ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-xs'
                } rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                  showHexLattice ? 'bg-white/[0.12] text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Hexagon className="w-3.5 h-3.5" />
                <span>각인</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  if (mapLens === 'blueprint') {
                    handleSwitchLens('tactical');
                    setShowElevation(true);
                  } else {
                    setShowElevation(!showElevation);
                  }
                }}
                title="입체 고저차 단차 토글"
                className={`${
                  isLandscapeMobile ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-xs'
                } rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                  mapLens !== 'blueprint' && showElevation
                    ? 'bg-white/[0.12] text-white font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>고저차</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowLogos(!showLogos);
                }}
                className={`${
                  isLandscapeMobile ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-xs'
                } rounded-[2px] cursor-pointer transition-colors ${
                  showLogos ? 'bg-white/[0.12] text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>국가</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowCities(!showCities);
                }}
                className={`${
                  isLandscapeMobile ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-xs'
                } rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                  showCities ? 'bg-white/[0.12] text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>거점</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowRoutes(!showRoutes);
                }}
                className={`${
                  isLandscapeMobile ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-xs'
                } rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                  showRoutes || mapLens === 'chronicle'
                    ? 'bg-white/[0.12] text-[#f5dd1b] font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Route className="w-3.5 h-3.5" />
                <span>경로</span>
              </button>
            </div>

            <div className="pointer-events-auto prts-glass rounded-[2px] p-0.5 sm:p-1 flex items-center gap-0.5 text-xs shadow-xl">
              <button
                onClick={() => {
                  playOpenSound();
                  setIsLegendOpen(true);
                }}
                className={`${
                  isLandscapeMobile ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-xs'
                } rounded-[2px] flex items-center gap-1 cursor-pointer text-zinc-300 hover:text-white hover:bg-white/[0.08]`}
                title="테라 지도 범례 & 조작 가이드"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">안내</span>
              </button>
              {onToggleHeaderCollapse && (
                <button
                  onClick={() => {
                    playClickSound();
                    onToggleHeaderCollapse();
                  }}
                  title={isHeaderCollapsed ? '상단 메뉴 복원' : '상단 메뉴 숨기기'}
                  className={`${
                    isLandscapeMobile ? 'h-6 px-1.5 text-[10px]' : 'h-7 px-2 text-xs'
                  } rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                    isHeaderCollapsed
                      ? 'bg-[#f5dd1b]/15 text-[#f5dd1b] border border-[#f5dd1b]/50'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {isHeaderCollapsed ? <PanelTopOpen className="w-3.5 h-3.5" /> : <PanelTopClose className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Route Filter Row (in Relief/Blueprint lenses when routes active) */}
          {showRoutes && mapLens !== 'chronicle' && (
            <div className="pointer-events-auto prts-glass rounded-[2px] p-0.5 sm:p-1 flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] shadow-xl">
              <span className="px-1.5 text-[9.5px] font-mono text-zinc-400 hidden sm:inline">경로</span>
              {(
                [
                  { id: 'all', label: '전체', count: TACTICAL_ROUTES.length },
                  { id: 'main', label: '메인 스토리', count: TACTICAL_ROUTES.filter((r) => r.category === 'main').length },
                  { id: 'series', label: '세력 연작', count: TACTICAL_ROUTES.filter((r) => r.category === 'series').length },
                  { id: 'expedition', label: '대륙 원정', count: TACTICAL_ROUTES.filter((r) => r.category === 'expedition').length },
                ] as const
              ).map((tab) => {
                const isActive = routeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playClickSound();
                      setRouteFilter(tab.id);
                    }}
                    className={`${
                      isLandscapeMobile ? 'h-5 px-1.5 text-[9.5px]' : 'h-6 px-2 text-xs'
                    } rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-white/[0.12] border border-white/25 text-[#f5dd1b] font-bold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`font-mono text-[9px] ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            3.5 CHRONICLE TIMELINE SCRUBBER DOCK (Shown in 'chronicle' lens)
        ========================================================================= */}
        {mapLens === 'chronicle' && !pinnedRegion && (
          <div
            data-hud-panel="true"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute bottom-14 md:bottom-16 inset-x-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[min(680px,92vw)] z-30 prts-glass rounded-[2px] border border-[#f5dd1b]/35 p-2.5 shadow-2xl pointer-events-auto animate-fadeIn space-y-2"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsEraPlaying(!isEraPlaying);
                  }}
                  className="h-7 px-2.5 rounded-[2px] bg-[#f5dd1b] hover:bg-white text-black font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
                >
                  {isEraPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isEraPlaying ? '정지' : '연대기 재생'}</span>
                </button>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {MAP_ERAS[chronicleEraIdx].code} · {MAP_ERAS[chronicleEraIdx].titleKo}
                  </div>
                  <div className="text-[10.5px] text-zinc-400 truncate hidden sm:block">
                    {MAP_ERAS[chronicleEraIdx].summary}
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] font-mono text-[#f5dd1b] flex-shrink-0">
                {MAP_ERAS[chronicleEraIdx].year}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {MAP_ERAS.map((era) => {
                const active = era.index === chronicleEraIdx;
                return (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsEraPlaying(false);
                      setChronicleEraIdx(era.index);
                    }}
                    className={`py-1 px-1.5 rounded-[2px] border text-left font-mono transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#f5dd1b]/18 border-[#f5dd1b] text-white'
                        : 'bg-[#10131a]/80 border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/25'
                    }`}
                  >
                    <div className={`text-[9.5px] font-bold ${active ? 'text-[#f5dd1b]' : 'text-zinc-300'}`}>
                      {era.code}
                    </div>
                    <div className="text-[9px] text-zinc-500 truncate hidden sm:block">{era.year}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            4. BOTTOM STATUS TELEMETRY & CAMERA BAR
        ========================================================================= */}
        <div
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className={`absolute ${
            isLandscapeMobile
              ? 'bottom-2 left-2 right-2 justify-end'
              : 'bottom-3 md:bottom-4 left-3 right-3 md:left-4 md:right-4 justify-center md:justify-between'
          } z-30 flex items-end pointer-events-none gap-2 md:gap-3 ${
            (isTouchOrMobile || isLandscapeMobile) && (pinnedRegion || mobilePreviewCard || isHeaderCollapsed)
              ? 'hidden'
              : 'flex'
          }`}
        >
          <div
            className={`${
              isLandscapeMobile ? 'hidden' : 'hidden md:flex'
            } pointer-events-auto prts-glass rounded-[2px] px-3 py-1.5 items-center gap-2 text-[11px] shadow-xl`}
          >
            <span className="w-1.5 h-1.5 bg-[#f5dd1b] shrink-0" />
            <span ref={telemetrySectorRef} className="text-zinc-100 font-semibold whitespace-nowrap">
              중립 지역
            </span>
            <span
              ref={telemetryCoordRef}
              className="text-zinc-500 font-mono text-[10px] pl-2 border-l border-white/10 hidden lg:inline whitespace-nowrap"
            >
              X:410 Y:512 · 640M
            </span>
          </div>

          <div
            className={`pointer-events-auto ${
              isLandscapeMobile ? 'w-auto p-1 text-[10px] gap-1' : 'w-full md:w-auto p-1.5 md:p-1 text-xs gap-1.5 md:gap-1'
            } prts-glass rounded-[2px] flex items-center justify-between md:justify-end font-mono shadow-xl`}
          >
            <span ref={telemetryAngleRef} className="px-2 text-[10px] text-zinc-400 hidden lg:inline border-r border-white/10 mr-0.5">
              49° / 0°
            </span>

            {mapLens !== 'blueprint' ? (
              <>
                <div
                  className={`flex-1 md:flex-initial flex items-center ${
                    isLandscapeMobile ? 'gap-1 px-1.5 py-0.5' : 'gap-2 px-2.5 py-1 md:py-0.5'
                  } rounded-[2px] bg-[#10131a] border border-white/[0.08]`}
                >
                  <Compass className={`${isLandscapeMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-zinc-400 flex-shrink-0`} />
                  <input
                    ref={telemetryYawSliderRef}
                    type="range"
                    min="0"
                    max="359"
                    defaultValue="0"
                    onChange={(e) => handleSetAzimuthDegrees(Number(e.target.value))}
                    className={`flex-1 ${
                      isLandscapeMobile ? 'w-16 md:w-20' : 'md:w-24'
                    } h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#f5dd1b]`}
                    title="360도 회전 각도 조절"
                  />
                  <span
                    ref={telemetryYawTextRef}
                    className={`${isLandscapeMobile ? 'text-[9.5px] w-7' : 'text-[10.5px] w-8'} text-zinc-200 font-mono text-right flex-shrink-0`}
                  >
                    0°
                  </span>
                </div>

                <button
                  onClick={() => handleRotateYaw(-Math.PI / 8)}
                  title="좌측 22.5° 회전"
                  className={`${
                    isLandscapeMobile ? 'w-6 h-6 text-xs' : 'w-7 h-7'
                  } rounded-[2px] text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer flex-shrink-0`}
                >
                  ↺
                </button>
                <button
                  onClick={() => handleRotateYaw(Math.PI / 8)}
                  title="우측 22.5° 회전"
                  className={`${
                    isLandscapeMobile ? 'w-6 h-6 text-xs' : 'w-7 h-7'
                  } rounded-[2px] text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer flex-shrink-0`}
                >
                  ↻
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 md:py-0.5 rounded-[2px] bg-[#10131a] border border-white/[0.08] font-mono text-[11px] text-zinc-300 select-none">
                <Compass className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-sans font-bold text-white">2D 도면 고정</span>
              </div>
            )}

            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
            <button
              onClick={() => handleZoom(90)}
              title="축소"
              className="w-7 h-7 rounded-[2px] text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span ref={telemetryZoomRef} className="inline-block px-1 text-[11px] min-w-[40px] text-zinc-100 font-bold text-center select-none">
              100%
            </span>
            <button
              onClick={() => handleZoom(-90)}
              title="확대"
              className="w-7 h-7 rounded-[2px] text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
            <button
              onClick={handleResetCamera}
              title="시점 초기화"
              className="h-7 px-2 md:w-7 md:px-0 rounded-[2px] text-zinc-200 hover:text-black hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            5. REGION DOSSIER DRAWER
        ========================================================================= */}
        {pinnedRegion && (
          <aside
            data-hud-panel="true"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            style={
              isTouchOrMobile && sheetDragY > 0
                ? { transform: `translateY(${sheetDragY}px)`, transition: 'none' }
                : undefined
            }
            className={`absolute inset-x-0 bottom-0 max-h-[56dvh] md:max-h-none md:inset-x-auto ${
              isLandscapeMobile
                ? 'md:top-10 md:bottom-3 md:right-2 md:w-76'
                : showRoutes && mapLens !== 'chronicle'
                ? 'md:top-24 md:bottom-16 md:right-4 md:w-84 lg:w-92'
                : 'md:top-16 md:bottom-16 md:right-4 md:w-84 lg:w-92'
            } prts-glass rounded-t-[4px] md:rounded-[2px] border-t border-white/20 md:border-t-0 flex flex-col z-40 shadow-2xl overflow-hidden animate-fadeIn md:animate-slideInRight transition-all`}
          >
            <div
              onTouchStart={(e) => {
                sheetTouchStartY.current = e.touches[0].clientY;
              }}
              onTouchMove={(e) => {
                if (sheetTouchStartY.current === null) return;
                setSheetDragY(Math.max(0, e.touches[0].clientY - sheetTouchStartY.current));
              }}
              onTouchEnd={() => {
                if (sheetDragY > 60) {
                  playCloseSound();
                  setPinnedRegionId(null);
                }
                setSheetDragY(0);
                sheetTouchStartY.current = null;
              }}
              onClick={() => {
                playCloseSound();
                setPinnedRegionId(null);
              }}
              className="md:hidden flex items-center justify-center py-2.5 bg-black/50 border-b border-white/[0.06] cursor-pointer flex-shrink-0 touch-none"
            >
              <div className="w-10 h-1 rounded-[1px] bg-zinc-600" />
            </div>

            <div className={`${isLandscapeMobile ? 'px-3 py-2' : 'px-4 py-3 sm:p-5'} border-b border-white/10 relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-transparent flex-shrink-0`}>
              {pinnedRegion.logoUrl && (
                <img
                  src={resolveAssetUrl(pinnedRegion.logoUrl)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute -right-3 -bottom-3 w-24 h-24 sm:w-28 sm:h-28 object-contain opacity-12 pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between mb-1.5 sm:mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: pinnedRegion.badgeColor }} />
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                    {pinnedRegion.nameEn}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPinnedRegionId(null);
                  }}
                  title="패널 닫기"
                  className="w-6 h-6 rounded-[2px] bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{pinnedRegion.nameKo}</h2>

              {pinnedRegion.capital && (
                <div className="mt-2.5 pt-2.5 border-t border-white/8 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">수도 / 거점</span>
                  <span className="text-[#f5dd1b] font-semibold">{pinnedRegion.capital}</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain prts-modal-scroll p-3.5 sm:p-5 space-y-4 sm:space-y-5">
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-zinc-400">지역 소개</div>
                <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed bg-[#111319] border border-white/[0.06] rounded-[2px] p-3 break-keep">
                  {pinnedRegion.description}
                </p>
              </div>

              {pinnedRegionCities.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                    <span>주요 도시 · 거점</span>
                    <span className="font-mono text-[10px] text-zinc-400">{pinnedRegionCities.length}곳</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {pinnedRegionCities.map((c) => (
                      <button
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          setSelectedCityId(c.id);
                          flyToPixelCoords(c.pixelCoords.x, c.pixelCoords.y, 240, mapLens === 'blueprint' ? 0 : 40);
                        }}
                        className={`p-2 rounded-[2px] text-left border text-xs transition-colors cursor-pointer ${
                          selectedCityId === c.id
                            ? 'bg-[#f5dd1b]/15 border-[#f5dd1b] text-[#f5dd1b]'
                            : 'bg-[#111319] border-white/[0.07] text-zinc-200 hover:bg-[#191c25]'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rotate-45 flex-shrink-0 ${
                              c.type === 'capital' || c.type === 'rhodes' ? 'bg-[#f5dd1b]' : 'bg-zinc-400'
                            }`}
                          />
                          <div className="font-semibold truncate">{c.nameKo}</div>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">{c.nameEn}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pinnedRegionRoutes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                    <span>스토리 이동 경로</span>
                    <span className="font-mono text-[10px] text-zinc-400">{pinnedRegionRoutes.length}개</span>
                  </div>
                  <div className="space-y-1.5">
                    {pinnedRegionRoutes.map((rt) => (
                      <button
                        key={rt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStoryPopup(rt.storyId);
                        }}
                        className="w-full p-2.5 rounded-[2px] text-left bg-[#111319] hover:bg-[#191c25] border border-white/[0.07] hover:border-[#f5dd1b]/50 transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-[1px] flex-shrink-0" style={{ backgroundColor: rt.color }} />
                            <span className="font-mono text-[10px] font-bold text-[#f5dd1b]">{rt.code}</span>
                            <span className="text-[11px] font-semibold text-zinc-200 group-hover:text-white truncate">
                              {rt.shortLabel}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 pl-3 truncate">{rt.fullLabel}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#f5dd1b] flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                  <span>관련 스토리</span>
                  <span className="font-mono text-xs text-[#f5dd1b]">{pinnedRegionStories.length}편</span>
                </div>

                {pinnedRegionStories.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500 border border-white/[0.06] rounded-[2px] bg-[#111319]">
                    관련 스토리가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pinnedRegionStories.map((st) => {
                      const state = getStoryAccessState(st);
                      const isRestored = state === 'available';
                      return (
                        <div
                          key={st.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStoryPopup(st.id);
                          }}
                          className={`group relative p-2.5 rounded-[2px] border transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                            isRestored
                              ? 'bg-[#13161e] border-[#f5dd1b]/35 hover:border-[#f5dd1b] hover:bg-[#1a1d28]'
                              : 'bg-[#111319] border-white/[0.07] hover:border-white/25 hover:bg-[#181b24]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {st.splashVisualUrl && (
                              <div className="w-16 h-11 rounded-[1px] overflow-hidden border border-white/10 bg-black flex-shrink-0">
                                <img
                                  src={resolveAssetUrl(st.splashVisualUrl)}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  draggable={false}
                                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                  onError={(e) => {
                                    const wrap = e.currentTarget.parentElement;
                                    if (wrap) wrap.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                <span
                                  className={`px-1.5 py-0.2 rounded-[1px] font-bold flex-shrink-0 ${
                                    isRestored ? 'bg-[#f5dd1b] text-black' : 'bg-white/[0.08] text-zinc-300'
                                  }`}
                                >
                                  {st.code}
                                </span>
                                <span className="text-zinc-500 truncate">{st.timeline}</span>
                              </div>
                              <div className="text-sm font-bold text-white group-hover:text-[#f5dd1b] transition-colors truncate">
                                {st.titleKo}
                              </div>
                              <div className="text-[10px] font-mono text-zinc-500 truncate">{st.titleEn}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {onNavigateToChronicleStory && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playClickSound();
                                  onNavigateToChronicleStory(st.id);
                                }}
                                className="h-6 px-1.5 rounded-[2px] bg-[#0b0e14] hover:bg-[#f5dd1b] border border-white/[0.1] hover:border-[#f5dd1b] text-[10px] font-mono text-zinc-400 hover:text-black inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="연대기에서 위치 보기"
                              >
                                <GitBranch className="w-2.5 h-2.5" />
                                <span>연대기</span>
                              </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#f5dd1b] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        <StorySplashModal
          story={splashStory}
          isOpen={Boolean(splashStory)}
          onClose={() => setSplashStory(null)}
          onEnterStory={(storyId) => {
            setSplashStory(null);
            onSelectStory(storyId);
          }}
          onSelectStoryInModal={(nextStory) => setSplashStory(nextStory)}
        />

        <TacticalMapLegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />
      </div>
    </div>
  );
};

interface TacticalMapLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TacticalMapLegendModal: React.FC<TacticalMapLegendModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playCloseSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-modal="true"
      data-hud-panel="true"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn select-none"
      onClick={(e) => {
        e.stopPropagation();
        playCloseSound();
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="테라 지도 안내 & 범례"
        className="relative w-full max-w-3xl max-h-[88vh] bg-[#121316] border border-white/15 rounded-[2px] shadow-2xl flex flex-col overflow-hidden animate-scaleUp text-zinc-100"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[2px] w-full bg-zinc-200" />
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#16181d]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#f5dd1b]" />
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">테라 지도 안내 & 범례</h3>
              <p className="text-[11px] font-mono text-zinc-400 mt-0.5">PRTS PRECISION HEX WAR-TABLE</p>
            </div>
          </div>
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="w-7 h-7 rounded-[2px] bg-[#1c1e24] hover:bg-[#252830] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain prts-modal-scroll p-5 space-y-5 text-xs sm:text-[13px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-1">
              <div className="font-bold text-white text-xs">아노다이징 메탈 헥스 & 키네틱 파동</div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                공식 테라 3.0 4,706개 육각 타일을 45° 챔퍼 베벨과 레이저 각인이 들어간 계단식 3D 모노리스로 구현했습니다. 세력을 가리키거나 선택하면 중심에서 국경까지 방사형 파동으로 솟아오릅니다.
              </p>
            </div>
            <div className="p-3 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-1">
              <div className="font-bold text-white text-xs">3가지 전술 렌즈 (전술 지형 · 연대기 · 2D 도면)</div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                '연대기 궤적' 렌즈에서는 ERA 00~04 시대 스크러버로 시기별 작전 지역과 이동 경로를 순서대로 추적할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-xs">
              <Keyboard className="w-4 h-4 text-zinc-400" />
              <span>기본 조작법</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              좌클릭 드래그 이동 · 우클릭 드래그(Shift+드래그) 360° 회전 및 각도 조절 · 휠 줌(더블클릭 확대) · WASD/방향키 이동.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#101114] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500">PRTS TACTICAL ATLAS</span>
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-[2px] bg-zinc-100 text-black font-bold font-sans hover:bg-[#f5dd1b] transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

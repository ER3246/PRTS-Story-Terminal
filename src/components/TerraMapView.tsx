import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { terraRegions, terraCities, type TerraRegion } from '../data/terraRegions';
import { storyRegistry, getStoryAccessState, type StoryListItem } from '../data/storyRegistry';
import {
  terraHexCells,
  cellIndex,
  HEX_RADIUS,
  neighborKeys,
  type HexCell,
  type CellType
} from '../data/terraHexGrid';
import { StorySplashModal } from './StorySplashModal';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Compass,
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
  Maximize2
} from 'lucide-react';
import { playClickSound, playTabSwitchSound, playOpenSound, playCloseSound } from '../utils/soundEffects';
import { resolveAssetUrl } from '../utils/assetUrl';

interface TerraMapViewProps {
  onSelectStory: (id: string) => void;
  isHeaderCollapsed?: boolean;
  onToggleHeaderCollapse?: () => void;
}

// Refined Tactical Mineral & Biome Palette (Rich, Cohesive Wargame Aesthetic)
const CELL_COLORS: Record<CellType, string> = {
  // Bathymetry & Anomalies
  deep: '#0c1626',
  shallow: '#152942',
  void: '#060911',
  crater: '#111a2b',

  // Neutral Continental Landmass & Extreme Environments
  land: '#283344',
  frontier: '#202938',
  icefield: '#647d98',
  foehn_hotlands: '#5e3222',

  // 18 Major Nations & Factions (Refined Tactical Slate-Mineral Tones)
  ursus: '#742d3b',
  kazimierz: '#2c6248',
  columbia: '#2b5082',
  bolivar: '#255d6e',
  yan: '#76592c',
  sargon: '#6c4d28',
  minos: '#74422b',
  victoria: '#583b82',
  leithanien: '#465472',
  higashi: '#42487c',
  sami: '#563c78',
  siracusa: '#6c4728',
  laterano: '#786e3e',
  rim_billiton: '#6e3556',
  iberia: '#46602c',
  kazdel: '#662e74',
  siesta: '#26627c',
  kjerag: '#4c7ea0',
};

// Baseline Regional Elevation (World Units) before intra-region topographical sculpting
const ELEVATION_MAP: Record<CellType, number> = {
  kjerag: 14.5,
  foehn_hotlands: 10.5,
  ursus: 8.4,
  sami: 8.6,
  leithanien: 8.0,
  yan: 7.6,
  victoria: 7.2,
  kazimierz: 6.8,
  columbia: 7.0,
  bolivar: 5.8,
  siracusa: 6.8,
  minos: 6.6,
  laterano: 7.0,
  rim_billiton: 6.4,
  sargon: 6.8,
  iberia: 5.6,
  kazdel: 7.0,
  siesta: 5.6,
  higashi: 6.8,
  icefield: 9.8,
  frontier: 5.0,
  land: 4.4,
  shallow: 1.4,
  crater: 0.9,
  deep: 0.6,
  void: 0.4,
};

const MAP_CENTER_X = 410.5;
const MAP_CENTER_Y = 512.0;

// Smooth coherent multi-octave ridge function (deterministic, zero random spikes)
function coherentRidge(x: number, y: number): number {
  const n1 = Math.sin(x * 0.045 + y * 0.032) * Math.cos(x * 0.028 - y * 0.048);
  const n2 = Math.sin(x * 0.095 - y * 0.075 + 1.4) * 0.5;
  const n3 = Math.cos(x * 0.16 + y * 0.14 + 0.7) * 0.25;
  const ridge = 1.0 - Math.abs(Math.sin(x * 0.038 - y * 0.042 + n1 * 0.9));
  return (n1 * 0.45 + n2 * 0.3 + n3 * 0.15 + (ridge - 0.5) * 0.85);
}

// Precompute natural intra-region topographical height for every hex cell
const CELL_TERRAIN_HEIGHTS = new Float32Array(terraHexCells.length);
const CELL_INDEX_LOOKUP = new Map<string, number>();
terraHexCells.forEach((c, idx) => {
  CELL_INDEX_LOOKUP.set(`${c.row},${c.col}`, idx);
});

(() => {
  terraHexCells.forEach((cell, idx) => {
    const isWater =
      cell.type === 'deep' ||
      cell.type === 'shallow' ||
      cell.type === 'void' ||
      cell.type === 'crater';

    if (isWater) {
      CELL_TERRAIN_HEIGHTS[idx] = ELEVATION_MAP[cell.type] ?? 0.6;
      return;
    }

    // Count neighboring water cells and same-region cells to create natural coastal slopes & interior plateaus
    const nKeys = neighborKeys(cell.row, cell.col);
    let waterNeighbors = 0;
    let sameRegionNeighbors = 0;
    for (let i = 0; i < 6; i++) {
      const nc = cellIndex.get(nKeys[i]);
      if (!nc || nc.type === 'deep' || nc.type === 'shallow' || nc.type === 'void') {
        waterNeighbors++;
      }
      if (nc && nc.regionId === cell.regionId) {
        sameRegionNeighbors++;
      }
    }

    const base = ELEVATION_MAP[cell.type] ?? 4.8;
    const wave = coherentRidge(cell.x, cell.y);
    const interiorFactor = sameRegionNeighbors / 6; // 0 at tips, 1 deep inside region
    const coastalSlope = waterNeighbors > 0 ? Math.max(0.55, 1 - waterNeighbors * 0.12) : 1.0;

    // Distance to Mount Karlan (Kjerag sacred peak at 318, 510)
    const distKjerag = Math.hypot(cell.x - 318, cell.y - 510);
    // Distance to Foehn Hotlands volcanic core (225, 744)
    const distFoehn = Math.hypot(cell.x - 225, cell.y - 744);
    // Distance to Western Yan Sui mountain chain (595, 445)
    const distYanMountains = Math.hypot(cell.x - 595, cell.y - 445);
    // Distance to Central Ursus mountain range (455, 390)
    const distUrsusRidge = Math.hypot(cell.x - 455, cell.y - 390);

    let h = base;

    if (cell.type === 'kjerag') {
      // Towering alpine peak of Mount Karlan (peaking at ~16.8 with smooth tapering)
      const peakBoost = Math.max(0, 1 - distKjerag / 28) * 3.2;
      h = (13.8 + peakBoost + wave * 1.0);
    } else if (cell.type === 'foehn_hotlands') {
      // High volcanic plateau with crater wave
      const rimWave = Math.sin(distFoehn * 0.14) * 1.6;
      h = (base + interiorFactor * 1.8 + wave * 1.4 + rimWave) * coastalSlope;
    } else if (cell.type === 'icefield' || cell.type === 'sami') {
      // Northern glacial ridges
      const northBoost = Math.max(0, (410 - cell.y) * 0.022);
      h = (base + northBoost + interiorFactor * 1.6 + wave * 1.3) * coastalSlope;
    } else if (cell.type === 'ursus') {
      // Vast northern empire with central Ural-like mountain chain & lower border steppes
      const ridgeBoost = Math.max(0, 1 - distUrsusRidge / 85) * 2.4;
      h = (base - 0.4 + interiorFactor * 1.5 + ridgeBoost + wave * 1.2) * coastalSlope;
    } else if (cell.type === 'yan') {
      // Western mountains (Sui peaks) tapering to eastern plains
      const suiBoost = Math.max(0, 1 - distYanMountains / 75) * 2.2;
      const eastSlope = Math.max(-1.2, (620 - cell.x) * 0.022);
      h = (base - 0.3 + interiorFactor * 1.4 + suiBoost + eastSlope + wave * 1.1) * coastalSlope;
    } else if (cell.type === 'iberia' || cell.type === 'siesta' || cell.type === 'bolivar') {
      // Low coastal shelves gently rising inland
      h = (base - 0.3 + interiorFactor * 1.1 + wave * 0.8) * coastalSlope;
    } else if (cell.regionId) {
      // Other major nations: natural rolling relief
      const foothillKjerag = distKjerag < 52 ? (1 - distKjerag / 52) * 2.8 : 0;
      h = (base - 0.3 + interiorFactor * 1.3 + foothillKjerag + wave * 1.0) * coastalSlope;
    } else {
      // Neutral continental land & frontier: continuous mountain foothills and basins
      const foothillKjerag = distKjerag < 58 ? (1 - distKjerag / 58) * 4.2 : 0;
      const foothillFoehn = distFoehn < 95 ? (1 - distFoehn / 95) * 2.2 : 0;
      const northGlacier = cell.y < 340 ? (340 - cell.y) * 0.018 : 0;
      h = (base + foothillKjerag + foothillFoehn + northGlacier + wave * 0.9) * coastalSlope;
    }

    CELL_TERRAIN_HEIGHTS[idx] = Math.max(3.2, h);
  });
})();

function sampleTerrainHeightAtPixel(px: number, py: number): number {
  let bestDist = Infinity;
  let bestH = 6.0;
  for (let i = 0; i < terraHexCells.length; i++) {
    const c = terraHexCells[i];
    const d = Math.hypot(c.x - px, c.y - py);
    if (d < bestDist) {
      bestDist = d;
      bestH = CELL_TERRAIN_HEIGHTS[i];
    }
  }
  return bestH;
}

// Canonical Operational 3D Trajectory Routes linked with Accurate Hex Coordinates & Story Registry
type RouteCategory = 'main' | 'series' | 'expedition';

interface TacticalRouteArc {
  id: string;
  code: string;
  category: RouteCategory;
  shortLabel: string;
  fullLabel: string;
  fromPixel: { x: number; y: number };
  toPixel: { x: number; y: number };
  color: string;
  storyId: string;
  regionIds: string[];
  labelT?: number;
  arcHeightOffset?: number;
}

const TACTICAL_ROUTES: TacticalRouteArc[] = [
  // =========================================================================
  // 1. 메인 스토리 대서사 기동 (Main Theme Trajectories — 5개)
  // =========================================================================
  {
    id: 'route_act1_cher_lung',
    code: 'EP.00~03',
    category: 'main',
    shortLabel: '체르노보그 ➔ 용문',
    fullLabel: 'Act I: 체르노보그 박사 구출 및 이동도시 용문 합류 기동',
    fromPixel: { x: 534, y: 424 },
    toPixel: { x: 583, y: 450 },
    color: '#ffe600',
    storyId: 'ep00',
    regionIds: ['ursus', 'yan'],
    labelT: 0.42,
    arcHeightOffset: 4
  },
  {
    id: 'route_act1_lung_core',
    code: 'EP.06~08',
    category: 'main',
    shortLabel: '용문 ➔ 체르노보그 핵심부',
    fullLabel: 'Act I: 부분 괴사 ~ 울부짖는 광명 (핵심부 충돌 저지 결전)',
    fromPixel: { x: 583, y: 450 },
    toPixel: { x: 519, y: 415 },
    color: '#facc15',
    storyId: 'ep08',
    regionIds: ['yan', 'ursus'],
    labelT: 0.58,
    arcHeightOffset: 12
  },
  {
    id: 'route_act2_hillock',
    code: 'EP.09',
    category: 'main',
    shortLabel: '힐록 카운티 ➔ 런디니움',
    fullLabel: 'Act II 스톰워치: 더블린 봉기 및 힐록 카운티 사태 진상 규명',
    fromPixel: { x: 356, y: 537 },
    toPixel: { x: 386, y: 554 },
    color: '#fb923c',
    storyId: 'ep09',
    regionIds: ['victoria'],
    labelT: 0.46,
    arcHeightOffset: 2
  },
  {
    id: 'route_act2_victoria',
    code: 'EP.10~14',
    category: 'main',
    shortLabel: '카즈델 ➔ 런디니움',
    fullLabel: 'Act II: 살카즈 군사위원회 런디니움 점령 및 로도스 탈환 작전',
    fromPixel: { x: 543, y: 502 },
    toPixel: { x: 386, y: 554 },
    color: '#f59e0b',
    storyId: 'ep14',
    regionIds: ['kazdel', 'victoria'],
    labelT: 0.48,
    arcHeightOffset: 8
  },
  {
    id: 'route_act3_ep17',
    code: 'EP.16~17',
    category: 'main',
    shortLabel: '디에티 그라이퍼부르크 ➔ 북부 빙원',
    fullLabel: 'Act III: 비정상 스펙트럼 ~ 임계 상전이 (우르수스 북방 빙원 전선)',
    fromPixel: { x: 455, y: 398 },
    toPixel: { x: 419, y: 280 },
    color: '#c084fc',
    storyId: 'ep17',
    regionIds: ['ursus', 'infy_icefield', 'sami'],
    labelT: 0.5,
    arcHeightOffset: 6
  },

  // =========================================================================
  // 2. 국가·세력별 메이저 스토리 라인 기동 (Major Story Line Arcs — 9개)
  // =========================================================================
  {
    id: 'route_babel_excavation',
    code: 'RL-04',
    category: 'series',
    shortLabel: '림 빌리턴 ➔ 카즈델',
    fullLabel: '바벨(Babel): 림 빌리턴 본함 발굴 및 카즈델 귀환 대원정',
    fromPixel: { x: 548, y: 597 },
    toPixel: { x: 543, y: 502 },
    color: '#54c5d0',
    storyId: 'sid_babel',
    regionIds: ['rim_billiton', 'kazdel'],
    labelT: 0.52,
    arcHeightOffset: 4
  },
  {
    id: 'route_darknights',
    code: 'RL-01',
    category: 'series',
    shortLabel: '카즈델 ➔ 체르노보그',
    fullLabel: '흑야의 회고록: 바벨 붕괴 후 박사 석관 이송 및 W 소대 추적',
    fromPixel: { x: 543, y: 502 },
    toPixel: { x: 534, y: 424 },
    color: '#38bdf8',
    storyId: 'sid_darknights_memoir',
    regionIds: ['kazdel', 'ursus'],
    labelT: 0.5,
    arcHeightOffset: 2
  },
  {
    id: 'route_kazimierz_major',
    code: 'KA-01~03',
    category: 'series',
    shortLabel: '물방울 마을 ➔ 카발레리에키',
    fullLabel: '니어 라이트 연작: 카시미어 변경에서 대기사령 결전까지의 여정',
    fromPixel: { x: 376, y: 476 },
    toPixel: { x: 356, y: 450 },
    color: '#eab308',
    storyId: 'sid_near_light',
    regionIds: ['kazimierz'],
    labelT: 0.5,
    arcHeightOffset: 3
  },
  {
    id: 'route_sui_shangshu',
    code: 'SU-01~03',
    category: 'series',
    shortLabel: '용문 ➔ 상촉 · 백조',
    fullLabel: '쉐이(Sui) 연대기: 삼자매(니엔·더스크·링) 합류 및 사세대(司岁台) 및 염국 관원들과의 상촉·백조 행 (에인션트 포지 ~ 장진주)',
    fromPixel: { x: 583, y: 450 },
    toPixel: { x: 622, y: 493 },
    color: '#38bdf8',
    storyId: 'sid_invitation_to_wine',
    regionIds: ['yan'],
    labelT: 0.54,
    arcHeightOffset: 3
  },
  {
    id: 'route_sui_yumen',
    code: 'SU-04~06',
    category: 'series',
    shortLabel: '옥문 ➔ 백조 ➔ 대황성',
    fullLabel: "쉐이(Sui) 연대기: 옥문에서 쉐이 맏형 '총웨(종사)'와 함께 둘째 '왕'의 음모를 분쇄한 뒤, 천자의 황성 백조를 거쳐 동방의 곡창도시 대황성(회서리)에서 여섯째 '슈'와 함께 대재앙에 맞서는 대장정",
    fromPixel: { x: 602, y: 424 },
    toPixel: { x: 686, y: 441 },
    color: '#eab308',
    storyId: 'sid_vernal_winds',
    regionIds: ['yan'],
    labelT: 0.5,
    arcHeightOffset: 6
  },
  {
    id: 'route_rhine_pioneer',
    code: 'RH-01~02',
    category: 'series',
    shortLabel: '맨스필드 · 359호 기지 ➔ 트리마운츠',
    fullLabel: '맨스필드 브레이크 ~ 도로시의 비전: 359호 기지 실험 데이터 트리마운츠 집결',
    fromPixel: { x: 283, y: 458 },
    toPixel: { x: 243, y: 476 },
    color: '#10b981',
    storyId: 'sid_dorothys_vision',
    regionIds: ['columbia'],
    labelT: 0.48,
    arcHeightOffset: 4
  },
  {
    id: 'route_lonetrail',
    code: 'RH-03',
    category: 'series',
    shortLabel: '트리마운츠 ➔ 북부 궤도 (상공 투영)',
    fullLabel: '론 트레일: 트리마운츠 외곽 지하에서 이륙한 초점 발생기(아크 1호)와 에너지 우물을 가동하여 5,000m 상공에서 스텔라리아를 발사, 6,152m 대기 차단층을 돌파 (상공 투영 궤적)',
    fromPixel: { x: 243, y: 476 },
    toPixel: { x: 320, y: 138 },
    color: '#00d8ff',
    storyId: 'sid_lone_trail',
    regionIds: ['columbia', 'north_stargate', 'infy_icefield', 'sami'],
    labelT: 0.45,
    arcHeightOffset: 14
  },
  {
    id: 'route_iberia_coast',
    code: 'AE-02',
    category: 'series',
    shortLabel: '살비엔토 ➔ 그란파로',
    fullLabel: '언더 타이즈: 살비엔토 해안 어비설 헌터스 집결 및 등대 수색',
    fromPixel: { x: 415, y: 658 },
    toPixel: { x: 450, y: 667 },
    color: '#2dd4bf',
    storyId: 'sid_under_tides',
    regionIds: ['iberia'],
    labelT: 0.46,
    arcHeightOffset: 2
  },
  {
    id: 'route_abyss',
    code: 'AE-03~04',
    category: 'series',
    shortLabel: '그란파로 ➔ 에기르 밀리아리움',
    fullLabel: '스툴티페라 나비스 ~ 삶의 길: 이베리아 대등대 및 에기르 심해 원정',
    fromPixel: { x: 450, y: 667 },
    toPixel: { x: 586, y: 867 },
    color: '#0284c7',
    storyId: 'sid_stultifera_navis',
    regionIds: ['iberia', 'aegir'],
    labelT: 0.5,
    arcHeightOffset: 8
  },

  // =========================================================================
  // 3. 대륙 횡단 및 다국적 장거리 원정 (Continental Expeditions — 4개)
  // =========================================================================
  {
    id: 'route_leithanien_spire',
    code: 'LE-01~03',
    category: 'expedition',
    shortLabel: '월루몽드 ➔ 츠빌링슈튀르메',
    fullLabel: '고탑의 그림자: 월루몽드의 황혼 ~ 츠빌링슈튀르메의 가을',
    fromPixel: { x: 455, y: 519 },
    toPixel: { x: 425, y: 502 },
    color: '#a855f7',
    storyId: 'sid_zwillingsturme',
    regionIds: ['leithanien'],
    labelT: 0.5,
    arcHeightOffset: 3
  },
  {
    id: 'route_siracusa_return',
    code: 'SI-01',
    category: 'expedition',
    shortLabel: '용문 ➔ 시라쿠사 볼시니',
    fullLabel: "시라쿠사인: 구도시 볼시니로 귀환하여 패밀리 결전을 치르고 신생 자치 이동도시 '누오바 볼시니'를 세운 행적",
    fromPixel: { x: 583, y: 450 },
    toPixel: { x: 494, y: 519 },
    color: '#d97736',
    storyId: 'sid_il_siracusano',
    regionIds: ['yan', 'siracusa'],
    labelT: 0.54,
    arcHeightOffset: 6
  },
  {
    id: 'route_kjerag_silver',
    code: 'KJ-01~02',
    category: 'expedition',
    shortLabel: '런디니움 ➔ 쉐라그 투리쿰',
    fullLabel: '설산과 은철: 브레이크 디 아이스 ~ 은심호 열차 개통 작전',
    fromPixel: { x: 386, y: 554 },
    toPixel: { x: 317, y: 519 },
    color: '#68c0ea',
    storyId: 'sid_break_the_ice',
    regionIds: ['victoria', 'kjerag'],
    labelT: 0.52,
    arcHeightOffset: 5
  },
  {
    id: 'route_summer_siesta',
    code: 'ST-01~04',
    category: 'expedition',
    shortLabel: '시에스타 (신 시에스타) ➔ 아카후알라',
    fullLabel: '여름의 리듬: 파란 불꽃의 마음 ~ 가비알 리턴즈 & 아카후알라 두린 지하도시 쎄루에르차 원정',
    fromPixel: { x: 334, y: 593 },
    toPixel: { x: 258, y: 649 },
    color: '#06b6d4',
    storyId: 'sid_heart_of_surging_flame',
    regionIds: ['siesta', 'sargon'],
    labelT: 0.5,
    arcHeightOffset: 5
  }
];

// Precompute outer perimeter segments in 3D map coordinates hugging each cell's natural terrain height
interface PerimeterSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  baseY: number;
}

const REGION_PERIMETER_SEGMENTS = new Map<string, PerimeterSegment[]>();
(() => {
  const r = HEX_RADIUS * 1.01;
  terraHexCells.forEach((cell, idx) => {
    if (!cell.regionId) return;
    if (!REGION_PERIMETER_SEGMENTS.has(cell.regionId)) {
      REGION_PERIMETER_SEGMENTS.set(cell.regionId, []);
    }
    const nKeys = neighborKeys(cell.row, cell.col);
    const cx = cell.x - MAP_CENTER_X;
    const cz = cell.y - MAP_CENTER_Y;
    const baseY = CELL_TERRAIN_HEIGHTS[idx];

    for (let i = 0; i < 6; i++) {
      const nc = cellIndex.get(nKeys[i]);
      if (!nc || nc.regionId !== cell.regionId) {
        const rad1 = ((60 * i - 30) * Math.PI) / 180;
        const rad2 = ((60 * ((i + 1) % 6) - 30) * Math.PI) / 180;
        REGION_PERIMETER_SEGMENTS.get(cell.regionId)!.push({
          x1: cx + r * Math.cos(rad1),
          z1: cz + r * Math.sin(rad1),
          x2: cx + r * Math.cos(rad2),
          z2: cz + r * Math.sin(rad2),
          baseY
        });
      }
    }
  });
})();

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
  isHeaderCollapsed,
  onToggleHeaderCollapse,
}) => {
  const [pinnedRegionId, setPinnedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [splashStory, setSplashStory] = useState<StoryListItem | null>(null);
  const [showElevation, setShowElevation] = useState<boolean>(true);
  const [showLogos, setShowLogos] = useState<boolean>(true);
  const [showCities, setShowCities] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [routeFilter, setRouteFilter] = useState<'all' | RouteCategory>('all');
  const [isSectorListOpen, setIsSectorListOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [sectorSearch, setSectorSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isTouchOrMobile, setIsTouchOrMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  });
  const [mobilePreviewCard, setMobilePreviewCard] = useState<MobilePreviewCardData | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetTouchStartY = useRef<number | null>(null);

  useEffect(() => {
    const checkTouchOrMobile = () => {
      setIsTouchOrMobile(
        window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
      );
    };
    window.addEventListener('resize', checkTouchOrMobile);
    return () => window.removeEventListener('resize', checkTouchOrMobile);
  }, []);

  // Ensure Three.js and DOM overlays immediately adapt when Fullscreen/Header Collapse changes
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => window.clearTimeout(t);
  }, [isHeaderCollapsed]);

  // Open StorySplashModal Popup for a given storyId
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

  // Keyboard navigation & modal state refs for 60/120fps render loop
  const keysDownRef = useRef<Set<string>>(new Set());
  const legendOpenRef = useRef<boolean>(false);
  const splashStoryRef = useRef<StoryListItem | null>(null);

  // Telemetry DOM Direct Refs (Zero React Re-render at 144Hz)
  const telemetryCoordRef = useRef<HTMLSpanElement>(null);
  const telemetryAngleRef = useRef<HTMLSpanElement>(null);
  const telemetryZoomRef = useRef<HTMLSpanElement>(null);
  const telemetrySectorRef = useRef<HTMLSpanElement>(null);
  const telemetryYawSliderRef = useRef<HTMLInputElement>(null);
  const telemetryYawTextRef = useRef<HTMLSpanElement>(null);

  // Camera State Ref (Spherical Orbit around Target)
  const camStateRef = useRef({
    targetX: 0,
    targetZ: -20,
    currentX: 0,
    currentZ: -20,
    targetRadius: 550,
    currentRadius: 550,
    targetPolar: (52 * Math.PI) / 180, // 52 deg default 3D perspective
    currentPolar: (52 * Math.PI) / 180,
    targetAzimuth: 0,
    currentAzimuth: 0,
  });

  // Sync state to refs for WebGL loop access
  const hoveredRegionRef = useRef<string | null>(null);
  const hoveredPinRegionRef = useRef<string | null>(null);
  const pinnedRegionRef = useRef<string | null>(null);
  const showElevationRef = useRef<boolean>(showElevation);
  const showCitiesRef = useRef<boolean>(showCities);
  const showRoutesRef = useRef<boolean>(showRoutes);
  const routeFilterRef = useRef<'all' | RouteCategory>(routeFilter);
  const viewModeRef = useRef<'3d' | '2d'>(viewMode);

  const handleSetAzimuthDegrees = (degrees: number) => {
    if (viewModeRef.current === '2d') return; // 2D 모드에서는 각도 조절 제한
    camStateRef.current.targetAzimuth = (degrees * Math.PI) / 180;
  };

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

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const regionLookup = useMemo(() => {
    const map = new Map<string, TerraRegion>();
    terraRegions.forEach((r) => map.set(r.id, r));
    return map;
  }, []);

  // Clicked/selected region opens the right-hand Dossier drawer
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

  // Fly 3D Camera smoothly to a specific Region or City
  const flyToPixelCoords = useCallback((px: number, py: number, zoomRadius = 340, pitchDeg = 46) => {
    const cam = camStateRef.current;
    cam.targetX = px - MAP_CENTER_X;
    cam.targetZ = py - MAP_CENTER_Y;
    cam.targetRadius = zoomRadius;
    cam.targetPolar = viewModeRef.current === '2d' ? 0.001 : (pitchDeg * Math.PI) / 180;
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
          340,
          viewMode === '2d' ? 0 : 46
        );
        if (telemetrySectorRef.current) {
          telemetrySectorRef.current.textContent = `${reg.nameKo} (${reg.nameEn.toUpperCase()})`;
        }
      }
    },
    [regionLookup, flyToPixelCoords, viewMode]
  );

  const handleToggleViewMode = (mode: '3d' | '2d') => {
    playTabSwitchSound();
    setViewMode(mode);
    const cam = camStateRef.current;
    if (mode === '3d') {
      cam.targetPolar = (52 * Math.PI) / 180;
      cam.targetRadius = Math.min(560, cam.targetRadius);
    } else {
      cam.targetPolar = 0.001;
      cam.targetAzimuth = 0;
      cam.targetRadius = 620;
    }
  };

  const handleResetCamera = () => {
    playClickSound();
    setPinnedRegionId(null);
    setHoveredRegionId(null);
    setSelectedCityId(null);
    const cam = camStateRef.current;
    cam.targetX = 0;
    cam.targetZ = -20;
    cam.targetAzimuth = 0;
    if (viewMode === '2d') {
      cam.targetRadius = 620;
      cam.targetPolar = 0.001;
    } else {
      cam.targetRadius = 550;
      cam.targetPolar = (52 * Math.PI) / 180;
    }
  };

  const handleZoom = (delta: number) => {
    playClickSound();
    const cam = camStateRef.current;
    cam.targetRadius = Math.max(180, Math.min(920, cam.targetRadius + delta));
  };

  const handleRotateYaw = (deltaRad: number) => {
    if (viewModeRef.current === '2d') return; // 2D 모드에서는 회전 제한
    playClickSound();
    camStateRef.current.targetAzimuth += deltaRad;
  };

  // =========================================================================
  // THREE.JS WEBGL 3D TACTICAL ENGINE INITIALIZATION & RENDER LOOP
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 800;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#06090f');

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 5, 2600);

    // 3. High-Spec WebGLRenderer (PCFSoftShadowMap + ACESFilmicToneMapping)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Balanced Glare-Free Studio & Tactical Lighting
    // High-altitude neutral key light casts soft topographic shadows without harsh angled glare
    const hemiLight = new THREE.HemisphereLight(0xdceeff, 0x0f172a, 1.45);
    hemiLight.position.set(0, 500, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xf8fafc, 1.38);
    keyLight.position.set(145, 520, 185);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 120;
    keyLight.shadow.camera.far = 1150;
    const shadowBounds = 430;
    keyLight.shadow.camera.left = -shadowBounds;
    keyLight.shadow.camera.right = shadowBounds;
    keyLight.shadow.camera.top = shadowBounds;
    keyLight.shadow.camera.bottom = -shadowBounds;
    keyLight.shadow.bias = -0.00045;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.42);
    rimLight.position.set(-280, 260, -240);
    scene.add(rimLight);

    // 5. Sub-Continental Tactical Hologram Base Grid & Polar Rings
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    const seaFloorGeo = new THREE.CircleGeometry(525, 64);
    seaFloorGeo.rotateX(-Math.PI / 2);
    const seaFloorMat = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.9,
      metalness: 0.1,
    });
    const seaFloor = new THREE.Mesh(seaFloorGeo, seaFloorMat);
    seaFloor.position.y = -0.2;
    seaFloor.receiveShadow = true;
    baseGroup.add(seaFloor);

    const polarGrid = new THREE.PolarGridHelper(520, 16, 8, 96, 0x1b283c, 0x111a28);
    polarGrid.position.set(0, -0.1, 0);
    baseGroup.add(polarGrid);

    const ringGeo = new THREE.RingGeometry(465, 467.5, 128);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(ringGeo, ringMat);
    outerRing.position.y = 0.05;
    baseGroup.add(outerRing);

    const sweepGeo = new THREE.CircleGeometry(464, 48, 0, Math.PI / 5);
    sweepGeo.rotateX(-Math.PI / 2);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x00d8ff,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const radarSweep = new THREE.Mesh(sweepGeo, sweepMat);
    radarSweep.position.y = 0.1;
    baseGroup.add(radarSweep);

    // 6. High-Detail 2-Tier Beveled Hexagonal Prism Geometry + PBR Material
    const hexCount = terraHexCells.length;
    const colBody = new THREE.CylinderGeometry(HEX_RADIUS * 0.94, HEX_RADIUS * 0.96, 0.9, 6, 1, false);
    colBody.translate(0, 0.45, 0);
    const colBevel = new THREE.CylinderGeometry(HEX_RADIUS * 0.84, HEX_RADIUS * 0.94, 0.1, 6, 1, false);
    colBevel.translate(0, 0.95, 0);
    const mergedHex = mergeGeometries([colBody.toNonIndexed(), colBevel.toNonIndexed()], false);
    const hexGeo = mergedHex || colBody.toNonIndexed();
    hexGeo.computeVertexNormals();

    const posAttr = hexGeo.attributes.position;
    const normAttr = hexGeo.attributes.normal;
    const vColors = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {
      const ny = normAttr.getY(i);
      const py = posAttr.getY(i);
      if (ny > 0.85) {
        // Flat top plateau: crisp, clean tactical surface
        const r = Math.hypot(posAttr.getX(i), posAttr.getZ(i));
        const edgeInset = r > HEX_RADIUS * 0.75 ? 0.96 : 1.02;
        vColors[i * 3 + 0] = edgeInset;
        vColors[i * 3 + 1] = edgeInset;
        vColors[i * 3 + 2] = edgeInset;
      } else if (ny > 0.15) {
        // 45-degree chamfered top bevel rim: subtle machined highlight frame
        const nx = normAttr.getX(i);
        const nz = normAttr.getZ(i);
        const rimCatch = 1.04 + (nx * 0.08 + nz * 0.08);
        vColors[i * 3 + 0] = rimCatch;
        vColors[i * 3 + 1] = rimCatch;
        vColors[i * 3 + 2] = rimCatch * 1.03;
      } else if (ny < -0.5) {
        // Bottom cap
        vColors[i * 3 + 0] = 0.18;
        vColors[i * 3 + 1] = 0.2;
        vColors[i * 3 + 2] = 0.24;
      } else {
        // Vertical 6 side walls: rich ambient occlusion gradient from top rim down to valley floor
        const nx = normAttr.getX(i);
        const nz = normAttr.getZ(i);
        const sideDirectional = 0.9 + (nx * 0.08 + nz * 0.1);
        const verticalAO = py > 0.45 ? 0.76 : 0.34;
        const shade = verticalAO * sideDirectional;
        vColors[i * 3 + 0] = shade * 0.94;
        vColors[i * 3 + 1] = shade * 0.97;
        vColors[i * 3 + 2] = shade * 1.05;
      }
    }
    hexGeo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));

    const hexMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.62,
      metalness: 0.16,
    });

    const instancedHex = new THREE.InstancedMesh(hexGeo, hexMat, hexCount);
    instancedHex.castShadow = true;
    instancedHex.receiveShadow = true;
    instancedHex.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedHex);

    // Per-cell dynamic animation state & Hypsometric Biome Color Sculpting
    const cellCurrentHeights = new Float32Array(hexCount);
    const cellBaseColors = new Array<THREE.Color>(hexCount);
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();
    const goldColor = new THREE.Color('#ffe600');
    const cyanColor = new THREE.Color('#00d8ff');
    const snowColor = new THREE.Color('#e2e8f0');
    const alpineRockColor = new THREE.Color('#64748b');
    const volcanicGlowColor = new THREE.Color('#9a3412');

    terraHexCells.forEach((cell: HexCell, idx: number) => {
      const baseH = CELL_TERRAIN_HEIGHTS[idx];
      cellCurrentHeights[idx] = baseH;

      const c = new THREE.Color(CELL_COLORS[cell.type] || '#283344');

      // Blend nation territory cells subtly with their signature faction hue (refined, never toy-like)
      if (cell.regionId) {
        const reg = regionLookup.get(cell.regionId);
        if (reg?.badgeColor) {
          const badgeCol = new THREE.Color(reg.badgeColor);
          c.lerp(badgeCol, 0.25);
        }
      }

      // Hypsometric Terrain & Biome Tint Modulation
      if (cell.type === 'kjerag') {
        // Kjerag: sacred alpine snow peak (Mount Karlan)
        const snowBlend = Math.min(0.82, Math.max(0.18, (baseH - 12.2) / 4.5));
        c.lerp(snowColor, snowBlend);
      } else if (cell.type === 'icefield' || cell.type === 'sami') {
        // Northern snowfields & Sami frost ridges
        const frostBlend = Math.min(0.65, Math.max(0.08, (baseH - 8.0) / 3.8));
        c.lerp(snowColor, frostBlend);
      } else if (cell.type === 'foehn_hotlands') {
        // Foehn Hotlands: scorched volcanic plateau & ember ridges
        const lavaBlend = Math.min(0.45, Math.max(0, (baseH - 9.2) / 3.8));
        c.lerp(volcanicGlowColor, lavaBlend);
      } else if (baseH > 8.8) {
        // High mountain ridges in Ursus, Yan, Leithanien, neutral ranges: rocky alpine crest + frost cap
        const rockBlend = Math.min(0.42, (baseH - 8.8) / 3.2);
        c.lerp(alpineRockColor, rockBlend);
        if (baseH > 10.8) {
          c.lerp(snowColor, Math.min(0.45, (baseH - 10.8) / 2.8));
        }
      } else if (baseH > 4.0) {
        // Gentle elevation luminance contour for mid-land hills & basins
        c.offsetHSL(0, 0.01, (baseH - 6.8) * 0.01);
      }

      cellBaseColors[idx] = c;

      const wx = cell.x - MAP_CENTER_X;
      const wz = cell.y - MAP_CENTER_Y;
      dummy.position.set(wx, 0, wz);
      dummy.scale.set(1, baseH, 1);
      dummy.updateMatrix();
      instancedHex.setMatrixAt(idx, dummy.matrix);
      instancedHex.setColorAt(idx, c);
    });
    instancedHex.instanceMatrix.needsUpdate = true;
    if (instancedHex.instanceColor) instancedHex.instanceColor.needsUpdate = true;

    // 7. 3D Nation Perimeter Wireframes hugging natural terrain contours
    const borderGroup = new THREE.Group();
    scene.add(borderGroup);
    const regionBorderMeshes = new Map<
      string,
      {
        line: THREE.LineSegments;
        mat: THREE.LineBasicMaterial;
        segments: PerimeterSegment[];
        defaultColor: THREE.Color;
      }
    >();

    REGION_PERIMETER_SEGMENTS.forEach((segments, regionId) => {
      const positions = new Float32Array(segments.length * 6);
      segments.forEach((seg, i) => {
        positions[i * 6 + 0] = seg.x1;
        positions[i * 6 + 1] = seg.baseY + 0.35;
        positions[i * 6 + 2] = seg.z1;
        positions[i * 6 + 3] = seg.x2;
        positions[i * 6 + 4] = seg.baseY + 0.35;
        positions[i * 6 + 5] = seg.z2;
      });
      const bGeo = new THREE.BufferGeometry();
      bGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const reg = regionLookup.get(regionId);
      const defCol = new THREE.Color(reg?.badgeColor || '#7084a4').lerp(new THREE.Color('#cbd5e1'), 0.38);

      const bMat = new THREE.LineBasicMaterial({
        color: defCol.clone(),
        transparent: true,
        opacity: 0.62,
      });
      const lineSegs = new THREE.LineSegments(bGeo, bMat);
      borderGroup.add(lineSegs);
      regionBorderMeshes.set(regionId, {
        line: lineSegs,
        mat: bMat,
        segments,
        defaultColor: defCol,
      });
    });

    // 8. 3D City Beacons (Vertical Laser Beams + Floating Octahedrons anchored to exact terrain height)
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);
    const cityCrystals: THREE.Mesh[] = [];

    const crystalGeo = new THREE.OctahedronGeometry(2.2, 0);
    terraCities.forEach((city) => {
      const wx = city.pixelCoords.x - MAP_CENTER_X;
      const wz = city.pixelCoords.y - MAP_CENTER_Y;
      const baseElev = sampleTerrainHeightAtPixel(city.pixelCoords.x, city.pixelCoords.y);

      const isRhodes = city.type === 'rhodes';
      const isCapital = city.type === 'capital';
      const beaconColor = isRhodes ? 0x00d8ff : isCapital ? 0xffe600 : 0x94a3b8;

      const beamPts = [
        new THREE.Vector3(wx, baseElev, wz),
        new THREE.Vector3(wx, baseElev + (isCapital || isRhodes ? 19 : 12), wz),
      ];
      const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPts);
      const beamMat = new THREE.LineBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: isCapital || isRhodes ? 0.72 : 0.42,
      });
      cityGroup.add(new THREE.Line(beamGeo, beamMat));

      const cMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        wireframe: !isRhodes && !isCapital,
      });
      const crystal = new THREE.Mesh(crystalGeo, cMat);
      crystal.position.set(wx, baseElev + (isCapital || isRhodes ? 20.5 : 13.5), wz);
      if (!isCapital && !isRhodes) crystal.scale.setScalar(0.68);
      cityGroup.add(crystal);
      cityCrystals.push(crystal);
    });

    // 9. 3D Parabolic Operational Route Arcs (QuadraticBezierCurve3 anchored to terrain height)
    const routesGroup = new THREE.Group();
    scene.add(routesGroup);
    interface RouteArcEntry {
      route: TacticalRouteArc;
      lineMat: THREE.LineBasicMaterial;
      pulseMesh: THREE.Mesh;
      pulseMat: THREE.MeshBasicMaterial;
      curve: THREE.QuadraticBezierCurve3;
      peakY: number;
      progress: number;
      speed: number;
    }
    const routeEntries: RouteArcEntry[] = [];
    const pulseGeo = new THREE.SphereGeometry(1.8, 10, 10);

    TACTICAL_ROUTES.forEach((rt, rIdx) => {
      const x1 = rt.fromPixel.x - MAP_CENTER_X;
      const z1 = rt.fromPixel.y - MAP_CENTER_Y;
      const x2 = rt.toPixel.x - MAP_CENTER_X;
      const z2 = rt.toPixel.y - MAP_CENTER_Y;
      const y1 = sampleTerrainHeightAtPixel(rt.fromPixel.x, rt.fromPixel.y) + 2.0;
      const y2 = sampleTerrainHeightAtPixel(rt.toPixel.x, rt.toPixel.y) + 2.0;
      const dist = Math.hypot(x2 - x1, z2 - z1);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const peakY = Math.max(y1, y2) + Math.min(46, Math.max(16, dist * 0.22)) + (rt.arcHeightOffset || 0);

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3(midX, peakY, midZ),
        new THREE.Vector3(x2, y2, z2)
      );

      const points = curve.getPoints(44);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(rt.color),
        transparent: true,
        opacity: 0.72,
      });
      routesGroup.add(new THREE.Line(arcGeo, lineMat));

      const pulseMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(rt.color),
        transparent: true,
        opacity: 0.95,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      routesGroup.add(pulseMesh);
      routeEntries.push({
        route: rt,
        lineMat,
        pulseMesh,
        pulseMat,
        curve,
        peakY,
        progress: (rIdx * 0.17) % 1,
        speed: 0.0032 + (rIdx % 3) * 0.0007,
      });
    });

    // 10. Pointer & Multi-Touch Interaction (Orbit, Pan, Pinch-Zoom & Raycast Hex Selection)
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let isPointerDown = false;
    let pointerButton = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragDistance = 0;

    // Multi-touch tracking for smooth 2-finger pinch zoom, 360° twist rotation, and drag orbit
    const activeTouchPoints = new Map<number, { x: number; y: number }>();
    let lastPinchDist = 0;
    let lastPinchAngle = 0;
    let lastMidX = 0;
    let lastMidY = 0;
    let wasMultiTouchSession = false;

    const updateHoveredRegion = (nextRegId: string | null) => {
      if (nextRegId !== hoveredRegionRef.current) {
        hoveredRegionRef.current = nextRegId;
        setHoveredRegionId(nextRegId);
        if (telemetrySectorRef.current) {
          const activeId = nextRegId || pinnedRegionRef.current;
          const rObj = activeId ? regionLookup.get(activeId) : null;
          telemetrySectorRef.current.textContent = rObj
            ? `${rObj.nameKo} (${rObj.nameEn.toUpperCase()})`
            : '중립 지역';
        }
      }
    };

    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

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
        // Double-tap / double-click: one-handed quick zoom in
        lastTapTime = 0;
        playClickSound();
        const cam = camStateRef.current;
        cam.targetRadius = Math.max(180, cam.targetRadius - 130);
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

      // Two-finger smooth pinch zoom & 360° twist rotation / drag orbit
      if (e.pointerType === 'touch' && activeTouchPoints.has(e.pointerId)) {
        activeTouchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activeTouchPoints.size >= 2) {
          const pts = Array.from(activeTouchPoints.values());
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const currentAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          const cam = camStateRef.current;

          if (lastPinchDist > 0) {
            // 1. Pinch zoom
            const deltaDist = dist - lastPinchDist;
            cam.targetRadius = Math.max(180, Math.min(920, cam.targetRadius - deltaDist * 1.45));

            if (viewModeRef.current !== '2d') {
              // 3D 모드에서만 비틀기 및 회전/기울기 허용
              // 2. Twist rotation (fingers rotating around each other)
              let deltaAngle = currentAngle - lastPinchAngle;
              while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
              while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
              if (Math.abs(deltaAngle) > 0.01) {
                cam.targetAzimuth -= deltaAngle * 1.35;
              }

              // 3. Two-finger horizontal translation rotation
              const deltaMidX = midX - lastMidX;
              if (Math.abs(deltaMidX) > 1.0) {
                cam.targetAzimuth -= deltaMidX * 0.0055;
              }

              // 4. Two-finger vertical pitch adjustment
              const deltaMidY = midY - lastMidY;
              if (Math.abs(deltaMidY) > 1.0) {
                cam.targetPolar = Math.max(
                  (10 * Math.PI) / 180,
                  Math.min((72 * Math.PI) / 180, cam.targetPolar - deltaMidY * 0.0035)
                );
              }
            } else {
              // 2D 모드: 각도 조절 절대 제한 (정북 0° 및 수직 직하 0° 엄격 고정)
              cam.targetPolar = 0.001;
              cam.targetAzimuth = 0;

              // 두 손가락 이동 시 회전 대신 자연스러운 평면 이동(Pan) 지원
              const deltaMidX = midX - lastMidX;
              const deltaMidY = midY - lastMidY;
              const panScale = cam.currentRadius * 0.0014;
              cam.targetX = Math.max(-380, Math.min(380, cam.targetX - deltaMidX * panScale));
              cam.targetZ = Math.max(-440, Math.min(440, cam.targetZ - deltaMidY * panScale));
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

        if (isOrbitAction) {
          if (viewModeRef.current !== '2d') {
            cam.targetAzimuth -= dx * 0.0055;
            cam.targetPolar = Math.max(
              (10 * Math.PI) / 180,
              Math.min((72 * Math.PI) / 180, cam.targetPolar - dy * 0.0045)
            );
          } else {
            cam.targetPolar = 0.001;
            cam.targetAzimuth = 0;
            const panScale = cam.currentRadius * 0.0014;
            const cosA = Math.cos(cam.currentAzimuth);
            const sinA = Math.sin(cam.currentAzimuth);
            cam.targetX = Math.max(-380, Math.min(380, cam.targetX + (-dx * cosA - dy * sinA) * panScale));
            cam.targetZ = Math.max(-440, Math.min(440, cam.targetZ + (dx * sinA - dy * cosA) * panScale));
          }
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
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      pointerNdc.x = (relX / rect.width) * 2 - 1;
      pointerNdc.y = -(relY / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);

      const hits = raycaster.intersectObject(instancedHex, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const hitIdx = hits[0].instanceId;
        const hitCell = terraHexCells[hitIdx];
        const hitRegId = hitCell?.regionId || null;
        if (telemetryCoordRef.current && hitCell) {
          const hVal = Math.round(CELL_TERRAIN_HEIGHTS[hitIdx] * 120);
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
          return;
        }
        if (activeTouchPoints.size === 0 && wasMultiTouchSession) {
          wasMultiTouchSession = false;
          lastPinchDist = 0;
          lastPinchAngle = 0;
          lastMidX = 0;
          lastMidY = 0;
          isPointerDown = false;
          return;
        }
      }

      if (!isPointerDown) return;
      const wasDragging = dragDistance >= 6;
      const btn = pointerButton;
      isPointerDown = false;
      container.style.cursor = hoveredRegionRef.current ? 'pointer' : 'grab';

      if (splashStoryRef.current !== null || legendOpenRef.current) {
        return;
      }

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
        const hits = raycaster.intersectObject(instancedHex, false);
        if (hits.length > 0 && hits[0].instanceId !== undefined) {
          const hitCell = terraHexCells[hits[0].instanceId];
          if (hitCell?.regionId) {
            handleSelectRegion(hitCell.regionId);
          } else {
            setPinnedRegionId(null);
            setMobilePreviewCard(null);
          }
        } else {
          setPinnedRegionId(null);
          setMobilePreviewCard(null);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (legendOpenRef.current) {
          playCloseSound();
          setIsLegendOpen(false);
          return;
        }
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
        if (code.startsWith('Arrow')) {
          e.preventDefault();
        }
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
      lastPinchDist = 0;
      lastPinchAngle = 0;
      lastMidX = 0;
      lastMidY = 0;
      container.style.cursor = 'grab';
      keysDownRef.current.clear();
    };

    const handleWheel = (e: WheelEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('[data-hud-panel="true"]')) return;
      e.preventDefault();
      const cam = camStateRef.current;
      cam.targetRadius = Math.max(180, Math.min(920, cam.targetRadius + e.deltaY * 0.42));
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

    // 11. Real-Time 3D Animation & HUD Projection Loop
    let animFrameId = 0;
    const projVec = new THREE.Vector3();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const cam = camStateRef.current;

      // Real-Time Keyboard Continuous Camera Pan (WASD & Arrow Keys with Shift Boost)
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
          const normForward = (forward / len) * basePanSpeed;
          const normStrafe = (strafe / len) * basePanSpeed;

          const moveX = -sinA * normForward + cosA * normStrafe;
          const moveZ = -cosA * normForward - sinA * normStrafe;

          cam.targetX = Math.max(-380, Math.min(380, cam.targetX + moveX));
          cam.targetZ = Math.max(-440, Math.min(440, cam.targetZ + moveZ));
        }
      }

      if (viewModeRef.current === '2d') {
        cam.targetPolar = 0.001;
        cam.targetAzimuth = 0;
      }

      const damp = 0.12;
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

      const rawYawDeg = Math.round((cam.currentAzimuth * 180) / Math.PI);
      const normalizedYaw = ((rawYawDeg % 360) + 360) % 360;

      if (telemetryAngleRef.current) {
        const pitchDeg = Math.round((cam.currentPolar * 180) / Math.PI);
        telemetryAngleRef.current.textContent = `${pitchDeg}° / ${normalizedYaw}°`;
      }
      if (telemetryZoomRef.current) {
        const zoomPct = Math.round((550 / cam.currentRadius) * 100);
        telemetryZoomRef.current.textContent = `${zoomPct}%`;
      }
      if (telemetryYawSliderRef.current && document.activeElement !== telemetryYawSliderRef.current) {
        telemetryYawSliderRef.current.value = String(normalizedYaw);
      }
      if (telemetryYawTextRef.current) {
        telemetryYawTextRef.current.textContent = `${normalizedYaw}°`;
      }

      const is2D = viewModeRef.current === '2d';
      if (is2D) {
        cam.targetPolar = 0.001;
      }

      radarSweep.rotation.y -= 0.008;
      cityCrystals.forEach((cr) => {
        cr.rotation.y += 0.025;
      });
      cityGroup.visible = !is2D && (showCitiesRef.current ?? true);

      const pinnedId = pinnedRegionRef.current;

      // Update Operational Trajectory Arcs (Context-aware filtering when a region is pinned or category filter active)
      routesGroup.visible = showRoutesRef.current;
      routesGroup.scale.set(1, is2D ? 0.02 : 1.0, 1);
      routesGroup.position.y = is2D ? 0.7 : 0;
      const activeRouteFilter = routeFilterRef.current;
      if (showRoutesRef.current) {
        routeEntries.forEach((re) => {
          const matchesCategory = activeRouteFilter === 'all' || re.route.category === activeRouteFilter;
          const isRelevant = matchesCategory && (!pinnedId || re.route.regionIds.includes(pinnedId));
          re.lineMat.opacity = !matchesCategory ? 0 : isRelevant ? (pinnedId ? 0.92 : 0.72) : 0.1;
          re.pulseMat.opacity = !matchesCategory ? 0 : isRelevant ? 0.95 : 0.12;
          re.pulseMesh.visible = matchesCategory;
          if (matchesCategory) {
            re.progress = (re.progress + re.speed) % 1;
            re.curve.getPointAt(re.progress, re.pulseMesh.position);
          }
        });
      }

      // Smoothly Animate 3D Hex Extrusion (2D 모드 시 고저차를 100% 제거하여 0.6 완전 평면화)
      const effectiveShowElevation = !is2D && showElevationRef.current;
      const elevScale = effectiveShowElevation ? 1.0 : 0.0;
      let matrixDirty = false;
      let colorDirty = false;

      for (let i = 0; i < hexCount; i++) {
        const cell = terraHexCells[i];
        const isCellPinned = Boolean(pinnedId && cell.regionId === pinnedId);
        const isCellHovered = Boolean(hoveredRegionRef.current && cell.regionId === hoveredRegionRef.current);
        const isCellActive = isCellPinned || isCellHovered;

        const baseH = effectiveShowElevation ? CELL_TERRAIN_HEIGHTS[i] : 0.6;
        const uniformLift = is2D ? 0 : (isCellPinned ? 6.5 : isCellHovered ? 4.2 : 0);
        const targetH = baseH + uniformLift;
        const diff = targetH - cellCurrentHeights[i];

        if (Math.abs(diff) > 0.02) {
          cellCurrentHeights[i] += diff * 0.22;
          dummy.position.set(cell.x - MAP_CENTER_X, 0, cell.y - MAP_CENTER_Y);
          dummy.scale.set(1, cellCurrentHeights[i], 1);
          dummy.updateMatrix();
          instancedHex.setMatrixAt(i, dummy.matrix);
          matrixDirty = true;
        }

        if (isCellActive) {
          tempColor.copy(cellBaseColors[i]).lerp(isCellPinned ? goldColor : cyanColor, 0.38);
          instancedHex.setColorAt(i, tempColor);
          colorDirty = true;
        } else {
          instancedHex.setColorAt(i, cellBaseColors[i]);
          colorDirty = true;
        }
      }

      if (matrixDirty) instancedHex.instanceMatrix.needsUpdate = true;
      if (colorDirty && instancedHex.instanceColor) instancedHex.instanceColor.needsUpdate = true;

      // Update 3D Nation Perimeter Wireframes (2D 모드에서는 균일한 0.65 평면 위치 유지)
      regionBorderMeshes.forEach((bObj, regId) => {
        const isPin = regId === pinnedId;
        const isHov = regId === hoveredRegionRef.current;
        const lift = is2D ? 0 : (isPin ? 6.5 : isHov ? 4.2 : 0);
        bObj.line.scale.set(1, elevScale, 1);
        bObj.line.position.y = is2D ? 0.65 : (effectiveShowElevation ? lift : 0.65 + lift);
        if (isPin) {
          bObj.mat.color.setHex(0xffe600);
          bObj.mat.opacity = 1.0;
        } else if (isHov) {
          bObj.mat.color.setHex(0x00d8ff);
          bObj.mat.opacity = 0.95;
        } else {
          bObj.mat.color.copy(bObj.defaultColor);
          bObj.mat.opacity = 0.62;
        }
      });

      renderer.render(scene, camera);

      // Project 3D Coordinates to Screen-Space DOM Overlays
      // Adaptive zoom scale: gracefully scales down at distance, expands cleanly up close
      const zoomScale = THREE.MathUtils.clamp(520 / cam.currentRadius, 0.74, 1.25);
      const cWidth = container.clientWidth;
      const cHeight = container.clientHeight;
      const halfW = cWidth / 2;
      const halfH = cHeight / 2;

      terraRegions.forEach((reg) => {
        const pinEl = regionPinRefs.current.get(reg.id);
        if (!pinEl) return;
        const wx = reg.emblemPixelCoords.x - MAP_CENTER_X;
        const wz = reg.emblemPixelCoords.y - MAP_CENTER_Y;
        const localTerrainH = is2D ? 0 : sampleTerrainHeightAtPixel(reg.emblemPixelCoords.x, reg.emblemPixelCoords.y);
        const isPin = reg.id === pinnedId;
        const isHov = reg.id === hoveredRegionRef.current;
        const lift = is2D ? 0 : (isPin ? 6.5 : isHov ? 4.2 : 0);
        const wy = is2D ? 1.8 : (localTerrainH * elevScale + lift + 9.5);

        projVec.set(wx, wy, wz).project(camera);
        if (projVec.z > 1) {
          pinEl.style.opacity = '0';
          pinEl.style.pointerEvents = 'none';
        } else {
          const sx = projVec.x * halfW + halfW;
          const sy = -projVec.y * halfH + halfH;
          pinEl.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%) scale(${zoomScale})`;
          pinEl.style.opacity = '1';
          pinEl.style.pointerEvents = 'auto';
        }
      });

      terraCities.forEach((city) => {
        const cEl = cityPinRefs.current.get(city.id);
        if (!cEl) return;
        const wx = city.pixelCoords.x - MAP_CENTER_X;
        const wz = city.pixelCoords.y - MAP_CENTER_Y;
        const localTerrainH = is2D ? 0 : sampleTerrainHeightAtPixel(city.pixelCoords.x, city.pixelCoords.y);
        const isCapitalOrRhodes = city.type === 'capital' || city.type === 'rhodes';
        const isPin = city.regionId === pinnedId;
        const isHov = city.regionId === hoveredRegionRef.current;
        const lift = is2D ? 0 : (isPin ? 6.5 : isHov ? 4.2 : 0);
        const wy = is2D ? 2.0 : (localTerrainH * elevScale + lift + (isCapitalOrRhodes ? 21 : 14));

        projVec.set(wx, wy, wz).project(camera);
        if (projVec.z > 1) {
          cEl.style.opacity = '0';
        } else {
          const sx = projVec.x * halfW + halfW;
          const sy = -projVec.y * halfH + halfH;
          const cityScale = isCapitalOrRhodes || isPin || isHov ? zoomScale : zoomScale * 0.92;
          cEl.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%) scale(${cityScale})`;
          if (pinnedId) {
            cEl.style.opacity = isPin ? '1' : '0.18';
          } else {
            cEl.style.opacity = isCapitalOrRhodes || isHov || cam.currentRadius < 510 ? '1' : '0.78';
          }
        }
      });

      routeEntries.forEach((re) => {
        const rt = re.route;
        const rEl = routePinRefs.current.get(rt.id);
        if (!rEl) return;
        const matchesCategory = activeRouteFilter === 'all' || rt.category === activeRouteFilter;
        const isRelevant = matchesCategory && (!pinnedId || rt.regionIds.includes(pinnedId));
        if (!isRelevant) {
          rEl.style.opacity = '0';
          rEl.style.pointerEvents = 'none';
          return;
        }

        // Place capsule at the route's custom labelT (default 0.5) of the 3D Bezier curve
        re.curve.getPointAt(rt.labelT ?? 0.5, projVec);
        if (is2D) {
          projVec.y = 1.0;
        } else {
          projVec.y += 2.2;
        }

        projVec.project(camera);
        if (projVec.z > 1) {
          rEl.style.opacity = '0';
          rEl.style.pointerEvents = 'none';
        } else {
          const sx = projVec.x * halfW + halfW;
          const sy = -projVec.y * halfH + halfH;
          rEl.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%) scale(${zoomScale})`;
          rEl.style.opacity = '1';
          rEl.style.pointerEvents = 'auto';
        }
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
    };
    window.addEventListener('resize', handleResize);

    // ResizeObserver ensures canvas always matches container when header expands/collapses
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
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
      renderer.dispose();
    };
  }, [regionLookup, handleSelectRegion]);

  return (
    <div
      className={`relative flex-1 w-full ${
        isHeaderCollapsed
          ? 'h-[100dvh] md:h-screen'
          : 'h-[calc(100dvh-6.25rem)] md:h-[calc(100vh-3.5rem)]'
      } bg-[#06090f] overflow-hidden select-none`}
    >
      {/* =========================================================================
          1. WEBGL 3D CANVAS VIEWPORT & PROJECTED SCREEN-SPACE PINS
      ========================================================================= */}
      <div className="relative w-full h-full overflow-hidden touch-none">
        {/* Three.js WebGL Mount Container */}
        <div ref={mountRef} className="w-full h-full touch-none" />

        {/* Subtle Edge Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_64%,rgba(4,6,10,0.72)_100%)]" />

        {/* 3D Projected Region Emblem & Label Pins */}
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
                  className={`absolute top-0 left-0 cursor-pointer flex flex-col items-center ${
                    isActive ? 'z-30' : 'z-10'
                  }`}
                >
                  {reg.logoUrl && (
                    <div
                      className={`relative w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center transition-opacity duration-150 ${
                        isActive ? 'opacity-100' : 'opacity-85'
                      }`}
                    >
                      <img
                        src={resolveAssetUrl(reg.logoUrl)}
                        alt={reg.nameKo}
                        draggable={false}
                        className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
                      />
                    </div>
                  )}

                  <div
                    className={`mt-0.5 px-1.5 sm:px-2 py-0.5 rounded-[2px] border font-mono transition-colors duration-150 flex items-center gap-1 sm:gap-1.5 backdrop-blur-md ${
                      isPinned
                        ? 'bg-[#ffe600] text-black border-white font-extrabold shadow-[0_0_16px_rgba(255,230,0,0.45)]'
                        : isHovered
                        ? 'bg-[#00d8ff] text-black border-white font-bold shadow-[0_0_12px_rgba(0,216,255,0.4)]'
                        : 'bg-[#0b0e16]/88 text-zinc-100 border-white/15'
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap font-sans font-semibold">
                      {reg.nameKo}
                    </span>
                    {reg.relatedStoryIds.length > 0 && (
                      <span
                        className={`text-[8.5px] sm:text-[9px] px-1 rounded-[1px] font-mono ${
                          isPinned || isHovered
                            ? 'bg-black/20 text-black font-black'
                            : 'bg-white/10 text-[#ffe600]'
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

        {/* 3D Projected City Beacons */}
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
                    flyToPixelCoords(city.pixelCoords.x, city.pixelCoords.y, 260, viewMode === '2d' ? 0 : 42);
                    if (isTouchOrMobile) {
                      setPinnedRegionId(null);
                      const reg = terraRegions.find((r) => r.id === city.regionId);
                      const firstStoryId = reg?.relatedStoryIds?.[0];
                      setMobilePreviewCard({
                        type: 'city',
                        id: city.id,
                        code: city.type.toUpperCase(),
                        title: `${city.nameKo} (${city.nameEn})`,
                        subtitle: reg ? `소속 세력: ${reg.nameKo}` : city.regionId,
                        description: reg?.description || '핵심 이동도시 및 전략 거점입니다.',
                        storyId: firstStoryId,
                        regionId: city.regionId,
                        badgeColor: isRhodes ? '#00d8ff' : '#ffe600',
                      });
                    } else {
                      setMobilePreviewCard(null);
                      setPinnedRegionId(city.regionId);
                    }
                  }}
                  className="absolute top-0 left-0 pointer-events-auto cursor-pointer z-20 group"
                >
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[9.5px] sm:text-[10px] font-mono border backdrop-blur-sm transition-colors ${
                      isRhodes
                        ? 'bg-[#071924]/95 border-[#00d8ff] text-[#00d8ff] font-bold shadow-[0_0_10px_rgba(0,216,255,0.3)]'
                        : isSelected
                        ? 'bg-[#ffe600] border-white text-black font-bold'
                        : isCapital
                        ? 'bg-[#0b0e16]/90 border-[#ffe600]/50 text-zinc-100 hover:border-[#ffe600]'
                        : 'bg-[#090c13]/82 border-white/12 text-zinc-300 hover:text-white hover:border-white/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rotate-45 ${
                        isRhodes ? 'bg-[#00d8ff]' : isCapital ? 'bg-[#ffe600]' : 'bg-zinc-400'
                      }`}
                    />
                    <span className="whitespace-nowrap font-sans">{city.nameKo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3D Projected Operational Route Compact Capsules (2-Step Preview on Mobile / Direct Splash on PC) */}
        {showRoutes && (
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
                    isRelevant ? 'z-20 opacity-100' : 'z-10 opacity-20 hover:opacity-100'
                  }`}
                >
                  <div className="px-1.5 py-0.5 rounded-[2px] bg-[#090c14]/92 backdrop-blur-md border border-white/15 group-hover:border-[#ffe600] text-[9.5px] sm:text-[10px] font-mono flex items-center gap-1 sm:gap-1.5 shadow-lg transition-all">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: rt.color }} />
                    <span className="text-[#ffe600] font-bold tracking-tight">{rt.code}</span>
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

        {/* =========================================================================
            1.5 MOBILE 2-STEP PREVIEW MINI CARD (Prevents accidental direct entry on Tap)
        ========================================================================= */}
        {mobilePreviewCard && (
          <div
            data-hud-panel="true"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute bottom-14 left-3 right-3 sm:left-auto sm:right-4 sm:w-88 z-40 prts-glass rounded-[6px] sm:rounded-[4px] border border-[#ffe600]/40 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] animate-fadeIn pointer-events-auto"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold text-black flex-shrink-0"
                  style={{ backgroundColor: mobilePreviewCard.badgeColor || '#ffe600' }}
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
            <div className="text-[11px] font-mono text-[#00d8ff] mb-1.5 truncate">
              {mobilePreviewCard.subtitle}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 mb-3 break-keep">
              {mobilePreviewCard.description}
            </p>
            <div className="flex items-center gap-2">
              {mobilePreviewCard.storyId && (
                <button
                  onClick={() => {
                    const targetStoryId = mobilePreviewCard.storyId!;
                    setMobilePreviewCard(null);
                    handleOpenStoryPopup(targetStoryId);
                  }}
                  className="flex-1 h-8 px-3 rounded-[3px] bg-[#ffe600] hover:bg-[#ffe600]/90 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>스토리 열람</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {mobilePreviewCard.regionId && (
                <button
                  onClick={() => {
                    const targetRegId = mobilePreviewCard.regionId!;
                    setMobilePreviewCard(null);
                    setPinnedRegionId(targetRegId);
                  }}
                  className="h-8 px-3 rounded-[3px] bg-white/10 hover:bg-white/20 text-zinc-100 font-semibold text-xs flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span>지역 상세</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            2-A. MOBILE NATIVE UNIFIED TOP HUD (md:hidden)
            - 1행: 지역 검색·목록 토글 + 3D/2D + 범례(?) + 꽉 찬 화면
            - 2행: 가로 스크롤 레이어 토글 (고저차 / 국가 / 거점 / 경로 + 경로 필터)
        ========================================================================= */}
        <div
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="md:hidden absolute top-2.5 left-2.5 right-2.5 z-30 flex flex-col gap-1.5 pointer-events-none"
        >
          {isHeaderCollapsed ? (
            /* Immersive Fullscreen Floating Pill (Allows full view of the map while easily restoring menus) */
            <div className="pointer-events-auto self-end prts-glass rounded-full px-2.5 py-1 shadow-2xl flex items-center gap-1.5 border border-[#ffe600]/40 animate-fadeIn">
              <button
                onClick={() => handleToggleViewMode(viewMode === '3d' ? '2d' : '3d')}
                className="h-6 px-2 rounded-full bg-[#ffe600] text-black font-mono font-extrabold text-[10px] flex items-center gap-1 cursor-pointer"
                title="3D / 2D 시점 전환"
              >
                {viewMode === '3d' ? <Box className="w-3 h-3" /> : <MapIcon className="w-3 h-3" />}
                <span>{viewMode.toUpperCase()}</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setIsLegendOpen(true);
                }}
                className="w-6 h-6 rounded-full bg-white/[0.08] text-[#ffe600] flex items-center justify-center cursor-pointer"
                title="지도 범례"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {onToggleHeaderCollapse && (
                <button
                  onClick={() => {
                    playClickSound();
                    onToggleHeaderCollapse();
                  }}
                  className="h-6 px-2.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/60 font-sans font-bold text-[10.5px] flex items-center gap-1 cursor-pointer"
                  title="상단 메뉴 및 도구 복원"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>메뉴 복원</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Row 1: Search & Region Directory + 3D/2D + Legend + Fullscreen */}
              <div className="pointer-events-auto prts-glass rounded-[5px] p-1 shadow-2xl flex items-center gap-1">
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={sectorSearch}
                onChange={(e) => {
                  setSectorSearch(e.target.value);
                  if (!isSectorListOpen) setIsSectorListOpen(true);
                }}
                placeholder="지역 · 국가 검색..."
                className="w-full h-7 bg-white/[0.04] focus:bg-black/50 border border-transparent focus:border-[#ffe600]/60 rounded-[3px] text-xs text-zinc-100 placeholder:text-zinc-500 pl-7 pr-5 outline-none"
              />
              {sectorSearch && (
                <button
                  onClick={() => setSectorSearch('')}
                  className="absolute right-1.5 p-0.5 text-zinc-400 hover:text-white cursor-pointer"
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
              className={`h-7 px-2 rounded-[3px] flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer flex-shrink-0 ${
                isSectorListOpen
                  ? 'bg-[#ffe600]/20 text-[#ffe600] border border-[#ffe600]/50 font-bold'
                  : 'bg-white/[0.06] text-zinc-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#ffe600]" />
              <span>{filteredRegions.length}</span>
              {isSectorListOpen ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {/* 3D / 2D Single Toggle Pill on Mobile */}
            <button
              onClick={() => handleToggleViewMode(viewMode === '3d' ? '2d' : '3d')}
              className="h-7 px-2 rounded-[3px] bg-[#ffe600] text-black font-mono font-extrabold text-[11px] flex items-center gap-1 flex-shrink-0 cursor-pointer"
              title="3D / 2D 시점 전환"
            >
              {viewMode === '3d' ? <Box className="w-3 h-3" /> : <MapIcon className="w-3 h-3" />}
              <span>{viewMode.toUpperCase()}</span>
            </button>

            {/* Legend Button */}
            <button
              onClick={() => {
                playClickSound();
                setIsLegendOpen(true);
              }}
              className="w-7 h-7 rounded-[3px] bg-white/[0.06] text-[#ffe600] flex items-center justify-center flex-shrink-0 cursor-pointer"
              title="지도 범례 및 조작 안내"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Toggle Button */}
            {onToggleHeaderCollapse && (
              <button
                onClick={() => {
                  playClickSound();
                  onToggleHeaderCollapse();
                }}
                className={`w-7 h-7 rounded-[3px] flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  isHeaderCollapsed
                    ? 'bg-[#ffe600] text-black font-bold'
                    : 'bg-white/[0.06] text-zinc-300'
                }`}
                title={isHeaderCollapsed ? '메뉴 복원' : '꽉 찬 화면'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Collapsible 22-Region Directory Dropdown */}
          {isSectorListOpen && (
            <div className="pointer-events-auto prts-glass rounded-[5px] overflow-hidden shadow-2xl animate-fadeIn">
              <div className="overflow-y-auto divide-y divide-white/[0.05] max-h-56">
                {filteredRegions.map((reg) => {
                  const isPinned = pinnedRegionId === reg.id;
                  return (
                    <button
                      key={reg.id}
                      onClick={() => handleSelectRegion(reg.id)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isPinned
                          ? 'bg-[#ffe600]/15 text-[#ffe600] border-l-2 border-l-[#ffe600]'
                          : 'hover:bg-white/[0.05] text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-[1px] flex-shrink-0"
                          style={{ backgroundColor: reg.badgeColor }}
                        />
                        <div className="truncate">
                          <span className="text-xs font-bold">{reg.nameKo}</span>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase ml-1.5">
                            {reg.nameEn}
                          </span>
                        </div>
                      </div>
                      {reg.relatedStoryIds.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-white/[0.06] text-[#ffe600]">
                          {reg.relatedStoryIds.length}편
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 2: Single-Line Horizontal Scroll Layer Toggles + Route Filter */}
          <div className="pointer-events-auto flex items-center gap-1 overflow-x-auto no-scrollbar">
            <div className="prts-glass rounded-[5px] p-1 flex items-center gap-1 text-[11px] flex-shrink-0 shadow-lg">
              <button
                onClick={() => {
                  playClickSound();
                  if (viewMode === '2d') {
                    handleToggleViewMode('3d');
                    setShowElevation(true);
                  } else {
                    setShowElevation(!showElevation);
                  }
                }}
                className={`h-6 px-2 rounded-[3px] flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode !== '2d' && showElevation ? 'bg-white/[0.12] text-[#ffe600] font-bold' : 'text-zinc-500 hover:text-zinc-300'
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
                className={`h-6 px-2 rounded-[3px] cursor-pointer ${
                  showLogos ? 'bg-white/[0.12] text-[#ffe600] font-bold' : 'text-zinc-500'
                }`}
              >
                <span>국가</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowCities(!showCities);
                }}
                className={`h-6 px-2 rounded-[3px] flex items-center gap-1 cursor-pointer ${
                  showCities ? 'bg-white/[0.12] text-[#00d8ff] font-bold' : 'text-zinc-500'
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
                className={`h-6 px-2 rounded-[3px] flex items-center gap-1 cursor-pointer ${
                  showRoutes ? 'bg-white/[0.12] text-amber-400 font-bold' : 'text-zinc-500'
                }`}
              >
                <Route className="w-3 h-3" />
                <span>경로</span>
              </button>
            </div>

            {showRoutes && (
              <div className="prts-glass rounded-[5px] p-1 flex items-center gap-1 text-[10.5px] flex-shrink-0 shadow-lg">
                {(
                  [
                    { id: 'all', label: '전체' },
                    { id: 'main', label: '메인' },
                    { id: 'series', label: '연작' },
                    { id: 'expedition', label: '원정' },
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
                      className={`h-6 px-2 rounded-[3px] cursor-pointer transition-all ${
                        isActive
                          ? 'bg-amber-400/25 border border-amber-400/60 text-amber-300 font-bold'
                          : 'text-zinc-400'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* =========================================================================
            2-B. DESKTOP TOP-LEFT REGION SEARCH & DIRECTORY DOCK (hidden md:flex)
        ========================================================================= */}
        <div
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="hidden md:flex absolute top-4 left-4 z-30 flex-col w-68 sm:w-76 pointer-events-none"
        >
          {/* Unified Search + Collapse Toggle Bar */}
          <div className="pointer-events-auto prts-glass rounded-[3px] p-1.5 shadow-2xl flex items-center gap-1.5">
            <div className="relative flex-1 flex items-center">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={sectorSearch}
                onChange={(e) => {
                  setSectorSearch(e.target.value);
                  if (!isSectorListOpen) setIsSectorListOpen(true);
                }}
                placeholder="지역 · 국가 · 수도 검색..."
                className="w-full h-7 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-black/40 border border-transparent focus:border-[#ffe600]/60 rounded-[2px] text-xs text-zinc-100 placeholder:text-zinc-500 pl-8 pr-6 outline-none transition-colors"
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
              className="h-7 px-2 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer flex-shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-[#ffe600]" />
              <span>{filteredRegions.length}</span>
              {isSectorListOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>
          </div>

          {/* Collapsible 22-Region Directory */}
          {isSectorListOpen && (
            <div className="pointer-events-auto mt-1.5 prts-glass rounded-[3px] overflow-hidden shadow-2xl animate-fadeIn">
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
                          ? 'bg-[#ffe600]/15 text-[#ffe600] border-l-2 border-l-[#ffe600]'
                          : 'hover:bg-white/[0.05] text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-[1px] flex-shrink-0"
                          style={{ backgroundColor: reg.badgeColor }}
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{reg.nameKo}</div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase truncate">
                            {reg.nameEn}
                          </div>
                        </div>
                      </div>
                      {reg.relatedStoryIds.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-white/[0.05] text-zinc-400">
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
            3. DESKTOP TOP-RIGHT UNIFIED VIEW & LAYER TOOLBAR (hidden md:flex)
        ========================================================================= */}
        <div
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="hidden md:flex absolute top-4 right-4 z-30 flex-col items-end gap-1.5 pointer-events-none"
        >
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {/* 3D / 2D View Switcher */}
            <div className="pointer-events-auto prts-glass rounded-[3px] p-1 flex items-center gap-0.5 text-xs shadow-xl">
              <button
                onClick={() => handleToggleViewMode('3d')}
                className={`h-7 px-2.5 rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-all ${
                  viewMode === '3d'
                    ? 'bg-[#ffe600] text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D</span>
              </button>
              <button
                onClick={() => handleToggleViewMode('2d')}
                className={`h-7 px-2.5 rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-all ${
                  viewMode === '2d'
                    ? 'bg-[#ffe600] text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>2D</span>
              </button>
            </div>

            {/* Layer Filter Pills */}
            <div className="pointer-events-auto prts-glass rounded-[3px] p-1 flex items-center gap-1 text-xs shadow-xl">
              <button
                onClick={() => {
                  playClickSound();
                  if (viewMode === '2d') {
                    handleToggleViewMode('3d');
                    setShowElevation(true);
                  } else {
                    setShowElevation(!showElevation);
                  }
                }}
                title={viewMode === '2d' ? '3D 지형 고저차 켜기' : '지형 고저차 토글'}
                className={`h-7 px-2.5 rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode !== '2d' && showElevation
                    ? 'bg-white/[0.1] text-[#ffe600] font-semibold'
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
                title="국가 엠블럼 토글"
                className={`h-7 px-2.5 rounded-[2px] cursor-pointer transition-colors ${
                  showLogos
                    ? 'bg-white/[0.1] text-[#ffe600] font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>국가 마크</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setShowCities(!showCities);
                }}
                title="주요 거점 토글 (27개 핵심 거점)"
                className={`h-7 px-2.5 rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                  showCities
                    ? 'bg-white/[0.1] text-[#00d8ff] font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
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
                title="작전 이동 경로 토글 (18개 주요 기동 경로)"
                className={`h-7 px-2.5 rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                  showRoutes
                    ? 'bg-white/[0.1] text-amber-400 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Route className="w-3.5 h-3.5" />
                <span>경로</span>
              </button>
            </div>

            {/* Top-Right Icon Legend Button */}
            <div className="pointer-events-auto prts-glass rounded-[3px] p-1 flex items-center shadow-xl">
              <button
                onClick={() => {
                  playClickSound();
                  setIsLegendOpen(true);
                }}
                title="지도 범례"
                className={`h-7 px-2 rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                  isLegendOpen
                    ? 'bg-[#ffe600] text-black font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#ffe600]" />
                <span className="hidden sm:inline text-xs font-semibold">범례</span>
              </button>
            </div>

            {/* Fullscreen / Collapse Header Toggle Button */}
            {onToggleHeaderCollapse && (
              <div className="pointer-events-auto prts-glass rounded-[3px] p-1 flex items-center shadow-xl">
                <button
                  onClick={() => {
                    playClickSound();
                    onToggleHeaderCollapse();
                  }}
                  title={isHeaderCollapsed ? '상단 메뉴 복원' : '상단 메뉴 접기 (꽉 찬 화면)'}
                  className={`h-7 px-2 rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                    isHeaderCollapsed
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs font-semibold">
                    {isHeaderCollapsed ? '메뉴 복원' : '꽉 찬 화면'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Route Category Filter Bar (Only visible when showRoutes is active) */}
          {showRoutes && (
            <div className="pointer-events-auto prts-glass rounded-[3px] p-1 flex items-center gap-1 text-[11px] shadow-xl">
              <span className="px-2 text-[10px] font-mono text-zinc-400 hidden sm:inline">
                경로 필터
              </span>
              {(
                [
                  { id: 'all', label: '전체', count: TACTICAL_ROUTES.length },
                  {
                    id: 'main',
                    label: '메인 스토리',
                    count: TACTICAL_ROUTES.filter((r) => r.category === 'main').length,
                  },
                  {
                    id: 'series',
                    label: '세력 연작',
                    count: TACTICAL_ROUTES.filter((r) => r.category === 'series').length,
                  },
                  {
                    id: 'expedition',
                    label: '대륙 원정',
                    count: TACTICAL_ROUTES.filter((r) => r.category === 'expedition').length,
                  },
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
                    className={`h-6 px-2 rounded-[2px] flex items-center gap-1 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-amber-400/20 border border-amber-400/60 text-amber-300 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[10px] ${
                        isActive ? 'text-amber-200' : 'text-zinc-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            4. BOTTOM UNIFIED CONTROL GUIDE, STATUS READOUT & CAMERA BAR
            - 모바일: 1글자 세로 줄바꿈을 유발하던 좌측 안내 박스를 제거하고 슬림한 360° 회전 바만 배치
            - 데스크톱: 좌측 상태/조작 바 + 우측 전체 카메라 컨트롤 바 유지
        ========================================================================= */}
        <div
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className={`absolute bottom-3 md:bottom-4 left-3 right-3 md:left-4 md:right-4 z-30 flex items-end justify-center md:justify-between pointer-events-none gap-3 ${
            isTouchOrMobile && (pinnedRegion || mobilePreviewCard || isHeaderCollapsed) ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Left: Compact Control Guide + Live Sector Readout (Desktop Only - Prevents Mobile 1-Char Vertical Wrap) */}
          <div className="hidden md:flex pointer-events-auto prts-glass rounded-[3px] px-3 py-2 flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] shadow-xl">
            {/* Active Sector Indicator */}
            <div className="flex items-center gap-2 pr-2 border-r border-white/10">
              <span className="w-2 h-2 rounded-[1px] bg-[#ffe600]" />
              <span ref={telemetrySectorRef} className="text-white font-semibold">
                중립 지역
              </span>
              <span ref={telemetryCoordRef} className="text-zinc-500 font-mono text-[10px] hidden lg:inline">
                X:410 Y:512 · 450M
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-zinc-300 text-[11px]">
              <span>🖱️ 드래그: 이동 · 회전</span>
              <span className="text-zinc-600">|</span>
              <span>스크롤: 확대 · 축소</span>
              <span className="text-zinc-600 hidden lg:inline">|</span>
              <span className="hidden lg:inline">⌨️ 방향키: 지도 이동</span>

              <div className="w-[1px] h-3.5 bg-white/10" />

              <button
                onClick={() => {
                  playClickSound();
                  setIsLegendOpen(true);
                }}
                title="지도 범례 및 조작 안내"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-white/[0.08] hover:bg-[#ffe600] text-[#ffe600] hover:text-black font-semibold transition-colors cursor-pointer text-[11px]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>지도 범례</span>
              </button>
            </div>
          </div>

          {/* Right (Desktop) / Bottom Slim Bar (Mobile): 360° Rotation Slider & Camera Controls */}
          <div className="pointer-events-auto w-full md:w-auto prts-glass rounded-[5px] md:rounded-[3px] p-1.5 md:p-1 flex items-center justify-between md:justify-end gap-1.5 md:gap-1 font-mono text-xs shadow-xl">
            <span
              ref={telemetryAngleRef}
              className="px-2 text-[10px] text-zinc-400 hidden lg:inline border-r border-white/10 mr-0.5"
            >
              52° / 0°
            </span>

            {/* In 3D Mode: Show 360° Horizontal Rotation Slider */}
            {viewMode === '3d' ? (
              <>
                <div
                  className="flex-1 md:flex-initial flex items-center gap-2 px-2.5 py-1 md:py-0.5 rounded-[3px] md:rounded-[2px] bg-white/[0.04] border border-white/[0.08]"
                  title="360° 수평 회전 바"
                >
                  <Compass className="w-3.5 h-3.5 text-[#ffe600] flex-shrink-0" />
                  <span className="md:hidden text-[10.5px] font-sans text-zinc-300 flex-shrink-0">회전</span>
                  <input
                    ref={telemetryYawSliderRef}
                    type="range"
                    min="0"
                    max="359"
                    defaultValue="0"
                    onChange={(e) => handleSetAzimuthDegrees(Number(e.target.value))}
                    className="flex-1 md:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ffe600]"
                    title="지도 360도 회전 각도 조절"
                  />
                  <span ref={telemetryYawTextRef} className="text-[10.5px] text-[#ffe600] md:text-zinc-300 font-mono w-8 text-right flex-shrink-0">
                    0°
                  </span>
                </div>

                <button
                  onClick={() => handleRotateYaw(-Math.PI / 8)}
                  title="좌측 22.5° 회전"
                  className="w-7 h-7 rounded-[3px] md:rounded-[2px] text-zinc-300 hover:text-white bg-white/[0.04] md:bg-transparent hover:bg-white/10 flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  ↺
                </button>
                <button
                  onClick={() => handleRotateYaw(Math.PI / 8)}
                  title="우측 22.5° 회전"
                  className="w-7 h-7 rounded-[3px] md:rounded-[2px] text-zinc-300 hover:text-white bg-white/[0.04] md:bg-transparent hover:bg-white/10 flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  ↻
                </button>
              </>
            ) : (
              /* In 2D Mode: Angle is restricted/locked to North 0°, show 2D Status Badge */
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 md:py-0.5 rounded-[3px] md:rounded-[2px] bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-zinc-300 select-none"
                title="2D 모드에서는 시점이 정북(0°)과 수직 평면(0°)으로 고정되어 각도 조절이 제한됩니다."
              >
                <Compass className="w-3.5 h-3.5 text-[#ffe600]" />
                <span className="font-sans font-bold text-white text-[11px]">2D 정북 고정</span>
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">(각도 조절 제한)</span>
              </div>
            )}

            {/* Zoom Buttons: Always visible on both Mobile and Desktop */}
            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
            <button
              onClick={() => handleZoom(90)}
              title="[-] 축소"
              className="w-7 h-7 rounded-[3px] md:rounded-[2px] text-zinc-300 hover:text-white bg-white/[0.05] md:bg-transparent hover:bg-white/10 flex items-center justify-center cursor-pointer active:scale-95 transition-all flex-shrink-0"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              ref={telemetryZoomRef}
              className="inline-block px-1 text-[11px] text-[#ffe600] font-bold min-w-[36px] md:min-w-[42px] text-center select-none"
            >
              100%
            </span>
            <button
              onClick={() => handleZoom(-90)}
              title="[+] 확대"
              className="w-7 h-7 rounded-[3px] md:rounded-[2px] text-zinc-300 hover:text-white bg-white/[0.05] md:bg-transparent hover:bg-white/10 flex items-center justify-center cursor-pointer active:scale-95 transition-all flex-shrink-0"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
            <button
              onClick={handleResetCamera}
              title="지도 시점 초기화"
              className="h-7 px-2 md:w-7 md:px-0 rounded-[3px] md:rounded-[2px] text-zinc-200 hover:text-black bg-white/[0.06] md:bg-transparent hover:bg-[#ffe600] flex items-center justify-center gap-1 transition-colors cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="md:hidden text-[10.5px] font-sans font-semibold">초기화</span>
            </button>
          </div>
        </div>

        {/* Mobile Dedicated One-Handed Zoom Widget (Right Side Thumb Zone) */}
        {!pinnedRegion && !mobilePreviewCard && (
          <div className="md:hidden fixed right-3 bottom-18 z-30 flex flex-col items-center gap-0.5 pointer-events-auto prts-glass rounded-[4px] p-1 border border-white/15 shadow-2xl animate-fadeIn">
            <button
              onClick={() => handleZoom(-90)}
              title="지도 한 손 확대"
              aria-label="지도 확대"
              className="w-8 h-8 rounded-[3px] bg-white/[0.06] active:bg-[#ffe600] text-zinc-200 active:text-black flex items-center justify-center transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-5 h-[1px] bg-white/15 my-0.5" />
            <button
              onClick={() => handleZoom(90)}
              title="지도 한 손 축소"
              aria-label="지도 축소"
              className="w-8 h-8 rounded-[3px] bg-white/[0.06] active:bg-[#ffe600] text-zinc-200 active:text-black flex items-center justify-center transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-5 h-[1px] bg-white/15 my-0.5" />
            <button
              onClick={handleResetCamera}
              title="지도 시점 초기화"
              aria-label="시점 초기화"
              className="w-8 h-8 rounded-[3px] bg-white/[0.06] active:bg-[#ffe600] text-zinc-200 active:text-black flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* =========================================================================
            5. REGION DETAILS & ASSOCIATED STORIES DRAWER
            - 모바일: 상단 44%의 3D 지도를 가리지 않는 하단 바텀 시트 (max-h-[56dvh])
            - 데스크톱: 우측 플로팅 글래스 서랍 패널
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
              showRoutes ? 'md:top-24' : 'md:top-16'
            } md:right-4 md:bottom-16 md:w-84 lg:w-92 prts-glass rounded-t-2xl md:rounded-[4px] border-t border-white/20 md:border-t-0 flex flex-col z-40 shadow-[0_-12px_40px_rgba(0,0,0,0.85)] md:shadow-[0_12px_40px_rgba(0,0,0,0.75)] overflow-hidden animate-fadeIn md:animate-slideInRight transition-all`}
          >
            {/* Mobile Drag Handle Bar with touch gesture */}
            <div
              onTouchStart={(e) => {
                sheetTouchStartY.current = e.touches[0].clientY;
              }}
              onTouchMove={(e) => {
                if (sheetTouchStartY.current === null) return;
                const dy = Math.max(0, e.touches[0].clientY - sheetTouchStartY.current);
                setSheetDragY(dy);
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
              className="md:hidden flex items-center justify-center py-2.5 bg-black/50 border-b border-white/[0.06] cursor-pointer flex-shrink-0 touch-none active:bg-white/[0.08]"
              title="잡아서 아래로 당겨 닫기"
            >
              <div className="w-10 h-1.5 rounded-full bg-zinc-500" />
            </div>

            {/* Dossier Header */}
            <div className="px-4 py-3 sm:p-5 border-b border-white/10 relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-transparent flex-shrink-0">
              {pinnedRegion.logoUrl && (
                <img
                  src={resolveAssetUrl(pinnedRegion.logoUrl)}
                  alt=""
                  className="absolute -right-3 -bottom-3 w-24 h-24 sm:w-28 sm:h-28 object-contain opacity-12 pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between mb-1.5 sm:mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-[1px]"
                    style={{ backgroundColor: pinnedRegion.badgeColor }}
                  />
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                    {pinnedRegion.nameEn}
                  </span>
                </div>

                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPinnedRegionId(null);
                  }}
                  title="패널 닫기"
                  className="w-6 h-6 rounded-[2px] bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {pinnedRegion.nameKo}
                </h2>
                {pinnedRegion.capital && (
                  <span className="md:hidden text-[11px] text-[#ffe600] font-semibold truncate">
                    수도: {pinnedRegion.capital}
                  </span>
                )}
              </div>

              {pinnedRegion.capital && (
                <div className="hidden md:flex mt-3 pt-2.5 border-t border-white/8 items-center justify-between text-xs">
                  <span className="text-zinc-400">수도 / 거점</span>
                  <span className="text-[#ffe600] font-semibold">{pinnedRegion.capital}</span>
                </div>
              )}
            </div>

            {/* Geopolitical Summary & Associated Operations */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-5">
              {/* Geopolitical Overview */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-zinc-400">
                  지역 소개
                </div>
                <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed bg-white/[0.03] border border-white/[0.06] rounded-[3px] p-3 break-keep">
                  {pinnedRegion.description}
                </p>
              </div>

              {/* Key Cities & Landmarks in Sector */}
              {pinnedRegionCities.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                    <span>주요 도시 · 거점</span>
                    <span className="font-mono text-[10px] text-[#00d8ff]">{pinnedRegionCities.length}곳</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {pinnedRegionCities.map((c) => (
                      <button
                        key={c.id}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          setSelectedCityId(c.id);
                          flyToPixelCoords(c.pixelCoords.x, c.pixelCoords.y, 240, viewMode === '2d' ? 0 : 40);
                        }}
                        className={`p-2 rounded-[2px] text-left border text-xs transition-colors cursor-pointer ${
                          selectedCityId === c.id
                            ? 'bg-[#ffe600]/15 border-[#ffe600] text-[#ffe600]'
                            : 'bg-white/[0.03] border-white/[0.07] text-zinc-200 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rotate-45 flex-shrink-0 ${
                              c.type === 'capital' || c.type === 'rhodes'
                                ? 'bg-[#ffe600]'
                                : 'bg-[#00d8ff]'
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

              {/* Connected Tactical Routes */}
              {pinnedRegionRoutes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                    <span>스토리 이동 경로</span>
                    <span className="font-mono text-[10px] text-amber-400">{pinnedRegionRoutes.length}개</span>
                  </div>
                  <div className="space-y-1.5">
                    {pinnedRegionRoutes.map((rt) => (
                      <button
                        key={rt.id}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStoryPopup(rt.storyId);
                        }}
                        className="w-full p-2.5 rounded-[3px] text-left bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: rt.color }}
                            />
                            <span className="font-mono text-[10px] font-bold text-amber-300">
                              {rt.code}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-200 group-hover:text-white truncate">
                              {rt.shortLabel}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 pl-3 truncate">
                            {rt.fullLabel}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Associated Story Operations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                  <span>관련 스토리</span>
                  <span className="font-mono text-xs text-[#ffe600]">{pinnedRegionStories.length}편</span>
                </div>

                {pinnedRegionStories.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500 border border-white/[0.06] rounded-[3px] bg-white/[0.02]">
                    관련 스토리가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {pinnedRegionStories.map((st) => {
                      const state = getStoryAccessState(st);
                      const isRestored = state === 'available';

                      return (
                        <div
                          key={st.id}
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStoryPopup(st.id);
                          }}
                          className={`group relative p-3 rounded-[3px] border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isRestored
                              ? 'bg-white/[0.05] border-[#ffe600]/40 hover:border-[#ffe600] hover:bg-white/[0.08]'
                              : 'bg-white/[0.02] border-white/[0.07] hover:border-white/25 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              <span
                                className={`px-1.5 py-0.2 rounded-[1px] font-bold ${
                                  isRestored ? 'bg-[#ffe600] text-black' : 'bg-white/10 text-zinc-300'
                                }`}
                              >
                                {st.code}
                              </span>
                              <span className="text-zinc-500 truncate">{st.timeline}</span>
                            </div>
                            <div className="text-sm font-bold text-white group-hover:text-[#ffe600] transition-colors truncate">
                              {st.titleKo}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 truncate">
                              {st.titleEn}
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#ffe600] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* =========================================================================
            6. IN-MAP STORY SPLASH PREVIEW MODAL
        ========================================================================= */}
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

        {/* =========================================================================
            7. IN-MAP TACTICAL LEGEND & CONTROLS MODAL (아이콘 설명도)
        ========================================================================= */}
        <TacticalMapLegendModal
          isOpen={isLegendOpen}
          onClose={() => setIsLegendOpen(false)}
        />
      </div>
    </div>
  );
};

// =========================================================================
// TACTICAL MAP LEGEND & CONTROL SCHEME MODAL (아이콘 설명도)
// =========================================================================
interface TacticalMapLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TacticalMapLegendModal: React.FC<TacticalMapLegendModalProps> = ({
  isOpen,
  onClose,
}) => {
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
        className="relative w-full max-w-3xl max-h-[88vh] bg-[#090d16]/96 border border-white/20 rounded-[4px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-scaleUp text-zinc-100"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-[#ffe600] via-[#00d8ff] to-transparent" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-[#ffe600]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  테라 지도 안내 & 범례
                </h3>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 text-[#ffe600] text-[10px] font-mono font-bold">
                  안내
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                TERRA MAP GUIDE & CONTROLS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-[2px] bg-white/10 text-zinc-400 text-[10px] font-mono">
              ESC
            </kbd>
            <button
              onClick={() => {
                playCloseSound();
                onClose();
              }}
              title="닫기"
              className="w-7 h-7 rounded-[2px] bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 divide-y divide-white/10 text-xs sm:text-[13px]">
          {/* Section 1: 지도 심볼 및 마커 */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ffe600]" />
                <h4 className="text-sm font-bold text-white tracking-wide">
                  지도 심볼 및 마커 안내
                </h4>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">MAP SYMBOLS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1. 수도 및 로도스 본함 */}
              <div className="p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] flex gap-3">
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 w-12 h-12 rounded-[2px] bg-black/40 border border-[#ffe600]/40">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rotate-45 bg-[#ffe600] shadow-[0_0_8px_#ffe600]" />
                    <span className="w-2.5 h-2.5 rotate-45 bg-[#00d8ff] shadow-[0_0_8px_#00d8ff]" />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-400">CORE</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span>수도 및 로도스 본함</span>
                    <span className="text-[9px] font-mono text-[#ffe600]">CAPITAL</span>
                  </div>
                  <p className="mt-1 text-zinc-300 text-[11px] leading-relaxed">
                    각 국가의 수도 이동도시와 로도스 아일랜드 본함 위치입니다. 클릭하면 해당 거점으로 이동하며 우측 패널에서 상세 정보를 확인할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 2. 일반 이동도시 */}
              <div className="p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] flex gap-3">
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-[2px] bg-black/40 border border-white/20">
                  <span className="w-2.5 h-2.5 rotate-45 bg-zinc-300" />
                  <span className="text-[8px] font-mono text-zinc-400">CITY</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span>주요 도시 및 거점 (27곳)</span>
                    <span className="text-[9px] font-mono text-zinc-400">OUTPOST</span>
                  </div>
                  <p className="mt-1 text-zinc-300 text-[11px] leading-relaxed">
                    체르노보그, 용문, 트리마운츠, 볼시니 등 스토리의 주 무대가 되는 27개 핵심 도시입니다. 클릭 시 해당 위치로 시점이 이동합니다.
                  </p>
                </div>
              </div>

              {/* 3. 국가 엠블럼 */}
              <div className="p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] flex gap-3">
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-[2px] bg-black/40 border border-[#00d8ff]/40">
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full border border-[#00d8ff] flex items-center justify-center text-[7px] font-mono text-[#00d8ff]">
                      PR
                    </span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-white/10 text-[#ffe600] font-mono">
                      4
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-400">CREST</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span>국가 마크 (세력 엠블럼)</span>
                    <span className="text-[9px] font-mono text-[#00d8ff]">18 NATIONS</span>
                  </div>
                  <p className="mt-1 text-zinc-300 text-[11px] leading-relaxed">
                    18개 국가 및 세력의 중심 마크입니다. 클릭 시 우측 서랍 패널에서 지역 소개와 소속 거점, 관련 스토리를 열람할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 4. 작전 기동 경로 */}
              <div className="p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] flex gap-3">
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-[2px] bg-black/40 border border-amber-500/40">
                  <div className="relative w-8 h-4 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-amber-400/60 rounded-full" />
                    <span className="absolute w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                    <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <span className="text-[8px] font-mono text-amber-300">ROUTE</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span>스토리 이동 경로 (18개)</span>
                    <span className="text-[9px] font-mono text-amber-400">TRAJECTORY</span>
                  </div>
                  <p className="mt-1 text-zinc-300 text-[11px] leading-relaxed">
                    도시나 국가 간 장거리 이동이 일어난 18개 주요 경로입니다. 상단 필터로 분류해 볼 수 있으며, 클릭 시 스토리 요약 팝업이 열립니다.
                  </p>
                </div>
              </div>

              {/* 5. 지형 고저차 및 국경 구획 (전체 너비) */}
              <div className="md:col-span-2 p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] flex gap-3">
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-[2px] bg-black/40 border border-white/20">
                  <Layers className="w-5 h-5 text-zinc-300" />
                  <span className="text-[8px] font-mono text-zinc-400">3D HEX</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span>지형 고저차 및 국경망</span>
                    <span className="text-[9px] font-mono text-zinc-400">ELEVATION & BORDERS</span>
                  </div>
                  <p className="mt-1 text-zinc-300 text-[11px] leading-relaxed">
                    테라 대륙의 해양·평원·고원 지형 릴리프와 세력권 경계망입니다. 상단 툴바의 '고저차' 버튼으로 평면과 입체 지형을 전환할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: 조작 가이드 */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#00d8ff]" />
                <h4 className="text-sm font-bold text-white tracking-wide">
                  지도 조작 가이드
                </h4>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">CONTROLS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1. 키보드 이동 */}
              <div className="p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">키보드 이동 (WASD & 방향키)</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded-[2px] font-mono text-[10px] text-zinc-200 font-bold">
                      W A S D
                    </kbd>
                    <span className="text-zinc-500">/</span>
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded-[2px] font-mono text-[10px] text-zinc-200 font-bold">
                      ↑ ↓ ← →
                    </kbd>
                  </div>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  바라보는 방향을 기준으로 지도를 상·하·좌·우로 부드럽게 이동합니다.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  <kbd className="px-1 py-0.2 bg-white/10 rounded-[2px] text-[#ffe600] font-bold">
                    SHIFT
                  </kbd>
                  <span>동시 입력 시 고속 부스트 이동</span>
                </div>
              </div>

              {/* 2. 마우스 / 터치 이동 */}
              <div className="p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">지도 이동</span>
                  <span className="px-1.5 py-0.5 bg-white/10 rounded-[2px] font-mono text-[10px] text-zinc-200 font-bold">
                    드래그 (1손가락)
                  </span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  지도를 마우스 좌클릭 또는 1손가락으로 드래그하여 자유롭게 이동합니다.
                </p>
              </div>

              {/* 3. 3D 회전 및 각도 조절 */}
              <div className="p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">360° 회전 및 시점 각도 (3D 전용)</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded-[2px] font-mono text-[10px] text-zinc-200 font-bold">
                      우클릭 드래그
                    </kbd>
                    <span className="text-zinc-500">/</span>
                    <span className="px-1.5 py-0.5 bg-white/10 rounded-[2px] font-mono text-[10px] text-zinc-200 font-bold">
                      2손가락 회전
                    </span>
                  </div>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  우클릭 드래그나 하단 360° 바, 모바일 2손가락 비틀기 제스처로 지도를 360도 회전하고 시점 각도를 조절할 수 있습니다. (2D 평면 모드에서는 시점이 정북 0°로 고정되어 각도 조절이 자동 제한됩니다)
                </p>
              </div>

              {/* 4. 확대 및 축소 */}
              <div className="p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">확대 및 축소 (Zoom)</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded-[2px] font-mono text-[10px] text-zinc-200 font-bold">
                      +/- 키
                    </kbd>
                    <span className="text-zinc-500">/</span>
                    <span className="px-1.5 py-0.5 bg-white/10 rounded-[2px] font-mono text-[10px] text-zinc-200 font-bold">
                      우측 줌 버튼 / 더블 탭
                    </span>
                  </div>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  마우스 휠, 키보드 +/- 및 Q/E 키, 화면 내 +/- 줌 버튼, 더블 클릭(더블 탭)으로 두 손을 쓰지 않고도 한 손으로 편리하게 확대·축소할 수 있습니다.
                </p>
              </div>

              {/* 5. 뷰 모드 및 레이어 필터 */}
              <div className="md:col-span-2 p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-white text-xs">시점 모드 & 레이어 필터</div>
                  <div className="text-zinc-300 text-[11px]">
                    3D 입체 시점(52°)과 2D 평면도(0° 완전 평면) 전환 및 지형 고저차·국가 마크·거점·경로를 개별 표시할 수 있습니다.
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 text-white font-bold">3D/2D</span>
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 text-zinc-300">고저차</span>
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 text-zinc-300">국가 마크</span>
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 text-zinc-300">거점</span>
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 text-zinc-300">경로</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500">PRTS TACTICAL MAP</span>
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-[2px] bg-[#ffe600] text-black font-bold font-sans hover:bg-[#fff04d] transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

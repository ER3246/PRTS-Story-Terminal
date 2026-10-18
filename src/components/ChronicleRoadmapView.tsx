import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { storyRegistry, STORY_LINES, getStoryAccessState } from '../data/storyRegistry';
import type { StoryListItem, StoryLineMeta } from '../data/storyRegistry';
import { StorySplashModal, FilmReelIcon } from './StorySplashModal';
import {
  Search,
  GitBranch,
  Calendar,
  Clock,
  Layers,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Move,
  Sparkles,
  ArrowRight,
  BookOpen,
  Compass,
  Link2,
  Eye,
  Filter
} from 'lucide-react';
import { playClickSound, playTabSwitchSound, playOpenSound, playCloseSound } from '../utils/soundEffects';
import { resolveAssetUrl } from '../utils/assetUrl';
import { CopyrightBadge } from './CopyrightedImage';
import { useViewport } from '../hooks/useViewport';

interface ChronicleRoadmapViewProps {
  onSelectStory: (id: string) => void;
  isHeaderCollapsed?: boolean;
  onToggleHeaderCollapse?: () => void;
}

export type ChronicleBrowseMode = 'story_line' | 'chronological' | 'release';

export interface TimelineEra {
  id: string;
  code: string;
  titleKo: string;
  titleEn: string;
  periodKo: string;
  color: string;
  description: string;
  minOrder: number;
  maxOrder: number;
}

export const TIMELINE_ERAS: TimelineEra[] = [
  {
    id: 'era_00',
    code: 'ERA 00',
    titleKo: '여명 이전 · 테라의 기원',
    titleEn: 'Before the Dawn',
    periodKo: '1089년 ~ 1096년',
    color: '#54c5d0',
    description: '바벨의 창설과 테레시아의 비원, 구 로도스 아일랜드 결성기',
    minOrder: 0,
    maxOrder: 4.9,
  },
  {
    id: 'era_01',
    code: 'ERA 01',
    titleKo: '체르노보그 & 용문 사변',
    titleEn: 'Chernobog & Lungmen Crisis',
    periodKo: '1096년 12월 ~ 1097년 2월',
    color: '#ffe600',
    description: '박사의 석관 각성과 리유니온 항쟁, 체르노보그 핵심 도시 결전',
    minOrder: 5,
    maxOrder: 18.9,
  },
  {
    id: 'era_02',
    code: 'ERA 02',
    titleKo: '대륙 각지의 격동',
    titleEn: 'Terran Turmoil',
    periodKo: '1097년 봄 ~ 1098년 정월',
    color: '#38bdf8',
    description: '카시미어 메이저, 쉐라그 정변, 맨스필드 탈옥 등 열강의 암류',
    minOrder: 19,
    maxOrder: 29.9,
  },
  {
    id: 'era_03',
    code: 'ERA 03',
    titleKo: '석양의 런디니움 & 개척기',
    titleEn: 'Victoria Crisis & Frontier',
    periodKo: '1098년 ~ 1099년 겨울',
    color: '#f59e0b',
    description: '빅토리아 왕도 전쟁, 스툴티페라 나비스, 론 트레일 우주 개척',
    minOrder: 30,
    maxOrder: 59.9,
  },
  {
    id: 'era_04',
    code: 'ERA 04',
    titleKo: '분열의 서곡 & 미지의 경계',
    titleEn: 'Dissociation & Deep Abyss',
    periodKo: '1100년 ~ 1101년',
    color: '#a855f7',
    description: '원초 오리지늄 변이, 에기르 심해 원정 및 대륙의 새로운 국면',
    minOrder: 60,
    maxOrder: 999,
  },
];

interface StrategicLane {
  id: string;
  code: string;
  titleKo: string;
  subtitleKo: string;
  color: string;
  storyLineIds: string[];
  isCompactLane?: boolean;
}

// 6대 전략 권역/서사 노선 (시간대별 매트릭스의 세로 행 구성)
const STRATEGIC_LANES: StrategicLane[] = [
  {
    id: 'LANE_CORE',
    code: 'CORE SPINE',
    titleKo: '바벨 & 메인 테마',
    subtitleKo: '로도스 아일랜드 중심 서사 · 방주(RL) & 내일을 위하여(Act I~III)',
    color: '#ffe600',
    storyLineIds: ['SL_RL', 'MAIN_ACT_1', 'MAIN_ACT_2', 'MAIN_ACT_3'],
  },
  {
    id: 'LANE_WEST',
    code: 'THEATER 01',
    titleKo: '빅토리아 · 타라 · 라이타니엔',
    subtitleKo: '왕권과 혁명의 불씨, 고탑의 음악 · 다시 불붙은 장작(TA) & 고탑의 그림자(LE)',
    color: '#a855f7',
    storyLineIds: ['SL_TA', 'SL_LE'],
  },
  {
    id: 'LANE_NORTH',
    code: 'THEATER 02',
    titleKo: '우르수스 · 카시미어 · 쉐라그',
    subtitleKo: '동토의 상흔과 기사도, 설산의 개혁 · 들불(UR) & 네온 불빛(KA) & 설산과 은철(KJ)',
    color: '#eab308',
    storyLineIds: ['SL_UR', 'SL_KA', 'SL_KJ'],
  },
  {
    id: 'LANE_CENTRAL',
    code: 'THEATER 03',
    titleKo: '컬럼비아 · 시라쿠사 · 라테라노',
    subtitleKo: '첨단 과학과 마피아, 성도의 율법 · 미래를 잡는 사람(RH) & 일곱 언덕(SI) & 축복(LA)',
    color: '#10b981',
    storyLineIds: ['SL_RH', 'SL_SI', 'SL_LA'],
  },
  {
    id: 'LANE_EAST_ABYSS',
    code: 'THEATER 04',
    titleKo: '염국(쉐이) · 에기르(심해)',
    subtitleKo: '신수 쉐이의 천년 풍류와 시본의 위협 · 영원한 오늘(SU) & 깊은 바닷속으로(AE)',
    color: '#38bdf8',
    storyLineIds: ['SL_SU', 'SL_AE'],
  },
  {
    id: 'LANE_TALES',
    code: 'SUB-ARCHIVE',
    titleKo: '여름의 리듬 · 테라 기담 · 이계',
    subtitleKo: '휴양지 모험, 오퍼레이터 옴니버스 비화 및 이계 협력 작전 (ST · TS · MS)',
    color: '#94a3b8',
    storyLineIds: ['SL_ST', 'SL_TS', 'SL_COLLAB'],
    isCompactLane: true,
  },
];

export interface StoryConnection {
  fromId: string;
  toId: string;
  type: 'series' | 'cross';
  reasonKo: string;
  color: string;
}

// 명일방주 공식 설정(Terra: A Journey & 인게임 서사 계통도)에 기반한 교차 서사 인과 연결망
const CROSS_LORE_LINKS: { fromId: string; toId: string; reasonKo: string }[] = [
  {
    fromId: 'sid_babel',
    toId: 'sid_darknights_memoir',
    reasonKo: '테레시아 암살 사건 및 바벨 해체 직후 W·호더·이네스의 행적',
  },
  {
    fromId: 'sid_darknights_memoir',
    toId: 'ep00',
    reasonKo: '스카우트 소대의 체르노보그 잠입 및 박사 석관 구출 작전 개시',
  },
  {
    fromId: 'sid_darknights_memoir',
    toId: 'ep10',
    reasonKo: '호더·이네스·W의 런디니움 살카즈 군사위원회 잠입으로 직결',
  },
  {
    fromId: 'sid_vigilo',
    toId: 'ep00',
    reasonKo: '석관 동면 직전 박사가 아미야·켈시와 나눈 기억과 각성',
  },
  {
    fromId: 'ep01',
    toId: 'sid_children_of_ursus',
    reasonKo: '체르노보그 함락 당시 제4자치구 피터헤임 중학교 고립 사건',
  },
  {
    fromId: 'ep08',
    toId: 'sid_code_of_brawl',
    reasonKo: '용문 사태 직후 펭귄 로지스틱스와 시라쿠사 마피아의 용문 시내 충돌',
  },
  {
    fromId: 'ep08',
    toId: 'sid_twilight_wolumonde',
    reasonKo: '체르노보그 결전 이후 리유니온 잔당(머드락 소대)의 라이타니엔 유입',
  },
  {
    fromId: 'ep08',
    toId: 'ep09',
    reasonKo: '리유니온 붕괴 이후 더블린의 부상과 빅토리아 힐록 백작령 봉기',
  },
  {
    fromId: 'ep09',
    toId: 'ep10',
    reasonKo: '백파이프와 첸의 힐록 백작령 조사로 포착된 런디니움 점령 사태',
  },
  {
    fromId: 'ep09',
    toId: 'sid_firelight_casts',
    reasonKo: '힐록 백작령 참극 이후 더블린에서 이탈한 그림자 리드(락라흐)의 각성',
  },
  {
    fromId: 'sid_firelight_casts',
    toId: 'ep13',
    reasonKo: '자각한 리드와 타라족 세력의 런디니움 외곽 전선 합류',
  },
  {
    fromId: 'ep14',
    toId: 'sid_great_overture',
    reasonKo: '런디니움 전쟁 종결 직후 빅토리아 재건과 비나(시즈)의 정치적 결단',
  },
  {
    fromId: 'ep14',
    toId: 'ep15',
    reasonKo: '런디니움 결전 이후 원초 오리지늄 변이와 로도스 본함의 새로운 위기',
  },
  {
    fromId: 'sid_code_of_brawl',
    toId: 'sid_il_siracusano',
    reasonKo: '용문에서 시작된 시라쿠사 패밀리의 추적과 텍사스의 볼시니 귀환',
  },
  {
    fromId: 'sid_obscure_wanderer',
    toId: 'ep10',
    reasonKo: '카시미어를 떠난 사도 샤이닝·나이팅게일 일행의 런디니움 진입',
  },
  {
    fromId: 'sid_beyond_here',
    toId: 'sid_dorothys_vision',
    reasonKo: '사일런스의 라인 랩 복귀 결심 및 359호 개척 기지 공동 조사',
  },
  {
    fromId: 'sid_preluding_lights',
    toId: 'sid_break_the_ice',
    reasonKo: '카란 무역회사의 사전 물밑 공작과 쉐라그 성산의 근대화 정변',
  },
  {
    fromId: 'sid_lone_trail',
    toId: 'sid_silberneherze',
    reasonKo: '트리마운츠 사태 이후 라인 랩 생태과 주임 뮤엘시스의 쉐라그 방문',
  },
  {
    fromId: 'sid_hortus_escapismo',
    toId: 'sid_zwillingsturme',
    reasonKo: '집행관 페데리코(이그제큐터)가 수배자 아르투리아를 라이타니엔 수도까지 추적',
  },
  {
    fromId: 'sid_heart_of_surging_flame',
    toId: 'sid_so_long_adele',
    reasonKo: '구 시에스타 화산 활동 이후 신 시에스타 이전 및 아델레의 화산 연구',
  },
  {
    fromId: 'sid_gavial_returns',
    toId: 'sid_ideal_city',
    reasonKo: '아카후알라에서 인연을 맺은 두린족 기술자들의 지하도시 쎄루에르차 초청',
  },
];

const RELEASE_YEARS_META = [
  { year: 1, label: 'YEAR 01', period: '2020', subtitle: '여명의 개막 · 체르노보그에서 용문까지', color: '#ffe600' },
  { year: 2, label: 'YEAR 02', period: '2021', subtitle: '대륙으로 뻗어나가는 발걸음과 과거의 그림자', color: '#38bdf8' },
  { year: 3, label: 'YEAR 03', period: '2022', subtitle: '네온 불빛의 기사도와 심해의 각성, 런디니움 잠입', color: '#eab308' },
  { year: 4, label: 'YEAR 04', period: '2023', subtitle: '스툴티페라 나비스와 시라쿠사, 그리고 별하늘을 뚫은 론 트레일', color: '#10b981' },
  { year: 5, label: 'YEAR 05', period: '2024', subtitle: '바벨의 기원과 런디니움 대단원, 대황성의 황금 물결', color: '#f59e0b' },
  { year: 6, label: 'YEAR 06', period: '2025~2026', subtitle: '임계 상전이와 테라의 미지 경계를 향한 최신 작전', color: '#a855f7' },
];

interface NodeBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

function buildSmartConnectionPath(
  from: NodeBox,
  to: NodeBox,
  isCross: boolean = false
): { d: string; startX: number; startY: number; endX: number; endY: number } {
  const dy = to.centerY - from.centerY;
  const dxGap = to.left - from.right;

  // 1) 같은 행(Row)에서 바로 인접한 카드 간 직결 (예: EP 00 -> EP 01 -> EP 02)
  if (!isCross && Math.abs(dy) < 24 && dxGap >= -6 && dxGap < 70) {
    const startX = from.right - 2;
    const startY = from.centerY;
    const endX = to.left + 2;
    const endY = to.centerY;
    return {
      d: `M ${startX} ${startY} L ${endX} ${endY}`,
      startX,
      startY,
      endX,
      endY,
    };
  }

  // 2) 같은 행(Row)이지만 중간에 다른 카드들을 건너뛰는 경우 -> 카드에 가려지지 않도록 상단 아치형 우회 궤적
  if (Math.abs(dy) < 24 && dxGap >= 70) {
    const startX = from.centerX + 16;
    const startY = from.top + 2;
    const endX = to.centerX - 16;
    const endY = to.top + 2;
    const span = Math.abs(endX - startX);
    const archHeight = Math.min(42, Math.max(20, span * 0.055));
    const ctrlY = Math.min(from.top, to.top) - archHeight;
    return {
      d: `M ${startX} ${startY} C ${startX + span * 0.22} ${ctrlY}, ${endX - span * 0.22} ${ctrlY}, ${endX} ${endY}`,
      startX,
      startY,
      endX,
      endY,
    };
  }

  // 3) 같은 셀 내에서 다음 줄(Row 2)로 줄바꿈되는 경우 (예: EP 04 우측 끝 -> EP 05 좌측 시작)
  // 카드를 가로지르지 않고 1열과 2열 사이의 수평 통로(midY)를 따라 꺾여서 진행
  if (to.left < from.right && to.top >= from.bottom - 10 && to.top - from.bottom < 80) {
    const startX = from.centerX;
    const startY = from.bottom - 2;
    const endX = to.centerX;
    const endY = to.top + 2;
    const midY = (from.bottom + to.top) / 2;
    const r = 8;
    const dirX = endX < startX ? -1 : 1;
    const d = [
      `M ${startX} ${startY}`,
      `L ${startX} ${midY - r}`,
      `Q ${startX} ${midY} ${startX + dirX * r} ${midY}`,
      `L ${endX - dirX * r} ${midY}`,
      `Q ${endX} ${midY} ${endX} ${midY + r}`,
      `L ${endX} ${endY}`,
    ].join(' ');
    return { d, startX, startY, endX, endY };
  }

  // 4) 서로 다른 행/노선 간 대각선 및 장거리 연결
  const isMovingRight = to.left >= from.right - 20;
  const startX = isMovingRight ? from.right - 2 : from.centerX;
  const startY = isMovingRight ? from.centerY : dy > 0 ? from.bottom - 2 : from.top + 2;
  const endX = isMovingRight ? to.left + 2 : to.centerX;
  const endY = isMovingRight ? to.centerY : dy > 0 ? to.top + 2 : to.bottom - 2;

  const cDist = Math.max(55, Math.abs(endX - startX) * 0.42);
  const d = isMovingRight
    ? `M ${startX} ${startY} C ${startX + cDist} ${startY}, ${endX - cDist} ${endY}, ${endX} ${endY}`
    : `M ${startX} ${startY} C ${startX} ${(startY + endY) / 2}, ${endX} ${(startY + endY) / 2}, ${endX} ${endY}`;

  return { d, startX, startY, endX, endY };
}

export const ChronicleRoadmapView: React.FC<ChronicleRoadmapViewProps> = ({
  onSelectStory,
  isHeaderCollapsed,
  onToggleHeaderCollapse
}) => {
  const { isMobile } = useViewport();
  const [browseMode, setBrowseMode] = useState<ChronicleBrowseMode>('chronological');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'overview_only'>('all');
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);
  const [activeStoryLineHubId, setActiveStoryLineHubId] = useState<string>('MAIN_ACT_1');
  const [selectedReleaseYear, setSelectedReleaseYear] = useState<number | 'all'>('all');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [mobileChronoCanvas, setMobileChronoCanvas] = useState<boolean>(false);

  // 우측 전술 브리핑 도크 선택 상태 (초기 진입 시 닫힌 상태로 시작하여 화면 전체 조망 보장)
  const [inspectedStory, setInspectedStory] = useState<StoryListItem | null>(null);
  const [hoveredStoryId, setHoveredStoryId] = useState<string | null>(null);
  const [sheetDragY, setSheetDragY] = useState<number>(0);
  const sheetTouchStartY = useRef<number | null>(null);

  // 상세 스플래시 모달 상태 (도크에서 크게 보기 원할 때)
  const [selectedModalStory, setSelectedModalStory] = useState<StoryListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 2D 캔버스 상태 (Pan & Zoom)
  const [zoomLevel, setZoomLevel] = useState<number>(0.88);
  const [panPos, setPanPos] = useState<{ x: number; y: number }>({ x: 36, y: 24 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const dragTrackingRef = useRef<{
    isDown: boolean;
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
    hasMoved: boolean;
    moveDistance: number;
  }>({
    isDown: false,
    startX: 0,
    startY: 0,
    initialPanX: 36,
    initialPanY: 24,
    hasMoved: false,
    moveDistance: 0,
  });

  // 노드 좌표 측정 캐시 (SVG 성좌 연결선 렌더링용)
  const [nodeCoords, setNodeCoords] = useState<Record<string, NodeBox>>({});

  const storyMap = useMemo(() => {
    const map = new Map<string, StoryListItem>();
    storyRegistry.forEach((s) => map.set(s.id, s));
    return map;
  }, []);

  const lineMetaMap = useMemo(() => {
    const map = new Map<string, StoryLineMeta>();
    STORY_LINES.forEach((l) => map.set(l.id, l));
    return map;
  }, []);

  // 전체 서사 연결 그래프 생성 (서사 내 직계 연결 + 타 서사 간 교차 인과 연결)
  const allConnections = useMemo<StoryConnection[]>(() => {
    const list: StoryConnection[] = [];

    // 1. 각 서사 라인 내부의 시계열 직계 연작 연결
    STORY_LINES.forEach((line) => {
      if (line.id === 'SL_TS' || line.id === 'SL_COLLAB') return; // 독립 단편/콜라보 모음은 직계 화살표 생략
      const lineStories = storyRegistry
        .filter((s) => s.storyLineId === line.id)
        .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder || a.seriesOrder - b.seriesOrder);

      for (let i = 0; i < lineStories.length - 1; i++) {
        const curr = lineStories[i];
        const next = lineStories[i + 1];
        list.push({
          fromId: curr.id,
          toId: next.id,
          type: 'series',
          reasonKo: `${line.titleKo} 연작 직계 후속 작전 (${curr.code} → ${next.code})`,
          color: line.themeColor,
        });
      }
    });

    // 2. 메인 테마 Act 간 연결 (EP 08 -> EP 09는 교차에도 있으나 직계로도 보장, EP 14 -> EP 15)
    // 교차 서사 인과 연결 추가
    CROSS_LORE_LINKS.forEach((cross) => {
      const fromStory = storyMap.get(cross.fromId);
      const toStory = storyMap.get(cross.toId);
      if (!fromStory || !toStory) return;

      // 중복 방지 (이미 직계에 있으면 사유만 업데이트)
      const existing = list.find((c) => c.fromId === cross.fromId && c.toId === cross.toId);
      if (existing) {
        existing.reasonKo = cross.reasonKo;
        return;
      }

      const lineMeta = lineMetaMap.get(toStory.storyLineId);
      list.push({
        fromId: cross.fromId,
        toId: cross.toId,
        type: 'cross',
        reasonKo: cross.reasonKo,
        color: lineMeta?.themeColor || '#ffe600',
      });
    });

    return list;
  }, [storyMap, lineMetaMap]);

  // 공통 검색 및 상태 필터
  const applyFilters = useCallback(
    (items: StoryListItem[]) => {
      return items.filter((story) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          story.titleKo.toLowerCase().includes(q) ||
          story.titleEn.toLowerCase().includes(q) ||
          story.code.toLowerCase().includes(q) ||
          story.timeline.toLowerCase().includes(q) ||
          story.storyLineTitle.toLowerCase().includes(q);

        let matchesStatus = true;
        const state = getStoryAccessState(story);
        if (statusFilter === 'available') matchesStatus = state === 'available';
        if (statusFilter === 'overview_only') matchesStatus = state === 'overview_only';

        return matchesSearch && matchesStatus;
      });
    },
    [searchQuery, statusFilter]
  );

  // 현재 활성 포커스 대상 스토리 및 연관 스토리 집합 계산
  const activeTargetId = hoveredStoryId || inspectedStory?.id || null;

  const { highlightedStoryIds, activeConnections } = useMemo(() => {
    const ids = new Set<string>();
    const conns: StoryConnection[] = [];

    if (focusedLineId) {
      storyRegistry.forEach((s) => {
        if (
          s.storyLineId === focusedLineId ||
          (focusedLineId === 'MAIN_ALL' && s.storyLineId.startsWith('MAIN_'))
        ) {
          ids.add(s.id);
        }
      });
      allConnections.forEach((c) => {
        if (ids.has(c.fromId) || ids.has(c.toId)) {
          conns.push(c);
          ids.add(c.fromId);
          ids.add(c.toId);
        }
      });
      return { highlightedStoryIds: ids, activeConnections: conns };
    }

    if (activeTargetId) {
      const target = storyMap.get(activeTargetId);
      if (target) {
        ids.add(target.id);
        // 같은 서사 라인 전체 포함 (단편 모음 제외)
        if (target.storyLineId !== 'SL_TS' && target.storyLineId !== 'SL_COLLAB') {
          storyRegistry.forEach((s) => {
            if (s.storyLineId === target.storyLineId) {
              ids.add(s.id);
            }
          });
        }
        // 직계 및 교차 연결된 모든 노드 포함
        allConnections.forEach((c) => {
          const isSameLineSeries =
            c.type === 'series' &&
            storyMap.get(c.fromId)?.storyLineId === target.storyLineId &&
            target.storyLineId !== 'SL_TS';
          const isDirectTouch = c.fromId === target.id || c.toId === target.id;

          if (isSameLineSeries || isDirectTouch) {
            conns.push(c);
            ids.add(c.fromId);
            ids.add(c.toId);
          }
        });
      }
    }

    return { highlightedStoryIds: ids, activeConnections: conns };
  }, [focusedLineId, activeTargetId, allConnections, storyMap]);

  // 스테이지 내 모든 노드의 로컬 좌표(스케일 무관 offset 기준) 계산
  const measureNodePositions = useCallback(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const coords: Record<string, NodeBox> = {};

    nodeRefs.current.forEach((el, id) => {
      if (!el) return;
      let x = 0;
      let y = 0;
      let curr: HTMLElement | null = el;
      while (curr && curr !== stageEl) {
        x += curr.offsetLeft;
        y += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      coords[id] = {
        left: x,
        right: x + w,
        top: y,
        bottom: y + h,
        centerX: x + w / 2,
        centerY: y + h / 2,
      };
    });

    setNodeCoords(coords);
  }, []);

  useEffect(() => {
    if (browseMode !== 'chronological') return;
    const timer = window.setTimeout(measureNodePositions, 60);
    window.addEventListener('resize', measureNodePositions);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measureNodePositions);
    };
  }, [browseMode, searchQuery, statusFilter, zoomLevel, inspectedStory, measureNodePositions]);

  // 마우스 드래그 캔버스 이동
  useEffect(() => {
    if (browseMode !== 'chronological') return;

    const onPointerMove = (e: PointerEvent) => {
      if (!dragTrackingRef.current.isDown) return;
      const dx = e.clientX - dragTrackingRef.current.startX;
      const dy = e.clientY - dragTrackingRef.current.startY;
      const dist = Math.hypot(dx, dy);

      dragTrackingRef.current.moveDistance = dist;
      if (dist > 5) {
        dragTrackingRef.current.hasMoved = true;
      }

      setPanPos({
        x: dragTrackingRef.current.initialPanX + dx,
        y: dragTrackingRef.current.initialPanY + dy,
      });
    };

    const onPointerUp = () => {
      if (!dragTrackingRef.current.isDown) return;
      dragTrackingRef.current.isDown = false;
      setIsDraggingCanvas(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [browseMode]);

  // 휠 스크롤 및 Ctrl+휠 줌
  useEffect(() => {
    if (browseMode !== 'chronological') return;
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = Math.exp(-e.deltaY * 0.0022);
        setZoomLevel((prevScale) => {
          const nextScale = Math.min(1.6, Math.max(0.45, Number((prevScale * zoomFactor).toFixed(2))));
          if (nextScale !== prevScale) {
            const ratio = nextScale / prevScale;
            setPanPos((prevPan) => ({
              x: mouseX - (mouseX - prevPan.x) * ratio,
              y: mouseY - (mouseY - prevPan.y) * ratio,
            }));
          }
          return nextScale;
        });
      } else {
        setPanPos((prevPan) => ({
          x: prevPan.x - (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : e.deltaY * 0.85),
          y: e.shiftKey ? prevPan.y : prevPan.y - e.deltaY * 0.45,
        }));
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [browseMode]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragTrackingRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panPos.x,
      initialPanY: panPos.y,
      hasMoved: false,
      moveDistance: 0,
    };
    setIsDraggingCanvas(true);
  };

  // 특정 스토리 노드로 카메라 부드럽게 포커싱
  const focusOnStoryNode = useCallback(
    (storyId: string) => {
      const story = storyMap.get(storyId);
      if (!story) return;
      playClickSound();
      setInspectedStory(story);

      if (browseMode === 'chronological') {
        const coord = nodeCoords[storyId];
        const container = containerRef.current;
        if (coord && container) {
          const targetX = container.clientWidth * 0.42 - coord.centerX * zoomLevel;
          const targetY = container.clientHeight * 0.48 - coord.centerY * zoomLevel;
          setPanPos({ x: targetX, y: targetY });
        }
      }
    },
    [browseMode, nodeCoords, storyMap, zoomLevel]
  );

  // 특정 시대로 카메라 이동 (모바일 세로 타임라인 & 데스크톱 2D 캔버스 겸용)
  const scrollToEra = (eraId: string) => {
    playClickSound();
    if (isMobile && !mobileChronoCanvas) {
      const mobileTarget = document.getElementById(`mobile-era-${eraId}`);
      if (mobileTarget) {
        mobileTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    const target = document.getElementById(`matrix-era-${eraId}`);
    if (target) {
      setPanPos((prev) => ({
        x: 48 - target.offsetLeft * zoomLevel,
        y: prev.y,
      }));
    }
  };

  const handleZoomStep = (delta: number) => {
    playClickSound();
    const container = containerRef.current;
    if (!container) return;
    const nextScale = Math.min(1.6, Math.max(0.45, Number((zoomLevel + delta).toFixed(2))));
    if (nextScale === zoomLevel) return;

    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    const ratio = nextScale / zoomLevel;

    setPanPos((prev) => ({
      x: centerX - (centerX - prev.x) * ratio,
      y: centerY - (centerY - prev.y) * ratio,
    }));
    setZoomLevel(nextScale);
  };

  const handleResetView = () => {
    playClickSound();
    setZoomLevel(0.88);
    setPanPos({ x: 36, y: 24 });
  };

  const handleFitAll = () => {
    playClickSound();
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;
    const scaleX = (container.clientWidth - 60) / (stage.scrollWidth || 3200);
    const scaleY = (container.clientHeight - 60) / (stage.scrollHeight || 1100);
    const fitScale = Math.min(1.0, Math.max(0.45, Number(Math.min(scaleX, scaleY).toFixed(2))));
    setZoomLevel(fitScale);
    setPanPos({ x: 28, y: 20 });
  };

  const availableCount = useMemo(
    () => storyRegistry.filter((s) => getStoryAccessState(s) === 'available').length,
    []
  );
  const overviewOnlyCount = useMemo(
    () => storyRegistry.filter((s) => getStoryAccessState(s) === 'overview_only').length,
    []
  );

  // 선택된 스토리의 선행 / 후속 / 교차 연결 정보 계산
  const inspectedConnections = useMemo(() => {
    if (!inspectedStory) return { incoming: [], outgoing: [] };
    const incoming = allConnections
      .filter((c) => c.toId === inspectedStory.id)
      .map((c) => ({ ...c, story: storyMap.get(c.fromId)! }))
      .filter((c) => Boolean(c.story));
    const outgoing = allConnections
      .filter((c) => c.fromId === inspectedStory.id)
      .map((c) => ({ ...c, story: storyMap.get(c.toId)! }))
      .filter((c) => Boolean(c.story));
    return { incoming, outgoing };
  }, [inspectedStory, allConnections, storyMap]);

  const isSemanticCompact = zoomLevel < 0.7;

  const cycleMobileStatusFilter = () => {
    playClickSound();
    setStatusFilter((prev) =>
      prev === 'all' ? 'available' : prev === 'available' ? 'overview_only' : 'all'
    );
  };

  return (
    <div
      className={`relative flex-1 w-full ${
        isHeaderCollapsed
          ? 'h-[100dvh] md:h-screen'
          : 'h-[calc(100dvh-6.25rem)] md:h-[calc(100vh-3.5rem)]'
      } bg-[#06080e] overflow-hidden select-none flex flex-col font-sans animate-fadeIn`}
    >
      {/* =========================================================================
          1-A. MOBILE NATIVE COMPACT 2-ROW COMMAND BAR (md:hidden)
      ========================================================================= */}
      <div className="md:hidden flex-shrink-0 z-30 bg-[#090b10]/95 backdrop-blur-xl border-b border-white/[0.08] px-3 py-2 space-y-2 shadow-lg">
        {/* Row 1: 3 Mode Segmented Tabs + Search Icon + Status Cycle + Fullscreen */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 grid grid-cols-3 p-0.5 rounded-[5px] bg-white/[0.04] border border-white/[0.08] text-[11px] font-sans">
            <button
              onClick={() => {
                playTabSwitchSound();
                setBrowseMode('chronological');
              }}
              className={`h-7 rounded-[4px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                browseMode === 'chronological'
                  ? 'bg-[#ffe600] text-black font-extrabold shadow-xs'
                  : 'text-zinc-400 font-medium'
              }`}
            >
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>시간순</span>
            </button>
            <button
              onClick={() => {
                playTabSwitchSound();
                setBrowseMode('story_line');
              }}
              className={`h-7 rounded-[4px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                browseMode === 'story_line'
                  ? 'bg-[#ffe600] text-black font-extrabold shadow-xs'
                  : 'text-zinc-400 font-medium'
              }`}
            >
              <GitBranch className="w-3 h-3 flex-shrink-0" />
              <span>서사별</span>
            </button>
            <button
              onClick={() => {
                playTabSwitchSound();
                setBrowseMode('release');
              }}
              className={`h-7 rounded-[4px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                browseMode === 'release'
                  ? 'bg-[#ffe600] text-black font-extrabold shadow-xs'
                  : 'text-zinc-400 font-medium'
              }`}
            >
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>출시순</span>
            </button>
          </div>

          {/* Search Toggle Button */}
          <button
            onClick={() => {
              playClickSound();
              setIsMobileSearchOpen((p) => !p);
            }}
            className={`w-8 h-8 rounded-[5px] border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
              isMobileSearchOpen || searchQuery
                ? 'bg-[#ffe600]/20 border-[#ffe600] text-[#ffe600]'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-300'
            }`}
            title="스토리 검색"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Status Filter Cycle Button (전체 90 -> 요약본 13 -> 개요 72) */}
          <button
            onClick={cycleMobileStatusFilter}
            className={`h-8 px-2.5 rounded-[5px] border text-[11px] font-sans flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer ${
              statusFilter === 'available'
                ? 'bg-[#ffe600]/20 border-[#ffe600]/60 text-[#ffe600] font-bold'
                : statusFilter === 'overview_only'
                ? 'bg-white/[0.12] border-white/30 text-white font-bold'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-300'
            }`}
            title="수록 상태 필터 전환"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                statusFilter === 'available'
                  ? 'bg-[#ffe600]'
                  : statusFilter === 'overview_only'
                  ? 'bg-zinc-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {statusFilter === 'available'
                ? `요약본 ${availableCount}`
                : statusFilter === 'overview_only'
                ? `개요 ${overviewOnlyCount}`
                : `전체 ${storyRegistry.length}`}
            </span>
          </button>

          {/* Fullscreen Toggle Button */}
          {onToggleHeaderCollapse && (
            <button
              onClick={() => {
                playClickSound();
                onToggleHeaderCollapse();
              }}
              className={`h-8 rounded-[5px] border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                isHeaderCollapsed
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-bold px-2 gap-1'
                  : 'w-8 bg-white/[0.04] border-white/[0.08] text-zinc-300'
              }`}
              title={isHeaderCollapsed ? '메뉴 복원' : '꽉 찬 화면'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {isHeaderCollapsed && <span className="text-[11px] font-sans">복원</span>}
            </button>
          )}
        </div>

        {/* Expandable Search Input Row */}
        {(isMobileSearchOpen || searchQuery) && (
          <div className="relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="스토리명, 작전 코드(EP/SID), 연도 검색..."
                autoFocus={isMobileSearchOpen}
                className="w-full h-8 pl-8 pr-8 bg-black/60 border border-[#ffe600]/50 rounded-[4px] text-xs font-sans text-white placeholder:text-zinc-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setIsMobileSearchOpen(false);
              }}
              className="h-8 px-2.5 rounded-[4px] bg-white/[0.06] text-zinc-300 text-[11px] flex-shrink-0 cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}

        {/* Row 2: Context-Sensitive Single-Line Horizontal Scroll Chips (Hidden in Fullscreen to maximize content) */}
        {!isHeaderCollapsed && browseMode === 'chronological' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {/* 세로 타임라인 vs 2D 노선도 전환 칩 */}
            <button
              onClick={() => {
                playClickSound();
                setMobileChronoCanvas((p) => !p);
              }}
              className={`h-6.5 px-2.5 text-[11px] rounded-full border flex items-center gap-1 flex-shrink-0 font-bold cursor-pointer transition-colors ${
                mobileChronoCanvas
                  ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                  : 'bg-[#ffe600]/15 border-[#ffe600]/60 text-[#ffe600]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{mobileChronoCanvas ? '2D 노선도 뷰' : '세로 타임라인'}</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10 flex-shrink-0 mx-0.5" />

            {TIMELINE_ERAS.map((era) => (
              <button
                key={era.id}
                onClick={() => scrollToEra(era.id)}
                className="h-6.5 px-2.5 text-[11px] rounded-full border border-white/[0.1] bg-white/[0.03] active:bg-white/[0.12] text-zinc-200 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: era.color }} />
                <span className="font-mono font-bold text-[10.5px] text-white">{era.code}</span>
                <span className="text-[10.5px] text-zinc-300">{era.titleKo.split('·')[0].trim()}</span>
              </button>
            ))}
          </div>
        )}

        {!isHeaderCollapsed && browseMode === 'story_line' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {STORY_LINES.map((line) => {
              const isSelected = activeStoryLineHubId === line.id;
              const shortLabel = line.id.startsWith('MAIN_')
                ? line.titleKo.replace('내일을 위하여 · ', '')
                : line.titleKo;
              return (
                <button
                  key={line.id}
                  onClick={() => {
                    playClickSound();
                    setActiveStoryLineHubId(line.id);
                  }}
                  className={`h-7 px-2.5 text-[11px] rounded-full border flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ffe600] text-black border-[#ffe600] font-extrabold shadow-xs'
                      : 'bg-white/[0.03] border-white/[0.09] text-zinc-300'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isSelected ? '#000000' : line.themeColor }}
                  />
                  <span>{shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}

        {!isHeaderCollapsed && browseMode === 'release' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              onClick={() => {
                playClickSound();
                setSelectedReleaseYear('all');
              }}
              className={`h-6.5 px-2.5 text-[11px] rounded-full border flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                selectedReleaseYear === 'all'
                  ? 'bg-[#ffe600] text-black border-[#ffe600] font-extrabold'
                  : 'bg-white/[0.03] border-white/[0.09] text-zinc-300'
              }`}
            >
              <span>전체 연차</span>
            </button>
            {RELEASE_YEARS_META.map((ym) => (
              <button
                key={ym.year}
                onClick={() => {
                  playClickSound();
                  setSelectedReleaseYear(ym.year);
                }}
                className={`h-6.5 px-2.5 text-[11px] rounded-full border flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  selectedReleaseYear === ym.year
                    ? 'bg-[#ffe600] text-black border-[#ffe600] font-extrabold'
                    : 'bg-white/[0.03] border-white/[0.09] text-zinc-300'
                }`}
              >
                <span className="font-mono font-bold text-[10.5px]">Y{ym.year}</span>
                <span className="text-[10.5px] opacity-85">{ym.period}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          1-B. DESKTOP MASTER COMMAND HUD BAR (hidden md:block)
      ========================================================================= */}
      <div className="hidden md:block flex-shrink-0 z-30 bg-[#090b10]/92 backdrop-blur-xl border-b border-white/[0.08] px-4 lg:px-8 py-2.5 space-y-2 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Left: Title & Archive Metrics */}
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4 bg-[#ffe600] rounded-[1px] shadow-[0_0_8px_rgba(255,230,0,0.4)]" />
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm sm:text-[15px] font-extrabold text-white tracking-tight font-sans">
                스토리 연대기 & 분류
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-white/[0.04] text-zinc-400 border border-white/[0.08] rounded-[3px]">
                CHRONICLE
              </span>
            </div>
          </div>

          {/* Right: 3 View Mode Tabs + Search + Status Filter + Fullscreen Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 3대 브라우징 모드 전환 (Header GNB와 동일한 글래스 세그먼트 디자인) */}
            <div className="flex items-center gap-1 p-1 rounded-[4px] bg-white/[0.03] border border-white/[0.07] text-xs font-sans">
              <button
                onClick={() => {
                  playTabSwitchSound();
                  setBrowseMode('chronological');
                }}
                className={`relative h-7 px-3 rounded-[3px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  browseMode === 'chronological'
                    ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                <Clock
                  className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    browseMode === 'chronological' ? 'text-[#ffe600]' : 'text-zinc-500'
                  }`}
                />
                <span>시간순 (연대기)</span>
                {browseMode === 'chronological' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ffe600] rounded-full shadow-[0_0_8px_#ffe600]" />
                )}
              </button>

              <button
                onClick={() => {
                  playTabSwitchSound();
                  setBrowseMode('story_line');
                }}
                className={`relative h-7 px-3 rounded-[3px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  browseMode === 'story_line'
                    ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                <GitBranch
                  className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    browseMode === 'story_line' ? 'text-[#ffe600]' : 'text-zinc-500'
                  }`}
                />
                <span>서사별 (시리즈)</span>
                {browseMode === 'story_line' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ffe600] rounded-full shadow-[0_0_8px_#ffe600]" />
                )}
              </button>

              <button
                onClick={() => {
                  playTabSwitchSound();
                  setBrowseMode('release');
                }}
                className={`relative h-7 px-3 rounded-[3px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  browseMode === 'release'
                    ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                <Calendar
                  className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    browseMode === 'release' ? 'text-[#ffe600]' : 'text-zinc-500'
                  }`}
                />
                <span>출시순</span>
                {browseMode === 'release' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ffe600] rounded-full shadow-[0_0_8px_#ffe600]" />
                )}
              </button>
            </div>

            {/* Instant Search */}
            <div className="relative w-44 sm:w-52">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="스토리명, 코드, 연도 검색..."
                className="w-full h-8 pl-8 pr-7 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-black/60 border border-white/[0.08] focus:border-[#ffe600]/60 rounded-[3px] text-xs font-sans text-white placeholder:text-zinc-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 수록 상태 필터 (세그먼트 글래스 바) */}
            <div className="flex items-center gap-0.5 p-1 rounded-[4px] bg-white/[0.03] border border-white/[0.07] text-xs font-sans">
              <button
                onClick={() => setStatusFilter('all')}
                className={`h-7 px-2.5 rounded-[3px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'all'
                    ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span>전체</span>
                <span className="font-mono text-[11px] text-zinc-400">{storyRegistry.length}</span>
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`h-7 px-2.5 rounded-[3px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'available'
                    ? 'bg-[#ffe600]/15 text-[#ffe600] font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                <span>요약본</span>
                <span className="font-mono text-[11px] opacity-85">{availableCount}</span>
              </button>
              <button
                onClick={() => setStatusFilter('overview_only')}
                className={`h-7 px-2.5 rounded-[3px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'overview_only'
                    ? 'bg-white/[0.1] text-zinc-100 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>개요</span>
                <span className="font-mono text-[11px] opacity-85">{overviewOnlyCount}</span>
              </button>
            </div>

            {/* 꽉 찬 화면 토글 버튼 */}
            {onToggleHeaderCollapse && (
              <button
                onClick={() => {
                  playClickSound();
                  onToggleHeaderCollapse();
                }}
                className={`h-7 px-2.5 rounded-[3px] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium border ${
                  isHeaderCollapsed
                    ? 'bg-[#ffe600] text-black border-[#ffe600] font-bold'
                    : 'bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border-white/[0.1]'
                }`}
                title={isHeaderCollapsed ? '상단 메뉴 복원' : '상단 메뉴 접기 (꽉 찬 화면)'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isHeaderCollapsed ? '메뉴 복원' : '꽉 찬 화면'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Bar for Chronological Mode: Era Quick Jump + Story Line Trajectory Focus */}
        {browseMode === 'chronological' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] font-sans">
            {/* 시대 점프 버튼 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1.5 flex-shrink-0">
                <Compass className="w-3.5 h-3.5 text-[#ffe600]" />
                <span>시대 이동</span>
              </span>
              {TIMELINE_ERAS.map((era) => (
                <button
                  key={era.id}
                  onClick={() => scrollToEra(era.id)}
                  className="h-6.5 px-2.5 text-[11px] rounded-[3px] border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.09] hover:border-white/25 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: era.color }} />
                  <span className="font-mono font-bold text-white text-[10.5px]">{era.code}</span>
                  <span className="text-zinc-400 group-hover:text-zinc-200 hidden sm:inline">
                    {era.titleKo.split('·')[0].trim()}
                  </span>
                </button>
              ))}
            </div>

            {/* 서사 궤적 하이라이트 필터 */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1.5 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>시리즈 강조</span>
              </span>
              <button
                onClick={() => {
                  playClickSound();
                  setFocusedLineId(null);
                }}
                className={`h-6.5 px-2.5 text-[11px] rounded-[3px] border transition-all cursor-pointer flex-shrink-0 ${
                  focusedLineId === null
                    ? 'bg-white/[0.12] text-white border-white/30 font-bold'
                    : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:bg-white/[0.05]'
                }`}
              >
                전체 표시
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setFocusedLineId(focusedLineId === 'MAIN_ALL' ? null : 'MAIN_ALL');
                }}
                className={`h-6.5 px-2.5 text-[11px] rounded-[3px] border transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                  focusedLineId === 'MAIN_ALL'
                    ? 'bg-[#ffe600]/15 text-[#ffe600] border-[#ffe600]/60 font-bold'
                    : 'bg-white/[0.02] text-zinc-300 border-white/[0.06] hover:bg-white/[0.05] hover:border-white/20'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                <span>메인 테마</span>
              </button>
              {STORY_LINES.filter((l) => !l.id.startsWith('MAIN_') && l.id !== 'SL_COLLAB').map((line) => {
                const isFocused = focusedLineId === line.id;
                return (
                  <button
                    key={line.id}
                    onClick={() => {
                      playClickSound();
                      setFocusedLineId(isFocused ? null : line.id);
                    }}
                    className={`h-6.5 px-2.5 text-[11px] rounded-[3px] border transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                      isFocused
                        ? 'text-white font-bold shadow-xs'
                        : 'bg-white/[0.02] text-zinc-300 border-white/[0.06] hover:bg-white/[0.05] hover:border-white/20'
                    }`}
                    style={
                      isFocused
                        ? {
                            backgroundColor: `${line.themeColor}26`,
                            borderColor: line.themeColor,
                            color: '#ffffff',
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: line.themeColor }}
                    />
                    <span>{line.titleKo}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. MAIN WORKSPACE AREA (LEFT/CENTER VIEWPORT + RIGHT BRIEFING DOCK)
      ========================================================================= */}
      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        {/* -----------------------------------------------------------------------
            MODE A-1: MOBILE NATIVE VERTICAL ERA TIMELINE STREAM (모바일 기본 시간순 뷰)
        ----------------------------------------------------------------------- */}
        {browseMode === 'chronological' && isMobile && !mobileChronoCanvas && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 bg-[#06080e] prts-scrollbar">
            {/* 상단 권역/시리즈 필터 칩 바 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => {
                  playClickSound();
                  setFocusedLineId(null);
                }}
                className={`h-6.5 px-2.5 text-[11px] rounded-full border flex-shrink-0 cursor-pointer ${
                  focusedLineId === null
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-white/[0.03] text-zinc-400 border-white/[0.08]'
                }`}
              >
                전체 노선
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setFocusedLineId(focusedLineId === 'MAIN_ALL' ? null : 'MAIN_ALL');
                }}
                className={`h-6.5 px-2.5 text-[11px] rounded-full border flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  focusedLineId === 'MAIN_ALL'
                    ? 'bg-[#ffe600]/20 text-[#ffe600] border-[#ffe600] font-bold'
                    : 'bg-white/[0.03] text-zinc-300 border-white/[0.08]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                <span>메인 테마</span>
              </button>
              {STORY_LINES.filter((l) => !l.id.startsWith('MAIN_') && l.id !== 'SL_COLLAB').map((line) => {
                const isFocused = focusedLineId === line.id;
                return (
                  <button
                    key={line.id}
                    onClick={() => {
                      playClickSound();
                      setFocusedLineId(isFocused ? null : line.id);
                    }}
                    className={`h-6.5 px-2.5 text-[11px] rounded-full border flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                      isFocused
                        ? 'text-white font-bold'
                        : 'bg-white/[0.03] text-zinc-300 border-white/[0.08]'
                    }`}
                    style={
                      isFocused
                        ? {
                            backgroundColor: `${line.themeColor}28`,
                            borderColor: line.themeColor,
                          }
                        : undefined
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: line.themeColor }} />
                    <span>{line.titleKo}</span>
                  </button>
                );
              })}
            </div>

            {/* 5대 시대별 세로 타임라인 스트림 */}
            {TIMELINE_ERAS.map((era) => {
              const eraStories = applyFilters(
                storyRegistry
                  .filter(
                    (s) =>
                      s.chronologicalOrder >= era.minOrder &&
                      s.chronologicalOrder <= era.maxOrder &&
                      (!focusedLineId ||
                        s.storyLineId === focusedLineId ||
                        (focusedLineId === 'MAIN_ALL' && s.storyLineId.startsWith('MAIN_')))
                  )
                  .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder)
              );

              if (eraStories.length === 0) return null;

              return (
                <section key={era.id} id={`mobile-era-${era.id}`} className="space-y-2.5 scroll-mt-2">
                  {/* Sticky Era Header Banner */}
                  <div
                    className="sticky top-0 z-20 rounded-[6px] bg-[#0b0f19]/95 backdrop-blur-md border border-white/[0.1] p-3 shadow-lg"
                    style={{ borderLeftWidth: '4px', borderLeftColor: era.color }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 text-[10.5px] font-mono font-black text-black rounded-[2px]"
                          style={{ backgroundColor: era.color }}
                        >
                          {era.code}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#ffe600]">
                          {era.periodKo}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded">
                        {eraStories.length}개 작전
                      </span>
                    </div>
                    <h2 className="text-sm font-extrabold text-white mt-1 tracking-tight">
                      {era.titleKo}
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{era.description}</p>
                  </div>

                  {/* Era Stories Vertical Rail */}
                  <div
                    className="ml-2 pl-3 border-l-2 space-y-2.5"
                    style={{ borderLeftColor: `${era.color}40` }}
                  >
                    {eraStories.map((story) => {
                      const accessState = getStoryAccessState(story);
                      const isRestored = accessState === 'available';
                      const isSelected = inspectedStory?.id === story.id;
                      const lineMeta = lineMetaMap.get(story.storyLineId);
                      const accentColor = lineMeta?.themeColor || era.color;
                      const cleanTimeline = story.timeline
                        .replace(/^테라력\s*/, '')
                        .replace(/\s*\([^)]*\)/g, '')
                        .trim();

                      return (
                        <div
                          key={story.id}
                          onClick={() => {
                            playClickSound();
                            setInspectedStory(story);
                          }}
                          style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
                          className={`relative rounded-[6px] border p-3 transition-all cursor-pointer overflow-hidden ${
                            isSelected
                              ? 'bg-[#131826] border-[#ffe600] ring-1 ring-[#ffe600]'
                              : isRestored
                              ? 'bg-[#0d111c] border-[#ffe600]/40'
                              : 'bg-[#0b0e17] border-white/[0.1]'
                          }`}
                        >
                          {/* Background Visual */}
                          {story.splashVisualUrl && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <img
                                src={resolveAssetUrl(story.splashVisualUrl)}
                                alt=""
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full h-full object-cover opacity-35 select-none"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-[#090c14] via-[#090c14]/85 to-[#090c14]/55" />
                            </div>
                          )}

                          <div className="relative z-10 flex items-center justify-between gap-2 text-[10.5px] font-mono">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`px-1.5 py-0.5 font-black rounded-[2px] flex-shrink-0 ${
                                  isRestored
                                    ? 'bg-[#ffe600] text-black'
                                    : 'bg-black/80 text-white border border-white/20'
                                }`}
                              >
                                {story.code}
                              </span>
                              <span className="text-zinc-300 truncate">{cleanTimeline}</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isRestored && (
                                <span className="px-1.5 py-0.5 bg-[#ffe600]/20 border border-[#ffe600]/60 text-[#ffe600] text-[9.5px] font-bold rounded-[2px]">
                                  요약본
                                </span>
                              )}
                              <span
                                className="px-1.5 py-0.5 text-[10px] rounded bg-black/70 border border-white/10 font-bold"
                                style={{ color: accentColor }}
                              >
                                {lineMeta?.titleKo.replace('내일을 위하여 · ', '')}
                              </span>
                            </div>
                          </div>

                          <div className="relative z-10 mt-1.5 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-white leading-snug truncate">
                                {story.titleKo}
                              </h3>
                              <p className="text-[11px] text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed">
                                {story.officialSynopsis}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playOpenSound();
                                onSelectStory(story.id);
                              }}
                              className={`flex-shrink-0 h-8 px-2.5 rounded-[4px] text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer ${
                                isRestored
                                  ? 'bg-[#ffe600] text-black shadow-xs'
                                  : 'bg-white/[0.08] text-zinc-200 border border-white/15'
                              }`}
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{isRestored ? '열람' : '개요'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* -----------------------------------------------------------------------
            MODE A-2: CHRONOLOGICAL MULTI-LANE 2D MATRIX CANVAS
        ----------------------------------------------------------------------- */}
        {browseMode === 'chronological' && (!isMobile || mobileChronoCanvas) && (
          <div
            ref={containerRef}
            onPointerDown={handleCanvasPointerDown}
            className={`relative flex-1 h-full overflow-hidden bg-[#05070c] select-none ${
              isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Tactical Wargame Grid Background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25 bg-[linear-gradient(to_right,#182032_1px,transparent_1px),linear-gradient(to_bottom,#182032_1px,transparent_1px)] bg-[size:48px_48px]"
              style={{
                backgroundPosition: `${panPos.x % 48}px ${panPos.y % 48}px`,
              }}
            />

            {/* 2D Transform Stage */}
            <div
              ref={stageRef}
              className="absolute left-0 top-0 origin-top-left will-change-transform"
              style={{
                transform: `translate3d(${panPos.x}px, ${panPos.y}px, 0) scale(${zoomLevel})`,
                transition: isDraggingCanvas ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* SVG CONSTELLATION OVERLAY (서사 직계 및 교차 인과 연결선 - z-30 반투명 상단 오버레이 + 행간 통로 우회 라우팅) */}
              <svg
                className="absolute inset-0 pointer-events-none z-30 overflow-visible"
                style={{ width: '100%', height: '100%' }}
              >
                <defs>
                  <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* 1) 기본 배경 연작 연결선 (반투명 상단 오버레이 + 줄바꿈 통로 라우팅) */}
                {allConnections
                  .filter((c) => c.type === 'series')
                  .map((conn) => {
                    const from = nodeCoords[conn.fromId];
                    const to = nodeCoords[conn.toId];
                    if (!from || !to) return null;

                    const { d, startX, startY, endX, endY } = buildSmartConnectionPath(from, to, false);
                    const isAnyHighlighted = highlightedStoryIds.size > 0;

                    return (
                      <g key={`bg-${conn.fromId}-${conn.toId}`}>
                        <path
                          d={d}
                          fill="none"
                          stroke={conn.color}
                          strokeWidth={1.75}
                          strokeOpacity={isAnyHighlighted ? 0.12 : 0.48}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {!isAnyHighlighted && (
                          <>
                            <circle
                              cx={startX}
                              cy={startY}
                              r={2.2}
                              fill={conn.color}
                              fillOpacity={0.6}
                            />
                            <circle
                              cx={endX}
                              cy={endY}
                              r={2.6}
                              fill={conn.color}
                              fillOpacity={0.75}
                            />
                          </>
                        )}
                      </g>
                    );
                  })}

                {/* 2) 포커스/호버 시 활성화되는 하이라이트 궤적 (직계 실선 + 교차 점선, 반투명 네온 발광) */}
                {activeConnections.map((conn) => {
                  const from = nodeCoords[conn.fromId];
                  const to = nodeCoords[conn.toId];
                  if (!from || !to) return null;

                  const isCross = conn.type === 'cross';
                  const { d, startX, startY, endX, endY } = buildSmartConnectionPath(from, to, isCross);
                  const strokeColor = isCross ? '#ffe600' : conn.color;

                  return (
                    <g key={`active-${conn.fromId}-${conn.toId}`}>
                      {/* 외곽 반투명 코어 광원 */}
                      <path
                        d={d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isCross ? 4.5 : 5}
                        strokeOpacity={0.22}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* 메인 궤적 선 (반투명 처리로 카드 텍스트 가독성 유지) */}
                      <path
                        d={d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isCross ? 2.2 : 2.6}
                        strokeDasharray={isCross ? '6 4' : undefined}
                        strokeOpacity={0.82}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow-line)"
                      />
                      <circle cx={startX} cy={startY} r={3.2} fill={strokeColor} fillOpacity={0.9} />
                      <circle cx={endX} cy={endY} r={4} fill={strokeColor} fillOpacity={0.95} />
                    </g>
                  );
                })}
              </svg>

              {/* MATRIX TABLE STRUCTURE: LEFT LANE HEADERS + 5 ERA COLUMNS */}
              <div className="inline-flex flex-col p-6 gap-0 min-w-max">
                {/* TOP ROW: ERA HEADERS */}
                <div className="flex items-stretch gap-5 mb-4">
                  {/* Top-Left Corner Legend */}
                  <div className="w-56 flex-shrink-0 bg-[#0b0e17] border border-white/[0.1] rounded-[3px] p-3.5 flex flex-col justify-between">
                    <div className="text-[10px] font-mono text-[#ffe600] font-bold tracking-widest uppercase">
                      STRATEGIC THEATERS
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      6대 서사 노선 × 5대 시대
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-0.5 bg-[#38bdf8] inline-block" /> 직계 연작
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-0.5 border-b border-dashed border-[#ffe600] inline-block" /> 교차 인과
                      </span>
                    </div>
                  </div>

                  {/* 5 Era Column Headers */}
                  {TIMELINE_ERAS.map((era) => {
                    const eraStories = applyFilters(
                      storyRegistry.filter(
                        (s) => s.chronologicalOrder >= era.minOrder && s.chronologicalOrder <= era.maxOrder
                      )
                    );
                    return (
                      <div
                        key={era.id}
                        id={`matrix-era-${era.id}`}
                        style={{
                          minWidth: era.id === 'era_03' ? '980px' : era.id === 'era_02' ? '760px' : '540px',
                          borderTopColor: era.color,
                        }}
                        className="flex-1 bg-[#0b0f19]/95 border border-white/[0.1] border-t-4 rounded-[3px] p-3.5 flex flex-col justify-between shadow-xl"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 text-[11px] font-mono font-black text-black rounded-[1px]"
                              style={{ backgroundColor: era.color }}
                            >
                              {era.code}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#ffe600]">
                              {era.periodKo}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded-[2px]">
                            {eraStories.length}개 작전
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <h2 className="text-sm font-bold text-white tracking-tight">
                            {era.titleKo}
                            <span className="text-xs font-mono text-zinc-500 font-normal ml-2">
                              / {era.titleEn}
                            </span>
                          </h2>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{era.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 6 STRATEGIC LANES ROWS */}
                <div className="space-y-3">
                  {STRATEGIC_LANES.map((lane) => {
                    const isCore = lane.id === 'LANE_CORE';
                    return (
                      <div key={lane.id} className="flex items-stretch gap-5">
                        {/* Left Lane Header Station */}
                        <div
                          className={`w-56 flex-shrink-0 rounded-[3px] border p-3.5 flex flex-col justify-center relative overflow-hidden ${
                            isCore
                              ? 'bg-[#121318] border-[#ffe600]/45 shadow-[0_0_20px_rgba(255,230,0,0.06)]'
                              : 'bg-[#0a0d16] border-white/[0.08]'
                          }`}
                          style={{ borderLeftWidth: '4px', borderLeftColor: lane.color }}
                        >
                          <div className="text-[10px] font-mono font-bold tracking-wider uppercase" style={{ color: lane.color }}>
                            {lane.code}
                          </div>
                          <div className="text-xs font-bold text-white mt-0.5 leading-snug">
                            {lane.titleKo}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                            {lane.subtitleKo}
                          </div>
                          {/* 소속 서사 라인 태그 */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lane.storyLineIds
                              .filter((id) => !id.startsWith('MAIN_'))
                              .map((lineId) => {
                                const lm = lineMetaMap.get(lineId);
                                if (!lm) return null;
                                const isFocused = focusedLineId === lineId;
                                return (
                                  <button
                                    key={lineId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playClickSound();
                                      setFocusedLineId(isFocused ? null : lineId);
                                    }}
                                    className={`px-1.5 py-0.5 text-[9.5px] font-mono rounded-[2px] border transition-colors cursor-pointer ${
                                      isFocused
                                        ? 'bg-[#ffe600] text-black border-[#ffe600] font-bold'
                                        : 'bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:border-white/30'
                                    }`}
                                  >
                                    {lm.code} · {lm.titleKo}
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        {/* 5 Era Cells for this Lane */}
                        {TIMELINE_ERAS.map((era) => {
                          const cellStories = applyFilters(
                            storyRegistry
                              .filter(
                                (s) =>
                                  lane.storyLineIds.includes(s.storyLineId) &&
                                  s.chronologicalOrder >= era.minOrder &&
                                  s.chronologicalOrder <= era.maxOrder
                              )
                              .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder)
                          );

                          return (
                            <div
                              key={`${lane.id}-${era.id}`}
                              style={{
                                minWidth: era.id === 'era_03' ? '980px' : era.id === 'era_02' ? '760px' : '540px',
                              }}
                              className={`flex-1 rounded-[3px] border p-3.5 flex items-center relative ${
                                isCore
                                  ? 'bg-[#0d1018]/90 border-[#ffe600]/20'
                                  : 'bg-[#080b12]/80 border-white/[0.05]'
                              }`}
                            >
                              {/* 가로 배경 트랙 레일 선 */}
                              <div
                                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] pointer-events-none"
                                style={{
                                  backgroundColor: isCore ? 'rgba(255,230,0,0.18)' : 'rgba(255,255,255,0.05)',
                                }}
                              />

                              {cellStories.length === 0 ? (
                                <div className="w-full text-center text-[10px] font-mono text-zinc-700 select-none">
                                  —
                                </div>
                              ) : (
                                <div className="relative z-20 flex flex-wrap items-center gap-x-4 gap-y-5 py-1 w-full">
                                  {cellStories.map((story) => {
                                    const accessState = getStoryAccessState(story);
                                    const isRestored = accessState === 'available';
                                    const isLocked = accessState === 'locked';
                                    const isSelected = inspectedStory?.id === story.id;
                                    const isHovered = hoveredStoryId === story.id;
                                    const isDimmed =
                                      highlightedStoryIds.size > 0 && !highlightedStoryIds.has(story.id);
                                    const lineMeta = lineMetaMap.get(story.storyLineId);
                                    const accentColor = lineMeta?.themeColor || lane.color;
                                    const cleanTimeline = story.timeline
                                      .replace(/^테라력\s*/, '')
                                      .replace(/\s*\([^)]*\)/g, '')
                                      .trim();
                                    const shortLineTitle = story.storyLineId.startsWith('MAIN_ACT_')
                                      ? lineMeta?.code || lineMeta?.titleKo
                                      : lineMeta?.titleKo;

                                    return (
                                      <div
                                        key={story.id}
                                        ref={(el) => {
                                          if (el) nodeRefs.current.set(story.id, el);
                                          else nodeRefs.current.delete(story.id);
                                        }}
                                        onMouseEnter={() => setHoveredStoryId(story.id)}
                                        onMouseLeave={() => setHoveredStoryId(null)}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            dragTrackingRef.current.hasMoved ||
                                            dragTrackingRef.current.moveDistance > 5
                                          ) {
                                            return;
                                          }
                                          playClickSound();
                                          setInspectedStory(story);
                                        }}
                                        onDoubleClick={(e) => {
                                          e.stopPropagation();
                                          if (!isLocked) {
                                            playOpenSound();
                                            onSelectStory(story.id);
                                          }
                                        }}
                                        style={{
                                          borderLeftColor: accentColor,
                                          borderLeftWidth: '3px',
                                        }}
                                        className={`group relative rounded-[3px] border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                                          isSemanticCompact
                                            ? 'w-44 min-h-[68px] p-2.5'
                                            : lane.isCompactLane || story.isOmnibus
                                            ? 'w-48 min-h-[96px] p-2.5'
                                            : isCore
                                            ? 'w-56 min-h-[118px] p-3'
                                            : 'w-52 min-h-[110px] p-3'
                                        } ${
                                          isDimmed ? 'opacity-25 hover:opacity-90' : 'opacity-100'
                                        } ${
                                          isSelected
                                            ? 'bg-[#131826] border-[#ffe600] ring-2 ring-[#ffe600]/50 shadow-[0_0_20px_rgba(255,230,0,0.3)] -translate-y-0.5'
                                            : isHovered
                                            ? 'bg-[#111624] border-white/60 shadow-xl -translate-y-0.5'
                                            : isRestored
                                            ? 'bg-[#0c101a] border-[#ffe600]/45 hover:border-[#ffe600]'
                                            : isLocked
                                            ? 'bg-[#0d080b] border-red-950/70'
                                            : 'bg-[#0b0e17] border-white/[0.12] hover:border-white/35'
                                        }`}
                                      >
                                        {/* 배경 스플래시 이미지 (시맨틱 축소 모드가 아닐 때 표시) */}
                                        {!isSemanticCompact && story.splashVisualUrl && !isLocked && (
                                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                            <img
                                              src={resolveAssetUrl(story.splashVisualUrl)}
                                              alt=""
                                              draggable={false}
                                              onContextMenu={(e) => e.preventDefault()}
                                              className="w-full h-full object-cover object-center opacity-45 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300 select-none"
                                              onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/75 to-[#080b12]/30" />
                                          </div>
                                        )}

                                        {/* 상단: 작전 코드 + 수록/옴니버스 배지 */}
                                        <div className="relative z-10 flex items-center justify-between gap-1 text-[10px] font-mono">
                                          <span
                                            className={`px-1.5 py-0.5 font-black tracking-wider rounded-[1px] ${
                                              isRestored
                                                ? 'bg-[#ffe600] text-black'
                                                : isLocked
                                                ? 'bg-red-950 text-red-300 border border-red-800/60'
                                                : 'bg-black/80 text-zinc-200 border border-white/15'
                                            }`}
                                          >
                                            {story.code}
                                          </span>

                                          <div className="flex items-center gap-1">
                                            {story.isOmnibus && (
                                              <FilmReelIcon
                                                className="w-3.5 h-3.5 text-emerald-400"
                                                title="옴니버스 단편"
                                              />
                                            )}
                                            {isRestored && (
                                              <span
                                                className="px-1 py-0.2 bg-[#ffe600]/20 border border-[#ffe600]/60 text-[#ffe600] text-[9px] font-bold rounded-[1px]"
                                                title="전문 복원 완료"
                                              >
                                                전문
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* 중단: 한글 타이틀 & 영문 서브타이틀 */}
                                        <div className="relative z-10 my-auto py-1">
                                          <div className="text-xs sm:text-[13px] font-bold text-white group-hover:text-[#ffe600] transition-colors leading-snug truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                                            {story.titleKo}
                                          </div>
                                          {!isSemanticCompact && (
                                            <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                                              {story.titleEn}
                                            </div>
                                          )}
                                        </div>

                                        {/* 하단: 타임라인 연도 및 서사 소속 */}
                                        {!isSemanticCompact && (
                                          <div className="relative z-10 pt-1 border-t border-white/[0.08] flex items-center justify-between gap-1.5 text-[10px] font-mono">
                                            <span className="text-zinc-300 truncate">{cleanTimeline}</span>
                                            <span
                                              className="text-[9.5px] font-bold flex-shrink-0"
                                              style={{ color: accentColor }}
                                            >
                                              {shortLineTitle}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom-Left Floating Controls Dock (Zoom, Fit, Reset) */}
            <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 p-1.5 rounded-[4px] bg-[#090c14]/95 backdrop-blur-md border border-white/[0.12] shadow-2xl font-mono text-xs">
              <div className="hidden sm:flex items-center gap-1.5 px-2 text-[10px] text-zinc-400 border-r border-white/10">
                <Move className="w-3 h-3 text-[#ffe600]" />
                <span>드래그: 이동 · Ctrl+휠: 줌 · 더블클릭: 즉시 열람</span>
              </div>

              <button
                onClick={() => handleZoomStep(-0.12)}
                className="w-7 h-7 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-[11px] font-bold text-[#ffe600] min-w-[44px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                onClick={() => handleZoomStep(0.12)}
                className="w-7 h-7 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

              <button
                onClick={handleFitAll}
                className="px-2 h-7 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center gap-1 text-[10.5px] cursor-pointer"
                title="전체 노선도 한눈에 맞춤"
              >
                <Maximize2 className="w-3 h-3 text-[#ffe600]" />
                <span className="hidden md:inline">전체 조망</span>
              </button>

              <button
                onClick={handleResetView}
                className="w-7 h-7 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
                title="기본 배율 복귀"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {onToggleHeaderCollapse && (
                <>
                  <div className="hidden md:block w-[1px] h-4 bg-white/10 mx-0.5" />
                  <button
                    onClick={onToggleHeaderCollapse}
                    className="hidden md:flex px-2 h-7 rounded-[2px] bg-white/[0.05] hover:bg-[#ffe600] text-zinc-300 hover:text-black items-center gap-1 text-[10.5px] cursor-pointer transition-colors"
                    title={isHeaderCollapsed ? '상단 메뉴 다시 열기' : '상단 메뉴 접기 (꽉 찬 화면)'}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span className="hidden md:inline">{isHeaderCollapsed ? '메뉴 복원' : '꽉 찬 화면'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            MODE B: STORY LINES HUB (서사별 마스터-디테일 계통도 뷰)
        ----------------------------------------------------------------------- */}
        {browseMode === 'story_line' && (
          <div className="flex-1 flex min-h-0 overflow-hidden bg-[#06080e]">
            {/* 좌측 17개 서사 라인 디렉토리 탭 (모바일에서는 상단 2행 가로 스크롤 칩 바로 대체하여 본문 100% 폭 확보) */}
            <div className="hidden md:block w-60 lg:w-72 flex-shrink-0 border-r border-white/[0.08] bg-[#080b12] overflow-y-auto p-3 space-y-4 prts-scrollbar">
              {/* 메인 테마 섹션 */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] font-mono font-bold text-[#ffe600] uppercase tracking-wider flex items-center justify-between">
                  <span>메인 테마 (내일을 위하여)</span>
                  <span>3개 부</span>
                </div>
                <div className="space-y-1">
                  {STORY_LINES.filter((l) => l.id.startsWith('MAIN_')).map((line) => {
                    const count = storyRegistry.filter((s) => s.storyLineId === line.id).length;
                    const isSelected = activeStoryLineHubId === line.id;
                    return (
                      <button
                        key={line.id}
                        onClick={() => {
                          playClickSound();
                          setActiveStoryLineHubId(line.id);
                        }}
                        className={`w-full px-3 py-2 rounded-[3px] border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#ffe600]/15 border-[#ffe600] text-white'
                            : 'bg-white/[0.02] border-white/[0.05] text-zinc-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-[10px] font-mono font-bold" style={{ color: line.themeColor }}>
                            {line.code}
                          </div>
                          <div className="text-xs font-bold truncate">
                            {line.titleKo.replace('내일을 위하여 · ', '')}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-zinc-400">
                          {count}편
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 14대 이벤트 서사 연작 섹션 */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider flex items-center justify-between">
                  <span>이벤트 서사 연작</span>
                  <span>14개 연작</span>
                </div>
                <div className="space-y-1">
                  {STORY_LINES.filter((l) => !l.id.startsWith('MAIN_')).map((line) => {
                    const lineStories = storyRegistry.filter((s) => s.storyLineId === line.id);
                    const restoredInLine = lineStories.some((s) => getStoryAccessState(s) === 'available');
                    const isSelected = activeStoryLineHubId === line.id;

                    return (
                      <button
                        key={line.id}
                        onClick={() => {
                          playClickSound();
                          setActiveStoryLineHubId(line.id);
                        }}
                        className={`w-full px-3 py-2 rounded-[3px] border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-white/[0.09] border-[#ffe600] text-white shadow-md'
                            : 'bg-white/[0.02] border-white/[0.05] text-zinc-300 hover:bg-white/[0.05]'
                        }`}
                        style={
                          isSelected ? { borderLeftWidth: '4px', borderLeftColor: line.themeColor } : undefined
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: line.themeColor }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate">{line.titleKo}</span>
                              <span className="text-[10px] font-mono text-zinc-500">{line.code}</span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 truncate">{line.titleEn}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {restoredInLine && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" title="전문 수록 포함" />
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-zinc-400">
                            {lineStories.length}편
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 우측 선택된 서사 라인의 상세 계통도 & 연작 카드 */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-8 prts-scrollbar">
              {(() => {
                const activeLine =
                  STORY_LINES.find((l) => l.id === activeStoryLineHubId) || STORY_LINES[0];
                const lineStories = applyFilters(
                  storyRegistry
                    .filter((s) => s.storyLineId === activeLine.id)
                    .sort((a, b) => a.seriesOrder - b.seriesOrder)
                );

                // 이 서사 라인과 타 서사 라인 간의 교차 연결 추출
                const lineStoryIds = new Set(lineStories.map((s) => s.id));
                const crossLinksForLine = allConnections.filter(
                  (c) =>
                    c.type === 'cross' &&
                    ((lineStoryIds.has(c.fromId) && !lineStoryIds.has(c.toId)) ||
                      (!lineStoryIds.has(c.fromId) && lineStoryIds.has(c.toId)))
                );

                return (
                  <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
                    {/* 서사 라인 헤더 배너 */}
                    <div
                      className="rounded-[6px] sm:rounded-[4px] bg-[#0b0f19] border border-white/[0.1] p-4 sm:p-6 relative overflow-hidden shadow-2xl"
                      style={{ borderLeftWidth: '5px', borderLeftColor: activeLine.themeColor }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="px-2 py-0.5 text-[11px] sm:text-xs font-mono font-black text-black rounded-[2px]"
                              style={{ backgroundColor: activeLine.themeColor }}
                            >
                              {activeLine.code}
                            </span>
                            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight break-keep">
                              {activeLine.titleKo}
                            </h2>
                            <span className="text-xs sm:text-sm font-mono text-zinc-400">/ {activeLine.titleEn}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-300 mt-2 max-w-3xl leading-relaxed break-keep">
                            {activeLine.description}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            playClickSound();
                            setFocusedLineId(activeLine.id);
                            setBrowseMode('chronological');
                          }}
                          className="px-3 py-1.5 sm:py-2 rounded-[3px] bg-white/[0.06] hover:bg-[#ffe600] hover:text-black text-zinc-200 border border-white/15 text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>연대기에서 이 시리즈 보기</span>
                        </button>
                      </div>

                      {/* 타 서사 교차 인과 요약 */}
                      {crossLinksForLine.length > 0 && (
                        <div className="mt-4 pt-3.5 border-t border-white/[0.08]">
                          <div className="text-[11px] font-mono text-[#ffe600] font-bold mb-2 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5" />
                            <span>타 시리즈와의 교차 연결 ({crossLinksForLine.length}건)</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {crossLinksForLine.map((cl) => {
                              const fromS = storyMap.get(cl.fromId);
                              const toS = storyMap.get(cl.toId);
                              if (!fromS || !toS) return null;
                              const otherStory = lineStoryIds.has(fromS.id) ? toS : fromS;
                              return (
                                <div
                                  key={`${cl.fromId}-${cl.toId}`}
                                  onClick={() => {
                                    playClickSound();
                                    setInspectedStory(otherStory);
                                    setActiveStoryLineHubId(otherStory.storyLineId);
                                  }}
                                  className="px-3 py-2 rounded-[2px] bg-black/40 border border-white/[0.07] hover:border-[#ffe600]/60 cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0">
                                    <div className="font-mono text-[11px] text-white font-bold truncate">
                                      {fromS.titleKo} ({fromS.code}) → {toS.titleKo} ({toS.code})
                                    </div>
                                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                      {cl.reasonKo}
                                    </div>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#ffe600] flex-shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 연작 순서 플로우차트 */}
                    <div className="space-y-3.5 sm:space-y-4">
                      {lineStories.map((story, idx) => {
                        const accessState = getStoryAccessState(story);
                        const isRestored = accessState === 'available';
                        const isSelected = inspectedStory?.id === story.id;

                        return (
                          <div key={story.id} className="relative">
                            {/* 단계 연결 화살표 */}
                            {idx > 0 && (
                              <div className="flex items-center gap-2 py-1 pl-5 text-zinc-500 font-mono text-[10px]">
                                <div
                                  className="w-0.5 h-4 sm:h-5"
                                  style={{ backgroundColor: activeLine.themeColor }}
                                />
                                <span>STEP 0{idx + 1}</span>
                              </div>
                            )}

                            <div
                              onClick={() => {
                                playClickSound();
                                setInspectedStory(story);
                              }}
                              className={`group rounded-[6px] sm:rounded-[4px] border p-3.5 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-stretch ${
                                isSelected
                                  ? 'bg-[#121726] border-[#ffe600] shadow-[0_0_20px_rgba(255,230,0,0.15)]'
                                  : 'bg-[#0b0e17] border-white/[0.09] hover:border-white/30'
                              }`}
                            >
                              {/* 썸네일 영역 */}
                              <div
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full sm:w-52 h-36 sm:h-auto flex-shrink-0 rounded-[4px] sm:rounded-[3px] bg-black overflow-hidden relative border border-white/10"
                              >
                                {story.splashVisualUrl ? (
                                  <>
                                    <img
                                      src={resolveAssetUrl(story.splashVisualUrl)}
                                      alt={story.titleKo}
                                      draggable={false}
                                      onContextMenu={(e) => e.preventDefault()}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                                    />
                                    <CopyrightBadge />
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
                                    NO VISUAL
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-mono font-black bg-black/85 text-white border border-white/20">
                                  {story.code}
                                </div>
                              </div>

                              {/* 본문 설명 영역 */}
                              <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#ffe600] transition-colors">
                                        {story.titleKo}
                                      </h3>
                                      <span className="text-xs font-mono text-zinc-400">
                                        {story.titleEn}
                                      </span>
                                      {story.isOmnibus && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded flex items-center gap-1">
                                          <FilmReelIcon className="w-3 h-3" /> 옴니버스
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <span className="text-[11px] sm:text-xs font-mono text-[#ffe600] bg-[#ffe600]/10 px-2 py-0.5 rounded border border-[#ffe600]/30">
                                        {story.timeline}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                                          isRestored
                                            ? 'bg-[#ffe600] text-black'
                                            : 'bg-white/10 text-zinc-300'
                                        }`}
                                      >
                                        {isRestored ? '요약본 수록' : '개요 수록'}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed break-keep">
                                    {story.officialSynopsis}
                                  </p>
                                </div>

                                <div className="mt-3.5 sm:mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                                  <div className="text-[11px] font-mono text-zinc-400">
                                    출시 연차: YEAR 0{story.releaseYear ?? 1} (#{story.releaseOrder})
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playOpenSound();
                                      onSelectStory(story.id);
                                    }}
                                    className="px-3 py-1.5 rounded-[3px] bg-[#ffe600] hover:bg-[#fff04d] text-black font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>{isRestored ? '요약본 열람' : '개요 열람'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            MODE C: RELEASE TIMELINE (연차별 출시 로드맵 뷰)
        ----------------------------------------------------------------------- */}
        {browseMode === 'release' && (
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 prts-scrollbar bg-[#06080e]">
            {/* 연차 빠른 선택 탭 바 (데스크톱 전용, 모바일은 상단 2행 가로 칩 사용) */}
            <div className="hidden md:flex flex-wrap items-center gap-1.5 bg-[#090c14]/90 p-1.5 rounded-[4px] border border-white/[0.08] font-sans">
              <span className="text-xs font-semibold text-zinc-400 px-2.5">서비스 연차</span>
              <button
                onClick={() => {
                  playClickSound();
                  setSelectedReleaseYear('all');
                }}
                className={`relative h-7.5 px-3 rounded-[3px] text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                  selectedReleaseYear === 'all'
                    ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span>전체 연차</span>
                <span className="font-mono text-[10.5px] text-zinc-400">Y1~Y6</span>
                {selectedReleaseYear === 'all' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ffe600] rounded-full" />
                )}
              </button>
              {RELEASE_YEARS_META.map((ym) => (
                <button
                  key={ym.year}
                  onClick={() => {
                    playClickSound();
                    setSelectedReleaseYear(ym.year);
                  }}
                  className={`relative h-7.5 px-3 rounded-[3px] text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    selectedReleaseYear === ym.year
                      ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="font-mono font-bold text-[#ffe600]">{ym.label}</span>
                  <span className="font-mono text-[11px] text-zinc-400">{ym.period}</span>
                  {selectedReleaseYear === ym.year && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ffe600] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {RELEASE_YEARS_META.filter(
              (ym) => selectedReleaseYear === 'all' || selectedReleaseYear === ym.year
            ).map((yearMeta) => {
              const yearStories = applyFilters(
                storyRegistry
                  .filter((s) => (s.releaseYear ?? 1) === yearMeta.year)
                  .sort((a, b) => a.releaseOrder - b.releaseOrder)
              );

              if (yearStories.length === 0) return null;

              return (
                <div
                  key={yearMeta.year}
                  className="border border-white/[0.09] bg-[#0a0d16] p-3.5 sm:p-5 rounded-[6px] sm:rounded-[4px] space-y-3.5 sm:space-y-4 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-b border-white/[0.07] pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span
                          className="px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-mono font-black text-black rounded-[2px] flex-shrink-0"
                          style={{ backgroundColor: yearMeta.color }}
                        >
                          {yearMeta.label} · {yearMeta.period}
                        </span>
                        <span className="sm:hidden text-[11px] font-mono text-zinc-400">
                          {yearStories.length}개 작전 출시
                        </span>
                      </div>
                      <h2 className="text-sm sm:text-lg font-bold text-white leading-snug break-keep">
                        {yearMeta.subtitle}
                      </h2>
                    </div>
                    <span className="hidden sm:inline-block text-xs font-mono text-zinc-400 flex-shrink-0">
                      {yearStories.length}개 작전 출시
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
                    {yearStories.map((story, idx) => {
                      const accessState = getStoryAccessState(story);
                      const isRestored = accessState === 'available';
                      const isSelected = inspectedStory?.id === story.id;
                      const lineMeta = lineMetaMap.get(story.storyLineId);

                      return (
                        <div
                          key={story.id}
                          onClick={() => {
                            playClickSound();
                            setInspectedStory(story);
                          }}
                          className={`group relative rounded-[5px] sm:rounded-[3px] border p-3.5 transition-all cursor-pointer flex flex-col justify-between min-h-[132px] sm:min-h-[148px] overflow-hidden ${
                            isSelected
                              ? 'bg-[#141a2b] border-[#ffe600] ring-1 ring-[#ffe600]'
                              : isRestored
                              ? 'bg-[#0d111c] border-[#ffe600]/45 hover:border-[#ffe600]'
                              : 'bg-[#0b0e17] border-white/[0.1] hover:border-white/35'
                          }`}
                        >
                          {story.splashVisualUrl && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <img
                                src={resolveAssetUrl(story.splashVisualUrl)}
                                alt=""
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full h-full object-cover opacity-40 group-hover:opacity-70 transition-opacity select-none"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#090c14] via-[#090c14]/75 to-transparent" />
                            </div>
                          )}

                          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-zinc-400 font-bold">#{idx + 1}</span>
                              <span
                                className={`px-1.5 py-0.5 font-black rounded-[1px] ${
                                  isRestored ? 'bg-[#ffe600] text-black' : 'bg-black/80 text-white border border-white/20'
                                }`}
                              >
                                {story.code}
                              </span>
                            </div>
                            <span
                              className="px-1.5 py-0.5 text-[10px] rounded bg-black/70 border border-white/10 font-bold"
                              style={{ color: lineMeta?.themeColor || '#ffe600' }}
                            >
                              {lineMeta?.titleKo.replace('내일을 위하여 · ', '')}
                            </span>
                          </div>

                          <div className="relative z-10 my-auto py-2">
                            <h3 className="text-sm font-bold text-white group-hover:text-[#ffe600] transition-colors truncate">
                              {story.titleKo}
                            </h3>
                            <div className="text-[10px] font-mono text-zinc-400 truncate">{story.titleEn}</div>
                          </div>

                          <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-zinc-300 truncate">배경: {story.timeline}</span>
                            <span className="text-[#ffe600] font-bold flex-shrink-0 ml-1">브리핑 →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            3. TACTICAL BRIEFING DOCK (PC: 우측 사이드 도크 / 모바일: 하단 바텀 시트)
        ========================================================================= */}
        {inspectedStory && (
          <>
            {/* 모바일 전용 배경 딤드 오버레이 */}
            <div
              onClick={() => {
                playCloseSound();
                setInspectedStory(null);
              }}
              className="md:hidden fixed inset-0 z-40 bg-black/65 backdrop-blur-xs animate-fadeIn"
            />

            <aside
              style={
                isMobile && sheetDragY > 0
                  ? { transform: `translateY(${sheetDragY}px)`, transition: 'none' }
                  : undefined
              }
              className="fixed md:static inset-x-0 bottom-0 md:inset-auto w-full md:w-80 lg:w-96 max-h-[82dvh] md:max-h-none md:h-full flex-shrink-0 bg-[#090c15]/98 border-t md:border-t-0 md:border-l border-white/20 md:border-white/[0.1] rounded-t-2xl md:rounded-none flex flex-col z-50 md:z-30 shadow-2xl overflow-hidden animate-fadeIn"
            >
              {/* 모바일 바텀 시트 핸들 바 */}
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
                    setInspectedStory(null);
                  }
                  setSheetDragY(0);
                  sheetTouchStartY.current = null;
                }}
                onClick={() => {
                  playCloseSound();
                  setInspectedStory(null);
                }}
                className="md:hidden flex items-center justify-center py-2.5 bg-[#06080f] border-b border-white/[0.06] cursor-pointer flex-shrink-0 touch-none active:bg-white/[0.08]"
                title="잡아서 아래로 당겨 닫기"
              >
                <div className="w-10 h-1.5 rounded-full bg-zinc-500" />
              </div>

              {/* 상단 커버 비주얼 헤더 */}
              <div
                onContextMenu={(e) => e.preventDefault()}
                className="relative h-36 sm:h-44 bg-[#05070c] border-b border-white/[0.08] flex-shrink-0 overflow-hidden"
              >
                {inspectedStory.splashVisualUrl ? (
                  <>
                    <img
                      src={resolveAssetUrl(inspectedStory.splashVisualUrl)}
                      alt={inspectedStory.titleKo}
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-full object-cover object-center opacity-80 select-none"
                    />
                    <CopyrightBadge />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#101524] to-[#06080e]">
                    <Layers className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090c15] via-[#090c15]/45 to-transparent pointer-events-none" />

                {/* 닫기 버튼 */}
                <button
                  onClick={() => {
                    playCloseSound();
                    setInspectedStory(null);
                  }}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-zinc-200 hover:text-white border border-white/20 flex items-center justify-center cursor-pointer z-10"
                  title="브리핑 닫기"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* 하단 오버레이 타이틀 */}
                <div className="absolute bottom-3 inset-x-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-black bg-[#ffe600] text-black rounded-[1px]">
                      {inspectedStory.code}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-black/80 text-zinc-200 border border-white/20 rounded-[1px]">
                      {lineMetaMap.get(inspectedStory.storyLineId)?.titleKo || inspectedStory.categoryLabel}
                    </span>
                    {inspectedStory.isOmnibus && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 rounded-[1px] flex items-center gap-1">
                        <FilmReelIcon className="w-3 h-3" /> 옴니버스
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow">
                    {inspectedStory.titleKo}
                  </h2>
                  <div className="text-xs font-mono text-zinc-400 truncate">{inspectedStory.titleEn}</div>
                </div>
              </div>

              {/* 주요 액션 버튼 바 */}
              <div className="p-3 sm:p-3.5 bg-[#0c101c] border-b border-white/[0.08] flex items-center gap-2">
                <button
                  disabled={getStoryAccessState(inspectedStory) === 'locked'}
                  onClick={() => {
                    playOpenSound();
                    onSelectStory(inspectedStory.id);
                  }}
                  className="flex-1 h-9 rounded-[3px] bg-[#ffe600] hover:bg-[#fff04d] disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {getStoryAccessState(inspectedStory) === 'available'
                      ? '요약본 열람'
                      : getStoryAccessState(inspectedStory) === 'overview_only'
                      ? '스토리 개요 열람'
                      : '열람 불가'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    playOpenSound();
                    setSelectedModalStory(inspectedStory);
                    setIsModalOpen(true);
                  }}
                  className="h-9 px-3 rounded-[3px] bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/15 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  title="크게 보기 모달"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>확대</span>
                </button>
              </div>

              {/* 도크 스크롤 본문: 시놉시스 + 세부 파트 + 선행/후속/교차 서사 체인 */}
              <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4 sm:space-y-5 prts-scrollbar text-xs">
                {/* 시계열 메타데이터 */}
                <div className="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded-[3px] border border-white/[0.06] font-mono">
                  <div>
                    <div className="text-[10px] text-zinc-500">작전 시점</div>
                    <div className="text-xs text-[#ffe600] font-bold mt-0.5">{inspectedStory.timeline}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">수록 상태</div>
                    <div className="text-xs text-white font-bold mt-0.5">
                      {getStoryAccessState(inspectedStory) === 'available'
                        ? '요약본 수록'
                        : getStoryAccessState(inspectedStory) === 'overview_only'
                        ? '공식 개요 수록'
                        : '미수록'}
                    </div>
                  </div>
                </div>

                {/* 공식 작전 개요 */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#ffe600]" />
                    <span>스토리 개요</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded-[3px] border border-white/[0.05] break-keep">
                    {inspectedStory.officialSynopsis}
                  </p>
                </div>

                {/* 멀티 파트 / 옴니버스 하위 에피소드 목록 */}
                {inspectedStory.subPages && inspectedStory.subPages.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      수록 파트 구성 ({inspectedStory.subPages.length}개 섹션)
                    </div>
                    <div className="space-y-1">
                      {inspectedStory.subPages.map((sp) => (
                        <div
                          key={sp.id}
                          onClick={() => {
                            playOpenSound();
                            onSelectStory(inspectedStory.id);
                          }}
                          className="px-2.5 py-1.5 rounded-[2px] bg-white/[0.03] hover:bg-[#ffe600]/15 border border-white/[0.06] hover:border-[#ffe600]/40 cursor-pointer flex items-center justify-between text-[11px]"
                        >
                          <span className="text-zinc-200 font-medium truncate">{sp.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 서사 연결망 (선행 작전 & 후속/교차 작전) */}
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <div className="text-[10px] font-mono font-bold text-[#ffe600] uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>연관 스토리</span>
                  </div>

                  {/* 선행 작전 */}
                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 mb-1">
                      ◀ 이전 / 배경 스토리 ({inspectedConnections.incoming.length})
                    </div>
                    {inspectedConnections.incoming.length === 0 ? (
                      <div className="text-[11px] text-zinc-600 font-mono py-1">
                        이 시리즈의 시작점입니다.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {inspectedConnections.incoming.map((inc) => (
                          <div
                            key={`in-${inc.fromId}`}
                            onClick={() => focusOnStoryNode(inc.fromId)}
                            className="p-2.5 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-[#ffe600]/50 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-black text-[#ffe600] border border-[#ffe600]/40">
                                  {inc.story.code}
                                </span>
                                <span className="font-bold text-white">{inc.story.titleKo}</span>
                              </div>
                              <span
                                className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded ${
                                  inc.type === 'cross'
                                    ? 'bg-[#ffe600]/15 text-[#ffe600]'
                                    : 'bg-sky-500/15 text-sky-300'
                                }`}
                              >
                                {inc.type === 'cross' ? '교차 연결' : '이전 편'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{inc.reasonKo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 후속 / 파생 작전 */}
                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 mb-1">
                      ▶ 다음 / 파생 스토리 ({inspectedConnections.outgoing.length})
                    </div>
                    {inspectedConnections.outgoing.length === 0 ? (
                      <div className="text-[11px] text-zinc-600 font-mono py-1">
                        현재 시리즈의 최신 챕터이거나 독립 결말입니다.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {inspectedConnections.outgoing.map((out) => (
                          <div
                            key={`out-${out.toId}`}
                            onClick={() => focusOnStoryNode(out.toId)}
                            className="p-2.5 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-[#ffe600]/50 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-black text-[#ffe600] border border-[#ffe600]/40">
                                  {out.story.code}
                                </span>
                                <span className="font-bold text-white">{out.story.titleKo}</span>
                              </div>
                              <span
                                className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded ${
                                  out.type === 'cross'
                                    ? 'bg-[#ffe600]/15 text-[#ffe600]'
                                    : 'bg-sky-500/15 text-sky-300'
                                }`}
                              >
                                {out.type === 'cross' ? '교차 연결' : '다음 편'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{out.reasonKo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Story Splash Preview Modal */}
      {selectedModalStory && (
        <StorySplashModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          story={selectedModalStory}
          onEnterStory={(storyId) => onSelectStory(storyId)}
        />
      )}
    </div>
  );
};

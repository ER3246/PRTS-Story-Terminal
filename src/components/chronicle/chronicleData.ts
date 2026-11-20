import type { StoryListItem } from '../../data/storyRegistry';
import { terraRegions, type TerraRegion } from '../../data/terraRegions';

export interface TimelineEra {
  id: string;
  code: string;
  yearMark: string;
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
    yearMark: '1089',
    titleKo: '여명 이전 · 테라의 기원',
    titleEn: 'Before the Dawn',
    periodKo: '1089년 ~ 1096년',
    color: '#68929e',
    description: '바벨의 창설과 테레시아의 비원, 구 로도스 아일랜드 결성기',
    minOrder: 0,
    maxOrder: 4.9,
  },
  {
    id: 'era_01',
    code: 'ERA 01',
    yearMark: '1096',
    titleKo: '체르노보그 & 용문 사변',
    titleEn: 'Chernobog & Lungmen Crisis',
    periodKo: '1096년 12월 ~ 1097년 2월',
    color: '#f5dd1b',
    description: '박사의 석관 각성과 리유니온 항쟁, 체르노보그 핵심 도시 결전',
    minOrder: 5,
    maxOrder: 18.9,
  },
  {
    id: 'era_02',
    code: 'ERA 02',
    yearMark: '1097',
    titleKo: '대륙 각지의 격동',
    titleEn: 'Terran Turmoil',
    periodKo: '1097년 봄 ~ 1098년 정월',
    color: '#7b9ab0',
    description: '카시미어 메이저, 쉐라그 정변, 맨스필드 탈옥 등 열강의 암류',
    minOrder: 19,
    maxOrder: 29.9,
  },
  {
    id: 'era_03',
    code: 'ERA 03',
    yearMark: '1098',
    titleKo: '석양의 런디니움 & 개척기',
    titleEn: 'Victoria Crisis & Frontier',
    periodKo: '1098년 ~ 1099년 겨울',
    color: '#c99746',
    description: '빅토리아 왕도 전쟁, 스툴티페라 나비스, 론 트레일 우주 개척',
    minOrder: 30,
    maxOrder: 59.9,
  },
  {
    id: 'era_04',
    code: 'ERA 04',
    yearMark: '1100',
    titleKo: '분열의 서곡 & 미지의 경계',
    titleEn: 'Dissociation & Deep Abyss',
    periodKo: '1100년 ~ 1101년+',
    color: '#8a7096',
    description: '원초 오리지늄 변이, 에기르 심해 원정 및 대륙의 새로운 국면',
    minOrder: 60,
    maxOrder: 999,
  },
];

export interface StrategicLane {
  id: string;
  code: string;
  titleKo: string;
  subtitleKo: string;
  color: string;
  storyLineIds: string[];
  isCompactLane?: boolean;
}

export const STRATEGIC_LANES: StrategicLane[] = [
  {
    id: 'LANE_CORE',
    code: 'CORE SPINE',
    titleKo: '바벨 & 메인 테마',
    subtitleKo: '로도스 아일랜드 중심 서사 · 방주(RL) & 내일을 위하여(Act I~III)',
    color: '#f5dd1b',
    storyLineIds: ['SL_RL', 'MAIN_ACT_1', 'MAIN_ACT_2', 'MAIN_ACT_3'],
  },
  {
    id: 'LANE_WEST',
    code: 'THEATER 01',
    titleKo: '빅토리아 · 타라 · 라이타니엔',
    subtitleKo: '왕권과 혁명의 불씨, 고탑의 음악 · 다시 불붙은 장작(TA) & 고탑의 그림자(LE)',
    color: '#8a7096',
    storyLineIds: ['SL_TA', 'SL_LE'],
  },
  {
    id: 'LANE_NORTH',
    code: 'THEATER 02',
    titleKo: '우르수스 · 카시미어 · 쉐라그',
    subtitleKo: '동토의 상흔과 기사도, 설산의 개혁 · 들불(UR) & 네온 불빛(KA) & 설산과 은철(KJ)',
    color: '#b89648',
    storyLineIds: ['SL_UR', 'SL_KA', 'SL_KJ'],
  },
  {
    id: 'LANE_CENTRAL',
    code: 'THEATER 03',
    titleKo: '컬럼비아 · 시라쿠사 · 라테라노',
    subtitleKo: '첨단 과학과 마피아, 성도의 율법 · 미래를 잡는 사람(RH) & 일곱 언덕(SI) & 축복(LA)',
    color: '#648c74',
    storyLineIds: ['SL_RH', 'SL_SI', 'SL_LA'],
  },
  {
    id: 'LANE_EAST_ABYSS',
    code: 'THEATER 04',
    titleKo: '염국(쉐이) · 에기르(심해)',
    subtitleKo: '신수 쉐이의 천년 풍류와 시본의 위협 · 영원한 오늘(SU) & 깊은 바닷속으로(AE)',
    color: '#5e9096',
    storyLineIds: ['SL_SU', 'SL_AE'],
  },
  {
    id: 'LANE_TALES',
    code: 'SUB-ARCHIVE',
    titleKo: '여름의 리듬 · 테라 기담 · 이계',
    subtitleKo: '휴양지 모험, 오퍼레이터 옴니버스 비화 및 이계 협력 작전 (ST · TS · MS)',
    color: '#8a94a0',
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

export const CROSS_LORE_LINKS: { fromId: string; toId: string; reasonKo: string }[] = [
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
    toId: 'sid_kazdelian_rescue',
    reasonKo: '런디니움 결전 이후 카즈델 잔존 세력과 로도스 아일랜드의 새로운 연계',
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

export const LANDMARK_STORY_IDS = new Set<string>([
  'sid_babel',
  'ep00',
  'ep08',
  'ep09',
  'ep14',
  'ep15',
  'ep16',
  'sid_lone_trail',
  'sid_stultifera_navis',
  'sid_near_light',
  'sid_zwillingsturme',
  'sid_il_siracusano',
]);

export const RELEASE_YEARS_META = [
  { year: 1, label: 'YEAR 01', period: '2020', subtitle: '여명의 개막 · 체르노보그에서 용문까지', color: '#f5dd1b' },
  { year: 2, label: 'YEAR 02', period: '2021', subtitle: '대륙으로 뻗어나가는 발걸음과 과거의 그림자', color: '#7b9ab0' },
  { year: 3, label: 'YEAR 03', period: '2022', subtitle: '네온 불빛의 기사도와 심해의 각성, 런디니움 잠입', color: '#b89648' },
  { year: 4, label: 'YEAR 04', period: '2023', subtitle: '스툴티페라 나비스와 시라쿠사, 그리고 별하늘을 뚫은 론 트레일', color: '#648c74' },
  { year: 5, label: 'YEAR 05', period: '2024', subtitle: '바벨의 기원과 런디니움 대단원, 대황성의 황금 물결', color: '#c99746' },
  { year: 6, label: 'YEAR 06', period: '2025~2026', subtitle: '임계 상전이와 테라의 미지 경계를 향한 최신 작전', color: '#8a7096' },
];

export interface NodeBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export function buildSmartConnectionPath(
  from: NodeBox,
  to: NodeBox,
  isCross: boolean = false
): { d: string; startX: number; startY: number; endX: number; endY: number } {
  const dy = to.centerY - from.centerY;
  const dxGap = to.left - from.right;

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

export function buildAllStoryConnections(
  stories: StoryListItem[],
  lineColorLookup: (lineId: string) => string
): StoryConnection[] {
  const storyMap = new Map(stories.map((s) => [s.id, s]));
  const connections: StoryConnection[] = [];
  const lineGroups = new Map<string, StoryListItem[]>();

  stories.forEach((s) => {
    const list = lineGroups.get(s.storyLineId) || [];
    list.push(s);
    lineGroups.set(s.storyLineId, list);
  });

  lineGroups.forEach((group, lineId) => {
    const sorted = [...group].sort((a, b) => a.seriesOrder - b.seriesOrder);
    const lineColor = lineColorLookup(lineId);
    for (let i = 0; i < sorted.length - 1; i++) {
      connections.push({
        fromId: sorted[i].id,
        toId: sorted[i + 1].id,
        type: 'series',
        reasonKo: `${sorted[i].storyLineTitle.replace('내일을 위하여 · ', '')} 직계 연속 서사`,
        color: lineColor,
      });
    }
  });

  CROSS_LORE_LINKS.forEach((link) => {
    if (storyMap.has(link.fromId) && storyMap.has(link.toId)) {
      connections.push({
        fromId: link.fromId,
        toId: link.toId,
        type: 'cross',
        reasonKo: link.reasonKo,
        color: '#f5dd1b',
      });
    }
  });

  return connections;
}

export interface CausalThreadNode {
  story: StoryListItem;
  stepIndex: number;
  isFocal: boolean;
  bridgeReasonFromPrev?: string;
  bridgeTypeFromPrev?: 'series' | 'cross';
}

/**
 * Extracts a focused, readable chronological causal chain around a focal story
 * (up to 2 hops upstream & 2 hops downstream along cross-lore and direct series edges).
 */
export function buildCausalThread(
  rootStoryId: string,
  allConnections: StoryConnection[],
  storyMap: Map<string, StoryListItem>
): CausalThreadNode[] {
  const root = storyMap.get(rootStoryId);
  if (!root) return [];

  const collected = new Set<string>([rootStoryId]);

  // Walk upstream up to 2 hops
  let frontierBack = [rootStoryId];
  for (let hop = 0; hop < 2; hop++) {
    const nextBack: string[] = [];
    for (const id of frontierBack) {
      for (const conn of allConnections) {
        if (conn.toId === id && !collected.has(conn.fromId) && storyMap.has(conn.fromId)) {
          collected.add(conn.fromId);
          nextBack.push(conn.fromId);
        }
      }
    }
    frontierBack = nextBack;
  }

  // Walk downstream up to 2 hops
  let frontierFwd = [rootStoryId];
  for (let hop = 0; hop < 2; hop++) {
    const nextFwd: string[] = [];
    for (const id of frontierFwd) {
      for (const conn of allConnections) {
        if (conn.fromId === id && !collected.has(conn.toId) && storyMap.has(conn.toId)) {
          collected.add(conn.toId);
          nextFwd.push(conn.toId);
        }
      }
    }
    frontierFwd = nextFwd;
  }

  const ordered = Array.from(collected)
    .map((id) => storyMap.get(id)!)
    .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);

  return ordered.map((st, idx) => {
    let bridgeReasonFromPrev: string | undefined;
    let bridgeTypeFromPrev: 'series' | 'cross' | undefined;

    if (idx > 0) {
      const prev = ordered[idx - 1];
      const directEdge =
        allConnections.find((c) => c.fromId === prev.id && c.toId === st.id && c.type === 'cross') ||
        allConnections.find((c) => c.fromId === prev.id && c.toId === st.id);

      if (directEdge) {
        bridgeReasonFromPrev = directEdge.reasonKo;
        bridgeTypeFromPrev = directEdge.type;
      } else {
        const edgeToFocal = allConnections.find(
          (c) =>
            (c.fromId === st.id && c.toId === rootStoryId) ||
            (c.fromId === rootStoryId && c.toId === st.id)
        );
        if (edgeToFocal) {
          bridgeReasonFromPrev = edgeToFocal.reasonKo;
          bridgeTypeFromPrev = edgeToFocal.type;
        } else {
          bridgeReasonFromPrev = '연계 시계열 작전 흐름';
          bridgeTypeFromPrev = 'series';
        }
      }
    }

    return {
      story: st,
      stepIndex: idx + 1,
      isFocal: st.id === rootStoryId,
      bridgeReasonFromPrev,
      bridgeTypeFromPrev,
    };
  });
}

export function getStoryRelatedRegions(storyId: string): TerraRegion[] {
  return terraRegions.filter((r) => r.relatedStoryIds.includes(storyId));
}

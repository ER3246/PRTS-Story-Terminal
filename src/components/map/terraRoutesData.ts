export type RouteCategory = 'main' | 'series' | 'expedition';

export interface TacticalRouteArc {
  id: string;
  code: string;
  category: RouteCategory;
  eraIndex: 0 | 1 | 2 | 3 | 4;
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

export interface MapEraMeta {
  index: 0 | 1 | 2 | 3 | 4;
  id: string;
  code: string;
  year: string;
  titleKo: string;
  summary: string;
  activeRegionIds: string[];
}

export const MAP_ERAS: MapEraMeta[] = [
  {
    index: 0,
    id: 'era_00',
    code: 'ERA 00',
    year: '1089 ~ 1096',
    titleKo: '여명 이전 · 바벨과 림 빌리턴 발굴',
    summary: '림 빌리턴 육상 순양함 발굴, 카즈델 내전과 바벨의 해체, 박사의 석관 동면.',
    activeRegionIds: ['rim_billiton', 'kazdel', 'ursus', 'sargon'],
  },
  {
    index: 1,
    id: 'era_01',
    code: 'ERA 01',
    year: '1096.12 ~ 1097.02',
    titleKo: '체르노보그 & 용문 사변',
    summary: '박사 각성과 체르노보그 탈출, 용문 근위국 연합 및 코어 시티 충돌 저지.',
    activeRegionIds: ['ursus', 'yan', 'kazdel', 'siesta'],
  },
  {
    index: 2,
    id: 'era_02',
    code: 'ERA 02',
    year: '1097 ~ 1098 초',
    titleKo: '대륙 각지의 격동',
    summary: '카시미어 메이저, 쉐라그 근대화 정변, 맨스필드 탈옥 및 월루몽드 소요.',
    activeRegionIds: ['kazimierz', 'kjerag', 'columbia', 'leithanien', 'bolivar', 'sargon'],
  },
  {
    index: 3,
    id: 'era_03',
    code: 'ERA 03',
    year: '1098 ~ 1099',
    titleKo: '석양의 런디니움 & 스텔라리아',
    summary: '살카즈 군사위원회 런디니움 점령, 스툴티페라 나비스, 론 트레일 대기층 돌파.',
    activeRegionIds: ['victoria', 'kazdel', 'columbia', 'iberia', 'laterano', 'siracusa', 'north_stargate', 'leithanien'],
  },
  {
    index: 4,
    id: 'era_04',
    code: 'ERA 04',
    year: '1100 ~ 1101+',
    titleKo: '분열의 서곡 & 북방 · 심해 전선',
    summary: '원초 오리지늄 변이와 우르수스 북부 빙원 전선, 에기르 심해 시본 총력전.',
    activeRegionIds: ['ursus', 'infy_icefield', 'sami', 'aegir', 'yan', 'iberia', 'kazdel'],
  },
];

// Canonical Operational 3D Trajectory Routes linked with Accurate Hex Coordinates & Story Registry
export const TACTICAL_ROUTES: TacticalRouteArc[] = [
  // =========================================================================
  // 1. 메인 스토리 대서사 기동 (Main Theme Trajectories — 5개)
  // =========================================================================
  {
    id: 'route_act1_cher_lung',
    code: 'EP.00~03',
    category: 'main',
    eraIndex: 1,
    shortLabel: '체르노보그 → 용문',
    fullLabel: 'Act I: 체르노보그 박사 구출 및 이동도시 용문 합류 기동',
    fromPixel: { x: 534, y: 424 },
    toPixel: { x: 583, y: 450 },
    color: '#f5dd1b',
    storyId: 'ep00',
    regionIds: ['ursus', 'yan'],
    labelT: 0.42,
    arcHeightOffset: 4,
  },
  {
    id: 'route_act1_lung_core',
    code: 'EP.06~08',
    category: 'main',
    eraIndex: 1,
    shortLabel: '용문 → 체르노보그 핵심부',
    fullLabel: 'Act I: 부분 괴사 ~ 울부짖는 광명 (핵심부 충돌 저지 결전)',
    fromPixel: { x: 583, y: 450 },
    toPixel: { x: 519, y: 415 },
    color: '#eab308',
    storyId: 'ep08',
    regionIds: ['yan', 'ursus'],
    labelT: 0.58,
    arcHeightOffset: 12,
  },
  {
    id: 'route_act2_hillock',
    code: 'EP.09',
    category: 'main',
    eraIndex: 3,
    shortLabel: '힐록 카운티 → 런디니움',
    fullLabel: 'Act II 스톰워치: 더블린 봉기 및 힐록 카운티 사태 진상 규명',
    fromPixel: { x: 356, y: 537 },
    toPixel: { x: 386, y: 554 },
    color: '#e87d45',
    storyId: 'ep09',
    regionIds: ['victoria'],
    labelT: 0.46,
    arcHeightOffset: 2,
  },
  {
    id: 'route_act2_victoria',
    code: 'EP.10~14',
    category: 'main',
    eraIndex: 3,
    shortLabel: '카즈델 → 런디니움',
    fullLabel: 'Act II: 살카즈 군사위원회 런디니움 점령 및 로도스 탈환 작전',
    fromPixel: { x: 543, y: 502 },
    toPixel: { x: 386, y: 554 },
    color: '#f59e0b',
    storyId: 'ep14',
    regionIds: ['kazdel', 'victoria'],
    labelT: 0.48,
    arcHeightOffset: 8,
  },
  {
    id: 'route_act3_ep17',
    code: 'EP.16~17',
    category: 'main',
    eraIndex: 4,
    shortLabel: '디에티 그라이퍼부르크 → 북부 빙원',
    fullLabel: 'Act III: 비정상 스펙트럼 ~ 임계 상전이 (우르수스 북방 빙원 전선)',
    fromPixel: { x: 455, y: 398 },
    toPixel: { x: 419, y: 280 },
    color: '#b57ce8',
    storyId: 'ep16',
    regionIds: ['ursus', 'infy_icefield', 'sami'],
    labelT: 0.5,
    arcHeightOffset: 6,
  },

  // =========================================================================
  // 2. 국가·세력별 메이저 스토리 라인 기동 (Major Story Line Arcs — 9개)
  // =========================================================================
  {
    id: 'route_babel_excavation',
    code: 'RL-04',
    category: 'series',
    eraIndex: 0,
    shortLabel: '림 빌리턴 → 카즈델',
    fullLabel: '바벨(Babel): 림 빌리턴 본함 발굴 및 카즈델 귀환 대원정',
    fromPixel: { x: 548, y: 597 },
    toPixel: { x: 543, y: 502 },
    color: '#54c5d0',
    storyId: 'sid_babel',
    regionIds: ['rim_billiton', 'kazdel'],
    labelT: 0.52,
    arcHeightOffset: 4,
  },
  {
    id: 'route_darknights',
    code: 'RL-01',
    category: 'series',
    eraIndex: 0,
    shortLabel: '카즈델 → 체르노보그',
    fullLabel: '흑야의 회고록: 바벨 붕괴 후 박사 석관 이송 및 W 소대 추적',
    fromPixel: { x: 543, y: 502 },
    toPixel: { x: 534, y: 424 },
    color: '#56b4e9',
    storyId: 'sid_darknights_memoir',
    regionIds: ['kazdel', 'ursus'],
    labelT: 0.5,
    arcHeightOffset: 2,
  },
  {
    id: 'route_kazimierz_major',
    code: 'KA-01~03',
    category: 'series',
    eraIndex: 2,
    shortLabel: '물방울 마을 → 카발레리에키',
    fullLabel: '니어 라이트 연작: 카시미어 변경에서 대기사령 결전까지의 여정',
    fromPixel: { x: 376, y: 476 },
    toPixel: { x: 356, y: 450 },
    color: '#d4a62a',
    storyId: 'sid_near_light',
    regionIds: ['kazimierz'],
    labelT: 0.5,
    arcHeightOffset: 3,
  },
  {
    id: 'route_sui_shangshu',
    code: 'SU-01~03',
    category: 'series',
    eraIndex: 2,
    shortLabel: '용문 → 상촉 · 백조',
    fullLabel: '쉐이(Sui) 연대기: 삼자매(니엔·더스크·링) 합류 및 상촉·백조 행 (에인션트 포지 ~ 장진주)',
    fromPixel: { x: 583, y: 450 },
    toPixel: { x: 622, y: 493 },
    color: '#48b5d6',
    storyId: 'sid_invitation_to_wine',
    regionIds: ['yan'],
    labelT: 0.54,
    arcHeightOffset: 3,
  },
  {
    id: 'route_sui_yumen',
    code: 'SU-04~06',
    category: 'series',
    eraIndex: 4,
    shortLabel: '옥문 → 백조 → 대황성',
    fullLabel: "쉐이(Sui) 연대기: 옥문 결전 후 천자의 황성 백조를 거쳐 동방의 곡창도시 대황성으로 이어지는 여정",
    fromPixel: { x: 602, y: 424 },
    toPixel: { x: 686, y: 441 },
    color: '#ddb33a',
    storyId: 'sid_vernal_winds',
    regionIds: ['yan'],
    labelT: 0.5,
    arcHeightOffset: 6,
  },
  {
    id: 'route_rhine_pioneer',
    code: 'RH-01~02',
    category: 'series',
    eraIndex: 2,
    shortLabel: '맨스필드 · 359호 기지 → 트리마운츠',
    fullLabel: '맨스필드 브레이크 ~ 도로시의 비전: 359호 기지 실험 데이터 트리마운츠 집결',
    fromPixel: { x: 283, y: 458 },
    toPixel: { x: 243, y: 476 },
    color: '#2db883',
    storyId: 'sid_dorothys_vision',
    regionIds: ['columbia'],
    labelT: 0.48,
    arcHeightOffset: 4,
  },
  {
    id: 'route_lonetrail',
    code: 'RH-03',
    category: 'series',
    eraIndex: 3,
    shortLabel: '트리마운츠 → 북부 궤도 (상공 투영)',
    fullLabel: '론 트레일: 트리마운츠 외곽에서 발사된 아크 1호와 스텔라리아의 6,152m 대기 차단층 돌파 궤적',
    fromPixel: { x: 243, y: 476 },
    toPixel: { x: 320, y: 138 },
    color: '#38bdf8',
    storyId: 'sid_lone_trail',
    regionIds: ['columbia', 'north_stargate', 'infy_icefield', 'sami'],
    labelT: 0.45,
    arcHeightOffset: 14,
  },
  {
    id: 'route_iberia_coast',
    code: 'AE-02',
    category: 'series',
    eraIndex: 3,
    shortLabel: '살비엔토 → 그란파로',
    fullLabel: '언더 타이즈: 살비엔토 해안 어비설 헌터스 집결 및 등대 수색',
    fromPixel: { x: 415, y: 658 },
    toPixel: { x: 450, y: 667 },
    color: '#3bc4b2',
    storyId: 'sid_under_tides',
    regionIds: ['iberia'],
    labelT: 0.46,
    arcHeightOffset: 2,
  },
  {
    id: 'route_abyss',
    code: 'AE-03~04',
    category: 'series',
    eraIndex: 4,
    shortLabel: '그란파로 → 에기르 밀리아리움',
    fullLabel: '스툴티페라 나비스 ~ 삶의 길: 이베리아 대등대 및 에기르 심해 원정',
    fromPixel: { x: 450, y: 667 },
    toPixel: { x: 586, y: 867 },
    color: '#2887c7',
    storyId: 'sid_stultifera_navis',
    regionIds: ['iberia', 'aegir'],
    labelT: 0.5,
    arcHeightOffset: 8,
  },

  // =========================================================================
  // 3. 대륙 횡단 및 다국적 장거리 원정 (Continental Expeditions — 4개)
  // =========================================================================
  {
    id: 'route_leithanien_spire',
    code: 'LE-01~03',
    category: 'expedition',
    eraIndex: 3,
    shortLabel: '월루몽드 → 츠빌링슈튀르메',
    fullLabel: '고탑의 그림자: 월루몽드의 황혼 ~ 츠빌링슈튀르메의 가을',
    fromPixel: { x: 455, y: 519 },
    toPixel: { x: 425, y: 502 },
    color: '#a56be0',
    storyId: 'sid_zwillingsturme',
    regionIds: ['leithanien'],
    labelT: 0.5,
    arcHeightOffset: 3,
  },
  {
    id: 'route_siracusa_return',
    code: 'SI-01',
    category: 'expedition',
    eraIndex: 3,
    shortLabel: '용문 → 시라쿠사 볼시니',
    fullLabel: "시라쿠사인: 구도시 볼시니로 귀환하여 패밀리 결전을 치르고 신생 자치 이동도시 '누오바 볼시니'를 건립한 행적",
    fromPixel: { x: 583, y: 450 },
    toPixel: { x: 494, y: 519 },
    color: '#d1783c',
    storyId: 'sid_il_siracusano',
    regionIds: ['yan', 'siracusa'],
    labelT: 0.54,
    arcHeightOffset: 6,
  },
  {
    id: 'route_kjerag_silver',
    code: 'KJ-01~02',
    category: 'expedition',
    eraIndex: 2,
    shortLabel: '런디니움 → 쉐라그 투리쿰',
    fullLabel: '설산과 은철: 브레이크 디 아이스 ~ 은심호 열차 개통 작전',
    fromPixel: { x: 386, y: 554 },
    toPixel: { x: 317, y: 519 },
    color: '#68b8de',
    storyId: 'sid_break_the_ice',
    regionIds: ['victoria', 'kjerag'],
    labelT: 0.52,
    arcHeightOffset: 5,
  },
  {
    id: 'route_summer_siesta',
    code: 'ST-01~04',
    category: 'expedition',
    eraIndex: 1,
    shortLabel: '시에스타 (신 시에스타) → 아카후알라',
    fullLabel: '여름의 리듬: 파란 불꽃의 마음 ~ 가비알 리턴즈 & 아카후알라 두린 지하도시 쎄루에르차 원정',
    fromPixel: { x: 334, y: 593 },
    toPixel: { x: 258, y: 649 },
    color: '#24b2cc',
    storyId: 'sid_heart_of_surging_flame',
    regionIds: ['siesta', 'sargon'],
    labelT: 0.5,
    arcHeightOffset: 5,
  },
];

export interface ScreenLabelCandidate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
  forceShow?: boolean;
}

/**
 * Greedy screen-space AABB collision solver so nation/city/route pins
 * never overlap awkwardly while higher-priority markers always stay legible.
 */
export function solveLabelCollisions(
  candidates: ScreenLabelCandidate[],
  viewportW: number,
  viewportH: number
): Set<string> {
  const accepted: ScreenLabelCandidate[] = [];
  const visible = new Set<string>();

  const marginX = 36;
  const minY = 58;
  const maxY = Math.max(minY + 40, viewportH - 64);

  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);

  for (const item of sorted) {
    if (item.x < marginX || item.x > viewportW - marginX || item.y < minY || item.y > maxY) {
      if (item.forceShow) {
        visible.add(item.id);
      }
      continue;
    }

    if (item.forceShow) {
      accepted.push(item);
      visible.add(item.id);
      continue;
    }

    const halfW = item.width * 0.5 + 8;
    const halfH = item.height * 0.5 + 5;
    let collides = false;

    for (const placed of accepted) {
      const pHalfW = placed.width * 0.5 + 8;
      const pHalfH = placed.height * 0.5 + 5;
      if (
        Math.abs(item.x - placed.x) < halfW + pHalfW &&
        Math.abs(item.y - placed.y) < halfH + pHalfH
      ) {
        collides = true;
        break;
      }
    }

    if (!collides) {
      accepted.push(item);
      visible.add(item.id);
    }
  }

  return visible;
}

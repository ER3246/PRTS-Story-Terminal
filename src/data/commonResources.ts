// =========================================================================
// PRTS 공용 리소스 카탈로그 (Common Visual Resource Registry)
// 전용 CG가 없는 장면에서 상황/분위기에 맞는 공식 배경을 제공하고,
// 특정 인물이 아닌 집단/전투원 대사 시 범용 NPC 아바타를 공급합니다.
// =========================================================================

export interface CommonBackgroundMeta {
  id: string;
  nameKo: string;
  category: 'chernobog' | 'lungmen' | 'rhodes' | 'snowfield' | 'climax' | 'wilderness' | 'common';
  categoryLabel: string;
  url: string;
  description: string;
}

export interface CommonNpcMeta {
  id: string;
  nameKo: string;
  faction: string;
  role: string;
  avatarUrl: string;
  description: string;
}

// 1. 공식 검증 공용 배경 라이브러리 (26종)
export const COMMON_BACKGROUNDS: Record<string, CommonBackgroundMeta> = {
  // --- 체르노보그 (Chernobog) ---
  cher_underground: {
    id: 'cher_underground',
    nameKo: '체르노보그 지하 방호 통로',
    category: 'chernobog',
    categoryLabel: '체르노보그',
    url: '/images/backgrounds/bg_cherunder.png',
    description: '어두운 비상 조명과 방호 격벽이 늘어선 석관 구역 지하 통로'
  },
  cher_ruins: {
    id: 'cher_ruins',
    nameKo: '체르노보그 도심 폐허와 연기',
    category: 'chernobog',
    categoryLabel: '체르노보그',
    url: '/images/backgrounds/bg_cher_1.png',
    description: '리유니온의 습격으로 파괴되고 불타는 체르노보그 중심 대로'
  },
  cher_escape_avenue: {
    id: 'cher_escape_avenue',
    nameKo: '체르노보그 도심 탈출로',
    category: 'chernobog',
    categoryLabel: '체르노보그',
    url: '/images/backgrounds/bg_cher_2.png',
    description: '시민들과 오퍼레이터들이 탈출을 위해 질주하는 대로'
  },
  cher_central_plaza: {
    id: 'cher_central_plaza',
    nameKo: '체르노보그 중앙 광장',
    category: 'chernobog',
    categoryLabel: '체르노보그',
    url: '/images/backgrounds/bg_chercen_1.png',
    description: '천재지변 경보가 울리는 체르노보그 행정 중심 광장'
  },
  cher_destroyed_cityhall: {
    id: 'cher_destroyed_cityhall',
    nameKo: '체르노보그 파괴된 청사',
    category: 'chernobog',
    categoryLabel: '체르노보그',
    url: '/images/backgrounds/bg_chercen_2.png',
    description: '운석 낙하와 폭격으로 무너져 내린 시청 청사 잔해'
  },

  // --- 용문 (Lungmen) ---
  lungmen_slum_alley: {
    id: 'lungmen_slum_alley',
    nameKo: '용문 하층 슬럼가 골목',
    category: 'lungmen',
    categoryLabel: '용문',
    url: '/images/backgrounds/bg_ltalley.png',
    description: '어두운 네온 불빛과 축축한 비가 내리는 용문 슬럼가 깊숙한 골목'
  },
  lungmen_day_view: {
    id: 'lungmen_day_view',
    nameKo: '용문 이동도시 주간 전경',
    category: 'lungmen',
    categoryLabel: '용문',
    url: '/images/backgrounds/bg_lungmen_d.png',
    description: '위풍당당하게 대지를 항해하는 용문 이동도시의 번화한 주간 전경'
  },
  lungmen_night_view: {
    id: 'lungmen_night_view',
    nameKo: '용문 이동도시 야간 전경',
    category: 'lungmen',
    categoryLabel: '용문',
    url: '/images/backgrounds/bg_lungmen_n.png',
    description: '화려한 사이버펑크 네온사인이 밝혀진 용문 상업지구의 야경'
  },
  lungmen_rain_street: {
    id: 'lungmen_rain_street',
    nameKo: '용문 외곽 빗속 거리',
    category: 'lungmen',
    categoryLabel: '용문',
    url: '/images/backgrounds/bg_lungmen_r.png',
    description: '차가운 장대비가 쏟아지는 용문 외곽 상업지구 폐허'
  },
  lungmen_bridge: {
    id: 'lungmen_bridge',
    nameKo: '용문 외곽 진입 교량',
    category: 'lungmen',
    categoryLabel: '용문',
    url: '/images/backgrounds/bg_lungmenbridge.png',
    description: '외곽 관문과 본성을 연결하는 거대한 전술 통제 교량'
  },
  lungmen_rooftop: {
    id: 'lungmen_rooftop',
    nameKo: '용문 도심 빌딩 옥상',
    category: 'lungmen',
    categoryLabel: '용문',
    url: '/images/backgrounds/bg_rooftop.png',
    description: '리유니온 정예부대와의 포위 결전이 벌어진 고층 빌딩 옥상'
  },
  lungmen_subway: {
    id: 'lungmen_subway',
    nameKo: '용문 지하철 역사',
    category: 'lungmen',
    categoryLabel: '용문',
    url: '/images/backgrounds/bg_lungmen_station.png',
    description: '어두운 선로와 플랫폼이 이어진 용문 지하 역사'
  },

  // --- 로도스 아일랜드 (Rhodes Island) ---
  rhodes_exterior: {
    id: 'rhodes_exterior',
    nameKo: '로도스 아일랜드 본함 외경',
    category: 'rhodes',
    categoryLabel: '로도스 아일랜드',
    url: '/images/backgrounds/bg_ri_1.png',
    description: '거대한 육상함 형태로 테라 대륙을 가로지르는 로도스 아일랜드 본함'
  },
  rhodes_bridge: {
    id: 'rhodes_bridge',
    nameKo: '로도스 본함 브릿지 (함교)',
    category: 'rhodes',
    categoryLabel: '로도스 아일랜드',
    url: '/images/backgrounds/bg_bridge.png',
    description: '항로 제어판과 전술 홀로그램이 구동되는 중앙 지휘 함교'
  },
  rhodes_corridor: {
    id: 'rhodes_corridor',
    nameKo: '로도스 본함 메인 복도',
    category: 'rhodes',
    categoryLabel: '로도스 아일랜드',
    url: '/images/backgrounds/bg_corridor.png',
    description: '오퍼레이터들이 오가는 모던하고 기능적인 선내 복도'
  },
  rhodes_aircraft: {
    id: 'rhodes_aircraft',
    nameKo: '로도스 고속 수송기 내부',
    category: 'rhodes',
    categoryLabel: '로도스 아일랜드',
    url: '/images/backgrounds/bg_aircraft.png',
    description: '작전 구역으로 오퍼레이터들을 신속 투입하는 전술 수송기'
  },
  rhodes_control_center: {
    id: 'rhodes_control_center',
    nameKo: '로도스 중앙 전술 관제실',
    category: 'rhodes',
    categoryLabel: '로도스 아일랜드',
    url: '/images/backgrounds/bg_indoor_2.png',
    description: '통신 단말과 PRTS 인터페이스가 연결된 중앙 관제실'
  },

  // --- 설원 및 빙원 (Snowfield & Tundra) ---
  ice_forest: {
    id: 'ice_forest',
    nameKo: '우르수스 침엽수림 빙원',
    category: 'snowfield',
    categoryLabel: '설원/빙원',
    url: '/images/backgrounds/bg_iceforest_1.png',
    description: '프로스트노바의 한기가 서린 울창한 북방 침엽수림'
  },
  snow_tundra: {
    id: 'snow_tundra',
    nameKo: '북방 설원 황무지',
    category: 'snowfield',
    categoryLabel: '설원/빙원',
    url: '/images/backgrounds/bg_snow_2.png',
    description: '눈보라가 몰아치는 우르수스 북원의 황량한 설원'
  },
  snow_village_ruins: {
    id: 'snow_village_ruins',
    nameKo: '설원 폐허 마을',
    category: 'snowfield',
    categoryLabel: '설원/빙원',
    url: '/images/backgrounds/bg_snowconutry_1.png',
    description: '혹한 속에 버려진 우르수스 변경의 목조 가옥 잔해'
  },

  // --- 제어탑 및 결전지 (Control Tower & Climax) ---
  control_tower_top: {
    id: 'control_tower_top',
    nameKo: '체르노보그 핵심 제어탑 상층',
    category: 'climax',
    categoryLabel: '핵심 결전지',
    url: '/images/backgrounds/bg_top.png',
    description: '패트리어트와 탈룰라가 자리잡은 핵심 제어탑 정상'
  },
  control_tower_burning: {
    id: 'control_tower_burning',
    nameKo: '불타는 제어탑 결전지',
    category: 'climax',
    categoryLabel: '핵심 결전지',
    url: '/images/backgrounds/bg_topburning.png',
    description: '탈룰라의 원초적 화염으로 용광로처럼 타오르는 제어탑 전장'
  },
  sarcophagus_core: {
    id: 'sarcophagus_core',
    nameKo: '석관 중추 코어 챔버',
    category: 'climax',
    categoryLabel: '핵심 결전지',
    url: '/images/backgrounds/bg_graduatecore.png',
    description: '박사가 잠들어 있던 고대 유물 석관의 핵심 에너지실'
  },

  // --- 황야 및 공통 (Wilderness & Common) ---
  terra_wilderness: {
    id: 'terra_wilderness',
    nameKo: '테라 대륙 황무지',
    category: 'wilderness',
    categoryLabel: '황야/자연',
    url: '/images/backgrounds/bg_wild_a.png',
    description: '끝없이 펼쳐진 암석과 붉은 먼지의 변경 황무지'
  },
  ancient_ruins: {
    id: 'ancient_ruins',
    nameKo: '고대 문명 유적 폐허',
    category: 'wilderness',
    categoryLabel: '황야/자연',
    url: '/images/backgrounds/bg_ruins_1.png',
    description: '오리지늄에 침식된 미지의 고대 문명 잔해'
  },
  black_abyss: {
    id: 'black_abyss',
    nameKo: '암전 / 어두운 심연',
    category: 'common',
    categoryLabel: '공통',
    url: '/images/backgrounds/bg_black.png',
    description: '독백 또는 회상 시 사용되는 칠흑의 공간'
  }
};

// 2. 범용 세력 NPC 아바타 카탈로그
export const COMMON_NPCS: Record<string, CommonNpcMeta> = {
  reunion_soldier: {
    id: 'reunion_soldier',
    nameKo: '리유니온 전투원',
    faction: '리유니온',
    role: '일반 돌격 보병',
    avatarUrl: '/images/characters/reunion_soldier.png',
    description: '무장 봉기에 가담한 리유니온의 일반 감염자 병사'
  },
  reunion_caster: {
    id: 'reunion_caster',
    nameKo: '리유니온 캐스터',
    faction: '리유니온',
    role: '원거리 아츠 공격수',
    avatarUrl: '/images/characters/reunion_caster.png',
    description: '오리지늄 아츠를 난사해 전선을 교란하는 리유니온 술사'
  },
  lgd_officer: {
    id: 'lgd_officer',
    nameKo: '용문 근위국 진압대원',
    faction: '용문 근위국',
    role: '도심 치안 및 방패 진압 대원',
    avatarUrl: '/images/characters/lgd_officer.png',
    description: '용문 근위국의 정규 중장갑 방패 진압 대원'
  },
  guard: {
    id: 'guard',
    nameKo: '로도스 가드 오퍼레이터',
    faction: '로도스 아일랜드',
    role: '근접 방어 및 돌격 대원',
    avatarUrl: '/images/characters/guard.png',
    description: '로도스 아일랜드의 공식 정규 가드 오퍼레이터'
  },
  medic: {
    id: 'medic',
    nameKo: '로도스 의료 오퍼레이터',
    faction: '로도스 아일랜드',
    role: '전선 응급 의료 및 치료 지원',
    avatarUrl: '/images/characters/medic.png',
    description: '로도스 아일랜드의 공식 정규 의료 오퍼레이터'
  },
  yeti_member: {
    id: 'yeti_member',
    nameKo: '눈의 악마 소대원',
    faction: '리유니온 / 눈의 악마 소대',
    role: '정예 냉기 전투원',
    avatarUrl: '/images/characters/yeti_member.png',
    description: '프로스트노바를 따르는 우르수스 북원의 정예 감염자 전사'
  },
  shieldguard: {
    id: 'shieldguard',
    nameKo: '방패 위병',
    faction: '리유니온 / 불사군단',
    role: '불사군단 정예 방패병',
    avatarUrl: '/images/characters/shieldguard.png',
    description: '패트리어트를 호위하는 우르수스 베테랑 중장갑 방패 위병'
  }
};

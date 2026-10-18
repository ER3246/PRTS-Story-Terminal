export interface TerraCity {
  id: string;
  nameKo: string;
  nameEn: string;
  regionId: string;
  pixelCoords: { x: number; y: number }; // 821 x 1024 exact pixel
  type: 'capital' | 'nomadic-city' | 'landmark' | 'rhodes';
  relatedStoryId?: string;
}

export interface TerraRegion {
  id: string;
  nameKo: string;
  nameEn: string;
  capital?: string;
  emblemPixelCoords: { x: number; y: number }; // 821 x 1024 exact pixel from 3.0 map
  badgeColor: string;
  logoUrl?: string;
  elevation: number;
  description: string;
  relatedStoryIds: string[];
}

// 테라 3.0 공식 최신 지도 1:1 픽셀 정밀 측정 기반 22개 전 세력 데이터
export const terraRegions: TerraRegion[] = [
  {
    id: 'north_stargate',
    nameKo: '북부 미지의 구멍 (???)',
    nameEn: 'Unknown Polar Anomaly / ???',
    emblemPixelCoords: { x: 320, y: 138 },
    badgeColor: '#0b131f',
    elevation: -3,
    description: '북방 빙원 너머에 위치한 거대하고 칠흑 같은 미지의 구덩이. 고대 문명의 유물 또는 테라의 장벽과 붕괴를 둘러싼 비밀이 묻혀 있는 금단의 영역이다.',
    relatedStoryIds: ['sid_lone_trail']
  },
  {
    id: 'infy_icefield',
    nameKo: '끝없는 빙원 (침묵의 얼음벌판)',
    nameEn: 'Infy Icefield',
    emblemPixelCoords: { x: 419, y: 280 },
    badgeColor: '#e2e8f0',
    elevation: 1,
    description: '사미 북방과 우르수스 상공을 뒤덮은 끝없는 설원. 알려지지 않은 붕괴의 위협(데몬)을 막기 위해 사미 설제들이 목숨을 바쳐 전선을 사수하고 있다.',
    relatedStoryIds: ['ep16', 'ep17', 'sid_lone_trail']
  },
  {
    id: 'sami',
    nameKo: '사미',
    nameEn: 'Sami',
    capital: '설원 부족 자치령',
    emblemPixelCoords: { x: 310, y: 386 },
    badgeColor: '#8b5cf6',
    logoUrl: '/images/logos/sami.png',
    elevation: 2,
    description: '원시림과 만년설 속에서 자연의 정령과 영혼을 숭배하는 설원 부족 연맹. 북부 빙원의 초자연적 침식을 막아내는 테라 최북단의 방파제 역할을 한다.',
    relatedStoryIds: ['ep16', 'sid_uncharted_land']
  },
  {
    id: 'ursus',
    nameKo: '우르수스 제국',
    nameEn: 'Ursus Empire',
    capital: '디에티 그라이퍼부르크',
    emblemPixelCoords: { x: 470, y: 407 },
    badgeColor: '#dc2626',
    logoUrl: '/images/logos/ursus.png',
    elevation: 2,
    description: '북방의 광대한 영토를 지배하는 군사 절대주의 제국. 가혹한 감염자 광산 노역과 억압 정책으로 인해 체르노보그를 기점으로 리유니온의 대규모 폭동이 발발했다.',
    relatedStoryIds: ['ep00', 'ep01', 'ep02', 'ep03', 'ep04', 'ep05', 'ep06', 'ep07', 'ep08', 'ep16', 'ep17', 'sid_children_of_ursus', 'sid_our_people', 'sid_walk_in_dust']
  },
  {
    id: 'kazimierz',
    nameKo: '카시미어',
    nameEn: 'Kazimierz',
    capital: '카발레리에키',
    emblemPixelCoords: { x: 361, y: 452 },
    badgeColor: '#16a34a',
    logoUrl: '/images/logos/kazimierz.png',
    elevation: 1,
    description: '기사도 정신이 상업 자본주의에 잠식되어 거대한 기사 스포츠 토너먼트(기사제)로 변질된 국가. 상인연합회와 감염자 기사들의 갈등이 첨예하다.',
    relatedStoryIds: ['sid_grani', 'sid_maria_nearl', 'sid_pinus_sylvestris', 'sid_near_light', 'sid_obscure_wanderer']
  },
  {
    id: 'columbia',
    nameKo: '컬럼비아 연방',
    nameEn: 'Union of Columbia',
    capital: '맥스 D.C. / 트리마운츠',
    emblemPixelCoords: { x: 242, y: 476 },
    badgeColor: '#1e3a8a',
    logoUrl: '/images/logos/columbia.png',
    elevation: 1,
    description: '자유와 개척, 첨단 공학 기술을 앞세워 급부상한 신흥 초강대국. 라인 랩을 위시한 첨단 과학 연구와 은밀한 우주 개척 프로젝트가 진행된다.',
    relatedStoryIds: ['sid_mansfield_break', 'sid_dorothys_vision', 'sid_lone_trail', 'sid_uncharted_land', 'sid_to_be_continued', 'sid_greening_valley', 'collab_lucent_arrowhead']
  },
  {
    id: 'bolivar',
    nameKo: '볼리바르',
    nameEn: 'Bolivar',
    capital: '도솔레스 (경제 중심)',
    emblemPixelCoords: { x: 183, y: 484 },
    badgeColor: '#0891b2',
    logoUrl: '/images/logos/bolivar.png',
    elevation: 1,
    description: '컬럼비아, 라이타니엔 등 외세 열강들의 대리 전쟁터가 된 비극의 나라. 칸델라 시장의 통치 아래 중립과 향락을 누리는 수양도시 도솔레스가 자리 잡고 있다.',
    relatedStoryIds: ['sid_dossoles_holiday', 'sid_bolivar_diagnosis']
  },
  {
    id: 'kjerag',
    nameKo: '쉐라그',
    nameEn: 'Kjerag',
    capital: '투리쿰',
    emblemPixelCoords: { x: 318, y: 513 },
    badgeColor: '#38bdf8',
    logoUrl: '/images/logos/kjerag.png',
    elevation: 4,
    description: '성산의 만년설 아래 외부 문명과 격리되어 있던 설산 종교 국가. 실버애쉬 가문의 근대화 개혁과 3대 가문 간의 정치적 대립이 발생했다.',
    relatedStoryIds: ['sid_break_the_ice', 'sid_silberneherze', 'sid_snow_realm', 'sid_preluding_lights']
  },
  {
    id: 'leithanien',
    nameKo: '라이타니엔',
    nameEn: 'Leithanien',
    capital: '츠빌링슈튀르메',
    emblemPixelCoords: { x: 433, y: 510 },
    badgeColor: '#334155',
    logoUrl: '/images/logos/leithanien.png',
    elevation: 2,
    description: '고도의 음악과 클래식 아츠를 숭상하는 선제후 귀족 연방. 과거 폭군 헤르쿤프트쇼른(구 황제)의 몰락 이후 쌍둥이 여제의 집권 체제가 유지되고 있다.',
    relatedStoryIds: ['sid_twilight_wolumonde', 'sid_lingering_echoes', 'sid_zwillingsturme']
  },
  {
    id: 'kazdel',
    nameKo: '카즈델',
    nameEn: 'Kazdel',
    capital: '파괴된 카즈델 (황무지)',
    emblemPixelCoords: { x: 543, y: 502 },
    badgeColor: '#7e22ce',
    logoUrl: '/images/logos/kazdel.png',
    elevation: 1,
    description: '살카즈(마족)들의 비극적인 고향. 유랑과 내전, 주변 열강의 침략으로 인해 정규 국경이 없는 황무지로 존재하며, 라이타니엔과 염국 사이 중립 지대에 자리 잡고 있다.',
    relatedStoryIds: ['sid_darknights_memoir', 'sid_babel', 'sid_great_overture', 'sid_kazdelian_rescue', 'ep14', 'ep15', 'ep16']
  },
  {
    id: 'yan',
    nameKo: '염국 (Yan)',
    nameEn: 'Empire of Yan',
    capital: '백조 (경성)',
    emblemPixelCoords: { x: 639, y: 462 },
    badgeColor: '#eab308',
    logoUrl: '/images/logos/yan.png',
    elevation: 2,
    description: '테라 동방의 유구한 고대 천자 제국. 카즈델 동쪽에 접해 있으며, 12 신수 "쉐이(Sui)"의 파편 형제들의 각성을 경계하고 있다.',
    relatedStoryIds: ['ep00', 'ep01', 'ep02', 'ep03', 'ep04', 'ep05', 'ep06', 'ep07', 'ep08', 'sid_ancient_forge', 'sid_code_of_brawl', 'sid_who_is_real', 'sid_invitation_to_wine', 'sid_vernal_winds', 'sid_destiny', 'sid_here_people_sows', 'sid_joy_of_reunion', 'sid_mirror_anthology', 'sid_four_seasons', 'collab_nine_colored_deer']
  },
  {
    id: 'higashi',
    nameKo: '극동',
    nameEn: 'Higashi',
    capital: '쿠사리카와 (북조) / 미츠쿠에 (남조)',
    emblemPixelCoords: { x: 645, y: 396 },
    badgeColor: '#6366f1',
    logoUrl: '/images/logos/higashi.png',
    elevation: 1,
    description: '염국 북동방 열도의 섬나라. 북조와 남조의 오랜 내전과 닌자, 귀족 가문의 암투가 이어지는 고립주의 국가이다.',
    relatedStoryIds: ['collab_monster_hunter', 'collab_mh2_lightning']
  },
  {
    id: 'siracusa',
    nameKo: '시라쿠사',
    nameEn: 'Siracusa',
    capital: '볼시니',
    emblemPixelCoords: { x: 487, y: 524 },
    badgeColor: '#b45309',
    logoUrl: '/images/logos/siracusa.png',
    elevation: 1,
    description: '마피아 패밀리들이 정부를 대신해 도시의 질서를 좌우하는 폭력과 배신의 땅. 라이타니엔 남동쪽에 위치한다.',
    relatedStoryIds: ['sid_il_siracusano', 'sid_opening_act', 'sid_crossroads', 'sid_echoes_wilderness', 'sid_code_of_brawl']
  },
  {
    id: 'victoria',
    nameKo: '빅토리아 왕국',
    nameEn: 'Kingdom of Victoria',
    capital: '런디니움',
    emblemPixelCoords: { x: 383, y: 549 },
    badgeColor: '#7c3aed',
    logoUrl: '/images/logos/victoria.png',
    elevation: 2,
    description: '테라 중원을 호령하는 유서 깊은 열강이었으나, 국왕 사후 왕위 공백 상태에서 살카즈 군사위원회의 런디니움 점령으로 인해 거대한 전란의 소용돌이에 휩싸였다.',
    relatedStoryIds: ['ep09', 'ep10', 'ep11', 'ep12', 'ep13', 'ep14', 'sid_light_spark', 'sid_firelight_casts', 'sid_burnt_elegy']
  },
  {
    id: 'minos',
    nameKo: '미노스',
    nameEn: 'Minos',
    capital: '아테누스 (Athenius)',
    emblemPixelCoords: { x: 273, y: 586 },
    badgeColor: '#ea580c',
    logoUrl: '/images/logos/minos.png',
    elevation: 1,
    description: '고대 테라의 영웅 서사와 철학, 체육 문화를 계승한 연합 도시 국가. 빅토리아 서남쪽에 위치한다.',
    relatedStoryIds: []
  },
  {
    id: 'siesta',
    nameKo: '시에스타',
    nameEn: 'Siesta',
    capital: '신 시에스타',
    emblemPixelCoords: { x: 334, y: 593 },
    badgeColor: '#06b6d4',
    logoUrl: '/images/logos/siesta.png',
    elevation: 1,
    description: '거대한 클라리사이드 해안과 온천, 록 페스티벌로 유명한 독립 휴양 도시. 이동도시로의 전환을 이뤄냈다.',
    relatedStoryIds: ['sid_heart_of_surging_flame', 'sid_so_long_adele', 'sid_to_be_continued']
  },
  {
    id: 'laterano',
    nameKo: '라테라노',
    nameEn: 'Laterano',
    capital: '라테라노 성도',
    emblemPixelCoords: { x: 450, y: 586 },
    badgeColor: '#fef08a',
    logoUrl: '/images/logos/laterano.png',
    elevation: 1,
    description: '산크타 종족의 율법과 총기, 디저트의 신성 낙원. 수호총과 율법의 신비 속에 숨겨진 고대 통제 시스템의 비밀을 안고 있다.',
    relatedStoryIds: ['sid_guiding_ahead', 'sid_hortus_escapismo', 'sid_pilgrimage']
  },
  {
    id: 'rim_billiton',
    nameKo: '림 빌리턴',
    nameEn: 'Rim Billiton',
    capital: '마이닝 시티',
    emblemPixelCoords: { x: 546, y: 590 },
    badgeColor: '#db2777',
    logoUrl: '/images/logos/rim_billiton.png',
    elevation: 1,
    description: '카우투스 종족 중심의 대규모 오리지늄 광업 및 중공업 채굴 연합국. 로도스 아일랜드 본함의 전신인 육상 순양함이 건조된 곳이다.',
    relatedStoryIds: ['sid_babel', 'sid_orange_earth']
  },
  {
    id: 'sargon',
    nameKo: '사르곤',
    nameEn: 'Sargon',
    capital: '샤르-아가 (황금의 도시)',
    emblemPixelCoords: { x: 229, y: 631 },
    badgeColor: '#ca8a04',
    logoUrl: '/images/logos/sargon.png',
    elevation: 1,
    description: '끝없는 사막과 열대 정글이 펼쳐진 서남부 고대 제국. 파디샤(군주)들의 영지 갈등과 지하 첨단 두린족 도시가 공존한다.',
    relatedStoryIds: ['sid_gavial_returns', 'sid_ideal_city', 'sid_shake_off_the_sun', 'sid_ruins_paradise', 'sid_walk_in_dust', 'collab_originium_dust']
  },
  {
    id: 'iberia',
    nameKo: '이베리아',
    nameEn: 'Iberia',
    capital: '페르도니도라 / 그란파로',
    emblemPixelCoords: { x: 439, y: 659 },
    badgeColor: '#65a30d',
    logoUrl: '/images/logos/iberia.png',
    elevation: 1,
    description: '남부 황금 해양 강국이었으나, "대침묵" 사건 이후 심해로부터 밀려오는 시본(Seaborn)의 공포에 맞서고 있다.',
    relatedStoryIds: ['sid_under_tides', 'sid_stultifera_navis', 'sid_path_of_life']
  },
  {
    id: 'foehn_hotlands',
    nameKo: '푄 고온지대',
    nameEn: 'Foehn Hotlands',
    emblemPixelCoords: { x: 225, y: 744 },
    badgeColor: '#78350f',
    elevation: 3,
    description: '테라 남방 대륙을 가로지르는 광활하고 치명적인 불모의 열대 화산 고원. 극한의 기후로 인해 인간의 접근이 제한되어 있는 미개척 위험 지대이다.',
    relatedStoryIds: []
  },
  {
    id: 'aegir',
    nameKo: '에기르 (심해)',
    nameEn: 'Aegir Ocean Realm',
    capital: '밀리아리움',
    emblemPixelCoords: { x: 586, y: 867 },
    badgeColor: '#0284c7',
    logoUrl: '/images/logos/aegir.png',
    elevation: -1,
    description: '테라 동남부 깊은 바다속에 은폐되어 있던 초고도 과학 문명 국가. 심해 괴생명체 시본과의 처절한 생존 전쟁을 벌이고 있다.',
    relatedStoryIds: ['sid_under_tides', 'sid_stultifera_navis', 'sid_path_of_life', 'sid_escape_sea']
  }
];

// 주요 이동도시 및 전략 랜드마크 핀 (3.0 공식 헥사곤 타일 정밀 매칭 · 27개 핵심 거점)
export const terraCities: TerraCity[] = [
  // 0. 로도스 아일랜드 본함
  {
    id: 'rhodes_landship',
    nameKo: '로도스 아일랜드 본함',
    nameEn: 'Rhodes Island Landship',
    regionId: 'kazdel',
    pixelCoords: { x: 548, y: 467 },
    type: 'rhodes',
    relatedStoryId: 'ep01'
  },

  // 1. 우르수스 제국
  {
    id: 'deitygryad',
    nameKo: '디에티 그라이퍼부르크',
    nameEn: 'Deity Grypherburg',
    regionId: 'ursus',
    pixelCoords: { x: 455, y: 398 },
    type: 'capital',
    relatedStoryId: 'sid_walk_in_dust'
  },
  {
    id: 'chernobog',
    nameKo: '체르노보그',
    nameEn: 'Chernobog',
    regionId: 'ursus',
    pixelCoords: { x: 534, y: 424 },
    type: 'nomadic-city',
    relatedStoryId: 'ep00'
  },

  // 2. 염국 (Yan)
  {
    id: 'lungmen_city',
    nameKo: '이동도시 용문',
    nameEn: 'Lungmen Core',
    regionId: 'yan',
    pixelCoords: { x: 583, y: 450 },
    type: 'capital',
    relatedStoryId: 'ep02'
  },
  {
    id: 'baizao',
    nameKo: '백조 (경성)',
    nameEn: 'Baizao',
    regionId: 'yan',
    pixelCoords: { x: 666, y: 458 },
    type: 'capital',
    relatedStoryId: 'sid_joy_of_reunion'
  },
  {
    id: 'yumen',
    nameKo: '옥문',
    nameEn: 'Yumen',
    regionId: 'yan',
    pixelCoords: { x: 602, y: 424 },
    type: 'nomadic-city',
    relatedStoryId: 'sid_vernal_winds'
  },
  {
    id: 'shangshu',
    nameKo: '상촉',
    nameEn: 'Shangshu',
    regionId: 'yan',
    pixelCoords: { x: 622, y: 493 },
    type: 'nomadic-city',
    relatedStoryId: 'sid_invitation_to_wine'
  },
  {
    id: 'dahuang',
    nameKo: '대황성',
    nameEn: 'Dahuang',
    regionId: 'yan',
    pixelCoords: { x: 686, y: 441 },
    type: 'nomadic-city',
    relatedStoryId: 'sid_here_people_sows'
  },

  // 3. 카시미어
  {
    id: 'kawalerielki',
    nameKo: '카발레리에키',
    nameEn: 'Kawalerielki',
    regionId: 'kazimierz',
    pixelCoords: { x: 356, y: 450 },
    type: 'capital',
    relatedStoryId: 'sid_near_light'
  },
  {
    id: 'drops_village',
    nameKo: '물방울 마을',
    nameEn: 'Drops Village',
    regionId: 'kazimierz',
    pixelCoords: { x: 376, y: 476 },
    type: 'landmark',
    relatedStoryId: 'sid_grani'
  },

  // 4. 컬럼비아 연방
  {
    id: 'trimounts',
    nameKo: '트리마운츠',
    nameEn: 'Trimounts',
    regionId: 'columbia',
    pixelCoords: { x: 243, y: 476 },
    type: 'capital',
    relatedStoryId: 'sid_lone_trail'
  },
  {
    id: 'mansfield_prison',
    nameKo: '맨스필드 이동교도소',
    nameEn: 'Mansfield State Prison',
    regionId: 'columbia',
    pixelCoords: { x: 204, y: 467 },
    type: 'nomadic-city',
    relatedStoryId: 'sid_mansfield_break'
  },
  {
    id: 'pioneer_base_359',
    nameKo: '359호 개척기지',
    nameEn: 'Pioneer Base 359',
    regionId: 'columbia',
    pixelCoords: { x: 283, y: 458 },
    type: 'landmark',
    relatedStoryId: 'sid_dorothys_vision'
  },

  // 5. 볼리바르 & 쉐라그
  {
    id: 'dossoles_city',
    nameKo: '도솔레스',
    nameEn: 'Dossoles',
    regionId: 'bolivar',
    pixelCoords: { x: 180, y: 486 },
    type: 'nomadic-city',
    relatedStoryId: 'sid_dossoles_holiday'
  },
  {
    id: 'turis_karlan',
    nameKo: '투리쿰 (카란 성산)',
    nameEn: 'Turicum / Mt. Karlan',
    regionId: 'kjerag',
    pixelCoords: { x: 317, y: 519 },
    type: 'capital',
    relatedStoryId: 'sid_break_the_ice'
  },

  // 6. 라이타니엔 & 시라쿠사
  {
    id: 'zwillingsturme',
    nameKo: '츠빌링슈튀르메',
    nameEn: 'Zwillingstürme',
    regionId: 'leithanien',
    pixelCoords: { x: 425, y: 502 },
    type: 'capital',
    relatedStoryId: 'sid_zwillingsturme'
  },
  {
    id: 'wolumonde',
    nameKo: '월루몽드',
    nameEn: 'Wolumonde',
    regionId: 'leithanien',
    pixelCoords: { x: 455, y: 519 },
    type: 'nomadic-city',
    relatedStoryId: 'sid_twilight_wolumonde'
  },
  {
    id: 'volsinii',
    nameKo: '볼시니',
    nameEn: 'Volsinii',
    regionId: 'siracusa',
    pixelCoords: { x: 494, y: 519 },
    type: 'capital',
    relatedStoryId: 'sid_il_siracusano'
  },

  // 7. 빅토리아 왕국
  {
    id: 'londinium',
    nameKo: '런디니움',
    nameEn: 'Londinium',
    regionId: 'victoria',
    pixelCoords: { x: 386, y: 554 },
    type: 'capital',
    relatedStoryId: 'ep14'
  },
  {
    id: 'county_hillock',
    nameKo: '힐록 카운티',
    nameEn: 'County Hillock',
    regionId: 'victoria',
    pixelCoords: { x: 356, y: 537 },
    type: 'nomadic-city',
    relatedStoryId: 'ep09'
  },

  // 8. 라테라노 & 시에스타 & 림 빌리턴
  {
    id: 'laterano_city',
    nameKo: '라테라노 성도',
    nameEn: 'Laterano City',
    regionId: 'laterano',
    pixelCoords: { x: 450, y: 586 },
    type: 'capital',
    relatedStoryId: 'sid_guiding_ahead'
  },
  {
    id: 'new_siesta',
    nameKo: '시에스타 (신 시에스타)',
    nameEn: 'New Siesta',
    regionId: 'siesta',
    pixelCoords: { x: 334, y: 593 },
    type: 'nomadic-city',
    relatedStoryId: 'sid_heart_of_surging_flame'
  },
  {
    id: 'mining_city',
    nameKo: '마이닝 시티',
    nameEn: 'Mining City',
    regionId: 'rim_billiton',
    pixelCoords: { x: 548, y: 597 },
    type: 'nomadic-city',
    relatedStoryId: 'sid_babel'
  },

  // 9. 사르곤 & 이베리아 & 에기르
  {
    id: 'acahualla',
    nameKo: '아카후알라 (쎄루에르차)',
    nameEn: 'Acahualla / Zeruertza',
    regionId: 'sargon',
    pixelCoords: { x: 258, y: 649 },
    type: 'landmark',
    relatedStoryId: 'sid_gavial_returns'
  },
  {
    id: 'gran_faro',
    nameKo: '그란파로 (눈의 등대)',
    nameEn: 'Gran Faro',
    regionId: 'iberia',
    pixelCoords: { x: 450, y: 667 },
    type: 'capital',
    relatedStoryId: 'sid_stultifera_navis'
  },
  {
    id: 'sal_viento',
    nameKo: '살비엔토',
    nameEn: 'Sal Viento',
    regionId: 'iberia',
    pixelCoords: { x: 415, y: 658 },
    type: 'landmark',
    relatedStoryId: 'sid_under_tides'
  },
  {
    id: 'milliarium',
    nameKo: '밀리아리움',
    nameEn: 'Milliarium',
    regionId: 'aegir',
    pixelCoords: { x: 586, y: 867 },
    type: 'capital',
    relatedStoryId: 'sid_path_of_life'
  }
];

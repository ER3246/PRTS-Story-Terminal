import type { StoryArchive } from '../../types/story';

export const episode16: StoryArchive = {
  id: 'ep16',
  code: 'EPISODE 16',
  category: 'main',
  categoryLabel: '메인 테마',
  actGroup: '제3부: 변화의 서곡',
  titleKo: '비정상 스펙트럼',
  titleEn: 'Abnormal Spectrum',
  order: 16,
  bannerImage: '/images/story_covers/ep16.png',
  status: 'restored',
  docFormat: 'multi_part',
  isOmnibus: false,
  storyLineId: 'MAIN_ACT_3',
  storyLineTitle: '변화의 서곡 (Main Act III 변화의 서곡)',
  officialSynopsis: '로도스 아일랜드 본함이 봉인된 지 한 달 후인 1101년 가을, 켈시의 과거 기록에서 단서를 찾은 인간형 소녀 Mon3tr와 로도스 선발대는 통신이 두절된 라이디언 소대를 구출하기 위해 우르수스 최북단 크라이니 세베르 광산지구로 향한다. 그곳에서는 미지의 물질 \'오카\'를 이용한 잔혹한 생체 실험과 감염자 광부 렌킨의 무장 봉기, 그리고 유로지비 사상에 잠식된 호리의 학살이 휘몰아치고 있었다. 제2갱도 심층부에서 제국의 존속을 위협하는 전대미문의 \'오리지늄 광맥 전면 고갈\'을 확인한 박사와 Mon3tr, 그리고 수백 명의 통각 공명을 홀로 받아낸 만트라의 희생과 크라운슬레이어의 지원 속에 로도스는 탈출에 성공하지만, 제국은 전면전을 통한 대지 침공의 불길을 지피기 시작한다.',
  seriesTabs: [
    { id: 'overview', label: '전체 요약 및 개요', code: 'OVERVIEW' },
    { id: 'part_1', label: 'Part 1: 제국 의회의 심판과 변방 광산의 그림자', code: 'PART 1' },
    { id: 'part_2', label: 'Part 2: 갱도의 광기와 통각의 분수령', code: 'PART 2' },
    { id: 'part_3', label: 'Part 3: 설원의 묘비와 불망의 행렬', code: 'PART 3' },
    { id: 'part_4', label: 'Part 4: 비정상 스펙트럼과 대지의 불길', code: 'PART 4' }
  ],
  auditMeta: {
    pipelineVersion: 'v4.0-TwoTierCanon',
    sourceStagesCount: 23,
    draftModel: 'PRTS Frontier Engine (Pass 4 Master Canon Direct)',
    reviewedBy: 'Master Script Audit Report Final Verification (ko_KR Official Script 100% Canon Master)',
    lastVerifiedAt: '2026-10-31'
  },
  systemMeta: {
    recordedTime: '1101-11-15 12:00:00 (Post-Krayniy Sever Expedition Record // REF: ST-16-02)',
    securityLevel: 'CONFIDENTIAL // LEVEL 4 (NORTHERN EXPEDITION PROTOCOL)',
    operatorInCharge: 'Mon3tr (Humanoid Form) & Doctor & Amiya'
  },
  meta: {
    timeline: '테라 1099년 가을 (우르수스 제국 의회 재판) ~ 1101년 가을 (본함 봉인 1개월 후 및 크라이니 세베르 사태)',
    location: '우르수스 제국 의회, 북툰드라 황야, 크라이니 세베르 중앙 광산지구 및 제2 갱도, 이동도시 브레스크, 디에티 그라이퍼부르크',
    factions: [
      '로도스 아일랜드',
      '우르수스 제국 (제국 의회 / 북방 군단 / 황제의 칼날)',
      '크라이니 세베르 감염자 광부 무리',
      '리유니온 잔당 (탈룰라 / 나인 / 크라운슬레이어)',
      '융합 우주 방랑자 (힐다)'
    ],
    mainCharacters: [
      'Mon3tr', '아미야', '박사', '만트라', '라이디언', '엘리시움',
      '옐리자 여대공', '알로이즈', '크세니야', '렌킨', '닉토', '호리',
      '베토치키', '나댜', '탈룰라', '나인', '크라운슬레이어', '힐다'
    ]
  },
  content: {
    prtsGreeting: '박사님, 우르수스 북방 원정 소대로부터 복원된 최신 정본 아카이브입니다. EPISODE 16 《비정상 스펙트럼》의 23개 전 스테이지 서사와 오리지늄 광맥 고갈에 관한 제국의 비밀 기록이 마스터 데이터베이스에 영구 동기화되었습니다.',
    logline: '로도스 아일랜드 본함이 봉인된 지 한 달 후인 1101년 가을, 켈시의 과거 기록에서 단서를 찾은 인간형 소녀 Mon3tr와 로도스 선발대는 통신이 두절된 라이디언 소대를 구출하기 위해 우르수스 최북단 크라이니 세베르 광산지구로 향한다. 그곳에서는 미지의 물질 \'오카\'를 이용한 잔혹한 생체 실험과 감염자 광부 렌킨의 무장 봉기, 그리고 유로지비 사상에 잠식된 호리의 학살이 휘몰아치고 있었다. 제2갱도 심층부에서 제국의 존속을 위협하는 전대미문의 \'오리지늄 광맥 전면 고갈\'을 확인한 박사와 Mon3tr, 그리고 수백 명의 통각 공명을 홀로 받아낸 만트라의 희생과 크라운슬레이어의 지원 속에 로도스는 탈출에 성공하지만, 제국은 전면전을 통한 대지 침공의 불길을 지피기 시작한다.',
    background: '1099년 가을 제국 의회에서 유로지비에 대한 심판이 열리고 황제의 칼날이 북방을 수색하는 사이, 1101년 가을 로도스 아일랜드는 연락이 끊긴 라이디언 소대를 찾기 위해 크라이니 세베르에 진입한다. 젊은 귀족 알로이즈와 옐리자 여대공의 묵인 하에 폐쇄된 지하 연구소를 수색하던 일행은 과거 체르노보그 연구원 크세니야를 구출하고 근위병마저 파괴하는 \'오카\'의 진실을 마주한다.',
    acts: [],
    analysis: {
      theme: '**비정상 스펙트럼(Abnormal Spectrum)과 문명의 침묵** — 오리지늄 광맥의 급격한 활성 저하로 인해 대기의 빛과 전자기 스펙트럼이 왜곡되는 현상은, 오리지늄 에너지에 전적으로 의존해 온 우르수스 제국과 테라 문명의 종말을 예고한다. 극한의 억압 속에서 광신적 유로지비 사상에 매몰되어 자멸을 구원으로 착각하는 인간들의 비극과, 수백 명의 고통을 대신 짊어지며 생존의 존엄을 지켜낸 만트라와 베토치키의 저항은 대지의 어둠 속에서 진정한 구원이 무엇인가를 묻는다.',
      tacticalEvaluation: 'EPISODE 16 작전은 전파 교란과 데몬의 잔류 오염, 그리고 제국 정규군의 무차별 포격 속에서 진행된 극한의 퇴출 작전이었다. 박사와 Mon3tr의 심층부 광맥 조사, 아미야와 만트라의 집단 통증 억제, 그리고 크라운슬레이어의 적시 개입이 맞물려 전 오퍼레이터 무사 귀환 및 감염자 광부 피난을 완수했다. 특히 만트라의 전면 정신 아츠 개방은 단일 개체가 광역 통증 공명을 제어한 전술적 기적으로 평가된다.',
      loreImpact: '1. **테라 전역 오리지늄 광맥 고갈의 최초 관측:** 크라이니 세베르 제2갱도에서 확인된 광맥 사멸은 향후 테라 전체의 에너지 위기와 이동도시 기능 상실을 예고하는 중대한 복선이다.\n2. **우르수스 제국의 전면 대외 침공 결의:** 광맥 고갈을 은폐하고 체제 붕괴를 막기 위해 황실과 군부가 대륙 전체를 겨냥한 전쟁을 결의함에 따라 제3부의 거대한 전란이 현실화되었다.\n3. **힐다의 귀환과 초월적 치유 능력:** 융합 우주에서 현실로 돌아온 힐다가 오리지늄의 통증을 소멸시키는 기적을 행사하며 새로운 구원 세력의 등장을 알렸다.',
      unresolvedHooks: [
        '우르수스 제국의 전면 개전 방향:: 광맥 고갈의 위기 속에서 우르수스 군부가 선택한 첫 번째 침공 대상 국가는 어디인가?',
        '힐다가 이끄는 구원의 행렬:: 융합 우주의 기적으로 통증을 잃은 감염자들은 테라의 새로운 질서가 될 것인가, 아니면 또 다른 특이점의 씨앗인가?',
        'Mon3tr와 체르노보그 석관:: 크세니야의 데이터를 확보한 로도스는 체르노보그 깊숙한 곳의 석관에서 켈시를 온전히 복원할 수 있을 것인가?',
        '황제의 칼날과 \'오카\'의 비밀:: 근위병마저 죽일 수 있는 미지의 물질 \'오카\'의 기원과 데몬과의 연관성은 무엇인가?'
      ]
    }
  },
  multiPartArcs: [
    {
      id: 'part_1',
      partNumber: 1,
      partTitleKo: '제국 의회의 심판과 변방 광산의 그림자',
      partTitleEn: 'Judgment of the Imperial Duma and Shadows of the Frontier Mine',
      code: 'PART 1',
      location: '우르수스 제국 의회, 북툰드라 황야, 크라이니 세베르 중앙 광산지구, 이동도시 브레스크(Blesk), 지하 연구소',
      timeline: '테라 1099년 가을 ~ 1101년 가을 (3일 전 잠입 시점 포함)',
      cgUrl: '/images/cgs/66_i27.png',
      cgCaption: '툰드라 설원의 여명',
      synopsis: "1099년 가을 제국 의회에서 유로지비에 대한 심판이 열리고 황제의 칼날이 북방을 수색하는 사이, 1101년 가을 로도스 아일랜드는 연락이 끊긴 라이디언 소대를 찾기 위해 크라이니 세베르에 진입한다. 젊은 귀족 알로이즈와 옐리자 여대공의 묵인 하에 폐쇄된 지하 연구소를 수색하던 일행은 과거 체르노보그 연구원 크세니야를 발견하고, 그녀로부터 근위병마저 죽일 수 있는 미지의 물질 '오카'에 대한 경고를 듣는다.",
      narrativeText: "1099년 가을, 우르수스 제국 의회는 광신적 유로지비 사상을 단죄하기 위한 7일간의 공개 재판을 벌이고, 북방 설원에서는 황제의 칼날이 신체 구조가 붕괴된 유로지비를 추적한다. 2년 후인 1101년 가을, EP15 본함 봉인 이후 새로운 이동 기지에서 재정비를 마친 로도스 아일랜드는 우르수스 크라이니 세베르 광산지구에서 통신이 두절된 라이디언 소대를 구출하기 위해 박사, 아미야, Mon3tr, 만트라, 엘리시움으로 구성된 선발대를 파견한다. 중심 도시 브레스크에서 호위병들의 포위망에 갇힌 일행은 젊은 귀족 알로이즈의 도움으로 탈출하고, 옐리자 여대공을 알현하여 광산 조사의 통행권을 얻어낸다. 폭동을 일으킨 감염자 광부들의 저지를 뚫고 폐허가 된 지하 연구소 깊숙이 진입한 일행은 과거 체르노보그 시절 켈시의 조수였던 크세니야를 극적으로 구출한다. 탈수와 부상으로 쓰러진 크세니야는 '오카'라는 미지의 물질이 근위병마저 죽일 수 있다는 충격적인 사실을 알리며 경고를 보낸다.",
      stages: [
        {
          stageCode: 'ST-16-01',
          title: '평범한 자의 구제',
          location: '우르수스 제국 의회, 1099년 가을, 우르수스 북툰드라 황야, ■■■■년, 우르수스 크라이니 세베르 중앙 광산지구, 1101년 가을',
          summary: "1099년 가을, 우르수스 제국 의회에서는 황제의 뜻에 따라 한 신하에 대한 7일간의 공개 심판이 막바지에 다다른다.",
          narrativeText: "1099년 가을, 우르수스 제국 의회에서는 황제의 뜻에 따라 한 신하에 대한 7일간의 공개 심판이 막바지에 다다른다. 귀족들은 빅토리아의 재앙 통제 기술과 마족의 공중전함 개발 소식에 위기감을 느끼며 의회의 지지부진한 논쟁을 촌극이라 비난하지만, 황제는 심판을 통해 유로지비의 광신적 사상을 단죄하려 한다.\n\n같은 시기 우르수스 북툰드라 설원에서는 정체불명의 데몬 침식 속에서 '황제의 칼날'이 신체 붕괴를 겪는 유로지비 '가브리일'을 추적한다. 칼날은 신체 구조가 파괴된 자를 제국으로 압송하는 것은 무의미하다며 투항을 종용하지만, 가브리일은 자신이 유로지비가 아니라고 절규하며 끝까지 저항한다.\n\n2년 후인 1101년 가을, EP15의 로도스 본함 봉인 후 새로운 이동 섹터 기지를 마련한 로도스 아일랜드는 우르수스 크라이니 세베르 중앙 광산지구에서 통신이 두절된 라이디언 정예 소대를 구출하기 위해 선발대(박사, 아미야, 인간형 각성체 Mon3tr, 만트라, 엘리시움)를 급파한다.\n\n광산지구 초입에 도달한 박사와 Mon3tr는 대규모 군사 충돌의 잔해를 목격한다. 황제의 칼날이 관여한 징후가 역력함에도 오리지늄 아츠를 사용한 흔적이 전혀 없다는 기이한 현상에 직면하자, 만트라는 라이디언의 잔류 암호를 포착하고 연구소 방향으로 수색을 개시한다.",
          cgUrl: '/images/cgs/66_i02.png',
          cgCaption: '평범한 자의 구제 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i02.png',
              caption: '평범한 자의 구제 핵심 시각 연출',
              type: 'cg',
              triggerLine: "오염의 규모와 형태를 보면 '국가'가 남긴 오염 같아...."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'amiya',
            'mantra',
            'elysium',
            'emperors_blade',
            '초조한_귀족',
            '공손한_부하',
            '과묵한_군인',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "오염의 규모와 형태를 보면 '국가'가 남긴 오염 같아.",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "도시 내 거점으로 보내온 신호 표기에 따르면, 라이디언 씨 소대가 마지막으로 메시지를 보낸 시점은 열흘 전이에요.",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "전방에 데몬의 오염이 보인다.",
            },
            {
              speaker: "엘리시움",
              speakerId: 'elysium',
              text: "하지만 여기는 사미에서 우르수스 크기의 3분의 1 정도 거리 떨어져 있는데? 어떻게……",
            },
          ]
        },
        {
          stageCode: '16-1',
          title: '아득한 새벽빛',
          location: '우르수스 크라이니 세베르 중앙 광산지구, 우르수스 크라이니 세베르, 브레스크, 3일 전',
          summary: "광산지구로 진입하는 로도스 선발대는 장비들이 정체불명의 전자기적 장애로 먹통이 되어 오염 구역의 상세 범위를 감지할 수 없는 난관에 부딪힌다.",
          narrativeText: "광산지구로 진입하는 로도스 선발대는 장비들이 정체불명의 전자기적 장애로 먹통이 되어 오염 구역의 상세 범위를 감지할 수 없는 난관에 부딪힌다. 만트라와 Mon3tr는 지형과 잔류 신호를 바탕으로 경로를 재설정한다.\n\n시점은 3일 전으로 거슬러 올라가, 로도스 일행이 라이디언 소대의 흔적을 추적하여 크라이니 세베르의 중심 이동도시 브레스크(Blesk)에 잠입했던 정황이 드러난다. 브레스크는 변방의 소도시임에도 불구하고 삼엄한 군사 경계가 펼쳐져 있었다.\n\n도시 간 무역상으로 위장한 로도스 일행은 브레스크 호위병들의 집요한 불심검문과 추격을 받으며 포위될 위기에 처한다. 평화로워야 할 도시에서 이토록 대규모 방위 병력이 가동되는 것에 아미야와 엘리시움은 깊은 의문을 품는다.\n\n그 순간, 우르수스의 젊은 귀족 청년 알로이즈(Alois)가 나타나 로도스 일행을 호위병들의 시야에서 숨겨준다. 알로이즈는 광산지구의 이상 사태를 파악하기 위해 로도스와 협력하겠다는 뜻을 밝히며 안내자를 자처한다.",
          cgUrl: '/images/cgs/66_i27.png',
          cgCaption: '아득한 새벽빛 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i27.png',
              caption: '아득한 새벽빛 핵심 시각 연출',
              type: 'cg',
              triggerLine: "감탄하지 않을 수가 없네. 아주 완벽한 호흡이야!..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'amiya',
            'mantra',
            'elysium',
            'alois',
            '치직거리는_잡음',
            '크라이니_세베르_호위병',
            '주저하는_호위병',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "감탄하지 않을 수가 없네. 아주 완벽한 호흡이야!",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "엘리시움 씨와 만트라 씨는 오랜 파트너 사이니까요.",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "엘리시움",
              speakerId: 'elysium',
              text: "가져온 장비들이 먹통이 됐나 보네. 오염 구역의 상세 범위를 감지할 수 없어.",
            },
            {
              speaker: "알로이즈",
              speakerId: 'alois',
              text: "미안, 광산 설비를 조사하느라. 우리가 동행하는 이유와는 무관해.",
            },
          ]
        },
        {
          stageCode: '16-3',
          title: '도로이목',
          location: '로도스 아일랜드 새로운 기지, 회의실, 우르수스 크라이니 세베르 중앙 광산지구, 5일 전, 우르수스 크라이니 세베르, 브레스크, 3일 전',
          summary: "회상: 로도스 아일랜드 신기지 회의실에서 와파린, 라이디언, 클로저, 아미야, Mon3tr는 석관을 통해 켈시를 복원할 단서를 추적한다.",
          narrativeText: "회상: 로도스 아일랜드 신기지 회의실에서 와파린, 라이디언, 클로저, 아미야, Mon3tr는 석관을 통해 켈시를 복원할 단서를 추적한다. 켈시의 개인 기록 중 체르노보그 석관 연구소 시절 일리아의 조수로 일했던 '크세니야'(Kseniya)가 크라이니 세베르 연구소에 배치되었다는 기록을 확보하고, 라이디언 소대가 선발대로 파견되었다.\n\n5일 전 광산지구에 도착한 라이디언 소대는 광부들이 정체불명의 극심한 통증과 신체 변이에 시달리며 쓰러져가는 끔찍한 현장을 목격했다. 감염자들은 체내 오리지늄이 제어 불능으로 변이하며 극심한 고통 속에 울부짖고 있었다.\n\n브레스크에서 알로이즈는 이 지역 통치자인 옐리자 여대공이 중앙 광산지구 반경 30km 주민들에게 24시간 내 소개령을 내렸음을 알린다. 알로이즈는 군부와 의회의 갈등 속에서 광산의 진실을 밝히기 위해 여대공을 직접 접견해야 한다고 설득한다.\n\n로도스 일행은 알로이즈의 주선으로 옐리자 여대공을 만나기 위해 관저로 향하고, 켈시의 유지를 잇고 라이디언을 구출하기 위한 결의를 다진다.",
          cgUrl: '/images/cgs/66_g4_miningarea_polluted.png',
          cgCaption: '도로이목 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_g4_miningarea_polluted.png',
              caption: '도로이목 핵심 시각 연출',
              type: 'cg',
              triggerLine: "지금까지 우리가 파악한 석관의 가장 최근 동향은 체르노보그-용문..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'amiya',
            'raidian',
            'renkin',
            'nikto',
            'khori',
            'betochki',
            'closer',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "지금까지 우리가 파악한 석관의 가장 최근 동향은 체르노보그-용문 사건 이후, 우르수스 당국이 석관 시스템을 통째로 회수했다는 거야.",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "우리가 찾아야 하는 게 이 아르툠이란 사람인가요?",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "우르수스는 지금도 위험한 곳이야. 이번 임무에서 우리가 가진 정보도 상당히 제한적이고.",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "렌킨",
              speakerId: 'renkin',
              text: "……적어도 눈밭에서 피를 흘리며 죽게 하지는 않았어.",
            },
          ]
        },
        {
          stageCode: '16-4',
          title: '우정 무리',
          location: '우르수스 크라이니 세베르 중앙 광산지구, 우르수스, 크라이니 세베르 중앙 광산지구 연구소',
          summary: "박사는 알로이즈의 안내를 받아 옐리자 여대공을 단독 알현한다.",
          narrativeText: "박사는 알로이즈의 안내를 받아 옐리자 여대공을 단독 알현한다. 여대공은 제국 군부의 압박 속에서도 광산의 이상 현상을 은폐하려 하지 않고, 로도스가 광산지구에 들어가 진상을 조사하는 것을 묵인하며 특별 통행을 허가한다.\n\n로도스 일행은 봉쇄된 중앙 광산지구 지하 연구소로 향하던 중, 감시팀을 제압하고 무장 봉기한 감염자 광부 무리와 조우한다. 광부들은 '렌킨'의 격문과 '리유니온'의 소문을 믿고 스스로를 지키기 위해 무기를 든 상태였다. 아미야는 자신들이 리유니온이 아닌 로도스 아일랜드임을 밝혀 유혈 사태를 막는다.\n\n약탈당하고 피폐해진 연구소 내부로 진입한 일행은 구역을 나누어 수색을 전개한다. 박사와 Mon3tr는 잠겨 있던 전망대 영안실 구역에서 희미한 생체 신호를 포착한다.\n\n바닥에 파기된 연구 유서들이 흩어진 가운데, 과거 체르노보그 연구원이었던 크세니야가 탈수와 의식 혼미 상태로 쓰러져 있다. 크세니야는 Mon3tr를 알아보고 \"오카(Oka)는…… 근위병을…… 죽일 수 있어요……\"라는 경고를 남기며 정신을 잃는다.",
          cgUrl: '/images/cgs/66_i05.png',
          cgCaption: '우정 무리 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i05.png',
              caption: '우정 무리 핵심 시각 연출',
              type: 'cg',
              triggerLine: "이건 불합리한 요구야. 만약 무슨 일이 생긴다면 나도, 아미야도..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'amiya',
            'mantra',
            'elysium',
            'alois',
            'yeliza',
            'kseniya',
            '하인',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "이건 불합리한 요구야. 만약 무슨 일이 생긴다면 나도, 아미야도 너를 지켜줄 수 없어.",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "알로이즈 씨가 저희에게 여대공을 만나게 해준다고는 했지만, 대체 왜 우리를 도우려는 건지 아직도 모르겠어요……",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "이쪽에는 특별한 발견이 없어.",
            },
            {
              speaker: "엘리시움",
              speakerId: 'elysium',
              text: "난 시력이 좋으니까, 한 번 확인해 볼게!",
            },
          ]
        },
      ]
    },
    {
      id: 'part_2',
      partNumber: 2,
      partTitleKo: '갱도의 광기와 통각의 분수령',
      partTitleEn: 'Watershed of Madness and Flickering Pain',
      code: 'PART 2',
      location: '중앙 광산지구 지하 연구소, 제2갱도 입구, 툰드라 설원, 고립된 설원 정착촌 마을',
      timeline: '1101년 가을 (광부 폭동 3일 후)',
      cgUrl: '/images/cgs/66_i23.png',
      cgCaption: '불타는 마을과 영혼의 정화를 주장하는 호리의 광기',
      synopsis: "연구소에 남은 박사와 Mon3tr가 크세니야의 증언을 토대로 '오카' 샘플을 회수하기 위해 갱도 심층부로 내려가는 동안, 아미야 일행은 남쪽으로 도주한 감염자 광부들을 뒤쫓는다. 광부 렌킨이 제국에 대한 복수를 결의하며 무리를 이끄는 사이, 광신적 망상에 빠진 광부 호리는 정착촌 마을에 불을 지르고 주민들을 학살하는 끔찍한 비극을 일으킨다.",
      narrativeText: "지하 연구소에서 박사와 Mon3tr는 크세니야로부터 '오카'가 체내 오리지늄 변이를 촉진하고 감염자들 사이에 통증을 전이시키는 미지의 물질이라는 설명을 듣는다. 박사와 Mon3tr는 갱도 심층부로 내려가 직접 샘플을 조사하기로 하고, 아미야와 만트라, 알로이즈는 도주한 광부 무리를 추적하기 위해 설원으로 향한다. 한편 탈출한 광부 무리를 이끄는 렌킨은 제국의 착취에 맞서 대규모 봉기를 계획하지만, 극심한 광석병 통증에 정신이 붕괴된 호리는 유로지비의 광신적 교리에 빠져든다. 설원의 한 정착촌 마을에 도달한 호리는 감염자들의 고통을 끝내는 유일한 방법은 죽음을 통한 영혼의 정화라는 망상에 사로잡혀 마을 전체에 불을 지르고 무차별 학살을 저지른다. 화염 속에서 홀로 의자에 앉아 침묵을 지키는 노부인 나댜 앞에서 호리는 자신의 살육을 신성한 구원이라 부르짖으며 광기의 정점을 드러낸다.",
      stages: [
        {
          stageCode: '16-5',
          title: '분수령',
          location: '우르수스, 크라이니 세베르 중앙 광산지구 연구소, 우르수스 크라이니 세베르 중앙 광산지구, 3일 전',
          summary: "크세니야가 남긴 '오카'라는 단어에 대해 Mon3tr와 박사는 이것이 광산 심층부에서 채굴된 미지의 물질이며, 체내 오리지늄 아츠 메커니즘을 파괴하고 황제의 칼날마저 절명시킬 수 있는 치명적 변이원임을 직감한다.",
          narrativeText: "크세니야가 남긴 '오카'라는 단어에 대해 Mon3tr와 박사는 이것이 광산 심층부에서 채굴된 미지의 물질이며, 체내 오리지늄 아츠 메커니즘을 파괴하고 황제의 칼날마저 절명시킬 수 있는 치명적 변이원임을 직감한다.\n\n알로이즈와 엘리시움은 지하 연구소에서 감염자와 비감염자를 불문하고 '오카'를 주입하는 비인도적인 생체 실험이 자행되었음을 확인하고 분노한다. 연구 자료는 이미 체계적으로 소각되거나 파기된 상태였다.\n\n3일 전 회상: 광산 감시팀의 상습적인 구타와 학대에 시달리던 광부 렌킨(Renkin)은 더 이상 동료들의 죽음을 방치하지 않겠다며 곡괭이를 들고 봉기를 일으켜 감시팀을 습격했다.\n\n박사와 Mon3tr는 거동할 수 없는 크세니야의 신병을 보호하며 연구소에 잔류하기로 하고, 아미야와 만트라, 엘리시움, 알로이즈는 남쪽으로 도주한 감염자 광부들을 뒤쫓아 추가 참사를 막기로 역할을 분담한다.",
          cgUrl: '/images/cgs/66_g10_instituteinterior.png',
          cgCaption: '분수령 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_g10_instituteinterior.png',
              caption: '분수령 핵심 시각 연출',
              type: 'cg',
              triggerLine: "방금…… '근위병'이라고 하지 않았어?..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'amiya',
            'mantra',
            'elysium',
            'alois',
            'kseniya',
            'renkin',
            '다가오는_목소리',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "방금…… '근위병'이라고 하지 않았어?",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "합류하고 나서 말씀드릴 수 있을 것 같아요.",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "우리도 몇 가지 발견한 게 있다. 그쪽에서 얻은 정보와 일치해.",
            },
            {
              speaker: "엘리시움",
              speakerId: 'elysium',
              text: "여기서 진짜 생체 실험을 했다고?",
            },
          ]
        },
        {
          stageCode: '16-6',
          title: '통각 명멸',
          location: '우르수스, 크라이니 세베르 중앙 광산지구 연구소, 우르수스 크라이니 세베르 중앙 광산지구, 3일 전',
          summary: "박사의 응급 처치로 의식을 회복한 크세니야는 자신이 체르노보그 연구소 시절 켈시 소장을 도왔던 과거를 증언한다.",
          narrativeText: "박사의 응급 처치로 의식을 회복한 크세니야는 자신이 체르노보그 연구소 시절 켈시 소장을 도왔던 과거를 증언한다. 켈시가 떠난 후 제국 당국의 강요로 크라이니 세베르로 이송되어 오리지늄 생체 변이 연구에 동원되었던 것이다.\n\n3일 전 회상: 렌킨과 동료 닉토(Nikto), 호리(Khori)는 봉기 직후 연구소로 침입해 방호 장비와 식량을 확보하려 했으나, 그곳에 남겨진 생체 실험의 잔해를 목격하고 제국을 향한 깊은 적개심을 불태웠다.\n\n크세니야는 '오카'에 노출된 광부들이 서로의 통증과 오리지늄 병변을 집단적으로 공유하고 증폭시키는 이상 공명 현상을 겪고 있음을 밝힌다.\n\n박사는 감염자들의 고통을 멈추고 사태의 근원을 규명하기 위해 '오카'의 원본이 묻혀 있는 갱도 최심부로 내려갈 준비를 서두른다.",
          cgUrl: '/images/cgs/66_g10_instituteinterior.png',
          cgCaption: '통각 명멸 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_g10_instituteinterior.png',
              caption: '통각 명멸 핵심 시각 연출',
              type: 'cg',
              triggerLine: "크세니야, 깨어났어? 기분이 어때?..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'amiya',
            'mantra',
            'elysium',
            'alois',
            'kseniya',
            'renkin',
            'nikto',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "크세니야, 깨어났어? 기분이 어때?",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "……중앙 광산지구의 규모가 어마어마하네요. 관할 11개 광산이 모두 지상 물류 시스템으로 연결되어 있어요.",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "연구소 정보란에도 모든 광부에게 위치 추적 칩이 장착돼있다는 정보가 있었어. 우리가 전에 만났던 광부들도 이것 때문에 감시팀에게 발각됐을지도 몰라.",
            },
            {
              speaker: "엘리시움",
              speakerId: 'elysium',
              text: "팀장이 추출된 칩을 봤는지 묻고 있어.",
            },
          ]
        },
        {
          stageCode: '16-7',
          title: '마지막 기쁨',
          location: '우르수스 크라이니 세베르, 툰드라, 3일 전, 우르수스, 크라이니 세베르 중앙 광산지구 연구소',
          summary: "광산을 탈출한 광부 무리는 눈보라가 몰아치는 툰드라 설원을 헤매며 방황한다.",
          narrativeText: "광산을 탈출한 광부 무리는 눈보라가 몰아치는 툰드라 설원을 헤매며 방황한다. 호리는 극심한 광석병 통증 속에서 점차 현실 감각을 잃고, 유로지비의 광신적인 교리와 환각에 사로잡히기 시작한다.\n\n렌킨은 흔들리는 광부들을 다독이며 우르수스 심장부로 진격해 착취자들에게 복수하겠다는 맹세를 굳건히 다진다.\n\n연구소에서 크세니야는 '오카'의 병변이 일반적인 비말 전염은 아니지만 미지의 파동을 통해 확산될 수 있음을 경고하며 갱도 진입을 만류한다.\n\n그러나 박사와 Mon3tr는 진실을 규명하고 라이디언과 대원들을 구하기 위해 위험을 무릅쓰고 오염된 갱도 심층부로 직접 내려가기로 결단한다.",
          cgUrl: '/images/cgs/66_g7_farnorthtundra.png',
          cgCaption: '마지막 기쁨 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_g7_farnorthtundra.png',
              caption: '마지막 기쁨 핵심 시각 연출',
              type: 'cg',
              triggerLine: "그때 너는 너무 어렸고 연구 때문에 참여한 거라, 원래부터 핵심..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'raidian',
            'kseniya',
            'renkin',
            'nikto',
            'khori',
            '유쾌한_광부',
            '나지막한_목소리',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "그때 너는 너무 어렸고 연구 때문에 참여한 거라, 원래부터 핵심 멤버 명단에 없었어.",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "크세니야, 이곳을 떠나야 해.",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "크세니야",
              speakerId: 'kseniya',
              text: "조금만 더 기다려 보죠. 여대공께서 우리가 위험에 빠지지 않게 해주실 겁니다.",
            },
            {
              speaker: "렌킨",
              speakerId: 'renkin',
              text: "나도 네가 춤을 그렇게 잘 출 줄은 몰랐어.",
            },
          ]
        },
        {
          stageCode: '16-8',
          title: '사라진 흔적',
          location: '우르수스 크라이니 세베르 중앙 광산지구, 우르수스 크라이니 세베르, 툰드라',
          summary: "어둠이 깔린 갱도 입구로 향하며 크세니야는 과거 일리아와 켈시가 나누었던 문명과 오리지늄의 비밀에 대한 대화를 회상한다.",
          narrativeText: "어둠이 깔린 갱도 입구로 향하며 크세니야는 과거 일리아와 켈시가 나누었던 문명과 오리지늄의 비밀에 대한 대화를 회상한다. 켈시는 오리지늄의 확산과 고갈이 테라 문명에 가져올 피할 수 없는 파멸의 순환을 이미 내다보고 있었다.\n\n렌킨의 광부 무리는 설원 속에 고립된 한 우르수스 정착촌 마을에 도착한다. 식량과 은신처를 구하려는 광부들과 이들을 두려워하는 비감염자 주민들 사이에 팽팽한 긴장감이 형성된다.\n\n그러나 호리는 광부들의 고통을 영원히 끝내는 유일한 방법은 육신의 굴레에서 벗어나는 것(죽음)이라는 망상에 사로잡혀 독자적으로 행동하기 시작한다.\n\n호리는 마을 주민들에게 다가가 순수한 영혼의 구원을 운운하며 기괴한 행동을 보이고, 설원 마을에는 불길한 파멸의 그림자가 드리운다.",
          cgUrl: '/images/cgs/66_g3_miningarea.png',
          cgCaption: '사라진 흔적 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_g3_miningarea.png',
              caption: '사라진 흔적 핵심 시각 연출',
              type: 'cg',
              triggerLine: "박사, 앞은 안전한 것 같아. 다른 사람이 감지되지 않아……..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'raidian',
            'kseniya',
            'renkin',
            'nikto',
            'khori',
            'betochki',
            '일리아',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "박사, 앞은 안전한 것 같아. 다른 사람이 감지되지 않아……",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "그리고 부상자도 생각해야지.",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "크세니야",
              speakerId: 'kseniya',
              text: "당신들에게 길을 안내하기로 한 건 제 선택이에요. 그리고 저 역시 '오카'에 관한 진실을 알고 싶고요. 망설이는 건 아니에요.",
            },
            {
              speaker: "렌킨",
              speakerId: 'renkin',
              text: "이쪽은 정리 끝났어. 다른 차량에 있던 물건들도 다 꺼냈어?",
            },
          ]
        },
        {
          stageCode: '16-9',
          title: '미치광이의 변론',
          location: '우르수스 북방 설원 전장',
          summary: "회상: 우르수스 북방에서 '검은 눈'이라 불리는 데몬의 존재와 이에 맞서던 황제의 칼날의 비극적인 숙명이 교차한다.",
          narrativeText: "회상: 우르수스 북방에서 '검은 눈'이라 불리는 데몬의 존재와 이에 맞서던 황제의 칼날의 비극적인 숙명이 교차한다.\n\n설원 마을에 갑작스러운 화마가 덮치고, 광기에 완전히 삼켜진 호리가 \"영혼을 정화한다\"는 명목으로 가옥들에 불을 지르며 주민들과 광부들을 무차별 살해하기 시작한다.\n\n렌킨과 베토치키가 경악하여 호리를 제지하려 달려들지만, 호리는 불길 속으로 걸어 들어가며 이것이야말로 죄악을 씻어내는 유일한 구원이라 궤변을 토한다.\n\n불타는 방 한가운데 홀로 의자에 앉아 미동도 하지 않는 노부인 나댜 앞에 선 호리는 자신의 살육을 성스러운 희생이라 합리화하며 광기의 절정을 이룬다.",
          cgUrl: '/images/cgs/66_i01.png',
          cgCaption: '미치광이의 변론 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i01.png',
              caption: '미치광이의 변론 핵심 시각 연출',
              type: 'cg',
              triggerLine: "가서 사람들 깨워! 모두 마을 밖으로 대피시켜야 해! 어서, 서..."
            }
          ],
          involvedCharacters: [
            'renkin',
            'nikto',
            'khori',
            'betochki',
            'emperors_blade',
            '젊은_광부',
            '겁에_질린_광부',
            '???',
          ],
          quotes: [
            {
              speaker: "렌킨",
              speakerId: 'renkin',
              text: "가서 사람들 깨워! 모두 마을 밖으로 대피시켜야 해! 어서, 서둘러!",
            },
            {
              speaker: "닉토",
              speakerId: 'nikto',
              text: "나도 몰라. 갑자기 불길이 치솟았어. 우리가 끌 수 있는 정도가 아니야!",
            },
            {
              speaker: "호리",
              speakerId: 'khori',
              text: "그놈들. 여기 있는…… 모두.",
            },
            {
              speaker: "베토치키",
              speakerId: 'betochki',
              text: "하, 할머니, 할머니가, 안 보여요!",
            },
          ]
        },
      ]
    },
    {
      id: 'part_3',
      partNumber: 3,
      partTitleKo: '설원의 묘비와 불망의 행렬',
      partTitleEn: 'Tombstones of the Tundra and Procession of the Unforgotten',
      code: 'PART 3',
      location: '설원 폐허 마을, 제2갱도 심층 오리지늄 공동, 툰드라 야영지, 얼어붙은 네바 호수, 브레스크 여대공 관저',
      timeline: '1101년 가을 (제국 정규군 진입 직전)',
      cgUrl: '/images/cgs/66_i07.png',
      cgCaption: '네바 호수를 건너며 광부들을 선동하는 렌킨',
      synopsis: "화마가 휩쓸고 간 마을에서 라이디언과 합류한 아미야 일행은 참극의 생존자들을 수습하고, 박사와 Mon3tr는 제2갱도 심층부에서 오리지늄 광맥 전체가 에너지를 잃고 고갈되어 가는 전대미문의 사태를 확인한다. 렌킨이 네바 호수를 건너 수백 명의 광부들을 규합해 제국에 맞선 전면 봉기를 선언하는 순간, 우르수스 정규군이 광산지구 전체에 대한 소탕 작전을 개시한다.",
      narrativeText: "불타버린 마을 폐허에서 소녀 베토치키는 노부인 나댜의 손을 잡고 흐느끼고, 렌킨은 호리의 만행을 막지 못했다는 자책감에 지도자 자리에서 물러나 처벌을 받겠다고 선언한다. 현장에 나타난 라이디언 소대와 합류한 아미야는 희생자들을 애도하며 광부들을 안전하게 구출하기로 다짐한다. 같은 시각, 제2갱도 심층 공동으로 진입한 박사와 Mon3tr는 거대한 오리지늄 원석 광맥 전체의 활성도가 밑바닥부터 사멸하고 있는 '광맥 고갈' 현상을 목격한다. 켈시가 경고했던 오리지늄의 침묵과 문명의 종말 징후를 확인한 박사는 경악을 금치 못한다. 한편 렌킨은 생존 광부들을 이끌고 얼어붙은 네바 호수를 건너 대규모 광산 생활 구역에 도착하여, 과거 히포그리프를 무너뜨린 이고리 대제처럼 제국의 지배자들을 끌어내리자고 군중을 격려한다. 그러나 바로 그 시각, 옐리자 여대공의 경고에도 불구하고 우르수스 군단의 정규군이 광산지구로 진주하며 대포탄을 발사하기 시작한다.",
      stages: [
        {
          stageCode: '16-10',
          title: '잦아든 울음소리',
          location: '우르수스 북방 설원 전장',
          summary: "학살과 화마가 휩쓸고 간 마을 폐허에서 소녀 베토치키는 잿더미가 된 모닥불 곁에 앉아 노부인 나댜의 손을 잡고 흐느낀다.",
          narrativeText: "학살과 화마가 휩쓸고 간 마을 폐허에서 소녀 베토치키는 잿더미가 된 모닥불 곁에 앉아 노부인 나댜의 손을 잡고 흐느낀다. 나댜는 \"사랑하기 때문에 네 고통을 함께 짊어지려는 것\"이라며 유로지비의 슬픈 기도를 나직이 읊조린다.\n\n렌킨은 자신이 호리의 광기를 통제하지 못하고 무고한 이들의 목숨을 앗아갔다는 죄책감에 짓눌려 광부들의 지도자 자리에서 물러나 처벌을 받겠다고 선언한다.\n\n설원 폐허 속에서 감염자들을 비밀리에 지원하던 로도스의 라이디언이 나타나 부상당한 생존자들을 치료하며 사태를 수습하려 애쓴다.\n\n그러나 광부들의 체내 오리지늄은 호리의 광기와 집단 통증에 반응하며 기괴하게 동조하기 시작하고, 설원 전체에 절망적인 메아리가 울려 퍼진다.",
          cgUrl: '/images/cgs/66_i08_1.png',
          cgCaption: '잦아든 울음소리 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i08_1.png',
              caption: '잦아든 울음소리 핵심 시각 연출',
              type: 'cg',
              triggerLine: "괜찮아, 괜찮아. 방금 닉토의 상처를 치료해 주러 갔었어. 거울..."
            }
          ],
          involvedCharacters: [
            'raidian',
            'renkin',
            'nikto',
            'khori',
            'betochki',
            'nadya',
            '지친_광부',
            '차분한_광부',
          ],
          quotes: [
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "괜찮아, 괜찮아. 방금 닉토의 상처를 치료해 주러 갔었어. 거울 파편에 베여서……",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "렌킨",
              speakerId: 'renkin',
              text: "맞아, 호리는 죽겠지. 하지만……",
            },
            {
              speaker: "닉토",
              speakerId: 'nikto',
              text: "그래, 불은 진작 꺼졌어. 생존한 마을 사람들도 우릴 발견했어. 뭐라도 해야겠는데.",
            },
            {
              speaker: "호리",
              speakerId: 'khori',
              text: "(작은 목소리로) ……고통을……",
            },
          ]
        },
        {
          stageCode: '16-11',
          title: '무덤 앞',
          location: '우르수스 크라이니 세베르',
          summary: "발자국을 따라 폐허 마을에 도착한 아미야, 만트라, 엘리시움, 알로이즈는 눈앞에 펼쳐진 참혹한 학살 현장을 목격하고 충격에 휩싸인다.",
          narrativeText: "발자국을 따라 폐허 마을에 도착한 아미야, 만트라, 엘리시움, 알로이즈는 눈앞에 펼쳐진 참혹한 학살 현장을 목격하고 충격에 휩싸인다.\n\n아미야는 마침내 현장에 있던 라이디언 소대와 감격적인 재회를 이룬다. 그러나 알로이즈는 광부들의 탈출 경위와 목적을 캐묻기 위해 생존자들을 거칠게 추궁하기 시작한다.\n\n라이디언은 극한의 고통 속에서 생존을 위해 발버둥 친 감염자들을 비난할 자격은 그 누구에게도 없다며 알로이즈를 가로막고 생존자들을 감싼다.\n\n아미야는 죽어간 이들의 넋을 기리는 간이 무덤 앞에서 눈물을 삼키며, 더 이상의 비극을 막기 위해 흩어진 광부들을 전원 구출하기로 결심한다.",
          cgUrl: '/images/cgs/66_i28.png',
          cgCaption: '무덤 앞 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i28.png',
              caption: '무덤 앞 핵심 시각 연출',
              type: 'cg',
              triggerLine: "……무슨 일이 있었던 걸까요?..."
            }
          ],
          involvedCharacters: [
            'amiya',
            'mantra',
            'raidian',
            'elysium',
            'alois',
            'betochki',
            'nadya',
            '마을_주민',
          ],
          quotes: [
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "……무슨 일이 있었던 걸까요?",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "아미야, 보지 마, 듣지 마!",
            },
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "나는 괜찮아…… 걱정하게 해서 미안해.",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "엘리시움",
              speakerId: 'elysium',
              text: "내가 사람들을 데리고 가서 생존자가 있는지 확인해 볼게.",
            },
          ]
        },
        {
          stageCode: '16-12',
          title: '깊이 매장',
          location: '우르수스 북방 설원 전장',
          summary: "박사와 Mon3tr, 크세니야는 방호 장비를 착용하고 제2갱도 심층부의 거대한 공동으로 내려간다.",
          narrativeText: "박사와 Mon3tr, 크세니야는 방호 장비를 착용하고 제2갱도 심층부의 거대한 공동으로 내려간다. 그곳에는 웅장한 규모의 푸른 오리지늄 결정 광맥이 층층이 드러나 있었다.\n\n크세니야는 계측 장비로 광맥의 활성도를 측정하던 중 경악을 금치 못한다. 거대한 광맥의 에너지가 내부에서부터 급속도로 고갈되어 사멸하고 있었던 것이다.\n\n과거 켈시가 남겼던 기록대로, 오리지늄이 스스로 활력을 잃고 화석화되는 '광맥 고갈' 현상이 테라 전역에서 최초로 관측된 순간이었다.\n\n박사와 Mon3tr는 우르수스 당국이 광맥 고갈이라는 체제적 위기를 숨기기 위해 광산을 봉쇄하고 생체 실험을 강행했음을 간파한다.",
          cgUrl: '/images/cgs/66_i06.png',
          cgCaption: '깊이 매장 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i06.png',
              caption: '깊이 매장 핵심 시각 연출',
              type: 'cg',
              triggerLine: "박사, 다른 생체 신호는 감지되지 않았어…… 싸우지 않고 안으로..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'kseniya',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "박사, 다른 생체 신호는 감지되지 않았어…… 싸우지 않고 안으로 들어갈 수 있을 것 같아.",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "크세니야",
              speakerId: 'kseniya',
              text: "이 앞이 '오카'가 처음 발견된 갱도예요.",
            },
          ]
        },
        {
          stageCode: '16-13',
          title: '불망',
          location: '우르수스 북방 설원 전장',
          summary: "툰드라의 눈 덮인 야영지에서 알로이즈는 로도스 대원들에게 자신이 이번 조사에 집착했던 진짜 이유를 털어놓는다.",
          narrativeText: "툰드라의 눈 덮인 야영지에서 알로이즈는 로도스 대원들에게 자신이 이번 조사에 집착했던 진짜 이유를 털어놓는다. 그는 제국 수뇌부가 위기를 덮기 위해 전쟁을 획책하고 있음을 감지하고 있었다.\n\n라이디언은 로도스 아일랜드의 사명과 켈시의 신념을 전하며, 역사의 소용돌이 속에서도 잊혀진 이들의 이름과 진실을 기록하는 것이야말로 구원의 시작이라고 말한다.\n\n아미야는 알로이즈의 고뇌를 이해하면서도, 군대의 표적이 된 감염자 광부들의 생명을 구하는 것이 최우선 과제임을 분명히 한다.\n\n대원들은 제국 정규군이 들이닥치기 전에 네바 호수를 건너간 렌킨의 본대를 추적하기 위해 설원을 가로지른다.",
          cgUrl: '/images/cgs/66_i09.png',
          cgCaption: '불망 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i09.png',
              caption: '불망 핵심 시각 연출',
              type: 'cg',
              triggerLine: "둘은 가만히 있어! 내가 가서 확인해 볼게...."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'mantra',
            'raidian',
            'alois',
            'kseniya',
            'betochki',
            'nadya',
            '가까워졌다_멀어졌다_하는_목소리',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "둘은 가만히 있어! 내가 가서 확인해 볼게.",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "너희들은 아무것도 못 들었어?",
            },
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "당신이 이러는 건 처음 봐…… 무슨 일이야?",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "알로이즈",
              speakerId: 'alois',
              text: "말도 안 돼, 절대 그럴 리 없어! 그놈은 이미 죽었어!",
            },
          ]
        },
        {
          stageCode: '16-14',
          title: '오로지 순탄한 길뿐',
          location: '우르수스 북방 설원 전장',
          summary: "렌킨과 닉토는 혹한의 얼어붙은 네바 호수를 건너 대규모 광산 생활 구역에 도달한다.",
          narrativeText: "렌킨과 닉토는 혹한의 얼어붙은 네바 호수를 건너 대규모 광산 생활 구역에 도달한다. 그곳에 고립되어 있던 수백 명의 광부들은 살아 돌아온 렌킨을 열렬히 환호한다.\n\n광부들은 렌킨을 자신들을 해방시킬 영웅으로 추대하고, 렌킨은 과거 히포그리프 제국을 격파했던 이고리 대제의 전설을 상기시킨다.\n\n렌킨은 오늘날 우르수스 황실과 귀족들이 과거의 폭군들과 다를 바 없다며, 디에티 그라이퍼부르크의 금빛 성문을 깨부수기 위해 전면 봉기하자고 군중을 격려한다.\n\n그러나 렌킨의 연설 뒤편에서, 광부들의 몸속 오리지늄은 '오카'의 잔류 공명으로 인해 불안정하게 요동치며 또 다른 재앙을 예고하고 있었다.",
          cgUrl: '/images/cgs/66_i07.png',
          cgCaption: '오로지 순탄한 길뿐 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i07.png',
              caption: '오로지 순탄한 길뿐 핵심 시각 연출',
              type: 'cg',
              triggerLine: "네바 호수가…… 벌써 얼어붙었네...."
            }
          ],
          involvedCharacters: [
            'renkin',
            'nikto',
            'ursus_miners',
            'ursus_miners',
            '불안한_광부',
            '흥분한_광부',
            'ursus_miners',
            '호기심_많은_광부',
          ],
          quotes: [
            {
              speaker: "렌킨",
              speakerId: 'renkin',
              text: "네바 호수가…… 벌써 얼어붙었네.",
            },
            {
              speaker: "닉토",
              speakerId: 'nikto',
              text: "젠장, 올해 날씨는 유별나게 추워. 아직 겨울이 오지도 않았는데…… 왜 웃어?",
            },
            {
              speaker: "길을 살피는 광부",
              speakerId: 'ursus_miners',
              text: "앞에 있는 초소에 사람이 있고, 탐조등도 켜져 있어…… 아직 완전히 버려진 게 아니더라고.",
            },
            {
              speaker: "갱도 속 목소리",
              speakerId: 'ursus_miners',
              text: "*우르수스 욕설*, 들킨 것 같아!",
            },
          ]
        },
        {
          stageCode: '16-15',
          title: '광야의 굉음',
          location: '우르수스 북방 설원 전장',
          summary: "브레스크의 관저에서 옐리자 여대공은 제국 군단에서 파견된 엄숙한 군관과 마주한다.",
          narrativeText: "브레스크의 관저에서 옐리자 여대공은 제국 군단에서 파견된 엄숙한 군관과 마주한다. 군관은 제국 원수의 칙령에 따라 대규모 정규군이 크라이니 세베르 전역에 투입되었음을 통보한다.\n\n갱도에서 빠져나온 박사와 Mon3tr는 하늘이 기괴한 붉은빛으로 물들고 제국군의 경고등이 켜지는 것을 목격한다. 광맥 고갈을 은폐하기 위한 제국의 무차별 섬멸 작전이 시작된 것이다.\n\n박사는 아미야에게 통신을 보내 광맥 고갈 사실과 군대의 진입을 알리려 하지만, 제국군의 강력한 전파 방해와 기습 포격에 휘말려 쓰러지고 만다.\n\n포화 속에서 의식을 잃어가는 박사와 Mon3tr 앞에, 북방을 방랑하던 리유니온의 크라운슬레이어(류드밀라)가 홀연히 나타나 두 사람을 발견한다.",
          cgUrl: '/images/cgs/66_g2_farnorthgovernment.png',
          cgCaption: '광야의 굉음 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_g2_farnorthgovernment.png',
              caption: '광야의 굉음 핵심 시각 연출',
              type: 'cg',
              triggerLine: "크세니야, 괜찮아? 필요하면 내가 둘 다 안고 뛸게!..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'yeliza',
            'kseniya',
            'ursus_soldiers',
            '???',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "크세니야, 괜찮아? 필요하면 내가 둘 다 안고 뛸게!",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "옐리자 여대공",
              speakerId: 'yeliza',
              text: "사실 저는 브레스크의 이 계절이 참 좋은데 말이죠.",
            },
            {
              speaker: "크세니야",
              speakerId: 'kseniya',
              text: "아, 아니에요. 저는…… 괜찮아요……",
            },
          ]
        },
      ]
    },
    {
      id: 'part_4',
      partNumber: 4,
      partTitleKo: '비정상 스펙트럼과 대지의 불길',
      partTitleEn: 'Abnormal Spectrum and Flames of the Earth',
      code: 'PART 4',
      location: '제국군 초소 설원, 크라이니 세베르 국경 황야, 디에티 그라이퍼부르크 요양소, 우-카 접경지 농장, 제국 군함 함교',
      timeline: '1101년 가을 ~ 겨울 (사건 종결 및 사후 여파)',
      cgUrl: '/images/cgs/66_i24.png',
      cgCaption: '오로라 아래 집결하는 로도스 아일랜드 본대',
      synopsis: "렌킨의 광부들과 제국군이 충돌하며 통각 폭풍이 폭주하자 만트라는 자신의 뇌신경을 한계까지 개방하여 고통을 대신 흡수하고, 크라운슬레이어의 지원으로 박사와 Mon3tr가 무사 복귀하며 로도스는 전원 철수한다. 제국이 광맥 고갈을 덮기 위해 전쟁의 불길을 지피는 가운데, 융합 우주에서 귀환한 힐다는 방랑하는 감염자들을 고통 없는 새로운 구원으로 인도한다.",
      narrativeText: "제국군 초소에서 정규군과 광부들의 유혈 충돌이 벌어지고, '오카'의 물질적 공명으로 인해 광부들 전체의 신경계가 집단 통증 폭풍에 휘말린다. 만트라는 공포에 질린 베토치키의 의식을 일깨우고, 자신의 모든 정신계 아츠를 개방하여 수백 명의 고통을 홀로 짊어지며 통각의 사슬을 끊어낸다. 만트라의 희생과 베토치키의 절규로 광부들은 제정신을 되찾지만, 극심한 과부하로 만트라는 각혈하며 쓰러진다. 이때 포격 속에서 박사와 Mon3tr를 구해낸 리유니온의 크라운슬레이어가 트럭을 몰고 나타나 로도스 본대에 합류하고, 일행은 광부들을 피신시키며 크라이니 세베르를 탈출한다. 사건 후 알로이즈는 디에티 그라이퍼부르크에서 위트 장관에게 광맥 고갈과 참상을 보고하지만, 제국은 전면전을 통한 돌파를 결의한다. 우-카 접경지에서 탈룰라와 나인은 학살의 소식을 접하며 비통에 잠기고, 설원 변방에서는 융합 우주에서 돌아온 힐다가 죽어가던 감염자 광부들의 고통을 치유하며 그들을 이끌고 설원 너머로 나아간다.",
      stages: [
        {
          stageCode: '16-16',
          title: '진실의 계시',
          location: '우르수스 북방 설원 전장',
          summary: "렌킨이 이끄는 무장 광부들이 제국군의 초소를 습격하면서 설원은 처절한 유혈의 전쟁터로 변모한다.",
          narrativeText: "렌킨이 이끄는 무장 광부들이 제국군의 초소를 습격하면서 설원은 처절한 유혈의 전쟁터로 변모한다. 제국군의 중화기와 광부들의 곡괭이가 격돌한다.\n\n전장에서 흘러나오는 살의와 고통, 그리고 '오카'에 오염된 오리지늄이 대기 중의 아츠 파동과 결합하여 광부들 전체의 신경계를 마비시키는 집단 통증 폭풍을 촉발한다.\n\n만트라는 고통에 몸부림치는 소녀 베토치키에게 다가가 유로지비의 거짓된 자기기만을 꾸짖으며, 절망 속에서도 살아남고자 하는 의지가 가장 존엄한 힘임을 설파한다.\n\n베토치키는 만트라의 외침에 눈을 뜨고, 만트라는 광부들의 파멸을 막기 위해 자신의 정신을 연결하여 모든 통증을 직접 억제하겠다고 선언한다.",
          cgUrl: '/images/cgs/66_i14.png',
          cgCaption: '진실의 계시 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i14.png',
              caption: '진실의 계시 핵심 시각 연출',
              type: 'cg',
              triggerLine: "혹시 박사님이 보낸 통신인가요?..."
            }
          ],
          involvedCharacters: [
            'amiya',
            'mantra',
            'raidian',
            'alois',
            'renkin',
            'nikto',
            'betochki',
            '조급한_병사',
          ],
          quotes: [
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "혹시 박사님이 보낸 통신인가요?",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "좋아, 최대한 서둘러 볼게.",
            },
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "아미야, 방금 공용 주파수로 날아온 통신을 받았는데……",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "알로이즈",
              speakerId: 'alois',
              text: "광맥 고갈에 관한 소문이 사실이었네…… 크라이니 세베르에서 연달아 발생한 그 모든 이상 현상에는 다 이유가 있었어. 은폐하려던 건 바로 이거였어!",
            },
          ]
        },
        {
          stageCode: '16-17',
          title: '처절한 절규',
          location: '우르수스 북방 설원 전장',
          summary: "만트라는 자신의 고유 아츠를 한계까지 개방하여 수백 명의 광부들과 신경망을 연결하고, 그들이 내뿜는 집단적 절규와 육체적 통증을 자신의 정신으로 흡수하기 시작한다.",
          narrativeText: "만트라는 자신의 고유 아츠를 한계까지 개방하여 수백 명의 광부들과 신경망을 연결하고, 그들이 내뿜는 집단적 절규와 육체적 통증을 자신의 정신으로 흡수하기 시작한다.\n\n과거와 현재의 기억들이 만트라의 뇌리에 폭풍처럼 휘몰아치는 가운데, 베토치키는 쓰러져가는 광부들을 향해 \"우리는 돌아가지 않아요, 우리는 살아남을 거예요!\"라고 온 힘을 다해 절규한다.\n\n소녀의 절규와 만트라의 아츠가 공명하며 마침내 광부들을 옭아매던 광기의 통각 사슬이 끊어지고, 광부들은 제정신을 되찾으며 무기를 내려놓는다.\n\n그러나 집단 고통을 홀로 감당해 낸 만트라는 뇌신경이 과부하되어 각혈하며 쓰러지고, \"누가 나를 좀 도와줘\"라는 희미한 말을 남긴 채 의식을 잃는다.",
          cgUrl: '/images/cgs/66_i10_2.png',
          cgCaption: '처절한 절규 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i10_2.png',
              caption: '처절한 절규 핵심 시각 연출',
              type: 'cg',
              triggerLine: "모두…… 훨씬 나아진 것 같아요...."
            }
          ],
          involvedCharacters: [
            'amiya',
            'mantra',
            'raidian',
            'elysium',
            'alois',
            'yeliza',
            'betochki',
            '간청하는_목소리',
          ],
          quotes: [
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "모두…… 훨씬 나아진 것 같아요.",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "네가 아무리 내 의식을 뒤집어 봐도, 내가 허무 속에서 잠들만한 환영을 만들어내지는 못한다.",
            },
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "아미야, 더 많은 정보가 필요해. 최소한 군단의 행군 경로라도 파악돼야 해.",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "엘리시움",
              speakerId: 'elysium',
              text: "우리가 가는 방향 5km 이내에는 적의 흔적이 없으니, 계속 전진해도 돼.",
            },
          ]
        },
        {
          stageCode: '16-18',
          title: '붉은 해가 머무는 곳',
          location: '우르수스 북방 설원 전장',
          summary: "아미야와 라이디언, 엘리시움은 혼절한 만트라를 긴급 수습하고 생존한 광부들을 제국군의 포위망 밖으로 신속하게 철수시킨다.",
          narrativeText: "아미야와 라이디언, 엘리시움은 혼절한 만트라를 긴급 수습하고 생존한 광부들을 제국군의 포위망 밖으로 신속하게 철수시킨다.\n\n퇴로가 차단될 위기의 순간, 크라운슬레이어가 트럭을 몰고 눈보라를 뚫고 나타나 안전하게 보호하고 있던 박사와 Mon3tr를 로도스 본대에 무사히 인계한다.\n\n흩어졌던 로도스 아일랜드 대원들이 마침내 전원 무사히 합류하고, 아미야는 만트라를 응급 치료함과 동시에 광부들을 황무지 너머 안전한 피난처로 인도한다.\n\n새벽빛이 설원의 오로라를 가르는 가운데, 로도스 일행은 크라이니 세베르의 비극을 뒤로하고 대지 전체에 불어닥칠 거대한 전운을 직감한다.",
          cgUrl: '/images/cgs/66_i24.png',
          cgCaption: '붉은 해가 머무는 곳 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i24.png',
              caption: '붉은 해가 머무는 곳 핵심 시각 연출',
              type: 'cg',
              triggerLine: "라이디언! 드디어 이게 쓸모를 발휘하게 됐어! 우리야! 나랑 박..."
            }
          ],
          involvedCharacters: [
            'mon3tr',
            'amiya',
            'mantra',
            'raidian',
            'elysium',
            'alois',
            'betochki',
            'crownslayer',
          ],
          quotes: [
            {
              speaker: "Mon3tr",
              speakerId: 'mon3tr',
              text: "라이디언! 드디어 이게 쓸모를 발휘하게 됐어! 우리야! 나랑 박사, 그리고 크세니야!!!",
              avatarUrl: '/images/characters/mon3tr.png',
            },
            {
              speaker: "아미야",
              speakerId: 'amiya',
              text: "라이디언 씨, 숲을 무사히 통과했나요?",
              avatarUrl: '/images/characters/amiya.png',
            },
            {
              speaker: "만트라",
              speakerId: 'mantra',
              text: "정신은 차렸어. 엘리시움에게 전해줘, 나 혼자 움직일 수 있다고.",
            },
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "선발대는 합류 지점에 도착했어.",
              avatarUrl: '/images/characters/raidian.png',
            },
          ]
        },
        {
          stageCode: 'ST-16-02',
          title: '광기의 서약',
          location: '디에티 그라이퍼부르크 상이군인 요양소, 우르수스 중앙 구역, 황야',
          summary: "크라이니 세베르 사건이 수습된 후, 알로이즈는 디에티 그라이퍼부르크의 상이군인 요양소에서 상관인 위트(Witte) 백작에게 사태의 전말을 서면으로 보고한다.",
          narrativeText: "크라이니 세베르 사건이 수습된 후, 알로이즈는 디에티 그라이퍼부르크의 상이군인 요양소에서 상관인 위트(Witte) 백작에게 사태의 전말을 서면으로 보고한다.\n\n위트 백작은 광맥 고갈과 제국의 위기를 이미 인지하고 있었으며, 황실과 군부가 내부 모순을 타개하기 위해 외부와의 전면전을 준비하고 있음을 암시한다.\n\n황실 회의장 벽면에 붉은색이 어지럽게 덧칠해진 가운데, 과거 체르노보그 참사를 겪었던 로사와 압생트 등 학생들의 고요하지만 비장한 모습이 비친다.\n\n우르수스 제국 전체가 '비정상 스펙트럼'이라 불리는 거대한 광기와 전쟁의 소용돌이 속으로 서서히 침몰해 가고 있었다.",
          cgUrl: '/images/cgs/66_g12_deitygrypherburgmeeting.png',
          cgCaption: '광기의 서약 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_g12_deitygrypherburgmeeting.png',
              caption: '광기의 서약 핵심 시각 연출',
              type: 'cg',
              triggerLine: "만약, 예전에 우르수스 사람이었다면?..."
            }
          ],
          involvedCharacters: [
            'raidian',
            'alois',
            'witte',
            'rosa',
            'absinthe',
            '학생_a',
            '학생_b',
            '학생_c',
          ],
          quotes: [
            {
              speaker: "라이디언",
              speakerId: 'raidian',
              text: "만약, 예전에 우르수스 사람이었다면?",
              avatarUrl: '/images/characters/raidian.png',
            },
            {
              speaker: "알로이즈",
              speakerId: 'alois',
              text: "……이상, 크라이니 세베르 사건의 경위였습니다. 서면 보고서는 1주일 내로 정리해서 제출하겠습니다.",
            },
            {
              speaker: "위트",
              speakerId: 'witte',
              text: "수고했다, 중위. 하지만 아직 몇 가지 의문점이 있어.",
            },
            {
              speaker: "로사",
              speakerId: 'rosa',
              text: "군의 움직임이 너무 빈번해. 각지에서 파업과 휴강이 발생하고 있는데, 진압은 예전보다 더 빠르고 더 거세게 이루어지고 있어……",
            },
          ]
        },
        {
          stageCode: 'SPST-16-01',
          title: '편지',
          location: '우-카 접경지, 황무지 농장',
          summary: "우르수스와 카시미어 접경지의 황무지 농장에서 리유니온 잔당들은 감염자 농부들과 함께 밀을 수확하며 모처럼 평화로운 겨울을 보내고 있다.",
          narrativeText: "우르수스와 카시미어 접경지의 황무지 농장에서 리유니온 잔당들은 감염자 농부들과 함께 밀을 수확하며 모처럼 평화로운 겨울을 보내고 있다.\n\n탈룰라와 나인은 로도스 아일랜드가 제공해 준 억제제 덕분에 감염자들의 발작이 멈추었음에 안도하지만, 여전히 자신들의 죄책감과 대지의 미래를 고뇌한다.\n\n이때 크라이니 세베르 광산에서 벌어진 대규모 학살과 봉기 소식을 담은 서신이 도착하고, 살아남은 광부들의 피맺힌 증언이 전해진다.\n\n탈룰라는 대지의 억압이 결코 끝나지 않았음을 깨닫고, 고통받는 동포들을 위해 다시 한번 일어설 결의를 다진다.",
          cgUrl: '/images/cgs/66_i19.png',
          cgCaption: '편지 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i19.png',
              caption: '편지 핵심 시각 연출',
              type: 'cg',
              triggerLine: "응, 맞아. 왜, 뭐가 잘못됐나?..."
            }
          ],
          involvedCharacters: [
            'talulah',
            'nine',
            'red',
            '기뻐하는_농부_아낙네',
            '걱정하는_노파',
            '감염자_전사',
            'ursus_miners',
          ],
          quotes: [
            {
              speaker: "탈룰라",
              speakerId: 'talulah',
              text: "응, 맞아. 왜, 뭐가 잘못됐나?",
              avatarUrl: '/images/characters/talulah.png',
            },
            {
              speaker: "나인",
              speakerId: 'nine',
              text: "탈룰라, 너한테 말을 거는 사람이 있는데.",
              avatarUrl: '/images/characters/nine.png',
            },
            {
              speaker: "레드",
              speakerId: 'red',
              text: "농장 근처에서 난민 무리를 만났는데, 크라이니 세베르에서 도망쳐 나온 광부들이야. '리유니온'이라는 이름을 찾아왔다고 했어.",
              avatarUrl: '/images/characters/red.png',
            },
          ]
        },
        {
          stageCode: 'SPST-16-02',
          title: '지난 일',
          location: '우르수스 북툰드라의 어느 광산, 1101년 겨울, 우르수스 크라이니 세베르 재앙 복구 지역',
          summary: "1101년 겨울, 포격이 멈춘 크라이니 세베르의 재앙 복구 지역 폐허에서 살아남은 광부들이 지상으로 올라와 무너진 삶의 터전을 바라본다.",
          narrativeText: "1101년 겨울, 포격이 멈춘 크라이니 세베르의 재앙 복구 지역 폐허에서 살아남은 광부들이 지상으로 올라와 무너진 삶의 터전을 바라본다.\n\n한 청년 기능공이 눈 속에 파묻혀 있던 광부들의 이름 없는 카바이드 램프를 발견하고 먼지를 털어내어 불을 밝힌다.\n\n그는 이 보잘것없는 램프를 디에티 그라이퍼부르크로 가져가, 제국의 화려함 뒤편에 묻혀간 이름 없는 광부들의 희생을 온 세상에 증명하겠다고 맹세한다.\n\n차가운 설원 위에 켜진 작은 등불은 혹독한 겨울 속에서도 꺼지지 않는 인간의 존엄을 상징하고 있었다.",
          cgUrl: '/images/cgs/66_i20.png',
          cgCaption: '지난 일 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_i20.png',
              caption: '지난 일 핵심 시각 연출',
              type: 'cg',
              triggerLine: "우, 우리 이제 움직이자, 응? 지상 말고, 계속 지하로 가자...."
            }
          ],
          involvedCharacters: [
            'ursus_miners',
            'ursus_miners',
            'ursus_miners',
            '호위병',
            'ursus_miners',
            '두려워하는_광부',
            '군단_장교',
            '겁에_질린_광부',
          ],
          quotes: [
            {
              speaker: "겁쟁이 광부",
              speakerId: 'ursus_miners',
              text: "우, 우리 이제 움직이자, 응? 지상 말고, 계속 지하로 가자. 아직 폭탄이 여기까진 안 떨어졌으니, 얼른……",
            },
            {
              speaker: "걱정하는 광부",
              speakerId: 'ursus_miners',
              text: "……일어나, 유리. 그리고 다른 사람들도. 렌킨을 찾아야 해. 그리고 렌킨이 말한 그곳으로 가야 해.",
            },
            {
              speaker: "위독한 광부",
              speakerId: 'ursus_miners',
              text: "저…… 저기…… 저희는…… 어디로 가는 겁니까?",
            },
            {
              speaker: "의심하는 광부",
              speakerId: 'ursus_miners',
              text: "(작은 목소리로) 광산이 또 멈췄어.",
            },
          ]
        },
        {
          stageCode: 'SPST-16-03',
          title: '귀향',
          location: '우르수스 북방 설원 전장',
          summary: "작전을 종료하고 귀항하는 우르수스 제국 군함의 함교에서 지휘관 장교는 전 함대에 사격 중지 명령을 하달한다.",
          narrativeText: "작전을 종료하고 귀항하는 우르수스 제국 군함의 함교에서 지휘관 장교는 전 함대에 사격 중지 명령을 하달한다.\n\n병사들은 무의미한 유혈과 동포 학살에 대해 회의감을 표하지만, 장교는 국가 간의 전쟁과 생존 경쟁 앞에서 개인의 감상은 사치일 뿐이라고 일축한다.\n\n장교는 우르수스의 오리지늄 광맥이 메말라가는 현실에서 제국의 존속을 위해 남은 길은 오직 하나뿐이라 선언한다.\n\n\"더 많은 우르수스인의 생존을 위해, 우르수스의 존속을 위해, 우리에게 남은 선택지는 단 하나뿐…… 바로 이 대지에 불을 지피는 것이다.\"",
          cgUrl: '/images/cgs/50_g13_warshipcommandroom.png',
          cgCaption: '귀향 비주얼',
          visuals: [
            {
              url: '/images/cgs/50_g13_warshipcommandroom.png',
              caption: '귀향 핵심 시각 연출',
              type: 'cg',
              triggerLine: "옐틴 중위에게 전하고, 제2사단 산하 모든 병단의 사격 중지 상..."
            }
          ],
          involvedCharacters: [
            'ursus_soldiers',
            '통신병',
            'ursus_soldiers',
            'ursus_soldiers',
            'ursus_soldiers',
          ],
          quotes: [
            {
              speaker: "장교",
              speakerId: 'ursus_soldiers',
              text: "옐틴 중위에게 전하고, 제2사단 산하 모든 병단의 사격 중지 상황을 신속히 확인하도록.",
            },
            {
              speaker: "병사",
              speakerId: 'ursus_soldiers',
              text: "지휘관님, 이번에는 동행한 군수관이 없습니다.",
            },
            {
              speaker: "냉담한 병사",
              speakerId: 'ursus_soldiers',
              text: "……이런 사소한 일로 내가 자리까지 이탈하면서 너를 만나야 하나?",
            },
            {
              speaker: "분노한 병사",
              speakerId: 'ursus_soldiers',
              text: "파디야, 널 좀 봐. 방패병 제복을 입고 있는 이 위풍당당한 모습을……!",
            },
          ]
        },
        {
          stageCode: 'SPST-16-04',
          title: '전례 없는',
          location: '우르수스 크라이니 세베르 변방, 황야',
          summary: "크라이니 세베르 변방의 설원에서 탈출하던 한 감염자 광부가 체내 오리지늄의 급성 팽창으로 쓰러져 죽음을 기다린다.",
          narrativeText: "크라이니 세베르 변방의 설원에서 탈출하던 한 감염자 광부가 체내 오리지늄의 급성 팽창으로 쓰러져 죽음을 기다린다.\n\n그의 앞에 과거 1098년 런디니움 결전에서 융합 우주로 승화했던 카우투스 감염자 소녀 힐다(Hilda)가 환한 빛과 함께 나타난다.\n\n힐다는 광부의 가슴에 부드럽게 손을 얹어 오리지늄의 극심한 통증을 씻은 듯이 가라앉히며, \"자신을 믿어주세요. 그것이 모든 힘의 근원일지니\"라는 축복을 내린다.\n\n고통에서 해방된 광부들은 힐다의 뒤를 따르고, 힐다는 상처 입은 영혼들을 인도하며 오리지늄의 굴레를 초월한 미지의 새로운 구원을 향해 설원 속으로 사라진다.",
          cgUrl: '/images/cgs/66_g8_farnorthtundra_aurora.png',
          cgCaption: '전례 없는 비주얼',
          visuals: [
            {
              url: '/images/cgs/66_g8_farnorthtundra_aurora.png',
              caption: '전례 없는 핵심 시각 연출',
              type: 'cg',
              triggerLine: "그래요, 그게 제 이름이에요...."
            }
          ],
          involvedCharacters: [
            'hilda',
            '감염자_광부',
            'folklore_wanderers',
            '???',
            'folklore_wanderers',
            'folklore_wanderers',
            '군중의_목소리',
          ],
          quotes: [
            {
              speaker: "힐다",
              speakerId: 'hilda',
              text: "그래요, 그게 제 이름이에요.",
            },
            {
              speaker: "멀리서 들려오는 목소리",
              speakerId: 'folklore_wanderers',
              text: "저쪽에 누가 있는 것 같은데요?",
            },
            {
              speaker: "다급한 목소리",
              speakerId: 'folklore_wanderers',
              text: "동포, 이 사람은 우리 동포예요!",
            },
            {
              speaker: "경건한 목소리",
              speakerId: 'folklore_wanderers',
              text: "당신은 언제나 겸손하시네요. 우리 모두 알고 있습니다.",
            },
          ]
        },
      ]
    },
  ],
  characters: [
    {
      id: 'mon3tr',
      nameKo: "Mon3tr",
      nameEn: "Mon3tr",
      faction: "로도스 아일랜드 / 켈시의 창조물 및 분신",
      role: "인간형 소녀 각성체",
      avatarUrl: '/images/characters/mon3tr.png',
      description: "EP15에서 켈시의 소멸 후 고치에서 인간형 소녀로 부화했다. 켈시가 남긴 과거 기록과 생체 데이터를 바탕으로 체르노보그 연구원 크세니야를 추적하여 우르수스 북방으로 향하며, 박사를 보호하고 진실을 규명하는 핵심 길잡이로 활약한다.",
      statusInChapter: "인간형 소녀 각성체로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'amiya',
      nameKo: "아미야",
      nameEn: "Amiya",
      faction: "로도스 아일랜드",
      role: "총괄 리더 (카우투스/키메라)",
      avatarUrl: '/images/characters/amiya.png',
      description: "본함 봉인 이후 분산된 로도스 대원들을 통솔하며 우르수스 원정을 총지휘한다. 감염자 광부들의 절망과 분노를 온몸으로 받아내며 유혈 사태를 막고, 광부들을 인도하여 안전한 피난처로 대피시킨다.",
      statusInChapter: "총괄 리더 (카우투스/키메라)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'doctor',
      nameKo: "박사",
      nameEn: "Doctor",
      faction: "로도스 아일랜드",
      role: "현장 지휘관 및 전술 총괄",
      avatarUrl: '/images/characters/doctor.png',
      description: "라이디언 소대의 구출과 석관 조사를 위해 직접 크라이니 세베르의 갱도 심층부로 내려간다. 오리지늄 광맥 고갈이라는 거시적 위기를 최초로 직관하고, 제국군의 포격 속에서도 냉철한 전술 판단을 내린다.",
      statusInChapter: "현장 지휘관 및 전술 총괄로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'mantra',
      nameKo: "만트라",
      nameEn: "Mantra",
      faction: "로도스 아일랜드",
      role: "정예 오퍼레이터 (정신 감응 아츠)",
      avatarUrl: '',
      description: "타인의 의식과 감정을 감지하고 조작하는 강력한 정신계 아츠 사용자. 렌킨의 광부들이 '오카'와 결합된 집단 통각 폭풍에 휩싸이자, 자신의 신경계를 한계까지 개방하여 수백 명의 고통을 홀로 흡수하고 혼절한다.",
      statusInChapter: "정예 오퍼레이터 (정신 감응 아츠)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'raidian',
      nameKo: "라이디언",
      nameEn: "Raidian",
      faction: "로도스 아일랜드",
      role: "정예 오퍼레이터 (통신 및 전자전 소대장)",
      avatarUrl: '/images/characters/raidian.png',
      description: "크세니야 접촉을 위해 선발대로 크라이니 세베르에 잠입했으나 통신이 두절된다. 폐허 마을에서 학살당하는 광부들을 치료하고 보호하며, 켈시의 신념에 따라 잊혀진 자들의 이름을 끝까지 기록한다.",
      statusInChapter: "정예 오퍼레이터 (통신 및 전자전 소대장)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'elysium',
      nameKo: "엘리시움",
      nameEn: "Elysium",
      faction: "로도스 아일랜드",
      role: "정예 오퍼레이터 (통신 지원 및 척후)",
      avatarUrl: '',
      description: "만트라 소대와 함께 현장 통신망 확보와 척후 임무를 수행한다. 특유의 능청스러움 뒤에 숨겨진 철저한 관찰력으로 알로이즈의 진의를 시험하고 위기 상황마다 탈출 경로를 개척한다.",
      statusInChapter: "정예 오퍼레이터 (통신 지원 및 척후)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'warfarin',
      nameKo: "와파린",
      nameEn: "Warfarin",
      faction: "로도스 아일랜드",
      role: "혈마 메딕 및 의료부 원로",
      avatarUrl: '/images/characters/warfarin.png',
      description: "로도스 신기지에서 켈시의 생체 데이터와 Mon3tr의 신체 변화를 관찰하며 체르노보그 연구 기록의 중요성을 짚어준다.",
      statusInChapter: "혈마 메딕 및 의료부 원로로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'closer',
      nameKo: "클로저",
      nameEn: "Closer",
      faction: "로도스 아일랜드",
      role: "수석 엔지니어",
      avatarUrl: '/images/characters/closer.png',
      description: "본함 봉인 이후 예비 서버 ZOOT의 잔여 데이터와 분산 섹터의 엔지니어링 설비를 복구하며 통신망을 지원한다.",
      statusInChapter: "수석 엔지니어로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'yeliza',
      nameKo: "옐리자 여대공",
      nameEn: "Grand Duchess Yeliza",
      faction: "우르수스 제국",
      role: "크라이니 세베르 관할 통치자",
      avatarUrl: '',
      description: "북방 군단과 제국 의회 사이에서 아슬아슬한 줄타기를 하고 있는 통찰력 있는 귀족. 광산의 참상을 은폐하지 않고 오히려 로도스의 조사를 묵인하며 통행을 허가한다.",
      statusInChapter: "크라이니 세베르 관할 통치자로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'alois',
      nameKo: "알로이즈",
      nameEn: "Alois",
      faction: "우르수스 제국",
      role: "청년 귀족 장교 (의회 위트 장관 직속)",
      avatarUrl: '',
      description: "브레스크에서 호위병들에게 쫓기던 로도스를 구해주고 안내역을 자처한다. 제국 수뇌부가 전쟁을 획책하고 있음을 감지하고 진실을 밝히기 위해 독자적으로 움직인다.",
      statusInChapter: "청년 귀족 장교 (의회 위트 장관 직속)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'kseniya',
      nameKo: "크세니야",
      nameEn: "Kseniya",
      faction: "우르수스 제국 / 전 체르노보그 연구소",
      role: "오리지늄 생체 연구원",
      avatarUrl: '',
      description: "과거 체르노보그에서 일리아의 조수로 켈시 밑에서 일했던 학자. 크라이니 세베르에서 강제로 오카 생체 실험에 동원된 후 양심의 가책 속에 쓰러져 있었으나, 로도스에 구출되어 오카와 광맥의 진실을 증언한다.",
      statusInChapter: "오리지늄 생체 연구원로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'renkin',
      nameKo: "렌킨",
      nameEn: "Renkin",
      faction: "우르수스 크라이니 세베르",
      role: "감염자 광부 봉기 지도자",
      avatarUrl: '',
      description: "광산 감시팀의 가혹한 학대에 맞서 곡괭이를 들고 봉기를 일으킨 카리스마적 인물. 제국 황실을 끌어내리겠다는 맹세로 광부들을 이끌지만, 호리의 광기와 통각 폭풍에 좌절한다.",
      statusInChapter: "감염자 광부 봉기 지도자로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'nikto',
      nameKo: "닉토",
      nameEn: "Nikto",
      faction: "우르수스 크라이니 세베르",
      role: "광부 (렌킨의 든든한 동료)",
      avatarUrl: '',
      description: "렌킨의 봉기에 동참하여 끝까지 무리의 생존을 도모하는 현실적이고 굳건한 광부.",
      statusInChapter: "광부 (렌킨의 든든한 동료)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'khori',
      nameKo: "호리",
      nameEn: "Khori",
      faction: "우르수스 크라이니 세베르",
      role: "감염자 광부 (유로지비적 광신자)",
      avatarUrl: '',
      description: "극심한 광석병 통증으로 정신이 붕괴되어, 감염자의 고통을 끝내는 유일한 길은 죽음을 통한 영혼의 정화라는 망상에 빠져 설원 마을에 불을 지르고 주민들을 학살한다.",
      statusInChapter: "감염자 광부 (유로지비적 광신자)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'betochki',
      nameKo: "베토치키",
      nameEn: "Betochki",
      faction: "우르수스 크라이니 세베르",
      role: "감염자 광부 소녀",
      avatarUrl: '',
      description: "호리의 학살 속에서 나댜 노부인의 곁을 지키던 순박한 소녀. 만트라의 가르침을 받아 절망과 거짓 구원을 깨뜨리고 \"우리는 살아남을 거예요!\"라고 외치며 광부들의 의식을 깨운다.",
      statusInChapter: "감염자 광부 소녀로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'nadya',
      nameKo: "나댜",
      nameEn: "Nadya",
      faction: "우르수스 크라이니 세베르",
      role: "설원 정착촌 노부인 (유로지비 신봉자)",
      avatarUrl: '',
      description: "화염 속에서도 초연하게 자리를 지키며 고통을 대신 짊어지겠다는 유로지비의 비극적 신념을 읊조린다.",
      statusInChapter: "설원 정착촌 노부인 (유로지비 신봉자)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'talulah',
      nameKo: "탈룰라",
      nameEn: "Talulah",
      faction: "리유니온 잔당",
      role: "리유니온 지도자 (드라코)",
      avatarUrl: '/images/characters/talulah.png',
      description: "우-카 접경지 농장에서 감염자들과 평화롭게 자급자족하고 있었으나, 크라이니 세베르의 학살 소식을 담은 편지를 접하고 다시 한번 대지의 억압에 맞설 결의를 다진다.",
      statusInChapter: "리유니온 지도자 (드라코)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'nine',
      nameKo: "나인",
      nameEn: "Nine",
      faction: "리유니온 잔당",
      role: "리유니온 현장 지휘관",
      avatarUrl: '/images/characters/nine.png',
      description: "탈룰라 곁에서 감염자 공동체를 이끌며 로도스의 신약 지원에 감사하고 대지의 불온한 정세를 경계한다.",
      statusInChapter: "리유니온 현장 지휘관로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'crownslayer',
      nameKo: "크라운슬레이어",
      nameEn: "류드밀라",
      faction: "리유니온 / 북방 방랑자",
      role: "암살자 및 척후 오퍼레이터",
      avatarUrl: '/images/characters/crownslayer.png',
      description: "북방 설원을 배회하던 중 제국군의 포격에 휘말린 박사와 Mon3tr를 기적적으로 구조하여 로도스 본대에 인계한다.",
      statusInChapter: "암살자 및 척후 오퍼레이터로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'red',
      nameKo: "프로젝트 레드",
      nameEn: "Project Red",
      faction: "로도스 아일랜드",
      role: "특수작전 오퍼레이터",
      avatarUrl: '/images/characters/red.png',
      description: "리유니온 농장 주변과 황무지에서 정찰을 수행하며 대지의 불온한 움직임을 감시한다.",
      statusInChapter: "특수작전 오퍼레이터로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'hilda',
      nameKo: "힐다",
      nameEn: "Hilda",
      faction: "융합 우주 귀환자",
      role: "카우투스 감염자 소녀 (새로운 구원의 인도자)",
      avatarUrl: '',
      description: "EP15에서 광석병 붕괴로 소멸 직전 융합 우주로 승화했던 소녀. 크라이니 세베르 설원에서 죽어가던 감염자들의 오리지늄 통증을 치유하며 새로운 초월적 구원의 길로 군중을 이끈다.",
      statusInChapter: "카우투스 감염자 소녀 (새로운 구원의 인도자)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'witte',
      nameKo: "위트",
      nameEn: "Witte",
      faction: "우르수스 제국",
      role: "제국 의회 장관 (백작)",
      avatarUrl: '',
      description: "알로이즈의 상관으로, 제국의 광맥 고갈과 경제 파탄을 막기 위해 전면적인 대외 전쟁을 불가피하다고 판단하는 냉혹한 정치가.",
      statusInChapter: "제국 의회 장관 (백작)로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'emperors_blade',
      nameKo: "황제의 칼날",
      nameEn: "Emperor's Blade",
      faction: "우르수스 제국",
      role: "황실 친위 근위병",
      avatarUrl: '',
      description: "북방 설원에서 데몬의 오염을 통제하고 제국의 비밀을 은폐하기 위해 유로지비와 감염자들을 가차 없이 숙청하는 절대적인 암살자.",
      statusInChapter: "황실 친위 근위병로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'black_eye',
      nameKo: "검은 눈",
      nameEn: "Black Eye",
      faction: "북방 황야",
      role: "북방 데몬 및 미지의 존재",
      avatarUrl: '',
      description: "우르수스 북방 설원의 붕괴를 촉발하며 황제의 칼날과 끊임없이 충돌하는 외계적 공포의 상징.",
      statusInChapter: "북방 데몬 및 미지의 존재로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'rosa',
      nameKo: "로사",
      nameEn: "Rosa, 나탈리아",
      faction: "로도스 아일랜드 / 전 체르노보그 귀족",
      role: "우르수스 학생 자치단",
      avatarUrl: '',
      description: "체르노보그 사건의 상처를 안고 있으며, 제국의 끝나지 않는 전쟁 광기와 비극을 지켜본다.",
      statusInChapter: "우르수스 학생 자치단로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'absinthe',
      nameKo: "압생트",
      nameEn: "Absinthe",
      faction: "로도스 아일랜드 / 전 체르노보그 경찰 자녀",
      role: "우르수스 학생 자치단",
      avatarUrl: '',
      description: "아버지의 유품을 품고 제국의 모순과 폭력성을 직시하며 슬픔을 억누른다.",
      statusInChapter: "우르수스 학생 자치단로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'ursus_miners',
      nameKo: "우르수스 감염자 광부들",
      nameEn: "우르수스 감염자 광부들",
      faction: "우르수스 크라이니 세베르",
      role: "광산 노역자 군집",
      avatarUrl: '',
      description: "혹독한 동토에서 오리지늄을 캐며 제국의 번영을 지탱했으나, 생체 실험과 착취에 맞서 봉기하고 끝내 역사 뒤편으로 사라져간 이름 없는 민초들.",
      statusInChapter: "광산 노역자 군집로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'ursus_soldiers',
      nameKo: "우르수스 제국 군관 및 병단",
      nameEn: "우르수스 제국 군관 및 병단",
      faction: "우르수스 제국군",
      role: "북방 정규군 및 진압 부대",
      avatarUrl: '',
      description: "광맥 고갈의 위기 속에서 상부의 명령에 따라 광산지구를 초토화하고 전면 대외 전쟁의 도화선에 불을 지피는 군인들.",
      statusInChapter: "북방 정규군 및 진압 부대로서 사태 해결에 핵심적인 기여를 완수함."
    },
    {
      id: 'folklore_wanderers',
      nameKo: "설원의 피난민 군중",
      nameEn: "설원의 피난민 군중",
      faction: "우르수스 북방 황야",
      role: "감염자 피난민 집단",
      avatarUrl: '',
      description: "추위와 광석병의 고통 속에서 힐다의 기적을 접하고 새로운 구원의 길을 찾아 나서는 대지의 방랑자들.",
      statusInChapter: "감염자 피난민 집단로서 사태 해결에 핵심적인 기여를 완수함."
    },
  ],
  glossary: [
    {
      term: "크라이니 세베르 (Krayniy Sever / 极北)",
      type: 'location',
      typeLabel: '핵심 지역 / 시설',
      description: "우르수스 최북단의 광산 이동도시이자 툰드라 영구동토층에 위치한 혹한의 거점. 제국 최대 규모의 원석 광맥이 밀집해 있으며 감염자 강제 노역의 중심지이다."
    },
    {
      term: "브레스크 (Blesk / 闪光城)",
      type: 'location',
      typeLabel: '핵심 지역 / 시설',
      description: "크라이니 세베르 관할구역의 중심 이동도시. 옐리자 여대공의 통치 거점이며, 군부와 의회의 갈등 속에서 수천 명의 광부 피난민이 거쳐 가는 관문 역할을 한다."
    },
    {
      term: "오카 (Oka / 奥卡)",
      type: 'technology',
      typeLabel: '과학 / 기술 / 물질',
      description: "크라이니 세베르 제2갱도 심층부에서 채굴된 정체불명의 물질. 감염자의 체내 오리지늄 활성화를 극단적으로 가속하며, 신경계를 통해 통각을 광역 공명시키고 황제의 칼날(근위병)의 신체 유지 아츠마저 파괴할 수 있다."
    },
    {
      term: "유로지비 (Yurodivy / 圣愚 / 거룩한 바보)",
      type: 'faction',
      typeLabel: '세력 / 집단',
      description: "우르수스 제국 내에서 자생한 극단적인 고통 수용 종파. 고통을 회피하지 않고 온몸으로 받아들여 영혼을 정화한다는 사상으로, 극한의 탄압을 받는 감염자 광부들 사이에 급속히 퍼져 집단 자결과 광기를 초래했다."
    },
    {
      term: "비정상 스펙트럼 (Abnormal Spectrum / 反常光谱)",
      type: 'arts',
      typeLabel: '아츠 / 현상',
      description: "오리지늄 광맥의 급격한 활성 저하와 미지의 파동으로 인해 대기 중의 아츠 굴절률과 전자기 스펙트럼이 왜곡되는 현상. 제국 북방 하늘에 기괴한 붉은빛과 비정상 오로라를 형성한다."
    },
    {
      term: "광맥 전면 고갈 (Colossal Vein Depletion / 矿脉枯竭)",
      type: 'concept',
      typeLabel: '개념 / 설정',
      description: "테라 대륙을 지탱해 온 오리지늄 광맥이 내부에서부터 에너지를 잃고 비활성 화석으로 굳어버리는 전대미문의 사건. 오리지늄을 유일한 동력원으로 삼아온 우르수스 제국과 테라 문명 전체의 붕괴를 알리는 서막이다."
    },
    {
      term: "황제의 칼날 (Emperor's Blade / 皇帝的利刃)",
      type: 'arts',
      typeLabel: '아츠 / 현상',
      description: "북방 데몬의 파편을 몸속에 봉인하여 절대적인 신체 능력과 국가의 영토 아츠를 다루는 우르수스 황실의 최정예 근위대. 광산의 이상 징후를 은폐하기 위해 투입된다."
    },
    {
      term: "디에티 그라이퍼부르크 (Deity Grypherburg / 圣骏堡)",
      type: 'location',
      typeLabel: '핵심 지역 / 시설',
      description: "우르수스 제국의 수도이자 황궁과 제국 의회가 위치한 심장부. 과거 히포그리프 왕국의 중심지였으며, 금빛 성문 뒤에서 대륙 전체를 겨냥한 전쟁을 획책한다."
    },
    {
      term: "체르노보그 석관 연구소 (Chernobog Sarcophagus Lab)",
      type: 'concept',
      typeLabel: '개념 / 설정',
      description: "과거 켈시와 일리아, 세르게이, 크세니야 등이 구인류의 석관(Sarcophagus)을 연구했던 비밀 시설. 켈시 복원의 핵심 데이터가 이곳의 유산과 연결되어 있다."
    },
    {
      term: "통각 공명 아츠 (Pain-Resonance Arts)",
      type: 'concept',
      typeLabel: '개념 / 설정',
      description: "만트라와 '오카'의 상호작용으로 인해 발생한 현상. 개개인의 광석병 통증과 공포가 군집 신경망을 형성하여 광범위한 지역 내 감염자들의 뇌신경을 동시에 마비시키는 파괴적 현상이다."
    },
    {
      term: "이름 없는 카바이드 램프 (The Nameless Carbide Lamp)",
      type: 'technology',
      typeLabel: '과학 / 기술 / 물질',
      description: "폐허가 된 광산에서 청년 기능공이 주워 든 광부들의 램프. 역사에 기록되지 못하고 스러져간 감염자 노동자들의 저항과 꺼지지 않는 존엄을 상징하는 서사적 오브제이다."
    },
    {
      term: "힐다의 치유 (Hilda's Transcendent Touch)",
      type: 'concept',
      typeLabel: '개념 / 설정',
      description: "융합 우주로 승화했던 카우투스 소녀 힐다가 현실에 현현하여 시전한 기적. 오리지늄의 붕괴 메커니즘을 역전시켜 감염자의 신체 통증을 완전히 소멸시키는 구인류/특이점 계통의 초월적 구원 능력이다."
    },
  ]
};

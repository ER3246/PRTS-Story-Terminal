import type { StoryArchive } from '../../types/story';

export const episode02: StoryArchive = {
  id: 'ep02',
  code: 'EPISODE 02',
  category: 'main',
  categoryLabel: '메인 테마',
  actGroup: '메인 Act initium: 각성',
  titleKo: '같지만 다른',
  titleEn: 'Separate Ways',
  order: 2,
  bannerImage: '/images/banners/ep02_banner.png',
  systemMeta: {
    recordedTime: '1096-12-28 11:20:00 [TERRA_STD]',
    securityLevel: 'LEVEL 3 // CONFIDENTIAL',
    operatorInCharge: 'PRTS AI Subsystem 02'
  },
  meta: {
    timeline: '테라력 1096년 12월 말',
    location: '염국 이동도시 용문 총독부 ~ 용문 하층 슬럼가 및 옥상',
    factions: ['로도스 아일랜드', '용문 근위국', '리유니온', '블랙스틸 월드와이드', '펭귄 로지스틱스'],
    mainCharacters: ['박사', '아미야', '미샤', '첸', '켈시', '프란카', '리스캄', '스컬슈레더', '엑시아', '텍사스']
  },
  content: {
    prtsGreeting: '[PRTS ARCHIVE] 이동도시 용문 진입 및 미샤 호송·인계 작전 전술 로그.',
    logline: '에이스의 희생을 딛고 도달한 용문에서, 슬럼가에 숨겨진 과학자의 딸 미샤를 둘러싸고 벌어지는 리유니온과의 추격전과 용문 근위국과의 조약 체결.',
    background: '체르노보그 탈출 과정에서 에이스 소대를 잃은 로도스 아일랜드는 물자 고갈 상태로 인접한 동방의 거대 이동도시 용문(Lungmen)에 도달했다. 켈시와 아미야가 용문 총독부에서 최고 통치자 웨이 옌우 및 첸 경사와 외교적 교섭을 벌이는 동안, 슬럼가를 순찰하던 박사와 블랙스틸 팀은 리유니온에게 쫓기던 의문의 감염자 소녀 미샤(Misha)를 발견해 구출한다. 체르노보그의 핵심 기밀을 쥔 미샤를 탈취하려는 스컬슈레더의 맹공 속에서, 로도스는 펭귄 로지스틱스의 지원을 받아 그녀를 근위국에 조건부 인계하기 위한 옥상 탈출전에 돌입한다.',
    acts: [
      {
        step: 1,
        phase: '파트 1',
        phaseEn: 'Part 1',
        title: '[02-01 ~ 02-03] 용문 총독부의 회담과 슬럼가의 조우',
        location: '용문 총독부 집무실 및 하층 슬럼가 진입로',
        cgUrl: '/images/cgs/ep02_incident.png',
        cgCaption: '용문 입경을 위해 거치는 외곽 방역 검문소와 근위국 첸 경사와의 첫 조우 구역',
        narrativeText: '체르노보그의 지옥도를 뚫고 나온 로도스 아일랜드 본함이 찬란한 네온사인으로 빛나는 동방의 거대 이동도시 용문 외곽에 정박한다. 켈시 최고 책임자와 아미야는 용문 총독부로 향해 최고 통치자 웨이 옌우 총독, 그리고 근위국 특별감찰팀장 첸 경사와 긴박한 외교 회담을 갖는다. 웨이 옌우는 도시 내부에 침투한 리유니온 첩보망을 척결하는 데 협력하는 조건으로 로도스에게 임시 정박과 물자 보급을 허가하는 실리적 제휴를 제안한다.\n\n한편, 회담이 진행되는 동안 박사는 블랙스틸 소속의 오퍼레이터 프란카, 리스캄과 함께 슬럼가 치안 순찰 임무를 수행하던 중, 가면을 쓴 리유니온 무장병들에게 포위되어 필사적으로 도망치던 한 카우투스 소녀를 목격한다. 프란카의 초고열 서믹 레이피어와 리스캄의 충격 방패가 순식간에 적들을 무력화하고, 겁에 질린 소녀 "미샤"를 안전하게 품에 안는다.\n\n단순한 난민인 줄 알았던 소녀의 등 뒤로, 흩어졌던 리유니온의 대규모 결사대가 일제히 집결하기 시작하며 평온하던 슬럼가는 순식간에 긴장감에 휩싸인다.',
        summary: '켈시와 아미야가 용문 총독부에서 임시 입경 협상을 벌이는 사이, 슬럼가를 순찰하던 박사와 블랙스틸 팀은 리유니온에게 쫓기던 소녀 미샤를 구출한다.',
        quotes: [
          {
            speaker: '첸',
            speakerId: 'chen',
            text: '로도스 아일랜드... 제약회사라는 간판 뒤에 중무장 부대를 숨긴 자들인가. 용문의 법을 어긴다면 누구든 내 칼을 피하지 못한다.',
            context: '총독부 회담실에서 아미야와 켈시를 매섭게 쏘아보며'
          },
          {
            speaker: '미샤',
            speakerId: 'misha',
            text: '저리 가요...! 다들 나한테 왜 이러는 거예요... 전 아무것도 모른다고요...!',
            context: '슬럼가 골목에서 리유니온에게 쫓기다 박사 일행을 마주했을 때'
          },
          {
            speaker: '프란카',
            speakerId: 'franka',
            text: '어머, 귀여운 아가씨네? 걱정 마, 이 무서운 언니들이 나쁜 놈들은 싹 다 구워줄 테니까.',
            context: '서믹 레이피어를 뽑아 들고 미샤 앞을 가로막으며'
          }
        ],
        involvedCharacters: ['chen', 'kaltsit', 'doctor', 'misha', 'franka', 'liskarm']
      },
      {
        step: 2,
        phase: '파트 2',
        phaseEn: 'Part 2',
        title: '[02-04 ~ 02-06] 미샤 호송전과 펭귄 로지스틱스의 원군',
        location: '용문 하층 슬럼가 복합 미로 및 옥상 구역',
        cgUrl: '/images/cgs/ep02_escalation.png',
        cgCaption: '미샤의 신병을 확보하기 위해 수색 작전이 펼쳐진 용문 하층 슬럼가의 폐쇄된 골목길',
        narrativeText: '총독부 회담을 마친 아미야가 슬럼가 현장으로 급파되어 박사 일행과 합류한다. 아미야는 공포에 질려 떨고 있는 미샤의 손을 따뜻하게 잡아주며, 그녀가 안전해질 때까지 끝까지 지켜주겠노라 약속한다. 그러나 리유니온은 미샤를 탈취하기 위해 슬럼가의 지상 통로를 봉쇄하고 골목마다 석궁수와 화염병 투척조를 배치해 포위망을 좁혀온다.\n\n지상 돌파가 어려워진 순간, 옥상 너머에서 경쾌한 총성과 함께 펭귄 로지스틱스의 배달원 엑시아와 텍사스가 전장에 난입한다. 엑시아의 눈부신 기관단총 속사와 텍사스의 쌍검 아츠 검우(剑雨)가 옥상의 적들을 단숨에 소탕하며 새로운 공중 회랑을 열어젖힌다.\n\n"안녕, 로도스 친구들! 길 안내라면 우리 펭귄 로지스틱스가 테라 최고라고!" 엑시아의 유쾌한 신호탄 아래, 로도스와 블랙스틸, 펭귄 로지스틱스 연합팀은 복잡하게 얽힌 슬럼가 빨랫줄과 옥상 구조물을 타고 전진하며 적의 매복을 따돌린다.',
        summary: '미샤를 보호하려는 아미야와 박사 일행에게 펭귄 로지스틱스(엑시아·텍사스)가 가세하여 슬럼가 옥상 탈출로를 개척한다.',
        quotes: [
          {
            speaker: '아미야',
            speakerId: 'amiya',
            text: '미샤 씨, 두려워하지 마세요. 저희가 반드시 당신을 안전한 곳으로 데려다 드릴게요.',
            context: '떨고 있는 미샤의 손을 맞잡으며 안심시킬 때'
          },
          {
            speaker: '엑시아',
            speakerId: 'exusiai',
            text: '헤이, 거기 아래 로도스 친구들! 파티에 늦어서 미안! 옥상 쪽 퇴로는 내가 확실하게 열어줄 테니까 위로 올라와!',
            context: '슬럼가 옥상에서 기관단총을 난사하며 지원할 때'
          },
          {
            speaker: '텍사스',
            speakerId: 'texas',
            text: '동쪽 통로 확보 완료. 적의 후발대가 2분 내로 합류한다. 박사, 서둘러.',
            context: '쌍검을 휘둘러 옥상 바리케이드를 벤 뒤 담담하게'
          }
        ],
        involvedCharacters: ['amiya', 'doctor', 'misha', 'exusiai', 'texas', 'franka', 'liskarm']
      },
      {
        step: 3,
        phase: '파트 3',
        phaseEn: 'Part 3',
        title: '[02-07 ~ 02-09] 해골 가면의 포효, 스컬슈레더의 강습',
        location: '용문 슬럼가 폐수 정화 시설 및 옥상 광장',
        cgUrl: '/images/cgs/ep02_climax.png',
        cgCaption: '슬럼가 은신처에서 스컬슈레더와 처음 마주한 미샤',
        narrativeText: '옥상 회랑을 통과해 안전지대로 내려서려던 찰나, 폐수 정화 시설의 철골을 부수며 짙은 포연 속에서 기괴한 해골 가면의 거한이 날아든다. 리유니온의 최전방 결사대 지휘관 "스컬슈레더"였다. 양손에 장착된 개조 유탄 발사기에서 뿜어져 나오는 고폭탄과 맹독성 오리지늄 분진 탄환이 로도스의 호위 대열을 무자비하게 강타한다.\n\n"미샤를 넘겨라! 비감염자의 개들이 감염자의 아이를 어디로 끌고 가려는 거냐!" 스컬슈레더는 미샤를 향해 절규 어린 손을 뻗으며 맹렬한 기세로 돌진한다. 미샤는 해골 가면의 목소리를 듣는 순간 무언가를 깨달은 듯 경악하며 말을 잇지 못한다. 리스캄이 방전 방패를 전개해 유탄의 파편을 온몸으로 막아내고, 프란카가 서믹 레이피어로 유탄 발사기의 탄창 벨트를 베어내며 저지한다.\n\n박사의 정밀한 일점사 지휘와 아미야의 충격파 아츠가 스컬슈레더의 장갑을 파괴하자, 수적 열세에 몰린 스컬슈레더는 피를 흘리며 "반드시 널 구하러 오겠다"는 말을 남긴 채 지하 수로망으로 후퇴한다.',
        summary: '미샤를 탈취하려는 스컬슈레더의 맹렬한 유탄 기습을 로도스와 블랙스틸이 합심하여 격퇴하지만, 미샤와 적 지휘관 사이의 심상치 않은 연결고리가 암시된다.',
        quotes: [
          {
            speaker: '스컬슈레더',
            speakerId: 'skullshatterer',
            text: '미샤를 내놔라! 너희 같은 위선자들에게 저 아이를 넘겨줄 바엔 차라리 모두 재로 만들어 주마!',
            context: '양손의 유탄 발사기를 난사하며 로도스 방어선으로 돌진할 때'
          },
          {
            speaker: '미샤',
            speakerId: 'misha',
            text: '...저 목소리는 설마... 아니야... 그럴 리가 없어...',
            context: '스컬슈레더의 목소리를 듣고 얼굴이 하얗게 질릴 때'
          },
          {
            speaker: '리스캄',
            speakerId: 'liskarm',
            text: '전원, 방패 뒤로 엄폐하십시오! 프란카 선배, 오른쪽 사각을 맡아주세요!',
            context: '스컬슈레더의 유탄 폭격을 방패로 받아내며'
          }
        ],
        involvedCharacters: ['skullshatterer', 'misha', 'doctor', 'amiya', 'franka', 'liskarm']
      },
      {
        step: 4,
        phase: '파트 4',
        phaseEn: 'Part 4',
        title: '[02-10] 미샤의 신병 인계와 무거운 동맹',
        location: '용문 근위국 사전 접선 관문',
        cgUrl: '/images/cgs/ep02_resolution.png',
        cgCaption: '미샤의 신병을 근위국에 인계한 직후, 적막과 침묵이 감도는 용문 외곽 접선 구역의 거리',
        narrativeText: '스컬슈레더의 집요한 추격을 뿌리친 로도스 소대는 마침내 근위국과의 사전 접선 지점에 도착한다. 첸 경사는 수십 명의 중무장 방패 진압대를 대동한 채 차가운 표정으로 미샤의 신병 인도를 요구한다. 첸은 미샤가 체르노보그의 이동도시 동력 코어와 군사 방어 시스템을 총괄하던 핵심 수석 과학자 세르게이의 딸이라는 사실을 밝힌다. 체르노보그 전체를 통제할 수 있는 극비 보안 키를 쥐고 있을 가능성이 높은 미샤는 용문의 안보를 뒤흔들 수 있는 시한폭탄이었다.\n\n"이 아이는 체르노보그 사건의 핵심 인물이다. 용문의 안전을 위해 근위국이 직접 구금하고 보호한다." 첸의 단호한 선언 앞에, 아미야는 미샤를 향한 잔혹한 신문이나 인권 침해가 없어야 하며 안전을 보장해야 한다는 조건을 걸고 무거운 마음으로 손을 놓는다.\n\n미샤는 배신감과 두려움이 뒤섞인 눈망울로 아미야를 바라보며 근위국의 호송 차량에 오른다. 이 조건부 인계를 통해 로도스는 용문-로도스 공식 군사 협약을 성사시키는 데 성공하지만, 아미야의 가슴속에는 씻을 수 없는 죄책감과 불길한 먹구름이 드리운다.',
        summary: '미샤가 체르노보그 핵심 과학자 세르게이의 딸임을 확인한 첸 경사는 신병 인도를 요구하고, 아미야는 안전 보장을 조건으로 미샤를 근위국에 인계한다.',
        quotes: [
          {
            speaker: '첸',
            speakerId: 'chen',
            text: '이 아이는 체르노보그 핵심 과학자 세르게이의 딸이다. 리유니온이 노리는 것도 그 때문이지. 미샤의 신병은 용문 근위국이 인수한다.',
            context: '근위국 대원들을 정렬시키며 미샤의 인도를 요구할 때'
          },
          {
            speaker: '미샤',
            speakerId: 'misha',
            text: '지켜주겠다고 했잖아요... 결국 당신들도 저 사람들과 똑같았던 거야...',
            context: '근위국 호송 차량으로 끌려가며 아미야를 돌아볼 때'
          },
          {
            speaker: '아미야',
            speakerId: 'amiya',
            text: '미샤 씨... 죄송해요... 하지만 약속할게요, 첸 경사님에게 당신의 안전을 반드시 지키도록 약속받았어요. 곧 다시 만나러 갈게요...',
            context: '멀어지는 호송 차량을 바라보며 무거운 눈물을 삼킬 때'
          }
        ],
        involvedCharacters: ['chen', 'misha', 'amiya', 'doctor', 'kaltsit']
      }
    ],
    analysis: {
      theme: '화려한 번영의 그늘 아래 방치된 빈민가에서, 증오의 가면을 쓴 자들과 마주하는 감염자 구호의 딜레마.',
      tacticalEvaluation: '슬럼가에서 보호한 미샤를 용문 근위국에 조건부 인계하여 용문-로도스 간 공식 군사 협약을 성사시킴. 펭귄 로지스틱스 및 블랙스틸과의 다자간 합동 작전으로 리유니온의 1차 탈취 기도를 성공적으로 저지함.',
      loreImpact: '체르노보그 정부 핵심 수석 과학자 세르게이의 딸 미샤가 지닌 "도시 코어 통제권"의 기밀 가치가 확인됨. 용문과 로도스가 공식적인 대테러 군사 협력 관계를 수립함.',
      unresolvedHooks: [
        '스컬슈레더가 왜 그토록 개인적인 집착을 보이며 미샤를 찾으려 하는가',
        '미샤가 스컬슈레더의 목소리를 듣고 경악한 진짜 이유',
        '용문 총독 웨이 옌우가 로도스를 용인하면서도 숨기고 있는 진짜 계산'
      ]
    }
  },
  characters: [
    {
      id: 'chen',
      nameKo: '첸',
      nameEn: 'Ch\'en',
      faction: '용문 근위국',
      role: '용문 근위국 특별감찰팀 총괄 경사',
      avatarUrl: '/images/characters/chen.png',
      description: '용문의 치안과 방위를 수호하는 근위국의 엘리트 경사이자 칼날 같은 원칙주의자. 붉은 검 "적소"를 허리에 차고 다니며, 감염자든 범죄자든 용문의 질서를 위협하는 자에게는 일말의 타협도 없다.',
      quote: '용문의 법을 어긴다면 누구든 내 칼을 피하지 못한다.',
      statusInChapter: '슬럼가 수색 작전 현장 총지휘',
      spoilerLevel: 2
    },
    {
      id: 'skullshatterer',
      nameKo: '스컬슈레더',
      nameEn: 'Skullshatterer',
      faction: '리유니온',
      role: '리유니온 돌격 간부',
      avatarUrl: '/images/characters/skullshatterer.png',
      description: '해골 가면을 착용하고 양손에 개조 유탄 발사기를 장착한 리유니온의 맹장. 비감염자 지배층에 대한 극단적인 적개심을 품고 있으며, 슬럼가에 잠입해 미샤의 행방을 필사적으로 쫓고 있다.',
      quote: '너희의 위선적인 탑을 잿더미로 만들어 주마!',
      statusInChapter: '슬럼가 기습 공격 및 퇴각',
      spoilerLevel: 2
    },
    {
      id: 'franka',
      nameKo: '프란카',
      nameEn: 'Franka',
      faction: '블랙스틸 월드와이드',
      role: '블랙스틸 생화학 방호 및 돌격 오퍼레이터',
      avatarUrl: '/images/characters/franka.png',
      description: '민간 군사기업 블랙스틸 소속의 실력파 용병. 장난기 넘치고 도발적인 성격이지만, 초고열 서믹 레이피어를 휘두르며 적의 중장갑을 일격에 절단하는 일류 검사이다.',
      quote: '자, 우리 귀여운 리스캄 방패 뒤에서 잘 지휘해 보세요~',
      statusInChapter: '로도스 지원 및 근접 돌격 담당',
      spoilerLevel: 2
    },
    {
      id: 'liskarm',
      nameKo: '리스캄',
      nameEn: 'Liskarm',
      faction: '블랙스틸 월드와이드',
      role: '블랙스틸 전술 방호 오퍼레이터',
      avatarUrl: '/images/characters/liskarm.png',
      description: '볼타(방전) 아츠를 전술 방패에 충전하여 사용하는 블랙스틸의 진중한 디펜더. 성실하고 규율을 철저히 지키며, 제멋대로인 프란카의 훌륭한 파트너 역할을 해낸다.',
      quote: '적의 매복 흔적이 곳곳에 있습니다. 박사님, 지시를 내려주십시오.',
      statusInChapter: '전위 방어선 구축 및 아군 보호',
      spoilerLevel: 2
    },
    {
      id: 'amiya',
      nameKo: '아미야',
      nameEn: 'Amiya',
      faction: '로도스 아일랜드',
      role: '로도스 아일랜드 총괄 리더',
      avatarUrl: '/images/characters/amiya.png',
      description: '에이스의 희생을 가슴에 묻고 용문과의 협상에 나선 어린 지도자. 감염자에 대한 첸 경사의 냉랭한 편견 속에서도 평화와 협력의 끈을 놓지 않는다.',
      quote: '그녀는 그저 전쟁에 휘말린 아이일 뿐이에요. 증오의 도구로 이용당하게 둘 순 없어요.',
      statusInChapter: '근위국 협력 교섭 및 미샤 수색 작전 지휘',
      spoilerLevel: 2
    },
    {
      id: 'doctor',
      nameKo: '박사',
      nameEn: 'Doctor',
      faction: '로도스 아일랜드',
      role: '로도스 아일랜드 전술 총사령관',
      avatarUrl: '/images/characters/doctor.png',
      description: '복잡한 용문 슬럼가의 미로 같은 골목길에서도 신속하게 적의 매복을 파악하고 최적의 진형을 구축해 내는 전술 지휘의 귀재.',
      quote: '지형을 이용해 적의 사선을 차단하라. 유탄의 궤적을 예측한다.',
      statusInChapter: '슬럼가 소탕 작전 전술 지휘',
      spoilerLevel: 2
    },
    {
      id: 'misha',
      nameKo: '미샤',
      nameEn: 'Misha',
      faction: '체르노보그 난민 / 감염자',
      role: '세르게이 연구원의 딸',
      avatarUrl: '/images/characters/misha.png',
      description: '체르노보그에서 탈출해 용문 슬럼가에 숨어든 감염자 소녀. 체르노보그 핵심 과학자 세르게이의 딸로, 도시 통제권과 관련된 중대한 비밀을 품고 있어 리유니온과 용문 양측의 표적이 된다.',
      quote: '저리 가요...! 다들 나한테 왜 이러는 거예요... 전 아무것도 모른다고요...!',
      statusInChapter: '슬럼가 고립 및 로도스 보호 후 근위국 조건부 인계',
      spoilerLevel: 2
    },
    {
      id: 'exusiai',
      nameKo: '엑시아',
      nameEn: 'Exusiai',
      faction: '펭귄 로지스틱스',
      role: '펭귄 로지스틱스 배달원 / 스나이퍼',
      avatarUrl: '/images/characters/exusiai.png',
      description: '산크타의 총기를 능숙하게 다루는 쾌활한 배달원. 슬럼가 옥상에서 화력 지원을 펼쳐 로도스의 호송 퇴로를 개척한다.',
      quote: '헤이, 거기 아래 로도스 친구들! 파티에 늦어서 미안! 옥상 쪽 퇴로는 내가 확실하게 열어줄 테니까!',
      statusInChapter: '슬럼가 옥상 화력 지원 및 퇴로 확보',
      spoilerLevel: 2
    },
    {
      id: 'texas',
      nameKo: '텍사스',
      nameEn: 'Texas',
      faction: '펭귄 로지스틱스',
      role: '펭귄 로지스틱스 배달원 / 뱅가드',
      avatarUrl: '/images/characters/texas.png',
      description: '냉정하고 과묵한 펭귄 로지스틱스의 베테랑 운전수이자 검사. 쌍검으로 적의 매복을 분쇄하며 호송대를 인도한다.',
      quote: '동쪽 통로 확보 완료. 적의 후발대가 2분 내로 합류한다. 박사, 서둘러.',
      statusInChapter: '슬럼가 퇴로 정찰 및 기습 차단',
      spoilerLevel: 2
    },
    {
      id: 'lgd_officer',
      nameKo: '용문 근위국 경관',
      nameEn: 'L.G.D. Officer',
      faction: '용문 근위국',
      role: '근위국 현장 치안 요원',
      avatarUrl: '',
      illustUrl: '',
      description: '용문 근위국의 정규 진압 대원. 첸 경사의 엄격한 지휘 아래 슬럼가 봉쇄선 구축과 리유니온 잠입 분견대 소탕에 투입된다.',
      quote: '총기류 불법 개조 확인! 전원, 발포 허가 대기!',
      statusInChapter: '슬럼가 외곽 봉쇄 및 테러 진압 지원',
      spoilerLevel: 2
    }
  ],
  glossary: [
    {
      term: '용문',
      type: 'location',
      typeLabel: '도시/국가',
      description: '염국(옌)에 속해 있으나 고도의 경제적·사법적 자치권을 누리는 초거대 무역 이동도시. 총독 웨이옌우의 통치 아래 번영을 누리고 있으나 하층부에는 감염자 슬럼가가 존재한다.',
      spoilerLevel: 2
    },
    {
      term: '용문 근위국',
      type: 'faction',
      typeLabel: '사법/치안조직',
      description: 'Lungmen Gendarmerie Department (L.G.D.). 용문의 치안, 국경 방위, 대테러 진압을 전담하는 강력한 정규 사법 무장 조직. 첸 경사가 특별감찰팀을 이끈다.',
      spoilerLevel: 2
    },
    {
      term: '블랙스틸',
      type: 'faction',
      typeLabel: '용병/PMC',
      description: 'Blacksteel Worldwide. 컬럼비아에 본사를 둔 국제적인 민간 군사 기업(PMC). 로도스 아일랜드와 보안 제휴 계약을 맺고 오퍼레이터를 파견하고 있다.',
      spoilerLevel: 2
    },
    {
      term: '스컬슈레더',
      type: 'faction',
      typeLabel: '인물/적대세력',
      description: '리유니온의 돌격 지휘관 중 한 명. 해골 마스크를 쓰고 개조 유탄 발사기를 사용하며, 용문 슬럼가에 숨어든 미샤를 탈취하기 위해 부대를 이끌고 침투했다.',
      spoilerLevel: 2
    },
    {
      term: '미샤',
      type: 'concept',
      typeLabel: '중요인물/목표',
      description: '체르노보그에서 탈출해 용문 슬럼가에 숨어든 감염자 소녀. 체르노보그 핵심 과학자 세르게이의 딸로, 도시 통제권과 관련된 중요한 열쇠를 지니고 있다.',
      spoilerLevel: 2
    }
  ]
};

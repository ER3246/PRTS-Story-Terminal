import type { StoryArchive } from '../../types/story';

export const episode13: StoryArchive = {
  id: 'ep13',
  code: 'EPISODE 13',
  category: 'main',
  categoryLabel: '메인 테마',
  actGroup: '메인 Act II: 석양의 런디니움',
  titleKo: '흉조의 소용돌이',
  titleEn: 'The Whirlpool That Is Passion',
  order: 13,
  bannerImage: '/images/story_covers/ep13.png',
  status: 'restored',
  docFormat: 'multi_part',
  isOmnibus: false,
  storyLineId: 'MAIN_ACT_2',
  storyLineTitle: '내일을 위하여 · Act II 석양의 런디니움',
  officialSynopsis: '노포트 구 분리 이후 런디니움 포위망을 좁혀오는 빅토리아 대공작군과 살카즈 군사위원회의 혈전 속에서, 윈더미어 공작의 장렬한 전사와 \'파라곤 부대\'의 부활, 온실과 폐양조장에 번진 희생의 불씨, 그리고 문명 너머 별바다에서 펼쳐진 뱀파이어 군주 생귀나르와의 결전.',
  auditMeta: {
    pipelineVersion: 'v4.0-TwoTierCanon',
    sourceStagesCount: 20,
    draftModel: 'PRTS Frontier Engine (Pass 4 Master Canon Direct)',
    reviewedBy: 'Master Script Audit Report Final Verification (ko_KR Official Script 100% Canon Master)',
    lastVerifiedAt: '2026-10-27'
  },
  systemMeta: {
    recordedTime: '1098-07-15 12:00:00 [TERRA_STD]',
    securityLevel: 'LEVEL 5 // HIGHEST CLEARANCE ARCHIVE',
    operatorInCharge: 'PRTS AI Core Executive'
  },
  meta: {
    timeline: '테라력 1098년 여름 (노포트 구 분리 및 탈출 직후)',
    location: '빅토리아 서부 체틀리 카운티, 카뮈강 유역, 브렌트우드 마을 및 혈액 제단, 폐양조장 리유니온 거점, 런디니움 성왕궁 및 상공, 베헤모스 유해 \'스파인(라이프 스파인)\', 문명 너머의 별바다',
    factions: [
      '로도스 아일랜드',
      '글래스고 패거리 & 파라곤 부대',
      '카즈델 군사위원회 (왕정군 · 십왕정 · 고해신부단)',
      '네오 리유니온',
      '빅토리아 대공작 연합군 (윈더미어 · 캐스터 · 웰링턴 · 고도딘)',
      '브렌트우드 마을 주민 & 런디니움 시민 자경단',
      '더블린'
    ],
    mainCharacters: [
      '아미야', '박사', '켈시', '로고스', '시즈', '델핀',
      '윈더미어 공작', '생귀나르', '살루스', '고해신부', '울술라',
      '가드', '노웰', '메이스', '프리다', '마그달레네', '왕정군 장교',
      '르네 레토', '혼', '미저리', '외드레르', '이네스', 'W',
      '샤이닝', '나이팅게일', '탈룰라', '나인', '레드', '에블라나'
    ]
  },
  seriesTabs: [
    {
      id: 'overview',
      label: '전체 요약 및 개요',
      code: 'OVERVIEW'
    },
    {
      id: 'part_1',
      label: 'Part 1: 상처 입은 대지와 흩어진 불씨',
      code: 'PART 1'
    },
    {
      id: 'part_2',
      label: 'Part 2: 모범의 이름과 왕관의 무게',
      code: 'PART 2'
    },
    {
      id: 'part_3',
      label: 'Part 3: 부서진 온실과 타오르는 유언',
      code: 'PART 3'
    },
    {
      id: 'part_4',
      label: 'Part 4: 진홍의 군주와 쌓여가는 재액',
      code: 'PART 4'
    }
  ],
  subPages: [
    {
      id: 'overview',
      label: '전체 요약 및 개요',
      isOverview: true
    },
    {
      id: 'part_1',
      label: 'Part 1: 상처 입은 대지와 흩어진 불씨',
      code: 'PART 1',
      focalCharacter: '가드 & 윈더미어 공작 & 박사 & 시즈'
    },
    {
      id: 'part_2',
      label: 'Part 2: 모범의 이름과 왕관의 무게',
      code: 'PART 2',
      focalCharacter: '시즈 & 델핀 & 울술라 & 나이팅게일'
    },
    {
      id: 'part_3',
      label: 'Part 3: 부서진 온실과 타오르는 유언',
      code: 'PART 3',
      focalCharacter: '마그달레네 & 프리다 & 왕정군 장교 & 가드'
    },
    {
      id: 'part_4',
      label: 'Part 4: 진홍의 군주와 쌓여가는 재액',
      code: 'PART 4',
      focalCharacter: '르네 레토 & 두카렐 & 아미야 & 탈룰라'
    }
  ],
  multiPartArcs: [
    {
      id: 'part_1',
      partNumber: 1,
      partTitleKo: 'Part 1: 상처 입은 대지와 흩어진 불씨',
      partTitleEn: 'Wounded Earth and Scattered Embers',
      synopsis: '런디니움 외곽 전선은 빅토리아 대공작들과 카즈델 군사위원회의 포격 속에 폐허로 변해간다. 가드는 체르노보그의 악몽 속에서 버림받은 빅토리아 감염자 병사들을 치료하며 림 빌리턴 시절의 기억을 털어놓는다. 윈더미어 공작의 기함에 뱀파이어 군주 생귀나르가 들이닥쳐 공작이 전사하고, 살루스의 기습으로 아미야가 지하 균열에 납치되자 박사는 망설임 없이 몸을 던진다. 로고스의 개입으로 구출된 일행은 밴시의 협곡을 뚫고 현실로 귀환하고, 시즈는 감염자 유기를 주장하는 장교를 제압하며 델핀과 함께 전열을 재정비한다.',
      narrativeText: `런디니움 외곽 전선은 빅토리아 대공작들과 카즈델 군사위원회의 포격 속에 폐허로 변해간다. 가드는 체르노보그의 악몽 속에서 버림받은 빅토리아 감염자 병사들을 치료하며 림 빌리턴 시절의 기억을 털어놓는다. 윈더미어 공작의 기함에 뱀파이어 군주 생귀나르가 들이닥쳐 공작이 전사하고, 살루스의 기습으로 아미야가 지하 균열에 납치되자 박사는 망설임 없이 몸을 던진다. 로고스의 개입으로 구출된 일행은 밴시의 협곡을 뚫고 현실로 귀환하고, 시즈는 감염자 유기를 주장하는 장교를 제압하며 델핀과 함께 전열을 재정비한다. 외드레르와 바벨 3인방은 짙은 주술의 흔적을 쫓아 상공의 베헤모스 유해를 추적하기 시작한다.`,
      code: 'PART 1',
      focalCharacter: '가드 & 윈더미어 공작 & 박사 & 시즈',
      location: '빅토리아 황야 전선, 윈더미어 기함 갑판, 지하 용암 동굴, 밴시의 협곡',
      timeline: '1098년 여름',
      cgUrl: '/images/cgs/43_i01.png',
      cgCaption: '체르노보그의 악몽과 스카우트·패트리어트의 환영',
      stages: [
        {
          stageCode: 'ST-13-01',
          title: '전장 안팎',
          location: '빅토리아 황폐한 귀족 저택 폐허, 카시미어 코트다쥐르, 사르곤 국경 암시장',
          timeMarker: '1098년 여름',
          summary: '외드레르가 카스그랭 경의 기록을 회고하는 가운데 용병들은 고서를 태워 수프를 끓인다. 바벨 3인방은 전장 외곽에서 리치 사냥 준비를 마친다.',
          narrativeText: '외드레르가 카스그랭 경의 기록을 회고하며 전쟁의 본질을 통찰한다. 굶주린 용병들의 탄식과 암시장의 풍경 속에서 바벨 3인방은 상공의 베헤모스 유해와 리치 왕정을 사냥할 준비를 마친다.',
          quotes: [
            {
              speaker: '외드레르',
              speakerId: 'hoederer',
              text: '과거 수십 년간의 평화로 인해, 우리는 전쟁이 일종의 재앙이라는 사실을 잊고 있었다. ……그러나 전쟁은 언제나 우리 곁에 있었다.'
            },
            {
              speaker: '외드레르',
              speakerId: 'hoederer',
              text: '너희들, 리치를 죽이는 방법에 대해서 알고 있나?'
            }
          ],
          involvedCharacters: ['hoederer', 'ines', 'w']
        },
        {
          stageCode: '13-1',
          title: '눈앞의 상처',
          location: '네오 리유니온 임시 구호소 막사, 숲속 야영지',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i01.png',
              caption: '체르노보그의 악몽과 스카우트·패트리어트의 환영',
              type: 'cg'
            }
          ],
          summary: '가드는 체르노보그의 악몽에서 깨어나 버림받은 빅토리아 감염자 병사들을 치료하고, 여섯 살 무렵 림 빌리턴 소금 호수로 배를 저어 사라지던 광부들의 기억을 나눈다.',
          narrativeText: '체르노보그의 불길이 가드의 악몽 속에서 되살아난다. 버림받은 병사들의 상처를 치료한 가드는 나인 및 탈룰라와 함께 소금 호수로 사라져간 감염자 광부들의 기억을 회상한다.',
          quotes: [
            {
              speaker: '가드',
              speakerId: 'guard',
              text: '체르노보그를 떠난 후로, 그 불길은 내 기억 속에서 한 번도 꺼진 적이 없었다.'
            },
            {
              speaker: '가드',
              speakerId: 'guard',
              text: '여섯 살 때 일이 아직도 기억나. 그땐 심지어 감염자도 아니었는데 말이야. 안개가 자욱한 날이면, 병세가 심각한 광부들은 작은 배를 저어 호수 깊은 곳으로 들어가곤 했어…… 그리고 다시는 돌아오지 않았지.'
            }
          ],
          involvedCharacters: ['guard', 'nine', 'talulah', 'percival']
        },
        {
          stageCode: '13-2',
          title: '쉴 새 없이',
          location: '윈더미어 공작군 기함 갑판, 지하 용암 동굴, 밴시의 협곡',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i07.png',
              caption: '델핀의 손을 잡고 숨을 거두는 윈더미어 공작',
              type: 'cg'
            },
            {
              url: '/images/cgs/avg_0_1.png',
              caption: '기억 속의 아미야',
              type: 'cg'
            },
            {
              url: '/images/cgs/avg_7_7.png',
              caption: '기억 속의 박사와 아미야',
              type: 'cg'
            },
            {
              url: '/images/cgs/bg_8_babel3.png',
              caption: '바벨 시절의 기억',
              type: 'cg'
            }
          ],
          summary: '생귀나르와의 결전에서 윈더미어 공작이 딸 델핀의 손을 잡고 전사한다. 지하 균열로 떨어지는 아미야를 구하기 위해 박사가 허공으로 뛰어내리고 로고스의 개입으로 밴시의 협곡으로 전이된다.',
          narrativeText: '기함 갑판에서 윈더미어 공작이 딸 델핀의 성장을 축복하며 숨을 거둔다. 살루스에게 납치된 아미야를 위해 박사는 허공으로 뛰어내려 부러진 손으로 돌멩이를 쥔 채 맞서고, 로고스가 난입하여 구출한다.',
          quotes: [
            {
              speaker: '윈더미어 공작',
              speakerId: 'duke_of_windermere',
              text: '울지 말거라. 네가 검을 휘두르는 모습을 봤다, 델핀…… 훌륭하더구나.'
            },
            {
              speaker: '살루스',
              speakerId: 'salus',
              text: '오른손은 부러졌고, 온몸은 상처투성이네. 그 날카로운 돌멩이로 날 죽이려고?'
            },
            {
              speaker: '로고스',
              speakerId: 'logos',
              text: '……밴시의 협곡? 우리가 왜 이곳에 있는 거지?'
            }
          ],
          involvedCharacters: ['delphine', 'duke_of_windermere', 'sanguinarch', 'doctor', 'salus', 'logos', 'amiya']
        },
        {
          stageCode: '13-3',
          title: '용병의 하루',
          location: '빅토리아 황야 전선, 뱀파이어 마법진 잔해',
          timeMarker: '1098년 여름',
          summary: '외드레르의 과거 회상과 함께 바벨 3인방이 리치 에르망가르드를 포위한다. 에르망가르드는 살카즈 보존 계획을 밝히고, W는 시공 환영 속에서 테레시아의 모습을 목격한다.',
          narrativeText: '바벨 3인방은 뱀파이어의 마법진을 쫓아 에르망가르드를 포위한다. 에르망가르드는 살카즈의 명맥을 보존할 대안을 밝히고, W는 시공의 왜곡 너머 언덕에 앉아 있는 테레시아의 환영을 목격한다.',
          quotes: [
            {
              speaker: '에르망가르드',
              speakerId: 'ermengarde',
              text: '만약 테레시스 경이 실패한다면, 카즈델은 다시 한번 산산조각이 나겠지. 하지만 리치들은 이미 준비를 끝냈어.'
            },
            {
              speaker: 'W',
              speakerId: 'w',
              text: '저기 언덕 위에 앉아 있는 사람…… 테레시아?'
            }
          ],
          involvedCharacters: ['hoederer', 'ines', 'w', 'ermengarde']
        },
        {
          stageCode: '13-4',
          title: '배회하는 액운',
          location: '밴시의 협곡 경계, 빅토리아 서부 도로, 공작군 야영지',
          timeMarker: '1098년 여름',
          summary: '로고스는 뼈 피리로 장벽을 베어내고 현실로 복귀해 파프리카의 트럭을 징발한다. 야영지에서는 감염자 유기를 주장하는 시어러 소위의 안면에 시즈가 주먹을 날려 내분을 진압한다.',
          narrativeText: '로고스는 뼈 피리로 밴시의 협곡을 찢고 귀환해 파프리카의 트럭을 징발한다. 공작군 야영지에서는 감염자 유기를 주장하는 장교의 얼굴에 시즈가 주먹을 날려 전열을 정비한다.',
          quotes: [
            {
              speaker: '로고스',
              speakerId: 'logos',
              text: '내가 만든 포로다. 질문은 받지 않는다. 차를 돌려라.'
            },
            {
              speaker: '시즈',
              speakerId: 'siege',
              text: '감염자든 비감염자든, 모두 빅토리아의 군인이다. 아무도 버리지 않아.'
            },
            {
              speaker: '델핀',
              speakerId: 'delphine',
              text: '어머니의 코트는 아직 나에게 너무 크지만…… 이제 내가 입어야 할 때야.'
            }
          ],
          involvedCharacters: ['logos', 'doctor', 'amiya', 'paprika', 'siege', 'delphine', 'shearer']
        }
      ]
    },
    {
      id: 'part_2',
      partNumber: 2,
      partTitleKo: 'Part 2: 모범의 이름과 왕관의 무게',
      partTitleEn: 'The Name of Exemplars and Weight of the Crown',
      synopsis: '체틀리 카운티 카뮈강 유역에서 살카즈 제단에 갇혀 있던 혼과 미저리를 구출한 시즈는 귀족들의 회유를 뿌리치고 대지에 망치를 내리꽂으며 \'파라곤 부대\'의 부활을 선언한다. 한편 외드레르와 이네스는 하늘을 유영하는 거대 베헤모스 유해 \'스파인\'에서 군사위원회 최연소 소령이 된 옛 후배 울술라와 격돌한다. W의 은신처를 습격한 고해신부 수장 앞에서는 나이팅게일이 스스로를 희생하여 샤이닝을 구하고, 숲속 야영지에서는 장생자 노웰이 탈룰라에게 수백 년간 짊어진 불사의 저주를 고백한다.',
      narrativeText: `체틀리 카운티 카뮈강 유역에서 살카즈 제단에 갇혀 있던 혼과 미저리를 구출한 시즈는 귀족들의 회유를 뿌리치고 대지에 망치를 내리꽂으며 \'파라곤 부대\'의 부활을 선언한다. 한편 외드레르와 이네스는 하늘을 유영하는 거대 베헤모스 유해 \'스파인\'에서 군사위원회 최연소 소령이 된 옛 후배 울술라와 격돌한다. W의 은신처를 습격한 고해신부 수장 앞에서는 나이팅게일이 스스로를 희생하여 샤이닝을 구하고, 숲속 야영지에서는 장생자 노웰이 탈룰라에게 수백 년간 짊어진 불사의 저주를 고백한다.`,
      code: 'PART 2',
      focalCharacter: '시즈 & 델핀 & 울술라 & 나이팅게일',
      location: '카뮈강 유역 제단, 베헤모스 유해 \'스파인\', W 은신처, 리유니온 야영지',
      timeline: '1098년 여름',
      cgUrl: '/images/cgs/avg_6_9.png',
      cgCaption: '살카즈의 핏빛 제단',
      stages: [
        {
          stageCode: '13-5',
          title: '모범의 이름',
          location: '체틀리 카운티 카뮈강 유역 살카즈 제단, 강변 야영지',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/avg_6_9.png',
              caption: '살카즈의 핏빛 제단',
              type: 'cg'
            },
            {
              url: '/images/cgs/32_i03.png',
              caption: '알레르데일의 기억',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i14_1.png',
              caption: '대지에 망치를 내리꽂는 시즈 1',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i14_2.png',
              caption: '대지에 망치를 내리꽂는 시즈 2',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i14_3.png',
              caption: '대지에 망치를 내리꽂는 시즈 3',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i14_4.png',
              caption: '대지에 망치를 내리꽂는 시즈 4',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i09.png',
              caption: '모닥불 곁의 시즈와 델핀, 글래스고 동료들',
              type: 'cg'
            }
          ],
          summary: '혼과 미저리를 구출한 후 델핀은 귀족의 회유를 일축한다. 시즈는 망치를 대지에 내리꽂으며 파라곤 부대의 부활을 선포한다.',
          narrativeText: '카뮈강 유역 제단에서 고립되어 싸우던 혼과 미저리를 구출한 뒤, 시즈는 대지에 망치를 내리꽂으며 백성을 지키는 전설의 군대 파라곤 부대의 부활을 선포한다.',
          quotes: [
            {
              speaker: '시즈',
              speakerId: 'siege',
              text: '오늘부터 우리는 어떤 공작의 사병도, 어떤 왕의 근위대도 아니다. 우리의 이름은…… \'파라곤 부대\'다!'
            },
            {
              speaker: '델핀',
              speakerId: 'delphine',
              text: '나는 윈더미어의 딸이지만, 지금은 파라곤 부대의 일원으로서 이곳에 서 있다.'
            }
          ],
          involvedCharacters: ['siege', 'delphine', 'horn', 'misery', 'indra', 'morgan', 'dagda']
        },
        {
          stageCode: '13-6',
          title: '흔적을 찾아',
          location: '상공의 구름 바다, 베헤모스 유해 \'스파인\' 외벽',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i10.png',
              caption: '안개와 구름 속을 유영하는 거대한 베헤모스의 뼈대',
              type: 'cg'
            }
          ],
          summary: '스파인에 잠입한 외드레르 일행은 군사위원회 최연소 소령이 된 울술라와 마주치고, 고대 유물 회중시계를 든 그녀와 대치한다.',
          narrativeText: '안개와 구름 속을 유영하는 거대한 베헤모스 유해 스파인으로 침투한 세 사람은 군사위원회 최연소 소령이자 스파인 함장이 된 옛 후배 울술라와 마주한다.',
          quotes: [
            {
              speaker: '울술라',
              speakerId: 'ursula',
              text: '오랜만이야, 외드레르 아저씨, 그리고 이네스 언니. 지금은 군사위원회 소령 울술라라고 불러줬으면 좋겠어.'
            }
          ],
          involvedCharacters: ['hoederer', 'ines', 'w', 'ursula']
        },
        {
          stageCode: '13-7',
          title: '뜻밖의 만남',
          location: '베헤모스 유해 \'스파인\' 척추 내부 및 조종실',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i12.png',
              caption: '등을 맞대고 싸우는 외드레르와 이네스',
              type: 'cg'
            }
          ],
          summary: '외드레르와 이네스는 등을 맞대고 싸우며 울술라의 회중시계 아츠 틈새를 공략하고, 스파인의 이동 목적을 파악한 뒤 지상으로 이탈한다.',
          narrativeText: '외드레르와 이네스는 등을 맞대고 싸우며 시간을 되돌리는 울술라의 아츠 틈새를 파고들어 스파인의 비밀을 확보하고 지상으로 귀환한다.',
          quotes: [
            {
              speaker: '이네스',
              speakerId: 'ines',
              text: '시간을 되돌리는 장난감 따위로 우리를 막을 수 있을 것 같아?'
            },
            {
              speaker: '외드레르',
              speakerId: 'hoederer',
              text: '이네스, 지금이다!'
            }
          ],
          involvedCharacters: ['hoederer', 'ines', 'w', 'ursula']
        },
        {
          stageCode: 'ST-13-02',
          title: '왕관을 노리는 자',
          location: '런디니움 교외 W의 안전가옥, 리유니온 숲속 야영지',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i13.png',
              caption: '샤이닝의 옷자락을 붙잡는 나이팅게일(리즈)',
              type: 'cg'
            }
          ],
          summary: '나이팅게일이 스스로를 희생하여 샤이닝을 구하고 고해신부를 따라나선다. 숲속에서는 장생자 노웰이 탈룰라에게 불사의 저주를 고백한다.',
          narrativeText: '고해신부 수장 키사르투슈타지의 습격 속에서 나이팅게일은 샤이닝을 지키기 위해 스스로 인질이 된다. 숲속에서는 장생자 노웰이 불사의 저주를 털어놓는다.',
          quotes: [
            {
              speaker: '나이팅게일',
              speakerId: 'nightingale',
              text: '샤이닝 씨, 전 샤이닝이라는 이름이 더 마음에 들어요…… 전 당신을 이미 용서했어요.'
            },
            {
              speaker: '노웰',
              speakerId: 'nowell',
              text: '\'고통은 너를 영원히 살게 할 것이며, 오직 행복만이 너를 죽일 수 있을 것이다.\' ……그게 내가 받은 저주이자 축복이지.'
            }
          ],
          involvedCharacters: ['shining', 'nightingale', 'confessor', 'kaltsit', 'nowell', 'talulah']
        }
      ]
    },
    {
      id: 'part_3',
      partNumber: 3,
      partTitleKo: 'Part 3: 부서진 온실과 타오르는 유언',
      partTitleEn: 'The Shattered Greenhouse and Burning Testament',
      synopsis: '살루스의 정신 미궁에 갇힌 아미야는 스스로의 가슴을 찔러 환상을 깨부수고 깨어난다. 브렌트우드 마을에서는 온실의 마그달레네가 자경단을 숨겨주고, 스스로를 \'삽\'이라 부르던 왕정군 장교는 마그달레네를 살리기 위해 그녀의 손으로 자결한다. 촌장 대리 프리다는 축포를 쏘아 올리며 산화하고, 시즈의 파라곤 부대가 제단을 박살 낸다. 폐양조장에서는 감염자 난민들의 광기로 번진 대화재 속에서 가드가 메이스와 난민들을 구출하고 진통 약초를 건넨 뒤 녹음기에 숭고한 유언을 남기며 산화한다.',
      narrativeText: `살루스의 정신 미궁에 갇힌 아미야는 스스로의 가슴을 찔러 환상을 깨부수고 깨어난다. 브렌트우드 마을에서는 온실의 마그달레네가 자경단을 숨겨주고, 스스로를 \'삽\'이라 부르던 왕정군 장교는 마그달레네를 살리기 위해 그녀의 손으로 자결한다. 촌장 대리 프리다는 축포를 쏘아 올리며 산화하고, 시즈의 파라곤 부대가 제단을 박살 낸다. 폐양조장에서는 감염자 난민들의 광기로 번진 대화재 속에서 가드가 메이스와 난민들을 구출하고 진통 약초를 건넨 뒤 녹음기에 숭고한 유언을 남기며 산화한다.`,
      code: 'PART 3',
      focalCharacter: '마그달레네 & 프리다 & 왕정군 장교 & 가드',
      location: '브렌트우드 마을 온실, 중앙 광장 제단, 폐가 회의실, 구 폐양조장',
      timeline: '1098년 여름',
      cgUrl: '/images/cgs/43_i02.png',
      cgCaption: '화염 속에서 약초 꽃잎을 건네는 가드',
      stages: [
        {
          stageCode: '13-8',
          title: '환상의 흐름',
          location: '살루스의 정신 미궁, 파프리카의 트럭 짐칸',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/avg_5_7_shining.png',
              caption: '기억 속의 샤이닝',
              type: 'cg'
            },
            {
              url: '/images/cgs/avg_8_27.png',
              caption: '기억 속의 아미야',
              type: 'cg'
            },
            {
              url: '/images/cgs/avg_7_16.png',
              caption: '패트리어트의 최후 회상',
              type: 'cg'
            }
          ],
          summary: '아미야는 마왕들의 원념과 환상을 자신의 가슴을 찔러 극복하고 왕관의 본질이 \'존속\'임을 확신하며 깨어난다.',
          narrativeText: '살루스의 정신 미궁 속에서 아미야는 역대 마왕들의 복수 유혹을 거부하고 스스로 가슴을 찔러 환상을 깨뜨린 뒤 존속의 의미를 되새긴다.',
          quotes: [
            {
              speaker: '아미야',
              speakerId: 'amiya',
              text: '왕관의 힘은 파멸을 위한 것이 아니에요. 그것은…… \'존속\'을 위한 것입니다!'
            }
          ],
          involvedCharacters: ['amiya', 'salus', 'doctor', 'logos']
        },
        {
          stageCode: '13-9',
          title: '구름 낀 마을',
          location: '빅토리아 브렌트우드 마을, 유리 온실 내부',
          timeMarker: '1098년 여름',
          summary: '온실 관리인 마그달레네는 피스트와 락락을 숨겨주고, 프리다는 주민들을 보호하려 애쓰며 마그달레네에게 꽃씨를 건넨다.',
          narrativeText: '브렌트우드 온실에서 마그달레네는 자경단을 숨겨주고, 프리다는 주민들의 몰살을 막기 위해 고뇌하며 꽃씨를 건넨다.',
          quotes: [
            {
              speaker: '프리다',
              speakerId: 'frida',
              text: '싸우면 다 죽어! 난 촌장 대리야, 마을 사람들을 사지로 내몰 수는 없다고……'
            },
            {
              speaker: '마그달레네',
              speakerId: 'vendela',
              text: '이 온실의 꽃들이 다시 피어날 때까지, 우리가 버텨야만 해요.'
            }
          ],
          involvedCharacters: ['vendela', 'frida', 'feist', 'rockrock']
        },
        {
          stageCode: '13-10',
          title: '부서진 온실',
          location: '브렌트우드 유리 온실 폐허, 마을 공사장 들보',
          timeMarker: '1098년 여름',
          summary: '온실이 파괴될 때 왕정군 장교(\'삽\')가 마그달레네의 손을 치료하고 탈출 힌트를 준다. 프리다는 마을에 닥친 죽음의 그림자를 직감한다.',
          narrativeText: '살카즈 용병들이 온실을 짓밟을 때, 왕정군 장교 삽이 다친 마그달레네를 치료해주고 탈출 힌트를 은밀히 흘린다.',
          quotes: [
            {
              speaker: '왕정군 장교',
              speakerId: 'royal_court_officer',
              text: '난 그저 \'삽\'일 뿐이다. 삽은 자신이 파는 구덩이에 누가 묻히는지 묻지 않지. ……내일 새벽 다섯 시, 북쪽 시멘트 창고의 경비 교대가 늦어질 거다.'
            }
          ],
          involvedCharacters: ['vendela', 'royal_court_officer', 'frida']
        },
        {
          stageCode: '13-12',
          title: '핏빛의 연기',
          location: '브렌트우드 중앙 광장 혈액 제단, 시멘트 공사장',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/avg_6_16.png',
              caption: '하늘로 쏘아 올려진 축포',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i08.png',
              caption: '브렌트우드 상공을 뒤덮는 거대한 핏빛 촉수',
              type: 'cg'
            }
          ],
          summary: '왕정군 장교는 마그달레네를 위해 자결하고, 프리다는 축포를 쏘아 올리며 산화한다. 파라곤 부대가 전차를 몰고 돌입해 제단을 분쇄한다.',
          narrativeText: '제단이 가동되자 왕정군 장교 삽은 마그달레네를 위해 자결하고, 프리다는 하늘 높이 축포를 쏘아 올리며 산화한다. 파라곤 부대가 돌입해 제단을 박살 낸다.',
          quotes: [
            {
              speaker: '왕정군 장교',
              speakerId: 'royal_court_officer',
              text: '이제 가라, 원예사 아가씨. 넌 날 죽이고 도망친 거다…… 어서 달아나!'
            },
            {
              speaker: '프리다',
              speakerId: 'frida',
              text: '모두 도망쳐!! 이 불빛을 보고 어서 마을 밖으로 달아나란 말이야!!'
            }
          ],
          involvedCharacters: ['vendela', 'royal_court_officer', 'frida', 'siege', 'delphine', 'feist', 'rockrock']
        },
        {
          stageCode: '13-13',
          title: '짧은 모임',
          location: '브렌트우드 마을 외곽 부서진 폐가',
          timeMarker: '1098년 여름',
          summary: '브렌트우드 폐가에서 로도스, 파라곤 부대, 자경단, 바벨 3인방이 모여 합동 작전 회의를 열고 스파인 타격을 결의한다.',
          narrativeText: '무너진 폐가 안에서 전선의 주역들이 모여 합동 회의를 열고, 켈시는 광석병과 살카즈의 근원적 연관성을 경고하며 스파인 강습을 결의한다.',
          quotes: [
            {
              speaker: '켈시',
              speakerId: 'kaltsit',
              text: '살카즈라는 종족은 어째서 광석병에 가장 취약한 것인가? 테레시스와 생귀나르가 깨우려는 것은 단순한 전쟁 무기가 아니다.'
            }
          ],
          involvedCharacters: ['amiya', 'doctor', 'kaltsit', 'logos', 'siege', 'delphine', 'hoederer', 'ines', 'w']
        },
        {
          stageCode: '13-14',
          title: '\'우리\'',
          location: '브렌트우드 인근 숲속 구 폐양조장 리유니온 거점',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i02.png',
              caption: '화염 속에서 약초 꽃잎을 건네는 가드',
              type: 'cg'
            }
          ],
          summary: '감염자 난민들의 광기로 번진 대화재 속에서 가드는 메이스와 난민들을 대피시키고 진통 약초를 건넨 뒤 녹음기에 숭고한 유언을 남기며 산화한다.',
          narrativeText: '살카즈 행상인 살해로 번진 대화재 속에서 가드는 비감염자 메이스와 난민들을 모두 대피시키고, 꽃잎을 건넨 뒤 녹음기에 유언을 남기며 불길 속에서 산화한다.',
          quotes: [
            {
              speaker: '가드',
              speakerId: 'guard',
              text: '우리와 힘을 합쳐야 할 사람들, 함께 가시밭길을 헤쳐나가길 원하는 사람들이…… 과연 감염자뿐일까?'
            },
            {
              speaker: '나인',
              speakerId: 'nine',
              text: '가드가 남긴 이 녹음기 속의 질문에, 이제 우리가 답해야 해.'
            }
          ],
          involvedCharacters: ['guard', 'mace', 'red', 'nine', 'talulah']
        }
      ]
    },
    {
      id: 'part_4',
      partNumber: 4,
      partTitleKo: 'Part 4: 진홍의 군주와 쌓여가는 재액',
      partTitleEn: 'The Crimson Lord and Accumulating Calamity',
      synopsis: '스파인 강습 작전 직전, 외드레르는 W에게 카즈델 용병들을 이끌 지도자의 책임을 일깨운다. 성왕궁에서 레토 중령은 뱀파이어 군주 생귀나르 앞에서 스스로 목을 그어 순혈 뱀파이어를 자신의 피로 모독한다. 스파인 등뼈에서 생귀나르는 만 년 전 티카즈의 피를 추출해 제단에 바치고, 깨어난 베헤모스는 일행을 태운 채 문명 너머 별바다로 날아오른다. 아미야와 로고스, 바벨 3인방의 합동 공격에 두카렐은 심연으로 추락하고, 갈대밭에서는 에블라나와 탈룰라의 화염이 격돌한다. 3대 공작의 총공세 합의와 로도스 본함의 출항 속에서, 마지막 증기 기사 찰스 린치가 지하에서 깨어난다.',
      narrativeText: `스파인 강습 작전 직전, 외드레르는 W에게 카즈델 용병들을 이끌 지도자의 책임을 일깨운다. 성왕궁에서 레토 중령은 뱀파이어 군주 생귀나르 앞에서 스스로 목을 그어 순혈 뱀파이어를 자신의 피로 모독한다. 스파인 등뼈에서 생귀나르는 만 년 전 티카즈의 피를 추출해 제단에 바치고, 깨어난 베헤모스는 일행을 태운 채 문명 너머 별바다로 날아오른다. 아미야와 로고스, 바벨 3인방의 합동 공격에 두카렐은 심연으로 추락하고, 갈대밭에서는 에블라나와 탈룰라의 화염이 격돌한다. 3대 공작의 총공세 합의와 로도스 본함의 출항 속에서, 마지막 증기 기사 찰스 린치가 지하에서 깨어난다.`,
      code: 'PART 4',
      focalCharacter: '르네 레토 & 두카렐 & 아미야 & 탈룰라',
      location: '스파인 등뼈, 성왕궁 회랑, 문명 너머 별바다, 브렌트우드 외곽 갈대밭, 런디니움 지하',
      timeline: '1098년 여름',
      cgUrl: '/images/cgs/43_i04.png',
      cgCaption: '별바다 위를 유영하는 베헤모스 유해와 생귀나르·아미야·로고스',
      stages: [
        {
          stageCode: '13-15',
          title: '누가 하소연하리',
          location: '브렌트우드 외곽 자작나무 숲속',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i11.png',
              caption: '숲속에서 마주 선 외드레르, 이네스, W',
              type: 'cg'
            }
          ],
          summary: '외드레르는 W에게 광기의 가면을 벗고 살카즈 용병들을 이끌 책임을 마주하라고 일깨운다. 파라곤 부대가 교란하는 사이 강습조가 상공으로 돌입한다.',
          narrativeText: '외드레르는 W에게 광기의 폭탄마 뒤에 숨지 말고 용병들을 이끌 지도자의 책임을 마주하라고 일깨운다. 파라곤 부대의 교란과 함께 강습조가 상공으로 진입한다.',
          quotes: [
            {
              speaker: '외드레르',
              speakerId: 'hoederer',
              text: '테레시스를 죽이는 건 쉽다, W. 하지만 그다음은? 네 뒤를 따르는 저 수많은 살카즈 용병들에게 어떤 미래를 줄 생각이지?'
            }
          ],
          involvedCharacters: ['hoederer', 'ines', 'w', 'siege', 'delphine']
        },
        {
          stageCode: '13-16',
          title: '가슴을 펴고',
          location: '런디니움 요양원 노병의 병실, 성왕궁 회랑',
          timeMarker: '1098년 여름',
          summary: '레토 중령은 90세 골 노병을 안락사시킨 뒤, 성왕궁에서 생귀나르 앞에서 스스로 목을 그어 자결하며 순혈 뱀파이어를 피로 모독한다.',
          narrativeText: '레토 중령은 90세 노병을 평온히 안락사시킨 후, 성왕궁에서 생귀나르 앞에서 스스로 목을 베어 순혈 뱀파이어를 자신의 피로 모독한다.',
          quotes: [
            {
              speaker: '르네 레토 중령',
              speakerId: 'leto',
              text: '네놈에게, 내 피를 네게 \'하사\'하겠다는 거다, 이 더러운 거머리 같은 놈아! ……기억해라, 이 비열한 르네 레토가 그 고귀하신 피를 더럽혔으니까!'
            }
          ],
          involvedCharacters: ['leto', 'sanguinarch', 'clovicia']
        },
        {
          stageCode: '13-18',
          title: '들끓는 피바다',
          location: '더 샤드 접견실, 베헤모스 유해 \'스파인\' 거대 등뼈',
          timeMarker: '1098년 여름',
          summary: '생귀나르는 아미야의 창끝을 이용해 자신의 몸에서 만 년 전 순수한 \'티카즈의 피\'를 추출해 런디니움 제단으로 보내고 의식을 완성시킨다.',
          narrativeText: '스파인 등뼈에서 생귀나르는 아미야의 공격을 유도해 몸속에 잠들어 있던 만 년 전 티카즈의 피 한 방울을 추출해 제단으로 날려 보낸다.',
          quotes: [
            {
              speaker: '뱀파이어 생귀나르',
              speakerId: 'sanguinarch',
              text: '고맙구나, 어린 마왕이여. 네 창끝이 아니었다면, 내 몸 깊은 곳에 잠든 이 만 년 전의 순수한 \'티카즈의 피\'를 꺼내지 못했을 테니.'
            }
          ],
          involvedCharacters: ['sanguinarch', 'amiya', 'logos', 'theresis']
        },
        {
          stageCode: '13-19',
          title: '진홍의 군주',
          location: '베헤모스 내부 기관실, 문명 너머의 별바다 시공간',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i04.png',
              caption: '별바다 위를 유영하는 베헤모스 유해와 생귀나르·아미야·로고스',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i05_1.png',
              caption: '생귀나르의 혈계에 맞서는 아미야',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i05_2.png',
              caption: '검지 반지를 부수며 힘을 해방하는 아미야',
              type: 'cg'
            },
            {
              url: '/images/cgs/43_i06.png',
              caption: '베헤모스 유해 아래 심연으로 추락하는 뱀파이어 생귀나르 두카렐',
              type: 'cg'
            }
          ],
          summary: '거수 베헤모스가 일행을 태우고 별바다로 도약한다. 아미야는 두카렐의 내면을 간파하고, 합동 일격으로 두카렐을 심연 속으로 추락시킨다.',
          narrativeText: '깨어난 거수 베헤모스가 일행을 태우고 별바다로 날아오른다. 아미야는 검지 반지를 깨뜨려 형을 죽였던 두카렐의 내면을 간파하고 합동 공격으로 그를 심연 속으로 추락시킨다.',
          quotes: [
            {
              speaker: '뱀파이어 생귀나르',
              speakerId: 'sanguinarch',
              text: '내 이름을 기억해라, 어린 키메라여. 내 이름은 두카렐, 피의 군주다.'
            },
            {
              speaker: '아미야',
              speakerId: 'amiya',
              text: '당신은 과거를 잊지 못하는 게 아니에요, 두카렐. 당신은 그저…… 당신이 죽인 형의 그 평화로운 꿈이 두려웠던 거예요!'
            },
            {
              speaker: '뱀파이어 생귀나르',
              speakerId: 'sanguinarch',
              text: '……가소롭구나. 내 손을 놓아라. 난 스스로 떨어지겠다.'
            }
          ],
          involvedCharacters: ['amiya', 'logos', 'sanguinarch', 'hoederer', 'ines', 'w', 'ursula']
        },
        {
          stageCode: 'ST-13-03',
          title: '쌓여가는 재액',
          location: '브렌트우드 외곽 갈대밭 습지, 황야 동굴, 공작 연합군 함대, 런디니움 지하',
          timeMarker: '1098년 여름',
          visuals: [
            {
              url: '/images/cgs/43_i03.png',
              caption: '갈대밭에서 격돌하는 에블라나와 탈룰라의 화염',
              type: 'cg'
            },
            {
              url: '/images/cgs/avg_ep13.png',
              caption: '어둠 속에서 깨어나는 마지막 증기 갑주',
              type: 'cg'
            }
          ],
          summary: '갈대밭에서 에블라나와 탈룰라가 화염으로 격돌하고, 3대 공작은 런디니움 총공세를 합의한다. 로도스 본함이 출항하고 지하에서는 마지막 증기 기사 찰스 린치가 눈을 뜬다.',
          narrativeText: '외드레르와의 내기를 인정한 베헤모스는 일행을 안전하게 귀환시킨다. 갈대밭에서는 에블라나와 탈룰라가 화염으로 격돌하고, 3대 공작은 런디니움 총공세를 합의한다. 로도스 본함이 출항하고 런디니움 지하에서는 마지막 증기 기사가 깨어난다.',
          quotes: [
            {
              speaker: '외드레르',
              speakerId: 'hoederer',
              text: '당신이 봤던 그 이상한 사람들…… 그러니까 토끼, 양, 밴시, 살카즈가 한때 당신을 사냥했던 뱀파이어를 무찌를 거다.'
            },
            {
              speaker: '탈룰라',
              speakerId: 'talulah',
              text: '에블라나, 내 불꽃은 너의 그 차가운 죽음의 불길 따위에 굴복하지 않는다.'
            },
            {
              speaker: '클로저',
              speakerId: 'closure',
              text: '드디어 본함 계류 해제 승인이 떨어졌어! 로도스 아일랜드 본함, 런디니움으로 출항합니다!'
            }
          ],
          involvedCharacters: ['hoederer', 'talulah', 'eblana', 'closure', 'chen', 'bagpipe', 'steam_knight']
        }
      ]
    }
  ],
  content: {
    prtsGreeting: '[PRTS ARCHIVE] 빅토리아 체틀리 카운티, 브렌트우드 혈액 제단, 상공의 베헤모스 유해 \'스파인\' 및 런디니움 작전 기록 아카이브.',
    logline: '노포트 구 분리 이후 런디니움 포위망을 좁혀오는 빅토리아 대공작군과 살카즈 군사위원회의 혈전 속에서, 윈더미어 공작의 장렬한 전사와 \'파라곤 부대\'의 부활, 온실과 폐양조장에 번진 희생의 불씨, 그리고 문명 너머 별바다에서 펼쳐진 뱀파이어 군주 생귀나르와의 결전.',
    background: '노포트 구 탈출 작전 이후 런디니움 외곽의 빅토리아 대공작들과 카즈델 군사위원회의 전쟁은 전면전 양상으로 치닫는다. 살카즈 군사위원회는 거대 베헤모스 유해를 개조한 시공간 요새 \'스파인\'과 브렌트우드 마을에 구축된 혈액 제단을 통해 만 년 전 고대의 \'씨앗(태초의 오리지늄)\'을 깨우는 피의 의식을 강행한다. 윈더미어 공작이 뱀파이어 생귀나르와 맞서 싸우다 전사하자, 시즈는 감염자와 비감염자를 가리지 않고 빅토리아의 대지와 백성을 지키는 전설의 \'파라곤 부대\'를 재건한다. 한편 온실의 묘목을 지키던 마그달레네와 마을을 구하려 축포를 쏘아 올린 프리다, 그리고 폐양조장의 화재 속에서 편견을 넘어 비감염자 메이스와 난민들을 구출하고 진통 약초를 지키며 산화한 가드의 숭고한 희생이 이어진다. 마침내 로도스 아일랜드와 파라곤 부대, 바벨 3인방이 상공의 스파인으로 돌입하여 문명 너머 별바다에서 뱀파이어 군주 생귀나르를 심연 속으로 추락시킨다.',
    acts: [
      {
        step: 1,
        phase: '파트 1',
        phaseEn: 'Part 1',
        title: '상처 입은 대지와 흩어진 불씨',
        location: '빅토리아 황야 전선, 윈더미어 기함 갑판, 지하 용암 동굴, 밴시의 협곡',
        cgUrl: '/images/cgs/43_i01.png',
        cgCaption: '체르노보그의 악몽과 스카우트·패트리어트의 환영',
        narrativeText: '런디니움 외곽 전선에서 가드는 체르노보그의 악몽을 딛고 버림받은 감염자 병사들을 치료하며 림 빌리턴 시절의 기억을 나눈다. 윈더미어 공작이 기함에서 생귀나르와 맞서다 장렬히 전사하고, 살루스에게 납치되어 땅의 균열로 떨어지는 아미야를 구하기 위해 박사가 허공으로 뛰어내려 로고스와 함께 밴시의 협곡으로 전이된다.',
        summary: '가드는 체르노보그의 악몽 속에서 버림받은 병사들을 치료하고, 윈더미어 공작은 생귀나르와 맞서다 전사한다. 아미야를 구하기 위해 박사가 허공으로 뛰어내려 로고스와 함께 밴시의 협곡으로 전이된다.',
        quotes: [
          {
            speaker: '가드',
            speakerId: 'guard',
            text: '체르노보그를 떠난 후로, 그 불길은 내 기억 속에서 한 번도 꺼진 적이 없었다.'
          },
          {
            speaker: '윈더미어 공작',
            speakerId: 'duke_of_windermere',
            text: '울지 말거라. 네가 검을 휘두르는 모습을 봤다, 델핀…… 훌륭하더구나.'
          }
        ],
        involvedCharacters: ['guard', 'duke_of_windermere', 'delphine', 'doctor', 'salus', 'logos', 'siege']
      },
      {
        step: 2,
        phase: '파트 2',
        phaseEn: 'Part 2',
        title: '모범의 이름과 왕관의 무게',
        location: '카뮈강 유역 제단, 베헤모스 유해 \'스파인\', W 은신처, 리유니온 야영지',
        cgUrl: '/images/cgs/avg_6_9.png',
        cgCaption: '살카즈의 핏빛 제단',
        narrativeText: '카뮈강 살카즈 제단에 갇혀 있던 혼과 미저리를 구출한 시즈는 귀족들의 회유를 뿌리치고 대지에 망치를 내리꽂으며 파라곤 부대의 부활을 선포한다. 바벨 조는 상공의 스파인에서 군사위원회 최연소 소령 울술라와 격돌하고, 은신처에서는 나이팅게일이 샤이닝을 구하기 위해 스스로 인질이 되어 고해신부를 따라나선다.',
        summary: '시즈는 대지에 망치를 내리꽂으며 파라곤 부대의 부활을 선포하고, 바벨 조는 스파인에서 울술라와 격돌한다. 나이팅게일은 샤이닝을 구하기 위해 스스로 인질이 된다.',
        quotes: [
          {
            speaker: '시즈',
            speakerId: 'siege',
            text: '오늘부터 우리는 어떤 공작의 사병도, 어떤 왕의 근위대도 아니다. 우리의 이름은…… \'파라곤 부대\'다!'
          },
          {
            speaker: '나이팅게일',
            speakerId: 'nightingale',
            text: '샤이닝 씨, 전 샤이닝이라는 이름이 더 마음에 들어요…… 전 당신을 이미 용서했어요.'
          }
        ],
        involvedCharacters: ['siege', 'delphine', 'horn', 'misery', 'hoederer', 'ines', 'ursula', 'nightingale', 'shining']
      },
      {
        step: 3,
        phase: '파트 3',
        phaseEn: 'Part 3',
        title: '부서진 온실과 타오르는 유언',
        location: '브렌트우드 마을 온실, 중앙 광장 제단, 폐가 회의실, 구 폐양조장',
        cgUrl: '/images/cgs/43_i02.png',
        cgCaption: '화염 속에서 약초 꽃잎을 건네는 가드',
        narrativeText: '살루스의 정신 미궁 속에서 아미야는 스스로 심장을 찔러 환상을 깨뜨린다. 브렌트우드 온실에서는 왕정군 장교 삽이 마그달레네를 위해 자결하고 프리다는 축포를 쏘아 올리며 산화하며 파라곤 부대가 제단을 박살 낸다. 폐양조장 화재 속에서 가드는 숭고한 유언을 남기며 산화한다.',
        summary: '아미야는 미궁에서 심장을 찔러 깨어나고, 브렌트우드에서는 왕정군 장교와 프리다의 희생 속에 파라곤 부대가 제단을 박살 낸다. 폐양조장 화재 속에서 가드는 숭고한 유언을 남기며 산화한다.',
        quotes: [
          {
            speaker: '아미야',
            speakerId: 'amiya',
            text: '왕관의 힘은 파멸을 위한 것이 아니에요. 그것은…… \'존속\'을 위한 것입니다!'
          },
          {
            speaker: '가드',
            speakerId: 'guard',
            text: '우리와 힘을 합쳐야 할 사람들, 함께 가시밭길을 헤쳐나가길 원하는 사람들이…… 과연 감염자뿐일까?'
          }
        ],
        involvedCharacters: ['amiya', 'vendela', 'royal_court_officer', 'frida', 'siege', 'guard', 'mace', 'nine']
      },
      {
        step: 4,
        phase: '파트 4',
        phaseEn: 'Part 4',
        title: '진홍의 군주와 쌓여가는 재액',
        location: '스파인 등뼈, 성왕궁 회랑, 문명 너머 별바다, 브렌트우드 외곽 갈대밭, 런디니움 지하',
        cgUrl: '/images/cgs/43_i04.png',
        cgCaption: '별바다 위를 유영하는 베헤모스 유해와 생귀나르·아미야·로고스',
        narrativeText: '레토 중령은 성왕궁에서 생귀나르 앞에서 스스로 목을 그어 자결하고, 생귀나르는 만 년 전 티카즈의 피를 추출해 제단에 바친다. 깨어난 베헤모스를 타고 별바다로 날아오른 아미야 일행은 두카렐을 심연으로 추락시킨다. 3대 공작이 총공세를 선언하고 런디니움 지하에서 마지막 증기 기사가 깨어난다.',
        summary: '레토 중령은 생귀나르 앞에서 자결하고, 별바다에서 아미야 일행은 두카렐을 심연으로 추락시킨다. 3대 공작이 총공세를 선언하고 런디니움 지하에서 마지막 증기 기사가 깨어난다.',
        quotes: [
          {
            speaker: '르네 레토 중령',
            speakerId: 'leto',
            text: '네놈에게, 내 피를 네게 \'하사\'하겠다는 거다, 이 더러운 거머리 같은 놈아!'
          },
          {
            speaker: '탈룰라',
            speakerId: 'talulah',
            text: '에블라나, 내 불꽃은 너의 그 차가운 죽음의 불길 따위에 굴복하지 않는다.'
          }
        ],
        involvedCharacters: ['leto', 'sanguinarch', 'amiya', 'logos', 'hoederer', 'ines', 'w', 'talulah', 'eblana', 'steam_knight']
      }
    ],
    analysis: {
      theme: '상처 입은 자들의 연대와 상실의 극복 — 대지와 백성을 지키기 위해 일어선 파라곤 부대의 부활, 폐양조장 화재 속에서 \'우리\'의 참된 의미를 묻고 산화한 가드의 숭고한 희생, 그리고 파멸 대신 존속을 선택한 아미야의 왕관.',
      tacticalEvaluation: '로도스 아일랜드는 파라곤 부대, 시민 자경단, 바벨 3인방을 하나로 엮어 다국적 연합 전선을 구축하고, 상공의 베헤모스 유해 \'스파인\'에 정예 강습조를 투입해 뱀파이어 군주 생귀나르를 제거하는 데 성공함. 또한 본함(Landship)의 런디니움 출항 승인을 얻어내며 최종 결전의 교두보를 확보함.',
      loreImpact: '윈더미어 공작의 전사와 생귀나르의 실각으로 전선이 격변하는 가운데, 생귀나르가 바친 만 년 전 티카즈의 피로 인해 \'씨앗\' 의식이 완성됨. 캐스터·웰링턴·고도딘 3대 공작이 연합하여 런디니움 총공세를 선언하고, 지하에서 마지막 증기 기사 찰스 린치가 재가동하며 전면전이 임박함.',
      unresolvedHooks: [
        '런디니움 지하 어둠 속에서 깨어난 마지막 증기 기사 찰스 린치가 전선에서 보여줄 행보',
        '브렌트우드 갈대밭에서 격돌한 에블라나와 탈룰라의 드라코 대립 및 불꽃의 향방',
        '만 년 전 순수한 티카즈의 피 한 방울로 완성된 태초의 오리지늄 \'씨앗\'이 초래할 종말적 재앙',
        '샤이닝과 동료들을 지키기 위해 스스로 고해신부 수장을 따라간 나이팅게일(리즈)의 운명'
      ]
    }
  },
  characters: [
    {
      id: 'amiya',
      nameKo: '아미야',
      nameEn: 'Amiya',
      faction: '로도스 아일랜드',
      role: '로도스 아일랜드 총사령관 / 카우투스 마왕',
      avatarUrl: '/images/characters/amiya.png',
      illustUrl: '/images/characters/amiya.png',
      description: '살루스의 미궁 속에서 가슴을 찔러 마왕의 복수를 거부하고 \'존속\'을 선택했으며, 두카렐을 심연 속으로 추락시킨다.',
      quote: '왕관의 힘은 파멸을 위한 것이 아니에요. 그것은…… \'존속\'을 위한 것입니다!',
      statusInChapter: '별바다에서 두카렐 격파 후 본대 귀환'
    },
    {
      id: 'doctor',
      nameKo: '박사',
      nameEn: 'Doctor',
      faction: '로도스 아일랜드',
      role: '수석 전술 지휘관',
      avatarUrl: '/images/characters/doctor.png',
      illustUrl: '/images/characters/doctor.png',
      description: '아미야를 구하기 위해 지하 균열로 망설임 없이 뛰어내려 부러진 손으로 돌멩이를 쥐고 살루스를 막아선다.',
      quote: '(아미야를 데려가게 둘 순 없어.)',
      statusInChapter: '브렌트우드 합동 전선 지휘'
    },
    {
      id: 'logos',
      nameKo: '로고스',
      nameEn: 'Logos',
      faction: '로도스 아일랜드',
      role: '정예 오퍼레이터 / 밴시의 군주',
      avatarUrl: '/images/characters/logos.png',
      illustUrl: '/images/characters/logos.png',
      description: '뼈 피리로 밴시의 협곡을 베어내고, 상공의 스파인에서 만가로 두카렐의 혈계를 분쇄한다.',
      quote: '내가 만든 포로다. 질문은 받지 않는다. 차를 돌려라.',
      statusInChapter: '강습 작전 완수'
    },
    {
      id: 'kaltsit',
      nameKo: '켈시',
      nameEn: 'Kal\'tsit',
      faction: '로도스 아일랜드',
      role: '최고 의료 책임자',
      avatarUrl: '/images/characters/kaltsit.png',
      illustUrl: '/images/characters/kaltsit.png',
      description: '의식을 회복한 후 브렌트우드 회의를 주재하고 근원적 오리지늄 \'씨앗\'의 위험을 경고한다.',
      quote: '살카즈라는 종족은 어째서 광석병에 가장 취약한 것인가? 테레시스와 생귀나르가 깨우려는 것은 단순한 전쟁 무기가 아니다.',
      statusInChapter: '연합 작전 조율'
    },
    {
      id: 'siege',
      nameKo: '시즈',
      nameEn: 'Siege (Vina)',
      faction: '파라곤 부대',
      role: '파라곤 부대 총사령관',
      avatarUrl: '/images/characters/siege.png',
      illustUrl: '/images/characters/siege.png',
      description: '카뮈강 대지에 망치를 내리꽂아 파라곤 부대의 부활을 선포하고 브렌트우드 제단을 파괴한다.',
      quote: '오늘부터 우리는 어떤 공작의 사병도, 어떤 왕의 근위대도 아니다. 우리의 이름은…… \'파라곤 부대\'다!',
      statusInChapter: '파라곤 부대 결성 및 진격'
    },
    {
      id: 'delphine',
      nameKo: '델핀',
      nameEn: 'Delphine Windermere',
      faction: '파라곤 부대',
      role: '윈더미어 공작의 후계자',
      avatarUrl: '/images/characters/delphine.png',
      illustUrl: '/images/characters/delphine.png',
      description: '어머니의 전사 후 귀족들의 회유를 뿌리치고 어머니의 코트를 걸친 채 파라곤 부대에 합류한다.',
      quote: '나는 윈더미어의 딸이지만, 지금은 파라곤 부대의 일원으로서 이곳에 서 있다.',
      statusInChapter: '파라곤 부대 부사령관'
    },
    {
      id: 'duke_of_windermere',
      nameKo: '윈더미어 공작',
      nameEn: 'Duke of Windermere',
      faction: '빅토리아 제국',
      role: '윈더미어 공작군 총사령관',
      avatarUrl: '/images/characters/duke_of_windermere.png',
      illustUrl: '/images/characters/duke_of_windermere.png',
      description: '기함 갑판에서 뱀파이어 군주 생귀나르와 맞서 싸우다 치명상을 입고 딸 델핀의 손을 잡은 채 숨을 거둔다.',
      quote: '울지 말거라. 네가 검을 휘두르는 모습을 봤다, 델핀…… 훌륭하더구나.',
      statusInChapter: '기함 갑판에서 명예롭게 전사'
    },
    {
      id: 'salus',
      nameKo: '살루스',
      nameEn: 'Salus',
      faction: '카즈델 군사위원회',
      role: '고해신부 간부 / 의식 집행관',
      avatarUrl: '/images/characters/salus.png',
      illustUrl: '/images/characters/salus.png',
      description: '아미야를 지하 균열로 납치하여 왕관을 빼앗으려 했으며, 정신 미궁 아츠로 아미야를 시험한다.',
      quote: '오른손은 부러졌고, 온몸은 상처투성이네. 그 날카로운 돌멩이로 날 죽이려고?',
      statusInChapter: '로고스에게 격퇴당함'
    },
    {
      id: 'ursula',
      nameKo: '울술라',
      nameEn: 'Ursula',
      faction: '카즈델 군사위원회',
      role: '군사위원회 최연소 소령 / 스파인 함장',
      avatarUrl: '/images/characters/ursula.png',
      illustUrl: '/images/characters/ursula.png',
      description: '스카 마켓 출신으로 고대 영웅의 회중시계를 사용하여 시간을 되돌리는 아츠를 구사한다. 생귀나르의 폭주로 피를 뽑혀 빈사 상태에 빠졌다가 외드레르에게 구조되어 포로가 된다.',
      quote: '오랜만이야, 외드레르 아저씨, 그리고 이네스 언니. 지금은 군사위원회 소령 울술라라고 불러줬으면 좋겠어.',
      statusInChapter: '외드레르에게 구조되어 포로로 생포'
    },
    {
      id: 'guard',
      nameKo: '가드',
      nameEn: 'Guard',
      faction: '네오 리유니온',
      role: '청년 전사 (전 로도스 아일랜드)',
      avatarUrl: '/images/characters/guard.png',
      illustUrl: '/images/characters/guard.png',
      description: '폐양조장 화재 현장에서 난민들과 메이스를 대피시키고 진통 약초를 지킨 뒤, \'우리\'의 참된 의미를 묻는 유언을 남기며 산화한다.',
      quote: '우리와 힘을 합쳐야 할 사람들, 함께 가시밭길을 헤쳐나가길 원하는 사람들이…… 과연 감염자뿐일까?',
      statusInChapter: '폐양조장 화재 속에서 숭고하게 산화'
    },
    {
      id: 'sanguinarch',
      nameKo: '생귀나르 (두카렐)',
      nameEn: 'Sanguinarch (Duq\'arael)',
      faction: '카즈델 군사위원회',
      role: '뱀파이어 왕정의 군주 / 피의 군주',
      avatarUrl: '/images/characters/sanguinarch.png',
      illustUrl: '/images/characters/sanguinarch.png',
      description: '윈더미어 공작을 전사시키고 만 년 전 티카즈의 피를 추출해 씨앗을 깨우지만, 별바다에서 아미야 일행에게 패해 심연으로 추락한다.',
      quote: '내 이름을 기억해라, 어린 키메라여. 내 이름은 두카렐, 피의 군주다.',
      statusInChapter: '별바다 심연으로 추락'
    },
    {
      id: 'confessor',
      nameKo: '고해신부 (키사르투슈타지)',
      nameEn: 'Confessor (Qui\'sartushtaj)',
      faction: '카즈델 군사위원회',
      role: '고해신부단 최고 수장 / 샤이닝의 아버지',
      avatarUrl: '/images/characters/confessor.png',
      illustUrl: '/images/characters/confessor.png',
      description: '영생하는 혈통의 수장으로 딸 샤이닝의 검을 뽑게 하려 했으나, 스스로 인질이 된 나이팅게일을 데리고 물러난다.',
      statusInChapter: '나이팅게일을 데리고 퇴각'
    },
    {
      id: 'nightingale',
      nameKo: '나이팅게일 (리즈)',
      nameEn: 'Nightingale (Liz)',
      faction: '사도 (Followers)',
      role: '살카즈 치유사',
      avatarUrl: '/images/characters/nightingale.png',
      illustUrl: '/images/characters/nightingale.png',
      description: '샤이닝을 용서하고 그녀와 동료들을 구하기 위해 스스로 인질이 되어 고해신부 수장을 따라나선다.',
      quote: '샤이닝 씨, 전 샤이닝이라는 이름이 더 마음에 들어요…… 전 당신을 이미 용서했어요.',
      statusInChapter: '고해신부단에 인질로 동행'
    },
    {
      id: 'ermengarde',
      nameKo: '에르망가르드',
      nameEn: 'Ermengarde',
      faction: '리치 왕정',
      role: '리치 왕정의 후계자',
      avatarUrl: '/images/characters/ermengarde.png',
      illustUrl: '/images/characters/ermengarde.png',
      description: '바벨 3인방과 대화를 나누며 카즈델 멸망 시 살카즈를 유목 형태로 보존할 리치 왕정의 대비책을 밝힌다.',
      quote: '만약 테레시스 경이 실패한다면, 카즈델은 다시 한번 산산조각이 나겠지. 하지만 리치들은 이미 준비를 끝냈어.',
      statusInChapter: '외곽 전선에서 리치 연구 지속'
    },
    {
      id: 'nowell',
      nameKo: '노웰',
      nameEn: 'Nowell',
      faction: '네오 리유니온',
      role: '안경사 겸 수선공 / 불사의 \'장생자\'',
      avatarUrl: '/images/characters/nowell.png',
      illustUrl: '/images/characters/nowell.png',
      description: '수백 년을 살아온 장생자로, 오직 행복만이 자신을 죽일 수 있다는 저주를 짊어지고 안식을 찾아 방랑한다.',
      quote: '\'고통은 너를 영원히 살게 할 것이며, 오직 행복만이 너를 죽일 수 있을 것이다.\' ……그게 내가 받은 저주이자 축복이지.',
      statusInChapter: '리유니온 야영지 동행'
    },
    {
      id: 'mace',
      nameKo: '메이스',
      nameEn: 'Mace',
      faction: '네오 리유니온 대피소',
      role: '폐양조장 거점 관리인 (비감염자)',
      avatarUrl: '/images/characters/mace.png',
      illustUrl: '/images/characters/mace.png',
      description: '작고한 리유니온 의사의 유지를 지키다 가드의 희생으로 꽃잎을 건네받고 목숨을 건진다.',
      statusInChapter: '가드의 희생으로 생존'
    },
    {
      id: 'vendela',
      nameKo: '마그달레네 (벤델라)',
      nameEn: 'Magdalene (Vendela)',
      faction: '브렌트우드 온실',
      role: '온실 관리인 (원예사)',
      avatarUrl: '/images/characters/vendela.png',
      illustUrl: '/images/characters/vendela.png',
      description: '유리 온실에서 자경단을 숨겨주고, 왕정군 장교의 자결과 자경단의 구출 덕분에 무사히 탈출한다.',
      quote: '이 온실의 꽃들이 다시 피어날 때까지, 우리가 버텨야만 해요.',
      statusInChapter: '자경단과 함께 브렌트우드 탈출'
    },
    {
      id: 'frida',
      nameKo: '프리다 웨스트',
      nameEn: 'Frida West',
      faction: '브렌트우드 마을',
      role: '브렌트우드 대리 촌장',
      avatarUrl: '/images/characters/frida.png',
      illustUrl: '/images/characters/frida.png',
      description: '주민들의 탈출 신호를 보내기 위해 아버지의 유품인 축포를 하늘로 쏘아 올리고 장렬히 산화한다.',
      quote: '모두 도망쳐!! 이 불빛을 보고 어서 마을 밖으로 달아나란 말이야!!',
      statusInChapter: '축포를 쏘아 올리고 장렬히 산화'
    },
    {
      id: 'royal_court_officer',
      nameKo: '왕정군 장교 (\'삽\')',
      nameEn: 'Royal Court Officer (The Shovel)',
      faction: '카즈델 군사위원회',
      role: '브렌트우드 제단 현장 장교',
      avatarUrl: '/images/characters/royal_court_officer.png',
      illustUrl: '/images/characters/royal_court_officer.png',
      description: '스스로를 명령대로 땅을 파는 \'삽\'이라 부르며, 마그달레네를 탈출시키기 위해 그녀의 손으로 자결한다.',
      quote: '난 그저 \'삽\'일 뿐이다. 삽은 자신이 파는 구덩이에 누가 묻히는지 묻지 않지.',
      statusInChapter: '마그달레네 탈출을 위해 자결'
    },
    {
      id: 'leto',
      nameKo: '르네 레토 중령',
      nameEn: 'Lt. Col. Leto',
      faction: '런디니움 도시방위군',
      role: '해임된 전 방위군 사령관',
      avatarUrl: '/images/characters/leto.png',
      illustUrl: '/images/characters/leto.png',
      description: '90세 골 노병을 안락사시킨 후, 성왕궁에서 생귀나르 앞에서 스스로 목을 그어 자결하며 순혈 뱀파이어를 피로 모독한다.',
      quote: '네놈에게, 내 피를 네게 \'하사\'하겠다는 거다, 이 더러운 거머리 같은 놈아!',
      statusInChapter: '생귀나르 면전에서 자결'
    },
    {
      id: 'closure',
      nameKo: '클로저',
      nameEn: 'Closure',
      faction: '로도스 아일랜드',
      role: '수석 엔지니어',
      avatarUrl: '/images/characters/closure.png',
      illustUrl: '/images/characters/closure.png',
      description: '로도스 아일랜드 본함의 출항 승인을 획득하고 런디니움을 향해 출항을 지휘한다.',
      quote: '드디어 본함 계류 해제 승인이 떨어졌어! 로도스 아일랜드 본함, 런디니움으로 출항합니다!',
      statusInChapter: '본함 출항 지휘'
    },
    {
      id: 'steam_knight',
      nameKo: '찰스 린치 (마지막 증기 기사)',
      nameEn: 'Charles Lynch (The Last Steam Knight)',
      faction: '빅토리아 제국',
      role: '전설의 기사 / 증기 갑주 조종사',
      avatarUrl: '/images/characters/steam_knight.png',
      illustUrl: '/images/characters/steam_knight.png',
      description: '런디니움 지하 어둠 속에서 거대한 고압 증기를 뿜어내며 다시 깨어난다.',
      statusInChapter: '런디니움 지하에서 재가동'
    }
  ],
  glossary: [
    {
      term: '스파인 / 라이프 스파인',
      type: 'technology',
      typeLabel: '살카즈 결전 병기 / 시공 요새',
      description: '고대 거수 베헤모스의 유해를 개조한 공중 시공간 요새. 울술라 소령이 조종하며 살카즈 혈액을 동력으로 삼는다.'
    },
    {
      term: '파라곤 부대',
      type: 'faction',
      typeLabel: '빅토리아 전설 군대 / 통합 수호군',
      description: '빅토리아 황금기를 이끌었던 전설적인 통합 군대로, 시즈가 대지에 망치를 내리꽂으며 백성을 지키는 군대로 부활시켰다.'
    },
    {
      term: '씨앗과 만 년 전 티카즈의 피',
      type: 'concept',
      typeLabel: '오리지늄 근원 유산 / 고대 주술',
      description: '생귀나르가 바친 만 년 전 순수한 티카즈의 피 한 방울로 완성된 태초의 근원적 오리지늄 결정체.'
    },
    {
      term: '장생자',
      type: 'concept',
      typeLabel: '불사의 존재 / 테라의 관찰자',
      description: '자연적 수명으로 죽지 않는 불사의 존재들. 안경사 노웰이 대표적이며 오직 행복만이 자신을 죽일 수 있다는 저주를 짊어졌다.'
    },
    {
      term: '갈라바에 철 방패',
      type: 'technology',
      typeLabel: '빅토리아 기동 요새 / 윈더미어 주력함',
      description: '윈더미어 공작 가문의 초중형 기동 요새로, 기함 침투 시 난민들을 버리고 후퇴하여 귀족 군벌의 한계를 드러냈다.'
    },
    {
      term: '브렌트우드 혈액 제단',
      type: 'location',
      typeLabel: '살카즈 의식 구조물 / 주술 시설',
      description: '마을 주민 전체를 산 제물로 삼으려던 살카즈의 거대 주술 제단으로 파라곤 부대의 포격에 의해 파괴되었다.'
    },
    {
      term: '밴시의 협곡',
      type: 'location',
      typeLabel: '살카즈 아츠 공간 / 시공 환영',
      description: '살루스가 대지를 가를 때 열린 시공의 틈새로 로고스가 뼈 피리로 장벽을 베어내고 탈출했다.'
    },
    {
      term: '울술라의 회중시계',
      type: 'arts',
      typeLabel: '고대 살카즈 유물',
      description: '고대 영웅 시간의 도둑 울술라의 유물로 국소적 시간을 되돌리는 능력을 발휘한다.'
    },
    {
      term: '생귀나르 두카렐',
      type: 'faction',
      typeLabel: '살카즈 십왕정 군주',
      description: '살카즈 십왕정 중 뱀파이어 군주로, 별바다 전투에서 아미야 일행에게 패해 심연으로 추락했다.'
    },
    {
      term: '마지막 증기 기사',
      type: 'technology',
      typeLabel: '빅토리아 결전 병기',
      description: '런디니움 지하에 잠들어 있던 빅토리아 결전 병기로 찰스 린치가 조종하며 증기를 뿜으며 재가동했다.'
    }
  ]
};

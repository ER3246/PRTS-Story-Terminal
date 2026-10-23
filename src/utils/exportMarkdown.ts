import type { StoryArchive } from '../types/story';
import type { StoryListItem, StoryLineMeta } from '../data/storyRegistry';
import { getStoryAccessState } from '../data/storyRegistry';

const GLOBAL_CHARACTER_NAME_MAP: Record<string, string> = {
  kaltsit: '켈시',
  mountain: '마운틴',
  silence: '사일런스',
  muelsyse: '뮤엘시스',
  kafka: '카프카',
  robin: '로빈',
  mayer: '메이어',
  pinecone: '파인콘',
  jesselton: '제셀톤',
  domma: '돔마',
  barton: '발톤',
  saria: '사리아',
  anthony: '앤소니',
  doctor: '박사',
  amiya: '아미야',
  amiy: '아미야',
  ch_en: '첸',
  chen: '첸',
  patriot: '패트리어트',
  sarkaz_messenger: '살카즈 전달자',
  rublev: '루블레프 (강한 아이)',
  andrei: '안드레이 (약한 아이)',
  theresa: '테레시아',
  hoederer: '외드레르',
  ines: '이네스',
  scout: '스카우트',
  confessor: '고해신부',
  closer: '클로저',
  w: 'W',
  talulah: '탈룰라',
  kaschey: '코셀나 (카셰이)',
  nine: '나인',
  harmonie: '아르모니',
  bagpipe: '백파이프',
};

/**
 * 캐릭터 ID 배열을 한국어 캐릭터명 목록 문자열로 변환
 */
function formatInvolvedCharacters(ids: string[] | undefined, characters: StoryArchive['characters']): string {
  if (!ids || ids.length === 0) return '';
  const charMap = new Map(characters.map((c) => [c.id.toLowerCase(), c.nameKo]));
  return ids.map((id) => charMap.get(id.toLowerCase()) || GLOBAL_CHARACTER_NAME_MAP[id.toLowerCase()] || id).join(', ');
}

/**
 * 혹시 남아있을 수 있는 구형 시스템 브리핑 접두어를 정돈
 */
function cleanNarrativeText(text: string): string {
  if (!text) return '';
  return text.replace(/^\[PRTS\s+.*?브리핑\s*\/\/\s*.*?\]\s*\n*/i, '').trim();
}

/**
 * 단일 스토리 아카이브를 검수용 마크다운(.md) 문서로 변환
 * (Gemini 4 Argon 등 외부 AI 검수 프롬프트 및 원문 서사/대사/명부/사후분석 일체 포함)
 */
export function generateStoryMarkdown(story: StoryArchive): string {
  const isMultiPart = Boolean(story.docFormat === 'multi_part' && story.multiPartArcs && story.multiPartArcs.length > 0);
  const isOmnibus = Boolean(story.isOmnibus && story.omnibusSubEpisodes && story.omnibusSubEpisodes.length > 0);

  let md = `# [PRTS STORY ARCHIVE] ${story.code} : ${story.titleKo} (${story.titleEn})\n\n`;

  // 메타데이터 요약 블록 (담백한 정보 전달)
  md += `> **스토리 코드:** ${story.code}\n`;
  md += `> **스토리 분류:** ${story.categoryLabel} · ${story.actGroup}\n`;
  md += `> **배경 시점:** ${story.meta.timeline}\n`;
  md += `> **배경 장소:** ${story.meta.location}\n`;
  md += `> **관련 세력:** ${story.meta.factions.join(' · ')}\n`;
  if (story.meta.mainCharacters && story.meta.mainCharacters.length > 0) {
    md += `> **주요 등장인물:** ${story.meta.mainCharacters.join(', ')}\n`;
  }
  md += `\n`;

  // AI 검수용 안내 프롬프트
  md += `---\n\n`;
  md += `## 📌 [AI 검수 가이드 / GEMINI 4 ARGON REVIEW PROMPT]\n`;
  md += `> 아래 프롬프트를 복사하여 외부 AI(Gemini 4 Argon 등)에 전달하면 고증 및 서사 검수를 즉시 진행할 수 있습니다.\n\n`;
  md += `\`\`\`text\n`;
  md += `[명일방주(Arknights) 스토리 아카이브 검수 요청]\n`;
  md += `이 문서는 명일방주 공식 스토리 [${story.code} : ${story.titleKo}]의 PRTS 스토리 아카이브 상세 정리본입니다.\n`;
  md += `다음 5가지 기준을 중점적으로 검토하고 구체적인 피드백과 개선안을 제시해 주세요:\n`;
  md += `1. 공식 고증 및 인과관계 일치성: 테라 대륙 연대기, 배경 지역, 세력 간 역학 관계, 인물들의 행적 및 사건 인과관계의 정확성.\n`;
  md += `2. 서사 디테일 및 완성도: 원작의 핵심 사건, 반전, 인물 간 갈등과 심리 묘사, 배경 설명이 축약이나 누락 없이 충분히 담겼는지.\n`;
  md += `3. 인게임 원문 대사 정합성: 캐릭터 고유의 어조와 한국어 인게임 실제 스크립트 대사가 왜곡 없이 정확하게 인용되었는지.\n`;
  md += `4. 컷신 및 CG 묘사 일치성: 수록된 컷신/CG의 시각적 요소와 설명 캡션, 등장 타이밍이 실제 장면과 정확히 일치하는지.\n`;
  md += `5. 스포일러 방지 및 사후 분석 타당성: 후속 이벤트에 대한 과도한 선행 스포일러 배제 여부 및 작품의 핵심 테마, 여운, 잔존 떡밥 정리의 적절성.\n`;
  md += `\`\`\`\n\n`;

  md += `---\n\n`;

  // 1. 스토리 배경 및 개요 (불필요한 시스템 인트로 롤플레잉 제거)
  md += `## 1. 스토리 배경 및 개요 (Story Overview)\n\n`;
  md += `**핵심 로그라인:**\n${story.content.logline}\n\n`;
  md += `**상세 서사 배경:**\n${story.content.background}\n\n`;

  md += `---\n\n`;

  // 2. 단계별 서사 국면 (MultiPart, Omnibus, or Acts)
  if (isMultiPart && story.multiPartArcs) {
    md += `## 2. 챕터별 상세 서사 (Story Chapters: ${story.multiPartArcs.length} Parts)\n\n`;
    story.multiPartArcs.forEach((arc) => {
      md += `### [PART 0${arc.partNumber}] ${arc.code ? `[${arc.code}] ` : ''}${arc.partTitleKo}${arc.partTitleEn ? ` (${arc.partTitleEn})` : ''}\n`;
      if (arc.location) {
        md += `- **배경 장소:** ${arc.location}\n`;
      }
      if (arc.timeline) {
        md += `- **배경 시점:** ${arc.timeline}\n`;
      }
      if (arc.focalCharacter) {
        md += `- **중심 인물:** ${arc.focalCharacter}\n`;
      }
      if (arc.cgCaption) {
        md += `- **대표 CG:** ${arc.cgCaption} (${arc.cgUrl || '없음'})\n`;
      }
      md += `- **파트 요약:** ${arc.synopsis}\n\n`;

      md += `#### 📖 파트 줄거리\n${cleanNarrativeText(arc.narrativeText || arc.synopsis)}\n\n`;

      if (arc.visuals && arc.visuals.length > 0) {
        md += `#### 🖼️ 수록 컷신 및 CG (Visual Gallery: ${arc.visuals.length} Scenes)\n`;
        arc.visuals.forEach((vis, vIdx) => {
          md += `- **씬 [${vIdx + 1}]:** ${vis.caption} (${vis.url})${vis.triggerLine ? `\n  - *등장 맥락:* ${vis.triggerLine}` : ''}\n`;
        });
        md += `\n`;
      }

      if (arc.quotes && arc.quotes.length > 0) {
        md += `#### 💬 인게임 주요 대사 (Key Quotes)\n`;
        arc.quotes.forEach((q) => {
          md += `- **${q.speaker}**${q.context ? ` (${q.context})` : ''}: "${q.text}"\n`;
        });
        md += `\n`;
      }

      if (arc.stages && arc.stages.length > 0) {
        md += `#### 🛰️ 세부 스테이지별 상세 스토리 (${arc.stages.length} Stages)\n\n`;
        arc.stages.forEach((st) => {
          md += `##### ▶ [${st.stageCode}] ${st.title} (${st.location})\n`;
          if (st.timeMarker) {
            md += `- **시점:** ${st.timeMarker}\n`;
          }
          if (st.visuals && st.visuals.length > 0) {
            md += `- **스테이지 컷신/CG (${st.visuals.length}개):**\n`;
            st.visuals.forEach((vis, vIdx) => {
              md += `  * [씬 ${vIdx + 1}] ${vis.caption} (${vis.url})${vis.triggerLine ? ` — *등장 맥락:* ${vis.triggerLine}` : ''}\n`;
            });
          } else if (st.cgCaption) {
            md += `- **스테이지 컷신/CG:** ${st.cgCaption} (${st.cgUrl || '없음'})\n`;
          }
          md += `- **스테이지 요약:** ${st.summary}\n\n`;
          md += `${cleanNarrativeText(st.narrativeText)}\n\n`;
          if (st.quotes && st.quotes.length > 0) {
            md += `*인게임 핵심 대사:*\n`;
            st.quotes.forEach((sq) => {
              md += `  * **${sq.speaker}**${sq.context ? ` (${sq.context})` : ''}: "${sq.text}"\n`;
            });
            md += `\n`;
          }
          if (st.involvedCharacters && st.involvedCharacters.length > 0) {
            md += `- **등장인물:** ${formatInvolvedCharacters(st.involvedCharacters, story.characters)}\n\n`;
          }
        });
      }

      if (arc.involvedCharacters && arc.involvedCharacters.length > 0) {
        md += `- **파트 등장인물:** ${formatInvolvedCharacters(arc.involvedCharacters, story.characters)}\n\n`;
      }
      md += `---\n\n`;
    });
  } else if (isOmnibus && story.omnibusSubEpisodes) {
    md += `## 2. 수록 단편 에피소드 목록 (Omnibus Episodes: ${story.omnibusSubEpisodes.length}편)\n\n`;
    story.omnibusSubEpisodes.forEach((sub) => {
      md += `### [단편 0${sub.order}] ${sub.titleKo}${sub.titleEn ? ` (${sub.titleEn})` : ''}\n`;
      if (sub.location) {
        md += `- **배경 장소:** ${sub.location}\n`;
      }
      if (sub.timeline) {
        md += `- **배경 시점:** ${sub.timeline}\n`;
      }
      if (sub.mainCharacter) {
        md += `- **중심 인물:** ${sub.mainCharacter}\n`;
      }
      if (sub.cgCaption) {
        md += `- **대표 CG:** ${sub.cgCaption} (${sub.cgUrl || '없음'})\n`;
      }
      md += `- **에피소드 요약:** ${sub.synopsis}\n\n`;
      if (sub.narrativeText) {
        md += `#### 📖 에피소드 상세 줄거리\n${cleanNarrativeText(sub.narrativeText)}\n\n`;
      }
      if (sub.quotes && sub.quotes.length > 0) {
        md += `#### 💬 인게임 주요 대사 (Key Quotes)\n`;
        sub.quotes.forEach((q) => {
          md += `- **${q.speaker}**${q.context ? ` (${q.context})` : ''}: "${q.text}"\n`;
        });
        md += `\n`;
      }
      if (sub.involvedCharacters && sub.involvedCharacters.length > 0) {
        md += `- **등장인물:** ${formatInvolvedCharacters(sub.involvedCharacters, story.characters)}\n\n`;
      }
      md += `---\n\n`;
    });
  } else {
    md += `## 2. 스토리 전개 단계 (Story Parts: ${story.content.acts.length}개 파트)\n\n`;
    story.content.acts.forEach((act) => {
      md += `### [PART 0${act.step}] ${act.phase} (${act.phaseEn}) : ${act.title}\n`;
      md += `- **배경 장소:** ${act.location}\n`;
      if (act.cgCaption) {
        md += `- **대표 CG:** ${act.cgCaption} (${act.cgUrl || '없음'})\n`;
      }
      md += `- **파트 요약:** ${act.summary}\n\n`;

      md += `#### 📖 상세 줄거리\n${cleanNarrativeText(act.narrativeText)}\n\n`;

      if (act.quotes && act.quotes.length > 0) {
        md += `#### 💬 인게임 주요 대사 (Key Quotes)\n`;
        act.quotes.forEach((q) => {
          md += `- **${q.speaker}**${q.context ? ` (${q.context})` : ''}: "${q.text}"\n`;
        });
        md += `\n`;
      }

      if (act.stages && act.stages.length > 0) {
        md += `#### 🛰️ 세부 스테이지별 상세 스토리 (${act.stages.length} Stages)\n\n`;
        act.stages.forEach((st) => {
          md += `##### ▶ [${st.stageCode}] ${st.title} (${st.location})\n`;
          if (st.cgCaption) {
            md += `- **스테이지 컷신/CG:** ${st.cgCaption} (${st.cgUrl || '없음'})\n`;
          }
          if (st.tacticalLog) {
            md += `- **상황 로그:** ${st.tacticalLog}\n`;
          }
          md += `- **요약:** ${st.summary}\n\n`;
          md += `${cleanNarrativeText(st.narrativeText)}\n\n`;
          if (st.quotes && st.quotes.length > 0) {
            md += `*인게임 핵심 대사:*\n`;
            st.quotes.forEach((sq) => {
              md += `  * **${sq.speaker}**${sq.context ? ` (${sq.context})` : ''}: "${sq.text}"\n`;
            });
            md += `\n`;
          }
          if (st.involvedCharacters && st.involvedCharacters.length > 0) {
            md += `- **등장인물:** ${formatInvolvedCharacters(st.involvedCharacters, story.characters)}\n\n`;
          }
        });
      }

      if (act.involvedCharacters && act.involvedCharacters.length > 0) {
        md += `- **등장인물:** ${formatInvolvedCharacters(act.involvedCharacters, story.characters)}\n\n`;
      }
    });
  }

  if (!md.endsWith('---\n\n')) {
    md += `---\n\n`;
  }

  // 3. 주요 등장인물 명부
  md += `## 3. 주요 등장인물 명부 (Characters: ${story.characters.length}명)\n\n`;
  story.characters.forEach((char) => {
    md += `### ${char.nameKo} (${char.nameEn})\n`;
    md += `- **소속:** ${char.faction} | **역할/직책:** ${char.role}\n`;
    md += `- **스토리 내 행적:** ${char.statusInChapter}\n`;
    if (char.quote) {
      md += `- **대표 대사:** "${char.quote}"\n`;
    }
    md += `- **인물 소개:** ${char.description}\n\n`;
  });

  md += `---\n\n`;

  // 4. 관련 용어 사전
  if (story.glossary && story.glossary.length > 0) {
    md += `## 4. 관련 용어 사전 (Glossary: ${story.glossary.length}건)\n\n`;
    story.glossary.forEach((item) => {
      md += `### ${item.term} [${item.typeLabel} // ${item.type.toUpperCase()}]\n`;
      md += `${item.description}\n\n`;
    });
    md += `---\n\n`;
  }

  // 5. 스토리 사후 분석 및 해설
  md += `## 5. 스토리 사후 분석 및 해설 (Story Evaluation & Lore Impact)\n\n`;
  md += `### 01. 핵심 테마 및 서사적 메시지\n${story.content.analysis.theme}\n\n`;
  md += `### 02. 로도스 아일랜드의 개입 및 전술적 영향\n${story.content.analysis.tacticalEvaluation}\n\n`;
  md += `### 03. 테라 대륙 정세 및 세력 영향\n${story.content.analysis.loreImpact}\n\n`;
  md += `### 04. 미회수 복선 및 잔존 떡밥 (Unresolved Hooks)\n`;
  story.content.analysis.unresolvedHooks.forEach((hook, idx) => {
    md += `${idx + 1}. ${hook}\n`;
  });
  md += `\n`;

  md += `---\n`;
  md += `*PRTS STORY ARCHIVE // OFFICIAL STORY TERMINAL*\n`;

  return md;
}

/**
 * 전체 89개 스토리의 개발 및 수록 상태를 총망라한 마스터 보고서 마크다운 생성
 */
export function generateStatusMasterMarkdown(stories: StoryListItem[], storyLines: StoryLineMeta[]): string {
  const total = stories.length;
  const restored = stories.filter((s) => s.status === 'restored');
  const overviewOnly = stories.filter((s) => s.status !== 'restored' && s.status !== 'locked');
  const locked = stories.filter((s) => s.status === 'locked');

  const restoredPct = ((restored.length / total) * 100).toFixed(1);
  const overviewPct = ((overviewOnly.length / total) * 100).toFixed(1);
  const lockedPct = ((locked.length / total) * 100).toFixed(1);

  let md = `# [PRTS] 테라 대륙 스토리 아카이브 종합 수록 현황 마스터 보고서\n\n`;

  md += `> **문서 발행:** PRTS Data Management Subsystem\n`;
  md += `> **총 등록 스토리:** ${total}편\n`;
  md += `> **상세 수록 완료 (RESTORED):** ${restored.length}편 (${restoredPct}%)\n`;
  md += `> **개요 등록 완료 (ARCHIVED):** ${overviewOnly.length}편 (${overviewPct}%)\n`;
  md += `> **보안 잠금 (LOCKED):** ${locked.length}편 (${lockedPct}%)\n\n`;

  md += `---\n\n`;

  // AI 종합 검수용 프롬프트
  md += `## 📌 [AI 종합 검수 가이드 / GEMINI 4 ARGON MASTER REVIEW PROMPT (v4.0)]\n`;
  md += `> 아래 프롬프트를 복사하여 외부 AI(Gemini 4 Argon 등)에 전달하면 프로젝트 전체 로드맵에 대한 전략적 조언을 얻을 수 있습니다.\n\n`;
  md += `\`\`\`text\n`;
  md += `[명일방주 스토리 아카이브 v4.0 마스터 로드맵 검수]\n`;
  md += `이 문서는 명일방주 공식 스토리의 전체 데이터베이스 현황 및 v4.0 로드맵 수록 목록입니다.\n`;
  md += `현재 총 16편(메인 테마 Act I EP 00~08 9편, 초기 사이드 3편, 라인 랩 3부작 3편, 방주 RL-01 흑야의 회고록 1편)이 상세 서사로 완전 수록되었습니다.\n`;
  md += `프로젝트는 AI 할당량 효율 극대화를 위해 외전 확장을 멈추고 방금 완성된 '흑야의 회고록'과 직결되는 메인 2부 《석양의 런디니움》(EP 09~14) 및 직결장 《바벨(RL-04)》을 최우선으로 일직선 완주하는 v4.0 체계로 전환했습니다.\n`;
  md += `다음 사항에 대해 분석하고 자문을 제공해 주세요:\n`;
  md += `1. 메인 2부 7편(EP 09~13, 바벨, EP 14)의 서사적 연속성과 스테이지 배치 최적화 방안.\n`;
  md += `2. EP 14 진입 전 RL-04 바벨 배치 순서의 당위성 및 고증 정합성 점검.\n`;
  md += `3. 장편 메인 스토리의 효과적인 2계층(Act -> StageNode) 요약과 4대 시각 리소스 규칙 준수 점검.\n`;
  md += `\`\`\`\n\n`;

  md += `---\n\n`;

  // 1. 수록 진척도 통계 요약
  md += `## 1. 수록 진척도 총괄 통계\n\n`;
  md += `| 카테고리 | 전체 편수 | 상세 수록 (완료) | 개요 등록 (대기) | 잠김 (미실장) | 진척도 |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

  const categories = [
    { key: 'main', label: '메인 테마 (Main Theme)' },
    { key: 'side-story', label: '사이드 스토리 (Side Story)' },
    { key: 'omnibus', label: '옴니버스 단편 (Omnibus)' },
    { key: 'intermezzi', label: '인터메조 (Intermezzi)' },
    { key: 'collaboration', label: '콜라보레이션 (Collab)' }
  ];

  categories.forEach((cat) => {
    const inCat = stories.filter((s) => s.category === cat.key);
    const rCount = inCat.filter((s) => s.status === 'restored').length;
    const oCount = inCat.filter((s) => s.status !== 'restored' && s.status !== 'locked').length;
    const lCount = inCat.filter((s) => s.status === 'locked').length;
    const pct = inCat.length > 0 ? ((rCount / inCat.length) * 100).toFixed(1) : '0.0';
    md += `| **${cat.label}** | ${inCat.length} | ${rCount} | ${oCount} | ${lCount} | **${pct}%** |\n`;
  });

  md += `| **합계 (전체)** | **${total}** | **${restored.length}** | **${overviewOnly.length}** | **${locked.length}** | **${restoredPct}%** |\n\n`;

  md += `---\n\n`;

  // 2. 상세 수록 완료 스토리 체크리스트 (16편)
  md += `## 2. 상세 수록 완료 스토리 체크리스트 (총 ${restored.length}편 - RESTORED)\n\n`;
  
  const mainAct1 = restored.filter(s => s.storyLineId === 'MAIN_ACT_1');
  const earlySides = restored.filter(s => ['sid_ancient_forge', 'sid_grani', 'sid_heart_of_surging_flame'].includes(s.id));
  const rhTrilogy = restored.filter(s => ['sid_mansfield_break', 'sid_dorothys_vision', 'sid_lone_trail'].includes(s.id));
  const rlBridge = restored.filter(s => s.id === 'sid_darknights_memoir');

  md += `### 1) 메인 테마 Act I: 각성과 환멸 (9편 완결)\n`;
  mainAct1.forEach((s) => {
    md += `- **✅ [상세 수록 완료] [${s.code}] ${s.titleKo}** (${s.titleEn})\n`;
    md += `  - 시기: ${s.timeline} | 개요: ${s.officialSynopsis}\n`;
  });
  md += `\n`;

  md += `### 2) 초기 사이드 스토리 연작 (3편 완결)\n`;
  earlySides.forEach((s) => {
    md += `- **✅ [상세 수록 완료] [${s.code}] ${s.titleKo}** (${s.titleEn})\n`;
    md += `  - 서사 라인: ${s.storyLineTitle} | 시기: ${s.timeline}\n`;
    md += `  - 개요: ${s.officialSynopsis}\n`;
  });
  md += `\n`;

  md += `### 3) 라인 랩(RH) 컬럼비아 과학 3부작 (3편 완결)\n`;
  rhTrilogy.forEach((s) => {
    md += `- **✅ [상세 수록 완료] [${s.code}] ${s.titleKo}** (${s.titleEn})\n`;
    md += `  - 서사 라인: ${s.storyLineTitle} | 시기: ${s.timeline}\n`;
    md += `  - 개요: ${s.officialSynopsis}\n`;
  });
  md += `\n`;

  md += `### 4) 방주(RL) 코어 브릿지 (1편 완결 — Act I ➔ Act II 연결 다리)\n`;
  rlBridge.forEach((s) => {
    md += `- **✅ [상세 수록 완료] [${s.code}] ${s.titleKo}** (${s.titleEn})\n`;
    md += `  - 서사 라인: ${s.storyLineTitle} | 시기: ${s.timeline}\n`;
    md += `  - 개요: ${s.officialSynopsis}\n`;
  });
  md += `\n`;

  md += `---\n\n`;

  // 3. v4.0 신규 우선순위 마스터 로드맵
  md += `## 3. [v4.0 신규 우선순위] 메인 스토리 최우선 직진 마스터 로드맵 (Tier 1 ~ Tier 4)\n\n`;
  md += `> **기본 방침:** 외전 확장을 일시 중단하고, 방금 완성한 \`RL-01 흑야의 회고록\`과 직결되는 **메인 스토리 2부 《석양의 런디니움》(\`EP 09\` ~ \`EP 14\`) 및 직결장 《바벨》을 최우선으로 일직선 완주**합니다.\n\n`;

  md += `### 🔥 [Tier 1 / 최우선 집중] 메인 테마 Act II 《석양의 런디니움》 완주 + 필수 직결장 《바벨》 (총 7편)\n`;
  md += `1. **1순위 — \`[EP 09] 스톰워치 (Stormwatch)\`** (\`multi_part\` 또는 \`single\` 2-Tier | 권장 8~9개 핵심 스테이지 노드)\n`;
  md += `   - **핵심 서사:** 메인 2부 서막. 빅토리아 힐록 카운티의 타라족 저항군 '더블린'(리드·에블라나·맨드라고라) 봉기, 백파이프·혼·사일라흐의 분투, 로도스 정예 오퍼레이터 **아웃캐스트의 산화**.\n`;
  md += `2. **2순위 — \`[EP 10] 섀터 포인트 (Shatterpoint)\`** (권장 9~10개 핵심 스테이지 노드)\n`;
  md += `   - **핵심 서사:** 살카즈 군사위원회가 점령한 수도 런디니움 잠입, 시즈(비나)·하이디·페르디난드, 성벽 도시방어포와 만프레드·아스카론·외드레르(\`흑야의 회고록\` 직결)의 암투.\n`;
  md += `3. **3순위 — \`[EP 11] 리턴 투 미스트 (Return to Mist)\`** (권장 9~10개 핵심 스테이지 노드)\n`;
  md += `   - **핵심 서사:** 올드 조지 구역과 알레데일(컴벌랜드 공작가), 빅토리아 최후의 증기기사 패트릭과 뱀파이어 생귀나르(두카렐)의 격돌.\n`;
  md += `4. **4순위 — \`[EP 12] 천둥 속의 고요 (All Quiet Under the Thunder)\`** (권장 10개 핵심 스테이지 노드)\n`;
  md += `   - **핵심 서사:** **W·이네스·외드레르 3인방의 재결합**, 고백자(샤이닝)와 다마즈티 클러스터의 정체성 공방, 대공작 연합군의 런디니움 외곽 포위. *(※ 공식 명칭 '천둥 속의 고요' 준수)*\n`;
  md += `5. **5순위 — \`[EP 13] 흉조의 소용돌이 (The Whirlpool That Is Passion)\`** (권장 10개 핵심 스테이지 노드)\n`;
  md += `   - **핵심 서사:** 생귀나르와의 최종 결전, 로고스의 밴시 주술, 비나와 윈더미어 공작가의 결단, 사자의 왕관과 마왕의 비공정.\n`;
  md += `6. **6순위 — \`[RL-04] 바벨 (Babel)\`** *(사실상의 메인 스토리 \`EP 13.5\` — \`EP 14\` 진입 전 필수 선행)* (권장 10~12개 핵심 스테이지 노드)\n`;
  md += `   - **핵심 서사:** 인게임에서도 \`EP 14\` 직전에 읽도록 설계된 핵심 에피소드. 림 빌리턴 로도스 본함 발굴, 테레시아·켈시·박사의 이상과 오리지늄 계획, 바벨 함락 당일의 진실. (\`EP 14\`의 결말을 이해하기 위해 반드시 \`EP 13\`과 \`EP 14\` 사이에 작업)\n`;
  md += `7. **7순위 — \`[EP 14] 자비의 등대 (Absolution for the Impious)\`** (권장 12~14개 핵심 스테이지 노드)\n`;
  md += `   - **핵심 서사:** **메인 테마 2부 대단원.** 태초의 오리지늄 '암나남', 아미야·박사·켈시·위셔델(W)과 테레시아의 작별, 테레시스의 결단과 런디니움 전쟁의 종결.\n\n`;

  md += `### ⚠️ [Tier 2 / 조건부 착수] 메인 테마 Act III 개막작 (\`EP 15\`) 및 방주(RL) 잔여 코어\n`;
  md += `> **🚨 \`[EP 15] 해리성 결합 (Dissociative Combination)\` 착수 전 필수 확인 및 보류(Hold) 규칙:**\n`;
  md += `> - \`EP 15\`는 최신 챕터이므로, \`EP 14\` 완주 후 착수 시점에 \`python scripts/fetch_raw_story.py main_15\`를 실행하여 **한국 서버(\`ko_KR\`) 공식 인게임 스크립트 텍스트(\`.txt\`)가 데이터 저장소에 정상적으로 올라와 있는지 먼저 확인**해야 합니다.\n`;
  md += `> - **만약 한국 서버(\`ko_KR\`) 스크립트 본문이 아직 리포지토리에 업데이트되지 않았다면, 절대 중국어(\`zh_CN\`) 원문을 임의 번역하여 작성하지 말고 \`EP 15\` 작업을 즉시 보류(Hold)**한 뒤 아래 차순위(\`RL-02\`, \`RL-03\`)로 넘어가십시오.\n\n`;
  md += `1. **8순위 (한섭 스크립트 존재 시) — \`[EP 15] 해리성 결합 (Dissociative Combination)\`** (\`ko_KR\` 원문 미확보 시 즉시 보류)\n`;
  md += `2. **9순위 — \`[RL-03] 비질로: 내 눈에 비치는 대로 (Vigilo)\`** (\`omnibus\` 6개 단편 — 박사의 과거·현재 핵심 비화)\n`;
  md += `3. **10순위 — \`[RL-02] 워크 인 더 더스트 (A Walk in the Dust)\`** (\`omnibus\` 3개 단편 — 켈시의 100년 여정과 우르수스 황제의 칼날)\n`;
  md += `4. **11순위 — \`[TA-01] 불로 비춰주소서 (What the Firelight Casts)\`** (메인 2부 더블린·리드 서사 보완 브릿지)\n\n`;

  md += `### 🌊 [Tier 3 ~ Tier 4 / 장기 여유 과제] 3대 메이저 세계관 연작 및 국가 거점 대서사\n`;
  md += `> 메인 스토리와 방주(RL) 핵심 편을 모두 완주한 이후, 할당량 여유에 맞춰 천천히 순차 진행합니다.\n\n`;
  md += `- **Tier 3 (3대 메이저 연작 완결):**\n`;
  md += `  1. **에기르·심해(AE):** \`AE-02 언더 타이즈\` ➔ \`AE-03 스툴티페라 나비스\` ➔ \`AE-04 삶의 길\`\n`;
  md += `  2. **카시미어(KA):** \`KA-01 마리아 니어\` ➔ \`KA-02 피누스 실베스트리스\` ➔ \`KA-03 니어 라이트\` ➔ \`KA-04 무명의 방랑자\`\n`;
  md += `  3. **염국·쉐이(SU):** \`SU-02 화중인\` ➔ \`SU-03 장진주\` ➔ \`SU-04 등림의\` ➔ \`SU-06 회서리\`\n`;
  md += `- **Tier 4 (주요 국가 거점 & 옴니버스):**\n`;
  md += `  - 시라쿠사(\`SI-01 시라쿠사인\`), 라이타니엔(\`LE-01 월루몽드의 황혼\` ~ \`LE-03 츠빌링슈튀르메의 가을\`), 쉐라그(\`KJ-01 브레이크 디 아이스\` ~ \`KJ-02 은심호 열차\`), 라테라노(\`LA-01 가이딩 어헤드\` ~ \`LA-02 공상의 정원\`), 우르수스(\`UR-01 우르수스의 아이들\`).\n\n`;

  md += `---\n\n`;

  // 4. 서사 라인별 전수 현황 (17개 연작 그룹)
  md += `## 4. 서사 라인별(Story Lines) 전수 현황 (총 89편)\n\n`;

  storyLines.forEach((line) => {
    const inLine = stories.filter((s) => s.storyLineId === line.id);
    if (inLine.length === 0) return;

    const rCount = inLine.filter((s) => s.status === 'restored').length;
    const lCount = inLine.filter((s) => s.status === 'locked').length;
    const oCount = inLine.length - rCount - lCount;

    md += `### ${line.code} : ${line.titleKo} (${line.titleEn})\n`;
    md += `> ${line.description}\n`;
    md += `> **진척:** 전체 ${inLine.length}편 중 상세 수록 ${rCount}편 / 개요 ${oCount}편 / 잠김 ${lCount}편\n\n`;

    inLine.forEach((s) => {
      const state = getStoryAccessState(s);
      const badge = state === 'available' ? '✅ [상세 수록 완료]' : state === 'overview_only' ? '📄 [개요만 수록됨]' : '🔒 [보안 잠김]';
      md += `- **${badge} ${s.code} : ${s.titleKo}** (${s.titleEn})\n`;
      md += `  - 시기: ${s.timeline} | 출시 연차: Year ${s.releaseYear ?? 1} (Vol. ${s.releaseOrder})\n`;
      md += `  - 개요: ${s.officialSynopsis}\n`;
    });
    md += `\n`;
  });

  md += `---\n`;
  md += `*PRTS MASTER STATUS REPORT // OFFICIAL STORY TERMINAL*\n`;

  return md;
}

/**
 * 브라우저에서 문자열 콘텐츠를 지정된 파일명으로 즉시 다운로드 실행
 */
export function downloadFile(filename: string, content: string, mimeType = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

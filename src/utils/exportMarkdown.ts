import type { StoryArchive } from '../types/story';
import type { StoryListItem, StoryLineMeta } from '../data/storyRegistry';
import { getStoryAccessState } from '../data/storyRegistry';

/**
 * 단일 스토리 작전 보고서를 검수용 마크다운(.md) 문서로 변환
 * (Gemini 4 Argon 등 외부 AI 검수 프롬프트 및 원문 서사/대사/명부/전술분석 일체 포함)
 */
export function generateStoryMarkdown(story: StoryArchive): string {
  const isMultiPart = Boolean(story.docFormat === 'multi_part' && story.multiPartArcs && story.multiPartArcs.length > 0);
  const isOmnibus = Boolean(story.isOmnibus && story.omnibusSubEpisodes && story.omnibusSubEpisodes.length > 0);

  let md = `# [PRTS OPERATION REPORT] ${story.code} : ${story.titleKo} (${story.titleEn})\n\n`;

  // 메타데이터 요약 블록
  md += `> **문서 식별:** RI-${story.code.replace(/\\s+/g, '-')}\n`;
  md += `> **기록 일시:** ${story.systemMeta.recordedTime}\n`;
  md += `> **보안 등급:** ${story.systemMeta.securityLevel}\n`;
  md += `> **담당 시스템:** ${story.systemMeta.operatorInCharge}\n`;
  md += `> **작전 분류:** ${story.categoryLabel} (${story.actGroup})\n`;
  md += `> **작전 시기:** ${story.meta.timeline}\n`;
  md += `> **작전 구역:** ${story.meta.location}\n`;
  md += `> **확인 세력:** ${story.meta.factions.join(', ')}\n`;
  md += `> **주요 인물:** ${story.meta.mainCharacters.join(', ')}\n\n`;

  // AI 검수용 안내 프롬프트
  md += `---\n\n`;
  md += `## 📌 [AI 검수 가이드 / GEMINI 4 ARGON REVIEW PROMPT]\n`;
  md += `> 아래 프롬프트를 복사하여 외부 AI(Gemini 4 Argon 등)에 질문하면 고증 및 서사 검수를 즉시 진행할 수 있습니다.\n\n`;
  md += `\`\`\`text\n`;
  md += `[명일방주(Arknights) 스토리 아카이브 검수 요청]\n`;
  md += `이 문서는 명일방주 공식 스토리 [${story.code} : ${story.titleKo}]의 PRTS 작전 보고서입니다.\n`;
  md += `다음 4가지 기준을 중점적으로 검토하고 구체적인 피드백과 개선안을 제시해 주세요:\n`;
  md += `1. 공식 고증 일치성: 테라 대륙 연대기, 작전 구역 지리, 세력 간 역학 관계, 오퍼레이터 행적의 정확성.\n`;
  md += `2. 서사 누락 여부: 원작의 핵심 컷신, 반전, 주요 인물 간 명대사, 떡밥이 생략되거나 왜곡되지 않았는지.\n`;
  md += `3. 문체 및 어조: PRTS 시스템 특유의 건조하고 사실적인 군사 작전 보고서 톤앤매너 유지 여부.\n`;
  md += `4. 전술 사후 평가: 핵심 테마, 로도스 전술 손실/성과, 테라 정세 영향, 미회수 복선의 타당성.\n`;
  md += `\`\`\`\n\n`;

  md += `---\n\n`;

  // 1. 배경 개요
  md += `## 1. 작전 배경 개요 (BACKGROUND & LOGLINE)\n\n`;
  md += `**시스템 인트로:**\n> "${story.content.prtsGreeting}"\n\n`;
  md += `**핵심 로그라인:**\n${story.content.logline}\n\n`;
  md += `**상세 서사 배경:**\n${story.content.background}\n\n`;

  md += `---\n\n`;

  // 2. 단계별 서사 국면 (MultiPart, Omnibus, or Acts)
  if (isMultiPart && story.multiPartArcs) {
    md += `## 2. 멀티파트 챕터별 심층 작전 보고서 (MULTI-PART OPERATIONAL ARCS: ${story.multiPartArcs.length} PARTS)\n\n`;
    story.multiPartArcs.forEach((arc) => {
      md += `### [PART 0${arc.partNumber}] ${arc.code ? `[${arc.code}] ` : ''}${arc.partTitleKo}${arc.partTitleEn ? ` (${arc.partTitleEn})` : ''}\n`;
      if (arc.focalCharacter) {
        md += `- **주요 인물:** ${arc.focalCharacter}\n`;
      }
      if (arc.location) {
        md += `- **작전 구역:** ${arc.location}\n`;
      }
      if (arc.timeline) {
        md += `- **작전 시기:** ${arc.timeline}\n`;
      }
      if (arc.cgCaption) {
        md += `- **현장 기록 영상:** ${arc.cgCaption} (${arc.cgUrl || '없음'})\n`;
      }
      md += `- **파트 핵심 요약:** ${arc.synopsis}\n\n`;

      md += `#### 📖 파트 심층 서사 전문\n${arc.narrativeText || arc.synopsis}\n\n`;

      if (arc.visuals && arc.visuals.length > 0) {
        md += `#### 🖼️ 현장 기록 비주얼 갤러리 (${arc.visuals.length} SCENES)\n`;
        arc.visuals.forEach((vis, vIdx) => {
          md += `- **씬 [${vIdx + 1}]:** ${vis.caption} (${vis.url})${vis.triggerLine ? `\n  - *트리거 맥락:* ${vis.triggerLine}` : ''}\n`;
        });
        md += `\n`;
      }

      if (arc.quotes && arc.quotes.length > 0) {
        md += `#### 💬 통신 감청 및 핵심 발화 기록\n`;
        arc.quotes.forEach((q) => {
          md += `- **${q.speaker}**${q.context ? ` (${q.context})` : ''}: "${q.text}"\n`;
        });
        md += `\n`;
      }

      if (arc.stages && arc.stages.length > 0) {
        md += `#### 🛰️ 파트 수록 세부 스테이지별 작전 기록 (${arc.stages.length} STAGES)\n\n`;
        arc.stages.forEach((st) => {
          md += `##### ▶ [${st.stageCode}] ${st.title} (${st.location})\n`;
          if (st.timeMarker) {
            md += `- **작전 시점:** ${st.timeMarker}\n`;
          }
          if (st.visuals && st.visuals.length > 0) {
            md += `- **스테이지 현장 컷신 자료 (${st.visuals.length}개):**\n`;
            st.visuals.forEach((vis, vIdx) => {
              md += `  * [씬 ${vIdx + 1}] ${vis.caption} (${vis.url})${vis.triggerLine ? ` — *트리거 맥락:* ${vis.triggerLine}` : ''}\n`;
            });
          } else if (st.cgCaption) {
            md += `- **스테이지 시각 자료:** ${st.cgCaption} (${st.cgUrl || '없음'})\n`;
          }
          md += `- **스테이지 요약:** ${st.summary}\n\n`;
          md += `${st.narrativeText}\n\n`;
          if (st.quotes && st.quotes.length > 0) {
            md += `*현장 핵심 발언:*\n`;
            st.quotes.forEach((sq) => {
              md += `  * **${sq.speaker}**${sq.context ? ` (${sq.context})` : ''}: "${sq.text}"\n`;
            });
            md += `\n`;
          }
          if (st.involvedCharacters && st.involvedCharacters.length > 0) {
            md += `- **관련 인물:** ${st.involvedCharacters.join(', ')}\n\n`;
          }
        });
      }

      if (arc.involvedCharacters && arc.involvedCharacters.length > 0) {
        md += `- **파트 관련 인물 코드:** ${arc.involvedCharacters.join(', ')}\n\n`;
      }
      md += `---\n\n`;
    });
  } else if (isOmnibus && story.omnibusSubEpisodes) {
    md += `## 2. 수록 단편 에피소드 전문 (OMNIBUS SUB-EPISODES: ${story.omnibusSubEpisodes.length}편)\n\n`;
    story.omnibusSubEpisodes.forEach((sub) => {
      md += `### [단편 ${sub.order}] ${sub.titleKo}${sub.titleEn ? ` (${sub.titleEn})` : ''}\n`;
      if (sub.mainCharacter) {
        md += `- **주요 인물:** ${sub.mainCharacter}\n`;
      }
      if (sub.location) {
        md += `- **작전 위치:** ${sub.location}\n`;
      }
      if (sub.timeline) {
        md += `- **작전 시기:** ${sub.timeline}\n`;
      }
      if (sub.cgCaption) {
        md += `- **대표 영상:** ${sub.cgCaption} (${sub.cgUrl || '없음'})\n`;
      }
      md += `- **단편 핵심 요약:** ${sub.synopsis}\n\n`;
      if (sub.narrativeText) {
        md += `#### 📖 단편 서사 전문\n${sub.narrativeText}\n\n`;
      }
      if (sub.quotes && sub.quotes.length > 0) {
        md += `#### 💬 통신 감청 및 발화 기록\n`;
        sub.quotes.forEach((q) => {
          md += `- **${q.speaker}**${q.context ? ` (${q.context})` : ''}: "${q.text}"\n`;
        });
        md += `\n`;
      }
      if (sub.involvedCharacters && sub.involvedCharacters.length > 0) {
        md += `- **관련 인물:** ${sub.involvedCharacters.join(', ')}\n\n`;
      }
      md += `---\n\n`;
    });
  } else {
    md += `## 2. 현장 작전 전개 보고 (OPERATIONAL PHASES: ${story.content.acts.length} ACTS)\n\n`;
    story.content.acts.forEach((act) => {
      md += `### [ACT 0${act.step}] ${act.phase} (${act.phaseEn}) : ${act.title}\n`;
      md += `- **작전 위치:** ${act.location}\n`;
      if (act.cgCaption) {
        md += `- **현장 기록 영상:** ${act.cgCaption} (${act.cgUrl || '없음'})\n`;
      }
      md += `- **핵심 요약:** ${act.summary}\n\n`;

      md += `#### 📖 현장 작전 전개 전문\n${act.narrativeText}\n\n`;

      if (act.quotes && act.quotes.length > 0) {
        md += `#### 💬 통신 감청 및 발화 기록\n`;
        act.quotes.forEach((q) => {
          md += `- **${q.speaker}**${q.context ? ` (${q.context})` : ''}: "${q.text}"\n`;
        });
        md += `\n`;
      }

      if (act.stages && act.stages.length > 0) {
        md += `#### 🛰️ 세부 스테이지별 작전 기록 (${act.stages.length} STAGES)\n\n`;
        act.stages.forEach((st) => {
          md += `##### ▶ [${st.stageCode}] ${st.title} (${st.location})\n`;
          if (st.cgCaption) {
            md += `- **스테이지 시각 자료:** ${st.cgCaption} (${st.cgUrl || '없음'})\n`;
          }
          if (st.tacticalLog) {
            md += `- **전술 상황 로그:** ${st.tacticalLog}\n`;
          }
          md += `- **요약:** ${st.summary}\n\n`;
          md += `${st.narrativeText}\n\n`;
          if (st.quotes && st.quotes.length > 0) {
            st.quotes.forEach((sq) => {
              md += `  * **${sq.speaker}**${sq.context ? ` (${sq.context})` : ''}: "${sq.text}"\n`;
            });
            md += `\n`;
          }
          if (st.involvedCharacters && st.involvedCharacters.length > 0) {
            md += `- **관련 인물:** ${st.involvedCharacters.join(', ')}\n\n`;
          }
        });
      }

      if (act.involvedCharacters && act.involvedCharacters.length > 0) {
        md += `- **관련 인물 코드:** ${act.involvedCharacters.join(', ')}\n\n`;
      }
    });
  }

  if (!md.endsWith('---\n\n')) {
    md += `---\n\n`;
  }

  // 3. 작전 관계자 명부
  md += `## 3. 작전 관계자 명부 (PERSONNEL DOSSIER: ${story.characters.length}명)\n\n`;
  story.characters.forEach((char) => {
    md += `### ${char.nameKo} (${char.nameEn})\n`;
    md += `- **소속:** ${char.faction} | **직책:** ${char.role}\n`;
    md += `- **작전 내 행적:** ${char.statusInChapter}\n`;
    if (char.quote) {
      md += `- **대표 발화:** "${char.quote}"\n`;
    }
    md += `- **상세 정보:** ${char.description}\n\n`;
  });

  md += `---\n\n`;

  // 4. 관련 용어 사전
  if (story.glossary && story.glossary.length > 0) {
    md += `## 4. 관련 용어 사전 (CLASSIFIED GLOSSARY: ${story.glossary.length}건)\n\n`;
    story.glossary.forEach((item) => {
      md += `### ${item.term} [${item.typeLabel} // ${item.type.toUpperCase()}]\n`;
      md += `${item.description}\n\n`;
    });
    md += `---\n\n`;
  }

  // 5. 작전 사후 전술 분석 보고서
  md += `## 5. 작전 사후 전술 분석 보고서 (POST-OPERATION EVALUATION)\n\n`;
  md += `### 01. 핵심 테마 및 서사적 메시지\n${story.content.analysis.theme}\n\n`;
  md += `### 02. 로도스 아일랜드 전술 손실 및 성과 평가\n${story.content.analysis.tacticalEvaluation}\n\n`;
  md += `### 03. 테라 대륙 정세 영향\n${story.content.analysis.loreImpact}\n\n`;
  md += `### 04. 미회수 복선 및 잔존 기록 (UNRESOLVED HOOKS)\n`;
  story.content.analysis.unresolvedHooks.forEach((hook, idx) => {
    md += `${idx + 1}. ${hook}\n`;
  });
  md += `\n`;

  md += `---\n`;
  md += `*PRTS ARCHIVE SYSTEM // DOCUMENT RESTORED VERSION 4.2*\n`;

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
  md += `## 📌 [AI 종합 검수 가이드 / GEMINI 4 ARGON MASTER REVIEW PROMPT]\n`;
  md += `> 아래 프롬프트를 복사하여 외부 AI(Gemini 4 Argon 등)에 전달하면 프로젝트 전체 로드맵에 대한 전략적 조언을 얻을 수 있습니다.\n\n`;
  md += `\`\`\`text\n`;
  md += `[명일방주 스토리 아카이브 전체 로드맵 및 고도화 검수]\n`;
  md += `이 문서는 명일방주 공식 스토리 89편의 전체 데이터베이스 현황 및 수록 목록입니다.\n`;
  md += `현재 메인 테마 Act I (EP00~08)과 초기 이벤트 3편(에인션트 포지, 기병과 사냥꾼, 파란 불꽃의 마음) 등 총 12편이 4~5단계 상세 서사로 완전 수록되었습니다.\n`;
  md += `다음 사항에 대해 분석하고 우선순위 가이드를 제안해 주세요:\n`;
  md += `1. 서사 연계성 측면에서 다음으로 가장 우선해서 상세화해야 할 핵심 스토리 5편 추천 및 그 이유.\n`;
  md += `   (예: 바벨, 다크링스 메모아, 론트레일, 니어 라이트, 빅토리아 Act II 등)\n`;
  md += `2. 각 서사 라인(Story Line) 그룹화 및 시간대(테라력) 배치의 역사적 고증 정합성 점검.\n`;
  md += `3. 장편 소설급 분량을 가진 초대형 이벤트(예: 론트레일, 츠빌링슈튀르메)를 효과적으로 요약/정리하기 위한 구조적 권장 사항.\n`;
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

  // 2. 완전 수록된 12편 체크리스트
  md += `## 2. 상세 수록 완료 스토리 체크리스트 (12편)\n\n`;
  restored.forEach((s, idx) => {
    md += `${idx + 1}. **[${s.code}] ${s.titleKo}** (${s.titleEn})\n`;
    md += `   - **서사 라인:** ${s.storyLineTitle}\n`;
    md += `   - **작전 시기:** ${s.timeline}\n`;
    md += `   - **공식 개요:** ${s.officialSynopsis}\n\n`;
  });

  md += `---\n\n`;

  // 3. 서사 라인별 전수 현황 (17개 연작 그룹)
  md += `## 3. 서사 라인별(Story Lines) 전수 현황 (총 89편)\n\n`;

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
  md += `*PRTS MASTER REVISION // EXPORTED FOR EXTERNAL AI & HUMAN AUDIT*\n`;

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

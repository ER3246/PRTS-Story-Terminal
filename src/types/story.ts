export type StoryCategory = 'main' | 'side-story' | 'intermezzi' | 'omnibus' | 'story_line' | 'terra_tales' | 'collaboration';
export type StoryCategoryType = 'main' | 'story_line' | 'terra_tales' | 'collaboration';
export type ArchiveStatus = 'restored' | 'archived' | 'wip' | 'locked';

export type StoryDocFormat = 'single' | 'multi_part' | 'omnibus';

export interface OmnibusSubEpisode {
  id: string;
  order: number;
  titleKo: string;
  titleEn?: string;
  mainCharacter?: string;
  location?: string;
  timeline?: string;
  synopsis: string;
  narrativeText?: string;
  cgUrl?: string;
  cgCaption?: string;
  visuals?: SceneVisual[];
  quotes?: QuoteItem[];
  involvedCharacters?: string[];
}

export interface StorySubPage {
  id: string;
  label: string;
  code?: string;
  isOverview?: boolean;
  focalCharacter?: string;
}

export interface MultiPartArc {
  id: string;
  partNumber: number;
  partTitleKo: string;
  partTitleEn?: string;
  code?: string;
  focalCharacter?: string;
  location?: string;
  timeline?: string;
  synopsis: string;
  narrativeText?: string;
  acts?: ActTimeline[];
  quotes?: QuoteItem[];
  involvedCharacters?: string[];
  cgUrl?: string;
  cgCaption?: string;
  visuals?: SceneVisual[];
  stages?: StageNode[];
}

export type TermType = 'faction' | 'concept' | 'location' | 'arts' | 'technology' | 'incident';

export interface CharacterVisualVariant {
  id: string; // 고유 식별자 (e.g. 'current', 'child', 'awakened')
  label: string; // 탭/버튼 표시명 (e.g. "현재 시점 (런디니움)", "26년 전 비주얼 (과거 회상)")
  timePeriod?: string; // 시점 연대 (e.g. "테라력 1072년 (26년 전)")
  avatarUrl: string; // 1:1 아바타
  illustUrl?: string; // 전신 스탠딩 일러스트
  description?: string; // 외형 설명/맥락
}

export interface CharacterRef {
  id: string;
  nameKo: string;
  nameEn: string;
  faction: string;
  role: string;
  avatarUrl: string;
  illustUrl?: string; // 전신 일러스트 / 스탠딩 CG (상세 팝업용)
  description: string; // 현재 챕터 시점까지 밝혀진 설정 (스포일러 차단)
  quote?: string;
  statusInChapter: string; // e.g. "탈출 작전 지휘", "최후 방어선 사수 중 전사"
  spoilerLevel?: number; // 챕터 진행도
  variants?: CharacterVisualVariant[]; // 시점 및 전개에 따른 다양한 모습 (과거 회상, 각성, 변장 등)
}

export interface GlossaryTerm {
  term: string;
  type: TermType;
  typeLabel: string;
  description: string; // 현재 챕터 시점까지 밝혀진 설정 (스포일러 차단)
  relatedStory?: string;
  spoilerLevel?: number;
}

export interface QuoteItem {
  speaker: string;
  speakerId: string; // CharacterRef.id 와 매핑
  text: string;
  context?: string;
  avatarUrl?: string; // 시점/전개별 오버라이드 아바타 (e.g. 과거 회상 시점의 어린 모습 등)
  variantId?: string; // 연계 시각 변형 ID (e.g. 'child')
}

/**
 * 스테이지 내부 다중 시각 연출 슬롯 (원문 스크립트의 실제 트리거 시점과 매핑)
 */
export interface SceneVisual {
  url: string;
  caption: string;
  type: 'cg' | 'bg';
  triggerLine?: string; // 해당 이미지가 등장하는 원문 대사/장면 컨텍스트
}

/**
 * [v3.0 고도화] 개별 스테이지 또는 세부 챕터 씬 노드 (StageNode)
 * 기존 4막 압축으로 인해 누락되던 스테이지별 상세 서사, 전투 경과, 복선, 다중 CG 전환을 수용
 */
export interface StageNode {
  stageCode: string; // e.g. "0-1", "0-2", "ST-1"
  title: string; // 스테이지 공식 명칭 또는 세부 씬 제목
  location: string;
  timeMarker?: string; // 작전 경과 시간 또는 시점 표기
  cgUrl?: string;
  cgCaption?: string;
  visuals?: SceneVisual[]; // 한 스테이지 내 다중 CG/배경 전환 지원
  summary: string; // 스테이지 1문장 핵심 요약
  narrativeText: string; // 상세 전술·서사 본문 (스테이지 단위 상술)
  tacticalLog?: string; // 지형, 아츠 기믹, 부대 기동 등 전술 상황 기록
  quotes: QuoteItem[];
  involvedCharacters: string[];
}

export interface ActTimeline {
  step: number;
  phase: string; // e.g. "파트 1", "파트 2", "파트 3", "파트 4"
  phaseEn: string; // e.g. "Part 1", "Part 2", "Part 3", "Part 4"
  title: string;
  location: string;
  cgUrl?: string;
  cgCaption?: string;
  visuals?: SceneVisual[]; // 다중 시각 리소스 갤러리 지원
  narrativeText: string;
  summary: string; // 구간 핵심 1~2문장 요약
  quotes: QuoteItem[];
  involvedCharacters: string[]; // CharacterRef id list
  stages?: StageNode[]; // [v3.0] 막(Act) 하위의 세부 스테이지별 심층 서사 배열
}

export interface StoryAuditMeta {
  pipelineVersion: string; // e.g. "v3.0-TwoTier"
  sourceStagesCount?: number;
  draftModel?: string; // e.g. "Standard Model (Pass 2)"
  reviewedBy?: string; // e.g. "Frontier Model (Pass 3 Audit)"
  lastVerifiedAt?: string;
}

export interface StoryArchive {
  id: string;
  code: string; // e.g. "EPISODE 01"
  category: StoryCategory;
  categoryLabel: string;
  actGroup: string; // e.g. "Act I: 각성 (체르노보그 & 용문)"
  titleKo: string;
  titleEn: string;
  order: number;
  bannerImage: string;
  status?: ArchiveStatus;
  docFormat?: StoryDocFormat;
  isOmnibus?: boolean;
  storyLineId?: string;
  storyLineTitle?: string;
  officialSynopsis?: string;
  omnibusSubEpisodes?: OmnibusSubEpisode[];
  multiPartArcs?: MultiPartArc[];
  seriesTabs?: { id: string; label: string; code: string }[];
  subPages?: StorySubPage[];
  auditMeta?: StoryAuditMeta;
  systemMeta: {
    recordedTime: string; // PRTS 기록 타임스탬프
    securityLevel: string; // e.g. "CONFIDENTIAL // LEVEL 3"
    operatorInCharge: string;
  };
  meta: {
    timeline: string; // e.g. "테라력 1096년 12월 23일경"
    location: string; // e.g. "우르수스 제국 이동도시 체르노보그"
    factions: string[];
    mainCharacters: string[];
  };
  content: {
    prtsGreeting: string; // PRTS가 박사에게 건네는 인트로 메시지
    logline: string;
    background: string; // 배경 사전 지식
    acts: ActTimeline[];
    analysis: {
      theme: string;
      tacticalEvaluation: string; // 전술/작전 결과 평가
      loreImpact: string;
      unresolvedHooks: string[];
    };
  };
  characters: CharacterRef[];
  glossary: GlossaryTerm[];
}

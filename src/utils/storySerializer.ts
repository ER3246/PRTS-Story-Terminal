/**
 * PRTS Story Terminal - 데이터 직렬화 엔진 (TypeScript Code Generator)
 * 
 * 편집 전용 툴(Editor Studio)에서 수정한 스토리(StoryArchive), 캐릭터 마스터 DB(CharacterMasterRecord[]),
 * CG 자산 DB(CharacterCgAsset[])를 무결성 검증기(validate_stories.cjs) 및 TypeScript 컴파일러 규격에
 * 100% 부합하는 .ts 소스 코드로 직렬화합니다.
 */

import type { StoryArchive, ActTimeline, StageNode, SceneVisual, QuoteItem, CharacterRef, GlossaryTerm, MultiPartArc, OmnibusSubEpisode } from '../types/story';
import type { CharacterCgAsset, CharacterMasterRecord } from '../types/characterDb';

const STORY_EXPORT_NAMES: Record<string, string> = {
  ep00: 'episode00',
  ep01: 'episode01',
  ep02: 'episode02',
  ep03: 'episode03',
  ep04: 'episode04',
  ep05: 'episode05',
  ep06: 'episode06',
  ep07: 'episode07',
  ep08: 'episode08',
  ep09: 'episode09',
  ep10: 'episode10',
  ep11: 'episode11',
  ep12: 'episode12',
  sid_grani: 'sidGrani',
  sid_ancient_forge: 'sidAncientForge',
  sid_heart_of_surging_flame: 'sidHeartOfSurgingFlame',
  sid_lone_trail: 'sidLoneTrail',
  sid_dorothys_vision: 'sidDorothysVision',
  sid_mansfield_break: 'sidMansfieldBreak',
  sid_darknights_memoir: 'sidDarknightsMemoir',
};

/**
 * 일반 문자열을 단일 인용부호('...') TypeScript 리터럴로 안전하게 변환
 */
function q(val: string | undefined | null): string {
  if (val === undefined || val === null) return "''";
  const escaped = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n');
  return `'${escaped}'`;
}

/**
 * 원문 텍스트를 변형하지 않고 인용부호를 선택하는 리터럴 변환.
 * 내부에 작은따옴표가 있고 큰따옴표가 없으면 "..." 로 감싸 기존 소스 스타일(및 검증기 정규식 동작)과 동일하게 유지.
 */
function qSafeRegex(val: string | undefined | null): string {
  if (val === undefined || val === null) return "''";
  const s = String(val);
  if (s.includes("'") && !s.includes('"')) {
    const escaped = s.replace(/\\/g, '\\\\').replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }
  return q(s);
}

function serializeVisuals(visuals: SceneVisual[] | undefined, indent: string): string {
  if (!visuals) return '';
  if (visuals.length === 0) return `${indent}visuals: [],\n`;
  let out = `${indent}visuals: [\n`;
  for (const v of visuals) {
    out += `${indent}  {\n`;
    out += `${indent}    url: ${q(v.url)},\n`;
    out += `${indent}    caption: ${qSafeRegex(v.caption)},\n`;
    out += `${indent}    type: ${q(v.type || 'cg')}`;
    if (v.triggerLine) {
      out += `,\n${indent}    triggerLine: ${q(v.triggerLine)}`;
    }
    out += `\n${indent}  },\n`;
  }
  out += `${indent}],\n`;
  return out;
}

function serializeQuotes(quotes: QuoteItem[] | undefined, indent: string): string {
  if (!quotes || quotes.length === 0) return `${indent}quotes: [],\n`;
  let out = `${indent}quotes: [\n`;
  for (const qt of quotes) {
    out += `${indent}  {\n`;
    out += `${indent}    speaker: ${q(qt.speaker)},\n`;
    out += `${indent}    speakerId: ${q(qt.speakerId)},\n`;
    out += `${indent}    text: ${q(qt.text)}`;
    if (qt.context) {
      out += `,\n${indent}    context: ${q(qt.context)}`;
    }
    if (qt.avatarUrl) {
      out += `,\n${indent}    avatarUrl: ${q(qt.avatarUrl)}`;
    }
    if (qt.variantId) {
      out += `,\n${indent}    variantId: ${q(qt.variantId)}`;
    }
    out += `\n${indent}  },\n`;
  }
  out += `${indent}],\n`;
  return out;
}

function serializeStageNode(st: StageNode, indent: string): string {
  let out = `${indent}{\n`;
  out += `${indent}  stageCode: ${q(st.stageCode)},\n`;
  out += `${indent}  title: ${q(st.title)},\n`;
  out += `${indent}  location: ${q(st.location)},\n`;
  if (st.timeMarker) {
    out += `${indent}  timeMarker: ${q(st.timeMarker)},\n`;
  }
  if (st.cgUrl !== undefined) {
    out += `${indent}  cgUrl: ${q(st.cgUrl)},\n`;
    out += `${indent}  cgCaption: ${qSafeRegex(st.cgCaption || '')},\n`;
  }
  if (st.visuals) {
    out += serializeVisuals(st.visuals, `${indent}  `);
  }
  out += `${indent}  summary: ${q(st.summary)},\n`;
  out += `${indent}  narrativeText: ${q(st.narrativeText)},\n`;
  if (st.tacticalLog) {
    out += `${indent}  tacticalLog: ${q(st.tacticalLog)},\n`;
  }
  out += serializeQuotes(st.quotes, `${indent}  `);
  out += `${indent}  involvedCharacters: [${(st.involvedCharacters || []).map(c => q(c)).join(', ')}]\n`;
  out += `${indent}}`;
  return out;
}

function serializeActTimeline(act: ActTimeline, indent: string): string {
  let out = `${indent}{\n`;
  out += `${indent}  step: ${act.step},\n`;
  out += `${indent}  phase: ${q(act.phase)},\n`;
  out += `${indent}  phaseEn: ${q(act.phaseEn)},\n`;
  out += `${indent}  title: ${q(act.title)},\n`;
  out += `${indent}  location: ${q(act.location)},\n`;
  if (act.cgUrl !== undefined) {
    out += `${indent}  cgUrl: ${q(act.cgUrl)},\n`;
    out += `${indent}  cgCaption: ${qSafeRegex(act.cgCaption || '')},\n`;
  }
  if (act.visuals) {
    out += serializeVisuals(act.visuals, `${indent}  `);
  }
  out += `${indent}  narrativeText: ${q(act.narrativeText)},\n`;
  out += `${indent}  summary: ${q(act.summary)},\n`;
  out += serializeQuotes(act.quotes, `${indent}  `);
  out += `${indent}  involvedCharacters: [${(act.involvedCharacters || []).map(c => q(c)).join(', ')}]`;
  if (act.stages && act.stages.length > 0) {
    out += `,\n${indent}  stages: [\n`;
    out += act.stages.map(st => serializeStageNode(st, `${indent}    `)).join(',\n');
    out += `\n${indent}  ]\n`;
  } else {
    out += `\n`;
  }
  out += `${indent}}`;
  return out;
}

function serializeMultiPartArc(arc: MultiPartArc, indent: string): string {
  let out = `${indent}{\n`;
  out += `${indent}  id: ${q(arc.id)},\n`;
  out += `${indent}  partNumber: ${arc.partNumber},\n`;
  out += `${indent}  partTitleKo: ${q(arc.partTitleKo)},\n`;
  if (arc.partTitleEn) out += `${indent}  partTitleEn: ${q(arc.partTitleEn)},\n`;
  if (arc.code) out += `${indent}  code: ${q(arc.code)},\n`;
  if (arc.focalCharacter) out += `${indent}  focalCharacter: ${q(arc.focalCharacter)},\n`;
  if (arc.location) out += `${indent}  location: ${q(arc.location)},\n`;
  if (arc.timeline) out += `${indent}  timeline: ${q(arc.timeline)},\n`;
  out += `${indent}  synopsis: ${q(arc.synopsis)},\n`;
  if (arc.narrativeText) out += `${indent}  narrativeText: ${q(arc.narrativeText)},\n`;
  if (arc.cgUrl !== undefined) {
    out += `${indent}  cgUrl: ${q(arc.cgUrl)},\n`;
    out += `${indent}  cgCaption: ${qSafeRegex(arc.cgCaption || '')},\n`;
  }
  if (arc.visuals) {
    out += serializeVisuals(arc.visuals, `${indent}  `);
  }
  if (arc.acts && arc.acts.length > 0) {
    out += `${indent}  acts: [\n`;
    out += arc.acts.map(a => serializeActTimeline(a, `${indent}    `)).join(',\n');
    out += `\n${indent}  ],\n`;
  }
  if (arc.quotes && arc.quotes.length > 0) {
    out += serializeQuotes(arc.quotes, `${indent}  `);
  }
  if (arc.involvedCharacters) {
    out += `${indent}  involvedCharacters: [${arc.involvedCharacters.map(c => q(c)).join(', ')}],\n`;
  }
  if (arc.stages && arc.stages.length > 0) {
    out += `${indent}  stages: [\n`;
    out += arc.stages.map(st => serializeStageNode(st, `${indent}    `)).join(',\n');
    out += `\n${indent}  ]\n`;
  }
  out += `${indent}}`;
  return out;
}

function serializeOmnibusSubEpisode(ep: OmnibusSubEpisode, indent: string): string {
  let out = `${indent}{\n`;
  out += `${indent}  id: ${q(ep.id)},\n`;
  out += `${indent}  order: ${ep.order},\n`;
  out += `${indent}  titleKo: ${q(ep.titleKo)},\n`;
  if (ep.titleEn) out += `${indent}  titleEn: ${q(ep.titleEn)},\n`;
  if (ep.mainCharacter) out += `${indent}  mainCharacter: ${q(ep.mainCharacter)},\n`;
  if (ep.location) out += `${indent}  location: ${q(ep.location)},\n`;
  if (ep.timeline) out += `${indent}  timeline: ${q(ep.timeline)},\n`;
  out += `${indent}  synopsis: ${q(ep.synopsis)},\n`;
  if (ep.narrativeText) out += `${indent}  narrativeText: ${q(ep.narrativeText)},\n`;
  if (ep.cgUrl !== undefined) {
    out += `${indent}  cgUrl: ${q(ep.cgUrl)},\n`;
    out += `${indent}  cgCaption: ${qSafeRegex(ep.cgCaption || '')},\n`;
  }
  if (ep.visuals) {
    out += serializeVisuals(ep.visuals, `${indent}  `);
  }
  if (ep.quotes && ep.quotes.length > 0) {
    out += serializeQuotes(ep.quotes, `${indent}  `);
  }
  if (ep.involvedCharacters) {
    out += `${indent}  involvedCharacters: [${ep.involvedCharacters.map(c => q(c)).join(', ')}]\n`;
  }
  out += `${indent}}`;
  return out;
}

function serializeCharacterRef(c: CharacterRef, indent: string): string {
  let out = `${indent}{\n`;
  out += `${indent}  id: ${qSafeRegex(c.id)},\n`;
  out += `${indent}  nameKo: ${qSafeRegex(c.nameKo)},\n`;
  out += `${indent}  nameEn: ${q(c.nameEn)},\n`;
  out += `${indent}  faction: ${q(c.faction)},\n`;
  out += `${indent}  role: ${qSafeRegex(c.role)},\n`;
  out += `${indent}  avatarUrl: ${qSafeRegex(c.avatarUrl || '')},\n`;
  if (c.illustUrl !== undefined) {
    out += `${indent}  illustUrl: ${q(c.illustUrl)},\n`;
  }
  out += `${indent}  description: ${q(c.description)},\n`;
  if (c.quote !== undefined) {
    out += `${indent}  quote: ${q(c.quote)},\n`;
  }
  out += `${indent}  statusInChapter: ${q(c.statusInChapter)}`;
  if (c.spoilerLevel !== undefined) {
    out += `,\n${indent}  spoilerLevel: ${c.spoilerLevel}`;
  }
  if (c.variants && c.variants.length > 0) {
    out += `,\n${indent}  variants: [\n`;
    for (const v of c.variants) {
      out += `${indent}    {\n`;
      out += `${indent}      id: ${q(v.id)},\n`;
      out += `${indent}      label: ${q(v.label)},\n`;
      if (v.timePeriod) out += `${indent}      timePeriod: ${q(v.timePeriod)},\n`;
      out += `${indent}      avatarUrl: ${q(v.avatarUrl)}`;
      if (v.illustUrl) out += `,\n${indent}      illustUrl: ${q(v.illustUrl)}`;
      if (v.description) out += `,\n${indent}      description: ${q(v.description)}`;
      out += `\n${indent}    },\n`;
    }
    out += `${indent}  ]\n`;
  } else {
    out += `\n`;
  }
  out += `${indent}}`;
  return out;
}

function serializeGlossaryTerm(g: GlossaryTerm, indent: string): string {
  let out = `${indent}{\n`;
  out += `${indent}  term: ${q(g.term)},\n`;
  out += `${indent}  type: ${q(g.type)},\n`;
  out += `${indent}  typeLabel: ${q(g.typeLabel)},\n`;
  out += `${indent}  description: ${q(g.description)}`;
  if (g.relatedStory) out += `,\n${indent}  relatedStory: ${q(g.relatedStory)}`;
  if (g.spoilerLevel !== undefined) out += `,\n${indent}  spoilerLevel: ${g.spoilerLevel}`;
  out += `\n${indent}}`;
  return out;
}

/**
 * StoryArchive 객체를 src/data/stories/{id}.ts 코드로 직렬화
 */
export function serializeStoryArchiveToTs(story: StoryArchive): string {
  const exportName = STORY_EXPORT_NAMES[story.id] || `story_${story.id}`;
  let ts = `import type { StoryArchive } from '../../types/story';\n\n`;
  ts += `export const ${exportName}: StoryArchive = {\n`;
  ts += `  id: ${q(story.id)},\n`;
  ts += `  code: ${q(story.code)},\n`;
  ts += `  category: ${q(story.category)},\n`;
  ts += `  categoryLabel: ${q(story.categoryLabel)},\n`;
  ts += `  actGroup: ${q(story.actGroup)},\n`;
  ts += `  titleKo: ${qSafeRegex(story.titleKo)},\n`;
  ts += `  titleEn: ${q(story.titleEn)},\n`;
  ts += `  order: ${story.order},\n`;
  ts += `  bannerImage: ${q(story.bannerImage)},\n`;
  if (story.status) ts += `  status: ${q(story.status)},\n`;
  if (story.docFormat) ts += `  docFormat: ${q(story.docFormat)},\n`;
  if (story.isOmnibus !== undefined) ts += `  isOmnibus: ${story.isOmnibus},\n`;
  if (story.storyLineId) ts += `  storyLineId: ${q(story.storyLineId)},\n`;
  if (story.storyLineTitle) ts += `  storyLineTitle: ${q(story.storyLineTitle)},\n`;
  if (story.officialSynopsis) ts += `  officialSynopsis: ${q(story.officialSynopsis)},\n`;

  if (story.auditMeta) {
    ts += `  auditMeta: {\n`;
    ts += `    pipelineVersion: ${q(story.auditMeta.pipelineVersion)},\n`;
    if (story.auditMeta.sourceStagesCount !== undefined) {
      ts += `    sourceStagesCount: ${story.auditMeta.sourceStagesCount},\n`;
    }
    if (story.auditMeta.draftModel) ts += `    draftModel: ${q(story.auditMeta.draftModel)},\n`;
    if (story.auditMeta.reviewedBy) ts += `    reviewedBy: ${q(story.auditMeta.reviewedBy)},\n`;
    if (story.auditMeta.lastVerifiedAt) ts += `    lastVerifiedAt: ${q(story.auditMeta.lastVerifiedAt)}\n`;
    ts += `  },\n`;
  }

  ts += `  systemMeta: {\n`;
  ts += `    recordedTime: ${q(story.systemMeta.recordedTime)},\n`;
  ts += `    securityLevel: ${q(story.systemMeta.securityLevel)},\n`;
  ts += `    operatorInCharge: ${q(story.systemMeta.operatorInCharge)}\n`;
  ts += `  },\n`;

  ts += `  meta: {\n`;
  ts += `    timeline: ${q(story.meta.timeline)},\n`;
  ts += `    location: ${q(story.meta.location)},\n`;
  ts += `    factions: [${story.meta.factions.map(f => q(f)).join(', ')}],\n`;
  ts += `    mainCharacters: [${story.meta.mainCharacters.map(m => q(m)).join(', ')}]\n`;
  ts += `  },\n`;

  if (story.seriesTabs && story.seriesTabs.length > 0) {
    ts += `  seriesTabs: [\n`;
    for (const tab of story.seriesTabs) {
      ts += `    {\n`;
      ts += `      id: ${q(tab.id)},\n`;
      ts += `      label: ${q(tab.label)},\n`;
      ts += `      code: ${q(tab.code)}\n`;
      ts += `    },\n`;
    }
    ts += `  ],\n`;
  }

  if (story.subPages && story.subPages.length > 0) {
    ts += `  subPages: [\n`;
    for (const sp of story.subPages) {
      ts += `    {\n`;
      ts += `      id: ${q(sp.id)},\n`;
      ts += `      label: ${q(sp.label)}`;
      if (sp.code) ts += `,\n      code: ${q(sp.code)}`;
      if (sp.isOverview !== undefined) ts += `,\n      isOverview: ${sp.isOverview}`;
      if (sp.focalCharacter) ts += `,\n      focalCharacter: ${q(sp.focalCharacter)}`;
      ts += `\n    },\n`;
    }
    ts += `  ],\n`;
  }

  // CRITICAL: multiPartArcs must appear BEFORE content: for validate_stories.cjs!
  if (story.multiPartArcs && story.multiPartArcs.length > 0) {
    ts += `  multiPartArcs: [\n`;
    ts += story.multiPartArcs.map(arc => serializeMultiPartArc(arc, '    ')).join(',\n');
    ts += `\n  ],\n`;
  }

  if (story.omnibusSubEpisodes && story.omnibusSubEpisodes.length > 0) {
    ts += `  omnibusSubEpisodes: [\n`;
    ts += story.omnibusSubEpisodes.map(ep => serializeOmnibusSubEpisode(ep, '    ')).join(',\n');
    ts += `\n  ],\n`;
  }

  ts += `  content: {\n`;
  ts += `    prtsGreeting: ${q(story.content.prtsGreeting)},\n`;
  ts += `    logline: ${q(story.content.logline)},\n`;
  ts += `    background: ${q(story.content.background)},\n`;
  ts += `    acts: [\n`;
  ts += story.content.acts.map(act => serializeActTimeline(act, '      ')).join(',\n');
  ts += `\n    ],\n`;
  ts += `    analysis: {\n`;
  ts += `      theme: ${q(story.content.analysis.theme)},\n`;
  ts += `      tacticalEvaluation: ${q(story.content.analysis.tacticalEvaluation)},\n`;
  ts += `      loreImpact: ${q(story.content.analysis.loreImpact)},\n`;
  ts += `      unresolvedHooks: [\n`;
  for (const h of story.content.analysis.unresolvedHooks) {
    ts += `        ${q(h)},\n`;
  }
  ts += `      ]\n`;
  ts += `    }\n`;
  ts += `  },\n`;

  ts += `  characters: [\n`;
  ts += story.characters.map(c => serializeCharacterRef(c, '    ')).join(',\n');
  ts += `\n  ],\n`;

  ts += `  glossary: [\n`;
  ts += story.glossary.map(g => serializeGlossaryTerm(g, '    ')).join(',\n');
  ts += `\n  ]\n`;
  ts += `};\n`;

  return ts;
}

/**
 * CharacterCgAsset[] 배열을 src/data/db/characterCgAssets.ts 코드로 직렬화
 */
export function serializeCgAssetsToTs(assets: CharacterCgAsset[]): string {
  let ts = `/**
 * PRTS Story Terminal - 캐릭터 CG 자산 데이터베이스 (Asset Registry)
 * 
 * 시스템 내 물리적으로 존재하는 1:1 아바타 및 전신 일러스트 이미지 파일 목록.
 * 각 자산은 고유 assetId(cg_*)를 가지며, 편집 UI에서 뷰포트 크롭 좌표를 미세 조정할 수 있습니다.
 */

import type { CharacterCgAsset } from '../../types/characterDb';

export const characterCgAssets: CharacterCgAsset[] = [\n`;

  for (const a of assets) {
    ts += `  {\n`;
    ts += `    assetId: ${JSON.stringify(a.assetId)},\n`;
    ts += `    label: ${JSON.stringify(a.label)},\n`;
    ts += `    category: ${JSON.stringify(a.category)},\n`;
    ts += `    avatarFileName: ${JSON.stringify(a.avatarFileName)},\n`;
    ts += `    avatarUrl: ${JSON.stringify(a.avatarUrl)},\n`;
    if (a.illustFileName) {
      ts += `    illustFileName: ${JSON.stringify(a.illustFileName)},\n`;
      ts += `    illustUrl: ${JSON.stringify(a.illustUrl)},\n`;
    }
    ts += `    cropConfig: { x: ${a.cropConfig.x}, y: ${a.cropConfig.y}, zoom: ${a.cropConfig.zoom} },\n`;
    if (a.illustCropConfig) {
      ts += `    illustCropConfig: { x: ${a.illustCropConfig.x}, y: ${a.illustCropConfig.y}, zoom: ${a.illustCropConfig.zoom} },\n`;
    }
    ts += `    isSharedOrBorrowed: ${Boolean(a.isSharedOrBorrowed)},\n`;
    ts += `    notes: ${JSON.stringify(a.notes || '')}\n`;
    ts += `  },\n`;
  }

  ts += `];\n\n`;
  ts += `export const characterCgAssetMap: Record<string, CharacterCgAsset> = characterCgAssets.reduce(\n`;
  ts += `  (acc, asset) => {\n`;
  ts += `    acc[asset.assetId] = asset;\n`;
  ts += `    return acc;\n`;
  ts += `  },\n`;
  ts += `  {} as Record<string, CharacterCgAsset>\n`;
  ts += `);\n`;

  return ts;
}

/**
 * CharacterMasterRecord[] 배열을 src/data/db/characterMasterDb.ts 코드로 직렬화
 */
export function serializeMasterDbToTs(records: CharacterMasterRecord[]): string {
  let ts = `/**
 * PRTS Story Terminal - 통합 캐릭터 마스터 데이터베이스 (Master Character DB)
 * 
 * 20개 전체 스토리에서 참조하는 단일 진실 공급원(SSOT) 캐릭터 엔티티.
 * 동일 캐릭터의 시점/전개별 상태 분기(CharacterState)를 지원하며,
 * 외부 사용자에게 노출되지 않는 백엔드/편집기 전용 통합 DB입니다.
 */

import type { CharacterMasterRecord } from '../../types/characterDb';

export const characterMasterDb: CharacterMasterRecord[] = [\n`;

  for (const r of records) {
    ts += `  {\n`;
    ts += `    charId: ${JSON.stringify(r.charId)},\n`;
    ts += `    nameKo: ${JSON.stringify(r.nameKo)},\n`;
    ts += `    nameEn: ${JSON.stringify(r.nameEn)},\n`;
    ts += `    defaultFaction: ${JSON.stringify(r.defaultFaction)},\n`;
    ts += `    defaultRole: ${JSON.stringify(r.defaultRole)},\n`;
    ts += `    baseBio: ${JSON.stringify(r.baseBio)},\n`;
    ts += `    tier: ${JSON.stringify(r.tier)},\n`;
    ts += `    defaultStateId: ${JSON.stringify(r.defaultStateId)},\n`;
    if (r.aliases && r.aliases.length > 0) {
      ts += `    aliases: ${JSON.stringify(r.aliases)},\n`;
    }
    if (r.notes) {
      ts += `    notes: ${JSON.stringify(r.notes)},\n`;
    }
    ts += `    states: [\n`;
    for (const s of r.states) {
      ts += `      {\n`;
      ts += `        stateId: ${JSON.stringify(s.stateId)},\n`;
      ts += `        label: ${JSON.stringify(s.label)},\n`;
      ts += `        cgAssetId: ${JSON.stringify(s.cgAssetId)},\n`;
      if (s.timePeriod) ts += `        timePeriod: ${JSON.stringify(s.timePeriod)},\n`;
      if (s.overrideNameKo) ts += `        overrideNameKo: ${JSON.stringify(s.overrideNameKo)},\n`;
      if (s.overrideNameEn) ts += `        overrideNameEn: ${JSON.stringify(s.overrideNameEn)},\n`;
      if (s.overrideFaction) ts += `        overrideFaction: ${JSON.stringify(s.overrideFaction)},\n`;
      if (s.overrideRole) ts += `        overrideRole: ${JSON.stringify(s.overrideRole)},\n`;
      ts += `        description: ${JSON.stringify(s.description)},\n`;
      if (s.defaultQuote) ts += `        defaultQuote: ${JSON.stringify(s.defaultQuote)},\n`;
      ts += `        appearances: ${JSON.stringify(s.appearances)},\n`;
      if (s.isSilhouetteOnly) ts += `        isSilhouetteOnly: true,\n`;
      if (s.isSharedCg) ts += `        isSharedCg: true,\n`;
      if (s.notes) ts += `        notes: ${JSON.stringify(s.notes)},\n`;
      ts += `      },\n`;
    }
    ts += `    ]\n`;
    ts += `  },\n`;
  }

  ts += `];\n\n`;
  ts += `export const characterMasterMap: Record<string, CharacterMasterRecord> = characterMasterDb.reduce(\n`;
  ts += `  (acc, char) => {\n`;
  ts += `    acc[char.charId] = char;\n`;
  ts += `    if (char.aliases) {\n`;
  ts += `      for (const alias of char.aliases) {\n`;
  ts += `        acc[alias] = char;\n`;
  ts += `      }\n`;
  ts += `    }\n`;
  ts += `    return acc;\n`;
  ts += `  },\n`;
  ts += `  {} as Record<string, CharacterMasterRecord>\n`;
  ts += `);\n`;

  return ts;
}

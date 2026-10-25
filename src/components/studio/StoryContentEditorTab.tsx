import React, { useState, useMemo } from 'react';
import {
  Save,
  Download,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Users,
  FileText,
  BookOpen,
  MessageSquareQuote,
  CheckCircle2,
  Scissors,
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';
import type {
  StoryArchive,
  CharacterRef,
  SceneVisual,
  QuoteItem,
  StageNode,
  ActTimeline,
} from '../../types/story';
import type {
  CharacterMasterRecord,
  CharacterCgAsset,
} from '../../types/characterDb';
import type { SceneVisualAssetItem } from '../../data/db/sceneVisualAssets';
import { CharacterCgPickerModal, SceneVisualPickerModal } from './CgAssetPickerModal';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { TacticalAvatar } from '../TacticalAvatar';

interface StoryContentEditorTabProps {
  storiesMap: Record<string, StoryArchive>;
  activeStoryId: string;
  onSelectStoryId: (id: string) => void;
  onUpdateStory: (story: StoryArchive) => void;
  onSaveStoryToDisk: (story: StoryArchive) => Promise<void>;
  onDownloadStoryTs: (story: StoryArchive) => void;
  onPreviewInViewer: (storyId: string) => void;
  masterCharacters: CharacterMasterRecord[];
  cgAssets: CharacterCgAsset[];
  sceneVisuals: SceneVisualAssetItem[];
  onJumpToCropper: (assetId: string) => void;
}

type EditorSection =
  | { kind: 'meta' }
  | { kind: 'cast' }
  | { kind: 'arc'; arcIndex: number }
  | { kind: 'arc_stage'; arcIndex: number; stageIndex: number }
  | { kind: 'act'; actIndex: number }
  | { kind: 'glossary' };

export const StoryContentEditorTab: React.FC<StoryContentEditorTabProps> = ({
  storiesMap,
  activeStoryId,
  onSelectStoryId,
  onUpdateStory,
  onSaveStoryToDisk,
  onDownloadStoryTs,
  onPreviewInViewer,
  masterCharacters,
  cgAssets,
  sceneVisuals,
  onJumpToCropper,
}) => {
  const story = storiesMap[activeStoryId] || Object.values(storiesMap)[0];
  const [section, setSection] = useState<EditorSection>({ kind: 'meta' });
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [charCgPickerTargetIndex, setCharCgPickerTargetIndex] = useState<number | null>(null);
  const [isAddFromMasterOpen, setIsAddFromMasterOpen] = useState(false);
  const [masterSearch, setMasterSearch] = useState('');
  const [selectedMasterCharId, setSelectedMasterCharId] = useState<string>(
    masterCharacters[0]?.charId || 'amiya'
  );
  const [selectedMasterStateId, setSelectedMasterStateId] = useState<string>('default');

  // Scene visual picker state
  const [visualPickerCallback, setVisualPickerCallback] = useState<{
    currentUrl: string;
    onSelect: (item: SceneVisualAssetItem) => void;
  } | null>(null);

  const cgMap = useMemo(() => {
    const m: Record<string, CharacterCgAsset> = {};
    for (const a of cgAssets) m[a.assetId] = a;
    return m;
  }, [cgAssets]);

  const masterMap = useMemo(() => {
    const m: Record<string, CharacterMasterRecord> = {};
    for (const r of masterCharacters) {
      m[r.charId] = r;
      if (r.aliases) {
        for (const al of r.aliases) m[al] = r;
      }
    }
    return m;
  }, [masterCharacters]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveBanner(null);
    try {
      await onSaveStoryToDisk(story);
      setSaveBanner(`✅ 저장 완료: src/data/stories/${story.id}.ts 에 변경사항이 반영되었습니다.`);
      setTimeout(() => setSaveBanner(null), 4500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveBanner(`❌ 스토리 저장 실패: ${msg}`);
      window.alert(`[스토리 저장 실패] ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Apply a Master Character + State to construct a CharacterRef
  const buildCharRefFromMaster = (
    master: CharacterMasterRecord,
    stateId: string,
    existing?: Partial<CharacterRef>
  ): CharacterRef => {
    const st = master.states.find((s) => s.stateId === stateId) || master.states[0];
    const cg = st ? cgMap[st.cgAssetId] : undefined;
    return {
      id: master.charId,
      nameKo: st?.overrideNameKo || master.nameKo,
      nameEn: st?.overrideNameEn || master.nameEn,
      faction: st?.overrideFaction || master.defaultFaction,
      role: st?.overrideRole || master.defaultRole,
      avatarUrl: cg ? cg.avatarUrl : '',
      illustUrl: cg?.illustUrl,
      description: st?.description || master.baseBio,
      quote: existing?.quote || st?.defaultQuote || '',
      statusInChapter: existing?.statusInChapter || '작전 수행',
      spoilerLevel: existing?.spoilerLevel ?? 1,
    };
  };

  // Update helpers for story
  const updateCharacterAt = (idx: number, patch: Partial<CharacterRef>) => {
    const nextChars = story.characters.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onUpdateStory({ ...story, characters: nextChars });
  };

  const moveCharacter = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= story.characters.length) return;
    const next = [...story.characters];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    onUpdateStory({ ...story, characters: next });
  };

  const removeCharacterAt = (idx: number) => {
    const c = story.characters[idx];
    if (!window.confirm(`이 스토리에서 '${c.nameKo}' (${c.id}) 등장인물을 제외하시겠습니까?`)) return;
    const next = story.characters.filter((_, i) => i !== idx);
    onUpdateStory({ ...story, characters: next });
  };

  // Update helper for MultiPartArc Stage
  const updateArcStage = (
    arcIdx: number,
    stageIdx: number,
    updater: (prev: StageNode) => StageNode
  ) => {
    if (!story.multiPartArcs) return;
    const nextArcs = story.multiPartArcs.map((arc, aIdx) => {
      if (aIdx !== arcIdx || !arc.stages) return arc;
      return {
        ...arc,
        stages: arc.stages.map((st, sIdx) => (sIdx === stageIdx ? updater(st) : st)),
      };
    });
    onUpdateStory({ ...story, multiPartArcs: nextArcs });
  };

  // Update helper for ActTimeline
  const updateAct = (actIdx: number, updater: (prev: ActTimeline) => ActTimeline) => {
    const nextActs = story.content.acts.map((act, idx) =>
      idx === actIdx ? updater(act) : act
    );
    onUpdateStory({
      ...story,
      content: { ...story.content, acts: nextActs },
    });
  };

  // Render Scene Visuals Editor + Quotes + Narrative for either a StageNode or ActTimeline
  const renderSceneNodeEditor = (
    node: {
      codeLabel: string;
      title: string;
      location: string;
      summary: string;
      narrativeText: string;
      cgUrl?: string;
      cgCaption?: string;
      visuals?: SceneVisual[];
      quotes: QuoteItem[];
      involvedCharacters: string[];
    },
    onChangeField: (patch: {
      title?: string;
      location?: string;
      summary?: string;
      narrativeText?: string;
      cgUrl?: string;
      cgCaption?: string;
      visuals?: SceneVisual[];
      quotes?: QuoteItem[];
      involvedCharacters?: string[];
    }) => void
  ) => {
    const visualsList: SceneVisual[] =
      node.visuals && node.visuals.length > 0
        ? node.visuals
        : node.cgUrl
        ? [{ url: node.cgUrl, caption: node.cgCaption || '', type: 'cg' }]
        : [];

    const syncVisualsToNode = (nextVisuals: SceneVisual[]) => {
      const firstCg = nextVisuals[0];
      onChangeField({
        visuals: nextVisuals,
        cgUrl: firstCg ? firstCg.url : '',
        cgCaption: firstCg ? firstCg.caption : '',
      });
    };

    const charLen = (node.narrativeText || '').length;

    return (
      <div className="space-y-6">
        {/* 1. Stage/Act Title & Location */}
        <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded bg-[#ffe600] text-black font-mono text-xs font-bold">
              {node.codeLabel}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              본문 분량: <strong className={charLen >= 150 ? 'text-[#00d8ff]' : 'text-red-400'}>{charLen}자</strong> (권장 150자 이상)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">장면/스테이지 제목 (title)</label>
              <input
                type="text"
                value={node.title}
                onChange={(e) => onChangeField({ title: e.target.value })}
                className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs font-bold text-white focus:border-[#ffe600] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">배경 장소 (location)</label>
              <input
                type="text"
                value={node.location}
                onChange={(e) => onChangeField({ location: e.target.value })}
                className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">1문장 핵심 요약 (summary)</label>
            <input
              type="text"
              value={node.summary}
              onChange={(e) => onChangeField({ summary: e.target.value })}
              className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-zinc-100 focus:border-[#ffe600] focus:outline-none"
            />
          </div>
        </div>

        {/* 2. Assigned Scene CGs & Backgrounds */}
        <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#00d8ff]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                장면에 배정된 CG 및 배경 이미지 ({visualsList.length}개)
              </h4>
            </div>
            <button
              onClick={() => {
                setVisualPickerCallback({
                  currentUrl: '',
                  onSelect: (item) => {
                    if (!item.url) return;
                    const next: SceneVisual[] = [
                      ...visualsList,
                      {
                        url: item.url,
                        caption: `${node.title} 시각 기록`,
                        type: item.type === 'bg' ? 'bg' : 'cg',
                      },
                    ];
                    syncVisualsToNode(next);
                  },
                });
              }}
              className="h-8 px-3 rounded bg-[#00d8ff] hover:bg-[#00d8ff]/90 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>장면 CG / 배경 이미지 추가</span>
            </button>
          </div>

          {visualsList.length === 0 ? (
            <div className="p-6 rounded border border-dashed border-white/15 text-center text-xs text-zinc-500">
              이 장면에 배정된 CG가 없습니다. 우측 상단 [장면 CG / 배경 이미지 추가] 버튼으로 이미지를 배정하세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visualsList.map((vis, vIdx) => (
                <div
                  key={`${vis.url}_${vIdx}`}
                  className="bg-[#080a10] border border-white/15 rounded-md overflow-hidden flex flex-col"
                >
                  <div className="aspect-video bg-[#04060a] relative overflow-hidden flex items-center justify-center">
                    {vis.url ? (
                      <img
                        src={resolveAssetUrl(vis.url)}
                        alt={vis.caption}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-zinc-500">이미지 없음</span>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-white/15 text-[10px] font-mono text-[#ffe600]">
                      슬롯 #{vIdx + 1} ({vis.type.toUpperCase()})
                    </span>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {vIdx > 0 && (
                        <button
                          onClick={() => {
                            const next = [...visualsList];
                            const [item] = next.splice(vIdx, 1);
                            next.splice(vIdx - 1, 0, item);
                            syncVisualsToNode(next);
                          }}
                          className="w-6 h-6 rounded bg-black/80 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                          title="위로 이동"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                      )}
                      {vIdx < visualsList.length - 1 && (
                        <button
                          onClick={() => {
                            const next = [...visualsList];
                            const [item] = next.splice(vIdx, 1);
                            next.splice(vIdx + 1, 0, item);
                            syncVisualsToNode(next);
                          }}
                          className="w-6 h-6 rounded bg-black/80 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                          title="아래로 이동"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const next = visualsList.filter((_, i) => i !== vIdx);
                          syncVisualsToNode(next);
                        }}
                        className="w-6 h-6 rounded bg-red-600/80 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer"
                        title="CG 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={vis.url}
                        onChange={(e) => {
                          const next = visualsList.map((item, i) =>
                            i === vIdx ? { ...item, url: e.target.value } : item
                          );
                          syncVisualsToNode(next);
                        }}
                        className="flex-1 h-8 px-2.5 rounded bg-[#0d1018] border border-white/15 text-xs font-mono text-zinc-200"
                      />
                      <button
                        onClick={() => {
                          setVisualPickerCallback({
                            currentUrl: vis.url,
                            onSelect: (item) => {
                              if (!item.url) {
                                syncVisualsToNode(visualsList.filter((_, i) => i !== vIdx));
                                return;
                              }
                              const next = visualsList.map((v, i) =>
                                i === vIdx
                                  ? {
                                      ...v,
                                      url: item.url,
                                      type: (item.type === 'bg' ? 'bg' : 'cg') as 'cg' | 'bg',
                                    }
                                  : v
                              );
                              syncVisualsToNode(next);
                            },
                          });
                        }}
                        className="h-8 px-2.5 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black text-xs font-bold shrink-0 cursor-pointer"
                      >
                        파일 변경
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-0.5">
                        CG 캡션 설명 (caption - 필수)
                      </label>
                      <input
                        type="text"
                        value={vis.caption}
                        onChange={(e) => {
                          const next = visualsList.map((item, i) =>
                            i === vIdx ? { ...item, caption: e.target.value } : item
                          );
                          syncVisualsToNode(next);
                        }}
                        placeholder="장면 설명 캡션을 입력하세요"
                        className="w-full h-8 px-2.5 rounded bg-[#0d1018] border border-white/15 text-xs text-white focus:border-[#00d8ff] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Narrative Text Editor */}
        <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#ffe600] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              본문 서사 텍스트 편집 (narrativeText)
            </h4>
            <span className="text-[11px] text-zinc-400">
              단락 구분은 빈 줄(Enter 2번)로 자동 처리됩니다
            </span>
          </div>

          <textarea
            rows={12}
            value={node.narrativeText}
            onChange={(e) => onChangeField({ narrativeText: e.target.value })}
            className="w-full p-4 rounded-md bg-[#07090e] border border-white/15 text-sm text-zinc-100 leading-relaxed font-sans focus:border-[#ffe600] focus:outline-none"
          />
        </div>

        {/* 4. Quotes Editor */}
        <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquareQuote className="w-4 h-4 text-[#ffe600]" />
              인게임 핵심 대사 (quotes: {node.quotes.length}건)
            </h4>
            <button
              onClick={() => {
                const defaultChar = story.characters[0];
                const nextQuotes: QuoteItem[] = [
                  ...node.quotes,
                  {
                    speaker: defaultChar ? defaultChar.nameKo : '아미야',
                    speakerId: defaultChar ? defaultChar.id : 'amiya',
                    text: '대사 내용을 입력하세요.',
                    context: '상황 설명',
                  },
                ];
                onChangeField({ quotes: nextQuotes });
              }}
              className="h-8 px-3 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>대사 추가</span>
            </button>
          </div>

          <div className="space-y-3">
            {node.quotes.map((qt, qIdx) => {
              const matchedChar = story.characters.find((c) => c.id === qt.speakerId);
              const avatarUrl = qt.avatarUrl || matchedChar?.avatarUrl || '';
              return (
                <div
                  key={qIdx}
                  className="bg-[#080a10] border border-white/10 rounded-md p-3.5 flex flex-col sm:flex-row gap-3.5 items-start"
                >
                  <div className="flex items-center gap-2.5 sm:w-52 shrink-0">
                    <TacticalAvatar
                      src={avatarUrl ? resolveAssetUrl(avatarUrl) : ''}
                      alt={qt.speaker}
                      className="w-10 h-10 rounded shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <select
                        value={qt.speakerId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          const found = story.characters.find((c) => c.id === newId);
                          const next = node.quotes.map((item, i) =>
                            i === qIdx
                              ? {
                                  ...item,
                                  speakerId: newId,
                                  speaker: found ? found.nameKo : item.speaker,
                                }
                              : item
                          );
                          onChangeField({ quotes: next });
                        }}
                        className="w-full h-7 px-1.5 rounded bg-[#10141f] border border-white/15 text-xs text-white"
                      >
                        {story.characters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameKo} ({c.id})
                          </option>
                        ))}
                        {!story.characters.some((c) => c.id === qt.speakerId) && (
                          <option value={qt.speakerId}>
                            {qt.speaker} ({qt.speakerId})
                          </option>
                        )}
                      </select>

                      <input
                        type="text"
                        value={qt.speaker}
                        onChange={(e) => {
                          const next = node.quotes.map((item, i) =>
                            i === qIdx ? { ...item, speaker: e.target.value } : item
                          );
                          onChangeField({ quotes: next });
                        }}
                        placeholder="표기 화자명"
                        className="w-full h-7 px-2 rounded bg-[#10141f] border border-white/10 text-[11px] text-zinc-300"
                      />
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <textarea
                      rows={2}
                      value={qt.text}
                      onChange={(e) => {
                        const next = node.quotes.map((item, i) =>
                          i === qIdx ? { ...item, text: e.target.value } : item
                        );
                        onChangeField({ quotes: next });
                      }}
                      placeholder="인게임 원문 대사"
                      className="w-full p-2.5 rounded bg-[#10141f] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={qt.context || ''}
                      onChange={(e) => {
                        const next = node.quotes.map((item, i) =>
                          i === qIdx ? { ...item, context: e.target.value } : item
                        );
                        onChangeField({ quotes: next });
                      }}
                      placeholder="대사 상황/맥락 설명 (선택)"
                      className="w-full h-7 px-2.5 rounded bg-[#10141f] border border-white/10 text-[11px] text-zinc-400"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const next = node.quotes.filter((_, i) => i !== qIdx);
                      onChangeField({ quotes: next });
                    }}
                    className="p-1.5 rounded bg-red-500/15 hover:bg-red-500/30 text-red-300 cursor-pointer shrink-0"
                    title="대사 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Involved Characters Toggle Pills */}
        <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            이 장면에 등장하는 인물 태그 (involvedCharacters: {node.involvedCharacters.length}명)
          </h4>
          <div className="flex flex-wrap gap-2">
            {story.characters.map((c) => {
              const active = node.involvedCharacters.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? node.involvedCharacters.filter((id) => id !== c.id)
                      : [...node.involvedCharacters, c.id];
                    onChangeField({ involvedCharacters: next });
                  }}
                  className={`h-8 px-2.5 rounded flex items-center gap-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#ffe600]/20 border-[#ffe600] text-[#ffe600] font-bold'
                      : 'bg-[#080a10] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{c.nameKo}</span>
                  <span className="text-[10px] font-mono opacity-75">({c.id})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const filteredMasterList = useMemo(() => {
    const q = masterSearch.trim().toLowerCase();
    if (!q) return masterCharacters;
    return masterCharacters.filter(
      (m) =>
        m.charId.toLowerCase().includes(q) ||
        m.nameKo.toLowerCase().includes(q) ||
        m.nameEn.toLowerCase().includes(q) ||
        m.defaultFaction.toLowerCase().includes(q)
    );
  }, [masterCharacters, masterSearch]);

  const activeMasterModalChar = useMemo(
    () => masterCharacters.find((m) => m.charId === selectedMasterCharId) || masterCharacters[0],
    [masterCharacters, selectedMasterCharId]
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden bg-[#0a0c12]">
      {/* Left Navigation Sidebar */}
      <div className="w-full lg:w-80 border-r border-white/10 bg-[#0d1018] flex flex-col min-h-0">
        {/* Story Selector */}
        <div className="p-3.5 border-b border-white/10 space-y-2">
          <label className="block text-[11px] font-bold text-[#ffe600] uppercase tracking-wider">
            편집 대상 스토리 선택 (총 {Object.keys(storiesMap).length}편)
          </label>
          <select
            value={story.id}
            onChange={(e) => {
              onSelectStoryId(e.target.value);
              setSection({ kind: 'meta' });
            }}
            className="w-full h-9 px-2.5 rounded bg-[#07090e] border border-[#ffe600]/50 text-xs font-bold text-white focus:outline-none"
          >
            {Object.values(storiesMap).map((s) => (
              <option key={s.id} value={s.id}>
                [{s.code}] {s.titleKo} ({s.id})
              </option>
            ))}
          </select>
        </div>

        {/* Section Tree */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          <button
            onClick={() => setSection({ kind: 'meta' })}
            className={`w-full px-3 py-2.5 rounded text-left text-xs font-bold flex items-center gap-2 cursor-pointer ${
              section.kind === 'meta'
                ? 'bg-[#ffe600] text-black'
                : 'text-zinc-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>1. 메타데이터 & 스토리 개요</span>
          </button>

          <button
            onClick={() => setSection({ kind: 'cast' })}
            className={`w-full px-3 py-2.5 rounded text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
              section.kind === 'cast'
                ? 'bg-[#ffe600] text-black'
                : 'text-zinc-200 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" />
              <span>2. 등장인물 & 상태값 배정</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[10px]">
              {story.characters.length}명
            </span>
          </button>

          {/* Multi-Part Arcs & Stages */}
          {story.multiPartArcs && story.multiPartArcs.length > 0 && (
            <div className="pt-2 space-y-1">
              <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                3. 파트 및 스테이지 본문/CG ({story.multiPartArcs.length} Parts)
              </div>
              {story.multiPartArcs.map((arc, aIdx) => (
                <div key={arc.id} className="space-y-0.5">
                  <button
                    onClick={() => setSection({ kind: 'arc', arcIndex: aIdx })}
                    className={`w-full px-2.5 py-2 rounded text-left text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      section.kind === 'arc' && section.arcIndex === aIdx
                        ? 'bg-[#00d8ff] text-black'
                        : 'text-[#00d8ff] hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{arc.partTitleKo}</span>
                  </button>

                  {arc.stages?.map((st, sIdx) => {
                    const isSelected =
                      section.kind === 'arc_stage' &&
                      section.arcIndex === aIdx &&
                      section.stageIndex === sIdx;
                    const hasCg =
                      (st.visuals && st.visuals.length > 0) || Boolean(st.cgUrl);
                    return (
                      <button
                        key={`${st.stageCode}_${sIdx}`}
                        onClick={() =>
                          setSection({
                            kind: 'arc_stage',
                            arcIndex: aIdx,
                            stageIndex: sIdx,
                          })
                        }
                        className={`w-full pl-6 pr-2.5 py-1.5 rounded text-left text-xs flex items-center justify-between gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 text-[#ffe600] font-bold border-l-2 border-[#ffe600]'
                            : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{st.title}</span>
                        {hasCg && (
                          <span className="px-1 py-0.5 rounded bg-[#00d8ff]/20 text-[#00d8ff] font-mono text-[9px] shrink-0">
                            CG
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Acts (Single Format or Overview Acts) */}
          <div className="pt-2 space-y-1">
            <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase">
              {story.multiPartArcs ? '요약 국면 (Overview Acts)' : '3. 작전 국면 (Acts) 본문/CG'}
            </div>
            {story.content.acts.map((act, actIdx) => {
              const isSelected = section.kind === 'act' && section.actIndex === actIdx;
              const hasCg =
                (act.visuals && act.visuals.length > 0) || Boolean(act.cgUrl);
              return (
                <button
                  key={act.step}
                  onClick={() => setSection({ kind: 'act', actIndex: actIdx })}
                  className={`w-full px-3 py-2 rounded text-left text-xs flex items-center justify-between gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[#ffe600] text-black font-bold'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">
                    {act.phase}: {act.title}
                  </span>
                  {hasCg && (
                    <span className="px-1.5 py-0.5 rounded bg-[#00d8ff]/20 text-[#00d8ff] font-mono text-[9px] shrink-0">
                      CG
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setSection({ kind: 'glossary' })}
              className={`w-full px-3 py-2.5 rounded text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                section.kind === 'glossary'
                  ? 'bg-[#ffe600] text-black'
                  : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>4. 용어 사전 & 전술 분석</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[10px]">
                {story.glossary.length}개
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Action Bar */}
        <div className="px-6 py-3 bg-[#111520] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#ffe600]/20 text-[#ffe600] font-mono text-xs font-bold">
                {story.code}
              </span>
              <h2 className="text-base font-bold text-white">{story.titleKo}</h2>
              <span className="text-xs text-zinc-400">({story.titleEn})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onPreviewInViewer(story.id)}
              className="h-8 px-3 rounded bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#00d8ff]" />
              <span>실제 뷰어에서 열람</span>
            </button>

            <button
              onClick={() => onDownloadStoryTs(story)}
              className="h-8 px-3 rounded bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{story.id}.ts 다운로드</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-4 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>스토리 파일 저장 (src/data/stories/{story.id}.ts)</span>
            </button>
          </div>
        </div>

        {saveBanner && (
          <div className="mx-6 mt-4 p-3 rounded bg-[#00d8ff]/15 border border-[#00d8ff]/40 text-xs text-[#00d8ff] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        )}

        {/* Section Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* SECTION 1: META & OVERVIEW */}
          {section.kind === 'meta' && (
            <div className="max-w-5xl space-y-6">
              <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#ffe600] uppercase tracking-wider">
                  1. 스토리 상단 메타데이터 설정
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">에피소드 코드 (code)</label>
                    <input
                      type="text"
                      value={story.code}
                      onChange={(e) => onUpdateStory({ ...story, code: e.target.value })}
                      className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">한글 제목 (titleKo)</label>
                    <input
                      type="text"
                      value={story.titleKo}
                      onChange={(e) => onUpdateStory({ ...story, titleKo: e.target.value })}
                      className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">영문 제목 (titleEn)</label>
                    <input
                      type="text"
                      value={story.titleEn}
                      onChange={(e) => onUpdateStory({ ...story, titleEn: e.target.value })}
                      className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">작전 시기 (meta.timeline)</label>
                    <input
                      type="text"
                      value={story.meta.timeline}
                      onChange={(e) =>
                        onUpdateStory({
                          ...story,
                          meta: { ...story.meta, timeline: e.target.value },
                        })
                      }
                      className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">배경 장소 (meta.location)</label>
                    <input
                      type="text"
                      value={story.meta.location}
                      onChange={(e) =>
                        onUpdateStory({
                          ...story,
                          meta: { ...story.meta, location: e.target.value },
                        })
                      }
                      className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    관련 세력 (meta.factions - 쉼표 구분)
                  </label>
                  <input
                    type="text"
                    value={story.meta.factions.join(', ')}
                    onChange={(e) =>
                      onUpdateStory({
                        ...story,
                        meta: {
                          ...story.meta,
                          factions: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    주요 등장인물 표기 (meta.mainCharacters - 쉼표 구분)
                  </label>
                  <input
                    type="text"
                    value={story.meta.mainCharacters.join(', ')}
                    onChange={(e) =>
                      onUpdateStory({
                        ...story,
                        meta: {
                          ...story.meta,
                          mainCharacters: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#00d8ff] uppercase tracking-wider">
                  2. 스토리 핵심 로그라인 및 상세 서사 배경
                </h3>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    PRTS 인트로 메시지 (content.prtsGreeting)
                  </label>
                  <input
                    type="text"
                    value={story.content.prtsGreeting}
                    onChange={(e) =>
                      onUpdateStory({
                        ...story,
                        content: { ...story.content, prtsGreeting: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    핵심 로그라인 (content.logline)
                  </label>
                  <textarea
                    rows={3}
                    value={story.content.logline}
                    onChange={(e) =>
                      onUpdateStory({
                        ...story,
                        content: { ...story.content, logline: e.target.value },
                      })
                    }
                    className="w-full p-3 rounded bg-[#07090e] border border-white/15 text-xs text-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    상세 서사 배경 (content.background)
                  </label>
                  <textarea
                    rows={6}
                    value={story.content.background}
                    onChange={(e) =>
                      onUpdateStory({
                        ...story,
                        content: { ...story.content, background: e.target.value },
                      })
                    }
                    className="w-full p-3 rounded bg-[#07090e] border border-white/15 text-xs text-white leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: STORY CHARACTERS & STATE BINDING */}
          {section.kind === 'cast' && (
            <div className="max-w-5xl space-y-5">
              <div className="bg-[#10141f] border border-white/10 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    스토리 등장인물 목록 및 통합 마스터 DB 상태값 연결 ({story.characters.length}명)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    통합 캐릭터 DB에서 캐릭터와 특정 상태(기본, 유년기, 가드, 부활 후 등)를 지정해 불러오거나 개별 수정할 수 있습니다.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddFromMasterOpen(true)}
                  className="h-9 px-4 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>통합 캐릭터 DB에서 인물·상태 불러오기</span>
                </button>
              </div>

              <div className="space-y-4">
                {story.characters.map((char, cIdx) => {
                  const masterRecord = masterMap[char.id];
                  const resolvedAvatar = char.avatarUrl ? resolveAssetUrl(char.avatarUrl) : '';

                  return (
                    <div
                      key={`${char.id}_${cIdx}`}
                      className="bg-[#10141f] border border-white/15 rounded-lg p-4 flex flex-col md:flex-row gap-4"
                    >
                      {/* Left Avatar & Master State Selector */}
                      <div className="w-full md:w-56 shrink-0 bg-[#080a10] border border-white/10 rounded-md p-3 flex flex-col items-center gap-2.5">
                        <TacticalAvatar
                          src={resolvedAvatar}
                          alt={char.nameKo}
                          className="w-16 h-16 rounded border border-white/20"
                        />

                        <div className="text-center w-full">
                          <div className="text-xs font-bold text-white">{char.nameKo}</div>
                          <div className="text-[10px] font-mono text-zinc-400">ID: {char.id}</div>
                        </div>

                        {masterRecord && (
                          <div className="w-full pt-1 border-t border-white/10">
                            <label className="block text-[10px] text-[#00d8ff] font-bold mb-1">
                              마스터 DB 상태(State) 전환:
                            </label>
                            <select
                              onChange={(e) => {
                                const stateId = e.target.value;
                                if (!stateId) return;
                                const updated = buildCharRefFromMaster(
                                  masterRecord,
                                  stateId,
                                  char
                                );
                                updateCharacterAt(cIdx, updated);
                              }}
                              defaultValue=""
                              className="w-full h-7 px-2 rounded bg-[#10141f] border border-[#00d8ff]/40 text-[11px] text-white"
                            >
                              <option value="" disabled>
                                상태 선택 ({masterRecord.states.length}개)...
                              </option>
                              {masterRecord.states.map((st) => (
                                <option key={st.stateId} value={st.stateId}>
                                  [{st.stateId}] {st.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="w-full flex flex-col gap-1.5 mt-1">
                          <button
                            onClick={() => setCharCgPickerTargetIndex(cIdx)}
                            className="w-full py-1.5 px-2 rounded bg-white/10 hover:bg-[#ffe600] text-zinc-200 hover:text-black text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>CG 파일 직접 변경</span>
                          </button>

                          <button
                            onClick={() => {
                              const baseName = char.avatarUrl
                                .split('/')
                                .pop()
                                ?.replace(/\.[^.]+$/, '');
                              onJumpToCropper(baseName ? `cg_${baseName}` : `cg_${char.id}`);
                            }}
                            className="w-full py-1 px-2 rounded bg-white/5 hover:bg-white/15 text-zinc-300 text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Scissors className="w-3 h-3 text-[#00d8ff]" />
                            <span>크롭 영역 조정</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1 pt-1">
                          <button
                            onClick={() => moveCharacter(cIdx, -1)}
                            disabled={cIdx === 0}
                            className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-zinc-300 cursor-pointer"
                            title="위로 이동"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveCharacter(cIdx, 1)}
                            disabled={cIdx === story.characters.length - 1}
                            className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-zinc-300 cursor-pointer"
                            title="아래로 이동"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeCharacterAt(cIdx)}
                            className="p-1 rounded bg-red-500/15 hover:bg-red-500/30 text-red-300 cursor-pointer"
                            title="인물 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Right Character Fields */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10.5px] text-zinc-400 mb-1">
                              한글 이름 (nameKo)
                            </label>
                            <input
                              type="text"
                              value={char.nameKo}
                              onChange={(e) =>
                                updateCharacterAt(cIdx, { nameKo: e.target.value })
                              }
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs font-bold text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] text-zinc-400 mb-1">
                              영문 이름 (nameEn)
                            </label>
                            <input
                              type="text"
                              value={char.nameEn}
                              onChange={(e) =>
                                updateCharacterAt(cIdx, { nameEn: e.target.value })
                              }
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] text-zinc-400 mb-1">
                              소속 (faction)
                            </label>
                            <input
                              type="text"
                              value={char.faction}
                              onChange={(e) =>
                                updateCharacterAt(cIdx, { faction: e.target.value })
                              }
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10.5px] text-zinc-400 mb-1">
                              직함/역할 (role - 35자 이내)
                            </label>
                            <input
                              type="text"
                              value={char.role}
                              onChange={(e) =>
                                updateCharacterAt(cIdx, { role: e.target.value })
                              }
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] text-zinc-400 mb-1">
                              챕터 내 행적/상태 (statusInChapter)
                            </label>
                            <input
                              type="text"
                              value={char.statusInChapter}
                              onChange={(e) =>
                                updateCharacterAt(cIdx, { statusInChapter: e.target.value })
                              }
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10.5px] text-zinc-400 mb-1">
                            챕터 인물 설명 (description)
                          </label>
                          <textarea
                            rows={2}
                            value={char.description}
                            onChange={(e) =>
                              updateCharacterAt(cIdx, { description: e.target.value })
                            }
                            className="w-full p-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-zinc-100 leading-relaxed"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10.5px] text-zinc-400 mb-1">
                              인물 대표 대사 (quote)
                            </label>
                            <input
                              type="text"
                              value={char.quote || ''}
                              onChange={(e) =>
                                updateCharacterAt(cIdx, { quote: e.target.value })
                              }
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] text-zinc-400 mb-1">
                              아바타 경로 (avatarUrl - 비워두면 실루엣)
                            </label>
                            <input
                              type="text"
                              value={char.avatarUrl}
                              onChange={(e) =>
                                updateCharacterAt(cIdx, { avatarUrl: e.target.value })
                              }
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-zinc-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3A: MULTI-PART ARC OVERVIEW */}
          {section.kind === 'arc' && story.multiPartArcs && story.multiPartArcs[section.arcIndex] && (() => {
            const arc = story.multiPartArcs[section.arcIndex];
            return (
              <div className="max-w-5xl space-y-5">
                <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#00d8ff] text-black font-mono text-xs font-bold">
                      PART {arc.partNumber} ({arc.id})
                    </span>
                    <h3 className="text-sm font-bold text-white">파트 개요 및 요약 편집</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">파트 한글 제목 (partTitleKo)</label>
                      <input
                        type="text"
                        value={arc.partTitleKo}
                        onChange={(e) => {
                          const nextArcs = story.multiPartArcs!.map((a, i) =>
                            i === section.arcIndex ? { ...a, partTitleKo: e.target.value } : a
                          );
                          onUpdateStory({ ...story, multiPartArcs: nextArcs });
                        }}
                        className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">핵심 초점 인물 (focalCharacter)</label>
                      <input
                        type="text"
                        value={arc.focalCharacter || ''}
                        onChange={(e) => {
                          const nextArcs = story.multiPartArcs!.map((a, i) =>
                            i === section.arcIndex ? { ...a, focalCharacter: e.target.value } : a
                          );
                          onUpdateStory({ ...story, multiPartArcs: nextArcs });
                        }}
                        className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">파트 핵심 요약 (synopsis)</label>
                    <textarea
                      rows={3}
                      value={arc.synopsis}
                      onChange={(e) => {
                        const nextArcs = story.multiPartArcs!.map((a, i) =>
                          i === section.arcIndex ? { ...a, synopsis: e.target.value } : a
                        );
                        onUpdateStory({ ...story, multiPartArcs: nextArcs });
                      }}
                      className="w-full p-3 rounded bg-[#07090e] border border-white/15 text-xs text-white leading-relaxed"
                    />
                  </div>

                  {arc.narrativeText !== undefined && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">파트 종합 서사 (narrativeText)</label>
                      <textarea
                        rows={6}
                        value={arc.narrativeText}
                        onChange={(e) => {
                          const nextArcs = story.multiPartArcs!.map((a, i) =>
                            i === section.arcIndex ? { ...a, narrativeText: e.target.value } : a
                          );
                          onUpdateStory({ ...story, multiPartArcs: nextArcs });
                        }}
                        className="w-full p-3 rounded bg-[#07090e] border border-white/15 text-xs text-white leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* SECTION 3B: MULTI-PART STAGE EDITOR */}
          {section.kind === 'arc_stage' &&
            story.multiPartArcs &&
            story.multiPartArcs[section.arcIndex]?.stages?.[section.stageIndex] && (() => {
              const st = story.multiPartArcs[section.arcIndex].stages![section.stageIndex];
              return (
                <div className="max-w-5xl">
                  {renderSceneNodeEditor(
                    {
                      codeLabel: `STAGE ${st.stageCode}`,
                      title: st.title,
                      location: st.location,
                      summary: st.summary,
                      narrativeText: st.narrativeText,
                      cgUrl: st.cgUrl,
                      cgCaption: st.cgCaption,
                      visuals: st.visuals,
                      quotes: st.quotes,
                      involvedCharacters: st.involvedCharacters,
                    },
                    (patch) => {
                      updateArcStage(section.arcIndex, section.stageIndex, (prev) => ({
                        ...prev,
                        ...patch,
                      }));
                    }
                  )}
                </div>
              );
            })()}

          {/* SECTION 3C: ACT TIMELINE EDITOR */}
          {section.kind === 'act' && story.content.acts[section.actIndex] && (() => {
            const act = story.content.acts[section.actIndex];
            return (
              <div className="max-w-5xl">
                {renderSceneNodeEditor(
                  {
                    codeLabel: `${act.phase} (${act.phaseEn})`,
                    title: act.title,
                    location: act.location,
                    summary: act.summary,
                    narrativeText: act.narrativeText,
                    cgUrl: act.cgUrl,
                    cgCaption: act.cgCaption,
                    visuals: act.visuals,
                    quotes: act.quotes,
                    involvedCharacters: act.involvedCharacters,
                  },
                  (patch) => {
                    updateAct(section.actIndex, (prev) => ({
                      ...prev,
                      ...patch,
                    }));
                  }
                )}
              </div>
            );
          })()}

          {/* SECTION 4: GLOSSARY & TACTICAL ANALYSIS */}
          {section.kind === 'glossary' && (
            <div className="max-w-5xl space-y-6">
              <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#ffe600] uppercase tracking-wider">
                  전술 분석 및 세계관 영향 (content.analysis)
                </h3>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">핵심 주제 (theme)</label>
                  <textarea
                    rows={2}
                    value={story.content.analysis.theme}
                    onChange={(e) =>
                      onUpdateStory({
                        ...story,
                        content: {
                          ...story.content,
                          analysis: { ...story.content.analysis, theme: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    전술 평가 (tacticalEvaluation)
                  </label>
                  <textarea
                    rows={3}
                    value={story.content.analysis.tacticalEvaluation}
                    onChange={(e) =>
                      onUpdateStory({
                        ...story,
                        content: {
                          ...story.content,
                          analysis: {
                            ...story.content.analysis,
                            tacticalEvaluation: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full p-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    세계관 파급력 (loreImpact)
                  </label>
                  <textarea
                    rows={3}
                    value={story.content.analysis.loreImpact}
                    onChange={(e) =>
                      onUpdateStory({
                        ...story,
                        content: {
                          ...story.content,
                          analysis: { ...story.content.analysis, loreImpact: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#00d8ff] uppercase tracking-wider">
                    용어 사전 (glossary: {story.glossary.length}개)
                  </h3>
                  <button
                    onClick={() => {
                      onUpdateStory({
                        ...story,
                        glossary: [
                          ...story.glossary,
                          {
                            term: '신규 용어',
                            type: 'concept',
                            typeLabel: '핵심 개념',
                            description: '용어 설명을 입력하세요.',
                          },
                        ],
                      });
                    }}
                    className="h-8 px-3 rounded bg-[#00d8ff] text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> 용어 추가
                  </button>
                </div>

                <div className="space-y-3">
                  {story.glossary.map((g, gIdx) => (
                    <div
                      key={gIdx}
                      className="bg-[#080a10] border border-white/10 rounded-md p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="text"
                          value={g.term}
                          onChange={(e) => {
                            const next = story.glossary.map((item, i) =>
                              i === gIdx ? { ...item, term: e.target.value } : item
                            );
                            onUpdateStory({ ...story, glossary: next });
                          }}
                          className="h-8 px-2.5 rounded bg-[#10141f] border border-white/15 text-xs font-bold text-white"
                        />
                        <input
                          type="text"
                          value={g.typeLabel}
                          onChange={(e) => {
                            const next = story.glossary.map((item, i) =>
                              i === gIdx ? { ...item, typeLabel: e.target.value } : item
                            );
                            onUpdateStory({ ...story, glossary: next });
                          }}
                          className="h-8 px-2.5 rounded bg-[#10141f] border border-white/15 text-xs text-zinc-300"
                        />
                        <button
                          onClick={() => {
                            const next = story.glossary.filter((_, i) => i !== gIdx);
                            onUpdateStory({ ...story, glossary: next });
                          }}
                          className="ml-auto p-1.5 rounded bg-red-500/15 hover:bg-red-500/30 text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={g.description}
                        onChange={(e) => {
                          const next = story.glossary.map((item, i) =>
                            i === gIdx ? { ...item, description: e.target.value } : item
                          );
                          onUpdateStory({ ...story, glossary: next });
                        }}
                        className="w-full p-2.5 rounded bg-[#10141f] border border-white/15 text-xs text-zinc-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Load Character + State from Master DB */}
      {isAddFromMasterOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#11141d] border border-white/15 rounded-lg w-full max-w-3xl max-h-[82vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0b0d14] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ffe600]" />
                <h3 className="text-sm font-bold text-white">
                  통합 캐릭터 마스터 DB에서 인물 및 상태(State) 불러오기
                </h3>
              </div>
              <button
                onClick={() => setIsAddFromMasterOpen(false)}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-zinc-300 cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={masterSearch}
                  onChange={(e) => setMasterSearch(e.target.value)}
                  placeholder="불러올 캐릭터 이름, ID, 소속 검색..."
                  className="w-full h-9 pl-9 pr-3 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Character Selection */}
              <div className="border border-white/10 rounded bg-[#080a10] overflow-y-auto max-h-80 divide-y divide-white/[0.06]">
                {filteredMasterList.map((m) => {
                  const selected = m.charId === activeMasterModalChar?.charId;
                  return (
                    <button
                      key={m.charId}
                      onClick={() => {
                        setSelectedMasterCharId(m.charId);
                        setSelectedMasterStateId(m.defaultStateId);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${
                        selected ? 'bg-[#ffe600]/20 text-[#ffe600] font-bold' : 'text-zinc-200 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-xs truncate">
                        {m.nameKo} ({m.charId})
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {m.states.length}상태
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: State Selection */}
              {activeMasterModalChar && (
                <div className="border border-white/10 rounded bg-[#080a10] p-4 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-white">
                      {activeMasterModalChar.nameKo} ({activeMasterModalChar.nameEn})
                    </div>
                    <div className="text-xs text-zinc-400">
                      불러올 상태(State)를 선택하세요:
                    </div>

                    <div className="space-y-2">
                      {activeMasterModalChar.states.map((st) => {
                        const cg = cgMap[st.cgAssetId];
                        const isStSelected = st.stateId === selectedMasterStateId;
                        return (
                          <div
                            key={st.stateId}
                            onClick={() => setSelectedMasterStateId(st.stateId)}
                            className={`p-2.5 rounded border flex items-center gap-3 cursor-pointer ${
                              isStSelected
                                ? 'bg-[#00d8ff]/15 border-[#00d8ff]'
                                : 'bg-[#10141f] border-white/10 hover:border-white/30'
                            }`}
                          >
                            <TacticalAvatar
                              src={cg?.avatarUrl ? resolveAssetUrl(cg.avatarUrl) : ''}
                              alt={st.label}
                              className="w-10 h-10 rounded shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-white">
                                [{st.stateId}] {st.label}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate">
                                {st.overrideNameKo || activeMasterModalChar.nameKo} ·{' '}
                                {st.overrideRole || activeMasterModalChar.defaultRole}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const newCharRef = buildCharRefFromMaster(
                        activeMasterModalChar,
                        selectedMasterStateId
                      );
                      const existingIdx = story.characters.findIndex(
                        (c) => c.id === newCharRef.id
                      );
                      if (existingIdx >= 0) {
                        updateCharacterAt(existingIdx, newCharRef);
                      } else {
                        onUpdateStory({
                          ...story,
                          characters: [...story.characters, newCharRef],
                        });
                      }
                      setIsAddFromMasterOpen(false);
                    }}
                    className="w-full py-2.5 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black font-bold text-xs cursor-pointer"
                  >
                    이 캐릭터·상태를 스토리에 적용하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Character CG Picker */}
      {charCgPickerTargetIndex !== null && story.characters[charCgPickerTargetIndex] && (
        <CharacterCgPickerModal
          isOpen={true}
          onClose={() => setCharCgPickerTargetIndex(null)}
          assets={cgAssets}
          onSelectAsset={(asset) => {
            updateCharacterAt(charCgPickerTargetIndex, {
              avatarUrl: asset.avatarUrl,
              illustUrl: asset.illustUrl,
            });
          }}
          onJumpToCropper={(asset) => onJumpToCropper(asset.assetId)}
        />
      )}

      {/* Modal 3: Scene Visual Picker */}
      {visualPickerCallback && (
        <SceneVisualPickerModal
          isOpen={true}
          onClose={() => setVisualPickerCallback(null)}
          visualAssets={sceneVisuals}
          currentUrl={visualPickerCallback.currentUrl}
          onSelectVisual={visualPickerCallback.onSelect}
        />
      )}
    </div>
  );
};

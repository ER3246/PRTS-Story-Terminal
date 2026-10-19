import React, { useState, useEffect } from 'react';
import type { StoryArchive, CharacterRef, GlossaryTerm, StorySubPage } from '../types/story';
import type { StoryListItem } from '../data/storyRegistry';
import { globalCharacterMap } from '../data/globalCharacters';
import { getStoryAccessState, storyRegistry } from '../data/storyRegistry';
import { HighlightedText } from './HighlightedText';
import { FilmReelIcon } from './StorySplashModal';
import { CopyrightedImage, CopyrightBadge } from './CopyrightedImage';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getCharacterAvatarUrl } from '../utils/characterAssetHelper';
import { 
  ZoomIn, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  Activity, 
  ArrowUp,
  ChevronsUpDown,
  Lock,
  Info,
  Download,
  FileText,
  BookOpen
} from 'lucide-react';
import { playTabSwitchSound, playClickSound, playOpenSound } from '../utils/soundEffects';
import { generateStoryMarkdown, downloadFile } from '../utils/exportMarkdown';

interface StoryViewerProps {
  story: StoryArchive;
  activeSubPageId?: string | null;
  onChangeSubPage?: (subId: string) => void;
  onSelectCharacter: (char: CharacterRef) => void;
  onSelectGlossary: (term: GlossaryTerm) => void;
  onOpenLightbox: (imageUrl: string, caption?: string, title?: string) => void;
  previousStory?: StoryListItem | null;
  nextStory?: StoryListItem | null;
  onSelectStory?: (id: string, subPageId?: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  story,
  activeSubPageId,
  onChangeSubPage,
  onSelectCharacter,
  onSelectGlossary,
  onOpenLightbox,
  previousStory,
  nextStory,
  onSelectStory,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'dossier' | 'glossary'>('timeline');
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState<boolean>(true);
  
  const accessState = getStoryAccessState(story);
  
  // 국면별 아코디언 상태 관리 (기본: 모든 국면 펼쳐짐)
  const [expandedActs, setExpandedActs] = useState<Record<number, boolean>>({});
  // 멀티파트 스테이지별 아코디언 상태 관리 (기본: 모든 스테이지 펼쳐짐)
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  // 메타데이터 및 다큐먼트 포맷 판별
  const storyMeta = storyRegistry.find((s) => s.id === story.id);
  const docFormat = story.docFormat || storyMeta?.docFormat || (story.isOmnibus ? 'omnibus' : 'single');
  const isOmnibus = docFormat === 'omnibus' || !!story.isOmnibus;
  const isMultiPart = docFormat === 'multi_part';

  // 하위 페이지 목록 구성
  const subPages: StorySubPage[] | undefined = (docFormat === 'multi_part' || docFormat === 'omnibus')
    ? (story.subPages || storyMeta?.subPages || (
        isOmnibus && story.omnibusSubEpisodes && story.omnibusSubEpisodes.length > 0
          ? [
              { id: 'overview', label: '개요 (줄거리)', isOverview: true },
              ...story.omnibusSubEpisodes.map((sub) => ({
                id: sub.id,
                label: sub.titleKo,
                code: `EP.0${sub.order}`,
                focalCharacter: sub.mainCharacter
              }))
            ]
          : undefined
      ))
    : undefined;

  const currentSubPageId = activeSubPageId || 'overview';
  const isOverview = currentSubPageId === 'overview';

  // 옴니버스 현재 에피소드
  const currentEpisode = isOmnibus && !isOverview
    ? story.omnibusSubEpisodes?.find((ep) => ep.id === currentSubPageId) || null
    : null;

  // 멀티파트 현재 아크
  const currentArc = isMultiPart && !isOverview
    ? story.multiPartArcs?.find((arc) => arc.id === currentSubPageId) || null
    : null;

  const currentSubPage = subPages?.find((sp) => sp.id === currentSubPageId);
  const arcTitle = currentArc?.partTitleKo || currentSubPage?.label || '챕터 상세';
  const arcTitleEn = currentArc?.partTitleEn || '';
  const arcCode = currentArc?.code || currentSubPage?.code || 'CHAPTER';

  // 에피소드 전환 시 모든 국면 및 스테이지 기본 펼침 상태로 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const initialActs: Record<number, boolean> = {};
    story.content.acts.forEach((act) => {
      initialActs[act.step] = true;
    });
    setExpandedActs(initialActs);

    if (currentArc?.stages) {
      const initialStages: Record<string, boolean> = {};
      currentArc.stages.forEach((st) => {
        initialStages[st.stageCode] = true;
      });
      setExpandedStages(initialStages);
    }
  }, [story.id, activeSubPageId, currentArc]);

  const isAllActsExpanded = story.content.acts.every((act) => expandedActs[act.step] !== false);
  const isAllStagesExpanded = currentArc?.stages
    ? currentArc.stages.every((st) => expandedStages[st.stageCode] !== false)
    : true;

  const toggleAct = (step: number) => {
    playClickSound();
    setExpandedActs((prev) => ({
      ...prev,
      [step]: prev[step] === false ? true : false
    }));
  };

  const toggleAllActs = () => {
    playClickSound();
    const nextState = !isAllActsExpanded;
    const updated: Record<number, boolean> = {};
    story.content.acts.forEach((act) => {
      updated[act.step] = nextState;
    });
    setExpandedActs(updated);
  };

  const toggleStage = (stageCode: string) => {
    playClickSound();
    setExpandedStages((prev) => ({
      ...prev,
      [stageCode]: prev[stageCode] === false ? true : false
    }));
  };

  const toggleAllStages = () => {
    playClickSound();
    const nextState = !isAllStagesExpanded;
    const updated: Record<string, boolean> = {};
    currentArc?.stages?.forEach((st) => {
      updated[st.stageCode] = nextState;
    });
    setExpandedStages(updated);
  };

  const getCharacterById = (id: string): CharacterRef | undefined => {
    const inStory = story.characters.find((c) => c.id === id);
    if (inStory) return inStory;
    return globalCharacterMap[id];
  };

  const handleNavigateStory = (id: string) => {
    if (onSelectStory) {
      playClickSound();
      onSelectStory(id);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const scrollToTop = () => {
    playClickSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportStoryMarkdown = () => {
    playClickSound();
    const md = generateStoryMarkdown(story);
    const safeCode = story.code.replace(/[\s/\\:]+/g, '_');
    const safeTitle = story.titleKo.replace(/[\s/\\:]+/g, '_');
    downloadFile(`[PRTS]_${safeCode}_${safeTitle}.md`, md);
  };

  // 하위 페이지 네비게이션 바 컴포넌트 (멀티파트 / 옴니버스 통합 글래스 세그먼트 탭 바)
  const renderSubPageBar = () => {
    if (!subPages || subPages.length <= 1) return null;

    return (
      <nav
        aria-label="챕터 네비게이션"
        className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-[4px] overflow-x-auto no-scrollbar scroll-smooth select-none font-sans"
      >
        {subPages.map((sp) => {
          const isSelected = (currentSubPageId === sp.id) || (!activeSubPageId && sp.isOverview);
          const cleanLabel = sp.isOverview ? '전체 개요' : sp.label.replace(/^Part \d+:\s*/, '');
          return (
            <button
              key={sp.id}
              onClick={() => {
                playClickSound();
                onChangeSubPage?.(sp.id);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`relative h-8 px-3.5 rounded-[3px] text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                isSelected
                  ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
              }`}
            >
              {sp.isOverview ? (
                <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-[#ffe600]' : 'text-zinc-500'}`} />
              ) : isOmnibus ? (
                <FilmReelIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#ffe600]' : 'text-zinc-500'}`} />
              ) : sp.code ? (
                <span
                  className={`px-1.5 py-0.2 rounded-[2px] font-mono text-[10px] font-bold ${
                    isSelected
                      ? 'bg-[#ffe600] text-black'
                      : 'bg-white/[0.06] text-[#ffe600]'
                  }`}
                >
                  {sp.code}
                </span>
              ) : null}
              <span>{cleanLabel}</span>
              {isSelected && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-[#ffe600] rounded-full shadow-[0_0_8px_#ffe600]" />
              )}
            </button>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fadeIn font-sans">
      {/* =========================================================================
          VIEW A: OMNIBUS DEDICATED EPISODE READING MODE
          옴니버스 단편 에피소드 열람 모드 (개요가 아닌 개별 에피소드 선택 시)
      ========================================================================= */}
      {isOmnibus && currentEpisode && !isOverview ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumb Top Bar */}
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2 truncate">
              <button
                onClick={() => {
                  playClickSound();
                  onChangeSubPage?.('overview');
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className="text-zinc-300 hover:text-[#ffe600] flex items-center gap-1 cursor-pointer font-semibold transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#ffe600]" />
                <span>{story.titleKo}</span>
              </button>
              <span className="text-zinc-600">/</span>
              <span className="font-mono text-[#ffe600] font-bold">EP.0{currentEpisode.order}</span>
              <span className="text-zinc-100 font-bold truncate">{currentEpisode.titleKo}</span>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onChangeSubPage?.('overview');
              }}
              className="h-7 px-3 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-all cursor-pointer flex-shrink-0"
            >
              전체 개요로 돌아가기
            </button>
          </div>

          {/* Sub-Page Selector Bar */}
          {renderSubPageBar()}

          {/* Episode Header Banner */}
          <div className="relative rounded-[4px] border border-white/[0.09] bg-[#0b0e16] overflow-hidden shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-[#ffe600] text-black font-mono font-black px-2 py-0.5 text-xs rounded-[2px]">
                  EPISODE 0{currentEpisode.order}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-semibold">
                  {story.titleKo} <span className="font-mono text-zinc-500">({story.code})</span>
                </span>
              </div>
              {currentEpisode.mainCharacter && (
                <span className="px-2.5 py-1 rounded-[3px] bg-white/[0.04] border border-white/[0.08] text-zinc-200 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                  <span className="text-zinc-400">중심 인물:</span>
                  <span className="font-bold text-white">{currentEpisode.mainCharacter}</span>
                </span>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {currentEpisode.titleKo}
              </h1>
              {currentEpisode.titleEn && (
                <div className="text-xs sm:text-sm font-mono text-zinc-400">
                  {currentEpisode.titleEn}
                </div>
              )}
            </div>

            {(currentEpisode.location || currentEpisode.timeline) && (
              <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs text-zinc-300">
                {currentEpisode.timeline && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/[0.03] border border-white/[0.07]">
                    <Clock className="w-3.5 h-3.5 text-[#ffe600]" />
                    <span>{currentEpisode.timeline}</span>
                  </span>
                )}
                {currentEpisode.location && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/[0.03] border border-white/[0.07]">
                    <MapPin className="w-3.5 h-3.5 text-[#ffe600]" />
                    <span>{currentEpisode.location}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Official Scene CG (If available) */}
          {currentEpisode.cgUrl && currentEpisode.cgUrl.trim() !== '' && (
            <div className="group relative rounded-[4px] border border-white/[0.09] bg-black overflow-hidden shadow-xl">
              <CopyrightedImage
                src={currentEpisode.cgUrl}
                alt={currentEpisode.titleKo}
                className="w-full h-auto object-cover max-h-[500px] transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#090b10] border-t border-white/[0.07] text-xs">
                {currentEpisode.cgCaption ? (
                  <span className="text-zinc-300 truncate pr-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                    <span>{currentEpisode.cgCaption}</span>
                  </span>
                ) : (
                  <span className="text-zinc-500 font-mono text-[11px]">SCENE VISUAL ARCHIVE</span>
                )}
                <button
                  onClick={() => {
                    playOpenSound();
                    onOpenLightbox(currentEpisode.cgUrl!, currentEpisode.cgCaption, currentEpisode.titleKo);
                  }}
                  className="h-7 px-2.5 rounded-[3px] flex items-center gap-1.5 text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0 ml-auto"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#ffe600]" />
                  <span className="text-[11px] font-medium">원화 확대</span>
                </button>
              </div>
            </div>
          )}

          {/* Episode Narrative Body */}
          <div className="p-6 sm:p-8 rounded-[4px] border border-white/[0.08] bg-[#0b0e15] shadow-xl space-y-6">
            <div className="text-[15px] sm:text-[15.5px] text-zinc-200 leading-[1.85] font-sans space-y-4.5 [word-break:keep-all] break-words">
              {(currentEpisode.narrativeText || currentEpisode.synopsis).split('\n\n').map((para, pIdx) => (
                <p key={pIdx}>
                  <HighlightedText
                    text={para}
                    characters={story.characters}
                    glossary={story.glossary}
                    onSelectCharacter={onSelectCharacter}
                    onSelectGlossary={onSelectGlossary}
                  />
                </p>
              ))}
            </div>

            {/* Comms Quotes */}
            {currentEpisode.quotes && currentEpisode.quotes.length > 0 && (
              <div className="space-y-3 pt-5 border-t border-white/[0.07]">
                {currentEpisode.quotes.map((q, qIdx) => {
                  const speakerChar = getCharacterById(q.speakerId || '');
                  return (
                    <div
                      key={qIdx}
                      className="p-4 rounded-[3px] bg-white/[0.025] border border-white/[0.07] border-l-2 border-l-[#ffe600] flex gap-3.5 items-start"
                    >
                      {speakerChar && (
                        <div
                          onClick={() => onSelectCharacter(speakerChar)}
                          className="w-11 h-11 rounded-[3px] border border-white/15 overflow-hidden bg-black flex-shrink-0 cursor-pointer hover:border-[#ffe600] transition-colors"
                          title={`${speakerChar.nameKo} 프로필 열람`}
                        >
                          <img
                            src={resolveAssetUrl(getCharacterAvatarUrl(speakerChar))}
                            alt={q.speaker}
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            className="w-full h-full object-cover select-none"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span
                            onClick={() => speakerChar && onSelectCharacter(speakerChar)}
                            className={`font-bold text-[#ffe600] ${speakerChar ? 'cursor-pointer hover:underline' : ''}`}
                          >
                            {q.speaker}
                          </span>
                          {q.context && (
                            <span className="text-zinc-500 text-[11px] truncate max-w-[260px]">
                              {q.context}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-100 leading-relaxed font-medium [word-break:keep-all] break-words">
                          "{q.text}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Involved Characters */}
            {currentEpisode.involvedCharacters && currentEpisode.involvedCharacters.length > 0 && (
              <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 mr-1">등장인물</span>
                {currentEpisode.involvedCharacters.map((cId) => {
                  const char = getCharacterById(cId);
                  if (!char) return null;
                  return (
                    <button
                      key={cId}
                      onClick={() => onSelectCharacter(char)}
                      className="h-7 pl-1.5 pr-2.5 rounded-[3px] flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/60 text-xs text-zinc-200 hover:text-white transition-all cursor-pointer"
                    >
                      <img src={resolveAssetUrl(getCharacterAvatarUrl(char))} alt={char.nameKo} draggable={false} onContextMenu={(e) => e.preventDefault()} className="w-4.5 h-4.5 rounded-[2px] object-cover select-none" />
                      <span className="font-medium">{char.nameKo}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Episode Pagination Navigation */}
          {(() => {
            const epList = story.omnibusSubEpisodes || [];
            const epIdx = epList.findIndex((e) => e.id === currentEpisode.id);
            const prevEp = epIdx > 0 ? epList[epIdx - 1] : null;
            const nextEp = epIdx < epList.length - 1 ? epList[epIdx + 1] : null;

            return (
              <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {prevEp ? (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.(prevEp.id);
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/50 text-zinc-300 hover:text-white flex items-center gap-2 cursor-pointer transition-all font-medium"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#ffe600]" />
                    <span>이전 단편: {prevEp.titleKo}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.('overview');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/50 text-zinc-400 hover:text-white flex items-center gap-2 cursor-pointer transition-all font-medium"
                  >
                    <FileText className="w-4 h-4 text-[#ffe600]" />
                    <span>전체 개요로 돌아가기</span>
                  </button>
                )}

                {nextEp ? (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.(nextEp.id);
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/50 text-zinc-300 hover:text-white flex items-center justify-end gap-2 cursor-pointer transition-all ml-auto font-medium"
                  >
                    <span>다음 단편: {nextEp.titleKo}</span>
                    <ChevronRight className="w-4 h-4 text-[#ffe600]" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.('overview');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/50 text-zinc-400 hover:text-white flex items-center justify-end gap-2 cursor-pointer transition-all ml-auto font-medium"
                  >
                    <span>전체 개요 및 사후 분석</span>
                    <ChevronRight className="w-4 h-4 text-[#ffe600]" />
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      ) : isMultiPart && !isOverview ? (
        /* =========================================================================
           VIEW B: MULTI-PART CHAPTER READING MODE
           멀티파트 스토리 개별 챕터 열람 모드
        ========================================================================= */
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumb Top Bar */}
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2 truncate">
              <button
                onClick={() => {
                  playClickSound();
                  onChangeSubPage?.('overview');
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className="text-zinc-300 hover:text-[#ffe600] flex items-center gap-1 cursor-pointer font-semibold transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#ffe600]" />
                <span>{story.titleKo}</span>
              </button>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-100 font-bold truncate">
                {arcTitle}
              </span>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onChangeSubPage?.('overview');
              }}
              className="h-7 px-3 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-all cursor-pointer flex-shrink-0"
            >
              전체 개요로 돌아가기
            </button>
          </div>

          {/* Sub-Page Selector Bar */}
          {renderSubPageBar()}

          {/* MultiPart Chapter Header Banner */}
          <div className="relative rounded-[4px] border border-white/[0.09] bg-[#0b0e16] overflow-hidden shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-[#ffe600] text-black font-mono font-black px-2 py-0.5 text-xs rounded-[2px]">
                  {arcCode}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-semibold">
                  {story.titleKo} <span className="font-mono text-zinc-500">({story.code})</span>
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {arcTitle}
              </h1>
              {arcTitleEn && (
                <div className="text-xs sm:text-sm font-mono text-zinc-400">
                  {arcTitleEn}
                </div>
              )}
            </div>

            {(currentArc?.location || currentArc?.timeline) && (
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-zinc-300">
                {currentArc.timeline && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/[0.03] border border-white/[0.07]">
                    <Clock className="w-3.5 h-3.5 text-[#ffe600]" />
                    <span>{currentArc.timeline}</span>
                  </span>
                )}
                {currentArc.location && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/[0.03] border border-white/[0.07]">
                    <MapPin className="w-3.5 h-3.5 text-[#ffe600]" />
                    <span>{currentArc.location}</span>
                  </span>
                )}
              </div>
            )}

            {/* Part Tactical Briefing Card */}
            {(currentArc?.narrativeText || currentArc?.synopsis) && (
              <div className="pt-4 border-t border-white/[0.07]">
                <p className="text-sm text-zinc-300 font-sans leading-relaxed [word-break:keep-all] pl-3.5 border-l-2 border-[#ffe600]/80">
                  {currentArc.narrativeText || currentArc.synopsis}
                </p>
              </div>
            )}
          </div>

          {/* Quick Stage Jump & Expand/Collapse Control Bar */}
          {currentArc?.stages && currentArc.stages.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-[4px] bg-white/[0.025] border border-white/[0.08] text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-1.5 h-3.5 rounded-[1px] bg-[#ffe600] ml-1" />
                <span className="font-bold text-zinc-200 mr-1.5">
                  스테이지 이동
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {currentArc.stages.map((st) => (
                    <button
                      key={st.stageCode}
                      onClick={() => {
                        playClickSound();
                        setExpandedStages((prev) => ({ ...prev, [st.stageCode]: true }));
                        const el = document.getElementById(`stage-section-${st.stageCode}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="h-7 px-2.5 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.07] hover:border-[#ffe600]/50 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 group"
                    >
                      <span className="font-mono font-bold text-[#ffe600] text-[11px]">
                        {st.stageCode}
                      </span>
                      <span className="truncate max-w-[130px]">{st.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={toggleAllStages}
                title={isAllStagesExpanded ? '모든 스테이지 접기' : '모든 스테이지 펼치기'}
                className="h-7 px-2.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer"
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-[#ffe600]" />
                <span className="hidden sm:inline">{isAllStagesExpanded ? '모두 접기' : '모두 펼치기'}</span>
              </button>
            </div>
          )}

          {/* Multiple Top-level Stage Cards */}
          <div className="space-y-6">
            {currentArc?.stages?.map((st) => {
              const isExpanded = expandedStages[st.stageCode] !== false;

              return (
                <section
                  key={st.stageCode}
                  id={`stage-section-${st.stageCode}`}
                  className="rounded-[4px] border border-white/[0.08] bg-[#0b0e15] overflow-hidden shadow-xl transition-all scroll-mt-20"
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleStage(st.stageCode)}
                    className="px-4 sm:px-6 py-3 sm:py-3.5 bg-white/[0.025] hover:bg-white/[0.045] border-b border-white/[0.07] cursor-pointer select-none group transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 bg-[#ffe600] text-black font-mono font-black text-xs flex-shrink-0 rounded-[2px]">
                          {st.stageCode}
                        </span>
                        {st.timeMarker && (
                          <span className="text-[11px] font-mono text-zinc-400 hidden sm:flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3 text-[#ffe600]" />
                            <span>{st.timeMarker}</span>
                          </span>
                        )}
                      </div>

                      {/* Right: Location & Chevron */}
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        {st.location && (
                          <div
                            className="text-xs font-sans text-zinc-400 flex items-center gap-1 max-w-[150px] sm:max-w-[260px] md:max-w-xs truncate"
                            title={st.location}
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#ffe600] flex-shrink-0" />
                            <span className="truncate">{st.location}</span>
                          </div>
                        )}

                        <div className="w-7 h-7 rounded-[3px] bg-white/[0.04] group-hover:bg-white/[0.1] text-zinc-400 group-hover:text-[#ffe600] flex items-center justify-center transition-colors flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title Row: Full-width allocation preventing cramped word wrapping */}
                    <h2 className="text-base sm:text-[17px] font-bold text-white tracking-tight group-hover:text-[#ffe600] transition-colors [word-break:keep-all] break-keep leading-snug">
                      {st.title}
                    </h2>
                  </div>

                  {/* Collapsed State Summary Preview */}
                  {!isExpanded && st.summary && (
                    <div
                      onClick={() => toggleStage(st.stageCode)}
                      className="px-5 py-3.5 bg-[#090b10] hover:bg-white/[0.02] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs text-zinc-400"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden truncate">
                        <span className="text-[10.5px] font-bold text-[#ffe600] bg-[#ffe600]/15 border border-[#ffe600]/40 px-2 py-0.5 rounded-[2px] flex-shrink-0">
                          요약
                        </span>
                        <span className="truncate text-zinc-300">{st.summary}</span>
                      </div>
                      <span className="text-xs font-medium text-[#ffe600] flex-shrink-0 flex items-center gap-1">
                        <span>펼쳐보기</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}

                  {/* Expanded Stage Body */}
                  {isExpanded && (
                    <div className="p-5 sm:p-7 space-y-6 animate-fadeIn">
                      {/* Lead Summary Callout */}
                      {st.summary && (
                        <div className="px-4 py-3 rounded-[3px] bg-[#ffe600]/[0.04] border border-white/[0.06] border-l-2 border-l-[#ffe600] text-sm text-zinc-200 leading-relaxed [word-break:keep-all]">
                          {st.summary}
                        </div>
                      )}

                      {/* Visual CGs */}
                      {st.visuals && st.visuals.length > 0 ? (
                        <div className="space-y-4">
                          {st.visuals.map((vis, vIdx) => (
                            <div key={vIdx} className="group relative rounded-[4px] border border-white/[0.09] bg-black overflow-hidden shadow-lg">
                              <CopyrightedImage
                                src={vis.url}
                                alt={vis.caption}
                                className="w-full h-auto object-cover max-h-[460px] transition-transform duration-500 group-hover:scale-[1.01]"
                              />
                              <div className="flex items-center justify-between px-4 py-2.5 bg-[#090b10] border-t border-white/[0.07] text-xs">
                                <span className="text-zinc-300 truncate pr-4 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                                  <span>{vis.caption}</span>
                                  {vis.triggerLine && (
                                    <span className="text-zinc-500 text-[11px] hidden sm:inline truncate max-w-[320px]">
                                      · {vis.triggerLine}
                                    </span>
                                  )}
                                </span>
                                <button
                                  onClick={() => {
                                    playOpenSound();
                                    onOpenLightbox(vis.url, vis.caption, st.title);
                                  }}
                                  className="h-7 px-2.5 rounded-[3px] flex items-center gap-1.5 text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0 ml-auto"
                                  title="원문 CG 전체화면 확대"
                                >
                                  <ZoomIn className="w-3.5 h-3.5 text-[#ffe600]" />
                                  <span className="text-[11px] font-medium">원화 확대</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : st.cgUrl && st.cgUrl.trim() !== '' ? (
                        <div className="group relative rounded-[4px] border border-white/[0.09] bg-black overflow-hidden shadow-lg">
                          <CopyrightedImage
                            src={st.cgUrl}
                            alt={st.title}
                            className="w-full h-auto object-cover max-h-[460px] transition-transform duration-500 group-hover:scale-[1.01]"
                          />
                          <div className="flex items-center justify-between px-4 py-2.5 bg-[#090b10] border-t border-white/[0.07] text-xs">
                            <span className="text-zinc-300 truncate pr-4 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                              <span>{st.cgCaption || st.title}</span>
                            </span>
                            <button
                              onClick={() => {
                                playOpenSound();
                                onOpenLightbox(st.cgUrl!, st.cgCaption, st.title);
                              }}
                              className="h-7 px-2.5 rounded-[3px] flex items-center gap-1.5 text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0 ml-auto"
                            >
                              <ZoomIn className="w-3.5 h-3.5 text-[#ffe600]" />
                              <span className="text-[11px] font-medium">원화 확대</span>
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Main Narrative Body */}
                      <div className="text-[15px] sm:text-[15.5px] text-zinc-200 leading-[1.85] [word-break:keep-all] break-words font-sans space-y-4.5">
                        {st.narrativeText.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>
                            <HighlightedText
                              text={paragraph}
                              characters={story.characters}
                              glossary={story.glossary}
                              onSelectCharacter={onSelectCharacter}
                              onSelectGlossary={onSelectGlossary}
                            />
                          </p>
                        ))}
                      </div>

                      {/* Quotes with Interactive Avatars */}
                      {st.quotes && st.quotes.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-white/[0.07]">
                          {st.quotes.map((q, qIdx) => {
                            const speakerChar = getCharacterById(q.speakerId);
                            return (
                              <div
                                key={qIdx}
                                className="p-4 rounded-[3px] bg-white/[0.025] border border-white/[0.07] border-l-2 border-l-[#ffe600] flex gap-3.5 items-start"
                              >
                                {speakerChar ? (
                                  <div
                                    onClick={() => {
                                      playClickSound();
                                      onSelectCharacter(speakerChar);
                                    }}
                                    className="w-11 h-11 rounded-[3px] border border-white/15 overflow-hidden bg-black flex-shrink-0 cursor-pointer hover:border-[#ffe600] transition-colors"
                                    title={`${speakerChar.nameKo} 프로필 열람`}
                                  >
                                    <img
                                      src={resolveAssetUrl(getCharacterAvatarUrl(speakerChar))}
                                      alt={q.speaker}
                                      draggable={false}
                                      onContextMenu={(e) => e.preventDefault()}
                                      className="w-full h-full object-cover select-none"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-11 h-11 rounded-[3px] border border-white/10 bg-white/[0.04] flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
                                    {q.speaker.slice(0, 2)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span
                                      onClick={() => {
                                        if (speakerChar) {
                                          playClickSound();
                                          onSelectCharacter(speakerChar);
                                        }
                                      }}
                                      className={`font-bold text-[#ffe600] ${speakerChar ? 'cursor-pointer hover:underline' : ''}`}
                                    >
                                      {q.speaker}
                                    </span>
                                    {q.context && (
                                      <span className="text-zinc-500 text-[11px] truncate max-w-[220px] sm:max-w-[320px]">
                                        {q.context}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-zinc-100 leading-relaxed font-medium [word-break:keep-all] break-words">
                                    "{q.text}"
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Stage Involved Characters */}
                      {st.involvedCharacters && st.involvedCharacters.length > 0 && (
                        <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-500 mr-1">등장인물</span>
                          {st.involvedCharacters.map((cId) => {
                            const char = getCharacterById(cId);
                            if (!char) return null;
                            return (
                              <button
                                key={cId}
                                onClick={() => {
                                  playClickSound();
                                  onSelectCharacter(char);
                                }}
                                className="h-7 pl-1.5 pr-2.5 rounded-[3px] flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/60 text-xs text-zinc-200 hover:text-white transition-all cursor-pointer"
                                title={`${char.nameKo} (${char.role}) 프로필 열람`}
                              >
                                <img src={resolveAssetUrl(getCharacterAvatarUrl(char))} alt={char.nameKo} draggable={false} onContextMenu={(e) => e.preventDefault()} className="w-4.5 h-4.5 rounded-[2px] object-cover select-none" />
                                <span className="font-medium">{char.nameKo}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Chapter Prev / Next Navigation Footer */}
          {(() => {
            const partList = (subPages || []).filter((p) => !p.isOverview);
            const pIdx = partList.findIndex((p) => p.id === currentSubPageId);
            const prevP = pIdx > 0 ? partList[pIdx - 1] : null;
            const nextP = pIdx < partList.length - 1 ? partList[pIdx + 1] : null;

            return (
              <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {prevP ? (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.(prevP.id);
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/50 text-zinc-300 hover:text-white flex items-center gap-2 cursor-pointer transition-all font-medium"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#ffe600]" />
                    <span>이전 파트: {prevP.label}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.('overview');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/50 text-zinc-400 hover:text-white flex items-center gap-2 cursor-pointer transition-all font-medium"
                  >
                    <FileText className="w-4 h-4 text-[#ffe600]" />
                    <span>전체 개요로 돌아가기</span>
                  </button>
                )}

                {nextP ? (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.(nextP.id);
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/50 text-zinc-300 hover:text-white flex items-center justify-end gap-2 cursor-pointer transition-all ml-auto font-medium"
                  >
                    <span>다음 파트: {nextP.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#ffe600]" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.('overview');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#ffe600]/50 text-zinc-400 hover:text-white flex items-center justify-end gap-2 cursor-pointer transition-all ml-auto font-medium"
                  >
                    <span>전체 개요 및 사후 분석</span>
                    <ChevronRight className="w-4 h-4 text-[#ffe600]" />
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        /* =========================================================================
           VIEW C: STANDARD & OVERVIEW MODE
           (단일 문서 스토리 전체, 또는 옴니버스/멀티파트의 전체 개요 페이지)
        ========================================================================= */
        <div className="space-y-8 animate-fadeIn">
          {/* 1. WIDE CINEMATIC HERO SECTION */}
          <section className="relative w-full rounded-[4px] overflow-hidden border border-white/[0.09] bg-[#0b0e15] shadow-2xl">
            {/* Background Banner Image Container */}
            <div className="relative w-full min-h-[320px] sm:min-h-[380px] lg:h-[420px] bg-[#07090e] overflow-hidden select-none flex flex-col justify-between p-5 sm:p-7 lg:p-9">
              <img
                src={resolveAssetUrl(story.bannerImage)}
                alt={story.titleKo}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-75 pointer-events-none select-none"
              />
              <CopyrightBadge />

              {/* Clean Editorial Vignette Overlays (Preserves artwork clarity while ensuring crisp text contrast) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15] via-[#0b0e15]/70 to-black/30 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e15]/85 via-transparent to-[#0b0e15]/60 pointer-events-none" />

              {/* Top Meta Badge Row */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 px-2.5 bg-[#ffe600] text-black font-mono font-black text-xs tracking-wider rounded-[2px] flex items-center shadow">
                    {story.code}
                  </span>
                  <span className="h-6 px-2.5 rounded-[2px] bg-black/60 backdrop-blur-md border border-white/15 text-zinc-200 font-mono font-semibold text-[11px] flex items-center">
                    {story.titleEn.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {accessState === 'available' ? (
                    <span className="h-7 px-3 rounded-[3px] bg-black/70 backdrop-blur-md border border-[#ffe600]/60 text-[#ffe600] text-xs font-bold flex items-center gap-1.5 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                      <span>전문 복원 완료</span>
                    </span>
                  ) : accessState === 'overview_only' ? (
                    <span className="h-7 px-3 rounded-[3px] bg-black/70 backdrop-blur-md border border-white/20 text-zinc-300 text-xs font-medium flex items-center gap-1.5 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      <span>공식 개요 수록</span>
                    </span>
                  ) : (
                    <span className="h-7 px-3 rounded-[3px] bg-red-950/80 backdrop-blur-md border border-red-800/70 text-red-300 text-xs font-medium flex items-center gap-1.5 shadow">
                      <Lock className="w-3.5 h-3.5 text-red-400" />
                      <span>열람 제한</span>
                    </span>
                  )}

                  {accessState === 'available' && (
                    <button
                      onClick={handleExportStoryMarkdown}
                      title="현재 작전 보고서를 마크다운(.md) 파일로 다운로드합니다"
                      className="h-7 px-3 rounded-[3px] bg-black/70 hover:bg-[#ffe600] backdrop-blur-md text-zinc-200 hover:text-black border border-white/15 hover:border-[#ffe600] text-xs font-semibold transition-all shadow cursor-pointer flex items-center gap-1.5 group"
                    >
                      <Download className="w-3.5 h-3.5 text-[#ffe600] group-hover:text-black" />
                      <span className="hidden sm:inline">문서 내보내기 (.MD)</span>
                      <span className="sm:hidden">.MD</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hero Content: Title & Category */}
              <div className="relative z-10 space-y-2 pt-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#ffe600]">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{story.categoryLabel}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-300 font-medium">{story.actGroup}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight drop-shadow-md [word-break:keep-all] break-words leading-tight">
                  {story.titleKo}
                </h1>
              </div>
            </div>

            {/* Tactical Metadata Strip & Operation Summary */}
            <div className="px-5 sm:px-7 lg:px-9 pb-7 pt-5 space-y-6 bg-[#0b0e15] border-t border-white/[0.07]">
              {/* 3-Column Editorial Metadata Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-white/[0.07] text-xs">
                <div className="space-y-1 sm:border-r border-white/[0.07] sm:pr-4">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#ffe600]" />
                    <span>배경 시점</span>
                  </div>
                  <div className="text-zinc-100 font-medium text-xs sm:text-[13px] [word-break:keep-all] break-words leading-snug pl-5">
                    {story.meta.timeline}
                  </div>
                </div>

                <div className="space-y-1 sm:border-r border-white/[0.07] sm:pr-4">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ffe600]" />
                    <span>배경 지역</span>
                  </div>
                  <div className="text-zinc-100 font-medium text-xs sm:text-[13px] [word-break:keep-all] break-words leading-snug pl-5">
                    {story.meta.location}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#ffe600]" />
                    <span>관련 세력</span>
                  </div>
                  <div className="text-zinc-100 font-medium text-xs sm:text-[13px] [word-break:keep-all] break-words leading-snug pl-5">
                    {story.meta.factions.join(' · ')}
                  </div>
                </div>
              </div>

              {/* Operation Summary Narrative */}
              <div className="space-y-3.5">
                {/* Logline Callout */}
                <div className="text-sm sm:text-[15.5px] text-white font-semibold leading-relaxed break-keep pl-4 border-l-2 border-[#ffe600]">
                  {story.content.logline}
                </div>

                {/* Detailed Narrative Background */}
                <div className="text-zinc-300 text-xs sm:text-sm leading-[1.8] break-keep font-sans">
                  <HighlightedText
                    text={story.content.background}
                    characters={story.characters}
                    glossary={story.glossary}
                    onSelectCharacter={onSelectCharacter}
                    onSelectGlossary={onSelectGlossary}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. UNIFIED GLASS SEGMENTED TAB BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-[4px] bg-white/[0.03] border border-white/[0.08] text-xs font-sans overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  playTabSwitchSound();
                  setActiveTab('timeline');
                }}
                className={`relative h-8 px-4 rounded-[3px] transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'timeline'
                    ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                <span>
                  {isOmnibus
                    ? '수록 단편'
                    : isMultiPart
                    ? '챕터 목록'
                    : '줄거리 요약'}
                </span>
                <span className="px-1.5 py-0.2 rounded-[2px] bg-white/[0.07] font-mono text-[10.5px] text-[#ffe600]">
                  {isOmnibus
                    ? story.omnibusSubEpisodes?.length || 0
                    : isMultiPart
                    ? (subPages?.length ? subPages.length - 1 : 0)
                    : story.content.acts.length}
                </span>
                {activeTab === 'timeline' && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-[#ffe600] rounded-full shadow-[0_0_8px_#ffe600]" />
                )}
              </button>

              <button
                onClick={() => {
                  playTabSwitchSound();
                  setActiveTab('dossier');
                }}
                className={`relative h-8 px-4 rounded-[3px] transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'dossier'
                    ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                <span>등장인물</span>
                <span className="px-1.5 py-0.2 rounded-[2px] bg-white/[0.07] font-mono text-[10.5px] text-zinc-300">
                  {story.characters.length}
                </span>
                {activeTab === 'dossier' && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-[#ffe600] rounded-full shadow-[0_0_8px_#ffe600]" />
                )}
              </button>

              <button
                onClick={() => {
                  playTabSwitchSound();
                  setActiveTab('glossary');
                }}
                className={`relative h-8 px-4 rounded-[3px] transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'glossary'
                    ? 'bg-white/[0.1] text-white font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                <span>용어 사전</span>
                <span className="px-1.5 py-0.2 rounded-[2px] bg-white/[0.07] font-mono text-[10.5px] text-zinc-300">
                  {story.glossary.length}
                </span>
                {activeTab === 'glossary' && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-[#ffe600] rounded-full shadow-[0_0_8px_#ffe600]" />
                )}
              </button>
            </div>
          </div>

          {/* Overview Only Alert Banner */}
          {accessState === 'overview_only' && (
            <div className="p-4 sm:p-5 rounded-[4px] bg-sky-950/20 border border-sky-800/50 flex items-start gap-3.5 shadow-lg">
              <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-sky-300 flex items-center gap-2">
                  <span>아카이브 안내</span>
                  <span className="px-2 py-0.5 rounded-[2px] bg-sky-500/20 text-sky-200 border border-sky-500/40 text-[10px]">
                    공식 개요 수록
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                  본 스토리는 테라 연대기 기본 개요(시놉시스) 데이터가 등록되어 있으며, 세부 스테이지 전개 및 등장인물 심층 기록은 추후 업데이트될 예정입니다.
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              3. TAB CONTENT: TIMELINE / EPISODES / PARTS
          ========================================================================= */}
          {activeTab === 'timeline' && (
            <div className="space-y-8">
              {/* CASE 1: OMNIBUS OVERVIEW (옴니버스 스토리의 에피소드 컬렉션 그리드) */}
              {isOmnibus && story.omnibusSubEpisodes && story.omnibusSubEpisodes.length > 0 ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 font-sans">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#ffe600]">
                      <FilmReelIcon className="w-4 h-4" />
                      <span>수록 단편 에피소드 컬렉션 ({story.omnibusSubEpisodes.length}편)</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">클릭 시 해당 에피소드로 이동</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {story.omnibusSubEpisodes.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-6 rounded-[4px] border border-white/[0.07] hover:border-[#ffe600]/60 bg-[#0d1018]/90 hover:bg-[#111520] transition-all flex flex-col justify-between group space-y-5 shadow-lg"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-sans">
                            <span className="h-5 px-2 inline-flex items-center rounded-[2px] bg-[#ffe600]/15 border border-[#ffe600]/40 text-[#ffe600] font-mono font-bold text-[11px]">
                              EP.0{sub.order}
                            </span>
                            {sub.mainCharacter && (
                              <span className="text-zinc-400 text-[11px]">
                                중심 인물: <span className="text-zinc-200 font-semibold">{sub.mainCharacter}</span>
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-extrabold text-white group-hover:text-[#ffe600] transition-colors font-sans">
                            {sub.titleKo}
                          </h3>
                          <p className="text-[13px] text-zinc-300 leading-relaxed font-sans line-clamp-3 [word-break:keep-all]">
                            {sub.synopsis}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            playClickSound();
                            onChangeSubPage?.(sub.id);
                            window.scrollTo({ top: 0, behavior: 'instant' });
                          }}
                          className="w-full h-9 rounded-[3px] bg-white/[0.04] hover:bg-[#ffe600] text-zinc-200 hover:text-black border border-white/[0.08] hover:border-[#ffe600] text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>에피소드 본문 읽기</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isMultiPart && subPages && subPages.length > 1 ? (
                /* CASE 2: MULTI-PART OVERVIEW (멀티 파트 챕터 컬렉션 그리드) */
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 font-sans">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#ffe600]">
                      <BookOpen className="w-4 h-4" />
                      <span>서사 파트 구성 목록 ({subPages.filter((p) => !p.isOverview).length}개 파트)</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">클릭 시 해당 파트로 이동</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subPages.filter((p) => !p.isOverview).map((sp) => {
                      const arc = story.multiPartArcs?.find((a) => a.id === sp.id);
                      const focalChar = sp.focalCharacter || arc?.focalCharacter;
                      const stagesCount = arc?.stages?.length || 0;
                      const stageCodeRange = arc?.stages && arc.stages.length > 0
                        ? `${arc.stages[0].stageCode} ~ ${arc.stages[arc.stages.length - 1].stageCode}`
                        : '';

                      return (
                        <div
                          key={sp.id}
                          className="p-5 sm:p-6 rounded-[4px] border border-white/[0.07] hover:border-[#ffe600]/60 bg-[#0d1018]/90 hover:bg-[#111520] transition-all flex flex-col justify-between group space-y-4 shadow-lg"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-sans">
                              <span className="h-5 px-2 inline-flex items-center rounded-[2px] bg-[#ffe600]/15 border border-[#ffe600]/40 text-[#ffe600] font-mono font-bold text-[11px]">
                                {sp.code || arc?.code || 'PART'}
                              </span>
                              {stagesCount > 0 && (
                                <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-[2px] border border-white/[0.06]">
                                  {stagesCount}개 스테이지 {stageCodeRange && `(${stageCodeRange})`}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-[#ffe600] transition-colors font-sans">
                                {sp.label}
                              </h3>
                              {focalChar && (
                                <p className="text-xs font-sans text-zinc-400 flex items-center gap-1.5">
                                  <span className="text-zinc-500 font-medium">주요 인물:</span>
                                  <span className="text-zinc-300 font-semibold">{focalChar}</span>
                                </p>
                              )}
                            </div>

                            {arc?.synopsis && (
                              <p className="text-xs text-zinc-400 font-sans line-clamp-2 leading-relaxed [word-break:keep-all]">
                                {arc.synopsis}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              playClickSound();
                              onChangeSubPage?.(sp.id);
                              window.scrollTo({ top: 0, behavior: 'instant' });
                            }}
                            className="w-full h-9 rounded-[3px] bg-white/[0.04] hover:bg-[#ffe600] text-zinc-200 hover:text-black border border-white/[0.08] hover:border-[#ffe600] text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>해당 파트 본문 읽기</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* CASE 3: SINGLE DOCUMENT TIMELINE (단일 서사 스토리 국면 타임라인) */
                <div className="space-y-7">
                  {/* Timeline & Accordion Global Control Bar + Quick Act Jump */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[4px] bg-[#0b0e16]/85 border border-white/[0.07] text-xs font-sans">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-1.5 h-3.5 rounded-[1px] bg-[#ffe600]" />
                      <span className="font-bold text-zinc-200 mr-1 text-[11px]">
                        전개 파트 바로가기
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {story.content.acts.map((act) => (
                          <button
                            key={act.step}
                            onClick={() => {
                              playClickSound();
                              setExpandedActs((prev) => ({ ...prev, [act.step]: true }));
                              const el = document.getElementById(`act-section-${act.step}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="h-7 px-2.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.07] hover:border-[#ffe600]/50 text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="font-mono font-bold text-[#ffe600]">0{act.step}</span>
                            <span>{act.phase}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={toggleAllActs}
                      title={isAllActsExpanded ? '모든 구간 접기' : '모든 구간 펼치기'}
                      className="h-7 px-2.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.07] text-zinc-300 hover:text-white flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5 text-[#ffe600]" />
                      <span className="hidden sm:inline">{isAllActsExpanded ? '모두 접기' : '모두 펼치기'}</span>
                    </button>
                  </div>

                  <div className="space-y-6 relative">
                    {/* Continuous Vertical Timeline Line on Left */}
                    <div className="hidden lg:block absolute left-[23px] top-6 bottom-6 w-[1px] bg-gradient-to-b from-[#ffe600]/60 via-white/[0.12] to-[#ffe600]/30 pointer-events-none" />

                    {story.content.acts.map((act) => {
                      const isExpanded = expandedActs[act.step] !== false;

                      return (
                        <section
                          key={act.step}
                          id={`act-section-${act.step}`}
                          className="relative lg:pl-14 scroll-mt-20"
                        >
                          {/* Tech Node on Timeline (Desktop) */}
                          <div 
                            onClick={() => toggleAct(act.step)}
                            className="hidden lg:flex absolute left-3 top-4 w-6 h-6 rounded-[3px] bg-[#0d1018] border border-[#ffe600]/70 items-center justify-center text-[11px] font-mono font-bold text-[#ffe600] z-10 shadow-md cursor-pointer hover:bg-[#ffe600] hover:text-black transition-colors"
                            title={`PART 0${act.step} 접기/펼치기`}
                          >
                            0{act.step}
                          </div>

                          <div className="rounded-[4px] border border-white/[0.07] bg-[#0d1018]/90 overflow-hidden shadow-xl transition-all">
                            {/* Clickable Accordion Header */}
                            <div
                              onClick={() => toggleAct(act.step)}
                              className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white/[0.02] hover:bg-white/[0.04] border-b border-white/[0.06] cursor-pointer select-none group transition-colors space-y-2"
                            >
                              {/* Top Metadata Row: Step Badge + Phase Tag + Location + Chevron */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="lg:hidden h-5.5 px-2 inline-flex items-center rounded-[2px] bg-[#ffe600] text-black font-mono font-bold text-xs flex-shrink-0">
                                    0{act.step}
                                  </span>
                                  <span className="inline-flex h-5.5 px-2.5 items-center rounded-[2px] bg-white/[0.06] border border-white/[0.1] text-[#ffe600] text-xs font-sans font-bold group-hover:border-[#ffe600]/50 transition-colors flex-shrink-0">
                                    {act.phase}
                                    <span className="text-zinc-500 font-mono text-[10px] ml-1.5 font-normal">
                                      {act.phaseEn.toUpperCase()}
                                    </span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                  {act.location && (
                                    <div
                                      className="text-xs font-sans text-zinc-400 flex items-center gap-1.5 max-w-[150px] sm:max-w-[260px] md:max-w-xs truncate"
                                      title={act.location}
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-[#ffe600] flex-shrink-0" />
                                      <span className="truncate">{act.location}</span>
                                    </div>
                                  )}

                                  <div className="w-7 h-7 rounded-[3px] bg-white/[0.04] border border-white/[0.08] text-zinc-400 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Title Row: Full-width allocation preventing cramped multi-line word breaks */}
                              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight group-hover:text-[#ffe600] transition-colors font-sans [word-break:keep-all] break-keep leading-snug">
                                {act.title}
                              </h2>
                            </div>

                            {/* Collapsed State Quick Preview Bar */}
                            {!isExpanded && act.summary && (
                              <div
                                onClick={() => toggleAct(act.step)}
                                className="px-5 sm:px-7 py-3.5 bg-[#090b10] hover:bg-[#0e121b] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs text-zinc-400 font-sans"
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600] flex-shrink-0" />
                                  <span className="truncate text-zinc-300 font-medium">{act.summary}</span>
                                </div>
                                <span className="text-[11px] font-semibold text-[#ffe600] flex-shrink-0 flex items-center gap-1">
                                  <span>펼쳐보기</span>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            )}

                            {/* Expanded Full Act Content */}
                            {isExpanded && (
                              <div className="p-5 sm:p-8 space-y-6 animate-fadeIn">
                                {/* Act Summary Lead Callout */}
                                {act.summary && (
                                  <div className="px-4 py-3 rounded-[3px] bg-[#ffe600]/[0.04] border border-[#ffe600]/20 border-l-2 border-l-[#ffe600] text-xs sm:text-[13px] font-sans text-zinc-200 flex items-start gap-2.5">
                                    <span className="text-[#ffe600] font-bold flex-shrink-0 mt-0.5">핵심 요약</span>
                                    <span className="text-zinc-600 flex-shrink-0 mt-0.5">|</span>
                                    <span className="leading-relaxed [word-break:keep-all] font-medium">{act.summary}</span>
                                  </div>
                                )}

                                {/* Official CG Image Frame */}
                                {act.cgUrl && act.cgUrl.trim() !== '' && (
                                  <div className="group relative rounded-[3px] border border-white/[0.08] bg-black overflow-hidden shadow-lg">
                                    <CopyrightedImage
                                      src={act.cgUrl}
                                      alt={act.title}
                                      className="w-full h-auto object-cover max-h-[480px] transition-transform duration-300 group-hover:scale-[1.01]"
                                    />
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#090b10] border-t border-white/[0.06] text-xs font-sans">
                                      {act.cgCaption && act.cgCaption.trim() !== '' ? (
                                        <span className="text-zinc-300 truncate pr-4 flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                                          <span>{act.cgCaption}</span>
                                        </span>
                                      ) : (
                                        <span className="text-zinc-500 font-mono text-[11px]">SCENE VISUAL ARCHIVE</span>
                                      )}

                                      <button
                                        onClick={() => {
                                          playOpenSound();
                                          onOpenLightbox(act.cgUrl!, act.cgCaption, act.title);
                                        }}
                                        className="flex items-center gap-1.5 text-zinc-300 hover:text-[#ffe600] transition-colors cursor-pointer flex-shrink-0 ml-auto px-2.5 py-1 rounded-[2px] bg-white/[0.04] border border-white/[0.08] hover:border-[#ffe600]/50"
                                        title="원문 CG 전체화면 확대"
                                      >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-medium">확대</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Narrative Body Text */}
                                <div className="text-[15px] sm:text-[15.5px] text-zinc-200 leading-[1.85] [word-break:keep-all] break-words font-sans space-y-4">
                                  {act.narrativeText.split('\n\n').map((paragraph, pIdx) => (
                                    <p key={pIdx} className="leading-[1.85]">
                                      <HighlightedText
                                        text={paragraph}
                                        characters={story.characters}
                                        glossary={story.glossary}
                                        onSelectCharacter={onSelectCharacter}
                                        onSelectGlossary={onSelectGlossary}
                                      />
                                    </p>
                                  ))}
                                </div>

                                {/* Character Comms Quotes */}
                                {act.quotes.length > 0 && (
                                  <div className="space-y-3 pt-2">
                                    {act.quotes.map((q, qIdx) => {
                                      const speakerChar = getCharacterById(q.speakerId);
                                      return (
                                        <div
                                          key={qIdx}
                                          className="p-4 rounded-[3px] bg-white/[0.025] border border-white/[0.06] border-l-2 border-l-[#ffe600] flex gap-4 items-start"
                                        >
                                          {speakerChar && (
                                            <div
                                              onClick={() => onSelectCharacter(speakerChar)}
                                              className="w-11 h-11 rounded-[3px] border border-white/[0.12] overflow-hidden bg-black flex-shrink-0 cursor-pointer hover:border-[#ffe600] transition-colors shadow"
                                              title={`${speakerChar.nameKo} 프로필 열람`}
                                            >
                                              <img
                                                src={resolveAssetUrl(getCharacterAvatarUrl(speakerChar))}
                                                alt={q.speaker}
                                                draggable={false}
                                                onContextMenu={(e) => e.preventDefault()}
                                                className="w-full h-full object-cover select-none"
                                              />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
                                              <span className="font-bold text-[#ffe600]">{q.speaker}</span>
                                              {q.context && (
                                                <span className="text-zinc-500 text-[11px] truncate max-w-[260px] sm:max-w-[360px]">
                                                  {q.context}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm sm:text-[14.5px] text-zinc-100 leading-relaxed font-sans font-medium [word-break:keep-all] break-words">
                                              "{q.text}"
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Nested StageNode Sub-Timeline */}
                                {act.stages && act.stages.length > 0 && (
                                  <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                                    <div className="text-xs font-sans font-bold text-[#ffe600] flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                                      <span>세부 작전 스테이지 ({act.stages.length})</span>
                                    </div>

                                    <div className="space-y-4 pl-3 border-l border-white/[0.1]">
                                      {act.stages.map((st) => (
                                        <div
                                          key={st.stageCode}
                                          className="p-5 rounded-[3px] bg-white/[0.02] border border-white/[0.06] space-y-4"
                                        >
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                              <span className="h-5 px-2 inline-flex items-center rounded-[2px] bg-[#ffe600] text-black font-mono font-bold text-xs flex-shrink-0">
                                                {st.stageCode}
                                              </span>
                                              <h3 className="text-sm sm:text-base font-bold text-white font-sans [word-break:keep-all] break-keep leading-snug">
                                                {st.title}
                                              </h3>
                                            </div>
                                            {st.location && (
                                              <span className="text-xs font-sans text-zinc-400 flex items-center gap-1 flex-shrink-0 max-w-[200px] sm:max-w-xs truncate" title={st.location}>
                                                <MapPin className="w-3.5 h-3.5 text-[#ffe600] flex-shrink-0" />
                                                <span className="truncate">{st.location}</span>
                                              </span>
                                            )}
                                          </div>

                                          {/* Stage Summary Callout */}
                                           {st.summary && (
                                             <div className="px-4 py-2.5 rounded-[3px] bg-[#ffe600]/[0.04] border border-white/[0.06] border-l-2 border-l-[#ffe600] text-xs text-zinc-300 leading-relaxed [word-break:keep-all]">
                                               {st.summary}
                                             </div>
                                           )}

                                           {/* Visuals Gallery / Stage CG */}
                                           {st.visuals && st.visuals.length > 0 ? (
                                             <div className="space-y-3">
                                               {st.visuals.map((vis, vIdx) => (
                                                 <div key={vIdx} className="group relative rounded-[3px] border border-white/[0.09] bg-black overflow-hidden shadow-md">
                                                   <CopyrightedImage
                                                     src={vis.url}
                                                     alt={vis.caption}
                                                     className="w-full h-auto object-cover max-h-[420px] transition-transform duration-500 group-hover:scale-[1.01]"
                                                   />
                                                   <div className="flex items-center justify-between px-3.5 py-2 bg-[#090b10] border-t border-white/[0.07] text-xs">
                                                     <span className="text-zinc-300 truncate pr-3 flex items-center gap-2">
                                                       <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                                                       <span>{vis.caption}</span>
                                                       {vis.triggerLine && (
                                                         <span className="text-zinc-500 text-[11px] hidden sm:inline truncate max-w-[280px]">
                                                           · {vis.triggerLine}
                                                         </span>
                                                       )}
                                                     </span>
                                                     <button
                                                       onClick={() => {
                                                         playOpenSound();
                                                         onOpenLightbox(vis.url, vis.caption, st.title);
                                                       }}
                                                       className="h-6 px-2 rounded-[2px] flex items-center gap-1 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0"
                                                     >
                                                       <ZoomIn className="w-3 h-3 text-[#ffe600]" />
                                                       <span className="text-[10px]">확대</span>
                                                     </button>
                                                   </div>
                                                 </div>
                                               ))}
                                             </div>
                                           ) : st.cgUrl && st.cgUrl.trim() !== '' ? (
                                             <div className="rounded-[3px] border border-white/[0.08] bg-black overflow-hidden">
                                               <CopyrightedImage
                                                 src={st.cgUrl}
                                                 alt={st.title}
                                                 className="w-full h-auto object-cover max-h-[380px]"
                                               />
                                               {st.cgCaption && (
                                                 <div className="px-3.5 py-2 bg-[#08090c] border-t border-white/[0.06] text-xs font-sans text-zinc-300 flex items-center justify-between">
                                                   <span>{st.cgCaption}</span>
                                                   <button
                                                     onClick={() => onOpenLightbox(st.cgUrl!, st.cgCaption, st.title)}
                                                     className="text-[11px] font-semibold text-[#ffe600] hover:underline cursor-pointer"
                                                   >
                                                     확대
                                                   </button>
                                                 </div>
                                               )}
                                             </div>
                                           ) : null}

                                           {st.tacticalLog && (
                                             <div className="px-3.5 py-2.5 rounded-[2px] bg-[#00d8ff]/[0.05] border border-[#00d8ff]/20 border-l-2 border-l-[#00d8ff] text-xs font-sans text-zinc-200 flex items-start gap-2">
                                               <span className="text-[#00d8ff] font-bold flex-shrink-0">전술 요약</span>
                                               <span className="text-zinc-600 flex-shrink-0">|</span>
                                               <span className="[word-break:keep-all] break-keep leading-relaxed">{st.tacticalLog}</span>
                                             </div>
                                           )}

                                           <div className="text-sm sm:text-[15px] text-zinc-200 leading-[1.85] font-sans space-y-3 [word-break:keep-all] break-keep">
                                             {st.narrativeText.split('\n\n').map((p, idx) => (
                                               <p key={idx}>
                                                 <HighlightedText
                                                   text={p}
                                                   characters={story.characters}
                                                   glossary={story.glossary}
                                                   onSelectCharacter={onSelectCharacter}
                                                   onSelectGlossary={onSelectGlossary}
                                                 />
                                               </p>
                                             ))}
                                           </div>

                                           {/* Stage Quotes */}
                                           {st.quotes && st.quotes.length > 0 && (
                                             <div className="space-y-2.5 pt-2">
                                               <div className="text-[11px] font-sans font-bold text-zinc-400 flex items-center gap-1.5">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                                                 <span>인게임 핵심 대사</span>
                                               </div>
                                               {st.quotes.map((q, qIdx) => {
                                                 const speakerChar = getCharacterById(q.speakerId);
                                                 return (
                                                   <div
                                                     key={qIdx}
                                                     className="p-3.5 rounded-[3px] bg-black/40 border border-white/[0.06] border-l-2 border-l-[#ffe600] flex gap-3.5 items-start text-xs"
                                                   >
                                                     {speakerChar && (
                                                       <div
                                                         onClick={() => onSelectCharacter(speakerChar)}
                                                         className="w-9 h-9 rounded-[2px] border border-white/[0.1] overflow-hidden bg-black flex-shrink-0 cursor-pointer hover:border-[#ffe600] transition-colors"
                                                         title={`${speakerChar.nameKo} 프로필 열람`}
                                                       >
                                                         <img
                                                           src={resolveAssetUrl(getCharacterAvatarUrl(speakerChar))}
                                                           alt={q.speaker}
                                                           draggable={false}
                                                           onContextMenu={(e) => e.preventDefault()}
                                                           className="w-full h-full object-cover select-none"
                                                         />
                                                       </div>
                                                     )}
                                                     <div className="flex-1 min-w-0 space-y-1">
                                                       <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                         <span className="font-bold text-[#ffe600]">{q.speaker}</span>
                                                         {q.context && (
                                                           <span className="text-zinc-500 text-[10.5px] truncate max-w-[240px] sm:max-w-[320px]">
                                                             {q.context}
                                                           </span>
                                                         )}
                                                       </div>
                                                       <p className="text-zinc-200 leading-relaxed font-sans font-medium [word-break:keep-all]">
                                                         "{q.text}"
                                                       </p>
                                                     </div>
                                                   </div>
                                                 );
                                               })}
                                             </div>
                                           )}

                                           {/* Stage Involved Characters */}
                                           {st.involvedCharacters && st.involvedCharacters.length > 0 && (
                                             <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs font-sans">
                                               <span className="text-[11px] text-zinc-500 mr-1">등장:</span>
                                               {st.involvedCharacters.map((cId) => {
                                                 const char = getCharacterById(cId);
                                                 if (!char) return null;
                                                 return (
                                                   <button
                                                     key={cId}
                                                     onClick={() => onSelectCharacter(char)}
                                                     className="h-6 pl-1 pr-2 rounded-[2px] flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-[#ffe600]/60 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer"
                                                     title={`${char.nameKo} (${char.role}) 프로필 열람`}
                                                   >
                                                     <img src={resolveAssetUrl(getCharacterAvatarUrl(char))} alt={char.nameKo} draggable={false} onContextMenu={(e) => e.preventDefault()} className="w-3.5 h-3.5 rounded-[1px] object-cover select-none" />
                                                     <span>{char.nameKo}</span>
                                                   </button>
                                                 );
                                               })}
                                             </div>
                                           )}
                                         </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Involved Personnel Bar */}
                                {act.involvedCharacters && act.involvedCharacters.length > 0 && (
                                  <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2 font-sans">
                                    <span className="text-[11px] font-semibold text-zinc-500 mr-1">
                                      등장인물
                                    </span>
                                    {act.involvedCharacters.map((cId) => {
                                      const char = getCharacterById(cId);
                                      if (!char) return null;
                                      return (
                                        <button
                                          key={cId}
                                          onClick={() => onSelectCharacter(char)}
                                          className="flex items-center gap-1.5 h-6 pl-1 pr-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] hover:border-[#ffe600]/60 text-xs text-zinc-200 hover:text-white transition-all cursor-pointer"
                                        >
                                          <img
                                            src={resolveAssetUrl(getCharacterAvatarUrl(char))}
                                            alt={char.nameKo}
                                            draggable={false}
                                            onContextMenu={(e) => e.preventDefault()}
                                            className="w-4 h-4 rounded-full object-cover select-none"
                                          />
                                          <span className="font-medium">{char.nameKo}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Post-Operation Analysis Box */}
              <div className="rounded-[4px] border border-white/[0.07] bg-[#0d1018]/90 overflow-hidden shadow-xl">
                <button
                  onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                  className="w-full px-5 sm:px-7 py-4 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-left cursor-pointer transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 font-sans">
                    <span className="w-1.5 h-3.5 rounded-[1px] bg-[#ffe600] flex-shrink-0" />
                    <span className="font-bold text-white text-sm sm:text-base [word-break:keep-all] break-words">
                      스토리 분석 및 해설
                    </span>
                    <span className="hidden sm:inline text-[11px] font-mono text-zinc-500">
                      STORY COMMENTARY
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-[3px] bg-white/[0.04] border border-white/[0.08] text-zinc-400 flex items-center justify-center flex-shrink-0">
                    {isAnalysisExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isAnalysisExpanded && (
                  <div className="p-5 sm:p-8 space-y-6 text-xs sm:text-sm divide-y divide-white/[0.06] border-t border-white/[0.06] font-sans">
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-[#ffe600] flex items-center gap-2">
                        <span className="font-mono">01</span>
                        <span>핵심 주제 및 서사적 메시지</span>
                      </div>
                      <p className="text-zinc-200 leading-[1.8] text-sm sm:text-[15px] [word-break:keep-all] break-words">
                        {story.content.analysis.theme}
                      </p>
                    </div>

                    <div className="pt-5 space-y-2">
                      <div className="text-xs font-bold text-[#ffe600] flex items-center gap-2">
                        <span className="font-mono">02</span>
                        <span>로도스 아일랜드 영향 및 성과</span>
                      </div>
                      <p className="text-zinc-200 leading-[1.8] text-sm sm:text-[15px] [word-break:keep-all] break-words">
                        {story.content.analysis.tacticalEvaluation}
                      </p>
                    </div>

                    <div className="pt-5 space-y-2">
                      <div className="text-xs font-bold text-[#ffe600] flex items-center gap-2">
                        <span className="font-mono">03</span>
                        <span>테라 대륙 정세 영향</span>
                      </div>
                      <p className="text-zinc-200 leading-[1.8] text-sm sm:text-[15px] [word-break:keep-all] break-words">
                        {story.content.analysis.loreImpact}
                      </p>
                    </div>

                    <div className="pt-5 space-y-3">
                      <div className="text-xs font-bold text-[#ffe600] flex items-center gap-2">
                        <span className="font-mono">04</span>
                        <span>미회수 복선 및 잔존 기록</span>
                      </div>
                      <ul className="space-y-2.5 text-zinc-200">
                        {story.content.analysis.unresolvedHooks.map((hook, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-3 bg-white/[0.02] p-3.5 rounded-[3px] border border-white/[0.06]">
                            <span className="text-[#ffe600] font-mono text-xs font-bold flex-shrink-0 mt-0.5">#{hIdx + 1}</span>
                            <span className="text-xs sm:text-sm leading-relaxed [word-break:keep-all] break-words">{hook}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              4. TAB CONTENT: PERSONNEL DOSSIER
          ========================================================================= */}
          {activeTab === 'dossier' && (
            <div className="space-y-5 font-sans">
              <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/[0.08] pb-3">
                <span className="font-semibold text-zinc-200">작전 관계자 명부 (총 {story.characters.length}명)</span>
                <span className="font-mono text-[11px] text-zinc-500">클릭 시 상세 프로필 열람</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {story.characters.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => onSelectCharacter(char)}
                    className="p-5 rounded-[4px] border border-white/[0.07] bg-[#0d1018]/90 hover:border-[#ffe600]/60 hover:bg-[#111520] transition-all cursor-pointer group space-y-3.5 shadow-lg"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 rounded-[3px] border border-white/[0.12] overflow-hidden bg-black flex-shrink-0 group-hover:border-[#ffe600] transition-colors shadow">
                        <img
                          src={resolveAssetUrl(getCharacterAvatarUrl(char))}
                          alt={char.nameKo}
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full h-full object-cover select-none"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-[11px] font-semibold text-[#ffe600]/90 truncate">
                          {char.faction}
                        </div>
                        <div className="text-base font-extrabold text-white group-hover:text-[#ffe600] transition-colors truncate">
                          {char.nameKo}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {char.role}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-[13px] text-zinc-300 line-clamp-2 leading-relaxed [word-break:keep-all]">
                      {char.description}
                    </p>

                    {char.quote && (
                      <div className="text-xs italic text-zinc-200 border-l-2 border-[#ffe600] pl-3 py-1 bg-white/[0.02] rounded-r-[2px] [word-break:keep-all]">
                        "{char.quote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              5. TAB CONTENT: GLOSSARY INDEX
          ========================================================================= */}
          {activeTab === 'glossary' && (
            <div className="space-y-5 font-sans">
              <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/[0.08] pb-3">
                <span className="font-semibold text-zinc-200">관련 용어 사전 (총 {story.glossary.length}건)</span>
                <span className="font-mono text-[11px] text-zinc-500">클릭 시 상세 정의 열람</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {story.glossary.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectGlossary(item)}
                    className="p-5 rounded-[4px] border border-white/[0.07] bg-[#0d1018]/90 hover:border-[#ffe600]/60 hover:bg-[#111520] transition-all cursor-pointer group space-y-2.5 shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#ffe600] transition-colors">
                        {item.term}
                      </div>
                      <span className="h-5 px-2 inline-flex items-center rounded-[2px] bg-white/[0.05] text-zinc-300 font-semibold text-[11px] border border-white/[0.08] flex-shrink-0">
                        {item.typeLabel}
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed [word-break:keep-all]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          6. BOTTOM STORY NAVIGATOR (이전 / 다음 스토리 버튼)
      ========================================================================= */}
      <nav className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch justify-between gap-3 font-sans text-xs">
        {/* Previous Story Button */}
        {previousStory ? (
          <button
            onClick={() => handleNavigateStory(previousStory.id)}
            className="group flex-1 p-4 rounded-[4px] bg-[#0d1018]/90 hover:bg-[#121722] border border-white/[0.07] hover:border-[#ffe600]/60 text-left transition-all cursor-pointer flex items-center gap-3.5 shadow-md"
            title={`${previousStory.titleKo} 보고서로 이동`}
          >
            <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-[#ffe600] transition-transform group-hover:-translate-x-1 flex-shrink-0" />
            <div className="min-w-0 space-y-0.5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">
                PREVIOUS OPERATION
              </div>
              <div className="text-sm font-bold text-white group-hover:text-[#ffe600] transition-colors truncate">
                <span className="font-mono mr-1.5 text-zinc-400 group-hover:text-[#ffe600]">{previousStory.code}</span>
                <span>{previousStory.titleKo}</span>
              </div>
              <div className="text-[11px] text-zinc-500 truncate font-mono">
                {previousStory.titleEn}
              </div>
            </div>
          </button>
        ) : (
          <div className="flex-1 p-4 rounded-[4px] bg-white/[0.015] border border-white/[0.05] text-zinc-600 flex items-center gap-2 select-none">
            <span className="text-xs">첫 번째 작전 기록입니다</span>
          </div>
        )}

        {/* Scroll To Top Button */}
        <button
          onClick={scrollToTop}
          className="w-12 py-3 rounded-[4px] bg-[#0d1018]/90 hover:bg-[#121722] border border-white/[0.07] hover:border-[#ffe600]/60 text-zinc-400 hover:text-[#ffe600] transition-colors cursor-pointer flex items-center justify-center self-center sm:self-stretch shadow-md"
          title="페이지 최상단으로 이동"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        {/* Next Story Button */}
        {nextStory ? (
          <button
            onClick={() => handleNavigateStory(nextStory.id)}
            className="group flex-1 p-4 rounded-[4px] bg-[#0d1018]/90 hover:bg-[#121722] border border-white/[0.07] hover:border-[#ffe600]/60 text-right transition-all cursor-pointer flex items-center justify-end gap-3.5 shadow-md"
            title={`${nextStory.titleKo} 보고서로 이동`}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">
                NEXT OPERATION
              </div>
              <div className="text-sm font-bold text-white group-hover:text-[#ffe600] transition-colors truncate">
                <span className="font-mono mr-1.5 text-zinc-400 group-hover:text-[#ffe600]">{nextStory.code}</span>
                <span>{nextStory.titleKo}</span>
              </div>
              <div className="text-[11px] text-zinc-500 truncate font-mono">
                {nextStory.titleEn}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-[#ffe600] transition-transform group-hover:translate-x-1 flex-shrink-0" />
          </button>
        ) : (
          <div className="flex-1 p-4 rounded-[4px] bg-white/[0.015] border border-white/[0.05] text-zinc-600 flex items-center justify-end gap-2 select-none">
            <span className="text-xs">마지막 작전 기록입니다</span>
          </div>
        )}
      </nav>
    </div>
  );
};

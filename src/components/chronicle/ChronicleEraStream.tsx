import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getStoryAccessState, type StoryListItem, type StoryLineMeta } from '../../data/storyRegistry';
import {
  TIMELINE_ERAS,
  LANDMARK_STORY_IDS,
  buildCausalThread,
  getStoryRelatedRegions,
  type StoryConnection,
} from './chronicleData';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { getStoryProgress } from '../../utils/readingProgress';
import { playClickSound, playOpenSound, playCloseSound } from '../../utils/soundEffects';
import { FilmReelIcon } from '../StorySplashModal';
import {
  BookOpen,
  ChevronRight,
  GitBranch,
  MapPin,
  ArrowDown,
  X,
  Compass,
  Sparkles,
} from 'lucide-react';

interface ChronicleEraStreamProps {
  stories: StoryListItem[];
  allConnections: StoryConnection[];
  storyMap: Map<string, StoryListItem>;
  lineMetaMap: Map<string, StoryLineMeta>;
  inspectedStoryId: string | null;
  focusedLineId: string | null;
  activeThreadStoryId: string | null;
  onChangeFocusedLine: (lineId: string | null) => void;
  onSelectCausalThread: (storyId: string | null) => void;
  onInspectStory: (story: StoryListItem) => void;
  onOpenStory: (storyId: string) => void;
  onNavigateToMapRegion?: (regionId: string) => void;
}

const STREAM_SHORTCUT_LINES: { id: string | null; label: string; color: string }[] = [
  { id: null, label: '전체 보기', color: '#e4e4e7' },
  { id: 'MAIN_ALL', label: '메인 테마', color: '#f5dd1b' },
  { id: 'SL_RL', label: '방주 (바벨)', color: '#68929e' },
  { id: 'SL_RH', label: '라인 랩', color: '#648c74' },
  { id: 'SL_AE', label: '에기르 심해', color: '#4d7894' },
  { id: 'SL_KA', label: '카시미어', color: '#b89648' },
  { id: 'SL_SI', label: '시라쿠사', color: '#a6704b' },
  { id: 'SL_SU', label: '쉐이', color: '#5e9096' },
  { id: 'SL_TA', label: '타라 · 빅토리아', color: '#a8584c' },
  { id: 'SL_LE', label: '고탑의 그림자', color: '#8a7096' },
];

export const ChronicleEraStream: React.FC<ChronicleEraStreamProps> = ({
  stories,
  allConnections,
  storyMap,
  lineMetaMap,
  inspectedStoryId,
  focusedLineId,
  activeThreadStoryId,
  onChangeFocusedLine,
  onSelectCausalThread,
  onInspectStory,
  onOpenStory,
  onNavigateToMapRegion,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [observedEraId, setObservedEraId] = useState<string>('era_00');

  const storiesByEra = useMemo(() => {
    const map = new Map<string, StoryListItem[]>();
    for (const era of TIMELINE_ERAS) {
      const list = stories
        .filter(
          (s) =>
            s.chronologicalOrder >= era.minOrder &&
            s.chronologicalOrder <= era.maxOrder &&
            (!focusedLineId ||
              s.storyLineId === focusedLineId ||
              (focusedLineId === 'MAIN_ALL' && s.storyLineId.startsWith('MAIN_')))
        )
        .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
      map.set(era.id, list);
    }
    return map;
  }, [stories, focusedLineId]);

  const visibleEras = useMemo(
    () => TIMELINE_ERAS.filter((era) => (storiesByEra.get(era.id)?.length ?? 0) > 0),
    [storiesByEra]
  );

  const activeEraId =
    visibleEras.some((e) => e.id === observedEraId)
      ? observedEraId
      : visibleEras[0]?.id ?? 'era_00';

  const progressMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stories) {
      const p = getStoryProgress(s.id);
      if (p && p.scrollRatio > 0) {
        m.set(s.id, Math.round(p.scrollRatio * 100));
      }
    }
    return m;
  }, [stories]);

  const causalChain = useMemo(() => {
    if (!activeThreadStoryId) return [];
    return buildCausalThread(activeThreadStoryId, allConnections, storyMap);
  }, [activeThreadStoryId, allConnections, storyMap]);

  const focalThreadStory = activeThreadStoryId ? storyMap.get(activeThreadStoryId) ?? null : null;

  // Scroll-Spy for Sticky Chronology Spine
  useEffect(() => {
    if (activeThreadStoryId) return;
    const root = scrollContainerRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (intersecting.length > 0) {
          const id = intersecting[0].target.id.replace('stream-era-', '');
          setObservedEraId(id);
        }
      },
      { root, rootMargin: '-12% 0px -68% 0px', threshold: 0.02 }
    );

    const els: Element[] = [];
    for (const era of visibleEras) {
      const el = root.querySelector(`#stream-era-${era.id}`);
      if (el) {
        observer.observe(el);
        els.push(el);
      }
    }
    return () => {
      els.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [visibleEras, activeThreadStoryId]);

  // ESC shortcut to exit Causal Thread Focus Mode
  useEffect(() => {
    if (!activeThreadStoryId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playCloseSound();
        onSelectCausalThread(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeThreadStoryId, onSelectCausalThread]);

  const scrollToEra = (eraId: string) => {
    playClickSound();
    const el = scrollContainerRef.current?.querySelector(`#stream-era-${eraId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // =========================================================================
  // CAUSAL THREAD FOCUS VIEW (Replaces grid cleanly with step-by-step lore links)
  // =========================================================================
  if (activeThreadStoryId && focalThreadStory) {
    return (
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-[#0b0c0f] px-3.5 sm:px-6 lg:px-10 py-5 prts-scrollbar"
      >
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Sticky Thread Banner */}
          <div className="sticky top-0 z-20 rounded-[2px] bg-[#111318]/95 backdrop-blur-md border border-[#f5dd1b]/45 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#f5dd1b] font-bold uppercase tracking-widest">
                <GitBranch className="w-3.5 h-3.5" />
                <span>CAUSAL THREAD FOCUS // {causalChain.length} STEP ARCHIVE</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5 truncate">
                [{focalThreadStory.code}] {focalThreadStory.titleKo} 중심 서사 인과 추적
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                playCloseSound();
                onSelectCausalThread(null);
              }}
              className="h-8 px-3 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>전체 연대기로 복귀 [ESC]</span>
            </button>
          </div>

          {/* Sequential Causal Steps */}
          <div className="space-y-1.5 pb-12">
            {causalChain.map((node, idx) => {
              const st = node.story;
              const accessState = getStoryAccessState(st);
              const isRestored = accessState === 'available';
              const isLocked = accessState === 'locked';
              const lineMeta = lineMetaMap.get(st.storyLineId);
              const accentColor = lineMeta?.themeColor || '#f5dd1b';
              const progressPct = progressMap.get(st.id) ?? 0;

              return (
                <div key={`thread-${st.id}`}>
                  {idx > 0 && node.bridgeReasonFromPrev && (
                    <div className="flex items-stretch gap-3 pl-5 sm:pl-7 py-2">
                      <div className="flex flex-col items-center">
                        <div className="w-[1px] flex-1 bg-white/15" />
                        <ArrowDown
                          className={`w-3.5 h-3.5 my-0.5 ${
                            node.bridgeTypeFromPrev === 'cross' ? 'text-[#f5dd1b]' : 'text-zinc-500'
                          }`}
                        />
                        <div className="w-[1px] flex-1 bg-white/15" />
                      </div>
                      <div
                        className={`flex-1 rounded-[2px] px-3 py-2 border text-xs flex flex-wrap items-center gap-2 ${
                          node.bridgeTypeFromPrev === 'cross'
                            ? 'bg-[#f5dd1b]/[0.07] border-[#f5dd1b]/35 text-zinc-100'
                            : 'bg-[#12141a] border-white/[0.08] text-zinc-300'
                        }`}
                      >
                        <span
                          className={`px-1.5 py-0.2 rounded-[1px] font-mono text-[10px] font-bold ${
                            node.bridgeTypeFromPrev === 'cross'
                              ? 'bg-[#f5dd1b] text-black'
                              : 'bg-white/[0.08] text-zinc-300'
                          }`}
                        >
                          {node.bridgeTypeFromPrev === 'cross' ? '교차 인과' : '연작 흐름'}
                        </span>
                        <span className="leading-snug">{node.bridgeReasonFromPrev}</span>
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => {
                      playClickSound();
                      onInspectStory(st);
                    }}
                    style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
                    className={`group relative rounded-[2px] border overflow-hidden cursor-pointer transition-all ${
                      node.isFocal
                        ? 'bg-[#171922] border-[#f5dd1b] ring-1 ring-[#f5dd1b]/60 shadow-2xl'
                        : inspectedStoryId === st.id
                        ? 'bg-[#15171f] border-white/45'
                        : 'bg-[#111217] border-white/[0.09] hover:border-white/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {st.splashVisualUrl && !isLocked && (
                        <div className="sm:w-48 h-32 sm:h-auto relative overflow-hidden bg-black flex-shrink-0">
                          <img
                            src={resolveAssetUrl(st.splashVisualUrl)}
                            alt={st.titleKo}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#111217] via-transparent to-transparent" />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[1px] bg-black/85 border border-white/15 font-mono text-[10px] font-bold text-white">
                            STEP 0{node.stepIndex}
                          </div>
                        </div>
                      )}

                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0 space-y-2">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded-[1px] font-black ${
                                  isRestored ? 'bg-[#f5dd1b] text-black' : 'bg-white/[0.09] text-zinc-200'
                                }`}
                              >
                                {st.code}
                              </span>
                              {node.isFocal && (
                                <span className="px-1.5 py-0.5 rounded-[1px] bg-[#f5dd1b]/15 border border-[#f5dd1b]/50 text-[#f5dd1b] font-bold">
                                  기준 작전
                                </span>
                              )}
                              <span className="text-zinc-400">{st.timeline}</span>
                            </div>
                            <span style={{ color: accentColor }} className="font-bold">
                              {lineMeta?.titleKo.replace('내일을 위하여 · ', '')}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-white group-hover:text-[#f5dd1b] transition-colors mt-1">
                            {st.titleKo}{' '}
                            <span className="text-xs font-mono text-zinc-500 font-normal ml-1">
                              {st.titleEn}
                            </span>
                          </h3>
                          <p className="text-xs text-zinc-300 mt-1.5 line-clamp-2 leading-relaxed break-keep">
                            {st.officialSynopsis}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                            {progressPct > 0 && (
                              <span className="text-[#f5dd1b]">진행도 {progressPct}%</span>
                            )}
                            {!node.isFocal && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playClickSound();
                                  onSelectCausalThread(st.id);
                                }}
                                className="px-2 py-0.5 rounded-[2px] bg-[#181a22] hover:bg-zinc-100 hover:text-black border border-white/10 text-zinc-300 transition-colors cursor-pointer"
                              >
                                이 편 기준으로 재추적
                              </button>
                            )}
                          </div>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playOpenSound();
                                onOpenStory(st.id);
                              }}
                              className="h-7 px-3 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black text-[11px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{isRestored ? '요약본 열람' : '개요 열람'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // EDITORIAL SINGLE-AXIS TIMELINE STREAM (Default View)
  // =========================================================================
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto bg-[#0b0c0f] prts-scrollbar relative"
    >
      {/* Mobile Compact Era Jump Strip (< lg) */}
      <div className="lg:hidden sticky top-0 z-20 bg-[#0d0e13]/95 backdrop-blur-md border-b border-white/[0.08] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {visibleEras.map((era) => {
          const active = activeEraId === era.id;
          return (
            <button
              key={`mob-era-${era.id}`}
              type="button"
              onClick={() => scrollToEra(era.id)}
              className={`px-2.5 py-1 rounded-[2px] border text-[10.5px] font-mono flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#1a1c24] border-[#f5dd1b] text-white font-bold'
                  : 'bg-[#12141a] border-white/[0.08] text-zinc-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: era.color }} />
              <span>{era.code}</span>
              <span className="text-zinc-500">{era.yearMark}</span>
            </button>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-7 flex items-start gap-8">
        {/* Left Sticky Chronology Spine (Desktop >= lg) */}
        <aside className="hidden lg:flex w-56 xl:w-60 flex-shrink-0 sticky top-5 flex-col gap-5 select-none">
          <div className="rounded-[2px] bg-[#101217] border border-white/[0.08] p-3.5 space-y-2.5">
            <div className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center justify-between">
              <span>EPOCH SPINE</span>
              <span className="text-[#f5dd1b]">{stories.length}편</span>
            </div>

            <div className="relative pl-3 space-y-1 border-l border-white/[0.12]">
              {visibleEras.map((era) => {
                const count = storiesByEra.get(era.id)?.length ?? 0;
                const active = activeEraId === era.id;
                return (
                  <button
                    key={`spine-${era.id}`}
                    type="button"
                    onClick={() => scrollToEra(era.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-[2px] transition-colors cursor-pointer relative group ${
                      active
                        ? 'bg-white/[0.07] text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className={`absolute -left-[16.5px] top-3 w-2 h-2 rounded-full border transition-transform ${
                        active ? 'scale-125 border-white' : 'border-[#0b0c0f]'
                      }`}
                      style={{ backgroundColor: era.color }}
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={active ? 'text-[#f5dd1b] font-bold' : 'text-zinc-400'}>
                        {era.yearMark} · {era.code}
                      </span>
                      <span className="text-zinc-500">{count}</span>
                    </div>
                    <div className="text-xs font-semibold truncate mt-0.5">
                      {era.titleKo}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Series Quick Filter Shortcuts */}
          <div className="rounded-[2px] bg-[#101217] border border-white/[0.08] p-3.5 space-y-2">
            <div className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-[#f5dd1b]" />
              <span>핵심 서사 계보</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {STREAM_SHORTCUT_LINES.map((sc) => {
                const isSelected = focusedLineId === sc.id;
                return (
                  <button
                    key={`sc-${sc.id || 'all'}`}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onChangeFocusedLine(isSelected && sc.id !== null ? null : sc.id);
                    }}
                    className={`px-2 py-1 rounded-[2px] border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 text-black border-zinc-100 font-bold'
                        : 'bg-[#15171e] border-white/[0.07] text-zinc-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-[1px]"
                      style={{ backgroundColor: isSelected ? '#0b0c0f' : sc.color }}
                    />
                    <span>{sc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Editorial Era Stream Chapters */}
        <div className="flex-1 min-w-0 space-y-12 pb-16">
          {visibleEras.length === 0 ? (
            <div className="rounded-[2px] border border-white/[0.08] bg-[#111217] p-12 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-zinc-500 mx-auto" />
              <div className="text-sm font-bold text-zinc-200">조건에 맞는 작전 기록이 없습니다.</div>
              <button
                type="button"
                onClick={() => onChangeFocusedLine(null)}
                className="mt-2 px-3 py-1.5 rounded-[2px] bg-[#1a1c24] hover:bg-zinc-100 hover:text-black border border-white/15 text-xs font-mono text-zinc-200 cursor-pointer"
              >
                계보 필터 초기화
              </button>
            </div>
          ) : (
            visibleEras.map((era) => {
              const eraStories = storiesByEra.get(era.id) ?? [];
              return (
                <section
                  key={era.id}
                  id={`stream-era-${era.id}`}
                  className="space-y-4 scroll-mt-14 lg:scroll-mt-5"
                >
                  {/* Editorial Chapter Monument Header */}
                  <div
                    style={{ borderLeftColor: era.color, borderLeftWidth: '3px' }}
                    className="relative rounded-[2px] bg-[#111217] border border-white/[0.08] p-4 sm:p-5 overflow-hidden"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute -right-2 -bottom-3 text-[64px] sm:text-[86px] font-black font-mono tracking-tighter text-white/[0.04] leading-none"
                    >
                      {era.yearMark}
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-[1px] font-mono text-[11px] font-black text-black"
                          style={{ backgroundColor: era.color }}
                        >
                          {era.code}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#f5dd1b]">
                          {era.periodKo}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-[2px] bg-white/[0.05] text-[11px] font-mono text-zinc-400">
                        {eraStories.length}개 작전
                      </span>
                    </div>

                    <h2 className="relative z-10 text-lg sm:text-xl font-black text-white tracking-tight mt-2">
                      {era.titleKo}
                      <span className="text-xs sm:text-sm font-mono text-zinc-500 font-normal ml-2">
                        / {era.titleEn}
                      </span>
                    </h2>
                    <p className="relative z-10 text-xs sm:text-[13px] text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                      {era.description}
                    </p>
                  </div>

                  {/* Rhythmic Responsive Editorial Story Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {eraStories.map((story) => {
                      const accessState = getStoryAccessState(story);
                      const isRestored = accessState === 'available';
                      const isLocked = accessState === 'locked';
                      const isLandmark = LANDMARK_STORY_IDS.has(story.id) && !focusedLineId;
                      const isSelected = inspectedStoryId === story.id;
                      const lineMeta = lineMetaMap.get(story.storyLineId);
                      const accentColor = lineMeta?.themeColor || era.color;
                      const cleanTimeline = story.timeline
                        .replace(/^테라력\s*/, '')
                        .replace(/\s*\([^)]*\)/g, '')
                        .trim();
                      const progressPct = progressMap.get(story.id) ?? 0;
                      const regions = isLandmark ? getStoryRelatedRegions(story.id).slice(0, 2) : [];

                      return (
                        <article
                          key={story.id}
                          onClick={() => {
                            playClickSound();
                            onInspectStory(story);
                          }}
                          onDoubleClick={() => {
                            if (!isLocked) {
                              playOpenSound();
                              onOpenStory(story.id);
                            }
                          }}
                          style={{ borderTopColor: accentColor, borderTopWidth: '2px' }}
                          className={`group relative rounded-[2px] border cursor-pointer overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                            isLandmark ? 'md:col-span-2 min-h-[212px] p-4 sm:p-5' : 'min-h-[178px] p-3.5'
                          } ${
                            isSelected
                              ? 'bg-[#171923] border-[#f5dd1b] ring-1 ring-[#f5dd1b]'
                              : isRestored
                              ? 'bg-[#121319] border-white/[0.13] hover:border-[#f5dd1b]/70 hover:-translate-y-0.5'
                              : isLocked
                              ? 'bg-[#0e0f13] border-white/[0.05] opacity-65'
                              : 'bg-[#101217] border-white/[0.08] hover:border-white/25 hover:-translate-y-0.5'
                          }`}
                        >
                          {/* Background Cover Artwork */}
                          {story.splashVisualUrl && !isLocked && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <img
                                src={resolveAssetUrl(story.splashVisualUrl)}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className={`w-full h-full object-cover object-center transition-all duration-500 select-none ${
                                  isLandmark
                                    ? 'opacity-50 group-hover:opacity-75 group-hover:scale-[1.03]'
                                    : 'opacity-38 group-hover:opacity-65 group-hover:scale-[1.04]'
                                }`}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div
                                className={`absolute inset-0 ${
                                  isLandmark
                                    ? 'bg-gradient-to-r from-[#0e1015] via-[#0e1015]/82 to-[#0e1015]/35'
                                    : 'bg-gradient-to-t from-[#0e1015] via-[#0e1015]/82 to-[#0e1015]/40'
                                }`}
                              />
                            </div>
                          )}

                          {/* Top Row: Code & Badges */}
                          <div className="relative z-10 flex items-center justify-between gap-2 text-[10px] font-mono">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`px-1.5 py-0.5 font-black tracking-wider rounded-[1px] flex-shrink-0 ${
                                  isRestored
                                    ? 'bg-[#f5dd1b] text-black'
                                    : isLocked
                                    ? 'bg-zinc-900 text-zinc-500 border border-white/10'
                                    : 'bg-black/80 text-zinc-200 border border-white/15'
                                }`}
                              >
                                {story.code}
                              </span>
                              <span className="text-zinc-400 truncate">{cleanTimeline}</span>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {story.isOmnibus && (
                                <FilmReelIcon className="w-3.5 h-3.5 text-zinc-300" title="옴니버스 단편" />
                              )}
                              {isRestored && (
                                <span className="px-1.5 py-0.2 bg-[#f5dd1b]/15 border border-[#f5dd1b]/50 text-[#f5dd1b] text-[9.5px] font-bold rounded-[1px]">
                                  전문 복원
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle Body: Titles & Synopsis */}
                          <div className="relative z-10 my-auto py-2 space-y-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <h3
                                className={`${
                                  isLandmark ? 'text-lg sm:text-xl' : 'text-sm sm:text-[15px]'
                                } font-extrabold text-white group-hover:text-[#f5dd1b] transition-colors leading-snug drop-shadow`}
                              >
                                {story.titleKo}
                              </h3>
                              <span className="text-[10.5px] font-mono text-zinc-400 truncate">
                                {story.titleEn}
                              </span>
                            </div>
                            <p
                              className={`text-xs text-zinc-300 leading-relaxed break-keep ${
                                isLandmark ? 'line-clamp-2 max-w-2xl' : 'line-clamp-2'
                              }`}
                            >
                              {story.officialSynopsis}
                            </p>
                          </div>

                          {/* Footer: Actions + Reading Progress + Terra Cross-Links */}
                          <div className="relative z-10 pt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold truncate" style={{ color: accentColor }}>
                                {lineMeta?.titleKo.replace('내일을 위하여 · ', '') || story.categoryLabel}
                              </span>
                              {regions.map((reg) => (
                                <button
                                  key={`chip-${story.id}-${reg.id}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playClickSound();
                                    onNavigateToMapRegion?.(reg.id);
                                  }}
                                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[1px] bg-black/55 hover:bg-white/15 border border-white/10 text-[9.5px] text-zinc-300 cursor-pointer transition-colors"
                                  title="테라 3D 지도에서 위치 보기"
                                >
                                  <MapPin className="w-2.5 h-2.5 text-[#f5dd1b]" />
                                  <span>{reg.nameKo}</span>
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playClickSound();
                                  onSelectCausalThread(story.id);
                                }}
                                className="h-6 px-2 rounded-[2px] bg-[#161820]/90 hover:bg-[#232632] border border-white/[0.12] hover:border-[#f5dd1b]/55 text-zinc-300 hover:text-[#f5dd1b] inline-flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
                                title="이 작전의 인과 체인 집중 추적"
                              >
                                <GitBranch className="w-2.5 h-2.5" />
                                <span>연결 추적</span>
                              </button>

                              {!isLocked && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playOpenSound();
                                    onOpenStory(story.id);
                                  }}
                                  className="h-6 px-2 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black font-bold inline-flex items-center gap-0.5 text-[10px] transition-colors cursor-pointer"
                                >
                                  <span>열람</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Subtle Reading Progress Bar */}
                          {progressPct > 0 && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.06] pointer-events-none"
                              title={`열람 진행률 ${progressPct}%`}
                            >
                              <div className="h-full bg-[#f5dd1b]" style={{ width: `${progressPct}%` }} />
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

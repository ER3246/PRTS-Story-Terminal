import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  Map as MapIcon,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Info,
  Maximize2,
  MonitorDown,
  Search,
  Clock,
} from 'lucide-react';
import { playClickSound, playTabSwitchSound } from '../utils/soundEffects';
import { APP_VERSION_CODE } from '../version';
import { PRTS_STAGGER_CONTAINER, PRTS_STAGGER_ITEM } from '../utils/motion';
import { PrtsNeuralEmblem } from './ui/TacticalIcons';
import { storyRegistry, getStoryAccessState } from '../data/storyRegistry';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getLastReadingEntry, getRecentReadingList } from '../utils/readingProgress';

interface HomeDashboardProps {
  onNavigateToStory: (storyId: string, subPageId?: string | null) => void;
  onNavigateToView: (view: 'report' | 'chronicle' | 'map') => void;
  onOpenCommandPalette?: () => void;
  onOpenReviewExport?: () => void;
  onOpenServiceNotice?: () => void;
  onOpenFullscreenGuide?: () => void;
  onPromptInstall?: () => void;
  isInstallable?: boolean;
}

const FLAGSHIP_STORY_IDS = ['ep00', 'ep08', 'ep14', 'sid_lone_trail'];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateToStory,
  onNavigateToView,
  onOpenCommandPalette,
  onOpenServiceNotice,
  onOpenFullscreenGuide,
  onPromptInstall,
  isInstallable = false,
}) => {
  const { availableCount, totalCount } = useMemo(() => {
    const avail = storyRegistry.filter((s) => getStoryAccessState(s) === 'available').length;
    return { availableCount: avail, totalCount: storyRegistry.length };
  }, []);

  const lastReading = useMemo(() => {
    const entry = getLastReadingEntry();
    if (!entry) return null;
    const meta = storyRegistry.find((s) => s.id === entry.storyId);
    if (!meta) return null;
    return { ...entry, meta };
  }, []);

  const spotlightOptions = useMemo(() => {
    const candidates: { id: string; tag: string; subPageId?: string | null; progressPct?: number }[] = [];
    if (lastReading) {
      candidates.push({
        id: lastReading.storyId,
        tag: '이어 읽기',
        subPageId: lastReading.subPageId,
        progressPct: Math.round(lastReading.scrollRatio * 100),
      });
    }
    const defaults = [
      { id: 'ep16', tag: '최신 EP.16' },
      { id: 'ep00', tag: '입문 EP.00' },
      { id: 'sid_lone_trail', tag: '추천 론 트레일' },
    ];
    for (const def of defaults) {
      if (!candidates.some((c) => c.id === def.id)) {
        candidates.push(def);
      }
    }
    return candidates
      .slice(0, 4)
      .map((item) => {
        const meta = storyRegistry.find((s) => s.id === item.id);
        return meta ? { ...item, meta } : null;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [lastReading]);

  const [selectedSpotlightId, setSelectedSpotlightId] = useState<string>(
    () => spotlightOptions[0]?.id || 'ep16'
  );
  const activeSpotlight =
    spotlightOptions.find((s) => s.id === selectedSpotlightId) || spotlightOptions[0];

  const curatedCards = useMemo(() => {
    const recent = getRecentReadingList(4);
    const seen = new Set<string>();
    const list: {
      storyId: string;
      subPageId?: string | null;
      badge: string;
      scrollRatio?: number;
    }[] = [];

    for (const r of recent) {
      if (seen.has(r.storyId)) continue;
      if (!storyRegistry.some((s) => s.id === r.storyId)) continue;
      seen.add(r.storyId);
      list.push({
        storyId: r.storyId,
        subPageId: r.subPageId,
        badge: 'RECENT',
        scrollRatio: r.scrollRatio,
      });
    }
    for (const fid of FLAGSHIP_STORY_IDS) {
      if (list.length >= 4) break;
      if (seen.has(fid)) continue;
      seen.add(fid);
      list.push({
        storyId: fid,
        badge: fid === 'ep00' ? 'PROLOGUE' : 'FEATURED',
      });
    }
    return list
      .slice(0, 4)
      .map((c) => {
        const meta = storyRegistry.find((s) => s.id === c.storyId);
        return meta ? { ...c, meta } : null;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, []);

  const [spotlightParallax, setSpotlightParallax] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const handleSpotlightPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setSpotlightParallax({ x: Number((-nx * 10).toFixed(2)), y: Number((-ny * 8).toFixed(2)) });
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative overflow-hidden select-none prts-grain">
      {/* Subtle Swiss Architectural Guide Hairlines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="max-w-6xl mx-auto h-full border-x border-white/[0.04]" />
      </div>

      <motion.div
        variants={PRTS_STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-6xl flex flex-col items-start text-left space-y-8"
      >
        {/* 1. Top Telemetry Specification Strip */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="w-full flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.09] pb-3 text-[11px] font-mono text-zinc-500"
        >
          <span className="inline-flex items-center gap-2 text-zinc-200 font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 bg-[#f5dd1b] shrink-0" />
            <span>PRTS ARCHIVE SYSTEM</span>
          </span>
          <span className="hidden sm:inline text-zinc-400 tracking-wider">
            {availableCount} FULL · {totalCount} INDEXED · 22 SECTORS
          </span>
          <span className="tracking-wider text-zinc-400">INDEX // {APP_VERSION_CODE}</span>
        </motion.div>

        {/* 2. Asymmetric 12-Col Editorial Hero + Featured Archive Spotlight */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
        >
          {/* Left Hero Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between py-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
                <PrtsNeuralEmblem className="w-5 h-5 text-zinc-200 shrink-0" />
                <span>RHODES ISLAND NARRATIVE DATABASE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-display font-bold tracking-[-0.03em] text-[#f2f2ef] leading-[0.98]">
                PRTS ARCHIVE
              </h1>

              <p className="text-sm sm:text-base text-[#b4b5bd] font-normal max-w-xl leading-relaxed [word-break:keep-all]">
                테라 대륙 각지의 전술 기록, 연대기 인과망, 22개 권역 3D 전술 지도를 하나로 엮은
                명일방주 인터랙티브 서사 아카이브입니다.
              </p>
            </div>

            {/* Primary & Secondary Action Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {lastReading ? (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onNavigateToStory(lastReading.storyId, lastReading.subPageId);
                  }}
                  className="h-10 px-4 rounded-[2px] bg-[#f5dd1b] hover:bg-white text-black font-sans text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    이어 읽기 · {lastReading.meta.code} {lastReading.meta.titleKo}
                  </span>
                  {lastReading.scrollRatio > 0 && (
                    <span className="px-1.5 py-0.5 rounded-[1px] bg-black/15 font-mono text-[10px]">
                      {Math.round(lastReading.scrollRatio * 100)}%
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onNavigateToStory('ep00');
                  }}
                  className="h-10 px-4 rounded-[2px] bg-[#f2f2ef] hover:bg-[#f5dd1b] text-black font-sans text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>EP.00 암흑시대부터 열람</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}

              {onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onOpenCommandPalette();
                  }}
                  className="h-10 px-3.5 rounded-[2px] bg-[#16181d] hover:bg-[#1d2027] text-zinc-200 hover:text-white border border-white/[0.11] hover:border-white/25 font-sans text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>통합 색인 검색</span>
                  <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-[#0b0c0e] border border-white/[0.12] rounded-[1px]">
                    Ctrl+K
                  </kbd>
                </button>
              )}
            </div>
          </div>

          {/* Right Featured Spotlight Column (5 cols) */}
          {activeSpotlight && (
            <div className="lg:col-span-5 flex flex-col border border-white/[0.09] bg-[#111215] rounded-[2px] overflow-hidden">
              {/* Spotlight Tab Switcher */}
              <div className="flex items-center gap-1 px-2.5 py-2 border-b border-white/[0.08] bg-[#141519] overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-1.5 shrink-0">
                  SPOTLIGHT
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  {spotlightOptions.map((opt) => {
                    const isSel = opt.id === activeSpotlight.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          playTabSwitchSound();
                          setSelectedSpotlightId(opt.id);
                        }}
                        className={`h-6 px-2 rounded-[2px] text-[10.5px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                          isSel
                            ? 'bg-zinc-100 text-black font-bold'
                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                        }`}
                      >
                        {opt.tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Parallax Visual Card */}
              <div
                onPointerMove={handleSpotlightPointerMove}
                onPointerLeave={() => setSpotlightParallax({ x: 0, y: 0 })}
                onClick={() => {
                  playClickSound();
                  onNavigateToStory(activeSpotlight.meta.id, activeSpotlight.subPageId);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playClickSound();
                    onNavigateToStory(activeSpotlight.meta.id, activeSpotlight.subPageId);
                  }
                }}
                className="relative flex-1 min-h-[220px] sm:min-h-[248px] bg-[#0b0c0e] overflow-hidden cursor-pointer group flex flex-col justify-end p-5 text-left"
              >
                {activeSpotlight.meta.splashVisualUrl && (
                  <img
                    src={resolveAssetUrl(activeSpotlight.meta.splashVisualUrl)}
                    alt={activeSpotlight.meta.titleKo}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    draggable={false}
                    style={{
                      transform: `translate3d(${spotlightParallax.x}px, ${spotlightParallax.y}px, 0) scale(1.06)`,
                    }}
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-60 group-hover:opacity-75 transition-[opacity,transform] duration-300 ease-out pointer-events-none select-none"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-[#0b0c0e]/70 to-black/25 pointer-events-none" />

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-[#f5dd1b] text-black font-mono font-bold text-[10.5px] rounded-[1px]">
                        {activeSpotlight.meta.code}
                      </span>
                      <span className="px-2 py-0.5 bg-black/70 border border-white/15 text-zinc-300 font-mono text-[10px] rounded-[1px]">
                        {activeSpotlight.meta.timeline}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#f5dd1b] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </div>

                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#f2f2ef] group-hover:text-white tracking-tight leading-snug">
                      {activeSpotlight.meta.titleKo}
                    </h2>
                    <div className="text-[10.5px] font-mono text-zinc-400 truncate">
                      {activeSpotlight.meta.titleEn}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300/90 line-clamp-2 leading-relaxed [word-break:keep-all]">
                    {activeSpotlight.meta.officialSynopsis}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 3. 3 Core Editorial Navigation Modules with Architectural SVG Schematics */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.09] border border-white/[0.09]"
        >
          {/* 01. 스토리 상세 */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onNavigateToStory(lastReading?.storyId || 'ep00', lastReading?.subPageId);
            }}
            className="bg-[#111215] hover:bg-[#16181d] p-5 sm:p-6 flex flex-col justify-between text-left transition-colors relative group cursor-pointer min-h-[154px] overflow-hidden"
          >
            <span className="absolute top-0 inset-x-0 h-[2px] bg-[#f5dd1b] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            {/* Bespoke Architectural Document Schematic Watermark */}
            <svg
              aria-hidden="true"
              viewBox="0 0 120 80"
              className="absolute right-3 bottom-3 w-24 h-16 text-white/[0.04] group-hover:text-white/[0.08] transition-colors pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect x="14" y="8" width="92" height="64" />
              <line x1="26" y1="22" x2="72" y2="22" />
              <line x1="26" y1="34" x2="94" y2="34" />
              <line x1="26" y1="44" x2="88" y2="44" />
              <line x1="26" y1="54" x2="64" y2="54" />
            </svg>

            <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-[#f5dd1b] transition-colors">
                01
              </span>
              <BookOpen className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </div>
            <div className="pt-6 space-y-1 relative z-10">
              <div className="text-[10px] font-mono tracking-wider text-zinc-500">
                STORY ARCHIVE
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-bold text-zinc-100 group-hover:text-white whitespace-nowrap">
                  스토리 상세
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#f5dd1b] group-hover:translate-x-1 transition-all shrink-0" />
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed [word-break:keep-all]">
                메인·이벤트 서사 본문 및 인물 열람
              </p>
            </div>
          </button>

          {/* 02. 스토리 목록 */}
          <button
            type="button"
            onClick={() => {
              playTabSwitchSound();
              onNavigateToView('chronicle');
            }}
            className="bg-[#111215] hover:bg-[#16181d] p-5 sm:p-6 flex flex-col justify-between text-left transition-colors relative group cursor-pointer min-h-[154px] overflow-hidden"
          >
            <span className="absolute top-0 inset-x-0 h-[2px] bg-[#f5dd1b] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            {/* Bespoke Architectural Node-Track Schematic */}
            <svg
              aria-hidden="true"
              viewBox="0 0 120 80"
              className="absolute right-3 bottom-3 w-24 h-16 text-white/[0.04] group-hover:text-white/[0.08] transition-colors pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <line x1="12" y1="24" x2="108" y2="24" />
              <line x1="12" y1="54" x2="108" y2="54" />
              <path d="M36 24 C 52 24, 52 54, 68 54" />
              <rect x="26" y="18" width="12" height="12" />
              <rect x="70" y="18" width="12" height="12" />
              <rect x="62" y="48" width="12" height="12" />
            </svg>

            <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-[#f5dd1b] transition-colors">
                02
              </span>
              <GitBranch className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </div>
            <div className="pt-6 space-y-1 relative z-10">
              <div className="text-[10px] font-mono tracking-wider text-zinc-500">
                CHRONICLE INDEX
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-bold text-zinc-100 group-hover:text-white whitespace-nowrap">
                  스토리 목록
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#f5dd1b] group-hover:translate-x-1 transition-all shrink-0" />
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed [word-break:keep-all]">
                서사 계통도 및 연대기 흐름 탐색
              </p>
            </div>
          </button>

          {/* 03. 테라 지도 */}
          <button
            type="button"
            onClick={() => {
              playTabSwitchSound();
              onNavigateToView('map');
            }}
            className="bg-[#111215] hover:bg-[#16181d] p-5 sm:p-6 flex flex-col justify-between text-left transition-colors relative group cursor-pointer min-h-[154px] overflow-hidden"
          >
            <span className="absolute top-0 inset-x-0 h-[2px] bg-[#f5dd1b] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            {/* Bespoke Topographic Contour Hex Rings */}
            <svg
              aria-hidden="true"
              viewBox="0 0 120 80"
              className="absolute right-3 bottom-3 w-24 h-16 text-white/[0.04] group-hover:text-white/[0.08] transition-colors pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <polygon points="60,8 92,24 92,56 60,72 28,56 28,24" />
              <polygon points="60,20 80,30 80,50 60,60 40,50 40,30" />
              <circle cx="60" cy="40" r="3" />
            </svg>

            <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-[#f5dd1b] transition-colors">
                03
              </span>
              <MapIcon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </div>
            <div className="pt-6 space-y-1 relative z-10">
              <div className="text-[10px] font-mono tracking-wider text-zinc-500">
                TERRA CARTOGRAPHY
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-bold text-zinc-100 group-hover:text-white whitespace-nowrap">
                  테라 지도
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#f5dd1b] group-hover:translate-x-1 transition-all shrink-0" />
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed [word-break:keep-all]">
                테라 22개 권역 및 작전 경로 브리핑
              </p>
            </div>
          </button>
        </motion.div>

        {/* 4. Curated & Recent Archive Strip */}
        <motion.div variants={PRTS_STAGGER_ITEM} className="w-full space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-2 text-zinc-300 font-semibold">
              <span className="w-1 h-3 bg-[#f5dd1b]" />
              <span>핵심 · 최근 열람 아카이브</span>
            </span>
            <button
              type="button"
              onClick={() => {
                playTabSwitchSound();
                onNavigateToView('chronicle');
              }}
              className="text-zinc-400 hover:text-[#f5dd1b] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>전체 연대기 보기</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div
            className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-1 md:pb-0 no-scrollbar"
            role="region"
            aria-label="핵심 및 최근 열람 아카이브 목록"
          >
            {curatedCards.map((item) => {
              const pct = item.scrollRatio !== undefined ? Math.round(item.scrollRatio * 100) : null;
              return (
                <button
                  key={item.storyId}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onNavigateToStory(item.storyId, item.subPageId);
                  }}
                  className="snap-start shrink-0 w-[235px] sm:w-[260px] md:w-auto group relative rounded-[2px] border border-white/[0.08] hover:border-white/25 bg-[#111215] hover:bg-[#16181d] overflow-hidden text-left transition-colors cursor-pointer flex flex-col"
                >
                  <div className="relative h-24 w-full bg-[#0b0c0e] overflow-hidden">
                    {item.meta.splashVisualUrl && (
                      <img
                        src={resolveAssetUrl(item.meta.splashVisualUrl)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="w-full h-full object-cover object-center opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300 pointer-events-none"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111215] via-[#111215]/40 to-transparent" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-zinc-100 text-black font-mono font-bold text-[10px] rounded-[1px]">
                        {item.meta.code}
                      </span>
                      <span className="px-1.5 py-0.5 bg-black/75 border border-white/10 text-zinc-300 font-mono text-[9.5px] rounded-[1px]">
                        {pct !== null ? `진행 ${pct}%` : item.badge}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                    <div className="text-xs sm:text-[13px] font-bold text-zinc-100 group-hover:text-[#f5dd1b] transition-colors truncate">
                      {item.meta.titleKo}
                    </div>
                    <div className="text-[10.5px] font-mono text-zinc-500 truncate">
                      {item.meta.timeline}
                    </div>
                  </div>
                  {pct !== null && pct > 0 && (
                    <div className="h-[2px] w-full bg-white/[0.06]">
                      <div className="h-full bg-[#f5dd1b]" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 5. Understated Rectangular Utility Bar */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="w-full pt-1 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400"
        >
          <div className="flex flex-wrap items-center gap-2">
            {isInstallable && onPromptInstall && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onPromptInstall();
                }}
                className="px-3 py-1.5 rounded-[2px] bg-[#111215] hover:bg-[#1a1c22] border border-white/[0.08] hover:border-white/25 text-zinc-200 hover:text-white font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <MonitorDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>웹 앱 설치 (PWA)</span>
              </button>
            )}

            {onOpenFullscreenGuide && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenFullscreenGuide();
                }}
                className="px-3 py-1.5 rounded-[2px] bg-[#111215] hover:bg-[#1a1c22] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-zinc-100 font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Maximize2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>전체 화면 &amp; 앱 설치 안내</span>
              </button>
            )}

            {onOpenServiceNotice && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenServiceNotice();
                }}
                className="px-3 py-1.5 rounded-[2px] bg-[#111215] hover:bg-[#1a1c22] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-zinc-100 font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>서비스 이용 안내 · 권장 환경</span>
              </button>
            )}
          </div>

          <span className="hidden sm:inline font-mono text-[10px] text-zinc-600 tracking-wider">
            UNOFFICIAL FAN NARRATIVE ARCHIVE
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

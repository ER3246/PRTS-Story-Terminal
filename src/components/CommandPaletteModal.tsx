import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  BookOpen,
  Users,
  MapPin,
  Compass,
  CornerDownLeft,
  X,
} from 'lucide-react';
import type { CharacterRef } from '../types/story';
import type { MainViewMode } from './Header';
import { storyRegistry, getStoryAccessState } from '../data/storyRegistry';
import { getAllMasterCharacters, resolveCharacterMaster } from '../data/db/characterResolver';
import { terraRegions } from '../data/terraRegions';
import { TacticalAvatar } from './TacticalAvatar';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getCharacterAvatarUrl } from '../utils/characterAssetHelper';
import { PRTS_MODAL_BACKDROP, PRTS_MODAL_PANEL } from '../utils/motion';
import { playClickSound, playCloseSound } from '../utils/soundEffects';

export type PaletteCategory = 'all' | 'story' | 'character' | 'region' | 'action';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory: (storyId: string) => void;
  onSelectCharacter: (char: CharacterRef) => void;
  onSelectRegion: (regionId: string) => void;
  onNavigateView: (view: MainViewMode) => void;
}

interface PaletteItem {
  id: string;
  kind: Exclude<PaletteCategory, 'all'>;
  title: string;
  subtitle: string;
  badge: string;
  searchBlob: string;
  avatarUrl?: string;
  accentColor?: string;
  onExecute: () => void;
}

const CATEGORY_TABS: { id: PaletteCategory; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'story', label: '스토리' },
  { id: 'character', label: '등장인물' },
  { id: 'region', label: '테라 권역' },
  { id: 'action', label: '화면 이동' },
];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectStory,
  onSelectCharacter,
  onSelectRegion,
  onNavigateView,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PaletteCategory>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo<PaletteItem[]>(() => {
    const actions: PaletteItem[] = [
      {
        id: 'act-home',
        kind: 'action',
        title: '메인 아카이브 대시보드',
        subtitle: '홈 화면 및 이어 읽기 요약 포털',
        badge: 'VIEW',
        searchBlob: '메인 홈 home dashboard index',
        onExecute: () => onNavigateView('home'),
      },
      {
        id: 'act-chronicle',
        kind: 'action',
        title: '스토리 목록 (연대기 로드맵)',
        subtitle: '시간순 · 서사별 · 출시순 90대 사건 흐름 탐색',
        badge: 'VIEW',
        searchBlob: '스토리 목록 연대기 chronicle timeline roadmap',
        onExecute: () => onNavigateView('chronicle'),
      },
      {
        id: 'act-map',
        kind: 'action',
        title: '테라 3D 전술 지도',
        subtitle: '22개 국가 권역 및 이동도시 · 작전 기동 경로',
        badge: 'VIEW',
        searchBlob: '테라 지도 월드맵 map 3d terra',
        onExecute: () => onNavigateView('map'),
      },
    ];

    const stories: PaletteItem[] = storyRegistry
      .filter((s) => s.status !== 'locked')
      .map((s) => {
        const access = getStoryAccessState(s);
        return {
          id: `story-${s.id}`,
          kind: 'story',
          title: s.titleKo,
          subtitle: `${s.titleEn} · ${s.timeline} · ${s.storyLineTitle}`,
          badge: s.code,
          accentColor: access === 'available' ? '#f5dd1b' : undefined,
          searchBlob: `${s.id} ${s.code} ${s.titleKo} ${s.titleEn} ${s.storyLineTitle} ${s.timeline}`.toLowerCase(),
          onExecute: () => onSelectStory(s.id),
        };
      });

    const characters: PaletteItem[] = getAllMasterCharacters().map((m) => {
      const resolved = resolveCharacterMaster(m.charId);
      const avatar = resolved.avatarUrl || getCharacterAvatarUrl(resolved);
      const aliases = (m.aliases || []).join(' ');
      return {
        id: `char-${m.charId}`,
        kind: 'character',
        title: m.nameKo,
        subtitle: `${m.defaultFaction} · ${m.defaultRole}`,
        badge: m.nameEn,
        avatarUrl: avatar ? resolveAssetUrl(avatar) : '',
        searchBlob: `${m.charId} ${m.nameKo} ${m.nameEn} ${m.defaultFaction} ${m.defaultRole} ${aliases}`.toLowerCase(),
        onExecute: () => onSelectCharacter(resolved),
      };
    });

    const regions: PaletteItem[] = terraRegions.map((r) => ({
      id: `reg-${r.id}`,
      kind: 'region',
      title: r.nameKo,
      subtitle: r.capital ? `${r.nameEn} · 거점 ${r.capital}` : r.nameEn,
      badge: 'SECTOR',
      accentColor: r.badgeColor,
      searchBlob: `${r.id} ${r.nameKo} ${r.nameEn} ${r.capital || ''} ${r.description}`.toLowerCase(),
      onExecute: () => onSelectRegion(r.id),
    }));

    return [...stories, ...characters, ...regions, ...actions];
  }, [onNavigateView, onSelectCharacter, onSelectRegion, onSelectStory]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = category === 'all' ? allItems : allItems.filter((i) => i.kind === category);

    if (!q) {
      if (category === 'all') {
        const defaultStories = pool.filter((i) => i.kind === 'story').slice(0, 6);
        const defaultChars = pool.filter((i) => i.kind === 'character').slice(0, 4);
        const defaultRegions = pool.filter((i) => i.kind === 'region').slice(0, 3);
        const defaultActions = pool.filter((i) => i.kind === 'action');
        return [...defaultActions, ...defaultStories, ...defaultChars, ...defaultRegions];
      }
      return pool.slice(0, 30);
    }

    const scored: { item: PaletteItem; score: number }[] = [];
    for (const item of pool) {
      const titleLower = item.title.toLowerCase();
      const badgeLower = item.badge.toLowerCase();
      if (titleLower === q || badgeLower === q) {
        scored.push({ item, score: 100 });
      } else if (titleLower.startsWith(q) || badgeLower.startsWith(q)) {
        scored.push({ item, score: 80 });
      } else if (titleLower.includes(q) || badgeLower.includes(q)) {
        scored.push({ item, score: 60 });
      } else if (item.searchBlob.includes(q)) {
        scored.push({ item, score: 30 });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 36).map((s) => s.item);
  }, [allItems, category, query]);

  const clampedIndex = filteredItems.length > 0 ? Math.min(activeIndex, filteredItems.length - 1) : 0;

  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current?.querySelector(`[data-palette-idx="${clampedIndex}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [clampedIndex, isOpen]);

  const handleClose = () => {
    playCloseSound();
    setQuery('');
    setCategory('all');
    setActiveIndex(0);
    onClose();
  };

  const executeItem = (item: PaletteItem) => {
    playClickSound();
    setQuery('');
    setCategory('all');
    setActiveIndex(0);
    onClose();
    item.onExecute();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter' && filteredItems[clampedIndex]) {
      e.preventDefault();
      executeItem(filteredItems[clampedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cmd-palette-backdrop"
          variants={PRTS_MODAL_BACKDROP}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-3 sm:px-4 overflow-hidden overscroll-contain"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prts-cmd-title"
            variants={PRTS_MODAL_PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#111215] border border-white/[0.14] rounded-[2px] shadow-2xl overflow-hidden flex flex-col max-h-[76vh] font-sans"
          >
            <div className="h-[2px] w-full bg-[#f5dd1b] shrink-0" />

            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#141519]">
              <Search className="w-4 h-4 text-[#f5dd1b] shrink-0" />
              <label id="prts-cmd-title" htmlFor="prts-cmd-input" className="sr-only">
                PRTS 통합 아카이브 색인 검색
              </label>
              <input
                id="prts-cmd-input"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="스토리명, 작전 코드(EP15), 인물(아미야), 테라 국가(카즈델) 통합 검색..."
                className="flex-1 bg-transparent text-sm text-[#f2f2ef] placeholder:text-zinc-500 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                  title="검색어 지우기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-[#0b0c0e] border border-white/[0.12] rounded-[1px]">
                ESC
              </kbd>
            </div>

            {/* Category Filter Strip */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.07] bg-[#0e0f12] overflow-x-auto no-scrollbar">
              {CATEGORY_TABS.map((tab) => {
                const isActive = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setCategory(tab.id);
                      setActiveIndex(0);
                      inputRef.current?.focus();
                    }}
                    className={`h-6.5 px-2.5 rounded-[2px] text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#f5dd1b] text-black font-bold'
                        : 'bg-[#16181d] hover:bg-[#1d2027] text-zinc-400 hover:text-zinc-100 border border-white/[0.07]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
              <span className="ml-auto text-[10px] font-mono text-zinc-500 pl-2 whitespace-nowrap">
                {filteredItems.length}건
              </span>
            </div>

            {/* Results List */}
            <div ref={listRef} className="flex-1 overflow-y-auto prts-modal-scroll divide-y divide-white/[0.04]">
              {filteredItems.length === 0 ? (
                <div className="py-14 px-6 text-center space-y-1.5">
                  <div className="text-xs font-mono text-zinc-400">NO MATCHING ARCHIVE RECORD</div>
                  <div className="text-[11px] text-zinc-500">
                    다른 키워드(한글/영문명, 작전 코드, 국가명)로 검색해 보세요.
                  </div>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = idx === clampedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-palette-idx={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => executeItem(item)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#1b1d24] border-l-2 border-l-[#f5dd1b]'
                          : 'hover:bg-[#16181d] border-l-2 border-l-transparent'
                      }`}
                    >
                      {/* Kind Icon or Character Avatar */}
                      {item.kind === 'character' ? (
                        <div className="w-8 h-8 rounded-[2px] border border-white/[0.12] overflow-hidden bg-black shrink-0">
                          <TacticalAvatar src={item.avatarUrl || ''} alt={item.title} className="w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-[2px] bg-[#16181d] border border-white/[0.08] flex items-center justify-center shrink-0">
                          {item.kind === 'story' && (
                            <BookOpen className={`w-4 h-4 ${item.accentColor ? 'text-[#f5dd1b]' : 'text-zinc-400'}`} />
                          )}
                          {item.kind === 'region' && (
                            <MapPin className="w-4 h-4" style={{ color: item.accentColor || '#b4b5bd' }} />
                          )}
                          {item.kind === 'action' && <Compass className="w-4 h-4 text-zinc-300" />}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[13px] font-bold text-[#f2f2ef] truncate">
                            {item.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded-[1px] shrink-0 ${
                              item.accentColor === '#f5dd1b'
                                ? 'bg-[#f5dd1b]/15 text-[#f5dd1b] border border-[#f5dd1b]/35 font-bold'
                                : 'bg-white/[0.06] text-zinc-400 border border-white/[0.08]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>

                      {item.kind === 'character' && (
                        <Users className="w-3.5 h-3.5 text-zinc-600 shrink-0 hidden sm:block" />
                      )}
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-[#f5dd1b] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2 border-t border-white/[0.08] bg-[#0e0f12] flex items-center justify-between text-[10.5px] font-mono text-zinc-500">
              <div className="flex items-center gap-3">
                <span>↑↓ 이동</span>
                <span>↵ 실행</span>
                <span>ESC 닫기</span>
              </div>
              <span className="hidden sm:inline text-zinc-400">PRTS ARCHIVE // UNIFIED INDEX</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

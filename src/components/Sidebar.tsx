import React, { useState, useMemo } from 'react';
import { storyRegistry, getStoryAccessState, STORY_LINES } from '../data/storyRegistry';
import type { StoryListItem } from '../data/storyRegistry';
import { FilmReelIcon } from './StorySplashModal';
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  ChevronRight,
  ChevronsUpDown,
  PanelLeftClose,
  X,
  Layers,
  BookOpen
} from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';
import { AnimatePresence, motion } from 'framer-motion';
import { PRTS_ACCORDION_CONTENT, PRTS_SPRING_SNAPPY } from '../utils/motion';

export type StoryCategoryFilter = 'all' | 'main' | 'events' | 'omnibus';
export type StorySortMode = 'tree' | 'story_line' | 'release' | 'chronological';

interface SidebarProps {
  activeStoryId: string;
  activeSubPageId?: string | null;
  onSelectStory: (id: string, subPageId?: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeCategory: StoryCategoryFilter;
  onChangeCategory: (cat: StoryCategoryFilter) => void;
  sortMode: StorySortMode;
  onChangeSortMode: (mode: StorySortMode) => void;
}

interface TreeSubFolder {
  id: string;
  titleKo: string;
  code?: string;
  color?: string;
  storyIds: string[];
}

interface TreeMainFolder {
  id: string;
  titleKo: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subFolders: TreeSubFolder[];
}

// 1. Curated Hierarchical Tree Taxonomy (인게임 스토리 목록의 서사별 분류와 100% 일치)
const buildFolderTaxonomy = (): TreeMainFolder[] => {
  const mainActs: TreeSubFolder[] = [
    {
      id: 'MAIN_ACT_1',
      titleKo: 'Act I · 각성과 환멸',
      code: 'ACT 01',
      color: '#ffe600',
      storyIds: storyRegistry.filter((s) => s.storyLineId === 'MAIN_ACT_1').map((s) => s.id),
    },
    {
      id: 'MAIN_ACT_2',
      titleKo: 'Act II · 석양의 런디니움',
      code: 'ACT 02',
      color: '#f59e0b',
      storyIds: storyRegistry.filter((s) => s.storyLineId === 'MAIN_ACT_2').map((s) => s.id),
    },
    {
      id: 'MAIN_ACT_3',
      titleKo: 'Act III · 분열의 서곡',
      code: 'ACT 03',
      color: '#a855f7',
      storyIds: storyRegistry.filter((s) => s.storyLineId === 'MAIN_ACT_3').map((s) => s.id),
    },
  ];

  // 이벤트 서사는 STORY_LINES의 서사별 분류 체계(방주, 들불, 쉐이, 라인 랩 등 14개 연작)와 완전히 동일하게 매핑
  const eventSubFolders: TreeSubFolder[] = STORY_LINES
    .filter((line) => !line.id.startsWith('MAIN_'))
    .map((line) => {
      const stories = storyRegistry.filter((s) => s.storyLineId === line.id);
      return {
        id: line.id,
        titleKo: line.titleKo,
        code: line.code,
        color: line.themeColor,
        storyIds: stories.map((s) => s.id),
      };
    });

  return [
    {
      id: 'MAIN_THEME',
      titleKo: '메인 테마',
      icon: BookOpen,
      color: '#ffe600',
      subFolders: mainActs,
    },
    {
      id: 'SIDE_STORIES',
      titleKo: '이벤트 서사',
      icon: Layers,
      color: '#38bdf8',
      subFolders: eventSubFolders,
    },
  ];
};

const FOLDER_TAXONOMY: TreeMainFolder[] = buildFolderTaxonomy();

export const Sidebar: React.FC<SidebarProps> = ({
  activeStoryId,
  activeSubPageId,
  onSelectStory,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  activeCategory,
  onChangeCategory,
  sortMode: _sortMode = 'tree',
  onChangeSortMode: _onChangeSortMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    MAIN_THEME: true,
    SIDE_STORIES: true,
  });
  const [expandedStorySubPages, setExpandedStorySubPages] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    playClickSound();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const toggleStorySubPages = (storyId: string) => {
    playClickSound();
    setExpandedStorySubPages((prev) => ({
      ...prev,
      [storyId]: !prev[storyId],
    }));
  };

  const storyLookup = useMemo(() => {
    const map = new Map<string, StoryListItem>();
    storyRegistry.forEach((s) => map.set(s.id, s));
    return map;
  }, []);

  // Quick Instant Search Filter
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    return storyRegistry.filter((s) => {
      const matchTitle = s.titleKo.toLowerCase().includes(q) || s.titleEn.toLowerCase().includes(q);
      const matchCode = s.code.toLowerCase().includes(q);
      const matchSub = s.subPages?.some((sp) => sp.label.toLowerCase().includes(q) || sp.code?.toLowerCase().includes(q));
      return matchTitle || matchCode || matchSub;
    });
  }, [searchQuery]);

  const handleSelectStoryItem = (storyId: string, subPageId?: string) => {
    playClickSound();
    onSelectStory(storyId, subPageId);
    onCloseMobile();
  };

  if (isCollapsed && !isOpenMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-14 left-0 h-full lg:h-[calc(100vh-3.5rem)] w-[85vw] max-w-xs sm:max-w-sm lg:w-80 bg-[#101114] border-r border-white/[0.08] flex flex-col z-50 lg:z-30 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Control Header */}
        <div className="p-3 border-b border-white/[0.08] space-y-2.5 bg-[#101114]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#f5dd1b] rounded-none" />
              <span className="text-xs font-extrabold text-white tracking-tight font-sans">스토리 색인</span>
              <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded-[2px] bg-[#16181d] border border-white/[0.06]">
                {searchResults ? `검색 ${searchResults.length}건` : `${storyRegistry.length}편`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  playClickSound();
                  const subFolderIds = FOLDER_TAXONOMY.flatMap((m) => m.subFolders.map((s) => s.id));
                  const anySubOpen = subFolderIds.some((id) => expandedFolders[id]);
                  const next: Record<string, boolean> = {
                    MAIN_THEME: true,
                    SIDE_STORIES: true,
                  };
                  subFolderIds.forEach((id) => {
                    next[id] = !anySubOpen;
                  });
                  setExpandedFolders(next);
                }}
                title="모든 서사 폴더 펼치기 / 접기"
                className="w-7 h-7 rounded-[2px] bg-[#16181d] hover:bg-[#1e2128] border border-white/[0.07] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onToggleCollapse}
                title="사이드바 접기"
                className="hidden lg:flex w-7 h-7 rounded-[2px] bg-[#16181d] hover:bg-[#1e2128] border border-white/[0.07] text-zinc-400 hover:text-white items-center justify-center transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onCloseMobile}
                title="닫기"
                className="lg:hidden w-7 h-7 rounded-[2px] bg-[#16181d] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="스토리명, 코드(EP, 론 트레일...) 검색"
              className="w-full h-8 pl-8 pr-7 bg-[#15161a] hover:bg-[#191b20] focus:bg-[#0c0c0e] border border-white/[0.08] focus:border-white/30 rounded-[2px] text-xs font-sans text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          {!searchQuery && (
            <div className="grid grid-cols-4 gap-1 p-1 rounded-[2px] bg-[#15161a] border border-white/[0.07] text-[11px] font-sans">
              {(
                [
                  { id: 'all', label: '전체' },
                  { id: 'main', label: '메인' },
                  { id: 'events', label: '이벤트' },
                  { id: 'omnibus', label: '옴니버스' },
                ] as { id: StoryCategoryFilter; label: string }[]
              ).map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playClickSound();
                      onChangeCategory(tab.id);
                    }}
                    className={`relative h-6.5 rounded-[1px] text-center transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-category-bg"
                        transition={PRTS_SPRING_SNAPPY}
                        className="absolute inset-0 rounded-[1px] bg-white/[0.08] pointer-events-none"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-category-bar"
                        transition={PRTS_SPRING_SNAPPY}
                        className="absolute bottom-0 inset-x-1 h-[1.5px] bg-[#f5dd1b] z-10"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tree Content Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 font-sans text-xs">
          {/* SEARCH RESULTS VIEW */}
          {searchResults ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 uppercase">
                Search Results ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  검색 결과가 없습니다.
                </div>
              ) : (
                searchResults.map((story) => {
                  const isActive = story.id === activeStoryId;
                  const accessState = getStoryAccessState(story);
                  const isRestored = accessState === 'available';

                  return (
                    <div
                      key={story.id}
                      onClick={() => handleSelectStoryItem(story.id)}
                      className={`px-2.5 py-2 rounded-[2px] border transition-colors cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-white/[0.07] border-[#f5dd1b]/70 text-white'
                          : 'bg-[#141519] border-white/[0.06] hover:bg-[#1a1c22] text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className={isActive ? 'text-[#f5dd1b] font-bold' : 'text-zinc-400'}>
                            {story.code}
                          </span>
                          <span className="text-zinc-600">/</span>
                          <span className="text-zinc-500 truncate">{story.categoryLabel}</span>
                        </div>
                        <div className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                          {story.titleKo}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {story.isOmnibus && (
                          <FilmReelIcon className="w-3 h-3 text-zinc-400 flex-shrink-0" title="옴니버스 단편" />
                        )}
                        <span
                          className={`w-1.5 h-1.5 flex-shrink-0 ${
                            isRestored ? 'bg-[#f5dd1b]' : 'bg-zinc-600'
                          }`}
                          title={isRestored ? '전문 수록' : '개요 수록'}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* HIERARCHICAL FOLDER & SUBFOLDER TREE VIEW */
            FOLDER_TAXONOMY.map((mainFolder) => {
              if (activeCategory === 'main' && mainFolder.id !== 'MAIN_THEME') return null;
              if ((activeCategory === 'events' || activeCategory === 'omnibus') && mainFolder.id !== 'SIDE_STORIES') return null;

              const isMainOpen = expandedFolders[mainFolder.id] ?? true;
              const MainIcon = mainFolder.icon;

              return (
                <div key={mainFolder.id} className="rounded-[2px] bg-[#131418] border border-white/[0.06] overflow-hidden mb-1.5">
                  {/* Level 1: Major Category Folder */}
                  <button
                    onClick={() => toggleFolder(mainFolder.id)}
                    className="w-full px-2.5 py-2 flex items-center justify-between bg-[#17181d] hover:bg-[#1d1f25] text-zinc-200 font-bold transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <motion.span
                        animate={{ rotate: isMainOpen ? 90 : 0 }}
                        transition={PRTS_SPRING_SNAPPY}
                        className="flex-shrink-0 flex items-center justify-center"
                      >
                        <ChevronRight className={`w-3.5 h-3.5 ${isMainOpen ? 'text-zinc-300' : 'text-zinc-500'}`} />
                      </motion.span>
                      <MainIcon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      <span className="text-xs tracking-tight truncate">{mainFolder.titleKo}</span>
                    </div>
                  </button>

                  {/* Level 2: Sub-Folders List */}
                  <AnimatePresence initial={false}>
                    {isMainOpen && (
                      <motion.div
                        key={`folder-${mainFolder.id}`}
                        variants={PRTS_ACCORDION_CONTENT}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="overflow-hidden"
                      >
                        <div className="p-1 space-y-1">
                      {mainFolder.subFolders.map((subFolder) => {
                        const isSubOpen = expandedFolders[subFolder.id] ?? false;
                        let subStories = subFolder.storyIds
                          .map((id) => storyLookup.get(id))
                          .filter(Boolean) as StoryListItem[];

                        if (activeCategory === 'omnibus') {
                          subStories = subStories.filter((s) => s.isOmnibus);
                        }

                        if (subStories.length === 0) return null;
                        const containsActive = subStories.some((s) => s.id === activeStoryId);

                        return (
                          <div key={subFolder.id} className="border-l border-white/[0.08] ml-2 pl-1.5">
                            {/* Subfolder Header */}
                            <button
                              onClick={() => toggleFolder(subFolder.id)}
                              className={`w-full px-2 py-1.5 rounded-[2px] flex items-center justify-between text-left transition-colors cursor-pointer ${
                                containsActive
                                  ? 'bg-white/[0.06] text-white'
                                  : 'text-zinc-300 hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isSubOpen ? (
                                  <FolderOpen className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
                                ) : (
                                  <Folder className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                                )}
                                <span className="text-[11px] font-semibold truncate tracking-tight">
                                  {subFolder.titleKo}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-zinc-500 px-1 py-0.2 rounded-[1px] bg-black/40 flex-shrink-0 whitespace-nowrap ml-1">
                                {subStories.length}
                              </span>
                            </button>

                            {/* Level 3: Story Document Nodes */}
                            <AnimatePresence initial={false}>
                              {isSubOpen && (
                                <motion.div
                                  key={`subfolder-${subFolder.id}`}
                                  variants={PRTS_ACCORDION_CONTENT}
                                  initial="collapsed"
                                  animate="expanded"
                                  exit="collapsed"
                                  className="overflow-hidden"
                                >
                                  <div className="mt-1 ml-3 space-y-0.5 border-l border-white/[0.07] pl-1.5">
                                {subStories.map((story) => {
                                  const isActiveStory = story.id === activeStoryId;
                                  const accessState = getStoryAccessState(story);
                                  const isRestored = accessState === 'available';
                                  const hasSubPages = story.subPages && story.subPages.length > 0;
                                  const isStorySubPagesExpanded = expandedStorySubPages[story.id] ?? false;

                                  return (
                                    <div key={story.id} className="space-y-0.5">
                                      {/* Story Node */}
                                      <div
                                        className={`group px-2 py-1.5 rounded-[2px] flex items-center justify-between transition-colors cursor-pointer ${
                                          isActiveStory && !activeSubPageId
                                            ? 'bg-white/[0.07] text-white font-bold border-l-2 border-[#f5dd1b]'
                                            : 'hover:bg-white/[0.04] text-zinc-300'
                                        }`}
                                        onClick={() => {
                                          if (hasSubPages) {
                                            toggleStorySubPages(story.id);
                                          }
                                          handleSelectStoryItem(story.id);
                                        }}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                                          {hasSubPages ? (
                                            <motion.span
                                              animate={{ rotate: isStorySubPagesExpanded ? 90 : 0 }}
                                              transition={PRTS_SPRING_SNAPPY}
                                              className="flex-shrink-0 flex items-center justify-center"
                                            >
                                              <ChevronRight className={`w-3 h-3 ${isStorySubPagesExpanded ? 'text-zinc-300' : 'text-zinc-500'}`} />
                                            </motion.span>
                                          ) : (
                                            <FileText className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0" />
                                          )}
                                          <span className="font-mono text-[10px] text-zinc-400 flex-shrink-0 whitespace-nowrap">
                                            {story.code}
                                          </span>
                                          <span className="truncate text-[11px] font-medium group-hover:text-white">
                                            {story.titleKo}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {story.isOmnibus && (
                                            <FilmReelIcon className="w-3 h-3 text-zinc-400 flex-shrink-0" title="옴니버스 단편" />
                                          )}
                                          {hasSubPages && (
                                            <span className="text-[9px] font-mono text-zinc-400 bg-white/[0.06] px-1 rounded-[1px] whitespace-nowrap">
                                              {story.subPages!.length}P
                                            </span>
                                          )}
                                          <span
                                            className={`w-1.5 h-1.5 ${
                                              isRestored ? 'bg-[#f5dd1b]' : 'bg-zinc-600'
                                            }`}
                                            title={isRestored ? '전문 복원 완료' : '개요 수록'}
                                          />
                                        </div>
                                      </div>

                                      {/* Sub-Pages Accordion */}
                                      <AnimatePresence initial={false}>
                                        {hasSubPages && isStorySubPagesExpanded && (
                                          <motion.div
                                            key={`subpages-${story.id}`}
                                            variants={PRTS_ACCORDION_CONTENT}
                                            initial="collapsed"
                                            animate="expanded"
                                            exit="collapsed"
                                            className="overflow-hidden"
                                          >
                                            <div className="ml-4 pl-2 border-l border-white/[0.08] space-y-0.5 py-0.5">
                                              {story.subPages!.map((sp) => {
                                                const isSubActive =
                                                  isActiveStory &&
                                                  (activeSubPageId === sp.id || (!activeSubPageId && sp.isOverview));

                                                return (
                                                  <div
                                                    key={sp.id}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleSelectStoryItem(story.id, sp.id);
                                                    }}
                                                    className={`px-2 py-1 rounded-[2px] flex items-center justify-between text-[10.5px] transition-colors cursor-pointer ${
                                                      isSubActive
                                                        ? 'bg-white/[0.08] text-white font-bold border-l-2 border-[#f5dd1b]'
                                                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-1.5 truncate">
                                                      {sp.isOverview ? (
                                                        <FileText className="w-2.5 h-2.5 flex-shrink-0 text-zinc-500" />
                                                      ) : (
                                                        <span className={`w-1 h-1 flex-shrink-0 ${isSubActive ? 'bg-[#f5dd1b]' : 'bg-zinc-600'}`} />
                                                      )}
                                                      <span className="truncate">{sp.label}</span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

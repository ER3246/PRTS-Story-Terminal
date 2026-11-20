import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { StoryArchive, CharacterRef, GlossaryTerm, StorySubPage } from '../types/story';
import type { StoryListItem } from '../data/storyRegistry';
import { globalCharacterMap } from '../data/globalCharacters';
import { resolveCharacterMaster, getMasterCharacter } from '../data/db/characterResolver';
import { getStoryAccessState, storyRegistry } from '../data/storyRegistry';
import { HighlightedText } from './HighlightedText';
import { FilmReelIcon } from './StorySplashModal';
import { CopyrightedImage, CopyrightBadge } from './CopyrightedImage';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getCharacterAvatarUrl } from '../utils/characterAssetHelper';
import { TacticalAvatar } from './TacticalAvatar';
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
  BookOpen,
  PanelTopClose,
  PanelTopOpen,
  X
} from 'lucide-react';
import { playTabSwitchSound, playClickSound, playOpenSound } from '../utils/soundEffects';
import { saveReadingProgress } from '../utils/readingProgress';
import { generateStoryMarkdown, downloadFile } from '../utils/exportMarkdown';
import { AnimatePresence, motion } from 'framer-motion';
import { PRTS_ACCORDION_CONTENT, PRTS_SPRING_SNAPPY } from '../utils/motion';
import { TacticalMetaRow } from './ui/TacticalPrimitives';

interface StoryViewerProps {
  story: StoryArchive;
  activeSubPageId?: string | null;
  onChangeSubPage?: (subId: string) => void;
  onSelectCharacter: (char: CharacterRef, initialVariantId?: string) => void;
  onSelectGlossary: (term: GlossaryTerm) => void;
  onOpenLightbox: (imageUrl: string, caption?: string, title?: string) => void;
  previousStory?: StoryListItem | null;
  nextStory?: StoryListItem | null;
  onSelectStory?: (id: string, subPageId?: string) => void;
  isHeaderCollapsed?: boolean;
  onToggleCollapseHeader?: () => void;
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
  isHeaderCollapsed = false,
  onToggleCollapseHeader,
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

  // 하위 페이지 목록 구성 (안정적인 참조 유지를 위해 useMemo 적용)
  const subPages: StorySubPage[] | undefined = useMemo(() => {
    if (docFormat !== 'multi_part' && docFormat !== 'omnibus') return undefined;
    if (story.subPages) return story.subPages;
    if (storyMeta?.subPages) return storyMeta.subPages;
    if (isOmnibus && story.omnibusSubEpisodes && story.omnibusSubEpisodes.length > 0) {
      return [
        { id: 'overview', label: '개요 (줄거리)', isOverview: true },
        ...story.omnibusSubEpisodes.map((sub) => ({
          id: sub.id,
          label: sub.titleKo,
          code: `EP.0${sub.order}`,
          focalCharacter: sub.mainCharacter
        }))
      ];
    }
    if (isMultiPart && story.multiPartArcs && story.multiPartArcs.length > 0) {
      return [
        { id: 'overview', label: '전체 요약 및 개요', isOverview: true },
        ...story.multiPartArcs.map((arc) => ({
          id: arc.id,
          label: arc.partTitleKo,
          code: arc.code || `PART 0${arc.partNumber}`,
          focalCharacter: arc.focalCharacter
        }))
      ];
    }
    return undefined;
  }, [docFormat, isOmnibus, isMultiPart, story.subPages, storyMeta?.subPages, story.omnibusSubEpisodes, story.multiPartArcs]);

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

  // 에피소드 또는 하위 페이지 전환 시 국면 및 스테이지 펼침 상태 초기화 (기본: 모두 펼침)
  const currentKey = `${story.id}:${activeSubPageId || 'overview'}`;
  const [prevStoryKey, setPrevStoryKey] = useState<string>(currentKey);

  if (currentKey !== prevStoryKey) {
    setPrevStoryKey(currentKey);
    setExpandedActs({});
    setExpandedStages({});
  }

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

  // 단일 진실 공급원(SSOT): story.characters를 마스터 DB 및 CG 자산 레지스트리와 실시간 정합
  const resolvedStoryCharacters = useMemo(() => {
    return story.characters.map((c) => resolveCharacterMaster(c.id, c));
  }, [story.characters]);

  const resolvedCharactersMap = useMemo(() => {
    const map = new Map<string, CharacterRef>();
    for (const c of resolvedStoryCharacters) {
      map.set(c.id, c);
    }
    return map;
  }, [resolvedStoryCharacters]);

  const getCharacterById = (id: string): CharacterRef | undefined => {
    if (resolvedCharactersMap.has(id)) {
      return resolvedCharactersMap.get(id);
    }
    const inStory = story.characters.find((c) => c.id === id || c.nameKo === id);
    if (inStory) {
      return resolveCharacterMaster(inStory.id, inStory);
    }
    const master = getMasterCharacter(id);
    if (master) {
      return resolveCharacterMaster(id);
    }
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

  // =========================================================================
  // 통합 하단 플로팅 네비게이션 독, 독서 진행도 저장 & Scroll-Spy 레일 상태
  // =========================================================================
  const [isPartDropupOpen, setIsPartDropupOpen] = useState<boolean>(false);
  const [showFloatingDock, setShowFloatingDock] = useState<boolean>(false);
  const [activeTocId, setActiveTocId] = useState<string>('');
  const dropupRef = useRef<HTMLDivElement>(null);
  const railPctRef = useRef<HTMLSpanElement>(null);
  const readingBarRef = useRef<HTMLDivElement>(null);

  const tocItems = useMemo(() => {
    if (isMultiPart && !isOverview && currentArc?.stages && currentArc.stages.length > 0) {
      return currentArc.stages.map((st) => ({
        id: `stage-section-${st.stageCode}`,
        code: st.stageCode,
        label: st.title,
        onJump: () => {
          playClickSound();
          setExpandedStages((prev) => ({ ...prev, [st.stageCode]: true }));
          requestAnimationFrame(() => {
            document.getElementById(`stage-section-${st.stageCode}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          });
        },
      }));
    }
    if (!isOmnibus && !isMultiPart && activeTab === 'timeline' && story.content.acts.length > 0) {
      return story.content.acts.map((act) => ({
        id: `act-section-${act.step}`,
        code: `0${act.step}`,
        label: `${act.phase} · ${act.title}`,
        onJump: () => {
          playClickSound();
          setExpandedActs((prev) => ({ ...prev, [act.step]: true }));
          requestAnimationFrame(() => {
            document.getElementById(`act-section-${act.step}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          });
        },
      }));
    }
    return [];
  }, [isMultiPart, isOmnibus, isOverview, activeTab, currentArc, story.content.acts]);

  const effectiveActiveTocId =
    activeTocId && tocItems.some((item) => item.id === activeTocId)
      ? activeTocId
      : tocItems[0]?.id ?? '';

  useEffect(() => {
    let lastSavedAt = 0;
    let latestRatio = 0;

    const updateScrollAndProgress = (forceSave: boolean) => {
      setShowFloatingDock(window.scrollY > 260);
      const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / docH));
      latestRatio = ratio;
      const pctStr = `${Math.round(ratio * 100)}%`;

      if (railPctRef.current) railPctRef.current.textContent = pctStr;
      if (readingBarRef.current) readingBarRef.current.style.width = pctStr;

      const now = Date.now();
      if (forceSave || now - lastSavedAt >= 600) {
        lastSavedAt = now;
        saveReadingProgress({
          storyId: story.id,
          subPageId: currentSubPageId,
          scrollRatio: ratio,
        });
      }
    };

    const onScroll = () => updateScrollAndProgress(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollAndProgress(true);

    return () => {
      window.removeEventListener('scroll', onScroll);
      saveReadingProgress({
        storyId: story.id,
        subPageId: currentSubPageId,
        scrollRatio: latestRatio,
      });
    };
  }, [story.id, currentSubPageId]);

  useEffect(() => {
    if (tocItems.length <= 1 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveTocId(visible[0].target.id);
        }
      },
      { rootMargin: '-18% 0px -65% 0px', threshold: 0.05 }
    );

    const els: HTMLElement[] = [];
    for (const item of tocItems) {
      const el = document.getElementById(item.id);
      if (el) {
        observer.observe(el);
        els.push(el);
      }
    }

    return () => {
      for (const el of els) observer.unobserve(el);
      observer.disconnect();
    };
  }, [tocItems]);

  // 드롭업 팝오버 외부 클릭 및 ESC 키 감지 시 닫기
  useEffect(() => {
    if (!isPartDropupOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropupRef.current && !dropupRef.current.contains(e.target as Node)) {
        setIsPartDropupOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPartDropupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPartDropupOpen]);

  // 멀티파트 유효 파트 목록 (개요 제외)
  const partList = useMemo(() => {
    if (isMultiPart) {
      return (subPages || []).filter((p) => !p.isOverview);
    }
    return [];
  }, [isMultiPart, subPages]);

  const pIdx = isMultiPart && !isOverview
    ? partList.findIndex((p) => p.id === currentSubPageId)
    : -1;

  // 옴니버스 에피소드 목록
  const epList = useMemo(() => {
    return story.omnibusSubEpisodes || [];
  }, [story.omnibusSubEpisodes]);

  const epIdx = isOmnibus && !isOverview
    ? epList.findIndex((ep) => ep.id === currentSubPageId)
    : -1;

  // 현재 위치 명칭 라벨
  let currentLocationLabel = '전체 개요';
  if (isMultiPart) {
    if (!isOverview && pIdx >= 0 && partList[pIdx]) {
      currentLocationLabel = partList[pIdx].label;
    } else {
      currentLocationLabel = '전체 개요';
    }
  } else if (isOmnibus) {
    if (!isOverview && currentEpisode) {
      currentLocationLabel = `EP.0${currentEpisode.order} ${currentEpisode.titleKo}`;
    } else {
      currentLocationLabel = '전체 개요';
    }
  } else {
    currentLocationLabel = `${story.code} 전편`;
  }

  // 이전/다음 네비게이션 대상 구조체
  interface NavTarget {
    type: 'part' | 'story' | 'overview';
    label: string;
    shortLabel: string;
    targetId?: string;
  }

  let prevNav: NavTarget | null = null;
  let nextNav: NavTarget | null = null;

  if (isMultiPart) {
    if (isOverview) {
      if (previousStory) {
        prevNav = {
          type: 'story',
          targetId: previousStory.id,
          label: `이전 작전: ${previousStory.code} ${previousStory.titleKo}`,
          shortLabel: previousStory.code,
        };
      }
      if (partList.length > 0) {
        nextNav = {
          type: 'part',
          targetId: partList[0].id,
          label: `${partList[0].label} 시작`,
          shortLabel: 'Part 1 시작',
        };
      } else if (nextStory) {
        nextNav = {
          type: 'story',
          targetId: nextStory.id,
          label: `다음 작전: ${nextStory.code} ${nextStory.titleKo}`,
          shortLabel: nextStory.code,
        };
      }
    } else if (pIdx >= 0) {
      if (pIdx > 0) {
        prevNav = {
          type: 'part',
          targetId: partList[pIdx - 1].id,
          label: `이전: ${partList[pIdx - 1].label}`,
          shortLabel: `Part ${pIdx}`,
        };
      } else {
        prevNav = {
          type: 'overview',
          label: '전체 개요로 이동',
          shortLabel: '전체 개요',
        };
      }

      if (pIdx < partList.length - 1) {
        nextNav = {
          type: 'part',
          targetId: partList[pIdx + 1].id,
          label: `다음: ${partList[pIdx + 1].label}`,
          shortLabel: `Part ${pIdx + 2}`,
        };
      } else {
        if (nextStory) {
          nextNav = {
            type: 'story',
            targetId: nextStory.id,
            label: `다음 작전: ${nextStory.code} ${nextStory.titleKo}`,
            shortLabel: nextStory.code,
          };
        } else {
          nextNav = {
            type: 'overview',
            label: '전체 개요로 이동',
            shortLabel: '전체 개요',
          };
        }
      }
    }
  } else if (isOmnibus) {
    if (isOverview) {
      if (previousStory) {
        prevNav = {
          type: 'story',
          targetId: previousStory.id,
          label: `이전 작전: ${previousStory.code} ${previousStory.titleKo}`,
          shortLabel: previousStory.code,
        };
      }
      if (epList.length > 0) {
        nextNav = {
          type: 'part',
          targetId: epList[0].id,
          label: `EP.01 ${epList[0].titleKo} 시작`,
          shortLabel: 'EP.01 시작',
        };
      } else if (nextStory) {
        nextNav = {
          type: 'story',
          targetId: nextStory.id,
          label: `다음 작전: ${nextStory.code} ${nextStory.titleKo}`,
          shortLabel: nextStory.code,
        };
      }
    } else if (epIdx >= 0) {
      if (epIdx > 0) {
        prevNav = {
          type: 'part',
          targetId: epList[epIdx - 1].id,
          label: `이전: EP.0${epList[epIdx - 1].order} ${epList[epIdx - 1].titleKo}`,
          shortLabel: `EP.0${epList[epIdx - 1].order}`,
        };
      } else {
        prevNav = {
          type: 'overview',
          label: '전체 개요로 이동',
          shortLabel: '전체 개요',
        };
      }

      if (epIdx < epList.length - 1) {
        nextNav = {
          type: 'part',
          targetId: epList[epIdx + 1].id,
          label: `다음: EP.0${epList[epIdx + 1].order} ${epList[epIdx + 1].titleKo}`,
          shortLabel: `EP.0${epList[epIdx + 1].order}`,
        };
      } else {
        if (nextStory) {
          nextNav = {
            type: 'story',
            targetId: nextStory.id,
            label: `다음 작전: ${nextStory.code} ${nextStory.titleKo}`,
            shortLabel: nextStory.code,
          };
        } else {
          nextNav = {
            type: 'overview',
            label: '전체 개요로 이동',
            shortLabel: '전체 개요',
          };
        }
      }
    }
  } else {
    // 단일 스토리
    if (previousStory) {
      prevNav = {
        type: 'story',
        targetId: previousStory.id,
        label: `이전 작전: ${previousStory.code} ${previousStory.titleKo}`,
        shortLabel: previousStory.code,
      };
    }
    if (nextStory) {
      nextNav = {
        type: 'story',
        targetId: nextStory.id,
        label: `다음 작전: ${nextStory.code} ${nextStory.titleKo}`,
        shortLabel: nextStory.code,
      };
    }
  }

  const handleExecuteNav = (target: NavTarget | null) => {
    if (!target) return;
    playClickSound();
    setIsPartDropupOpen(false);
    if (target.type === 'part' && target.targetId) {
      onChangeSubPage?.(target.targetId);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (target.type === 'overview') {
      onChangeSubPage?.('overview');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (target.type === 'story' && target.targetId) {
      handleNavigateStory(target.targetId);
    }
  };

  const renderFloatingDock = () => {
    const isDockVisible = showFloatingDock || isPartDropupOpen || isHeaderCollapsed;
    return (
      <aside
        ref={dropupRef}
        aria-label="스토리 빠른 네비게이션 독"
        aria-hidden={!isDockVisible}
        className={`fixed left-1/2 -translate-x-1/2 z-50 select-none font-sans transition-all duration-200 ${
          isDockVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        } ${
          isHeaderCollapsed
            ? 'bottom-3 md:bottom-6'
            : 'bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:bottom-6'
        }`}
      >
        {/* Dropup Quick Index Popover */}
        <AnimatePresence>
          {isPartDropupOpen && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-[92vw] max-w-sm sm:max-w-md z-50">
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={PRTS_SPRING_SNAPPY}
                className="w-full bg-[#121316]/98 backdrop-blur-md border border-white/15 rounded-[2px] shadow-2xl p-3 space-y-2 text-xs"
              >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 text-zinc-300">
              <span className="font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                <span>작전 색인 및 파트 점프</span>
              </span>
              <button
                onClick={() => {
                  playClickSound();
                  setIsPartDropupOpen(false);
                }}
                className="w-5 h-5 rounded-[2px] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer hover:bg-white/10"
                title="닫기 (ESC)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04] space-y-1 pr-1">
              {/* 멀티파트 또는 옴니버스인 경우: 전체 개요 및 파트 목록 */}
              {(isMultiPart || isOmnibus) && (
                <>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsPartDropupOpen(false);
                      onChangeSubPage?.('overview');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className={`w-full p-2.5 rounded-[2px] flex items-center justify-between transition-colors cursor-pointer ${
                      isOverview
                        ? 'bg-white/[0.08] text-white font-bold border-l-2 border-[#f5dd1b]'
                        : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <span>전체 개요 (시놉시스 및 사후 분석)</span>
                    </div>
                    {isOverview && <span className="text-[10px] bg-zinc-100 text-black px-1.5 py-0.2 rounded-[1px] font-bold">열람중</span>}
                  </button>

                  {isMultiPart &&
                    partList.map((sp, idx) => {
                      const isSelected = !isOverview && currentSubPageId === sp.id;
                      const arc = story.multiPartArcs?.find((a) => a.id === sp.id);
                      return (
                        <button
                          key={sp.id}
                          onClick={() => {
                            playClickSound();
                            setIsPartDropupOpen(false);
                            onChangeSubPage?.(sp.id);
                            window.scrollTo({ top: 0, behavior: 'instant' });
                          }}
                          className={`w-full p-2.5 rounded-[2px] flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-white/[0.08] text-white font-bold border-l-2 border-[#f5dd1b]'
                              : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded-[1px] bg-white/[0.07] text-zinc-200 font-bold shrink-0 whitespace-nowrap">
                              Part {idx + 1}
                            </span>
                            <span className="truncate">{sp.label.replace(/^Part \d+:\s*/, '')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap text-[11px] text-zinc-500 font-mono">
                            {arc?.stages && <span>{arc.stages.length}개 스테이지</span>}
                            {isSelected && <span className="text-[10px] bg-zinc-100 text-black px-1.5 py-0.2 rounded-[1px] font-bold shrink-0 whitespace-nowrap">열람중</span>}
                          </div>
                        </button>
                      );
                    })}

                  {isOmnibus &&
                    epList.map((ep) => {
                      const isSelected = !isOverview && currentSubPageId === ep.id;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => {
                            playClickSound();
                            setIsPartDropupOpen(false);
                            onChangeSubPage?.(ep.id);
                            window.scrollTo({ top: 0, behavior: 'instant' });
                          }}
                          className={`w-full p-2.5 rounded-[2px] flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-white/[0.08] text-white font-bold border-l-2 border-[#f5dd1b]'
                              : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded-[1px] bg-white/[0.07] text-zinc-200 font-bold shrink-0 whitespace-nowrap">
                              EP.0{ep.order}
                            </span>
                            <span className="truncate">{ep.titleKo}</span>
                          </div>
                          {isSelected && <span className="text-[10px] bg-zinc-100 text-black px-1.5 py-0.2 rounded-[1px] font-bold shrink-0 whitespace-nowrap">열람중</span>}
                        </button>
                      );
                    })}
                </>
              )}

              {/* 단일 스토리인 경우: 작전 내 탭/섹션 바로가기 */}
              {!isMultiPart && !isOmnibus && (
                <div className="space-y-1">
                  <div className="p-2 text-zinc-400 text-[11px]">
                    단일 작전 기록입니다. 주요 탭과 섹션으로 바로 이동할 수 있습니다.
                  </div>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsPartDropupOpen(false);
                      setActiveTab('timeline');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full p-2 rounded-[2px] flex items-center justify-between transition-colors cursor-pointer ${
                      activeTab === 'timeline'
                        ? 'bg-white/[0.08] text-white font-bold border-l-2 border-[#f5dd1b]'
                        : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span>핵심 타임라인 (전편 서사 및 국면)</span>
                    <span className="font-mono text-[11px] text-zinc-500 shrink-0 whitespace-nowrap">{story.content.acts.length}개 국면</span>
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsPartDropupOpen(false);
                      setActiveTab('dossier');
                    }}
                    className={`w-full p-2 rounded-[2px] flex items-center justify-between transition-colors cursor-pointer ${
                      activeTab === 'dossier'
                        ? 'bg-white/[0.08] text-white font-bold border-l-2 border-[#f5dd1b]'
                        : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span>작전 관계자 명부 (인물 도감)</span>
                    <span className="font-mono text-[11px] text-zinc-500 shrink-0 whitespace-nowrap">{resolvedStoryCharacters.length}명</span>
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsPartDropupOpen(false);
                      setActiveTab('glossary');
                    }}
                    className={`w-full p-2 rounded-[2px] flex items-center justify-between transition-colors cursor-pointer ${
                      activeTab === 'glossary'
                        ? 'bg-white/[0.08] text-white font-bold border-l-2 border-[#f5dd1b]'
                        : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span>관련 용어 사전</span>
                    <span className="font-mono text-[11px] text-zinc-500 shrink-0 whitespace-nowrap">{story.glossary.length}건</span>
                  </button>
                </div>
              )}
            </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Dock Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-[2px] bg-[#121316]/96 backdrop-blur-md border border-white/15 shadow-2xl">
          {/* Previous Target Button */}
          {prevNav ? (
            <button
              onClick={() => handleExecuteNav(prevNav)}
              className="h-8 px-2 sm:px-3 rounded-[2px] bg-[#181a20] hover:bg-[#22252d] text-zinc-300 hover:text-white border border-white/[0.07] flex items-center gap-1 text-[11.5px] sm:text-xs cursor-pointer transition-colors flex-shrink-0 group"
              title={prevNav.label}
            >
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
              <span className="hidden xs:inline truncate max-w-[85px] sm:max-w-[130px] font-medium">
                {prevNav.shortLabel}
              </span>
            </button>
          ) : (
            <div className="h-8 px-2 rounded-[2px] text-zinc-600 flex items-center text-[11px] font-mono select-none flex-shrink-0">
              <ChevronLeft className="w-3.5 h-3.5 opacity-30 mr-0.5" />
              <span className="hidden sm:inline">처음</span>
            </div>
          )}

          {/* Center Quick Part Index Trigger */}
          <button
            onClick={() => {
              playClickSound();
              setIsPartDropupOpen(!isPartDropupOpen);
            }}
            className={`h-8 px-3 sm:px-4 rounded-[2px] border transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold min-w-0 flex-shrink ${
              isPartDropupOpen
                ? 'bg-zinc-100 text-black border-white'
                : 'bg-[#1a1c22] hover:bg-[#22252d] text-zinc-100 border-white/15'
            }`}
            title="파트/색인 목록 펼치기 (클릭하여 다른 파트로 이동)"
          >
            {!isPartDropupOpen && <span className="w-1.5 h-1.5 bg-[#f5dd1b] shrink-0" />}
            <span className="truncate max-w-[100px] sm:max-w-[160px] md:max-w-[220px]">
              {currentLocationLabel}
            </span>
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${isPartDropupOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Next Target Button */}
          {nextNav ? (
            <button
              onClick={() => handleExecuteNav(nextNav)}
              className="h-8 px-2 sm:px-3 rounded-[2px] bg-[#181a20] hover:bg-[#22252d] text-zinc-300 hover:text-white border border-white/[0.07] flex items-center gap-1 text-[11.5px] sm:text-xs cursor-pointer transition-colors flex-shrink-0 group"
              title={nextNav.label}
            >
              <span className="hidden xs:inline truncate max-w-[85px] sm:max-w-[130px] font-medium">
                {nextNav.shortLabel}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
            </button>
          ) : (
            <div className="h-8 px-2 rounded-[2px] text-zinc-600 flex items-center text-[11px] font-mono select-none flex-shrink-0">
              <span className="hidden sm:inline">마지막</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-30 ml-0.5" />
            </div>
          )}

          {/* UI Collapsed (Reading Immersion) Toggle Button */}
          {onToggleCollapseHeader && (
            <>
              <div className="w-[1px] h-4 bg-white/10 hidden sm:block flex-shrink-0" />
              <button
                onClick={() => {
                  playClickSound();
                  onToggleCollapseHeader();
                }}
                className={`h-8 px-2.5 rounded-[2px] border flex items-center justify-center gap-1.5 text-[11px] font-medium cursor-pointer transition-colors flex-shrink-0 ${
                  isHeaderCollapsed
                    ? 'bg-[#f5dd1b] text-black border-[#f5dd1b] font-bold'
                    : 'bg-[#181a20] hover:bg-[#22252d] border-white/[0.07] text-zinc-400 hover:text-white'
                }`}
                title={isHeaderCollapsed ? '상단 메뉴 복원' : '상단 메뉴 숨기기 (독서 몰입)'}
              >
                {isHeaderCollapsed ? (
                  <PanelTopOpen className="w-3.5 h-3.5" />
                ) : (
                  <PanelTopClose className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isHeaderCollapsed ? '상단 복원' : '상단 숨김'}</span>
              </button>
            </>
          )}
        </div>
      </aside>
    );
  };

  // 하위 페이지 네비게이션 바 컴포넌트
  const renderSubPageBar = () => {
    if (!subPages || subPages.length <= 1) return null;

    return (
      <nav
        aria-label="챕터 네비게이션"
        className="flex items-center gap-1 p-1 bg-[#121316] border border-white/[0.08] rounded-[2px] overflow-x-auto no-scrollbar scroll-smooth select-none font-sans"
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
              className={`relative h-8 px-3.5 rounded-[1px] text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                isSelected
                  ? 'text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="story-subpage-bg"
                  transition={PRTS_SPRING_SNAPPY}
                  className="absolute inset-0 rounded-[1px] bg-white/[0.08] pointer-events-none"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {sp.isOverview ? (
                  <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                ) : isOmnibus ? (
                  <FilmReelIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                ) : sp.code ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-[1px] font-mono text-[10px] font-bold ${
                      isSelected
                        ? 'bg-zinc-100 text-black'
                        : 'bg-[#1a1c22] text-zinc-400'
                    }`}
                  >
                    {sp.code}
                  </span>
                ) : null}
                <span>{cleanLabel}</span>
              </span>
              {isSelected && (
                <motion.span
                  layoutId="story-subpage-bar"
                  transition={PRTS_SPRING_SNAPPY}
                  className="absolute bottom-0 inset-x-1 h-[2px] bg-[#f5dd1b] z-10"
                />
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
                className="text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer font-semibold transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
                <span>{story.titleKo}</span>
              </button>
              <span className="text-zinc-600">/</span>
              <span className="font-mono text-[#f5dd1b] font-bold">EP.0{currentEpisode.order}</span>
              <span className="text-zinc-100 font-bold truncate">{currentEpisode.titleKo}</span>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onChangeSubPage?.('overview');
              }}
              className="h-7 px-3 rounded-[2px] bg-[#141519] hover:bg-[#1d1f26] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
            >
              전체 개요로 돌아가기
            </button>
          </div>

          {/* Sub-Page Selector Bar */}
          {renderSubPageBar()}

          {/* Episode Header Banner */}
          <div className="relative rounded-[2px] border border-white/[0.09] bg-[#121316] overflow-hidden p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-100 text-black font-mono font-bold px-2 py-0.5 text-xs rounded-[1px]">
                  EPISODE 0{currentEpisode.order}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-semibold">
                  {story.titleKo} <span className="font-mono text-zinc-500">({story.code})</span>
                </span>
              </div>
              {currentEpisode.mainCharacter && (
                <span className="px-2.5 py-1 rounded-[2px] bg-[#17191d] border border-white/[0.08] text-zinc-200 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#f5dd1b]" />
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
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#17191d] border border-white/[0.07]">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{currentEpisode.timeline}</span>
                  </span>
                )}
                {currentEpisode.location && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#17191d] border border-white/[0.07]">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{currentEpisode.location}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Official Scene CG (If available) */}
          {currentEpisode.cgUrl && currentEpisode.cgUrl.trim() !== '' && (
            <div className="group relative rounded-[2px] border border-white/[0.11] bg-[#08090b] overflow-hidden shadow-lg">
              <CopyrightedImage
                src={currentEpisode.cgUrl}
                alt={currentEpisode.titleKo}
                className="w-full h-auto object-cover max-h-[500px] transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d0e11] border-t border-white/[0.08] text-xs">
                {currentEpisode.cgCaption ? (
                  <span className="text-zinc-300 truncate pr-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#f5dd1b]" />
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
                  className="h-7 px-2.5 rounded-[2px] flex items-center gap-1.5 text-zinc-300 hover:text-black bg-[#16181d] hover:bg-zinc-100 border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0 ml-auto"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">원화 확대</span>
                </button>
              </div>
            </div>
          )}

          {/* Episode Narrative Body */}
          <div className="p-6 sm:p-8 rounded-[2px] border border-white/[0.08] bg-[#121316] space-y-6">
            <div className="max-w-[74ch] text-[15px] sm:text-[15.5px] text-zinc-200 leading-[1.88] font-sans space-y-5 [word-break:keep-all] break-words">
              {(currentEpisode.narrativeText || currentEpisode.synopsis).split('\n\n').map((para, pIdx) => (
                <p key={pIdx}>
                  <HighlightedText
                    text={para}
                    characters={resolvedStoryCharacters}
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
                  const quoteAvatar = q.avatarUrl
                    ? resolveAssetUrl(q.avatarUrl)
                    : (speakerChar && getCharacterAvatarUrl(speakerChar) ? resolveAssetUrl(getCharacterAvatarUrl(speakerChar)) : '');
                  return (
                    <div
                      key={qIdx}
                      className="p-4 rounded-none bg-[#16181d] border border-white/[0.05] border-l-2 border-l-zinc-400 flex gap-3.5 items-start"
                    >
                      {(quoteAvatar || speakerChar) && (
                        <div
                          onClick={() => speakerChar && onSelectCharacter(speakerChar, q.variantId)}
                          className={`w-11 h-11 rounded-[2px] border border-white/15 overflow-hidden bg-black flex-shrink-0 transition-colors ${speakerChar ? 'cursor-pointer hover:border-[#f5dd1b]' : ''}`}
                          title={speakerChar ? `${speakerChar.nameKo} 프로필 열람` : q.speaker}
                        >
                          <TacticalAvatar
                            src={quoteAvatar}
                            alt={q.speaker}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span
                            onClick={() => speakerChar && onSelectCharacter(speakerChar, q.variantId)}
                            className={`font-bold text-zinc-100 ${speakerChar ? 'cursor-pointer hover:text-[#f5dd1b] hover:underline' : ''}`}
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
                <span className="text-xs font-semibold text-zinc-500 mr-1 shrink-0 whitespace-nowrap">등장인물</span>
                {currentEpisode.involvedCharacters.map((cId) => {
                  const char = getCharacterById(cId);
                  if (char) {
                    return (
                      <button
                        key={cId}
                        onClick={() => {
                          playClickSound();
                          onSelectCharacter(char);
                        }}
                        className="h-7 pl-1.5 pr-2.5 rounded-[2px] flex items-center gap-1.5 bg-[#16181d] hover:bg-[#1e2128] border border-white/[0.08] hover:border-white/25 text-xs text-zinc-200 hover:text-white transition-colors cursor-pointer"
                        title={`${char.nameKo} (${char.role}) 프로필 열람`}
                      >
                        <TacticalAvatar
                          src={getCharacterAvatarUrl(char) ? resolveAssetUrl(getCharacterAvatarUrl(char)) : ''}
                          alt={char.nameKo}
                          className="w-4.5 h-4.5 rounded-[1px]"
                        />
                        <span className="font-medium">{char.nameKo}</span>
                      </button>
                    );
                  }
                  return (
                    <span
                      key={cId}
                      className="h-7 px-2.5 rounded-[2px] flex items-center gap-1.5 bg-[#16181d] border border-white/[0.06] text-xs text-zinc-400 select-none cursor-default font-mono"
                      title="인물 명부 미등재 단역"
                    >
                      <span className="w-1 h-1 bg-zinc-600" />
                      <span>{cId}</span>
                    </span>
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
                    className="w-full sm:w-auto h-10 px-4 rounded-[2px] bg-[#121316] hover:bg-[#181a20] border border-white/[0.08] hover:border-white/25 text-zinc-300 hover:text-white flex items-center gap-2 cursor-pointer transition-colors font-medium"
                  >
                    <ChevronLeft className="w-4 h-4 text-zinc-400" />
                    <span>이전 단편: {prevEp.titleKo}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.('overview');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[2px] bg-[#121316] hover:bg-[#181a20] border border-white/[0.08] hover:border-white/25 text-zinc-400 hover:text-white flex items-center gap-2 cursor-pointer transition-colors font-medium"
                  >
                    <FileText className="w-4 h-4 text-zinc-400" />
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
                    className="w-full sm:w-auto h-10 px-4 rounded-[2px] bg-[#121316] hover:bg-[#181a20] border border-white/[0.08] hover:border-white/25 text-zinc-300 hover:text-white flex items-center justify-end gap-2 cursor-pointer transition-colors ml-auto font-medium"
                  >
                    <span>다음 단편: {nextEp.titleKo}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.('overview');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-4 rounded-[2px] bg-[#121316] hover:bg-[#181a20] border border-white/[0.08] hover:border-white/25 text-zinc-400 hover:text-white flex items-center justify-end gap-2 cursor-pointer transition-colors ml-auto font-medium"
                  >
                    <span>전체 개요 및 사후 분석</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
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
                className="text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer font-semibold transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
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
              className="h-7 px-3 rounded-[2px] bg-[#141519] hover:bg-[#1d1f26] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
            >
              전체 개요로 돌아가기
            </button>
          </div>

          {/* Sub-Page Selector Bar */}
          {renderSubPageBar()}

          {/* MultiPart Chapter Header Banner */}
          <div className="relative rounded-[2px] border border-white/[0.09] bg-[#121316] overflow-hidden p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-100 text-black font-mono font-bold px-2 py-0.5 text-xs rounded-[1px]">
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
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#17191d] border border-white/[0.07]">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{currentArc.timeline}</span>
                  </span>
                )}
                {currentArc.location && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#17191d] border border-white/[0.07]">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{currentArc.location}</span>
                  </span>
                )}
              </div>
            )}

            {/* Part Tactical Briefing Card */}
            {(currentArc?.narrativeText || currentArc?.synopsis) && (
              <div className="pt-4 border-t border-white/[0.07]">
                <p className="text-sm text-zinc-300 font-sans leading-relaxed [word-break:keep-all] pl-3.5 border-l-2 border-[#f5dd1b]">
                  {currentArc.narrativeText || currentArc.synopsis}
                </p>
              </div>
            )}
          </div>

          {/* Quick Stage Jump & Expand/Collapse Control Bar */}
          {currentArc?.stages && currentArc.stages.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-[2px] bg-[#121316] border border-white/[0.08] text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#f5dd1b] ml-1" />
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
                      className="h-7 px-2.5 rounded-[2px] bg-[#17191d] hover:bg-[#1f222a] text-zinc-300 hover:text-white border border-white/[0.07] hover:border-white/25 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 group"
                    >
                      <span className="font-mono font-bold text-zinc-300 group-hover:text-[#f5dd1b] text-[11px]">
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
                className="h-7 px-2.5 rounded-[2px] bg-[#17191d] hover:bg-[#1f222a] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer"
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">{isAllStagesExpanded ? '모두 접기' : '모두 펼치기'}</span>
              </button>
            </div>
          )}

          {/* Multiple Top-level Stage Cards */}
          <div className="space-y-6">
            {currentArc?.stages?.map((st, sIdx) => {
              const isExpanded = expandedStages[st.stageCode] !== false;

              return (
                <section
                  key={st.stageCode}
                  id={`stage-section-${st.stageCode}`}
                  className={`rounded-[2px] border border-white/[0.08] bg-[#121316] overflow-hidden transition-colors scroll-mt-20 ${
                    sIdx >= 2 ? 'prts-cv-auto' : ''
                  }`}
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleStage(st.stageCode)}
                    className="px-4 sm:px-6 py-3 sm:py-3.5 bg-[#16181d] hover:bg-[#1a1d23] border-b border-white/[0.07] cursor-pointer select-none group transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 bg-zinc-200 text-black font-mono font-bold text-xs flex-shrink-0 rounded-[1px]">
                          {st.stageCode}
                        </span>
                        {st.timeMarker && (
                          <span className="text-[11px] font-mono text-zinc-400 hidden sm:flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3 text-zinc-500" />
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
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                            <span className="truncate">{st.location}</span>
                          </div>
                        )}

                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={PRTS_SPRING_SNAPPY}
                          className="w-7 h-7 rounded-[2px] bg-[#1c1e24] group-hover:bg-[#252830] text-zinc-400 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Title Row: Full-width allocation preventing cramped word wrapping */}
                    <h2 className="text-base sm:text-[17px] font-bold text-white tracking-tight transition-colors [word-break:keep-all] break-keep leading-snug">
                      {st.title}
                    </h2>
                  </div>

                  {/* Collapsed State Summary Preview */}
                  {!isExpanded && st.summary && (
                    <div
                      onClick={() => toggleStage(st.stageCode)}
                      className="px-5 py-3.5 bg-[#101114] hover:bg-[#16181d] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs text-zinc-400"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                        <span className="text-[10.5px] font-bold text-zinc-200 bg-white/[0.06] border border-white/15 px-2 py-0.5 rounded-[1px] flex-shrink-0 whitespace-nowrap">
                          요약
                        </span>
                        <span className="truncate text-zinc-300">{st.summary}</span>
                      </div>
                      <span className="text-xs font-medium text-zinc-300 flex-shrink-0 whitespace-nowrap flex items-center gap-1">
                        <span>펼쳐보기</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}

                  {/* Expanded Stage Body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key={`stage-body-${st.stageCode}`}
                        variants={PRTS_ACCORDION_CONTENT}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="overflow-hidden"
                      >
                        <div className="p-5 sm:p-7 space-y-6">
                      {/* Lead Summary Callout */}
                      {st.summary && (
                        <div className="px-4 py-3 rounded-none bg-[#16181d] border border-white/[0.06] border-l-2 border-l-[#f5dd1b] text-sm text-zinc-200 leading-relaxed [word-break:keep-all]">
                          {st.summary}
                        </div>
                      )}

                      {/* Visual CGs */}
                      {st.visuals && st.visuals.length > 0 ? (
                        <div className="space-y-4">
                          {st.visuals.map((vis, vIdx) => (
                            <div key={vIdx} className="group relative rounded-[2px] border border-white/[0.11] bg-[#08090b] overflow-hidden shadow-lg">
                              <CopyrightedImage
                                src={vis.url}
                                alt={vis.caption}
                                className="w-full h-auto object-cover max-h-[460px] transition-transform duration-500 group-hover:scale-[1.01]"
                              />
                              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d0e11] border-t border-white/[0.08] text-xs">
                                <span className="text-zinc-300 truncate pr-4 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-[#f5dd1b]" />
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
                                  className="h-7 px-2.5 rounded-[2px] flex items-center gap-1.5 text-zinc-300 hover:text-black bg-[#16181d] hover:bg-zinc-100 border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0 ml-auto"
                                  title="원문 CG 전체화면 확대"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-medium">원화 확대</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : st.cgUrl && st.cgUrl.trim() !== '' ? (
                        <div className="group relative rounded-[2px] border border-white/[0.11] bg-[#08090b] overflow-hidden shadow-lg">
                          <CopyrightedImage
                            src={st.cgUrl}
                            alt={st.title}
                            className="w-full h-auto object-cover max-h-[460px] transition-transform duration-500 group-hover:scale-[1.01]"
                          />
                          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d0e11] border-t border-white/[0.08] text-xs">
                            <span className="text-zinc-300 truncate pr-4 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-[#f5dd1b]" />
                              <span>{st.cgCaption || st.title}</span>
                            </span>
                            <button
                              onClick={() => {
                                playOpenSound();
                                onOpenLightbox(st.cgUrl!, st.cgCaption, st.title);
                              }}
                              className="h-7 px-2.5 rounded-[2px] flex items-center gap-1.5 text-zinc-300 hover:text-black bg-[#16181d] hover:bg-zinc-100 border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0 ml-auto"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-medium">원화 확대</span>
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Main Narrative Body */}
                      <div className="max-w-[74ch] text-[15px] sm:text-[15.5px] text-zinc-200 leading-[1.88] [word-break:keep-all] break-words font-sans space-y-5">
                        {st.narrativeText.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>
                            <HighlightedText
                              text={paragraph}
                              characters={resolvedStoryCharacters}
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
                            const quoteAvatar = q.avatarUrl
                              ? resolveAssetUrl(q.avatarUrl)
                              : (speakerChar && getCharacterAvatarUrl(speakerChar) ? resolveAssetUrl(getCharacterAvatarUrl(speakerChar)) : '');
                            return (
                              <div
                                key={qIdx}
                                className="p-4 rounded-none bg-[#16181d] border border-white/[0.05] border-l-2 border-l-zinc-400 flex gap-3.5 items-start"
                              >
                                {(quoteAvatar || speakerChar) ? (
                                  <div
                                    onClick={() => {
                                      if (speakerChar) {
                                        playClickSound();
                                        onSelectCharacter(speakerChar, q.variantId);
                                      }
                                    }}
                                    className={`w-11 h-11 rounded-[2px] border border-white/15 overflow-hidden bg-black flex-shrink-0 transition-colors ${speakerChar ? 'cursor-pointer hover:border-[#f5dd1b]' : ''}`}
                                    title={speakerChar ? `${speakerChar.nameKo} 프로필 열람` : q.speaker}
                                  >
                                    <TacticalAvatar
                                      src={quoteAvatar}
                                      alt={q.speaker}
                                      className="w-full h-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-11 h-11 rounded-[2px] border border-white/10 bg-[#141519] overflow-hidden flex-shrink-0">
                                    <TacticalAvatar
                                      src=""
                                      alt={q.speaker}
                                      className="w-full h-full"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span
                                      onClick={() => {
                                        if (speakerChar) {
                                          playClickSound();
                                          onSelectCharacter(speakerChar, q.variantId);
                                        }
                                      }}
                                      className={`font-bold text-zinc-100 ${speakerChar ? 'cursor-pointer hover:text-[#f5dd1b] hover:underline' : ''}`}
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
                          <span className="text-xs font-semibold text-zinc-500 mr-1 shrink-0 whitespace-nowrap">등장인물</span>
                          {st.involvedCharacters.map((cId) => {
                            const char = getCharacterById(cId);
                            if (char) {
                              return (
                                <button
                                  key={cId}
                                  onClick={() => {
                                    playClickSound();
                                    onSelectCharacter(char);
                                  }}
                                  className="h-7 pl-1.5 pr-2.5 rounded-[2px] flex items-center gap-1.5 bg-[#16181d] hover:bg-[#1e2128] border border-white/[0.08] hover:border-white/25 text-xs text-zinc-200 hover:text-white transition-colors cursor-pointer"
                                  title={`${char.nameKo} (${char.role}) 프로필 열람`}
                                >
                                  <TacticalAvatar
                                    src={getCharacterAvatarUrl(char) ? resolveAssetUrl(getCharacterAvatarUrl(char)) : ''}
                                    alt={char.nameKo}
                                    className="w-4.5 h-4.5 rounded-[1px]"
                                  />
                                  <span className="font-medium">{char.nameKo}</span>
                                </button>
                              );
                            }
                            return (
                              <span
                                key={cId}
                                className="h-7 px-2.5 rounded-[2px] flex items-center gap-1.5 bg-[#16181d] border border-white/[0.06] text-xs text-zinc-400 select-none cursor-default font-mono"
                                title="인물 명부 미등재 단역"
                              >
                                <span className="w-1 h-1 bg-zinc-600" />
                                <span>{cId}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              );
            })}
          </div>

          {/* Chapter Milestone Complete Notice Card */}
          {(() => {
            const nextP = pIdx >= 0 && pIdx < partList.length - 1 ? partList[pIdx + 1] : null;

            return (
              <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-1.5 h-1.5 bg-[#f5dd1b]" />
                  <span>
                    현재 파트 열람 완료 (<strong className="text-zinc-200">{currentArc?.partTitleKo || '챕터'}</strong>)
                  </span>
                </div>

                {nextP ? (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.(nextP.id);
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-5 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black border border-white flex items-center justify-center gap-2 cursor-pointer transition-colors font-bold"
                  >
                    <span>다음 파트 계속 읽기: {nextP.label}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      onChangeSubPage?.('overview');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto h-10 px-5 rounded-[2px] bg-[#15161a] hover:bg-[#1d1f25] text-zinc-200 hover:text-white border border-white/[0.1] hover:border-white/25 flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium"
                  >
                    <span>전체 개요 및 사후 분석으로 돌아가기</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
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
          <section className="relative w-full rounded-[2px] overflow-hidden border border-white/[0.09] bg-[#121316]">
            {/* Background Banner Image Container */}
            <div className="relative w-full min-h-[320px] sm:min-h-[380px] lg:h-[420px] bg-[#0c0d10] overflow-hidden select-none flex flex-col justify-between p-5 sm:p-7 lg:p-9">
              <img
                src={resolveAssetUrl(story.bannerImage)}
                alt={story.titleKo}
                fetchPriority="high"
                decoding="async"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-75 pointer-events-none select-none"
              />
              <CopyrightBadge />

              {/* Clean Editorial Vignette Overlays (Neutral dark contrast) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-[#121316]/65 to-black/25 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121316]/85 via-transparent to-[#121316]/50 pointer-events-none" />

              {/* Top Meta Badge Row */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 px-2.5 bg-zinc-100 text-black font-mono font-bold text-xs tracking-wider rounded-[1px] flex items-center">
                    {story.code}
                  </span>
                  <span className="h-6 px-2.5 rounded-[1px] bg-[#121316]/85 border border-white/15 text-zinc-200 font-mono font-semibold text-[11px] flex items-center">
                    {story.titleEn.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {accessState === 'available' ? (
                    <span className="h-7 px-3 rounded-[2px] bg-[#121316]/90 border border-white/15 text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#f5dd1b]" />
                      <span>전문 복원 완료</span>
                    </span>
                  ) : accessState === 'overview_only' ? (
                    <span className="h-7 px-3 rounded-[2px] bg-[#121316]/90 border border-white/15 text-zinc-300 text-xs font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-zinc-400" />
                      <span>공식 개요 수록</span>
                    </span>
                  ) : (
                    <span className="h-7 px-3 rounded-[2px] bg-red-950/80 border border-red-800/70 text-red-300 text-xs font-medium flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-red-400" />
                      <span>열람 제한</span>
                    </span>
                  )}

                  {accessState === 'available' && (
                    <button
                      onClick={handleExportStoryMarkdown}
                      title="현재 작전 보고서를 마크다운(.md) 파일로 다운로드합니다"
                      className="h-7 px-3 rounded-[2px] bg-[#121316]/90 hover:bg-zinc-100 text-zinc-200 hover:text-black border border-white/15 hover:border-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 group"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black" />
                      <span className="hidden sm:inline">문서 내보내기 (.MD)</span>
                      <span className="sm:hidden">.MD</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hero Content: Title & Category */}
              <div className="relative z-10 space-y-2 pt-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  <Activity className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{story.categoryLabel}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400 font-medium">{story.actGroup}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight [word-break:keep-all] break-words leading-tight">
                  {story.titleKo}
                </h1>
              </div>
            </div>

            {/* Editorial Metadata Strip & Operation Summary */}
            <div className="px-5 sm:px-7 lg:px-9 pb-7 pt-5 space-y-6 bg-[#121316] border-t border-white/[0.07]">
              {/* 3-Column Editorial Metadata Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-white/[0.07] text-xs">
                <div className="space-y-1 sm:border-r border-white/[0.07] sm:pr-4">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>배경 시점</span>
                  </div>
                  <div className="text-zinc-100 font-medium text-xs sm:text-[13px] [word-break:keep-all] break-words leading-snug pl-5">
                    {story.meta.timeline}
                  </div>
                </div>

                <div className="space-y-1 sm:border-r border-white/[0.07] sm:pr-4">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>배경 지역</span>
                  </div>
                  <div className="text-zinc-100 font-medium text-xs sm:text-[13px] [word-break:keep-all] break-words leading-snug pl-5">
                    {story.meta.location}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
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
                <div className="text-sm sm:text-[15.5px] text-white font-semibold leading-relaxed break-keep pl-4 border-l-2 border-[#f5dd1b]">
                  {story.content.logline}
                </div>

                {/* Detailed Narrative Background */}
                <div className="text-zinc-300 text-xs sm:text-sm leading-[1.8] break-keep font-sans">
                  <HighlightedText
                    text={story.content.background}
                    characters={resolvedStoryCharacters}
                    glossary={story.glossary}
                    onSelectCharacter={onSelectCharacter}
                    onSelectGlossary={onSelectGlossary}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. EDITORIAL SEGMENTED TAB BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-[2px] bg-[#121316] border border-white/[0.08] text-xs font-sans overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  playTabSwitchSound();
                  setActiveTab('timeline');
                }}
                className={`relative h-8 px-4 rounded-[1px] transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'timeline'
                    ? 'text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                {activeTab === 'timeline' && (
                  <motion.span
                    layoutId="story-main-tab-bg"
                    transition={PRTS_SPRING_SNAPPY}
                    className="absolute inset-0 rounded-[1px] bg-white/[0.08] pointer-events-none"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span>
                    {isOmnibus
                      ? '수록 단편'
                      : isMultiPart
                      ? '챕터 목록'
                      : '줄거리 요약'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-[1px] bg-white/[0.07] font-mono text-[10.5px] text-zinc-300 shrink-0">
                    {isOmnibus
                      ? story.omnibusSubEpisodes?.length || 0
                      : isMultiPart
                      ? (subPages?.length ? subPages.length - 1 : 0)
                      : story.content.acts.length}
                  </span>
                </span>
                {activeTab === 'timeline' && (
                  <motion.span
                    layoutId="story-main-tab-bar"
                    transition={PRTS_SPRING_SNAPPY}
                    className="absolute bottom-0 inset-x-1 h-[2px] bg-[#f5dd1b] z-10"
                  />
                )}
              </button>

              <button
                onClick={() => {
                  playTabSwitchSound();
                  setActiveTab('dossier');
                }}
                className={`relative h-8 px-4 rounded-[1px] transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'dossier'
                    ? 'text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                {activeTab === 'dossier' && (
                  <motion.span
                    layoutId="story-main-tab-bg"
                    transition={PRTS_SPRING_SNAPPY}
                    className="absolute inset-0 rounded-[1px] bg-white/[0.08] pointer-events-none"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span>등장인물</span>
                  <span className="px-1.5 py-0.2 rounded-[1px] bg-white/[0.07] font-mono text-[10.5px] text-zinc-300 shrink-0">
                    {resolvedStoryCharacters.length}
                  </span>
                </span>
                {activeTab === 'dossier' && (
                  <motion.span
                    layoutId="story-main-tab-bar"
                    transition={PRTS_SPRING_SNAPPY}
                    className="absolute bottom-0 inset-x-1 h-[2px] bg-[#f5dd1b] z-10"
                  />
                )}
              </button>

              <button
                onClick={() => {
                  playTabSwitchSound();
                  setActiveTab('glossary');
                }}
                className={`relative h-8 px-4 rounded-[1px] transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'glossary'
                    ? 'text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                }`}
              >
                {activeTab === 'glossary' && (
                  <motion.span
                    layoutId="story-main-tab-bg"
                    transition={PRTS_SPRING_SNAPPY}
                    className="absolute inset-0 rounded-[1px] bg-white/[0.08] pointer-events-none"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span>용어 사전</span>
                  <span className="px-1.5 py-0.2 rounded-[1px] bg-white/[0.07] font-mono text-[10.5px] text-zinc-300 shrink-0">
                    {story.glossary.length}
                  </span>
                </span>
                {activeTab === 'glossary' && (
                  <motion.span
                    layoutId="story-main-tab-bar"
                    transition={PRTS_SPRING_SNAPPY}
                    className="absolute bottom-0 inset-x-1 h-[2px] bg-[#f5dd1b] z-10"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Overview Only Alert Banner */}
          {accessState === 'overview_only' && (
            <div className="p-4 sm:p-5 rounded-[2px] bg-[#15161a] border border-white/[0.1] border-l-2 border-l-zinc-400 flex items-start gap-3.5">
              <Info className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  <span>아카이브 안내</span>
                  <span className="px-2 py-0.5 rounded-[1px] bg-white/[0.06] text-zinc-300 border border-white/15 text-[10px]">
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
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                      <FilmReelIcon className="w-4 h-4 text-zinc-400" />
                      <span>수록 단편 에피소드 컬렉션 ({story.omnibusSubEpisodes.length}편)</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">클릭 시 해당 에피소드로 이동</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {story.omnibusSubEpisodes.map((sub) => (
                      <div
                        key={sub.id}
                        className="fui-reticle-hover p-6 rounded-[2px] border border-white/[0.08] hover:border-white/25 bg-[#121316] hover:bg-[#17191e] transition-colors flex flex-col justify-between group space-y-5"
                      >
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
                            <span className="h-5 px-2 inline-flex items-center rounded-[1px] bg-white/[0.06] border border-white/10 text-zinc-200 font-mono font-bold text-[11px] shrink-0 whitespace-nowrap">
                              EP.0{sub.order}
                            </span>
                            {sub.mainCharacter && (
                              <span className="text-zinc-400 text-[11px] min-w-0 [word-break:keep-all]">
                                <span className="whitespace-nowrap">중심 인물:</span>{' '}
                                <span className="text-zinc-200 font-semibold">{sub.mainCharacter}</span>
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-extrabold text-zinc-100 group-hover:text-white transition-colors font-sans [word-break:keep-all] break-words">
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
                          className="w-full h-9 rounded-[2px] bg-[#181a20] group-hover:bg-zinc-100 text-zinc-200 group-hover:text-black border border-white/[0.08] text-xs font-sans font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <span>에피소드 본문 읽기</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isMultiPart && subPages && subPages.length > 1 ? (
                /* CASE 2: MULTI-PART OVERVIEW (멀티 파트 챕터 컬렉션 그리드) */
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 font-sans">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                      <BookOpen className="w-4 h-4 text-zinc-400" />
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
                          className="fui-reticle-hover p-5 sm:p-6 rounded-[2px] border border-white/[0.08] hover:border-white/25 bg-[#121316] hover:bg-[#17191e] transition-colors flex flex-col justify-between group space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
                              <span className="h-5 px-2 inline-flex items-center rounded-[1px] bg-white/[0.06] border border-white/10 text-zinc-200 font-mono font-bold text-[11px] shrink-0 whitespace-nowrap">
                                {sp.code || arc?.code || 'PART'}
                              </span>
                              {stagesCount > 0 && (
                                <span className="text-[11px] font-mono text-zinc-400 bg-[#17191e] px-2 py-0.5 rounded-[1px] border border-white/[0.06] shrink-0 whitespace-nowrap">
                                  {stagesCount}개 스테이지 {stageCodeRange && `(${stageCodeRange})`}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="text-base sm:text-lg font-extrabold text-zinc-100 group-hover:text-white transition-colors font-sans [word-break:keep-all] break-words">
                                {sp.label}
                              </h3>
                              {focalChar && (
                                <TacticalMetaRow
                                  label="주요 인물:"
                                  value={focalChar}
                                />
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
                            className="w-full h-9 rounded-[2px] bg-[#181a20] group-hover:bg-zinc-100 text-zinc-200 group-hover:text-black border border-white/[0.08] text-xs font-sans font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <span>해당 파트 본문 읽기</span>
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[2px] bg-[#121316] border border-white/[0.08] text-xs font-sans">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-[#f5dd1b]" />
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
                            className="h-7 px-2.5 rounded-[2px] bg-[#17191d] hover:bg-[#1f222a] text-zinc-300 hover:text-white border border-white/[0.07] hover:border-white/25 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 group"
                          >
                            <span className="font-mono font-bold text-zinc-300 group-hover:text-[#f5dd1b]">0{act.step}</span>
                            <span>{act.phase}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={toggleAllActs}
                      title={isAllActsExpanded ? '모든 구간 접기' : '모든 구간 펼치기'}
                      className="h-7 px-2.5 rounded-[2px] bg-[#17191d] hover:bg-[#1f222a] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="hidden sm:inline">{isAllActsExpanded ? '모두 접기' : '모두 펼치기'}</span>
                    </button>
                  </div>

                  <div className="space-y-6 relative">
                    {/* Continuous Vertical Timeline Line on Left */}
                    <div className="hidden lg:block absolute left-[23px] top-6 bottom-6 w-[1px] bg-white/[0.1] pointer-events-none" />

                    {story.content.acts.map((act, aIdx) => {
                      const isExpanded = expandedActs[act.step] !== false;

                      return (
                        <section
                          key={act.step}
                          id={`act-section-${act.step}`}
                          className={`relative lg:pl-14 scroll-mt-20 ${
                            aIdx >= 2 ? 'prts-cv-auto' : ''
                          }`}
                        >
                          {/* Tech Node on Timeline (Desktop) */}
                          <div 
                            onClick={() => toggleAct(act.step)}
                            className="hidden lg:flex absolute left-3 top-4 w-6 h-6 rounded-[2px] bg-[#121316] border border-white/25 items-center justify-center text-[11px] font-mono font-bold text-zinc-200 z-10 cursor-pointer hover:bg-zinc-100 hover:text-black transition-colors"
                            title={`PART 0${act.step} 접기/펼치기`}
                          >
                            0{act.step}
                          </div>

                          <div className="rounded-[2px] border border-white/[0.08] bg-[#121316] overflow-hidden transition-colors">
                            {/* Clickable Accordion Header */}
                            <div
                              onClick={() => toggleAct(act.step)}
                              className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#16181d] hover:bg-[#1a1d23] border-b border-white/[0.07] cursor-pointer select-none group transition-colors space-y-2"
                            >
                              {/* Top Metadata Row: Step Badge + Phase Tag + Location + Chevron */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="lg:hidden h-5.5 px-2 inline-flex items-center rounded-[1px] bg-zinc-200 text-black font-mono font-bold text-xs flex-shrink-0">
                                    0{act.step}
                                  </span>
                                  <span className="inline-flex h-5.5 px-2.5 items-center rounded-[1px] bg-white/[0.06] border border-white/10 text-zinc-200 text-xs font-sans font-bold transition-colors flex-shrink-0">
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
                                      <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                                      <span className="truncate">{act.location}</span>
                                    </div>
                                  )}

                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={PRTS_SPRING_SNAPPY}
                                    className="w-7 h-7 rounded-[2px] bg-[#1c1e24] border border-white/[0.08] text-zinc-400 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </motion.div>
                                </div>
                              </div>

                              {/* Title Row: Full-width allocation preventing cramped multi-line word breaks */}
                              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight transition-colors font-sans [word-break:keep-all] break-keep leading-snug">
                                {act.title}
                              </h2>
                            </div>

                            {/* Collapsed State Quick Preview Bar */}
                            {!isExpanded && act.summary && (
                              <div
                                onClick={() => toggleAct(act.step)}
                                className="px-5 sm:px-7 py-3.5 bg-[#101114] hover:bg-[#16181d] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs text-zinc-400 font-sans"
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                  <span className="w-1.5 h-1.5 bg-[#f5dd1b] flex-shrink-0" />
                                  <span className="truncate text-zinc-300 font-medium">{act.summary}</span>
                                </div>
                                <span className="text-[11px] font-semibold text-zinc-300 flex-shrink-0 whitespace-nowrap flex items-center gap-1">
                                  <span>펼쳐보기</span>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            )}

                            {/* Expanded Full Act Content */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  key={`act-body-${act.step}`}
                                  variants={PRTS_ACCORDION_CONTENT}
                                  initial="collapsed"
                                  animate="expanded"
                                  exit="collapsed"
                                  className="overflow-hidden"
                                >
                                  <div className="p-5 sm:p-8 space-y-6">
                                    {/* Act Summary Lead Callout */}
                                    {act.summary && (
                                      <div className="px-4 py-3 rounded-none bg-[#16181d] border border-white/[0.06] border-l-2 border-l-[#f5dd1b] text-xs sm:text-[13px] font-sans text-zinc-200 flex items-start gap-2.5">
                                        <span className="text-[#f5dd1b] font-bold flex-shrink-0 whitespace-nowrap mt-0.5">핵심 요약</span>
                                        <span className="text-zinc-600 flex-shrink-0 mt-0.5">|</span>
                                        <span className="min-w-0 flex-1 leading-relaxed [word-break:keep-all] font-medium">{act.summary}</span>
                                      </div>
                                    )}

                                {/* Official CG Image Frame */}
                                {act.cgUrl && act.cgUrl.trim() !== '' && (
                                  <div className="group relative rounded-[2px] border border-white/[0.11] bg-[#08090b] overflow-hidden shadow-lg">
                                    <CopyrightedImage
                                      src={act.cgUrl}
                                      alt={act.title}
                                      className="w-full h-auto object-cover max-h-[480px] transition-transform duration-300 group-hover:scale-[1.01]"
                                    />
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d0e11] border-t border-white/[0.08] text-xs font-sans">
                                      {act.cgCaption && act.cgCaption.trim() !== '' ? (
                                        <span className="text-zinc-300 truncate pr-4 flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 bg-[#f5dd1b]" />
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
                                        className="flex items-center gap-1.5 text-zinc-300 hover:text-black transition-colors cursor-pointer flex-shrink-0 ml-auto px-2.5 py-1 rounded-[2px] bg-[#16181d] hover:bg-zinc-100 border border-white/[0.08]"
                                        title="원문 CG 전체화면 확대"
                                      >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-medium">확대</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Narrative Body Text */}
                                <div className="max-w-[74ch] text-[15px] sm:text-[15.5px] text-zinc-200 leading-[1.88] [word-break:keep-all] break-words font-sans space-y-5">
                                  {act.narrativeText.split('\n\n').map((paragraph, pIdx) => (
                                    <p key={pIdx} className="leading-[1.85]">
                                      <HighlightedText
                                        text={paragraph}
                                        characters={resolvedStoryCharacters}
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
                                      const quoteAvatar = q.avatarUrl
                                        ? resolveAssetUrl(q.avatarUrl)
                                        : (speakerChar && getCharacterAvatarUrl(speakerChar) ? resolveAssetUrl(getCharacterAvatarUrl(speakerChar)) : '');
                                      return (
                                        <div
                                          key={qIdx}
                                          className="p-4 rounded-none bg-[#16181d] border border-white/[0.05] border-l-2 border-l-zinc-400 flex gap-4 items-start"
                                        >
                                          {(quoteAvatar || speakerChar) && (
                                            <div
                                              onClick={() => speakerChar && onSelectCharacter(speakerChar, q.variantId)}
                                              className={`w-11 h-11 rounded-[2px] border border-white/[0.12] overflow-hidden bg-black flex-shrink-0 transition-colors ${speakerChar ? 'cursor-pointer hover:border-[#f5dd1b]' : ''}`}
                                              title={speakerChar ? `${speakerChar.nameKo} 프로필 열람` : q.speaker}
                                            >
                                              <TacticalAvatar
                                                src={quoteAvatar}
                                                alt={q.speaker}
                                                className="w-full h-full"
                                              />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
                                              <span
                                                onClick={() => speakerChar && onSelectCharacter(speakerChar, q.variantId)}
                                                className={`font-bold text-zinc-100 ${speakerChar ? 'cursor-pointer hover:text-[#f5dd1b] hover:underline' : ''}`}
                                              >
                                                {q.speaker}
                                              </span>
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
                                    <div className="text-xs font-sans font-bold text-zinc-300 flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-[1px] bg-[#f5dd1b]" />
                                      <span>세부 작전 스테이지 ({act.stages.length})</span>
                                    </div>

                                    <div className="space-y-4 pl-3 border-l border-white/[0.1]">
                                      {act.stages.map((st, stIdx) => (
                                        <div
                                          key={st.stageCode}
                                          className={`p-5 rounded-[2px] bg-[#141519] border border-white/[0.07] space-y-4 ${
                                            stIdx >= 2 ? 'prts-cv-auto' : ''
                                          }`}
                                        >
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                              <span className="h-5 px-2 inline-flex items-center rounded-[2px] bg-zinc-200 text-black font-mono font-bold text-xs flex-shrink-0">
                                                {st.stageCode}
                                              </span>
                                              <h3 className="text-sm sm:text-base font-bold text-white font-sans [word-break:keep-all] break-keep leading-snug">
                                                {st.title}
                                              </h3>
                                            </div>
                                            {st.location && (
                                              <span className="text-xs font-sans text-zinc-400 flex items-center gap-1 flex-shrink-0 max-w-[200px] sm:max-w-xs truncate" title={st.location}>
                                                <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                                <span className="truncate">{st.location}</span>
                                              </span>
                                            )}
                                          </div>

                                          {/* Stage Summary Callout */}
                                           {st.summary && (
                                             <div className="px-4 py-2.5 rounded-[2px] bg-[#17191e] border border-white/[0.06] border-l-2 border-l-[#f5dd1b] text-xs text-zinc-300 leading-relaxed [word-break:keep-all]">
                                               {st.summary}
                                             </div>
                                           )}

                                           {/* Visuals Gallery / Stage CG */}
                                           {st.visuals && st.visuals.length > 0 ? (
                                             <div className="space-y-3">
                                               {st.visuals.map((vis, vIdx) => (
                                                 <div key={vIdx} className="group relative rounded-[2px] border border-white/[0.08] bg-black overflow-hidden">
                                                   <CopyrightedImage
                                                     src={vis.url}
                                                     alt={vis.caption}
                                                     className="w-full h-auto object-cover max-h-[420px] transition-transform duration-500 group-hover:scale-[1.01]"
                                                   />
                                                   <div className="flex items-center justify-between px-3.5 py-2 bg-[#101114] border-t border-white/[0.07] text-xs">
                                                     <span className="text-zinc-300 truncate pr-3 flex items-center gap-2">
                                                       <span className="w-1.5 h-1.5 rounded-[1px] bg-[#f5dd1b]" />
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
                                                       className="h-6 px-2 rounded-[2px] flex items-center gap-1 text-zinc-400 hover:text-white bg-[#17191e] hover:bg-[#1f2228] border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0"
                                                     >
                                                       <ZoomIn className="w-3 h-3 text-zinc-400" />
                                                       <span className="text-[10px]">확대</span>
                                                     </button>
                                                   </div>
                                                 </div>
                                               ))}
                                             </div>
                                           ) : st.cgUrl && st.cgUrl.trim() !== '' ? (
                                             <div className="rounded-[2px] border border-white/[0.08] bg-black overflow-hidden">
                                               <CopyrightedImage
                                                 src={st.cgUrl}
                                                 alt={st.title}
                                                 className="w-full h-auto object-cover max-h-[380px]"
                                               />
                                               {st.cgCaption && (
                                                 <div className="px-3.5 py-2 bg-[#101114] border-t border-white/[0.06] text-xs font-sans text-zinc-300 flex items-center justify-between">
                                                   <span>{st.cgCaption}</span>
                                                   <button
                                                     onClick={() => onOpenLightbox(st.cgUrl!, st.cgCaption, st.title)}
                                                     className="text-[11px] font-semibold text-zinc-300 hover:text-[#f5dd1b] hover:underline cursor-pointer"
                                                   >
                                                     확대
                                                   </button>
                                                 </div>
                                               )}
                                             </div>
                                           ) : null}

                                           {st.tacticalLog && (
                                             <div className="px-3.5 py-2.5 rounded-[2px] bg-[#17191e] border border-white/[0.07] border-l-2 border-l-zinc-400 text-xs font-sans text-zinc-200 flex items-start gap-2">
                                               <span className="text-zinc-200 font-bold flex-shrink-0">전술 요약</span>
                                               <span className="text-zinc-600 flex-shrink-0">|</span>
                                               <span className="[word-break:keep-all] break-keep leading-relaxed">{st.tacticalLog}</span>
                                             </div>
                                           )}

                                           <div className="text-sm sm:text-[15px] text-zinc-200 leading-[1.85] font-sans space-y-3 [word-break:keep-all] break-keep">
                                             {st.narrativeText.split('\n\n').map((p, idx) => (
                                               <p key={idx}>
                                                 <HighlightedText
                                                   text={p}
                                                   characters={resolvedStoryCharacters}
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
                                                 <span className="w-1.5 h-1.5 rounded-[1px] bg-[#f5dd1b]" />
                                                 <span>인게임 핵심 대사</span>
                                               </div>
                                               {st.quotes.map((q, qIdx) => {
                                                 const speakerChar = getCharacterById(q.speakerId);
                                                 const quoteAvatar = q.avatarUrl
                                                   ? resolveAssetUrl(q.avatarUrl)
                                                   : (speakerChar && getCharacterAvatarUrl(speakerChar) ? resolveAssetUrl(getCharacterAvatarUrl(speakerChar)) : '');
                                                 return (
                                                   <div
                                                     key={qIdx}
                                                     className="p-3.5 rounded-[2px] bg-[#17191e] border border-white/[0.06] border-l-2 border-l-zinc-400 flex gap-3.5 items-start text-xs"
                                                   >
                                                     {(quoteAvatar || speakerChar) && (
                                                       <div
                                                         onClick={() => speakerChar && onSelectCharacter(speakerChar, q.variantId)}
                                                         className={`w-9 h-9 rounded-[2px] border border-white/[0.1] overflow-hidden bg-[#101114] flex-shrink-0 transition-colors ${speakerChar ? 'cursor-pointer hover:border-[#f5dd1b]' : ''}`}
                                                         title={speakerChar ? `${speakerChar.nameKo} 프로필 열람` : q.speaker}
                                                       >
                                                         <TacticalAvatar
                                                           src={quoteAvatar}
                                                           alt={q.speaker}
                                                           className="w-full h-full"
                                                         />
                                                       </div>
                                                     )}
                                                     <div className="flex-1 min-w-0 space-y-1">
                                                       <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                         <span
                                                           onClick={() => speakerChar && onSelectCharacter(speakerChar, q.variantId)}
                                                           className={`font-bold text-zinc-100 ${speakerChar ? 'cursor-pointer hover:text-[#f5dd1b] hover:underline' : ''}`}
                                                         >
                                                           {q.speaker}
                                                         </span>
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
                                                 if (char) {
                                                   return (
                                                     <button
                                                       key={cId}
                                                       onClick={() => onSelectCharacter(char)}
                                                       className="h-6 pl-1 pr-2 rounded-[2px] flex items-center gap-1.5 bg-[#16181d] hover:bg-[#1f2228] border border-white/[0.08] hover:border-white/25 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer"
                                                       title={`${char.nameKo} (${char.role}) 프로필 열람`}
                                                     >
                                                       <TacticalAvatar
                                                         src={getCharacterAvatarUrl(char) ? resolveAssetUrl(getCharacterAvatarUrl(char)) : ''}
                                                         alt={char.nameKo}
                                                         className="w-3.5 h-3.5 rounded-[1px]"
                                                       />
                                                       <span>{char.nameKo}</span>
                                                     </button>
                                                   );
                                                 }
                                                 return (
                                                   <span
                                                     key={cId}
                                                     className="h-6 px-1.5 rounded-[2px] flex items-center gap-1 bg-[#121316] border border-white/[0.06] text-[11px] text-zinc-400 select-none cursor-default font-mono"
                                                     title="인물 명부 미등재 단역"
                                                   >
                                                     <span className="w-1 h-1 rounded-[1px] bg-zinc-600" />
                                                     <span>{cId}</span>
                                                   </span>
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
                                    <span className="text-[11px] font-semibold text-zinc-500 mr-1 shrink-0 whitespace-nowrap">
                                      등장인물
                                    </span>
                                    {act.involvedCharacters.map((cId) => {
                                      const char = getCharacterById(cId);
                                      if (char) {
                                        return (
                                          <button
                                            key={cId}
                                            onClick={() => onSelectCharacter(char)}
                                            className="flex items-center gap-1.5 h-6 pl-1 pr-2.5 rounded-[2px] bg-[#16181d] hover:bg-[#1f2228] border border-white/[0.08] hover:border-white/25 text-xs text-zinc-200 hover:text-white transition-all cursor-pointer"
                                          >
                                            <TacticalAvatar
                                              src={getCharacterAvatarUrl(char) ? resolveAssetUrl(getCharacterAvatarUrl(char)) : ''}
                                              alt={char.nameKo}
                                              className="w-4 h-4 rounded-[1px]"
                                            />
                                            <span className="font-medium">{char.nameKo}</span>
                                          </button>
                                        );
                                      }
                                      return (
                                        <span
                                          key={cId}
                                          className="h-6 px-2 rounded-[2px] flex items-center gap-1 bg-[#121316] border border-white/[0.06] text-xs text-zinc-400 select-none cursor-default font-mono"
                                          title="인물 명부 미등재 단역"
                                        >
                                          <span className="w-1 h-1 rounded-[1px] bg-zinc-600" />
                                          <span>{cId}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Post-Operation Analysis Box */}
              <div className="rounded-[2px] border border-white/[0.08] bg-[#121316] overflow-hidden">
                <button
                  onClick={() => {
                    playClickSound();
                    setIsAnalysisExpanded(!isAnalysisExpanded);
                  }}
                  className="w-full px-5 sm:px-7 py-4 bg-[#16181d] hover:bg-[#1a1d23] flex items-center justify-between text-left cursor-pointer transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 font-sans">
                    <span className="w-1.5 h-3.5 bg-[#f5dd1b] flex-shrink-0" />
                    <span className="font-bold text-white text-sm sm:text-base [word-break:keep-all] break-words">
                      스토리 분석 및 해설
                    </span>
                    <span className="hidden sm:inline text-[11px] font-mono text-zinc-500 shrink-0 whitespace-nowrap">
                      STORY COMMENTARY
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isAnalysisExpanded ? 180 : 0 }}
                    transition={PRTS_SPRING_SNAPPY}
                    className="w-7 h-7 rounded-[2px] bg-[#1c1e24] border border-white/[0.08] text-zinc-400 flex items-center justify-center flex-shrink-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isAnalysisExpanded && (
                    <motion.div
                      key="story-analysis-body"
                      variants={PRTS_ACCORDION_CONTENT}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="overflow-hidden"
                    >
                      <div className="p-5 sm:p-8 space-y-6 text-xs sm:text-sm divide-y divide-white/[0.06] border-t border-white/[0.06] font-sans">
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <span className="font-mono text-[#f5dd1b]">01</span>
                        <span>핵심 주제 및 서사적 메시지</span>
                      </div>
                      <p className="text-zinc-200 leading-[1.8] text-sm sm:text-[15px] [word-break:keep-all] break-words">
                        {story.content.analysis.theme}
                      </p>
                    </div>

                    <div className="pt-5 space-y-2">
                      <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <span className="font-mono text-[#f5dd1b]">02</span>
                        <span>로도스 아일랜드 영향 및 성과</span>
                      </div>
                      <p className="text-zinc-200 leading-[1.8] text-sm sm:text-[15px] [word-break:keep-all] break-words">
                        {story.content.analysis.tacticalEvaluation}
                      </p>
                    </div>

                    <div className="pt-5 space-y-2">
                      <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <span className="font-mono text-[#f5dd1b]">03</span>
                        <span>테라 대륙 정세 영향</span>
                      </div>
                      <p className="text-zinc-200 leading-[1.8] text-sm sm:text-[15px] [word-break:keep-all] break-words">
                        {story.content.analysis.loreImpact}
                      </p>
                    </div>

                    <div className="pt-5 space-y-3">
                      <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <span className="font-mono text-[#f5dd1b]">04</span>
                        <span>미회수 복선 및 잔존 기록</span>
                      </div>
                      <ul className="space-y-2.5 text-zinc-200">
                        {story.content.analysis.unresolvedHooks.map((hook, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-3 bg-[#16181d] p-3.5 rounded-[2px] border border-white/[0.06]">
                            <span className="text-[#f5dd1b] font-mono text-xs font-bold flex-shrink-0 mt-0.5">#{hIdx + 1}</span>
                            <span className="text-xs sm:text-sm leading-relaxed [word-break:keep-all] break-words">{hook}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* =========================================================================
              4. TAB CONTENT: PERSONNEL DOSSIER
          ========================================================================= */}
          {activeTab === 'dossier' && (
            <div className="space-y-5 font-sans">
              <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/[0.08] pb-3">
                <span className="font-semibold text-zinc-200">작전 관계자 명부 (총 {resolvedStoryCharacters.length}명)</span>
                <span className="font-mono text-[11px] text-zinc-500">클릭 시 상세 프로필 열람</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resolvedStoryCharacters.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => {
                      playClickSound();
                      onSelectCharacter(char);
                    }}
                    className="fui-reticle-hover p-5 rounded-[2px] border border-white/[0.08] bg-[#121316] hover:border-white/25 hover:bg-[#17191e] transition-colors cursor-pointer group space-y-3.5"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 rounded-[2px] border border-white/[0.12] overflow-hidden bg-black flex-shrink-0 group-hover:border-white/40 transition-colors">
                        <TacticalAvatar
                          src={getCharacterAvatarUrl(char) ? resolveAssetUrl(getCharacterAvatarUrl(char)) : ''}
                          alt={char.nameKo}
                          className="w-full h-full"
                          showBadge={true}
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-[11px] font-mono text-zinc-400 truncate">
                          {char.faction}
                        </div>
                        <div className="text-base font-extrabold text-zinc-100 group-hover:text-white transition-colors truncate">
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
                      <div className="text-xs italic text-zinc-200 border-l-2 border-[#f5dd1b] pl-3 py-1 bg-[#16181d] rounded-none [word-break:keep-all]">
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
                    onClick={() => {
                      playClickSound();
                      onSelectGlossary(item);
                    }}
                    className="fui-reticle-hover p-5 rounded-[2px] border border-white/[0.08] bg-[#121316] hover:border-white/25 hover:bg-[#17191e] transition-colors cursor-pointer group space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm sm:text-base font-extrabold text-zinc-100 group-hover:text-white transition-colors [word-break:keep-all] break-words min-w-0">
                        {item.term}
                      </div>
                      <span className="h-5 px-2 inline-flex items-center rounded-[1px] bg-white/[0.05] text-zinc-300 font-semibold text-[11px] border border-white/[0.08] flex-shrink-0 whitespace-nowrap">
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
            className="fui-reticle-hover group flex-1 p-4 rounded-[2px] bg-[#121316] hover:bg-[#17191e] border border-white/[0.08] hover:border-white/25 text-left transition-colors cursor-pointer flex items-center gap-3.5"
            title={`${previousStory.titleKo} 보고서로 이동`}
          >
            <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-white transition-transform group-hover:-translate-x-1 flex-shrink-0" />
            <div className="min-w-0 space-y-0.5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">
                PREVIOUS OPERATION
              </div>
              <div className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                <span className="font-mono mr-1.5 text-zinc-400 group-hover:text-[#f5dd1b]">{previousStory.code}</span>
                <span>{previousStory.titleKo}</span>
              </div>
              <div className="text-[11px] text-zinc-500 truncate font-mono">
                {previousStory.titleEn}
              </div>
            </div>
          </button>
        ) : (
          <div className="flex-1 p-4 rounded-[2px] bg-[#101114] border border-white/[0.05] text-zinc-600 flex items-center gap-2 select-none">
            <span className="text-xs">첫 번째 작전 기록입니다</span>
          </div>
        )}

        {/* Scroll To Top Button */}
        <button
          onClick={scrollToTop}
          className="w-12 py-3 rounded-[2px] bg-[#121316] hover:bg-[#17191e] border border-white/[0.08] hover:border-white/25 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center self-center sm:self-stretch"
          title="페이지 최상단으로 이동"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        {/* Next Story Button */}
        {nextStory ? (
          <button
            onClick={() => handleNavigateStory(nextStory.id)}
            className="fui-reticle-hover group flex-1 p-4 rounded-[2px] bg-[#121316] hover:bg-[#17191e] border border-white/[0.08] hover:border-white/25 text-right transition-colors cursor-pointer flex items-center justify-end gap-3.5"
            title={`${nextStory.titleKo} 보고서로 이동`}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">
                NEXT OPERATION
              </div>
              <div className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                <span className="font-mono mr-1.5 text-zinc-400 group-hover:text-[#f5dd1b]">{nextStory.code}</span>
                <span>{nextStory.titleKo}</span>
              </div>
              <div className="text-[11px] text-zinc-500 truncate font-mono">
                {nextStory.titleEn}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-1 flex-shrink-0" />
          </button>
        ) : (
          <div className="flex-1 p-4 rounded-[2px] bg-[#101114] border border-white/[0.05] text-zinc-600 flex items-center justify-end gap-2 select-none">
            <span className="text-xs">마지막 작전 기록입니다</span>
          </div>
        )}
      </nav>

      {/* Scroll Safe Bottom Spacing to ensure the floating dock never collides with footer buttons */}
      <div className="h-20 sm:h-24 md:h-28 pointer-events-none" aria-hidden="true" />

      {/* Desktop Sticky Right Scroll-Spy Reading Rail (Visible on 2XL viewports) */}
      {tocItems.length > 1 &&
        typeof document !== 'undefined' &&
        createPortal(
          <aside
            aria-label="문서 목차 내비게이션"
            className="hidden 2xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-30 w-44 flex-col rounded-[2px] bg-[#101114]/92 backdrop-blur-md border border-white/[0.1] p-3 shadow-2xl space-y-2.5 select-none"
          >
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-400 font-bold tracking-wider truncate">{story.code}</span>
              <span ref={railPctRef} className="text-[#f5dd1b] font-bold tabular-nums">
                0%
              </span>
            </div>

            <div className="h-[2px] w-full bg-white/[0.07] rounded-full overflow-hidden">
              <div
                ref={readingBarRef}
                className="h-full bg-[#f5dd1b] transition-[width] duration-150"
                style={{ width: '0%' }}
              />
            </div>

            <div className="max-h-[54vh] overflow-y-auto prts-scrollbar space-y-0.5 pr-0.5">
              {tocItems.map((item) => {
                const isActive = effectiveActiveTocId === item.id;
                return (
                  <button
                    key={`rail-${item.id}`}
                    type="button"
                    onClick={item.onJump}
                    className={`w-full text-left px-2 py-1.5 rounded-[1px] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.06] text-white font-semibold border-l-2 border-[#f5dd1b]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-l-2 border-transparent'
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] flex-shrink-0 ${
                        isActive ? 'text-[#f5dd1b]' : 'text-zinc-500'
                      }`}
                    >
                      {item.code}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>,
          document.body
        )}

      {/* Floating Bottom Navigation Dock (Mounted to document.body via Portal to guarantee true fixed tracking) */}
      {typeof document !== 'undefined'
        ? createPortal(renderFloatingDock(), document.body)
        : renderFloatingDock()}
    </div>
  );
};

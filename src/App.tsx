import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Header } from './components/Header';
import type { MainViewMode } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { StoryCategoryFilter, StorySortMode } from './components/Sidebar';
import { StoryViewer } from './components/StoryViewer';
import { HomeDashboard } from './components/HomeDashboard';
import { SideDrawer } from './components/SideDrawer';
import { LightboxModal } from './components/LightboxModal';
import type { InfoModalTab } from './components/InfoLicenseModal';
import { ScrollNavButtons } from './components/ScrollNavButtons';
import { PrtsBootSequence } from './components/PrtsBootSequence';
import { APP_VERSION_CODE, APP_RELEASE_STAGE } from './version';
import {
  getStoryArchive,
  hasFullStoryArchive,
  isStoryLoaded,
  loadStoryArchive,
  storyRegistry,
  STORY_LINES,
} from './data/storyRegistry';
import type { CharacterRef, GlossaryTerm, StoryArchive } from './types/story';
import { useHashRoute, buildHash } from './hooks/useHashRoute';
import { useFullscreen } from './hooks/useFullscreen';
import { usePwaInstall } from './hooks/usePwaInstall';
import { PRTS_VIEW_VARIANTS } from './utils/motion';
import { PanelLeftOpen, Menu, Info, ChevronDown } from 'lucide-react';
import { 
  setSoundEnabled, 
  playOpenSound, 
  playCloseSound, 
  playTabSwitchSound, 
  playClickSound 
} from './utils/soundEffects';

const ChronicleRoadmapView = lazy(() =>
  import('./components/ChronicleRoadmapView').then((m) => ({ default: m.ChronicleRoadmapView }))
);
const TerraMapView = lazy(() =>
  import('./components/TerraMapView').then((m) => ({ default: m.TerraMapView }))
);
const EditorStudioView = lazy(() =>
  import('./components/studio/EditorStudioView').then((m) => ({ default: m.EditorStudioView }))
);
const ReviewExportModal = lazy(() =>
  import('./components/ReviewExportModal').then((m) => ({ default: m.ReviewExportModal }))
);
const InfoLicenseModal = lazy(() =>
  import('./components/InfoLicenseModal').then((m) => ({ default: m.InfoLicenseModal }))
);
const ServiceNoticeModal = lazy(() =>
  import('./components/ServiceNoticeModal').then((m) => ({ default: m.ServiceNoticeModal }))
);
const FullscreenPwaGuideModal = lazy(() =>
  import('./components/FullscreenPwaGuideModal').then((m) => ({ default: m.FullscreenPwaGuideModal }))
);
const CommandPaletteModal = lazy(() =>
  import('./components/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal }))
);

const DEFAULT_STORY_ID = 'ep00';
const BASE_TITLE = 'PRTS Archive // 명일방주 스토리 아카이브';

const ViewLoadingFallback = ({ label = 'LOADING MODULE' }: { label?: string }) => (
  <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs select-none">
    <div className="w-6 h-6 border border-white/20 border-t-[#f5dd1b] rounded-full animate-spin" />
    <span className="tracking-widest text-[11px] text-zinc-400">PRTS // {label}</span>
  </div>
);

const isKnownStoryId = (id: string | null | undefined): id is string =>
  !!id && storyRegistry.some((s) => s.id === id);

// 당일 하루 공지 팝업 닫기 키 계산
const getTodayDismissKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `prts_dismiss_notice_${year}-${month}-${day}`;
};

// 새로고침/접속 시 안내 팝업 노출 여부 판별 (당일 닫기 여부 확인)
const shouldShowNoticeOnMount = (): boolean => {
  try {
    return localStorage.getItem(getTodayDismissKey()) !== 'true';
  } catch {
    return true;
  }
};

// 스토리에 실제로 존재하는 하위 페이지 ID 목록 (멀티파트 / 옴니버스)
const getValidSubPageIds = (story: StoryArchive): Set<string> => {
  const meta = storyRegistry.find((s) => s.id === story.id);
  const ids = new Set<string>();
  (story.subPages || meta?.subPages || []).forEach((sp) => ids.add(sp.id));
  story.omnibusSubEpisodes?.forEach((ep) => ids.add(ep.id));
  story.multiPartArcs?.forEach((arc) => ids.add(arc.id));
  return ids;
};

export function App() {
  // SideDrawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRef | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedGlossary, setSelectedGlossary] = useState<GlossaryTerm | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxData, setLightboxData] = useState<{
    imageUrl: string | null;
    caption?: string;
    title?: string;
  }>({
    imageUrl: null,
  });

  // URL 해시 라우팅: 뷰 / 스토리 / 하위 파트는 URL이 단일 진실 공급원
  // 브라우저 뒤로가기·앞으로가기 시 떠 있는 오버레이는 닫아 이전 화면이 바로 보이도록 처리
  const { route, navType, navigate, getSavedScroll } = useHashRoute({
    onPop: () => {
      setIsDrawerOpen(false);
      setIsLightboxOpen(false);
      setIsSidebarOpenMobile(false);
      setIsServiceNoticeOpen(false);
      setIsPwaGuideOpen(false);
    },
  });
  const currentView = route.view;

  // 보고서 외 뷰(홈/연대기/지도)에서도 마지막으로 열람한 스토리를 기억 (상단 '보고서' 탭 복귀용)
  const [lastStoryId, setLastStoryId] = useState<string>(
    isKnownStoryId(route.storyId) ? route.storyId : DEFAULT_STORY_ID
  );
  const routeStoryId = currentView === 'report' && isKnownStoryId(route.storyId) ? route.storyId : null;
  const activeStoryId = routeStoryId ?? lastStoryId;
  if (routeStoryId && routeStoryId !== lastStoryId) {
    setLastStoryId(routeStoryId);
  }

  // 선택된 스토리 본문 동적 로드 (초기 번들에서 대용량 스토리 데이터 분리)
  const [, setStoryLoadTick] = useState<number>(0);
  const needsStoryLoad = hasFullStoryArchive(activeStoryId) && !isStoryLoaded(activeStoryId);

  useEffect(() => {
    if (!needsStoryLoad) return;
    let cancelled = false;
    loadStoryArchive(activeStoryId)
      .then(() => {
        if (!cancelled) setStoryLoadTick((n) => n + 1);
      })
      .catch((err) => {
        console.error(`[PRTS Archive] Failed to load story chunk '${activeStoryId}':`, err);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStoryId, needsStoryLoad]);

  const currentStory = getStoryArchive(activeStoryId);
  const validSubPageIds = getValidSubPageIds(currentStory);
  const activeSubPageId =
    currentView === 'report' &&
    route.subPageId &&
    route.subPageId !== 'overview' &&
    validSubPageIds.has(route.subPageId)
      ? route.subPageId
      : null;

  // 공통 내비게이션 헬퍼
  const goToStory = useCallback((id: string, subPageId?: string | null) => {
    navigate({ view: 'report', storyId: id, subPageId: subPageId || null });
  }, [navigate]);

  const goToSubPage = useCallback((subId: string) => {
    navigate({ view: 'report', storyId: activeStoryId, subPageId: subId === 'overview' ? null : subId });
  }, [navigate, activeStoryId]);

  const goToView = useCallback((view: MainViewMode) => {
    if (view === 'report') {
      goToStory(activeStoryId);
    } else {
      navigate({ view, storyId: null, subPageId: null });
    }
  }, [goToStory, activeStoryId, navigate]);

  // 잘못된/누락된 URL(존재하지 않는 스토리·파트)은 정규 URL로 교체 (스토리 청크 로딩 중에는 보류)
  const canonicalRoute = {
    view: currentView,
    storyId: currentView === 'report' ? activeStoryId : null,
    subPageId: currentView === 'report' ? activeSubPageId : null,
  };
  const canonicalHash = buildHash(canonicalRoute);
  const routeHash = buildHash(route);
  useEffect(() => {
    if (currentView === 'report' && needsStoryLoad) return;
    if (canonicalHash !== routeHash) {
      navigate(canonicalRoute, { replace: true });
    }
    // canonicalRoute는 canonicalHash로 완전히 표현됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, needsStoryLoad, canonicalHash, routeHash, navigate]);

  // 브라우저 탭 제목 동기화 (히스토리 목록에서도 식별 가능)
  useEffect(() => {
    if (currentView === 'report') {
      document.title = `${currentStory.code} ${currentStory.titleKo} // PRTS Archive`;
    } else if (currentView === 'chronicle') {
      document.title = `스토리 목록 // PRTS Archive`;
    } else if (currentView === 'map') {
      document.title = `테라 지도 // PRTS Archive`;
    } else {
      document.title = BASE_TITLE;
    }
  }, [currentView, currentStory.code, currentStory.titleKo]);

  // 세션 최초 1회 PRTS 부트 연출 재생 (스튜디오, 딥링크 직행, 모션 축소 환경 제외)
  const [isBooting, setIsBooting] = useState<boolean>(() => {
    if (route.view === 'studio') return false;
    if (route.view === 'report' && Boolean(route.storyId)) return false;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    try {
      if (sessionStorage.getItem('prts_boot_seen') === '1') return false;
    } catch {
      // ignore sessionStorage block
    }
    return true;
  });
  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
    try {
      sessionStorage.setItem('prts_boot_seen', '1');
    } catch {
      // ignore sessionStorage block
    }
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [pendingMapRegionId, setPendingMapRegionId] = useState<string | null>(null);
  const [pendingChronicleStoryId, setPendingChronicleStoryId] = useState<string | null>(null);
  const [isReviewExportOpen, setIsReviewExportOpen] = useState<boolean>(false);
  const [isInfoLicenseOpen, setIsInfoLicenseOpen] = useState<boolean>(false);
  const [infoModalTab, setInfoModalTab] = useState<InfoModalTab>('license');
  const [isServiceNoticeOpen, setIsServiceNoticeOpen] = useState<boolean>(() =>
    shouldShowNoticeOnMount()
  );
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState<boolean>(false);

  // Fullscreen and PWA Hooks
  const { isFullscreen, toggleFullscreen, isIOS, isStandalone } = useFullscreen({
    onRequireIosGuide: () => {
      setIsPwaGuideOpen(true);
      playOpenSound();
    },
  });

  const { isInstallable, promptInstall } = usePwaInstall();

  const handleDismissNoticeToday = useCallback(() => {
    try {
      localStorage.setItem(getTodayDismissKey(), 'true');
    } catch {
      // localStorage 접근 불가 환경(시크릿 모드 차단 등) 예외 무시
    }
  }, []);

  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      setTimeout(playTabSwitchSound, 30);
    }
  };

  // Story Index Filtering & Sorting State (Lifted for synchronization)
  const [activeCategory, setActiveCategory] = useState<StoryCategoryFilter>('all');
  const [sortMode, setSortMode] = useState<StorySortMode>('story_line');

  // Filter & Sort Calculation (이전/다음 내비게이션 대상)
  const navStories = storyRegistry.filter((item) => {
    if (item.status === 'locked') return false;
    if (activeCategory === 'main') return item.category === 'main';
    if (activeCategory === 'events') return item.category !== 'main';
    if (activeCategory === 'omnibus') return item.isOmnibus;
    return true;
  });

  const sortedNavStories = [...navStories].sort((a, b) => {
    if (sortMode === 'story_line') {
      const lineA = STORY_LINES.findIndex((l) => l.id === a.storyLineId);
      const lineB = STORY_LINES.findIndex((l) => l.id === b.storyLineId);
      if (lineA !== lineB) return lineA - lineB;
      return a.seriesOrder - b.seriesOrder;
    }
    if (sortMode === 'release') {
      return a.releaseOrder - b.releaseOrder;
    }
    return a.chronologicalOrder - b.chronologicalOrder;
  });

  // Calculate Previous and Next Story based on active filter & sort
  const currentNavIndex = sortedNavStories.findIndex((s) => s.id === activeStoryId);
  const previousStory = currentNavIndex > 0 ? sortedNavStories[currentNavIndex - 1] : null;
  const nextStory =
    currentNavIndex >= 0 && currentNavIndex < sortedNavStories.length - 1
      ? sortedNavStories[currentNavIndex + 1]
      : null;

  // 브라우저 기본 스크롤 복원 비활성화 (스크롤 위치는 라우팅 훅이 직접 관리)
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // 화면 전환 시 스크롤 처리
  // - 일반 이동(push): 항상 최상단에서 시작
  // - 뒤로/앞으로가기(pop): 해당 화면을 떠날 때의 스크롤 위치 복원
  // (하위 컴포넌트의 최상단 리셋 effect보다 부모 effect가 나중에 실행되므로 복원이 우선 적용됨)
  useEffect(() => {
    if (navType === 'pop') {
      const y = getSavedScroll(routeHash);
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
      // 레이아웃이 늦게 확정되는 경우를 대비해 다음 프레임에 한 번 더 적용
      requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'instant' }));
    } else if (navType === 'push') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [routeHash, navType, getSavedScroll]);

  // 전역 키보드 단축키 (Ctrl+K 또는 / 통합 색인, ESC 모달 닫기, 좌우 화살표 스토리 이동)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => {
          const next = !prev;
          if (next) playOpenSound();
          else playCloseSound();
          return next;
        });
        return;
      }

      // 폼 입력 중일 때는 나머지 단축키 비활성화
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (
        e.key === '/' &&
        !isCommandPaletteOpen &&
        !isLightboxOpen &&
        !isPwaGuideOpen &&
        !isServiceNoticeOpen &&
        !isDrawerOpen &&
        !isReviewExportOpen &&
        !isInfoLicenseOpen
      ) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        playOpenSound();
        return;
      }

      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          playCloseSound();
        } else if (isLightboxOpen) {
          setIsLightboxOpen(false);
          playCloseSound();
        } else if (isPwaGuideOpen) {
          setIsPwaGuideOpen(false);
          playCloseSound();
        } else if (isServiceNoticeOpen) {
          setIsServiceNoticeOpen(false);
          playCloseSound();
        } else if (isInfoLicenseOpen) {
          setIsInfoLicenseOpen(false);
          playCloseSound();
        } else if (isReviewExportOpen) {
          setIsReviewExportOpen(false);
          playCloseSound();
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
          playCloseSound();
        } else if (isSidebarOpenMobile) {
          setIsSidebarOpenMobile(false);
          playCloseSound();
        }
      } else if (currentView === 'report' && !isCommandPaletteOpen && !isLightboxOpen && !isPwaGuideOpen && !isServiceNoticeOpen && !isDrawerOpen && !isSidebarOpenMobile && !isReviewExportOpen && !isInfoLicenseOpen) {
        if (e.key === 'ArrowLeft' && previousStory) {
          goToStory(previousStory.id);
          playClickSound();
        } else if (e.key === 'ArrowRight' && nextStory) {
          goToStory(nextStory.id);
          playClickSound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isCommandPaletteOpen, isLightboxOpen, isPwaGuideOpen, isServiceNoticeOpen, isDrawerOpen, isSidebarOpenMobile, isReviewExportOpen, isInfoLicenseOpen, previousStory, nextStory, goToStory]);

  const handleSelectStoryFromMapOrChronicle = (id: string) => {
    goToStory(id);
    playClickSound();
  };

  const handleSelectCharacter = (char: CharacterRef, initialVariantId?: string) => {
    setSelectedCharacter(char);
    setSelectedGlossary(null);
    setSelectedVariantId(initialVariantId || null);
    setIsDrawerOpen(true);
    playOpenSound();
  };

  const handleSelectGlossary = (term: GlossaryTerm) => {
    setSelectedGlossary(term);
    setSelectedCharacter(null);
    setSelectedVariantId(null);
    setIsDrawerOpen(true);
    playOpenSound();
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    playCloseSound();
  };

  const handleOpenLightbox = (imageUrl: string, caption?: string, title?: string) => {
    setLightboxData({ imageUrl, caption, title });
    setIsLightboxOpen(true);
    playOpenSound();
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    playCloseSound();
  };

  if (currentView === 'studio') {
    return (
      <Suspense fallback={<ViewLoadingFallback label="INITIALIZING STUDIO" />}>
        <EditorStudioView
          initialStoryId={activeStoryId}
          onExitToViewer={(targetStoryId) => {
            if (targetStoryId) {
              goToStory(targetStoryId);
            } else {
              goToView('report');
            }
          }}
        />
      </Suspense>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 flex flex-col font-sans relative prts-grid-subtle">
      {/* PRTS Archive Refresh / Initial Calibration Motion Graphic */}
      <AnimatePresence>
        {isBooting && <PrtsBootSequence onComplete={handleBootComplete} />}
      </AnimatePresence>

      {/* 꽉 찬 화면 상태에서 상단 메뉴 복원 플로팅 버튼 (연대기·지도 뷰는 자체 툴바에 복원 버튼 내장) */}
      {isHeaderCollapsed && (currentView === 'home' || currentView === 'report') && (
        <div className="fixed top-2.5 right-3 z-50 animate-fadeIn pointer-events-auto">
          <button
            onClick={() => {
              playClickSound();
              setIsHeaderCollapsed(false);
            }}
            title="상단 메뉴 다시 열기"
            className="h-7 px-3 rounded-[2px] bg-[#141519] hover:bg-zinc-100 text-zinc-200 hover:text-black border border-white/15 hover:border-white font-sans text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors group whitespace-nowrap"
          >
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black transition-transform" />
            <span>메뉴 열기</span>
          </button>
        </div>
      )}

      {/* Top Header with 4 Main View Tabs & [INFO / LICENSE] */}
      {!isHeaderCollapsed && (
        <Header
          currentView={currentView}
          onChangeView={(view) => goToView(view)}
          onOpenCommandPalette={() => {
            setIsCommandPaletteOpen(true);
            playOpenSound();
          }}
          isSoundOn={isSoundOn}
          onToggleSound={handleToggleSound}
          onOpenReviewExport={() => {
            setIsReviewExportOpen(true);
            playOpenSound();
          }}
          onOpenInfoLicense={(tab) => {
            setInfoModalTab(tab || 'license');
            setIsInfoLicenseOpen(true);
            playOpenSound();
          }}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onPromptInstall={promptInstall}
          isInstallable={isInstallable}
          onOpenFullscreenGuide={() => {
            setIsPwaGuideOpen(true);
            playOpenSound();
          }}
        />
      )}

      {/* Mobile Index Trigger Button (Only in Report view, positioned above mobile bottom tab bar) */}
      {currentView === 'report' && !isSidebarOpenMobile && (
        <div className={`lg:hidden fixed ${isHeaderCollapsed ? 'bottom-4' : 'bottom-18'} left-3.5 z-40 animate-fadeIn`}>
          <button
            onClick={() => {
              setIsSidebarCollapsed(false);
              setIsSidebarOpenMobile(true);
              playOpenSound();
            }}
            className="w-10 h-10 rounded-[2px] bg-[#141519]/95 border border-white/15 hover:border-white/35 text-zinc-200 hover:text-white cursor-pointer shadow-xl flex items-center justify-center transition-colors active:scale-95 group"
            title="스토리 색인 열기"
            aria-label="스토리 색인 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex w-full relative">
        {/* Left Sidebar (Only in Report view) */}
        {currentView === 'report' && (
          <Sidebar
            activeStoryId={activeStoryId}
            activeSubPageId={activeSubPageId}
            onSelectStory={(id, subPageId) => goToStory(id, subPageId)}
            isOpenMobile={isSidebarOpenMobile}
            onCloseMobile={() => setIsSidebarOpenMobile(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            activeCategory={activeCategory}
            onChangeCategory={setActiveCategory}
            sortMode={sortMode}
            onChangeSortMode={setSortMode}
          />
        )}

        {/* Floating Sidebar Toggle Button when Collapsed (Desktop in Report view) */}
        {currentView === 'report' && isSidebarCollapsed && (
          <div className="hidden lg:block fixed top-17 left-4 z-30 animate-fadeIn">
            <button
              onClick={() => {
                setIsSidebarCollapsed(false);
                playOpenSound();
              }}
              title="스토리 색인 펼치기"
              className="h-9 px-3 rounded-[2px] bg-[#141519]/95 hover:bg-zinc-100 border border-white/15 hover:border-white text-zinc-200 hover:text-black flex items-center gap-2 text-xs font-medium transition-colors shadow-xl cursor-pointer group"
            >
              <PanelLeftOpen className="w-4 h-4 text-zinc-400 group-hover:text-black" />
              <span>색인 열기</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 flex flex-col overflow-x-hidden min-w-0 bg-[#0c0c0e] transition-all duration-300 ${
            currentView === 'report' && isSidebarCollapsed ? 'px-2 lg:px-12' : ''
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={PRTS_VIEW_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col w-full min-w-0 min-h-0"
            >
              {/* View 0: PRTS Archive Home Dashboard */}
              {currentView === 'home' && (
                <HomeDashboard
                  onNavigateToStory={(id, subPageId) => goToStory(id, subPageId)}
                  onNavigateToView={(view) => goToView(view)}
                  onOpenCommandPalette={() => {
                    setIsCommandPaletteOpen(true);
                    playOpenSound();
                  }}
                  onOpenReviewExport={() => {
                    setIsReviewExportOpen(true);
                    playOpenSound();
                  }}
                  onOpenServiceNotice={() => {
                    setIsServiceNoticeOpen(true);
                    playOpenSound();
                  }}
                  onOpenFullscreenGuide={() => {
                    setIsPwaGuideOpen(true);
                    playOpenSound();
                  }}
                  onPromptInstall={promptInstall}
                  isInstallable={isInstallable}
                />
              )}

              {/* View 1: Report Document Viewer */}
              {currentView === 'report' && (
                needsStoryLoad ? (
                  <ViewLoadingFallback label={`LOADING ARCHIVE // ${activeStoryId.toUpperCase()}`} />
                ) : (
                  <StoryViewer
                    story={currentStory}
                    activeSubPageId={activeSubPageId}
                    onChangeSubPage={(subId) => goToSubPage(subId)}
                    onSelectCharacter={handleSelectCharacter}
                    onSelectGlossary={handleSelectGlossary}
                    onOpenLightbox={handleOpenLightbox}
                    previousStory={previousStory}
                    nextStory={nextStory}
                    onSelectStory={(id, subPageId) => goToStory(id, subPageId)}
                    isHeaderCollapsed={isHeaderCollapsed}
                    onToggleCollapseHeader={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  />
                )
              )}

              {/* View 2: Chronicle Roadmap Flowchart */}
              {currentView === 'chronicle' && (
                <Suspense fallback={<ViewLoadingFallback label="CHRONICLE TIMELINE" />}>
                  <ChronicleRoadmapView
                    onSelectStory={handleSelectStoryFromMapOrChronicle}
                    initialFocusStoryId={pendingChronicleStoryId}
                    onConsumeInitialStory={() => setPendingChronicleStoryId(null)}
                    onNavigateToMapRegion={(regionId) => {
                      setPendingMapRegionId(regionId);
                      goToView('map');
                    }}
                    isHeaderCollapsed={isHeaderCollapsed}
                    onToggleHeaderCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  />
                </Suspense>
              )}

              {/* View 3: Terra Tactical Cartography Map */}
              {currentView === 'map' && (
                <Suspense fallback={<ViewLoadingFallback label="TERRA 3D CARTOGRAPHY" />}>
                  <TerraMapView
                    onSelectStory={handleSelectStoryFromMapOrChronicle}
                    initialFocusRegionId={pendingMapRegionId}
                    onConsumeInitialRegion={() => setPendingMapRegionId(null)}
                    onNavigateToChronicleStory={(storyId) => {
                      setPendingChronicleStoryId(storyId);
                      goToView('chronicle');
                    }}
                    isHeaderCollapsed={isHeaderCollapsed}
                    onToggleHeaderCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Bottom Footer Bar (Shown on scrollable document views, padded above mobile bottom nav) */}
      {!isHeaderCollapsed && (currentView === 'home' || currentView === 'report') && (
        <footer className="z-30 bg-[#0b0c0e] border-t border-white/[0.08] px-4 lg:px-8 pt-2.5 pb-16 md:pb-2.5 text-[11px] text-zinc-400 select-none">
          <div className="w-full max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono font-bold text-zinc-300">© HYPERGRYPH / STUDIO MONTAGNE / YOSTAR</span>
              <span className="text-zinc-600 hidden sm:inline">|</span>
              <span className="text-zinc-400">비공식·비영리 팬 아카이브</span>
              <span className="text-zinc-600 hidden sm:inline">|</span>
              <button
                onClick={() => {
                  setInfoModalTab('changelog');
                  setIsInfoLicenseOpen(true);
                  playOpenSound();
                }}
                className="font-mono text-[11px] text-zinc-400 hover:text-[#f5dd1b] flex items-center gap-1.5 transition-colors cursor-pointer group"
                title="버전 연혁 및 변경점 보기"
              >
                <span className="w-1.5 h-1.5 bg-[#f5dd1b] shrink-0" />
                <span className="whitespace-nowrap">PRTS Archive <strong className="text-zinc-200 group-hover:text-[#f5dd1b] transition-colors">{APP_VERSION_CODE}</strong> ({APP_RELEASE_STAGE})</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setIsPwaGuideOpen(true);
                  playOpenSound();
                }}
                className="h-6 px-2.5 rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/25 font-mono text-[10.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="전체 화면 및 웹 앱(PWA) 설치 안내 열기"
              >
                <span>APP / FULLSCREEN</span>
              </button>
              <button
                onClick={() => {
                  setIsServiceNoticeOpen(true);
                  playOpenSound();
                }}
                className="h-6 px-2.5 rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/25 font-mono text-[10.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="서비스 이용 안내 및 권장 환경 열기"
              >
                <span>NOTICE</span>
              </button>
              <button
                onClick={() => {
                  setInfoModalTab('changelog');
                  setIsInfoLicenseOpen(true);
                  playOpenSound();
                }}
                className="h-6 px-2.5 rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/25 font-mono text-[10.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="버전 연혁 (Changelog) 열기"
              >
                <span>CHANGELOG</span>
              </button>
              <button
                onClick={() => {
                  setInfoModalTab('license');
                  setIsInfoLicenseOpen(true);
                  playOpenSound();
                }}
                className="h-6 px-2.5 rounded-[2px] bg-white/[0.05] hover:bg-[#f5dd1b] text-zinc-200 hover:text-black border border-white/[0.1] hover:border-[#f5dd1b] font-mono text-[10.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer group whitespace-nowrap"
              >
                <Info className="w-3 h-3 text-[#f5dd1b] group-hover:text-black shrink-0" />
                <span>INFO / LICENSE</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Slide Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        selectedCharacter={selectedCharacter}
        selectedGlossary={selectedGlossary}
        initialVariantId={selectedVariantId}
        onOpenLightbox={handleOpenLightbox}
        onSelectStory={(storyId) => {
          handleCloseDrawer();
          goToStory(storyId);
        }}
      />

      {/* CG Lightbox */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        imageUrl={lightboxData.imageUrl}
        caption={lightboxData.caption}
        title={lightboxData.title}
      />

      {/* Global Command Palette & Modals */}
      <Suspense fallback={null}>
        {isCommandPaletteOpen && (
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onSelectStory={(storyId) => goToStory(storyId)}
            onSelectCharacter={(char) => handleSelectCharacter(char)}
            onSelectRegion={(regionId) => {
              setPendingMapRegionId(regionId);
              goToView('map');
            }}
            onNavigateView={(view) => goToView(view)}
          />
        )}

        {isReviewExportOpen && (
          <ReviewExportModal
            isOpen={isReviewExportOpen}
            onClose={() => setIsReviewExportOpen(false)}
            currentStory={currentStory}
          />
        )}

        {/* In-App Info, Copyright License & AI Content Disclaimer Modal */}
        {isInfoLicenseOpen && (
          <InfoLicenseModal
            isOpen={isInfoLicenseOpen}
            onClose={() => setIsInfoLicenseOpen(false)}
            initialTab={infoModalTab}
          />
        )}

        {/* Service Environment & Performance Notice Modal (부팅 애니메이션 완료 후 노출) */}
        {isServiceNoticeOpen && !isBooting && (
          <ServiceNoticeModal
            isOpen={isServiceNoticeOpen && !isBooting}
            onClose={() => setIsServiceNoticeOpen(false)}
            onConfirmDismissToday={handleDismissNoticeToday}
          />
        )}

        {/* Fullscreen & PWA Install Guide Modal */}
        {isPwaGuideOpen && (
          <FullscreenPwaGuideModal
            isOpen={isPwaGuideOpen}
            onClose={() => setIsPwaGuideOpen(false)}
            isIOS={isIOS}
            isInstallable={isInstallable}
            isStandalone={isStandalone}
            onPromptInstall={promptInstall}
          />
        )}
      </Suspense>

      {/* Floating Scroll-to-Top and Bottom Navigation Buttons */}
      <ScrollNavButtons currentView={currentView} />
    </div>
    </MotionConfig>
  );
}

export default App;

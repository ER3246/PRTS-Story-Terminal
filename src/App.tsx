import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import type { MainViewMode } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { StoryCategoryFilter, StorySortMode } from './components/Sidebar';
import { StoryViewer } from './components/StoryViewer';
import { HomeDashboard } from './components/HomeDashboard';
import { ChronicleRoadmapView } from './components/ChronicleRoadmapView';
import { TerraMapView } from './components/TerraMapView';
import { SideDrawer } from './components/SideDrawer';
import { LightboxModal } from './components/LightboxModal';
import { ReviewExportModal } from './components/ReviewExportModal';
import { InfoLicenseModal } from './components/InfoLicenseModal';
import { ScrollNavButtons } from './components/ScrollNavButtons';
import { getStoryArchive, storyRegistry, STORY_LINES } from './data/storyRegistry';
import type { CharacterRef, GlossaryTerm } from './types/story';
import { PanelLeftOpen, Menu, Info, ChevronDown } from 'lucide-react';
import { 
  setSoundEnabled, 
  playOpenSound, 
  playCloseSound, 
  playTabSwitchSound, 
  playClickSound 
} from './utils/soundEffects';

export function App() {
  const [activeStoryId, setActiveStoryId] = useState<string>('ep00');
  const [activeSubPageId, setActiveSubPageId] = useState<string | null>(null);
  // 새로고침 시 기본 페이지는 PRTS 종합 홈 대시보드
  const [currentView, setCurrentView] = useState<MainViewMode>('home');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [isReviewExportOpen, setIsReviewExportOpen] = useState<boolean>(false);
  const [isInfoLicenseOpen, setIsInfoLicenseOpen] = useState<boolean>(false);

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

  // SideDrawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRef | null>(null);
  const [selectedGlossary, setSelectedGlossary] = useState<GlossaryTerm | null>(null);

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxData, setLightboxData] = useState<{
    imageUrl: string | null;
    caption?: string;
    title?: string;
  }>({
    imageUrl: null,
  });

  const currentStory = getStoryArchive(activeStoryId);

  // 브라우저 기본 스크롤 복원 비활성화 (새 페이지/뷰 진입 시 항상 최상단에서 시작하도록 보장)
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // 뷰 전환(홈, 보고서, 연대기, 지도) 또는 열람 스토리 전환 시 스크롤 위치를 즉시 최상단(0, 0)으로 리셋
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView, activeStoryId]);

  // 전역 키보드 단축키 (ESC로 모달 닫기, 좌우 화살표로 스토리 이전/다음 이동)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 폼 입력 중일 때는 단축키 비활성화
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
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
      } else if (currentView === 'report' && !isLightboxOpen && !isDrawerOpen && !isSidebarOpenMobile && !isReviewExportOpen && !isInfoLicenseOpen) {
        if (e.key === 'ArrowLeft' && previousStory) {
          setActiveStoryId(previousStory.id);
          playClickSound();
        } else if (e.key === 'ArrowRight' && nextStory) {
          setActiveStoryId(nextStory.id);
          playClickSound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isLightboxOpen, isDrawerOpen, isSidebarOpenMobile, isReviewExportOpen, isInfoLicenseOpen, previousStory, nextStory]);

  const handleSelectStoryFromMapOrChronicle = (id: string) => {
    setActiveStoryId(id);
    setCurrentView('report'); // 보고서 열람 뷰로 전환
    playClickSound();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleSelectCharacter = (char: CharacterRef) => {
    setSelectedCharacter(char);
    setSelectedGlossary(null);
    setIsDrawerOpen(true);
    playOpenSound();
  };

  const handleSelectGlossary = (term: GlossaryTerm) => {
    setSelectedGlossary(term);
    setSelectedCharacter(null);
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

  return (
    <div className="min-h-screen bg-[#0e0f12] text-zinc-100 flex flex-col font-sans relative prts-grid-subtle">
      {/* 꽉 찬 화면 상태에서 상단 메뉴 복원 플로팅 버튼 (연대기·지도 뷰는 자체 툴바에 복원 버튼 내장) */}
      {isHeaderCollapsed && (currentView === 'home' || currentView === 'report') && (
        <div className="fixed top-2.5 right-3 z-50 animate-fadeIn pointer-events-auto">
          <button
            onClick={() => {
              playClickSound();
              setIsHeaderCollapsed(false);
            }}
            title="상단 메뉴 다시 열기"
            className="h-7 px-3 rounded-full bg-[#0a0d16]/94 hover:bg-[#ffe600] text-zinc-200 hover:text-black border border-white/20 hover:border-[#ffe600] font-sans text-xs font-semibold flex items-center gap-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-md cursor-pointer transition-all group"
          >
            <ChevronDown className="w-3.5 h-3.5 text-[#ffe600] group-hover:text-black transition-transform" />
            <span>메뉴 열기</span>
          </button>
        </div>
      )}

      {/* Top Header with 4 Main View Tabs & [ⓘ INFO / LICENSE] */}
      {!isHeaderCollapsed && (
        <Header
          currentView={currentView}
          onChangeView={(view) => setCurrentView(view)}
          isSoundOn={isSoundOn}
          onToggleSound={handleToggleSound}
          onOpenReviewExport={() => {
            setIsReviewExportOpen(true);
            playOpenSound();
          }}
          onOpenInfoLicense={() => {
            setIsInfoLicenseOpen(true);
            playOpenSound();
          }}
          onToggleCollapseHeader={() => setIsHeaderCollapsed(true)}
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
            className="h-9 px-3.5 rounded-[3px] prts-glass hover:border-[#ffe600]/60 text-white font-sans text-xs cursor-pointer shadow-2xl flex items-center gap-2 transition-all active:scale-95 group"
            title="스토리 색인 목록 열기"
          >
            <Menu className="w-4 h-4 text-[#ffe600] group-hover:rotate-90 transition-transform" />
            <span className="font-bold tracking-tight">스토리 색인</span>
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
            onSelectStory={(id, subPageId) => {
              setActiveStoryId(id);
              setActiveSubPageId(subPageId || null);
            }}
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
              className="h-9 px-3 rounded-[3px] prts-glass hover:border-[#ffe600]/60 text-zinc-300 hover:text-white flex items-center gap-2 text-xs font-medium transition-all shadow-xl cursor-pointer group"
            >
              <PanelLeftOpen className="w-4 h-4 text-[#ffe600]" />
              <span>색인 열기</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 overflow-x-hidden min-w-0 bg-[#08090c] transition-all duration-300 ${
            currentView === 'report' && isSidebarCollapsed ? 'px-2 lg:px-12' : ''
          }`}
        >
          {/* View 0: PRTS Home Terminal Dashboard */}
          {currentView === 'home' && (
            <HomeDashboard
              onNavigateToStory={(id) => {
                setActiveStoryId(id);
                setActiveSubPageId(null);
                setCurrentView('report');
              }}
              onNavigateToView={(view) => setCurrentView(view)}
              onOpenReviewExport={() => {
                setIsReviewExportOpen(true);
                playOpenSound();
              }}
            />
          )}

          {/* View 1: Report Document Viewer */}
          {currentView === 'report' && (
            <StoryViewer
              story={currentStory}
              activeSubPageId={activeSubPageId}
              onChangeSubPage={(subId) => setActiveSubPageId(subId)}
              onSelectCharacter={handleSelectCharacter}
              onSelectGlossary={handleSelectGlossary}
              onOpenLightbox={handleOpenLightbox}
              previousStory={previousStory}
              nextStory={nextStory}
              onSelectStory={(id, subPageId) => {
                setActiveStoryId(id);
                setActiveSubPageId(subPageId || null);
              }}
            />
          )}

          {/* View 2: Chronicle Roadmap Flowchart */}
          {currentView === 'chronicle' && (
            <ChronicleRoadmapView
              onSelectStory={handleSelectStoryFromMapOrChronicle}
              isHeaderCollapsed={isHeaderCollapsed}
              onToggleHeaderCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            />
          )}

          {/* View 3: Terra Tactical Cartography Map */}
          {currentView === 'map' && (
            <TerraMapView
              onSelectStory={handleSelectStoryFromMapOrChronicle}
              isHeaderCollapsed={isHeaderCollapsed}
              onToggleHeaderCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            />
          )}
        </main>
      </div>

      {/* Global Bottom Footer Bar (Shown on scrollable document views, padded above mobile bottom nav) */}
      {!isHeaderCollapsed && (currentView === 'home' || currentView === 'report') && (
        <footer className="z-30 bg-[#07090e] border-t border-white/[0.08] px-4 lg:px-8 pt-2.5 pb-16 md:pb-2.5 text-[11px] text-zinc-400 select-none">
          <div className="w-full max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono font-bold text-zinc-300">© HYPERGRYPH / STUDIO MONTAGNE / YOSTAR</span>
              <span className="text-zinc-600 hidden sm:inline">|</span>
              <span className="text-zinc-400">비공식·비영리 팬 아카이브 · AI 요약 2차 가공물</span>
            </div>
            <button
              onClick={() => {
                playOpenSound();
                setIsInfoLicenseOpen(true);
              }}
              className="h-6 px-2.5 rounded-[2px] bg-white/[0.05] hover:bg-[#ffe600] text-zinc-200 hover:text-black border border-white/[0.1] hover:border-[#ffe600] font-mono text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="w-3 h-3 text-[#ffe600] group-hover:text-black" />
              <span>ⓘ INFO / LICENSE</span>
            </button>
          </div>
        </footer>
      )}

      {/* Slide Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        selectedCharacter={selectedCharacter}
        selectedGlossary={selectedGlossary}
      />

      {/* CG Lightbox */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        imageUrl={lightboxData.imageUrl}
        caption={lightboxData.caption}
        title={lightboxData.title}
      />

      {/* Review & Export Hub Modal */}
      <ReviewExportModal
        isOpen={isReviewExportOpen}
        onClose={() => setIsReviewExportOpen(false)}
        currentStory={currentStory}
      />

      {/* In-App Info, Copyright License & AI Content Disclaimer Modal */}
      <InfoLicenseModal
        isOpen={isInfoLicenseOpen}
        onClose={() => setIsInfoLicenseOpen(false)}
      />

      {/* Floating Scroll-to-Top and Bottom Navigation Buttons */}
      <ScrollNavButtons currentView={currentView} />
    </div>
  );
}

export default App;

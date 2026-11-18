import React from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  FileText,
  GitBranch,
  Map,
  Volume2,
  VolumeX,
  Download,
  Info,
  Maximize2,
  Minimize2,
  MonitorDown,
  Wrench,
} from 'lucide-react';
import { playTabSwitchSound, playClickSound } from '../utils/soundEffects';
import { APP_VERSION_CODE } from '../version';
import { PRTS_SPRING_SNAPPY } from '../utils/motion';
import { AudioVisualizerBars } from './ui/TacticalPrimitives';

export type MainViewMode = 'home' | 'report' | 'chronicle' | 'map' | 'studio';

interface HeaderProps {
  currentView: MainViewMode;
  onChangeView: (view: MainViewMode) => void;
  onToggleSound?: () => void;
  isSoundOn?: boolean;
  onOpenReviewExport?: () => void;
  onOpenInfoLicense?: (initialTab?: 'license' | 'ai_disclaimer' | 'controls' | 'changelog' | 'app_fullscreen') => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onPromptInstall?: () => void;
  isInstallable?: boolean;
  onOpenFullscreenGuide?: () => void;
}

const NAV_ITEMS: { mode: MainViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: 'home', label: '메인', icon: Home },
  { mode: 'report', label: '스토리 상세', icon: FileText },
  { mode: 'chronicle', label: '스토리 목록', icon: GitBranch },
  { mode: 'map', label: '테라 지도', icon: Map },
];

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  onToggleSound,
  isSoundOn = false,
  onOpenReviewExport,
  onOpenInfoLicense,
  onToggleFullscreen,
  isFullscreen = false,
  onPromptInstall,
  isInstallable = false,
}) => {
  const handleNav = (mode: MainViewMode) => {
    playTabSwitchSound();
    onChangeView(mode);
  };

  const activeNavMeta = NAV_ITEMS.find((item) => item.mode === currentView) || NAV_ITEMS[0];

  return (
    <>
      {/* Top Header Bar: Slim Utility Bar on Mobile (h-11) / Full Editorial GNB on Desktop (md:h-14) */}
      <header className="sticky top-0 z-40 h-11 md:h-14 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-white/[0.08] px-3 sm:px-4 lg:px-8 flex items-center select-none">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4 h-full">
          {/* Left: PRTS Archive Brand Identity + Version Tag + Mobile Section Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              onClick={() => {
                playClickSound();
                onChangeView('home');
              }}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group flex-shrink-0"
              title="메인으로 이동"
            >
              <div className="h-5 px-1.5 bg-zinc-100 group-hover:bg-[#f5dd1b] text-black font-mono font-bold text-[11px] tracking-wider rounded-none flex items-center justify-center transition-colors">
                PRTS
              </div>
              <span className="text-xs sm:text-sm font-display font-bold text-zinc-100 group-hover:text-white tracking-wider transition-colors whitespace-nowrap">
                ARCHIVE
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  onOpenInfoLicense?.('changelog');
                }}
                className="px-1.5 py-0.5 rounded-[2px] bg-transparent hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-200 border border-white/[0.08] hover:border-white/20 text-[9.5px] sm:text-[10px] font-mono transition-colors cursor-pointer whitespace-nowrap"
                title={`PRTS Archive ${APP_VERSION_CODE} (클릭하여 버전 연혁 열람)`}
              >
                {APP_VERSION_CODE}
              </button>
            </div>

            <span className="md:hidden text-zinc-600 text-xs">/</span>
            <span className="md:hidden text-xs font-bold text-zinc-200 truncate">
              {activeNavMeta.label}
            </span>
          </div>

          {/* Center: Flush Desktop Editorial Navigation Tabs */}
          <nav className="hidden md:flex items-center h-full gap-1">
            {NAV_ITEMS.map(({ mode, label, icon: Icon }) => {
              const isActive = currentView === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleNav(mode)}
                  className={`relative h-14 px-4 flex items-center gap-2 text-xs transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-100 font-medium'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-500'
                    }`}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="header-desktop-tab-bar"
                      transition={PRTS_SPRING_SNAPPY}
                      className="absolute bottom-0 inset-x-0 h-[2px] bg-[#f5dd1b]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Quiet Monochrome Utility Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 로컬 개발 환경 전용 STUDIO 편집기 진입 버튼 */}
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => handleNav('studio')}
                title="PRTS Studio 편집 전용 툴 열기 (#/studio)"
                className="h-7 md:h-8 px-2.5 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>STUDIO 편집기</span>
              </button>
            )}

            {/* 앱 설치 버튼 (PWA 설치 가능 시 노출) */}
            {isInstallable && onPromptInstall && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onPromptInstall();
                }}
                title="PRTS Archive 웹 앱 설치"
                className="h-7 md:h-8 px-2 md:px-2.5 rounded-[2px] bg-[#141519] hover:bg-[#1d1f26] text-zinc-200 hover:text-white border border-white/[0.1] hover:border-white/25 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
              >
                <MonitorDown className="w-3.5 h-3.5 text-[#f5dd1b] shrink-0" />
                <span className="hidden sm:inline">앱 설치</span>
              </button>
            )}

            {/* 전체 화면 토글 버튼 */}
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onToggleFullscreen();
                }}
                title={isFullscreen ? '전체 화면 해제' : '전체 화면 (브라우저 주소창 숨김)'}
                className={`h-7 md:h-8 px-2 md:px-2.5 rounded-[2px] border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium whitespace-nowrap group ${
                  isFullscreen
                    ? 'bg-white/[0.1] text-white border-[#f5dd1b]/70'
                    : 'bg-[#141519] hover:bg-[#1d1f26] text-zinc-300 hover:text-white border-white/[0.08] hover:border-white/20'
                }`}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-[#f5dd1b] shrink-0" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-100 shrink-0" />
                )}
                <span className="hidden sm:inline">{isFullscreen ? '전체 해제' : '전체 화면'}</span>
              </button>
            )}

            {onOpenInfoLicense && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenInfoLicense();
                }}
                title="저작권 · 면책 고지 · 안내"
                className="h-7 md:h-8 px-2 md:px-2.5 rounded-[2px] bg-[#141519] hover:bg-[#1d1f26] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-mono font-medium whitespace-nowrap group"
              >
                <Info className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-100 shrink-0" />
                <span className="hidden sm:inline">INFO / LICENSE</span>
              </button>
            )}

            {onOpenReviewExport && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenReviewExport();
                }}
                title="요약 문서 다운로드"
                className="w-7 h-7 md:w-8 md:h-8 rounded-[2px] bg-[#141519] hover:bg-[#1d1f26] text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            )}

            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                title={isSoundOn ? '효과음 끄기' : '효과음 켜기'}
                className={`h-7 md:h-8 px-2 rounded-[2px] border transition-colors cursor-pointer flex items-center justify-center gap-1 relative shrink-0 ${
                  isSoundOn
                    ? 'bg-[#141519] text-white border-white/25'
                    : 'w-7 md:w-8 px-0 bg-[#141519] hover:bg-[#1d1f26] text-zinc-500 hover:text-zinc-200 border-white/[0.08]'
                }`}
              >
                {isSoundOn ? (
                  <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#f5dd1b] shrink-0" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                )}
                <AudioVisualizerBars active={isSoundOn} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Native Bottom Navigation Bar */}
      <nav
        aria-label="모바일 하단 메뉴"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-[#0c0c0e]/96 backdrop-blur-md border-t border-white/[0.09] grid grid-cols-4 select-none"
      >
        {NAV_ITEMS.map(({ mode, label, icon: Icon }) => {
          const isActive = currentView === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => handleNav(mode)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-white bg-white/[0.03]' : 'text-zinc-500 active:bg-white/[0.02]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="header-mobile-tab-bar"
                  transition={PRTS_SPRING_SNAPPY}
                  className="absolute top-0 inset-x-0 h-[2px] bg-[#f5dd1b]"
                />
              )}
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span className={`text-[11px] tracking-tight whitespace-nowrap ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

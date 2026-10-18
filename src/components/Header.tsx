import React from 'react';
import { Home, FileText, GitBranch, Map, Volume2, VolumeX, Download, Info, Maximize2 } from 'lucide-react';
import { playTabSwitchSound, playClickSound } from '../utils/soundEffects';

export type MainViewMode = 'home' | 'report' | 'chronicle' | 'map';

interface HeaderProps {
  currentView: MainViewMode;
  onChangeView: (view: MainViewMode) => void;
  onToggleSound?: () => void;
  isSoundOn?: boolean;
  onOpenReviewExport?: () => void;
  onOpenInfoLicense?: () => void;
  onToggleCollapseHeader?: () => void;
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
  onToggleCollapseHeader,
}) => {
  const handleNav = (mode: MainViewMode) => {
    playTabSwitchSound();
    onChangeView(mode);
  };

  const activeNavMeta = NAV_ITEMS.find((item) => item.mode === currentView) || NAV_ITEMS[0];

  return (
    <>
      {/* Top Header Bar: Slim Utility Bar on Mobile (h-11) / Full GNB on Desktop (md:h-14) */}
      <header className="sticky top-0 z-40 h-11 md:h-14 bg-[#090b10]/94 backdrop-blur-xl border-b border-white/[0.08] px-3 sm:px-4 lg:px-8 flex items-center select-none">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: PRTS Brand Identity + Mobile Current Section Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              onClick={() => {
                playClickSound();
                onChangeView('home');
              }}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="메인으로 이동"
            >
              <div className="h-5 px-2 bg-[#ffe600] group-hover:bg-white text-black font-display font-bold text-[11px] tracking-wider rounded-[2px] flex items-center justify-center transition-colors">
                PRTS
              </div>
              <span className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-[#ffe600] tracking-tight transition-colors">
                스토리 아카이브
              </span>
            </div>

            <span className="md:hidden text-zinc-600 text-xs">/</span>
            <span className="md:hidden text-xs font-bold text-[#ffe600] truncate">
              {activeNavMeta.label}
            </span>
          </div>

          {/* Center: Desktop Segmented Navigation (Hidden on Mobile, replaced by Bottom Tab Bar) */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-[4px] border border-white/[0.07]">
            {NAV_ITEMS.map(({ mode, label, icon: Icon }) => {
              const isActive = currentView === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleNav(mode)}
                  className={`relative h-8 px-4 rounded-[3px] flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-white/[0.1] text-white font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#ffe600]' : 'text-zinc-500'
                    }`}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-[#ffe600] rounded-full shadow-[0_0_8px_#ffe600]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* 꽉 찬 화면 토글 버튼 */}
            {onToggleCollapseHeader && (
              <button
                onClick={() => {
                  playClickSound();
                  onToggleCollapseHeader();
                }}
                title="메뉴 숨기기 (꽉 찬 화면)"
                className="h-7 md:h-8 px-2 md:px-2.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.1] hover:border-[#ffe600]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#ffe600]" />
                <span className="hidden sm:inline">꽉 찬 화면</span>
              </button>
            )}

            {onOpenInfoLicense && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenInfoLicense();
                }}
                title="저작권 · 면책 고지 · 안내"
                className="h-7 md:h-8 px-2 md:px-2.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.1] hover:border-[#ffe600]/60 transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-mono font-bold"
              >
                <Info className="w-3.5 h-3.5 text-[#ffe600]" />
                <span className="hidden sm:inline">INFO / LICENSE</span>
              </button>
            )}

            {onOpenReviewExport && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenReviewExport();
                }}
                title="요약 문서 다운로드"
                className="w-7 h-7 md:w-8 md:h-8 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex items-center justify-center"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ffe600]" />
              </button>
            )}

            {onToggleSound && (
              <button
                onClick={onToggleSound}
                title={isSoundOn ? '효과음 끄기' : '효과음 켜기'}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-[3px] border transition-all cursor-pointer flex items-center justify-center relative ${
                  isSoundOn
                    ? 'bg-[#ffe600]/15 text-[#ffe600] border-[#ffe600]/50'
                    : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-200 border-white/[0.08]'
                }`}
              >
                {isSoundOn ? (
                  <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
                {isSoundOn && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Native Bottom Navigation Bar (4 Equal Tabs, Zero Clipping, One-Thumb Access) */}
      <nav
        aria-label="모바일 하단 메뉴"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#080a10]/96 backdrop-blur-xl border-t border-white/[0.12] grid grid-cols-4 select-none shadow-[0_-8px_24px_rgba(0,0,0,0.75)]"
      >
        {NAV_ITEMS.map(({ mode, label, icon: Icon }) => {
          const isActive = currentView === mode;
          return (
            <button
              key={mode}
              onClick={() => handleNav(mode)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-[#ffe600] bg-white/[0.04]' : 'text-zinc-400 active:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 inset-x-4 h-[2.5px] bg-[#ffe600] rounded-b-full shadow-[0_0_8px_#ffe600]" />
              )}
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#ffe600]' : 'text-zinc-400'}`} />
              <span className={`text-[11px] tracking-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

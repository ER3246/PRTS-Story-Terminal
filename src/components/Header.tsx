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

  return (
    <header className="sticky top-0 z-40 h-14 bg-[#090b10]/88 backdrop-blur-xl border-b border-white/[0.08] px-3 sm:px-4 lg:px-8 flex items-center select-none">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: PRTS Brand Identity */}
        <div
          onClick={() => {
            playClickSound();
            onChangeView('home');
          }}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group flex-shrink-0"
          title="메인으로 이동"
        >
          <div className="h-5 px-2 bg-[#ffe600] group-hover:bg-white text-black font-display font-bold text-[11px] tracking-wider rounded-[2px] flex items-center justify-center transition-colors">
            PRTS
          </div>
          <span className="text-sm font-bold text-zinc-100 group-hover:text-[#ffe600] tracking-tight transition-colors hidden md:inline">
            스토리 아카이브
          </span>
        </div>

        {/* Center: Sleek High-Tech Segmented Navigation */}
        <nav className="flex items-center gap-0.5 sm:gap-1 bg-white/[0.03] p-1 rounded-[4px] border border-white/[0.07] overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map(({ mode, label, icon: Icon }) => {
            const isActive = currentView === mode;
            return (
              <button
                key={mode}
                onClick={() => handleNav(mode)}
                className={`relative h-8 px-2.5 sm:px-4 rounded-[3px] flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
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

        {/* Right: Minimal Utility Actions & [ⓘ INFO / LICENSE] */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* 꽉 찬 화면 토글 버튼 */}
          {onToggleCollapseHeader && (
            <button
              onClick={() => {
                playClickSound();
                onToggleCollapseHeader();
              }}
              title="상단 메뉴 접기 (꽉 찬 화면으로 보기)"
              className="h-8 px-2.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.1] hover:border-[#ffe600]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
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
              title="저작권 · AI 요약 면책 고지 · 조작 가이드"
              className="h-8 px-2.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.1] hover:border-[#ffe600]/60 transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-mono font-bold"
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
              title="문서 내보내기"
              className="w-8 h-8 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex items-center justify-center"
            >
              <Download className="w-4 h-4 text-[#ffe600]" />
            </button>
          )}

          {onToggleSound && (
            <button
              onClick={onToggleSound}
              title={isSoundOn ? '효과음 끄기' : '효과음 켜기'}
              className={`w-8 h-8 rounded-[3px] border transition-all cursor-pointer flex items-center justify-center relative ${
                isSoundOn
                  ? 'bg-[#ffe600]/15 text-[#ffe600] border-[#ffe600]/50'
                  : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-200 border-white/[0.08]'
              }`}
            >
              {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {isSoundOn && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

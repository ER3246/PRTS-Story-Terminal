import React from 'react';
import {
  GitBranch,
  Map as MapIcon,
  ArrowRight,
  BookOpen,
  Info
} from 'lucide-react';
import { playClickSound, playTabSwitchSound } from '../utils/soundEffects';
import { APP_VERSION_CODE } from '../version';

interface HomeDashboardProps {
  onNavigateToStory: (storyId: string) => void;
  onNavigateToView: (view: 'report' | 'chronicle' | 'map') => void;
  onOpenReviewExport?: () => void;
  onOpenServiceNotice?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateToStory,
  onNavigateToView,
  onOpenServiceNotice,
}) => {
  return (
    <div className="flex-1 w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 animate-fadeIn relative overflow-hidden select-none">
      {/* Subtle High-Tech Ambient Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[340px] bg-[#ffe600]/[0.025] rounded-full blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />
        {/* Subtle Precision Frame Marks */}
        <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-white/[0.08] hidden md:block" />
        <div className="absolute top-10 right-10 w-12 h-12 border-t border-r border-white/[0.08] hidden md:block" />
        <div className="absolute bottom-10 left-10 w-12 h-12 border-b border-l border-white/[0.08] hidden md:block" />
        <div className="absolute bottom-10 right-10 w-12 h-12 border-b border-r border-white/[0.08] hidden md:block" />
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-9">
        {/* Title & Concise Subtitle */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10.5px] font-mono text-zinc-400 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600] animate-pulse" />
            <span className="text-zinc-300 font-bold">PRTS TERMINAL SYSTEM</span>
            <span className="text-zinc-600">·</span>
            <span className="text-[#ffe600] font-semibold">{APP_VERSION_CODE}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-white tracking-tight leading-tight">
            PRTS 스토리 아카이브
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 font-normal tracking-wide">
            명일방주 스토리 요약 모음
          </p>
        </div>

        {/* 3 Entry Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {/* 스토리 상세 */}
          <button
            onClick={() => {
              playClickSound();
              onNavigateToStory('ep00');
            }}
            className="h-11 px-6 rounded-[3px] bg-[#ffe600] hover:bg-[#fff04d] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(255,230,0,0.16)] hover:shadow-[0_0_28px_rgba(255,230,0,0.28)] cursor-pointer group whitespace-nowrap min-w-[156px]"
          >
            <BookOpen className="w-4 h-4" />
            <span>스토리 상세</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 스토리 목록 */}
          <button
            onClick={() => {
              playTabSwitchSound();
              onNavigateToView('chronicle');
            }}
            className="h-11 px-6 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.09] text-zinc-200 hover:text-white border border-white/[0.1] hover:border-[#ffe600]/60 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group whitespace-nowrap min-w-[144px] backdrop-blur-md"
          >
            <GitBranch className="w-4 h-4 text-[#ffe600]" />
            <span>스토리 목록</span>
          </button>

          {/* 테라 지도 */}
          <button
            onClick={() => {
              playTabSwitchSound();
              onNavigateToView('map');
            }}
            className="h-11 px-6 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.09] text-zinc-200 hover:text-white border border-white/[0.1] hover:border-[#ffe600]/60 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group whitespace-nowrap min-w-[144px] backdrop-blur-md"
          >
            <MapIcon className="w-4 h-4 text-[#ffe600]" />
            <span>테라 지도</span>
          </button>
        </div>

        {/* Subtle Service Notice Link */}
        {onOpenServiceNotice && (
          <div className="pt-2 animate-fadeIn">
            <button
              onClick={() => {
                playClickSound();
                onOpenServiceNotice();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-all cursor-pointer group"
            >
              <Info className="w-3.5 h-3.5 text-[#ffe600] group-hover:scale-110 transition-transform" />
              <span>서비스 이용 안내 · 권장 환경</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

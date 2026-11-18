import React from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  Map as MapIcon,
  ArrowRight,
  BookOpen,
  Info,
  Maximize2,
  MonitorDown,
} from 'lucide-react';
import { playClickSound, playTabSwitchSound } from '../utils/soundEffects';
import { APP_VERSION_CODE } from '../version';
import { PRTS_STAGGER_CONTAINER, PRTS_STAGGER_ITEM } from '../utils/motion';
import { PrtsNeuralEmblem } from './ui/TacticalIcons';

interface HomeDashboardProps {
  onNavigateToStory: (storyId: string) => void;
  onNavigateToView: (view: 'report' | 'chronicle' | 'map') => void;
  onOpenReviewExport?: () => void;
  onOpenServiceNotice?: () => void;
  onOpenFullscreenGuide?: () => void;
  onPromptInstall?: () => void;
  isInstallable?: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateToStory,
  onNavigateToView,
  onOpenServiceNotice,
  onOpenFullscreenGuide,
  onPromptInstall,
  isInstallable = false,
}) => {
  return (
    <div className="flex-1 w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative overflow-hidden select-none">
      {/* Subtle Architectural Structural Guide Hairlines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="max-w-4xl mx-auto h-full border-x border-white/[0.035]" />
      </div>

      {/* Main Swiss Industrial Editorial Container */}
      <motion.div
        variants={PRTS_STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-4xl flex flex-col items-start text-left space-y-8 sm:space-y-10"
      >
        {/* 1. Top Specification Bar */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="w-full flex items-center justify-between border-b border-white/[0.09] pb-3 text-[11px] font-mono text-zinc-500"
        >
          <span className="inline-flex items-center gap-2 text-zinc-300 font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 bg-[#f5dd1b] shrink-0" />
            <span>PRTS ARCHIVE SYSTEM</span>
          </span>
          <span className="tracking-wider">INDEX // {APP_VERSION_CODE}</span>
        </motion.div>

        {/* 2. Architectural Hero Header */}
        <motion.div variants={PRTS_STAGGER_ITEM} className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-[0.2em] text-zinc-500 uppercase">
              <PrtsNeuralEmblem className="w-5 h-5 text-zinc-300 shrink-0" />
              <span>RHODES ISLAND NARRATIVE DATABASE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight text-white leading-none">
              PRTS ARCHIVE
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 font-normal [word-break:keep-all]">
              명일방주 스토리 요약 아카이브
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end text-right font-mono text-[10.5px] text-zinc-500 space-y-1 shrink-0">
            <span>RECORDS // 24 EPISODES &amp; EVENTS</span>
            <span className="text-zinc-400">STATUS // OPERATIONAL</span>
          </div>
        </motion.div>

        {/* 3. 3 Uniform Monolith Navigation Modules */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="w-full grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.09] border border-white/[0.09]"
        >
          {/* 01. 스토리 상세 */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onNavigateToStory('ep00');
            }}
            className="bg-[#121316] hover:bg-[#181a1f] p-5 sm:p-6 flex flex-col justify-between text-left transition-colors relative group cursor-pointer min-h-[148px]"
          >
            <span className="absolute top-0 inset-x-0 h-[2px] bg-[#f5dd1b] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-[#f5dd1b] transition-colors">01</span>
              <BookOpen className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </div>
            <div className="pt-6 space-y-1">
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
            className="bg-[#121316] hover:bg-[#181a1f] p-5 sm:p-6 flex flex-col justify-between text-left transition-colors relative group cursor-pointer min-h-[148px]"
          >
            <span className="absolute top-0 inset-x-0 h-[2px] bg-[#f5dd1b] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-[#f5dd1b] transition-colors">
                02
              </span>
              <GitBranch className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </div>
            <div className="pt-6 space-y-1">
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
            className="bg-[#121316] hover:bg-[#181a1f] p-5 sm:p-6 flex flex-col justify-between text-left transition-colors relative group cursor-pointer min-h-[148px]"
          >
            <span className="absolute top-0 inset-x-0 h-[2px] bg-[#f5dd1b] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-[#f5dd1b] transition-colors">
                03
              </span>
              <MapIcon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </div>
            <div className="pt-6 space-y-1">
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
                테라 18개 권역 및 작전 경로 브리핑
              </p>
            </div>
          </button>
        </motion.div>

        {/* 4. Understated Rectangular Utility Bar */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="w-full pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400"
        >
          <div className="flex flex-wrap items-center gap-2">
            {isInstallable && onPromptInstall && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onPromptInstall();
                }}
                className="px-3 py-1.5 rounded-[2px] bg-[#121316] hover:bg-[#1a1c22] border border-white/[0.08] hover:border-white/25 text-zinc-200 hover:text-white font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
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
                className="px-3 py-1.5 rounded-[2px] bg-[#121316] hover:bg-[#1a1c22] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-zinc-100 font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
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
                className="px-3 py-1.5 rounded-[2px] bg-[#121316] hover:bg-[#1a1c22] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-zinc-100 font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
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

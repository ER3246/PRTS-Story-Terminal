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
import { PRTS_STAGGER_CONTAINER, PRTS_STAGGER_ITEM, PRTS_SPRING_SNAPPY } from '../utils/motion';
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
    <div className="flex-1 w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-14 relative overflow-hidden select-none">
      {/* Layered Architectural Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dual-tone Rhodes ambient luminescence */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[380px] bg-[radial-gradient(ellipse_at_center,rgba(255,230,0,0.045)_0%,rgba(0,216,255,0.025)_48%,transparent_72%)] blur-[70px]" />

        {/* Rotating Faint Radar Ring centered behind Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] sm:w-[580px] h-[480px] sm:h-[580px] rounded-full border border-white/[0.03] flex items-center justify-center">
          <div className="w-[82%] h-[82%] rounded-full border border-dashed border-white/[0.04] animate-radar-spin" />
        </div>

        {/* Dot Matrix Surface */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* FUI Precision Perimeter Corner Brackets + Coordinate Markers */}
        <div className="absolute top-8 left-8 hidden md:flex items-start gap-2.5">
          <div className="w-10 h-10 border-t border-l border-[#ffe600]/35" />
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest mt-0.5">
            RHODES // SEC-00
          </span>
        </div>
        <div className="absolute top-8 right-8 hidden md:flex items-start gap-2.5">
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest mt-0.5">
            NEURAL CORE
          </span>
          <div className="w-10 h-10 border-t border-r border-white/[0.12]" />
        </div>
        <div className="absolute bottom-8 left-8 hidden md:flex items-end gap-2.5">
          <div className="w-10 h-10 border-b border-l border-white/[0.12]" />
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest mb-0.5">
            PRTS ARCHIVE
          </span>
        </div>
        <div className="absolute bottom-8 right-8 hidden md:flex items-end gap-2.5">
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest mb-0.5">
            SYS.READY
          </span>
          <div className="w-10 h-10 border-b border-r border-[#00d8ff]/35" />
        </div>
      </div>

      {/* Main Centered Hero Container (Staggered Choreography) */}
      <motion.div
        variants={PRTS_STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-8"
      >
        {/* System Identity Badge + Hero Title Lockup */}
        <motion.div variants={PRTS_STAGGER_ITEM} className="space-y-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.09] text-[10.5px] font-mono text-zinc-400 shadow-inner whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600] shadow-[0_0_8px_#ffe600] animate-pulse shrink-0" />
            <span className="text-zinc-200 font-bold tracking-wider">PRTS ARCHIVE SYSTEM</span>
            <span className="text-zinc-600">·</span>
            <span className="text-[#ffe600] font-semibold">{APP_VERSION_CODE}</span>
          </div>

          <div className="flex flex-col items-center gap-2.5">
            <div className="flex items-center justify-center gap-3 text-zinc-400/80">
              <span className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#ffe600]/50" />
              <PrtsNeuralEmblem className="w-6 h-6 text-[#ffe600]" />
              <span className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#00d8ff]/50" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black text-white tracking-tight leading-none flex items-center justify-center gap-3 flex-wrap">
              <span className="font-display tracking-wide text-[#ffe600] drop-shadow-[0_0_24px_rgba(255,230,0,0.22)]">
                PRTS
              </span>
              <span className="font-display tracking-tight">Archive</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 font-normal tracking-wide [word-break:keep-all]">
              명일방주 스토리 요약 모음
            </p>
          </div>
        </motion.div>

        {/* 3 Entry Action Modules (Enhanced Tactile PRTS FUI Styling) */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1"
        >
          {/* 01. 스토리 상세 */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.975 }}
            transition={PRTS_SPRING_SNAPPY}
            onClick={() => {
              playClickSound();
              onNavigateToStory('ep00');
            }}
            className="fui-reticle-hover prts-btn-sweep relative p-4 rounded-[4px] bg-[#ffe600] hover:bg-[#fff04d] text-black flex flex-col justify-between text-left gap-3 shadow-[0_6px_28px_rgba(255,230,0,0.18)] hover:shadow-[0_10px_34px_rgba(255,230,0,0.3)] cursor-pointer group border border-[#ffe600]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-black/65 whitespace-nowrap">
                01 // ARCHIVE
              </span>
              <BookOpen className="w-4 h-4 text-black/80 shrink-0" />
            </div>
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-sm font-extrabold whitespace-nowrap">스토리 상세</span>
              <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* 02. 스토리 목록 */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.975 }}
            transition={PRTS_SPRING_SNAPPY}
            onClick={() => {
              playTabSwitchSound();
              onNavigateToView('chronicle');
            }}
            className="fui-reticle-hover prts-btn-sweep relative p-4 rounded-[4px] bg-[#0e121b]/85 hover:bg-[#131826] text-zinc-100 border border-white/[0.11] hover:border-[#ffe600]/65 flex flex-col justify-between text-left gap-3 backdrop-blur-md shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 group-hover:text-[#ffe600] transition-colors whitespace-nowrap">
                02 // CHRONICLE
              </span>
              <GitBranch className="w-4 h-4 text-[#ffe600] shrink-0" />
            </div>
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-sm font-bold text-white whitespace-nowrap">스토리 목록</span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#ffe600] group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </motion.button>

          {/* 03. 테라 지도 */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.975 }}
            transition={PRTS_SPRING_SNAPPY}
            onClick={() => {
              playTabSwitchSound();
              onNavigateToView('map');
            }}
            className="fui-reticle-hover prts-btn-sweep relative p-4 rounded-[4px] bg-[#0e121b]/85 hover:bg-[#131826] text-zinc-100 border border-white/[0.11] hover:border-[#00d8ff]/65 flex flex-col justify-between text-left gap-3 backdrop-blur-md shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 group-hover:text-[#00d8ff] transition-colors whitespace-nowrap">
                03 // TERRA MAP
              </span>
              <MapIcon className="w-4 h-4 text-[#00d8ff] shrink-0" />
            </div>
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-sm font-bold text-white whitespace-nowrap">테라 지도</span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#00d8ff] group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </motion.button>
        </motion.div>

        {/* Subtle Service Notice & Fullscreen/PWA Links */}
        <motion.div
          variants={PRTS_STAGGER_ITEM}
          className="pt-1 flex flex-wrap items-center justify-center gap-2"
        >
          {isInstallable && onPromptInstall && (
            <button
              onClick={() => {
                playClickSound();
                onPromptInstall();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00d8ff]/10 hover:bg-[#00d8ff]/20 border border-[#00d8ff]/30 hover:border-[#00d8ff]/60 text-[#00d8ff] text-xs font-mono transition-all cursor-pointer group whitespace-nowrap"
            >
              <MonitorDown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" />
              <span>웹 앱 설치 (PWA)</span>
            </button>
          )}

          {onOpenFullscreenGuide && (
            <button
              onClick={() => {
                playClickSound();
                onOpenFullscreenGuide();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/25 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-all cursor-pointer group whitespace-nowrap"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#00d8ff] group-hover:scale-110 transition-transform shrink-0" />
              <span>전체 화면 &amp; 앱 설치 안내</span>
            </button>
          )}

          {onOpenServiceNotice && (
            <button
              onClick={() => {
                playClickSound();
                onOpenServiceNotice();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/25 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-all cursor-pointer group whitespace-nowrap"
            >
              <Info className="w-3.5 h-3.5 text-[#ffe600] group-hover:scale-110 transition-transform shrink-0" />
              <span>서비스 이용 안내 · 권장 환경</span>
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

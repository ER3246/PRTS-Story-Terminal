import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PrtsNeuralEmblem } from './ui/TacticalIcons';
import { APP_VERSION_CODE } from '../version';
import { PRTS_EASE } from '../utils/motion';

interface PrtsBootSequenceProps {
  onComplete: () => void;
}

/**
 * 브라우저 최초 로드 및 새로고침 시 자동으로 재생 후 메인 뷰로 부드럽게 전환되는 PRTS 신경망 부트 모션 그래픽.
 * 약 1.28초 후 자동으로 완료되며, 클릭 또는 Space/Enter/Escape 입력 시 즉시 스킵됩니다.
 */
export const PrtsBootSequence: React.FC<PrtsBootSequenceProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, 1280);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        window.clearTimeout(timer);
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onComplete]);

  return (
    <motion.div
      key="prts-boot-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.02,
        filter: 'blur(6px)',
        transition: { duration: 0.36, ease: PRTS_EASE },
      }}
      onClick={onComplete}
      className="fixed inset-0 z-[100] bg-[#06070b] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
      aria-label="PRTS Archive 로딩 중"
    >
      {/* Background Subtle Architectural Grid */}
      <div
        className="absolute inset-0 opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 0.9, 0.65], scale: [0.7, 1.05, 1] }}
        transition={{ duration: 1.0, ease: PRTS_EASE }}
        className="absolute w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,230,0,0.09)_0%,rgba(0,216,255,0.04)_45%,transparent_72%)] pointer-events-none"
      />

      {/* Scanning Horizontal Beam */}
      <motion.div
        initial={{ top: '-4%', opacity: 0 }}
        animate={{ top: ['0%', '104%'], opacity: [0, 0.8, 0] }}
        transition={{ duration: 1.15, ease: 'easeInOut' }}
        className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d8ff]/70 to-transparent shadow-[0_0_16px_rgba(0,216,255,0.5)] pointer-events-none"
      />

      {/* Corner Calibration Brackets */}
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: PRTS_EASE }}
        className="absolute inset-6 sm:inset-10 pointer-events-none"
      >
        <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-[#ffe600]/65" />
        <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white/25" />
        <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white/25" />
        <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-[#00d8ff]/65" />

        <div className="hidden sm:flex items-center justify-between text-[10px] font-mono text-zinc-500 px-3 pt-1">
          <span>RHODES ISLAND // PRTS NEURAL INTERFACE</span>
          <span>SYNC · {APP_VERSION_CODE}</span>
        </div>
      </motion.div>

      {/* Center Core Assembly */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Rotating Radar Ring + Hex Emblem */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          <motion.svg
            viewBox="0 0 120 120"
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0, rotate: -45, scale: 0.85 }}
            animate={{ opacity: 1, rotate: 90, scale: 1 }}
            transition={{ duration: 1.2, ease: PRTS_EASE }}
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke="#00d8ff"
              strokeOpacity="0.45"
              strokeWidth="1.2"
              strokeDasharray="28 96"
            />
          </motion.svg>

          <motion.div
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.48, delay: 0.08, ease: PRTS_EASE }}
            className="text-zinc-200 drop-shadow-[0_0_16px_rgba(255,230,0,0.28)]"
          >
            <PrtsNeuralEmblem className="w-14 h-14" />
          </motion.div>
        </div>

        {/* Brand Stencil Lockup */}
        <motion.div
          initial={{ opacity: 0, y: 10, letterSpacing: '0.28em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.12em' }}
          transition={{ duration: 0.52, delay: 0.14, ease: PRTS_EASE }}
          className="flex items-center gap-2.5 mb-2"
        >
          <span className="px-2 py-0.5 bg-[#ffe600] text-black font-display font-bold text-xs tracking-wider rounded-[2px]">
            PRTS
          </span>
          <span className="font-display font-bold text-2xl sm:text-3xl text-white tracking-widest">
            ARCHIVE
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="text-[11px] font-mono text-zinc-400 tracking-[0.22em] uppercase mb-6"
        >
          NEURAL ARCHIVE INITIALIZING
        </motion.p>

        {/* Calibration Progress Gauge */}
        <div className="w-56 sm:w-64 space-y-2">
          <div className="h-[3px] w-full bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.96, delay: 0.12, ease: PRTS_EASE }}
              className="h-full bg-gradient-to-r from-[#ffe600] via-[#ffe600] to-[#00d8ff] shadow-[0_0_10px_rgba(255,230,0,0.6)]"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center justify-between text-[10px] font-mono text-zinc-500"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600] animate-pulse" />
              <span>INDEX VERIFIED</span>
            </span>
            <span className="text-zinc-400">TAP TO SKIP</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

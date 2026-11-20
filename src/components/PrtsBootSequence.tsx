import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PrtsNeuralEmblem } from './ui/TacticalIcons';
import { APP_VERSION_CODE } from '../version';
import { PRTS_EASE } from '../utils/motion';
import { storyRegistry, getStoryAccessState } from '../data/storyRegistry';

interface PrtsBootSequenceProps {
  onComplete: () => void;
}

/**
 * 세션 최초 1회 실행되는 PRTS 인더스트리얼 캘리브레이션 시퀀스 (580ms).
 * 클릭 또는 Space/Enter/Escape 입력 시 즉시 스킵됩니다.
 */
export const PrtsBootSequence: React.FC<PrtsBootSequenceProps> = ({ onComplete }) => {
  const availableCount = useMemo(
    () => storyRegistry.filter((s) => getStoryAccessState(s) === 'available').length,
    []
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, 580);

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
        transition: { duration: 0.18, ease: PRTS_EASE },
      }}
      onClick={onComplete}
      className="fixed inset-0 z-[100] bg-[#0b0c0e] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
      aria-label="PRTS Archive 로딩 중"
    >
      {/* Structural 1px Architectural Crosshairs */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.28, ease: PRTS_EASE }}
        className="absolute inset-x-0 top-1/2 h-[1px] bg-white/[0.06] origin-center pointer-events-none"
      />
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.28, ease: PRTS_EASE }}
        className="absolute inset-y-0 left-1/2 w-[1px] bg-white/[0.06] origin-center pointer-events-none"
      />

      {/* Top Specification Micro-Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.04, ease: PRTS_EASE }}
        className="absolute top-6 inset-x-6 sm:inset-x-10 flex items-center justify-between text-[10px] font-mono text-zinc-600 pointer-events-none"
      >
        <span>RHODES ISLAND // PRTS</span>
        <span>CALIBRATION</span>
      </motion.div>

      {/* Center Assembly */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: PRTS_EASE }}
          className="flex flex-col items-center gap-4 mb-5"
        >
          <PrtsNeuralEmblem className="w-9 h-9 text-zinc-100" />

          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 bg-[#f5dd1b] text-black font-mono font-bold text-xs tracking-wider rounded-none">
              PRTS
            </span>
            <span className="font-display font-bold text-2xl sm:text-3xl text-[#f2f2ef] tracking-[0.18em]">
              ARCHIVE
            </span>
          </div>
        </motion.div>

        {/* Minimal Single-Line Progress Track */}
        <div className="w-56 space-y-2">
          <div className="h-[2px] w-full bg-white/[0.08] overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.42, delay: 0.04, ease: PRTS_EASE }}
              className="h-full w-full bg-[#f2f2ef] origin-left"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.08 }}
            className="flex items-center justify-between text-[10px] font-mono text-zinc-500"
          >
            <span>SYS.MOUNT // {availableCount} FULL / {storyRegistry.length} INDEX</span>
            <span>{APP_VERSION_CODE}</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom Interaction Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.14 }}
        className="absolute bottom-6 text-[10px] font-mono text-zinc-600 tracking-wider pointer-events-none"
      >
        CLICK OR PRESS ESC TO ENTER
      </motion.div>
    </motion.div>
  );
};

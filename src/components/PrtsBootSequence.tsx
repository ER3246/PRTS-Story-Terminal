import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PrtsNeuralEmblem } from './ui/TacticalIcons';
import { APP_VERSION_CODE } from '../version';
import { PRTS_EASE } from '../utils/motion';

interface PrtsBootSequenceProps {
  onComplete: () => void;
}

/**
 * 브라우저 최초 로드 및 새로고침 시 재생되는 PRTS 미니멀 인더스트리얼 캘리브레이션 시퀀스.
 * 약 0.95초 후 자동으로 메인 뷰로 전환되며, 클릭 또는 Space/Enter/Escape 입력 시 즉시 스킵됩니다.
 */
export const PrtsBootSequence: React.FC<PrtsBootSequenceProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, 950);

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
        transition: { duration: 0.22, ease: PRTS_EASE },
      }}
      onClick={onComplete}
      className="fixed inset-0 z-[100] bg-[#0c0c0e] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
      aria-label="PRTS Archive 로딩 중"
    >
      {/* Structural 1px Architectural Crosshairs */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: PRTS_EASE }}
        className="absolute inset-x-0 top-1/2 h-[1px] bg-white/[0.06] origin-center pointer-events-none"
      />
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, ease: PRTS_EASE }}
        className="absolute inset-y-0 left-1/2 w-[1px] bg-white/[0.06] origin-center pointer-events-none"
      />

      {/* Top Specification Micro-Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.08, ease: PRTS_EASE }}
        className="absolute top-6 inset-x-6 sm:inset-x-10 flex items-center justify-between text-[10px] font-mono text-zinc-600 pointer-events-none"
      >
        <span>RHODES ISLAND // PRTS</span>
        <span>CALIBRATION</span>
      </motion.div>

      {/* Center Assembly */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: PRTS_EASE }}
          className="flex flex-col items-center gap-4 mb-6"
        >
          <PrtsNeuralEmblem className="w-10 h-10 text-zinc-100" />

          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 bg-zinc-100 text-black font-mono font-bold text-xs tracking-wider rounded-none">
              PRTS
            </span>
            <span className="font-display font-bold text-2xl sm:text-3xl text-white tracking-[0.18em]">
              ARCHIVE
            </span>
          </div>
        </motion.div>

        {/* Minimal Single-Line Progress Track */}
        <div className="w-56 space-y-2.5">
          <div className="h-[2px] w-full bg-white/[0.08] overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.72, delay: 0.06, ease: PRTS_EASE }}
              className="h-full w-full bg-zinc-100 origin-left"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28, delay: 0.12 }}
            className="flex items-center justify-between text-[10px] font-mono text-zinc-500"
          >
            <span>SYS.MOUNT // 24 ARCHIVES</span>
            <span>{APP_VERSION_CODE}</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom Interaction Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="absolute bottom-6 text-[10px] font-mono text-zinc-600 tracking-wider pointer-events-none"
      >
        CLICK OR PRESS ESC TO ENTER
      </motion.div>
    </motion.div>
  );
};

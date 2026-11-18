import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';
import { PRTS_EASE } from '../utils/motion';

interface ScrollNavButtonsProps {
  currentView: string;
}

export const ScrollNavButtons: React.FC<ScrollNavButtonsProps> = ({ currentView }) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 180);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = Math.min(Math.max(window.scrollY / total, 0), 1);
      setScrollProgress(Math.round(progress * 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const isVisible = currentView !== 'home' && currentView !== 'map' && currentView !== 'chronicle';
  const isScrollHudVisible = isVisible && hasScrolled;

  const scrollToTop = () => {
    playClickSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    playClickSound();
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* Top Document Reading Progress Hairline Bar (Only active in Report view) */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="reading-progress-rail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 inset-x-0 h-[2px] z-50 pointer-events-none print:hidden bg-white/[0.04]"
          >
            <div
              className="h-full bg-[#f5dd1b] transition-[width] duration-100 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScrollHudVisible && (
          <motion.div
            key="scroll-nav-hud"
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.22, ease: PRTS_EASE }}
            className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-center gap-0.5 select-none print:hidden"
          >
            {/* 최상단 이동 버튼 */}
            <button
              onClick={scrollToTop}
              title="페이지 최상단으로 이동"
              className="w-9 h-9 rounded-t-[2px] bg-[#121316]/95 hover:bg-[#1a1c22] border border-white/[0.1] hover:border-white/25 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shadow-xl group cursor-pointer"
            >
              <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            {/* 스크롤 진척도 미니 인디케이터 (live bar + %) */}
            <div
              title={`스크롤 위치 ${scrollProgress}%`}
              className="w-9 py-1.5 bg-[#0e0f12]/95 border-x border-white/[0.1] text-center text-[10px] font-mono text-zinc-300 font-bold tracking-tight relative overflow-hidden"
            >
              <span
                className="absolute inset-y-0 left-0 bg-[#f5dd1b]/15 pointer-events-none transition-[width] duration-100"
                style={{ width: `${scrollProgress}%` }}
              />
              <span className="relative z-10">{scrollProgress}%</span>
            </div>

            {/* 최하단 이동 버튼 */}
            <button
              onClick={scrollToBottom}
              title="페이지 최하단으로 이동"
              className="w-9 h-9 rounded-b-[2px] bg-[#121316]/95 hover:bg-[#1a1c22] border border-white/[0.1] hover:border-white/25 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shadow-xl group cursor-pointer"
            >
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScrollNavButtons;

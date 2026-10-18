import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';

interface ScrollNavButtonsProps {
  currentView: string;
}

export const ScrollNavButtons: React.FC<ScrollNavButtonsProps> = ({ currentView }) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
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

  // 메인 페이지(home) 및 전술 지도(map)는 스크롤 조작이 불필요하므로 이동 버튼 미표시
  if (currentView === 'home' || currentView === 'map') {
    return null;
  }

  const scrollToTop = () => {
    playClickSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    playClickSound();
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="fixed bottom-6 right-5 sm:right-6 z-40 flex flex-col items-center gap-1 select-none print:hidden">
      {/* 최상단 이동 버튼 */}
      <button
        onClick={scrollToTop}
        title="페이지 최상단으로 이동"
        className="w-9 h-9 rounded-t-[4px] bg-[#0b0e16]/90 hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.1] hover:border-[#ffe600]/60 text-zinc-400 hover:text-[#ffe600] flex items-center justify-center transition-all shadow-2xl group cursor-pointer"
      >
        <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* 스크롤 진척도 미니 인디케이터 */}
      <div 
        title={`스크롤 위치 ${scrollProgress}%`}
        className="w-9 py-1 bg-[#080a10]/95 backdrop-blur-xl border-x border-white/[0.1] text-center text-[10px] font-mono text-zinc-400 font-bold tracking-tight"
      >
        {scrollProgress}%
      </div>

      {/* 최하단 이동 버튼 */}
      <button
        onClick={scrollToBottom}
        title="페이지 최하단으로 이동"
        className="w-9 h-9 rounded-b-[4px] bg-[#0b0e16]/90 hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.1] hover:border-[#ffe600]/60 text-zinc-400 hover:text-[#ffe600] flex items-center justify-center transition-all shadow-2xl group cursor-pointer"
      >
        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};

export default ScrollNavButtons;

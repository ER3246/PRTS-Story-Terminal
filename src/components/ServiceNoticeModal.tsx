import React, { useState, useEffect } from 'react';
import {
  Info,
  Globe,
  Cpu,
  Wifi,
  X
} from 'lucide-react';
import { playClickSound, playCloseSound } from '../utils/soundEffects';

interface ServiceNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDismissToday?: () => void;
}

export const ServiceNoticeModal: React.FC<ServiceNoticeModalProps> = ({
  isOpen,
  onClose,
  onConfirmDismissToday,
}) => {
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playCloseSound();
        if (dontShowToday) {
          onConfirmDismissToday?.();
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, dontShowToday, onConfirmDismissToday]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    playClickSound();
    if (dontShowToday) {
      onConfirmDismissToday?.();
    }
    onClose();
  };

  const handleClose = () => {
    playCloseSound();
    if (dontShowToday) {
      onConfirmDismissToday?.();
    }
    onClose();
  };

  return (
    <div
      data-modal="true"
      data-hud-panel="true"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] bg-[#0c0e14]/98 border border-white/20 rounded-[4px] shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-zinc-100 animate-scaleUp font-sans"
      >
        {/* Top High-Tech Accent Bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#ffe600] via-[#00d8ff] to-transparent" />

        {/* Modal Header */}
        <div className="px-4.5 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] bg-[#ffe600]/15 border border-[#ffe600]/50 flex items-center justify-center text-[#ffe600]">
              <Info className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              이용 안내 및 권장 환경
            </h2>
          </div>

          <button
            onClick={handleClose}
            title="닫기 (ESC)"
            className="w-6 h-6 rounded-[2px] bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body: 핵심만 직관적으로 안내 */}
        <div className="p-4 sm:p-4.5 space-y-2 text-xs">
          {/* 1. 크로미움 브라우저 */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-[3px] bg-white/[0.03] border border-white/[0.08]">
            <Globe className="w-4 h-4 text-[#00d8ff] shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <div className="font-bold text-white text-[12px]">크로미움 브라우저 권장</div>
              <div className="text-zinc-400 text-[11px] leading-relaxed">
                Chrome, Microsoft Edge, Whale 등에 최적화되어 있습니다.
              </div>
            </div>
          </div>

          {/* 2. 하드웨어 가속 */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-[3px] bg-white/[0.03] border border-white/[0.08]">
            <Cpu className="w-4 h-4 text-[#ffe600] shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <div className="font-bold text-white text-[12px]">하드웨어 가속(GPU) 활성화</div>
              <div className="text-zinc-400 text-[11px] leading-relaxed">
                3D 테라 전술 지도의 원활한 렌더링을 위해 가속 설정을 켜주세요.
              </div>
            </div>
          </div>

          {/* 3. 모바일 Wi-Fi 권장 */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-[3px] bg-amber-500/[0.06] border border-amber-400/25">
            <Wifi className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <div className="font-bold text-amber-300 text-[12px]">모바일 Wi-Fi 권장</div>
              <div className="text-zinc-300 text-[11px] leading-relaxed">
                고화질 컷신 CG 및 데이터가 많으니 모바일 환경에서는 Wi-Fi 이용을 권장합니다.
              </div>
            </div>
          </div>

          <p className="text-[10.5px] text-zinc-400 text-center pt-0.5 font-mono">
            ※ 비공식·비영리 팬 아카이브 (© HYPERGRYPH / YOSTAR)
          </p>
        </div>

        {/* Modal Footer: 왼쪽 끝 토글 + 하단 길게 배치된 확인 버튼 */}
        <div className="px-4.5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center gap-3">
          {/* 왼쪽 끝: 오늘 하루 보지 않기 토글 */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-zinc-400 hover:text-zinc-200 shrink-0 group">
            <div className="relative">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 rounded-full bg-white/15 peer-checked:bg-[#ffe600] transition-colors" />
              <div
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${
                  dontShowToday ? 'translate-x-3 bg-black' : 'bg-zinc-400 group-hover:bg-zinc-200'
                }`}
              />
            </div>
            <span className="whitespace-nowrap">오늘 하루 보지 않기</span>
          </label>

          {/* 확인 버튼: 길게 전체 너비 확장 */}
          <button
            onClick={handleConfirm}
            className="flex-1 h-9 px-4 rounded-[3px] bg-[#ffe600] hover:bg-[#fff04d] text-black font-bold text-xs flex items-center justify-center transition-all shadow-[0_0_14px_rgba(255,230,0,0.18)] hover:shadow-[0_0_18px_rgba(255,230,0,0.32)] cursor-pointer"
          >
            <span>확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};

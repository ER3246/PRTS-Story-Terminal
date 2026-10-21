import React, { useState, useEffect } from 'react';
import {
  Info,
  Globe,
  Cpu,
  Wifi,
  X,
  ArrowRight
} from 'lucide-react';
import { playClickSound, playCloseSound } from '../utils/soundEffects';
import { APP_VERSION_CODE } from '../version';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] bg-[#0c0e14]/98 border border-white/20 rounded-[5px] shadow-[0_24px_64px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden text-zinc-100 animate-scaleUp font-sans"
      >
        {/* Top High-Tech Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#ffe600] via-[#00d8ff] to-transparent" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[3px] bg-[#ffe600]/15 border border-[#ffe600]/50 flex items-center justify-center text-[#ffe600]">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  PRTS 터미널 접속 및 서비스 안내
                </h2>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 text-[#ffe600] font-mono text-[9.5px] font-bold">
                  {APP_VERSION_CODE}
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-zinc-400">
                SYSTEM ENVIRONMENT & OPERATION NOTICE
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            title="닫기 (ESC)"
            className="w-7 h-7 rounded-[2px] bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 text-xs sm:text-[12.5px] leading-relaxed">
          {/* Section 1: 서비스 안내 */}
          <div className="p-3 rounded-[4px] bg-white/[0.025] border border-white/[0.07] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
              <span>서비스 개요 (비공식 · 비영리 아카이브)</span>
            </div>
            <p className="text-zinc-300 [word-break:keep-all]">
              본 사이트는 모바일 게임 《명일방주》의 방대한 메인 테마·사이드 스토리 요약, 연대기 타임라인 및 3D/2D 테라 전술 지도를 인터랙티브하게 열람할 수 있는 비공식 팬 아카이브입니다.
            </p>
          </div>

          {/* Section 2: 브라우저 및 하드웨어 가속 권장 */}
          <div className="p-3 rounded-[4px] bg-white/[0.025] border border-white/[0.07] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <Globe className="w-3.5 h-3.5 text-[#00d8ff]" />
              <span>권장 브라우저 및 그래픽 가속 환경</span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 [word-break:keep-all]">
              <li className="flex items-start gap-2">
                <span className="text-[#00d8ff] font-mono font-bold mt-0.5">•</span>
                <span>
                  <strong>크로미움(Chromium) 기반 브라우저 권장:</strong> Chrome, Microsoft Edge, Brave, Naver Whale 등 크로미움 엔진 브라우저에 가장 최적화되어 있습니다.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#ffe600] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>브라우저 하드웨어 가속(GPU) 활성화:</strong> 3D 테라 전술 지도 및 다이내믹 WebGL 렌더링이 포함되어 있으므로, 브라우저 설정에서 <strong>'가능한 경우 그래픽/하드웨어 가속 사용'</strong>을 반드시 켜주시기 바랍니다.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 3: 데이터 소모 주의 및 Wi-Fi 권장 */}
          <div className="p-3 rounded-[4px] bg-amber-500/[0.07] border border-amber-400/30 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
              <Wifi className="w-3.5 h-3.5 text-amber-400" />
              <span>데이터 소모 주의 및 모바일 Wi-Fi 환경 권장</span>
            </div>
            <p className="text-zinc-200 text-[11.5px] sm:text-xs [word-break:keep-all]">
              사이트 내 다수의 고해상도 공식 컷신 CG, 캐릭터 전신 일러스트 및 방대한 원문 시나리오 텍스트가 수록되어 있어 <strong>데이터 소모량이 많을 수 있습니다</strong>. 모바일 환경에서 접속 시 LTE/5G 요금제 데이터 차감에 유의하시고, <strong>안정적인 Wi-Fi 환경</strong>에서의 이용을 적극 권장합니다.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 accent-[#ffe600] cursor-pointer"
            />
            <span>오늘 하루 보지 않기</span>
          </label>

          <button
            onClick={handleConfirm}
            className="h-8 px-4 rounded-[3px] bg-[#ffe600] hover:bg-[#fff04d] text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>확인 및 터미널 접속</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Maximize2,
  Download,
  Share,
  PlusSquare,
  Smartphone,
  Monitor,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { playClickSound, playCloseSound } from '../utils/soundEffects';
import { PRTS_MODAL_BACKDROP, PRTS_MODAL_PANEL } from '../utils/motion';

interface FullscreenPwaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInstallable: boolean;
  isStandalone: boolean;
  onPromptInstall?: () => Promise<boolean>;
}

export const FullscreenPwaGuideModal: React.FC<FullscreenPwaGuideModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isInstallable,
  isStandalone,
  onPromptInstall,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playCloseSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClose = () => {
    playCloseSound();
    onClose();
  };

  const handleInstallClick = async () => {
    playClickSound();
    if (onPromptInstall) {
      const success = await onPromptInstall();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="fullscreen-guide-backdrop"
          variants={PRTS_MODAL_BACKDROP}
          initial="hidden"
          animate="visible"
          exit="exit"
          data-modal="true"
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
        >
          <motion.div
            variants={PRTS_MODAL_PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[500px] bg-[#121316] border border-white/15 rounded-[2px] shadow-2xl flex flex-col overflow-hidden text-zinc-100 font-sans"
          >
        {/* Top Accent Bar */}
        <div className="h-[2px] w-full bg-zinc-200" />

        {/* Header */}
        <div className="px-4.5 py-3 border-b border-white/[0.08] flex items-center justify-between bg-[#16181d]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] bg-white/[0.06] border border-white/15 flex items-center justify-center text-zinc-200">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>전체 화면 및 웹 앱 설치 안내</span>
                {isStandalone && (
                  <span className="px-1.5 py-0.2 rounded-[1px] bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-normal border border-emerald-500/40">
                    앱 실행 중
                  </span>
                )}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            title="닫기 (ESC)"
            className="w-6 h-6 rounded-[2px] bg-[#1c1e24] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4.5 space-y-3.5 text-xs">
          {/* iOS Safari 환경 안내 */}
          <div
            className={`p-3 rounded-[2px] border transition-colors ${
              isIOS
                ? 'bg-[#17191e] border-[#f5dd1b]/70'
                : 'bg-[#15161a] border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white text-[12.5px]">
                <Smartphone className="w-4 h-4 text-zinc-400" />
                <span>iOS (iPhone / iPad Safari)</span>
              </div>
              {isIOS && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-[#f5dd1b] text-black font-bold font-mono">
                  CURRENT DEVICE
                </span>
              )}
            </div>

            <div className="space-y-2 text-zinc-300 text-[11.5px] leading-relaxed">
              <div className="flex items-start gap-1.5 text-zinc-300 bg-[#101114] p-2 rounded-[2px] border border-white/[0.07] border-l-2 border-l-[#f5dd1b]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#f5dd1b]" />
                <span>
                  애플 정책상 사파리 브라우저 내부 버튼을 통한 전체 화면 확장이 제한됩니다.
                </span>
              </div>

              <div className="space-y-1.5 pt-1 pl-1">
                <div className="font-semibold text-zinc-200">
                  주소창 없는 전체 화면(독립 앱) 이용 방법:
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-4 h-4 rounded-[1px] bg-white/10 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                    1
                  </span>
                  <span>
                    사파리 하단 툴바의 <strong className="text-white inline-flex items-center gap-1 mx-0.5"><Share className="w-3.5 h-3.5 text-zinc-300" /> 공유</strong> 버튼을 터치합니다.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-4 h-4 rounded-[1px] bg-white/10 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                    2
                  </span>
                  <span>
                    메뉴를 내려 <strong className="text-white inline-flex items-center gap-1 mx-0.5"><PlusSquare className="w-3.5 h-3.5 text-zinc-300" /> 홈 화면에 추가</strong>를 누릅니다.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-4 h-4 rounded-[1px] bg-white/10 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                    3
                  </span>
                  <span>
                    홈 화면에 생성된 <strong>PRTS 아이콘</strong>으로 접속하면 주소창 없는 100% 전체 화면으로 실행됩니다.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Android / PC Chrome 환경 안내 */}
          <div
            className={`p-3 rounded-[2px] border transition-colors ${
              !isIOS
                ? 'bg-[#17191e] border-[#f5dd1b]/70'
                : 'bg-[#15161a] border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white text-[12.5px]">
                <Monitor className="w-4 h-4 text-zinc-400" />
                <span>Android / PC (Chrome · Edge · Whale)</span>
              </div>
              {!isIOS && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-[#f5dd1b] text-black font-bold font-mono">
                  CURRENT DEVICE
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-zinc-300 text-[11.5px] leading-relaxed pl-1">
              <div className="flex items-start gap-1.5">
                <span className="text-zinc-400 font-bold mt-0.5">•</span>
                <span>
                  <strong>전체 화면 버튼:</strong> 상단 헤더의 <strong>[전체 화면]</strong> 버튼을 누르면 즉시 브라우저 주소창과 툴바가 숨겨집니다.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-zinc-400 font-bold mt-0.5">•</span>
                <span>
                  <strong>독립 웹 앱 설치:</strong> 브라우저 주소창 우측의 설치 아이콘이나 아래 [앱 설치] 버튼을 통해 PC/스마트폰 홈에 설치하여 사용할 수 있습니다.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4.5 py-3 border-t border-white/[0.08] bg-[#101114] flex items-center justify-between gap-3">
          {/* 앱 설치 버튼 */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="h-8.5 px-3.5 rounded-[2px] bg-[#1c1e24] hover:bg-[#f5dd1b] text-zinc-100 hover:text-black border border-white/15 hover:border-[#f5dd1b] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>웹 앱 설치하기</span>
            </button>
          )}

          {isStandalone && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>현재 독립 앱(PWA) 모드로 실행 중</span>
            </div>
          )}

          {!isInstallable && !isStandalone && <div />}

          <button
            onClick={handleClose}
            className="h-8.5 px-4 rounded-[2px] bg-[#181a20] hover:bg-zinc-100 text-zinc-200 hover:text-black border border-white/15 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
          >
            <span>확인</span>
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React, { useEffect } from 'react';
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

  if (!isOpen) return null;

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
        className="relative w-full max-w-[500px] bg-[#0c0e14]/98 border border-white/20 rounded-[4px] shadow-[0_24px_64px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden text-zinc-100 animate-scaleUp font-sans"
      >
        {/* Top Accent Bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#ffe600] via-[#00d8ff] to-transparent" />

        {/* Header */}
        <div className="px-4.5 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] bg-[#ffe600]/15 border border-[#ffe600]/50 flex items-center justify-center text-[#ffe600]">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>전체 화면 및 웹 앱 설치 안내</span>
                {isStandalone && (
                  <span className="px-1.5 py-0.2 rounded-[2px] bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-normal border border-emerald-500/40">
                    앱 실행 중
                  </span>
                )}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            title="닫기 (ESC)"
            className="w-6 h-6 rounded-[2px] bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4.5 space-y-3.5 text-xs">
          {/* iOS Safari 환경 안내 */}
          <div
            className={`p-3 rounded-[3px] border transition-all ${
              isIOS
                ? 'bg-[#ffe600]/[0.06] border-[#ffe600]/40 shadow-[0_0_12px_rgba(255,230,0,0.08)]'
                : 'bg-white/[0.025] border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white text-[12.5px]">
                <Smartphone className="w-4 h-4 text-[#00d8ff]" />
                <span>iOS (iPhone / iPad Safari)</span>
              </div>
              {isIOS && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#ffe600] text-black font-bold font-mono">
                  CURRENT DEVICE
                </span>
              )}
            </div>

            <div className="space-y-2 text-zinc-300 text-[11.5px] leading-relaxed">
              <div className="flex items-start gap-1.5 text-amber-300/90 bg-amber-500/10 p-2 rounded-[2px] border border-amber-500/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  애플 정책상 사파리 브라우저 내부 버튼을 통한 전체 화면 확장이 제한됩니다.
                </span>
              </div>

              <div className="space-y-1.5 pt-1 pl-1">
                <div className="font-semibold text-zinc-200">
                  주소창 없는 전체 화면(독립 앱) 이용 방법:
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                    1
                  </span>
                  <span>
                    사파리 하단 툴바의 <strong className="text-white inline-flex items-center gap-1 mx-0.5"><Share className="w-3.5 h-3.5 text-[#00d8ff]" /> 공유</strong> 버튼을 터치합니다.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                    2
                  </span>
                  <span>
                    메뉴를 내려 <strong className="text-white inline-flex items-center gap-1 mx-0.5"><PlusSquare className="w-3.5 h-3.5 text-[#ffe600]" /> 홈 화면에 추가</strong>를 누릅니다.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
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
            className={`p-3 rounded-[3px] border transition-all ${
              !isIOS
                ? 'bg-[#ffe600]/[0.06] border-[#ffe600]/40 shadow-[0_0_12px_rgba(255,230,0,0.08)]'
                : 'bg-white/[0.025] border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white text-[12.5px]">
                <Monitor className="w-4 h-4 text-[#ffe600]" />
                <span>Android / PC (Chrome · Edge · Whale)</span>
              </div>
              {!isIOS && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#ffe600] text-black font-bold font-mono">
                  CURRENT DEVICE
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-zinc-300 text-[11.5px] leading-relaxed pl-1">
              <div className="flex items-start gap-1.5">
                <span className="text-[#ffe600] font-bold mt-0.5">•</span>
                <span>
                  <strong>전체 화면 버튼:</strong> 상단 헤더의 <strong>[전체 화면]</strong> 버튼을 누르면 즉시 브라우저 주소창과 툴바가 숨겨집니다.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#ffe600] font-bold mt-0.5">•</span>
                <span>
                  <strong>독립 웹 앱 설치:</strong> 브라우저 주소창 우측의 설치 아이콘이나 아래 [앱 설치] 버튼을 통해 PC/스마트폰 홈에 설치하여 사용할 수 있습니다.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4.5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          {/* 앱 설치 버튼 (Android / PC Chrome에서 설치 가능한 경우) */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="h-8.5 px-3.5 rounded-[3px] bg-[#00d8ff]/20 hover:bg-[#00d8ff]/30 text-[#00d8ff] border border-[#00d8ff]/50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
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
            className="h-8.5 px-4 rounded-[3px] bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 hover:text-white border border-white/15 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
          >
            <span>확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};

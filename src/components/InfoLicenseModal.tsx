import React, { useState, useEffect } from 'react';
import {
  Info,
  ShieldAlert,
  Sparkles,
  Keyboard,
  Smartphone,
  X,
  CheckCircle2,
  AlertTriangle,
  MousePointer
} from 'lucide-react';
import { playClickSound, playCloseSound, playTabSwitchSound } from '../utils/soundEffects';

interface InfoLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'license' | 'ai_disclaimer' | 'controls';
}

export const InfoLicenseModal: React.FC<InfoLicenseModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'license',
}) => {
  const [activeTab, setActiveTab] = useState<'license' | 'ai_disclaimer' | 'controls'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

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

  return (
    <div
      data-modal="true"
      data-hud-panel="true"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        playCloseSound();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] bg-[#0a0d16]/98 border border-white/20 rounded-[4px] shadow-[0_24px_64px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-zinc-100 animate-scaleUp font-sans"
      >
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#ffe600] via-[#00d8ff] to-transparent" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[3px] bg-[#ffe600]/15 border border-[#ffe600]/50 flex items-center justify-center text-[#ffe600]">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  PRTS 터미널 안내 · 저작권 및 면책 고지
                </h2>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 text-[#ffe600] font-mono text-[10px] font-bold">
                  INFO / LICENSE
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                COPYRIGHT NOTICE, AI CONTENT DISCLAIMER & OPERATION GUIDE
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            title="닫기 (ESC)"
            className="w-7 h-7 rounded-[2px] bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Tab Segmented Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-white/[0.08] bg-[#07090f] flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              playTabSwitchSound();
              setActiveTab('license');
            }}
            className={`h-8 px-3.5 rounded-[3px] text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'license'
                ? 'bg-[#ffe600] text-black font-bold shadow'
                : 'bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.07]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>1. 저작권 및 비영리 고지</span>
          </button>

          <button
            onClick={() => {
              playTabSwitchSound();
              setActiveTab('ai_disclaimer');
            }}
            className={`h-8 px-3.5 rounded-[3px] text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'ai_disclaimer'
                ? 'bg-[#ffe600] text-black font-bold shadow'
                : 'bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.07]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. AI 개발 및 요약 면책 고지</span>
          </button>

          <button
            onClick={() => {
              playTabSwitchSound();
              setActiveTab('controls');
            }}
            className={`h-8 px-3.5 rounded-[3px] text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'controls'
                ? 'bg-[#ffe600] text-black font-bold shadow'
                : 'bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.07]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>3. PC · 모바일 조작 가이드</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-[13px] leading-relaxed">
          {/* TAB 1: 비영리 팬 사이트 및 저작권 귀속 고지 */}
          {activeTab === 'license' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-[3px] bg-[#ffe600]/[0.06] border border-[#ffe600]/30 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#ffe600] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    비공식 · 비영리 팬 아카이브 프로젝트 (Unofficial Non-Profit Fan Archive)
                  </div>
                  <p className="text-zinc-300 [word-break:keep-all]">
                    본 웹사이트(<strong>PRTS Story Terminal</strong>)는 모바일 게임 《명일방주(Arknights)》의 방대한 메인 테마 및 사이드 스토리를 한눈에 조망할 수 있도록 제작된 <strong>비공식·비영리 팬 아카이브</strong>이며, 공식 개발사 및 퍼블리셔와 아무런 제휴 관계가 없습니다.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[3px] bg-white/[0.025] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                  <span className="font-bold text-white text-sm">지식재산권(IP) 및 공식 리소스 저작권 귀속</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/70 border border-white/15 text-[#ffe600]">
                    © HYPERGRYPH / YOSTAR
                  </span>
                </div>

                <ul className="space-y-2.5 text-zinc-300 [word-break:keep-all]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ffe600] flex-shrink-0 mt-0.5" />
                    <span>
                      사이트 내 포함된 모든 <strong>인게임 이미지(컷신 CG, 배경 일러스트, 국가·진영 엠블럼, 캐릭터 아바타), 세계관 설정, 고유명사, 원문 시나리오의 저작권과 지식재산권</strong>은 전적으로 원저작권자인 <strong>Hypergryph (鷹角網絡) / Studio Montagne / Yostar</strong>에 귀속됩니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ffe600] flex-shrink-0 mt-0.5" />
                    <span>
                      모든 인게임 이미지 우측 하단에는 원저작권자 표기(<code>© HYPERGRYPH / YOSTAR</code>) 워터마크가 자동으로 오버레이되며, 무단 드래그 및 우클릭 저장이 제한되어 있습니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ffe600] flex-shrink-0 mt-0.5" />
                    <span>
                      본 사이트는 <strong>어떠한 상업적 수익, 광고 게재, 유료 결제, 후원금도 일절 창출하지 않으며</strong>, 저작권자의 수정 또는 삭제 요청 시 즉각 해당 리소스를 철회하거나 사이트를 비공개 전환합니다.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-[3px] bg-black/50 border border-white/[0.06] font-mono text-[11px] text-zinc-400 space-y-1">
                <div className="text-zinc-200 font-bold">ENGLISH COPYRIGHT NOTICE</div>
                <p>
                  All in-game visual assets, worldbuilding lore, character designs, and scenario rights belong exclusively to <strong>© HYPERGRYPH / STUDIO MONTAGNE / YOSTAR</strong>. This is a strictly non-commercial, non-profit fan archive.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: AI 에이전트 개발 및 스토리 요약 면책 고지 */}
          {activeTab === 'ai_disclaimer' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-[3px] bg-amber-500/10 border border-amber-400/35 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    AI 에이전트 기반 개발 및 2차 요약 데이터 면책 고지
                  </div>
                  <p className="text-zinc-200 [word-break:keep-all]">
                    본 사이트의 프론트엔드 UI/코드 아키텍처 개발뿐만 아니라, 사이트에 수록된 <strong>스토리 요약문, 스테이지별 브리핑, 작전 사후 분석, 인물 및 용어 해설 데이터는 AI 에이전트 파이프라인을 통해 생성·요약된 2차 가공물</strong>입니다.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[3px] bg-white/[0.025] border border-white/[0.08] space-y-3">
                <div className="font-bold text-white text-sm border-b border-white/[0.07] pb-2">
                  열람 시 유의 사항 (Accuracy & Hallucination Disclaimer)
                </div>

                <ul className="space-y-2.5 text-zinc-300 [word-break:keep-all]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#ffe600] font-mono font-bold mt-0.5">01</span>
                    <span>
                      <strong>원작 설정과의 해석 차이 및 요약 압축:</strong> 방대한 분량의 인게임 대본을 아카이브 브리핑 형식으로 압축·요약하는 과정에서, 세부 묘사가 생략되거나 원작의 문맥과 다소 다른 뉘앙스로 서술된 구간이 있을 수 있습니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ffe600] font-mono font-bold mt-0.5">02</span>
                    <span>
                      <strong>오표기·번역 차이·서사 누락 가능성:</strong> 한국 서버(<code>ko_KR</code>) 공식 고유명사 용어집과 대조 검수를 진행했으나, AI 요약 모델 특성상 일부 고유명사 오표기, 번역 차이, 또는 서사 누락(환각, Hallucination)이 남아있을 수 있습니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ffe600] font-mono font-bold mt-0.5">03</span>
                    <span>
                      <strong>공식 원문 감상 권장:</strong> 본 사이트의 요약문은 스토리 흐름 파악과 복기를 돕기 위한 참고 자료이며, 가장 정확한 공식 스토리와 연출은 반드시 <strong>《명일방주》 인게임 기록 복원 및 공식 아카이브</strong>를 통해 감상해 주시기 바랍니다.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: PC 마우스·키보드 및 모바일 터치 조작 가이드 */}
          {activeTab === 'controls' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PC 조작 가이드 */}
                <div className="p-4 rounded-[3px] bg-white/[0.025] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2">
                    <MousePointer className="w-4 h-4 text-[#ffe600]" />
                    <span className="font-bold text-white text-sm">PC 환경 조작 가이드 (마우스 · 키보드)</span>
                  </div>
                  <ul className="space-y-2 text-zinc-300 text-xs [word-break:keep-all]">
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">지도 및 계보 이동</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-white">좌클릭 드래그 / WASD · 방향키</kbd>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">3D 지도 회전 · 기울기</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-[#00d8ff]">우클릭 드래그 / Shift+드래그</kbd>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">화면 확대 · 축소</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-[#ffe600]">마우스 휠 스크롤 / + - 버튼</kbd>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">이전 · 다음 스토리 이동</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-white">← / → 방향키 (보고서 뷰)</kbd>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">열린 팝업 · 드로어 닫기</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-zinc-300">ESC 키</kbd>
                    </li>
                  </ul>
                </div>

                {/* 모바일 터치 조작 가이드 */}
                <div className="p-4 rounded-[3px] bg-white/[0.025] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2">
                    <Smartphone className="w-4 h-4 text-[#00d8ff]" />
                    <span className="font-bold text-white text-sm">모바일 · 태블릿 터치 조작 가이드</span>
                  </div>
                  <ul className="space-y-2 text-zinc-300 text-xs [word-break:keep-all]">
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">지도 이동</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-white">👆 한 손가락 터치 드래그</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">확대 · 축소</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-[#ffe600]">🤏 두 손가락 핀치 줌 / + - 버튼</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">거점 · 경로 정보 확인</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-[#00d8ff]">📍 1회 탭: 요약 미니 카드 표시</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">작전 기록 진입</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-white">카드 내 [작전 기록 열람] 탭</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">모바일 스토리 색인</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-zinc-300">좌측 하단 [스토리 색인] 버튼</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono text-[11px] text-zinc-400">
            © HYPERGRYPH / STUDIO MONTAGNE / YOSTAR · UNOFFICIAL FAN ARCHIVE
          </span>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-[2px] bg-[#ffe600] hover:bg-[#fff04d] text-black font-bold transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

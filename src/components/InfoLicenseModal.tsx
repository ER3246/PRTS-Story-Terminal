import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Info,
  ShieldAlert,
  Sparkles,
  Keyboard,
  Smartphone,
  X,
  CheckCircle2,
  AlertTriangle,
  MousePointer,
  History,
  Type,
  Maximize2,
  Share,
  PlusSquare,
  Monitor,
  Hand,
  MapPin
} from 'lucide-react';
import { playClickSound, playCloseSound, playTabSwitchSound } from '../utils/soundEffects';
import { APP_VERSION_CODE, APP_RELEASE_STAGE, CHANGELOG_DATA } from '../version';
import { PRTS_MODAL_BACKDROP, PRTS_MODAL_PANEL } from '../utils/motion';

export type InfoModalTab = 'license' | 'ai_disclaimer' | 'controls' | 'changelog' | 'app_fullscreen';

interface InfoLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: InfoModalTab;
}

export const InfoLicenseModal: React.FC<InfoLicenseModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'license',
}) => {
  const [activeTab, setActiveTab] = useState<InfoModalTab>(initialTab);
  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  if (isOpen && (!prevOpen || initialTab !== prevInitialTab)) {
    setPrevOpen(isOpen);
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="info-license-backdrop"
          variants={PRTS_MODAL_BACKDROP}
          initial="hidden"
          animate="visible"
          exit="exit"
          data-modal="true"
          data-hud-panel="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            playCloseSound();
            onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none"
        >
          <motion.div
            variants={PRTS_MODAL_PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl h-[min(620px,86vh)] bg-[#121316] border border-white/15 rounded-[2px] shadow-2xl flex flex-col overflow-hidden text-zinc-100 font-sans"
          >
            {/* Top Accent Line */}
            <div className="h-[2px] w-full bg-zinc-200 shrink-0" />

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#16181d] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[2px] bg-[#101114] border border-white/15 flex items-center justify-center text-zinc-200 shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      PRTS Archive 안내 · 저작권 및 운영 정보
                    </h2>
                    <span className="px-1.5 py-0.5 rounded-[2px] bg-white/[0.07] text-zinc-300 font-mono text-[10px] font-bold shrink-0 whitespace-nowrap">
                      INFO / LICENSE
                    </span>
                  </div>
                  <p className="text-[10.5px] font-mono text-zinc-500 truncate">
                    COPYRIGHT NOTICE · AI DISCLAIMER · CONTROLS · CHANGELOG
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playCloseSound();
                  onClose();
                }}
                title="닫기 (ESC)"
                className="w-7 h-7 rounded-[2px] bg-[#1c1e24] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5-Tab Architectural Bar */}
            <div className="px-5 bg-[#0e0f12] border-b border-white/[0.08] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              {(
                [
                  { id: 'license', label: '저작권 고지', Icon: ShieldAlert },
                  { id: 'ai_disclaimer', label: 'AI 요약 안내', Icon: Sparkles },
                  { id: 'controls', label: '조작 안내', Icon: Keyboard },
                  { id: 'changelog', label: '버전 기록', Icon: History },
                  { id: 'app_fullscreen', label: '전체 화면 · 앱 설치', Icon: Maximize2 },
                ] as const
              ).map(({ id, label, Icon }) => {
                const isSelected = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      playTabSwitchSound();
                      setActiveTab(id);
                    }}
                    className={`relative h-10 px-3 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{label}</span>
                    {isSelected && (
                      <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#f5dd1b]" />
                    )}
                  </button>
                );
              })}
            </div>

        {/* Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-[13px] leading-relaxed">
          {/* TAB 1: 비영리 팬 사이트 및 저작권 귀속 고지 */}
          {activeTab === 'license' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] border-l-2 border-l-[#f5dd1b] flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#f5dd1b] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    비공식 · 비영리 팬 아카이브
                  </div>
                  <p className="text-zinc-300 [word-break:keep-all]">
                    <strong>PRTS Archive</strong>는 《명일방주(Arknights)》의 메인·사이드 스토리를 정리해 제공하는 비공식 팬 아카이브이며, 공식 개발사 및 퍼블리셔와 제휴 관계가 없습니다.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                  <span className="font-bold text-white text-sm">지식재산권(IP) 및 리소스 권리</span>
                  <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/10 text-zinc-300">
                    © HYPERGRYPH / YOSTAR
                  </span>
                </div>

                <ul className="space-y-2 text-zinc-300 [word-break:keep-all]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <span>
                      사이트 내 인게임 CG, 배경 일러스트, 세력 엠블럼, 캐릭터 아바타, 세계관 설정 및 원문 시나리오의 권리는 모두 원저작권자(<strong>Hypergryph / Studio Montagne / Yostar</strong>)에 귀속됩니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <span>
                      인게임 리소스에는 원저작권자 표기(<code>© HYPERGRYPH / YOSTAR</code>) 워터마크가 적용되며 무단 드래그 및 우클릭 저장이 제한됩니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <span>
                      본 사이트는 광고, 결제, 후원 등 일체의 상업적 수익을 창출하지 않으며, 권리자 요청 시 즉시 리소스를 철회하거나 비공개 전환합니다.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 오픈소스 폰트 라이선스 고지 */}
              <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold text-white text-sm">오픈소스 폰트 라이선스</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/10 text-zinc-300 font-bold">
                    OFL 1.1 / APACHE 2.0
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-[2px] bg-[#101114] border border-white/[0.06] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs font-sans">Pretendard</span>
                      <span className="text-[10px] text-[#f5dd1b] font-mono font-bold">SIL OFL 1.1</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">© 2021 Kil Hyung-jin</div>
                    <div className="text-[10.5px] text-zinc-500 leading-tight">본문 및 UI 국문 기본 서체</div>
                  </div>

                  <div className="p-2.5 rounded-[2px] bg-[#101114] border border-white/[0.06] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs font-mono">JetBrains Mono</span>
                      <span className="text-[10px] text-zinc-300 font-mono font-bold">OFL / Apache 2.0</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">© JetBrains s.r.o.</div>
                    <div className="text-[10.5px] text-zinc-500 leading-tight">코드·인덱스 고정폭 서체</div>
                  </div>

                  <div className="p-2.5 rounded-[2px] bg-[#101114] border border-white/[0.06] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs font-mono">Space Grotesk</span>
                      <span className="text-[10px] text-[#f5dd1b] font-mono font-bold">SIL OFL 1.1</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">© Florian Karsten</div>
                    <div className="text-[10.5px] text-zinc-500 leading-tight">헤더 및 디스플레이 타이틀</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-[2px] bg-[#101114] border border-white/[0.06] font-mono text-[11px] text-zinc-400 space-y-1">
                <div className="text-zinc-200 font-bold">ENGLISH COPYRIGHT NOTICE</div>
                <p>
                  All in-game visual assets, lore, character designs, and scenario rights belong exclusively to <strong>© HYPERGRYPH / STUDIO MONTAGNE / YOSTAR</strong>. Non-commercial fan archive.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: AI 에이전트 개발 및 스토리 요약 면책 고지 */}
          {activeTab === 'ai_disclaimer' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] border-l-2 border-l-[#f5dd1b] flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#f5dd1b] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    AI 생성 · 2차 요약 데이터 안내
                  </div>
                  <p className="text-zinc-300 [word-break:keep-all]">
                    본 아카이브의 UI 구현과 수록된 <strong>스토리 요약, 스테이지 브리핑, 사후 분석, 인물·용어 해설</strong>은 AI 파이프라인을 통해 정리·가공된 2차 요약 자료입니다.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-3">
                <div className="font-bold text-white text-sm border-b border-white/[0.07] pb-2">
                  열람 시 유의 사항
                </div>

                <ul className="space-y-2.5 text-zinc-300 [word-break:keep-all]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#f5dd1b] font-mono font-bold mt-0.5 shrink-0">01</span>
                    <span>
                      <strong>요약 압축에 따른 생략:</strong> 장문의 인게임 스크립트를 브리핑 형식으로 압축하는 과정에서 세부 연출이나 일부 맥락이 축약될 수 있습니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#f5dd1b] font-mono font-bold mt-0.5 shrink-0">02</span>
                    <span>
                      <strong>표기 및 해석 오차 가능성:</strong> 한국 서버(<code>ko_KR</code>) 공식 용어집 기준으로 검수했으나, AI 요약 특성상 일부 오표기나 누락이 남아 있을 수 있습니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#f5dd1b] font-mono font-bold mt-0.5 shrink-0">03</span>
                    <span>
                      <strong>공식 원문 병행 권장:</strong> 본 아카이브는 줄거리 파악 및 복기용 참고 자료입니다. 원작의 온전한 감상은 <strong>《명일방주》 인게임 기록 복원</strong>을 이용해 주세요.
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
                <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2">
                    <MousePointer className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold text-white text-sm">PC (마우스 · 키보드)</span>
                  </div>
                  <ul className="space-y-2.5 text-zinc-300 text-xs [word-break:keep-all]">
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">지도 · 노선도 이동</span>
                      <kbd className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-100">드래그 / WASD · 방향키 (Shift 가속)</kbd>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">3D 회전 · 기울기</span>
                      <kbd className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-200">우클릭 드래그 (2D는 정북 고정)</kbd>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">확대 · 축소</span>
                      <kbd className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-[#f5dd1b]">휠 / +/- 키 / 더블클릭</kbd>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">스토리 즉시 열람</span>
                      <kbd className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-100">노드 더블클릭 / 카드 열람</kbd>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">이전 · 다음 스토리</span>
                      <kbd className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-200">← / → 방향키</kbd>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">모달 · 드로어 닫기</span>
                      <kbd className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-300">ESC</kbd>
                    </li>
                  </ul>
                </div>

                {/* 모바일 터치 조작 가이드 */}
                <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2">
                    <Smartphone className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold text-white text-sm">모바일 · 태블릿 (터치)</span>
                  </div>
                  <ul className="space-y-2.5 text-zinc-300 text-xs [word-break:keep-all]">
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">지도 · 노선도 이동</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-100 whitespace-nowrap">
                        <Hand className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>한 손가락 드래그</span>
                      </span>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">확대 · 축소</span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-[#f5dd1b] whitespace-nowrap">우측 [+/-] / 더블 탭 / 핀치 줌</span>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">거점 · 경로 확인</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-200 whitespace-nowrap">
                        <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>1회 탭: 요약 카드 표시</span>
                      </span>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">작전 기록 열람</span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-100 whitespace-nowrap">더블 탭 / [기록 열람]</span>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">스토리 색인 열기</span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#101114] border border-white/[0.08] font-mono text-[11px] text-zinc-300 whitespace-nowrap">좌측 하단 [색인] 버튼</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 버전 기록 및 연혁 (Changelog & Milestones) */}
          {activeTab === 'changelog' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Version Policy Notice Banner */}
              <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] border-l-2 border-l-[#f5dd1b] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-bold text-white">
                      릴리스 정책 및 버전 연혁
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-[2px] bg-[#f5dd1b] text-black font-mono font-bold text-[11px]">
                    CURRENT {APP_VERSION_CODE} ({APP_RELEASE_STAGE})
                  </span>
                </div>
                <div className="text-zinc-300 text-xs space-y-1 pl-1">
                  <p>• <strong>정식 공개(v1.0.0)</strong> 이전까지 UI·UX 및 모바일 안정화를 검증하는 프리릴리스 단계입니다.</p>
                  <p>• 모든 배포 이력은 GitHub 저장소 Releases와 Tags 기준으로 관리됩니다.</p>
                </div>
              </div>

              {/* Timeline Container */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1px] before:bg-white/10">
                {CHANGELOG_DATA.map((entry) => {
                  const isCurrent = entry.isCurrent;
                  const isPlanned = entry.isPlanned;

                  return (
                    <div key={entry.version} className="relative group">
                      {/* Timeline Node Dot */}
                      <div
                        className={`absolute -left-6 top-1.5 w-5 h-5 rounded-[2px] flex items-center justify-center border transition-colors ${
                          isCurrent
                            ? 'bg-[#f5dd1b] border-[#f5dd1b] text-black'
                            : isPlanned
                            ? 'bg-[#16181d] border-white/30 text-zinc-200'
                            : 'bg-[#101114] border-white/15 text-zinc-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-[1px] ${
                            isCurrent
                              ? 'bg-black'
                              : isPlanned
                              ? 'bg-zinc-200'
                              : 'bg-zinc-500'
                          }`}
                        />
                      </div>

                      {/* Content Card */}
                      <div
                        className={`p-4 rounded-[2px] border transition-colors ${
                          isCurrent
                            ? 'bg-[#17191e] border-[#f5dd1b]/50'
                            : isPlanned
                            ? 'bg-[#141519] border-white/[0.1]'
                            : 'bg-[#141519] border-white/[0.06] hover:border-white/15'
                        }`}
                      >
                        {/* Header: Version badge, Date, Stage */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-[2px] font-mono font-bold text-xs ${
                                isCurrent
                                  ? 'bg-[#f5dd1b] text-black'
                                  : isPlanned
                                  ? 'bg-white/[0.08] text-zinc-100 border border-white/15'
                                  : 'bg-white/[0.06] text-zinc-300'
                              }`}
                            >
                              {entry.version}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded-[2px] bg-white/[0.08] text-[#f5dd1b] border border-[#f5dd1b]/40 text-[10px] font-mono font-bold">
                                CURRENT
                              </span>
                            )}
                            {isPlanned && (
                              <span className="px-1.5 py-0.5 rounded-[2px] bg-white/[0.06] text-zinc-300 border border-white/15 text-[10px] font-mono font-bold">
                                PLANNED
                              </span>
                            )}
                            <span className="text-zinc-500 text-[11px] font-mono">
                              ({entry.stage})
                            </span>
                          </div>
                          <span className="text-zinc-500 font-mono text-[11px]">
                            {entry.date}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-zinc-100 mb-2">
                          {entry.title}
                        </h4>

                        {/* Highlights List */}
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {entry.highlights.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span
                                className={`text-[11px] leading-relaxed flex-shrink-0 mt-0.5 ${
                                  isCurrent ? 'text-[#f5dd1b]' : 'text-zinc-500'
                                }`}
                              >
                                ▹
                              </span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: 전체 화면 및 웹 앱 설치 (PWA) 가이드 */}
          {activeTab === 'app_fullscreen' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] border-l-2 border-l-[#f5dd1b] space-y-1.5">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-[#f5dd1b]" />
                  <span className="text-sm font-bold text-white">
                    전체 화면 및 웹 앱(PWA) 설치 안내
                  </span>
                </div>
                <p className="text-zinc-300 text-xs [word-break:keep-all]">
                  브라우저 주소창을 숨기고 독립 앱 형태로 실행하면 스토리 본문과 테라 지도를 한층 넓게 이용할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Android & PC Chrome */}
                <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2">
                    <Monitor className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold text-white text-sm">Android / PC (Chrome · Edge · Whale)</span>
                  </div>
                  <ul className="space-y-2 text-zinc-300 text-xs [word-break:keep-all]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#f5dd1b] font-mono font-bold mt-0.5">•</span>
                      <span>
                        <strong>전체 화면 전환:</strong> 상단 헤더의 <code>[전체 화면]</code> 버튼으로 브라우저 UI를 숨깁니다.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#f5dd1b] font-mono font-bold mt-0.5">•</span>
                      <span>
                        <strong>웹 앱(PWA) 설치:</strong> 주소창 우측 설치 아이콘 또는 헤더의 <code>[앱 설치]</code> 버튼으로 바탕화면·홈 화면에 추가합니다.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#f5dd1b] font-mono font-bold mt-0.5">•</span>
                      <span>
                        <strong>UI 단축 모드:</strong> 상단 메뉴만 접어 작업 공간을 넓히려면 연대기·지도의 <code>[UI 단축]</code> 버튼을 사용하세요.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* iOS Safari */}
                <div className="p-4 rounded-[2px] bg-[#16181d] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2">
                    <Smartphone className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold text-white text-sm">iOS (iPhone / iPad Safari)</span>
                  </div>
                  <div className="space-y-2 text-zinc-300 text-xs [word-break:keep-all]">
                    <div className="p-2.5 rounded-[2px] bg-[#101114] border border-white/[0.07] text-zinc-400 text-[11.5px]">
                      iOS Safari 정책상 내부 전체 화면 버튼이 제한되므로 홈 화면 추가 방식을 권장합니다.
                    </div>
                    <div className="space-y-1.5 pt-1 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-[2px] bg-white/10 text-zinc-200 flex items-center justify-center font-mono text-[10px] shrink-0">1</span>
                        <span>Safari 하단 <strong>[공유]</strong>(<Share className="w-3.5 h-3.5 inline text-zinc-300" />) 버튼을 탭합니다.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-[2px] bg-white/10 text-zinc-200 flex items-center justify-center font-mono text-[10px] shrink-0">2</span>
                        <span><strong>[홈 화면에 추가]</strong>(<PlusSquare className="w-3.5 h-3.5 inline text-[#f5dd1b]" />)를 선택합니다.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-[2px] bg-white/10 text-zinc-200 flex items-center justify-center font-mono text-[10px] shrink-0">3</span>
                        <span>홈 아이콘으로 실행하면 주소창 없는 전체 화면으로 동작합니다.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#101114] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <span className="font-mono text-[11px] text-zinc-500">
            © HYPERGRYPH / STUDIO MONTAGNE / YOSTAR · UNOFFICIAL FAN ARCHIVE
          </span>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            확인 및 닫기
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

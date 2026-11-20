import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CharacterRef, CharacterVisualVariant, GlossaryTerm } from '../types/story';
import { X, Maximize2, BookOpen, ChevronRight } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getCharacterAvatarUrl, getCharacterIllustUrl, getGlobalAvatarCacheBuster } from '../utils/characterAssetHelper';
import { resolveCharacterMaster, getMasterCharacter } from '../data/db/characterResolver';
import { storyRegistry } from '../data/storyRegistry';
import { CopyrightBadge } from './CopyrightedImage';
import { TacticalAvatar } from './TacticalAvatar';
import { PrtsNeuralEmblem } from './ui/TacticalIcons';
import { PRTS_MODAL_BACKDROP, PRTS_DRAWER_PANEL, PRTS_EASE } from '../utils/motion';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacter: CharacterRef | null;
  selectedGlossary: GlossaryTerm | null;
  initialVariantId?: string | null;
  onOpenLightbox?: (imgUrl: string, caption?: string, title?: string) => void;
  onSelectStory?: (storyId: string) => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  selectedCharacter: incomingCharacter,
  selectedGlossary,
  initialVariantId,
  onOpenLightbox,
  onSelectStory,
}) => {
  // 단일 진실 공급원(SSOT): 마스터 DB 및 최신 CG 자산 레지스트리와 실시간 정합
  const selectedCharacter = useMemo(() => {
    if (!incomingCharacter) return null;
    return resolveCharacterMaster(incomingCharacter.id, incomingCharacter);
  }, [incomingCharacter]);

  // 마스터 DB 기반 등장 스토리 역추적 목록 (연대기 순 정렬)
  const appearanceStories = useMemo(() => {
    if (!selectedCharacter) return [];
    const master = getMasterCharacter(selectedCharacter.id);
    if (!master?.states?.length) return [];
    const seen = new Set<string>();
    for (const st of master.states) {
      for (const appId of st.appearances || []) {
        if (appId) seen.add(appId);
      }
    }
    return Array.from(seen)
      .map((id) => storyRegistry.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
  }, [selectedCharacter]);

  const findVariantIndex = (char: CharacterRef | null, targetVariantId?: string | null): number => {
    if (!char?.variants || char.variants.length === 0 || !targetVariantId) return 0;
    const directIdx = char.variants.findIndex((v) => v.id === targetVariantId);
    if (directIdx >= 0) return directIdx;
    if (targetVariantId === 'current' || targetVariantId === 'default') {
      const fallbackIdx = char.variants.findIndex(
        (v) => v.id === 'default' || v.id === 'adult' || v.id === 'current'
      );
      if (fallbackIdx >= 0) return fallbackIdx;
    }
    return 0;
  };

  const [illustError, setIllustError] = useState(false);
  const [prevCharId, setPrevCharId] = useState<string | undefined>(selectedCharacter?.id);
  const [prevVariantId, setPrevVariantId] = useState<string | null | undefined>(initialVariantId);
  const [activeVariantIndex, setActiveVariantIndex] = useState<number>(() => {
    return findVariantIndex(selectedCharacter, initialVariantId);
  });

  if (selectedCharacter?.id !== prevCharId || initialVariantId !== prevVariantId) {
    setPrevCharId(selectedCharacter?.id);
    setPrevVariantId(initialVariantId);
    setIllustError(false);
    setActiveVariantIndex(findVariantIndex(selectedCharacter, initialVariantId));
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="side-drawer-backdrop"
            variants={PRTS_MODAL_BACKDROP}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/72 backdrop-blur-xs z-50"
          />

          {/* Drawer Panel */}
          <motion.div
            key="side-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={
              selectedCharacter
                ? `${selectedCharacter.nameKo} 인물 프로필`
                : selectedGlossary
                ? `${selectedGlossary.term} 용어 해설`
                : '상세 정보'
            }
            variants={PRTS_DRAWER_PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#111215]/98 backdrop-blur-md border-l border-white/[0.1] z-50 shadow-2xl flex flex-col font-sans"
          >
            {/* Top Calibration Hairline */}
            <div className="h-[1px] w-full bg-white/10 shrink-0" />
            {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0e0f12]">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-1.5 h-3.5 rounded-none bg-[#f5dd1b]" />
            <span className="font-bold text-white">
              {selectedCharacter ? '작전 관계자 상세 프로필' : '용어 사전 상세 정의'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="상세 패널 닫기"
            className="w-7 h-7 rounded-[2px] bg-[#16181d] hover:bg-[#1e2026] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain prts-modal-scroll p-5 sm:p-6 space-y-6">
          {/* Character Profile */}
          {selectedCharacter && (() => {
            const activeVariant = selectedCharacter.variants && selectedCharacter.variants[activeVariantIndex]
              ? selectedCharacter.variants[activeVariantIndex]
              : null;

            const rawIllustUrl = activeVariant?.illustUrl || getCharacterIllustUrl(selectedCharacter);
            const resolvedIllustUrl = rawIllustUrl ? resolveAssetUrl(rawIllustUrl) : '';
            const buster = getGlobalAvatarCacheBuster();
            const finalIllustUrl = resolvedIllustUrl && buster && !resolvedIllustUrl.includes('?v=')
              ? `${resolvedIllustUrl}${resolvedIllustUrl.includes('?') ? '&' : '?'}v=${buster}`
              : resolvedIllustUrl;
            const rawAvatarUrl = activeVariant?.avatarUrl || getCharacterAvatarUrl(selectedCharacter);
            const resolvedAvatarUrl = rawAvatarUrl ? resolveAssetUrl(rawAvatarUrl) : '';
            const hasValidIllust = Boolean(finalIllustUrl && finalIllustUrl.trim() !== '' && !illustError);
            const watermarkText = (selectedCharacter.nameEn || selectedCharacter.id).replace(/_/g, ' ');

            return (
              <div className="space-y-5">
                {/* Full-Body Standing CG Showcase / Matte Studio Placeholder */}
                {hasValidIllust ? (
                  <div className="relative w-full h-[360px] sm:h-[400px] rounded-[2px] overflow-hidden bg-[#0c0d10] border border-white/[0.08] flex items-center justify-center p-3 group">
                    {/* Oversized Codename Watermark */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute inset-x-0 bottom-4 text-center text-[44px] sm:text-[56px] leading-none font-black font-mono tracking-tighter text-white/[0.045] uppercase whitespace-nowrap overflow-hidden z-0"
                    >
                      {watermarkText}
                    </div>

                    {/* Minimal Spec Label */}
                    <div className="absolute top-2.5 left-3 z-10 pointer-events-none">
                      <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                        VISUAL ARCHIVE // FULL-BODY {activeVariant ? `// ${activeVariant.label.toUpperCase()}` : ''}
                      </span>
                    </div>

                    {/* Lightbox Zoom Button */}
                    {onOpenLightbox && (
                      <button
                        onClick={() => onOpenLightbox(
                          finalIllustUrl,
                          `${selectedCharacter.nameKo} (${selectedCharacter.nameEn}) ${activeVariant ? `[${activeVariant.label}]` : '전신 일러스트'}`,
                          selectedCharacter.nameKo
                        )}
                        className="absolute top-2.5 right-3 z-10 px-2.5 py-1 rounded-[2px] bg-[#141519]/90 hover:bg-zinc-100 border border-white/15 hover:border-white text-[11px] text-zinc-300 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="원화 확대"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>원화 확대</span>
                      </button>
                    )}

                    {/* Standing CG Image with Variant Crossfade */}
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={finalIllustUrl}
                        src={finalIllustUrl}
                        alt={selectedCharacter.nameKo}
                        decoding="async"
                        onError={() => setIllustError(true)}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        initial={{ opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.985 }}
                        transition={{ duration: 0.24, ease: PRTS_EASE }}
                        className="relative z-[1] max-h-full max-w-full object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] select-none transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </AnimatePresence>

                    {/* Copyright License Badge */}
                    <CopyrightBadge style={{ zIndex: 10, bottom: '8px', right: '10px' }} />
                  </div>
                ) : (
                  <div className="relative w-full h-[220px] sm:h-[250px] rounded-[2px] overflow-hidden bg-[#0c0d10] border border-white/[0.08] flex flex-col items-center justify-center p-6 text-center select-none">
                    <div className="absolute top-2.5 left-3 pointer-events-none">
                      <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                        PRTS ARCHIVE // RECORD INDEX
                      </span>
                    </div>

                    <PrtsNeuralEmblem className="w-10 h-10 text-zinc-600 mb-3" />

                    <div className="font-mono text-xs tracking-wider text-zinc-400 uppercase">
                      NO VISUAL RECORD
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1 max-w-[280px]">
                      현장 전술 데이터베이스에 등록된 고유 시각화 프로필이 존재하지 않는 인물입니다.
                    </div>
                  </div>
                )}

                {/* 시점/전개별 외형 전환 셀렉터 (Variants) */}
                {selectedCharacter.variants && selectedCharacter.variants.length > 1 && (
                  <div className="p-3 rounded-[2px] bg-[#15161a] border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                        <span className="w-1 h-3 bg-[#f5dd1b]" />
                        <span>시점별 외형 아카이브</span>
                      </div>
                      {activeVariant?.timePeriod && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-white/[0.05] border border-white/10 text-[10.5px] font-mono font-semibold text-zinc-200">
                          {activeVariant.timePeriod}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {selectedCharacter.variants.map((v: CharacterVisualVariant, vIdx: number) => {
                        const isSelected = activeVariantIndex === vIdx;
                        return (
                          <button
                            key={v.id || vIdx}
                            type="button"
                            onClick={() => {
                              setActiveVariantIndex(vIdx);
                              setIllustError(false);
                            }}
                            className={`p-2 rounded-[2px] border flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#1c1e24] border-[#f5dd1b] text-white'
                                : 'bg-[#111216] hover:bg-[#181a20] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-[2px] overflow-hidden border flex-shrink-0 ${isSelected ? 'border-[#f5dd1b]/70' : 'border-white/10'}`}>
                              <TacticalAvatar
                                src={v.avatarUrl ? resolveAssetUrl(v.avatarUrl) : ''}
                                alt={v.label}
                                className="w-full h-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[11.5px] font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                {v.label}
                              </div>
                              {v.timePeriod && (
                                <div className="text-[10px] text-zinc-500 font-mono truncate">
                                  {v.timePeriod}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {activeVariant?.description && (
                      <div className="text-[11px] text-zinc-400 leading-relaxed px-1 pt-0.5 [word-break:keep-all]">
                        {activeVariant.description}
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Card */}
                <div className="flex gap-4 items-center rounded-[2px] border border-white/[0.08] bg-[#15161a] p-4">
                  {/* 1:1 Avatar */}
                  <div className="w-16 h-16 rounded-[2px] border border-white/[0.12] overflow-hidden bg-black flex-shrink-0">
                    <TacticalAvatar
                      src={resolvedAvatarUrl}
                      alt={selectedCharacter.nameKo}
                      className="w-full h-full"
                      showBadge={true}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="text-[11px] font-mono text-zinc-400 truncate">
                      {selectedCharacter.faction}
                    </div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight truncate">
                      {selectedCharacter.nameKo}
                    </h3>
                    <div className="text-xs font-mono text-zinc-500 truncate">
                      {selectedCharacter.nameEn}
                    </div>
                    <div className="pt-0.5 text-xs text-zinc-300 font-medium truncate">
                      {selectedCharacter.role}
                    </div>
                  </div>
                </div>

              {/* Status in Operation */}
              <div className="p-4 rounded-[2px] bg-[#15161a] border border-white/[0.07] space-y-1.5">
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-2">
                  <span className="w-1 h-3 bg-zinc-500" />
                  <span>작전 내 행적</span>
                </div>
                <div className="text-xs sm:text-sm text-zinc-100 font-medium leading-relaxed [word-break:keep-all] break-words">
                  {selectedCharacter.statusInChapter}
                </div>
              </div>

              {/* Quote Block */}
              {selectedCharacter.quote && (
                <div className="p-4 rounded-none bg-[#15161a] border border-white/[0.06] border-l-2 border-l-[#f5dd1b] text-xs sm:text-sm italic text-zinc-200 leading-relaxed [word-break:keep-all] break-words">
                  "{selectedCharacter.quote}"
                </div>
              )}

              {/* Lore Description */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-2">
                  <span className="w-1 h-3 bg-zinc-500" />
                  <span>인물 상세 정보</span>
                </div>
                <p className="text-sm sm:text-[14.5px] text-zinc-200 leading-[1.8] rounded-[2px] bg-[#15161a] p-4 border border-white/[0.07] [word-break:keep-all] break-words">
                  {selectedCharacter.description}
                </p>
              </div>

              {/* Appearance Stories Reverse Lookup */}
              {appearanceStories.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="w-1 h-3 bg-[#f5dd1b]" />
                      <span>등장 스토리 기록</span>
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {appearanceStories.length}편
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {appearanceStories.map((st) => (
                      <button
                        key={`app-${st.id}`}
                        type="button"
                        onClick={() => onSelectStory?.(st.id)}
                        className="w-full text-left px-3 py-2 rounded-[2px] bg-[#15161a] hover:bg-[#1c1e24] border border-white/[0.07] hover:border-[#f5dd1b]/55 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#f5dd1b] flex-shrink-0" />
                          <span className="px-1.5 py-0.2 rounded-[1px] bg-white/[0.06] text-[10px] font-mono font-bold text-zinc-300 flex-shrink-0">
                            {st.code}
                          </span>
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                            {st.titleKo}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#f5dd1b] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

          {/* Glossary Term */}
          {selectedGlossary && (
            <div className="space-y-5">
              <div className="rounded-[2px] border border-white/[0.08] bg-[#15161a] p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-5 px-2 inline-flex items-center rounded-[2px] bg-white/[0.07] text-zinc-100 font-semibold text-[11px] border border-white/15">
                    {selectedGlossary.typeLabel}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {selectedGlossary.type.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight [word-break:keep-all] break-words">
                  {selectedGlossary.term}
                </h3>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-2">
                  <span className="w-1 h-3 bg-zinc-500" />
                  <span>용어 상세 해설</span>
                </div>
                <p className="text-sm sm:text-[14.5px] text-zinc-200 leading-[1.8] rounded-[2px] bg-[#15161a] p-4 border border-white/[0.07] [word-break:keep-all] break-words">
                  {selectedGlossary.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#0e0f12] flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono text-[10px]">PRTS ARCHIVE ENTRY</span>
          <button
            onClick={onClose}
            className="h-7 px-3 rounded-[2px] bg-[#181a20] hover:bg-zinc-100 hover:text-black border border-white/[0.1] text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            닫기 [ESC]
          </button>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

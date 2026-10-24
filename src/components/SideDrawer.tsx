import React, { useEffect, useState } from 'react';
import type { CharacterRef, GlossaryTerm } from '../types/story';
import { X, Maximize2 } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getCharacterAvatarUrl, getCharacterIllustUrl } from '../utils/characterAssetHelper';
import { CopyrightBadge } from './CopyrightedImage';
import { TacticalAvatar } from './TacticalAvatar';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacter: CharacterRef | null;
  selectedGlossary: GlossaryTerm | null;
  initialVariantId?: string | null;
  onOpenLightbox?: (imgUrl: string, caption?: string, title?: string) => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  selectedCharacter,
  selectedGlossary,
  initialVariantId,
  onOpenLightbox,
}) => {
  const [illustError, setIllustError] = useState(false);
  const [prevCharId, setPrevCharId] = useState<string | undefined>(selectedCharacter?.id);
  const [prevVariantId, setPrevVariantId] = useState<string | null | undefined>(initialVariantId);
  const [activeVariantIndex, setActiveVariantIndex] = useState<number>(() => {
    if (initialVariantId && selectedCharacter?.variants && selectedCharacter.variants.length > 0) {
      const idx = selectedCharacter.variants.findIndex((v) => v.id === initialVariantId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  if (selectedCharacter?.id !== prevCharId || initialVariantId !== prevVariantId) {
    setPrevCharId(selectedCharacter?.id);
    setPrevVariantId(initialVariantId);
    setIllustError(false);
    if (initialVariantId && selectedCharacter?.variants && selectedCharacter.variants.length > 0) {
      const idx = selectedCharacter.variants.findIndex((v) => v.id === initialVariantId);
      setActiveVariantIndex(idx >= 0 ? idx : 0);
    } else {
      setActiveVariantIndex(0);
    }
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#0b0e16]/95 backdrop-blur-2xl border-l border-white/[0.08] z-50 shadow-2xl flex flex-col font-sans">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#080a10]/90">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-1.5 h-3.5 rounded-[1px] bg-[#ffe600]" />
            <span className="font-bold text-white">
              {selectedCharacter ? '작전 관계자 상세 프로필' : '용어 사전 상세 정의'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Character Profile */}
          {selectedCharacter && (() => {
            const activeVariant = selectedCharacter.variants && selectedCharacter.variants[activeVariantIndex]
              ? selectedCharacter.variants[activeVariantIndex]
              : null;

            const rawIllustUrl = activeVariant?.illustUrl || getCharacterIllustUrl(selectedCharacter);
            const resolvedIllustUrl = rawIllustUrl ? resolveAssetUrl(rawIllustUrl) : '';
            const rawAvatarUrl = activeVariant?.avatarUrl || getCharacterAvatarUrl(selectedCharacter);
            const resolvedAvatarUrl = rawAvatarUrl ? resolveAssetUrl(rawAvatarUrl) : '';
            const hasValidIllust = Boolean(resolvedIllustUrl && resolvedIllustUrl.trim() !== '' && !illustError);

            return (
              <div className="space-y-5">
                {/* Full-Body Standing CG Showcase / Classified Placeholder */}
                {hasValidIllust ? (
                  <div className="relative w-full h-[360px] sm:h-[400px] rounded-[6px] overflow-hidden bg-gradient-to-b from-white/[0.04] via-[#090c14] to-[#04060a] border border-white/[0.08] flex items-center justify-center p-3 group shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    
                    {/* PRTS Spec Overlay Header */}
                    <div className="absolute top-2.5 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600] animate-pulse" />
                      <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">
                        PRTS ARCHIVE // FULL-BODY VISUAL {activeVariant ? `// ${activeVariant.label.toUpperCase()}` : ''}
                      </span>
                    </div>

                    {/* Lightbox Zoom Button */}
                    {onOpenLightbox && (
                      <button
                        onClick={() => onOpenLightbox(
                          resolvedIllustUrl,
                          `${selectedCharacter.nameKo} (${selectedCharacter.nameEn}) ${activeVariant ? `[${activeVariant.label}]` : '전신 일러스트'}`,
                          selectedCharacter.nameKo
                        )}
                        className="absolute top-2.5 right-3 z-10 px-2.5 py-1 rounded-[3px] bg-black/65 hover:bg-black/90 border border-white/15 hover:border-[#ffe600] text-[11px] text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
                        title="원화 확대"
                      >
                        <Maximize2 className="w-3 h-3 text-[#ffe600]" />
                        <span>원화 확대</span>
                      </button>
                    )}

                    {/* Standing CG Image */}
                    <img
                      src={resolvedIllustUrl}
                      alt={selectedCharacter.nameKo}
                      onError={() => setIllustError(true)}
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] select-none transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    {/* Copyright License Badge */}
                    <CopyrightBadge style={{ zIndex: 10, bottom: '8px', right: '10px' }} />
                  </div>
                ) : (
                  <div className="relative w-full h-[220px] sm:h-[250px] rounded-[6px] overflow-hidden bg-gradient-to-b from-[#10141f] via-[#090c14] to-[#04060a] border border-white/[0.08] flex flex-col items-center justify-center p-6 text-center select-none shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
                    
                    {/* Corner Reticles */}
                    <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#ffe600]/40 pointer-events-none" />
                    <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#ffe600]/40 pointer-events-none" />
                    <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#ffe600]/40 pointer-events-none" />
                    <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#ffe600]/40 pointer-events-none" />

                    {/* PRTS Header */}
                    <div className="absolute top-2.5 left-3 flex items-center gap-1.5 pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold uppercase">
                        PRTS TACTICAL ARCHIVE // CLASSIFIED RECORD
                      </span>
                    </div>

                    {/* Large Operator Silhouette */}
                    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mb-2.5">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-zinc-600">
                        <path d="M12 2C9.243 2 7 4.243 7 7c0 2.222 1.455 4.108 3.473 4.743C6.398 12.355 3.5 15.82 3.5 20c0 .553.447 1 1 1h15c.553 0 1-.447 1-1 0-4.18-2.898-7.645-6.973-8.257C15.545 11.108 17 9.222 17 7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0 9c3.318 0 6.095 2.502 6.453 5.75H5.547C5.905 14.502 8.682 12 12 12z" />
                      </svg>
                    </div>

                    <div className="font-mono text-xs tracking-wider text-[#ffe600] font-bold uppercase">
                      CLASSIFIED // NO VISUAL RECORD
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1 max-w-[280px]">
                      현장 전술 데이터베이스에 등록된 고유 시각화 프로필이 존재하지 않는 인물입니다.
                    </div>
                  </div>
                )}

                {/* 시점/전개별 외형 전환 셀렉터 (Variants) */}
                {selectedCharacter.variants && selectedCharacter.variants.length > 1 && (
                  <div className="p-3 rounded-[4px] bg-white/[0.03] border border-white/[0.08] space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600]" />
                        <span>시점별 외형 아카이브</span>
                      </div>
                      {activeVariant?.timePeriod && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#ffe600]/10 border border-[#ffe600]/30 text-[10.5px] font-mono font-semibold text-[#ffe600]">
                          {activeVariant.timePeriod}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {selectedCharacter.variants.map((v, vIdx) => {
                        const isSelected = activeVariantIndex === vIdx;
                        return (
                          <button
                            key={v.id || vIdx}
                            type="button"
                            onClick={() => {
                              setActiveVariantIndex(vIdx);
                              setIllustError(false);
                            }}
                            className={`p-2 rounded-[3px] border flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#ffe600]/15 border-[#ffe600] text-white shadow-sm ring-1 ring-[#ffe600]/50'
                                : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-[2px] overflow-hidden border flex-shrink-0 ${isSelected ? 'border-[#ffe600]' : 'border-white/10'}`}>
                              <TacticalAvatar
                                src={v.avatarUrl ? resolveAssetUrl(v.avatarUrl) : ''}
                                alt={v.label}
                                className="w-full h-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[11.5px] font-bold truncate ${isSelected ? 'text-[#ffe600]' : 'text-zinc-300'}`}>
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
                <div className="flex gap-4 items-center rounded-[4px] border border-white/[0.08] bg-white/[0.025] p-4">
                  {/* 1:1 Avatar */}
                  <div className="w-16 h-16 rounded-[4px] border border-white/[0.12] overflow-hidden bg-black flex-shrink-0 shadow-md">
                    <TacticalAvatar
                      src={resolvedAvatarUrl}
                      alt={selectedCharacter.nameKo}
                      className="w-full h-full"
                      showBadge={true}
                    />
                  </div>


                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="text-[11px] font-semibold text-[#ffe600] truncate">
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
              <div className="p-4 rounded-[4px] bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#ffe600]" />
                  <span>작전 내 행적</span>
                </div>
                <div className="text-xs sm:text-sm text-zinc-100 font-medium leading-relaxed [word-break:keep-all] break-words">
                  {selectedCharacter.statusInChapter}
                </div>
              </div>

              {/* Quote Block */}
              {selectedCharacter.quote && (
                <div className="p-4 rounded-[3px] bg-[#ffe600]/[0.04] border border-[#ffe600]/20 border-l-2 border-l-[#ffe600] text-xs sm:text-sm italic text-zinc-200 leading-relaxed [word-break:keep-all] break-words">
                  "{selectedCharacter.quote}"
                </div>
              )}

              {/* Lore Description */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#ffe600]" />
                  <span>인물 상세 정보</span>
                </div>
                <p className="text-sm sm:text-[14.5px] text-zinc-200 leading-[1.8] rounded-[4px] bg-white/[0.02] p-4 border border-white/[0.06] [word-break:keep-all] break-words">
                  {selectedCharacter.description}
                </p>
              </div>
            </div>
          );
        })()}

          {/* Glossary Term */}
          {selectedGlossary && (
            <div className="space-y-5">
              <div className="rounded-[4px] border border-white/[0.08] bg-white/[0.025] p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-5 px-2 inline-flex items-center rounded-[2px] bg-[#ffe600]/15 text-[#ffe600] font-semibold text-[11px] border border-[#ffe600]/30">
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
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#ffe600]" />
                  <span>용어 상세 해설</span>
                </div>
                <p className="text-sm sm:text-[14.5px] text-zinc-200 leading-[1.8] rounded-[4px] bg-white/[0.02] p-4 border border-white/[0.06] [word-break:keep-all] break-words">
                  {selectedGlossary.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#080a10]/90 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono text-[10px]">PRTS ARCHIVE ENTRY</span>
          <button
            onClick={onClose}
            className="h-7 px-3 rounded-[3px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            닫기 [ESC]
          </button>
        </div>
      </div>
    </>
  );
};

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CharacterRef, GlossaryTerm } from '../types/story';
import { TacticalAvatar } from './TacticalAvatar';
import { getCharacterAvatarUrl } from '../utils/characterAssetHelper';

interface HighlightedTextProps {
  text: string;
  characters: CharacterRef[];
  glossary: GlossaryTerm[];
  onSelectCharacter: (char: CharacterRef) => void;
  onSelectGlossary: (term: GlossaryTerm) => void;
}

type HighlightItem =
  | { type: 'character'; data: CharacterRef }
  | { type: 'glossary'; data: GlossaryTerm };

interface PreviewState {
  item: HighlightItem;
  rect: { left: number; top: number; width: number; bottom: number };
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  characters,
  glossary,
  onSelectCharacter,
  onSelectGlossary,
}) => {
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const { keywordsMap, pattern } = useMemo(() => {
    const map = new Map<string, HighlightItem>();

    characters.forEach((char) => {
      map.set(char.nameKo, { type: 'character', data: char });
      const match = char.nameKo.match(/^([^(]+)\s*\((.+)\)$/);
      if (match) {
        const baseName = match[1].trim();
        if (baseName && !map.has(baseName)) {
          map.set(baseName, { type: 'character', data: char });
        }
      }
    });

    glossary.forEach((item) => {
      map.set(item.term, { type: 'glossary', data: item });
    });

    const sortedTerms = Array.from(map.keys()).sort((a, b) => b.length - a.length);
    const regex =
      sortedTerms.length > 0
        ? new RegExp(`(${sortedTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
        : null;

    return { keywordsMap: map, pattern: regex };
  }, [characters, glossary]);

  const parts = useMemo(() => {
    if (!pattern) return [text];
    return text.split(pattern);
  }, [text, pattern]);

  useEffect(() => {
    if (!preview) return;
    const dismiss = () => setPreview(null);
    window.addEventListener('scroll', dismiss, { passive: true, capture: true });
    window.addEventListener('resize', dismiss, { passive: true });
    return () => {
      window.removeEventListener('scroll', dismiss, { capture: true });
      window.removeEventListener('resize', dismiss);
    };
  }, [preview]);

  const showPreview = (target: HTMLElement, item: HighlightItem) => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const r = target.getBoundingClientRect();
    setPreview({
      item,
      rect: { left: r.left, top: r.top, width: r.width, bottom: r.bottom },
    });
  };

  if (!pattern) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {parts.map((part, index) => {
        const item = keywordsMap.get(part);
        if (!item) {
          return <span key={index}>{part}</span>;
        }

        if (item.type === 'character') {
          const char = item.data;
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                setPreview(null);
                onSelectCharacter(char);
              }}
              onMouseEnter={(e) => showPreview(e.currentTarget, item)}
              onMouseLeave={() => setPreview(null)}
              onFocus={(e) => showPreview(e.currentTarget, item)}
              onBlur={() => setPreview(null)}
              className="inline bg-transparent p-0 m-0 border-0 text-zinc-100 font-medium underline decoration-dashed decoration-zinc-500/80 underline-offset-[3px] hover:decoration-[#f5dd1b] hover:text-[#f5dd1b] transition-colors cursor-pointer"
            >
              {part}
            </button>
          );
        }

        const term = item.data;
        return (
          <button
            key={index}
            type="button"
            onClick={() => {
              setPreview(null);
              onSelectGlossary(term);
            }}
            onMouseEnter={(e) => showPreview(e.currentTarget, item)}
            onMouseLeave={() => setPreview(null)}
            onFocus={(e) => showPreview(e.currentTarget, item)}
            onBlur={() => setPreview(null)}
            className="inline bg-transparent p-0 m-0 border-0 text-zinc-200 underline decoration-dashed decoration-zinc-500/80 underline-offset-[3px] hover:decoration-[#f5dd1b] hover:text-[#f5dd1b] transition-colors cursor-pointer"
          >
            {part}
          </button>
        );
      })}

      {preview &&
        typeof document !== 'undefined' &&
        createPortal(
          (() => {
            const cardWidth = 288;
            const left = Math.min(
              Math.max(12, preview.rect.left + preview.rect.width / 2 - cardWidth / 2),
              window.innerWidth - cardWidth - 12
            );
            const showBelow = preview.rect.top < 156;
            const top = showBelow ? preview.rect.bottom + 8 : preview.rect.top - 10;

            return (
              <div
                role="tooltip"
                style={{
                  position: 'fixed',
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${cardWidth}px`,
                  transform: showBelow ? 'none' : 'translateY(-100%)',
                  zIndex: 95,
                  pointerEvents: 'none',
                }}
                className="rounded-[2px] bg-[#141519]/98 border border-white/[0.16] shadow-[0_14px_32px_rgba(0,0,0,0.8)] p-3 text-left"
              >
                {preview.item.type === 'character' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <TacticalAvatar
                        src={getCharacterAvatarUrl(preview.item.data)}
                        alt={preview.item.data.nameKo}
                        className="w-9 h-9 rounded-[2px] border border-white/15 bg-black flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-[#f5dd1b] uppercase truncate">
                          {preview.item.data.faction} · {preview.item.data.role}
                        </div>
                        <div className="text-xs font-bold text-white truncate">
                          {preview.item.data.nameKo}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-300 line-clamp-3">
                      {preview.item.data.description}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 rounded-[1px] bg-white/[0.08] text-[#f5dd1b] font-bold">
                        {preview.item.data.typeLabel}
                      </span>
                      <span className="text-zinc-500 uppercase">GLOSSARY</span>
                    </div>
                    <div className="text-xs font-bold text-white">{preview.item.data.term}</div>
                    <p className="text-[11px] leading-relaxed text-zinc-300 line-clamp-3">
                      {preview.item.data.description}
                    </p>
                  </div>
                )}
                <div className="mt-2 pt-1.5 border-t border-white/[0.07] text-[9.5px] font-mono text-zinc-500">
                  클릭하여 우측 도감 패널 열기
                </div>
              </div>
            );
          })(),
          document.body
        )}
    </span>
  );
};

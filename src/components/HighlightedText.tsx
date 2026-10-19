import React from 'react';
import type { CharacterRef, GlossaryTerm } from '../types/story';

interface HighlightedTextProps {
  text: string;
  characters: CharacterRef[];
  glossary: GlossaryTerm[];
  onSelectCharacter: (char: CharacterRef) => void;
  onSelectGlossary: (term: GlossaryTerm) => void;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  characters,
  glossary,
  onSelectCharacter,
  onSelectGlossary,
}) => {
  const keywordsMap = new Map<string, { type: 'character' | 'glossary'; data: CharacterRef | GlossaryTerm }>();

  characters.forEach((char) => {
    keywordsMap.set(char.nameKo, { type: 'character', data: char });
    const match = char.nameKo.match(/^([^(]+)\s*\((.+)\)$/);
    if (match) {
      const baseName = match[1].trim();
      if (baseName && !keywordsMap.has(baseName)) {
        keywordsMap.set(baseName, { type: 'character', data: char });
      }
    }
  });

  glossary.forEach((item) => {
    keywordsMap.set(item.term, { type: 'glossary', data: item });
  });

  const sortedTerms = Array.from(keywordsMap.keys()).sort((a, b) => b.length - a.length);

  if (sortedTerms.length === 0) {
    return <span>{text}</span>;
  }

  const pattern = new RegExp(`(${sortedTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(pattern);

  return (
    <span>
      {parts.map((part, index) => {
        const item = keywordsMap.get(part);
        if (!item) {
          return <span key={index}>{part}</span>;
        }

        if (item.type === 'character') {
          const char = item.data as CharacterRef;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectCharacter(char)}
              title={`${char.nameKo} // [${char.faction}] ${char.role}`}
              className="inline bg-transparent p-0 m-0 border-0 text-zinc-100 font-medium underline decoration-dashed decoration-zinc-500/80 underline-offset-[3px] hover:decoration-[#ffe600] hover:text-[#ffe600] transition-colors cursor-pointer"
            >
              {part}
            </button>
          );
        }

        const term = item.data as GlossaryTerm;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelectGlossary(term)}
            title={`${term.term} // [${term.typeLabel}]`}
            className="inline bg-transparent p-0 m-0 border-0 text-zinc-200 underline decoration-dashed decoration-zinc-500/80 underline-offset-[3px] hover:decoration-[#ffe600] hover:text-[#ffe600] transition-colors cursor-pointer"
          >
            {part}
          </button>
        );
      })}
    </span>
  );
};

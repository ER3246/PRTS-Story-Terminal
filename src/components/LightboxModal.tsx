import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { CopyrightedImage } from './CopyrightedImage';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  caption?: string;
  title?: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
  title,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full max-h-[94vh] flex flex-col bg-[#0f1014] border border-[#262a34] shadow-2xl overflow-hidden"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0a0b0e] border-b border-[#20232c] text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#ffe600]" />
            <span className="font-semibold text-zinc-200">CG RECORD VIEWER</span>
            {title && <span className="text-zinc-600">// {title}</span>}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Frame */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black">
          <CopyrightedImage
            src={imageUrl}
            alt={caption || 'Cutscene CG'}
            containerClassName="relative inline-block overflow-hidden"
            className="max-h-[78vh] w-auto object-contain border border-[#1a1c22]"
          />
        </div>

        {/* Bottom Caption */}
        {caption && (
          <div className="px-4 py-2 bg-[#0a0b0e] border-t border-[#20232c] text-xs font-mono text-zinc-300 flex items-center justify-between">
            <span className="truncate pr-2">[REC] {caption}</span>
            <span className="text-zinc-600 text-[10px] flex-shrink-0">RESTORED 1080P</span>
          </div>
        )}
      </div>
    </div>
  );
};

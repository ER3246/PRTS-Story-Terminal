import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { CopyrightedImage } from './CopyrightedImage';
import { PRTS_MODAL_BACKDROP, PRTS_MODAL_PANEL, PRTS_EASE } from '../utils/motion';
import { playClickSound } from '../utils/soundEffects';

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
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  const isZoomed = Boolean(imageUrl && zoomedUrl === imageUrl);

  const handleClose = () => {
    setZoomedUrl(null);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setZoomedUrl(null);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div
          key="lightbox-backdrop"
          variants={PRTS_MODAL_BACKDROP}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        >
          <motion.div
            variants={PRTS_MODAL_PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[94vh] flex flex-col bg-[#0f1014] border border-[#262a34] rounded-[4px] shadow-2xl overflow-hidden"
          >
            {/* Top Calibration Hairline */}
            <div className="h-[2px] w-full bg-gradient-to-r from-[#ffe600] via-[#00d8ff] to-transparent" />

            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0b0e] border-b border-[#20232c] text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 bg-[#ffe600] shrink-0" />
                <span className="font-semibold text-zinc-200 whitespace-nowrap shrink-0">
                  CG RECORD VIEWER
                </span>
                {title && <span className="text-zinc-500 truncate">// {title}</span>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    playClickSound();
                    setZoomedUrl(isZoomed ? null : imageUrl);
                  }}
                  title={isZoomed ? '기본 배율로 축소' : '1.6x 상세 확대'}
                  className="px-2 py-1 rounded-[2px] bg-white/[0.05] hover:bg-[#ffe600] text-zinc-300 hover:text-black flex items-center gap-1 transition-colors cursor-pointer text-[11px] font-bold"
                >
                  {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                  <span>{isZoomed ? '1.0x' : '1.6x'}</span>
                </button>
                <button
                  onClick={handleClose}
                  title="닫기 (ESC)"
                  className="p-1.5 rounded-[2px] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Frame */}
            <div
              onClick={() => setZoomedUrl(isZoomed ? null : imageUrl)}
              className={`flex-1 overflow-auto flex items-center justify-center p-3 bg-black ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            >
              <motion.div
                animate={{ scale: isZoomed ? 1.6 : 1 }}
                transition={{ duration: 0.28, ease: PRTS_EASE }}
                className="origin-center"
              >
                <CopyrightedImage
                  src={imageUrl}
                  alt={caption || 'Cutscene CG'}
                  containerClassName="relative inline-block overflow-hidden"
                  className="max-h-[78vh] w-auto object-contain border border-[#1a1c22]"
                />
              </motion.div>
            </div>

            {/* Bottom Caption */}
            {caption && (
              <div className="px-4 py-2 bg-[#0a0b0e] border-t border-[#20232c] text-xs font-mono text-zinc-300 flex items-center justify-between gap-2">
                <span className="truncate">[REC] {caption}</span>
                <span className="text-zinc-500 text-[10px] flex-shrink-0 whitespace-nowrap">
                  PRTS VISUAL ARCHIVE
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

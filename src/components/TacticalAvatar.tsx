import React, { useState } from 'react';
import type { CgCropConfig } from '../types/characterDb';
import { getAvatarCropConfig } from '../utils/characterAssetHelper';

interface TacticalAvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  badgeClassName?: string;
  showBadge?: boolean;
  cropOverride?: CgCropConfig;
}

export const TacticalAvatar: React.FC<TacticalAvatarProps> = ({
  src,
  alt = 'Character',
  className = 'w-10 h-10 rounded-[3px]',
  showBadge = false,
  cropOverride,
}) => {
  const [loadError, setLoadError] = useState(false);

  const hasValidImage = Boolean(src && src.trim() !== '' && !loadError);

  if (hasValidImage && src) {
    const crop = cropOverride || getAvatarCropConfig(src);
    const hasCustomCrop =
      crop && (Math.abs(crop.x - 50) > 0.5 || Math.abs(crop.y - 50) > 0.5 || Math.abs(crop.zoom - 1) > 0.02);

    if (hasCustomCrop && crop) {
      return (
        <div className={`${className} overflow-hidden relative select-none`}>
          <img
            src={src}
            alt={alt}
            onError={() => setLoadError(true)}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              objectPosition: `${crop.x}% ${crop.y}%`,
              transform: `scale(${crop.zoom})`,
              transformOrigin: `${crop.x}% ${crop.y}%`,
            }}
            className="w-full h-full object-cover select-none"
          />
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        onError={() => setLoadError(true)}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className={`${className} object-cover select-none`}
      />
    );
  }

  // PRTS Tactical Silhouette Placeholder
  return (
    <div
      className={`${className} relative overflow-hidden bg-gradient-to-b from-[#141923] via-[#0d121c] to-[#080b12] border border-white/10 flex flex-col items-center justify-center select-none shadow-inner`}
      title={`${alt} (기록된 시각 자료 없음)`}
    >
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:6px_6px] pointer-events-none opacity-60" />

      {/* Cyber Corner Marks */}
      <div className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-[#ffe600]/40 pointer-events-none" />
      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-[#ffe600]/40 pointer-events-none" />

      {/* Operator Silhouette SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-1/2 h-1/2 text-zinc-600/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-transform duration-200"
      >
        <path d="M12 2C9.243 2 7 4.243 7 7c0 2.222 1.455 4.108 3.473 4.743C6.398 12.355 3.5 15.82 3.5 20c0 .553.447 1 1 1h15c.553 0 1-.447 1-1 0-4.18-2.898-7.645-6.973-8.257C15.545 11.108 17 9.222 17 7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0 9c3.318 0 6.095 2.502 6.453 5.75H5.547C5.905 14.502 8.682 12 12 12z" />
      </svg>

      {/* Optional Micro Label for larger sizes */}
      {showBadge && (
        <span className="absolute bottom-0.5 inset-x-0 text-center font-mono text-[7px] tracking-tight text-zinc-500 font-bold uppercase truncate px-0.5 pointer-events-none">
          NO RECORD
        </span>
      )}
    </div>
  );
};

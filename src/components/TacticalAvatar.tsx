import React, { useMemo, useState } from 'react';
import type { CgCropConfig } from '../types/characterDb';
import { getGlobalAvatarCacheBuster } from '../utils/characterAssetHelper';

interface TacticalAvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  badgeClassName?: string;
  showBadge?: boolean;
  cropOverride?: CgCropConfig;
}

/**
 * PRTS Tactical Avatar - 정규 1:1 아바타 렌더러
 * 
 * [표준 규격 원칙]
 * 1. 180×180 정규 물리 PNG를 CSS transform 왜곡 없이 픽셀 단위로 선명하게 직접 렌더링합니다.
 * 2. 편집기 등에서 실시간 뷰포트 오버라이드(cropOverride)가 명시적으로 제공된 경우에만 동적 transform을 적용합니다.
 * 3. 전역 캐시 버스터(?v=...)를 자동 부여하여, 이미지 교체 및 크롭 시 브라우저 캐시 정체를 원천 차단합니다.
 */
export const TacticalAvatar: React.FC<TacticalAvatarProps> = ({
  src,
  alt = 'Character',
  className = 'w-10 h-10 rounded-[3px]',
  showBadge = false,
  cropOverride,
}) => {
  const [loadError, setLoadError] = useState(false);
  const [lastSrc, setLastSrc] = useState<string | undefined>(src);

  if (src !== lastSrc) {
    setLastSrc(src);
    setLoadError(false);
  }

  // 전역 캐시 무효화 파라미터 결합
  const finalSrc = useMemo(() => {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;
    if (src.includes('?v=')) return src;
    const buster = getGlobalAvatarCacheBuster();
    return `${src}${src.includes('?') ? '&' : '?'}v=${buster}`;
  }, [src]);

  const hasValidImage = Boolean(finalSrc && finalSrc.trim() !== '' && !loadError);

  if (hasValidImage && finalSrc) {
    // cropOverride가 명시적으로 주어졌을 때만 CSS 동적 크롭 적용 (예: 크롭 탭 실시간 캔버스)
    const hasCustomCrop =
      cropOverride &&
      (Math.abs(cropOverride.x - 50) > 0.5 ||
        Math.abs(cropOverride.y - 50) > 0.5 ||
        Math.abs(cropOverride.zoom - 1) > 0.02);

    if (hasCustomCrop && cropOverride) {
      return (
        <div className={`${className} overflow-hidden relative select-none`}>
          <img
            src={finalSrc}
            alt={alt}
            onError={() => setLoadError(true)}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              objectPosition: `${cropOverride.x}% ${cropOverride.y}%`,
              transform: `scale(${cropOverride.zoom})`,
              transformOrigin: `${cropOverride.x}% ${cropOverride.y}%`,
            }}
            className="w-full h-full object-cover select-none"
          />
        </div>
      );
    }

    // 표준 규격: 180×180 정규 물리 PNG 직접 렌더링
    return (
      <img
        src={finalSrc}
        alt={alt}
        onError={() => setLoadError(true)}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className={`${className} object-cover select-none`}
      />
    );
  }

  // PRTS Tactical Silhouette Placeholder (CG 미등록 또는 로딩 실패 시 전술 실루엣)
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

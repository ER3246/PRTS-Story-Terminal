import React from 'react';
import { resolveAssetUrl } from '../utils/assetUrl';

export interface CopyrightBadgeProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 인게임 비주얼/컷신 CG 우측 하단 공식 저작권 귀속 워터마크 배지
 */
export const CopyrightBadge: React.FC<CopyrightBadgeProps> = ({ className = '', style }) => (
  <span
    aria-hidden="true"
    className={className}
    style={{
      position: 'absolute',
      bottom: '6px',
      right: '8px',
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      color: 'rgba(255, 255, 255, 0.78)',
      fontSize: '10px',
      fontFamily: 'monospace',
      lineHeight: 1.3,
      padding: '2px 6px',
      borderRadius: '3px',
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 5,
      letterSpacing: '0.02em',
      ...style,
    }}
  >
    © HYPERGRYPH / YOSTAR
  </span>
);

export interface CopyrightedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  containerClassName?: string;
  showWatermark?: boolean;
  watermarkStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * 공통 인게임 리소스 이미지 래퍼 컴포넌트
 * - import.meta.env.BASE_URL 기반 서브패스 안전 경로 자동 변환
 * - 우측 하단 '© HYPERGRYPH / YOSTAR' 반투명 다크 워터마크 자동 오버레이
 * - 무단 드래그 및 우클릭 컨텍스트 메뉴 기본 차단
 */
export const CopyrightedImage: React.FC<CopyrightedImageProps> = ({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  containerClassName = 'relative w-full h-full overflow-hidden',
  showWatermark = true,
  watermarkStyle,
  onError,
  children,
  ...rest
}) => {
  const resolvedSrc = resolveAssetUrl(src);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc) {
      const target = e.currentTarget;
      const resolvedFallback = resolveAssetUrl(fallbackSrc);
      if (target.src !== resolvedFallback) {
        target.src = resolvedFallback;
      }
    }
    onError?.(e);
  };

  return (
    <div
      className={containerClassName}
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onError={handleError}
        className={`select-none ${className}`}
        {...rest}
      />
      {children}
      {showWatermark && <CopyrightBadge style={watermarkStyle} />}
    </div>
  );
};

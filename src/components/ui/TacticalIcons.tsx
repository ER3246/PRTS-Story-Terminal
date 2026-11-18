import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * 마우스 좌클릭 드래그(이동·회전) 무채색 전술 스키매틱 SVG
 */
export const MouseDragIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="3.5"
      y="1.75"
      width="11"
      height="14.5"
      rx="5.5"
      stroke="currentColor"
      strokeWidth="1.35"
    />
    <path d="M9 1.75V7.75" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.55" />
    <path d="M3.5 7.75H14.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.55" />
    <path
      d="M4.2 7.1V6.5C4.2 4.1 6.1 2.4 8.3 2.4V7.1H4.2Z"
      fill="currentColor"
      fillOpacity="0.85"
    />
  </svg>
);

/**
 * 마우스 스크롤 휠 확대·축소 무채색 스키매틱 SVG
 */
export const MouseScrollIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="3.5"
      y="1.75"
      width="11"
      height="14.5"
      rx="5.5"
      stroke="currentColor"
      strokeWidth="1.35"
    />
    <rect x="8.1" y="4.1" width="1.8" height="3.8" rx="0.9" fill="currentColor" fillOpacity="0.85" />
  </svg>
);

/**
 * 방향키 클러스터 무채색 스키매틱 SVG
 */
export const ArrowKeysIcon: React.FC<IconProps> = ({ className = 'w-4 h-3.5' }) => (
  <svg
    viewBox="0 0 22 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="8" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M11 2.7V5.3M11 2.7L9.8 3.9M11 2.7L12.2 3.9"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="1" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="15" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M4.8 11.5H3.2M11 10.6V12.4M17.2 11.5H18.8"
      stroke="currentColor"
      strokeOpacity="0.7"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * PRTS 아카이브 마름모 엠블럼 (하이퍼그리프 기하학 인더스트리얼 스타일)
 */
export const PrtsNeuralEmblem: React.FC<IconProps> = ({ className = 'w-12 h-12' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Outer Rotated Square / Diamond */}
    <polygon
      points="32,4 60,32 32,60 4,32"
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="1.2"
    />
    {/* Inner Rotated Square */}
    <polygon
      points="32,13 51,32 32,51 13,32"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    {/* Architectural Axis Crosshair Ticks */}
    <path
      d="M32 4V13M32 51V60M4 32H13M51 32H60"
      stroke="currentColor"
      strokeOpacity="0.4"
      strokeWidth="1.2"
    />
    {/* Crisp Solid Center Diamond Accent */}
    <polygon points="32,27 37,32 32,37 27,32" fill="#f5dd1b" />
  </svg>
);

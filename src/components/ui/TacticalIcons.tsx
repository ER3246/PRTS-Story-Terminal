import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * 마우스 좌클릭 드래그(이동·회전) 전술 스키매틱 SVG (OS 이모지 대체)
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
    <path d="M9 1.75V7.75" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.65" />
    <path d="M3.5 7.75H14.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.65" />
    {/* Left click active highlight */}
    <path
      d="M4.2 7.1V6.5C4.2 4.1 6.1 2.4 8.3 2.4V7.1H4.2Z"
      fill="#ffe600"
      fillOpacity="0.9"
    />
  </svg>
);

/**
 * 마우스 스크롤 휠 확대·축소 전술 스키매틱 SVG
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
    <rect x="8.1" y="4.1" width="1.8" height="3.8" rx="0.9" fill="#00d8ff" />
  </svg>
);

/**
 * 방향키 클러스터 전술 스키매틱 SVG (OS 키보드 이모지 대체)
 */
export const ArrowKeysIcon: React.FC<IconProps> = ({ className = 'w-4 h-3.5' }) => (
  <svg
    viewBox="0 0 22 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Up key */}
    <rect x="8" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M11 2.7V5.3M11 2.7L9.8 3.9M11 2.7L12.2 3.9" stroke="#ffe600" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    {/* Left / Down / Right keys */}
    <rect x="1" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="15" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4.8 11.5H3.2M11 10.6V12.4M17.2 11.5H18.8" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

/**
 * PRTS 아카이브 육각 신경망 엠블럼 (부트 시퀀스 & 대시보드 전용)
 */
export const PrtsNeuralEmblem: React.FC<IconProps> = ({ className = 'w-12 h-12' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <polygon
      points="32,4 56,18 56,46 32,60 8,46 8,18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeOpacity="0.45"
    />
    <polygon
      points="32,12 49,22 49,42 32,52 15,42 15,22"
      stroke="#ffe600"
      strokeWidth="1.5"
    />
    <circle cx="32" cy="32" r="7" stroke="#00d8ff" strokeWidth="1.5" />
    <circle cx="32" cy="32" r="2.5" fill="#ffe600" />
    <path
      d="M32 4V12M32 52V60M8 18L15 22M49 42L56 46M56 18L49 22M15 42L8 46"
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="1.2"
    />
  </svg>
);

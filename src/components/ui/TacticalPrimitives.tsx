import React from 'react';
import { motion } from 'framer-motion';

interface TacticalMetaRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

/**
 * 레이블 압착(세로 1글자 줄바꿈)을 구조적으로 방지하는 키-값 행 컴포넌트.
 * label은 항상 shrink-0 + whitespace-nowrap + self-start를 유지하고,
 * value는 min-w-0 flex-1로 자연스럽게 다중 행 개행됩니다.
 */
export const TacticalMetaRow: React.FC<TacticalMetaRowProps> = ({
  label,
  value,
  className = '',
  labelClassName = '',
  valueClassName = '',
}) => {
  return (
    <div className={`flex items-start gap-2 text-xs font-sans ${className}`}>
      <span
        className={`shrink-0 whitespace-nowrap select-none text-zinc-500 font-medium leading-relaxed ${labelClassName}`}
      >
        {label}
      </span>
      <div
        className={`min-w-0 flex-1 text-zinc-300 font-semibold leading-relaxed [word-break:keep-all] break-words ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
};

interface TacticalKeycapProps {
  children: React.ReactNode;
  accent?: 'yellow' | 'cyan' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export const TacticalKeycap: React.FC<TacticalKeycapProps> = ({
  children,
  accent = 'neutral',
  icon,
  className = '',
}) => {
  const tone =
    accent === 'yellow'
      ? 'text-[#f5dd1b] border-white/15 bg-white/[0.04]'
      : 'text-zinc-200 border-white/15 bg-white/[0.04]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border font-mono text-[11px] whitespace-nowrap shrink-0 ${tone} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};

interface AudioVisualizerBarsProps {
  active: boolean;
}

/**
 * 사운드 엔진 활성화 시 헤더 버튼 내 미세하게 맥동하는 전술 이퀄라이저 바
 */
export const AudioVisualizerBars: React.FC<AudioVisualizerBarsProps> = ({ active }) => {
  if (!active) return null;

  return (
    <span className="inline-flex items-end gap-[2px] h-2.5 ml-0.5" aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <motion.span
          key={bar}
          className="w-[1.5px] rounded-none bg-[#f5dd1b]"
          animate={{ height: ['3px', bar === 1 ? '10px' : '7px', '3px'] }}
          transition={{
            duration: 0.75 + bar * 0.14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: bar * 0.12,
          }}
        />
      ))}
    </span>
  );
};

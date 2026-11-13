import type { Transition, Variants } from 'framer-motion';

/**
 * PRTS Archive Unified Motion Language
 * 아크나이츠 FUI 특유의 즉각 가속 · 자석 감속(exponential snap) 커브 및 물리 스프링 규격
 */
export const PRTS_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const PRTS_SPRING: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.85,
};

export const PRTS_SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 540,
  damping: 36,
};

export const PRTS_VIEW_VARIANTS: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: PRTS_EASE },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.16, ease: PRTS_EASE },
  },
};

export const PRTS_STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

export const PRTS_STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: PRTS_EASE },
  },
};

export const PRTS_MODAL_BACKDROP: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: PRTS_EASE } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: PRTS_EASE } },
};

export const PRTS_MODAL_PANEL: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.24, ease: PRTS_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.16, ease: PRTS_EASE },
  },
};

export const PRTS_DRAWER_PANEL: Variants = {
  hidden: { x: '100%', opacity: 0.7 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 390, damping: 36, mass: 0.9 },
  },
  exit: {
    x: '100%',
    opacity: 0.5,
    transition: { duration: 0.2, ease: PRTS_EASE },
  },
};

export const PRTS_ACCORDION_CONTENT: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.28, ease: PRTS_EASE },
      opacity: { duration: 0.22, delay: 0.04, ease: PRTS_EASE },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.22, ease: PRTS_EASE },
      opacity: { duration: 0.14 },
    },
  },
};

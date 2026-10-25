import { useCallback, useEffect, useRef, useState } from 'react';
import type { MainViewMode } from '../components/Header';

/**
 * 해시 기반 라우팅 (GitHub Pages 정적 호스팅 호환)
 *
 * URL 형식:
 *   #/                         → 홈 대시보드
 *   #/chronicle                → 연대기
 *   #/map                      → 테라 지도
 *   #/report/<storyId>         → 스토리 보고서 (개요)
 *   #/report/<storyId>/<subId> → 스토리 보고서 하위 파트
 *
 * 브라우저 뒤로가기/앞으로가기는 popstate 이벤트로 동기화되며,
 * 각 히스토리 항목의 스크롤 위치를 기억했다가 복원한다.
 */

export interface AppRoute {
  view: MainViewMode;
  storyId: string | null;
  subPageId: string | null;
}

export type NavigationType = 'initial' | 'push' | 'replace' | 'pop';

const VIEWS: MainViewMode[] = ['home', 'report', 'chronicle', 'map', 'studio'];

export function parseHash(hash: string): AppRoute {
  const parts = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    });

  const view = (VIEWS as string[]).includes(parts[0]) ? (parts[0] as MainViewMode) : 'home';
  if (view !== 'report') {
    return { view, storyId: null, subPageId: null };
  }
  return { view, storyId: parts[1] || null, subPageId: parts[2] || null };
}

export function buildHash(route: AppRoute): string {
  if (route.view === 'home') return '#/';
  if (route.view !== 'report') return `#/${route.view}`;
  const segs = ['report'];
  if (route.storyId) {
    segs.push(encodeURIComponent(route.storyId));
    if (route.subPageId && route.subPageId !== 'overview') {
      segs.push(encodeURIComponent(route.subPageId));
    }
  }
  return `#/${segs.join('/')}`;
}

export function useHashRoute(options?: { onPop?: () => void }) {
  const [route, setRoute] = useState<AppRoute>(() => parseHash(window.location.hash));
  const [navType, setNavType] = useState<NavigationType>('initial');
  // 해시 키별 스크롤 위치 저장소 (세션 내 메모리)
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const currentKey = useRef<string>(buildHash(parseHash(window.location.hash)));
  const onPopRef = useRef(options?.onPop);

  useEffect(() => {
    onPopRef.current = options?.onPop;
  });

  useEffect(() => {
    const onPopState = () => {
      // popstate 시점의 scrollY는 아직 이전 화면의 값이므로 이전 키로 저장
      scrollPositions.current.set(currentKey.current, window.scrollY);
      const next = parseHash(window.location.hash);
      currentKey.current = buildHash(next);
      onPopRef.current?.();
      setNavType('pop');
      setRoute(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((next: AppRoute, options?: { replace?: boolean }) => {
    const hash = buildHash(next);
    if (hash === currentKey.current && !options?.replace) {
      // 동일 경로 재선택: 히스토리 중복 없이 상태만 맞춤
      setRoute(next);
      return;
    }
    scrollPositions.current.set(currentKey.current, window.scrollY);
    if (options?.replace) {
      window.history.replaceState(null, '', hash);
    } else {
      window.history.pushState(null, '', hash);
    }
    currentKey.current = hash;
    setNavType(options?.replace ? 'replace' : 'push');
    setRoute(next);
  }, []);

  const getSavedScroll = useCallback((key: string) => scrollPositions.current.get(key) ?? 0, []);

  return { route, navType, navigate, getSavedScroll };
}

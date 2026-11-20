import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { storyRegistry, STORY_LINES, getStoryAccessState } from '../data/storyRegistry';
import type { StoryListItem } from '../data/storyRegistry';
import { terraRegions } from '../data/terraRegions';
import { StorySplashModal, FilmReelIcon } from './StorySplashModal';
import { ChronicleEraStream } from './chronicle/ChronicleEraStream';
import {
  TIMELINE_ERAS,
  STRATEGIC_LANES,
  buildAllStoryConnections,
  buildSmartConnectionPath,
  type NodeBox,
  type StoryConnection,
} from './chronicle/chronicleData';
import {
  Search,
  GitBranch,
  Clock,
  Layers,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  PanelTopClose,
  PanelTopOpen,
  Move,
  Sparkles,
  ArrowRight,
  BookOpen,
  Link2,
  Eye,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { playClickSound, playTabSwitchSound, playOpenSound, playCloseSound } from '../utils/soundEffects';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getStoryProgress } from '../utils/readingProgress';
import { CopyrightBadge } from './CopyrightedImage';

interface ChronicleRoadmapViewProps {
  onSelectStory: (id: string) => void;
  initialFocusStoryId?: string | null;
  onConsumeInitialStory?: () => void;
  onNavigateToMapRegion?: (regionId: string) => void;
  isHeaderCollapsed?: boolean;
  onToggleHeaderCollapse?: () => void;
}

export type ChronicleBrowseMode = 'stream' | 'story_line' | 'matrix';

type ZoomTier = 'macro' | 'compact' | 'detail';
const MIN_CHRONICLE_ZOOM = 0.38;
const MAX_CHRONICLE_ZOOM = 1.6;
const MINIMAP_W = 208;
const MINIMAP_H = 108;

function getZoomTierForScale(z: number): ZoomTier {
  if (z < 0.56) return 'macro';
  if (z < 0.78) return 'compact';
  return 'detail';
}

export const ChronicleRoadmapView: React.FC<ChronicleRoadmapViewProps> = ({
  onSelectStory,
  initialFocusStoryId,
  onConsumeInitialStory,
  onNavigateToMapRegion,
  isHeaderCollapsed,
  onToggleHeaderCollapse,
}) => {
  const [browseMode, setBrowseMode] = useState<ChronicleBrowseMode>('stream');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'overview_only'>('all');
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);
  const [activeThreadStoryId, setActiveThreadStoryId] = useState<string | null>(null);
  const [activeStoryLineHubId, setActiveStoryLineHubId] = useState<string>('MAIN_ACT_1');

  const [inspectedStory, setInspectedStory] = useState<StoryListItem | null>(null);
  const [hoveredStoryId, setHoveredStoryId] = useState<string | null>(null);
  const [sheetDragY, setSheetDragY] = useState<number>(0);
  const sheetTouchStartY = useRef<number | null>(null);

  const [selectedModalStory, setSelectedModalStory] = useState<StoryListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Sync external focus request safely during render
  const [prevFocusStoryReq, setPrevFocusStoryReq] = useState<string | null | undefined>(null);
  if (initialFocusStoryId && initialFocusStoryId !== prevFocusStoryReq) {
    setPrevFocusStoryReq(initialFocusStoryId);
    const target = storyRegistry.find((s) => s.id === initialFocusStoryId);
    if (target) {
      setInspectedStory(target);
    }
  }

  // Matrix 2D GPU Physics State (only mounted in 'matrix' 3rd tab)
  const [zoomTier, setZoomTier] = useState<ZoomTier>('detail');
  const [activeRulerEraId, setActiveRulerEraId] = useState<string>('era_00');
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 3200,
    height: 1080,
  });

  const cameraRef = useRef({
    x: 36,
    y: 24,
    zoom: 0.88,
    vx: 0,
    vy: 0,
    targetX: 36,
    targetY: 24,
    targetZoom: 0.88,
    isAnimating: false,
  });

  const zoomTierRef = useRef<ZoomTier>('detail');
  const activeRulerEraRef = useRef<string>('era_00');
  const eraBoundsRef = useRef<{ id: string; left: number; right: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gridBgRef = useRef<HTMLDivElement>(null);
  const zoomTextRef = useRef<HTMLSpanElement>(null);
  const minimapViewportRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const keysDownRef = useRef<Set<string>>(new Set());
  const rafIdRef = useRef<number | null>(null);
  const physicsRafRef = useRef<number | null>(null);
  const isModalOpenRef = useRef<boolean>(isModalOpen);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  const dragTrackingRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastMoveAt: 0,
    initialPanX: 36,
    initialPanY: 24,
    hasMoved: false,
    moveDistance: 0,
  });

  const [nodeCoords, setNodeCoords] = useState<Record<string, NodeBox>>({});

  const storyMap = useMemo(() => new Map(storyRegistry.map((s) => [s.id, s])), []);
  const lineMetaMap = useMemo(() => new Map(STORY_LINES.map((l) => [l.id, l])), []);

  const allConnections = useMemo(
    () =>
      buildAllStoryConnections(
        storyRegistry,
        (lineId) => lineMetaMap.get(lineId)?.themeColor || '#71717a'
      ),
    [lineMetaMap]
  );

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return storyRegistry.filter((s) => {
      if (statusFilter !== 'all') {
        const st = getStoryAccessState(s);
        if (statusFilter === 'available' && st !== 'available') return false;
        if (statusFilter === 'overview_only' && st !== 'overview_only') return false;
      }
      if (!q) return true;
      const lm = lineMetaMap.get(s.storyLineId);
      return (
        s.titleKo.toLowerCase().includes(q) ||
        s.titleEn.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.timeline.toLowerCase().includes(q) ||
        (lm && lm.titleKo.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, statusFilter, lineMetaMap]);

  const filteredIdSet = useMemo(() => new Set(filteredStories.map((s) => s.id)), [filteredStories]);

  const activeTargetId = hoveredStoryId || inspectedStory?.id || null;

  const { highlightedStoryIds, activeConnections } = useMemo(() => {
    const ids = new Set<string>();
    const conns: StoryConnection[] = [];

    if (focusedLineId) {
      storyRegistry.forEach((s) => {
        if (
          s.storyLineId === focusedLineId ||
          (focusedLineId === 'MAIN_ALL' && s.storyLineId.startsWith('MAIN_'))
        ) {
          ids.add(s.id);
        }
      });
    }

    if (activeTargetId) {
      ids.add(activeTargetId);
      const targetStory = storyMap.get(activeTargetId);
      if (targetStory) {
        allConnections.forEach((c) => {
          if (c.fromId === activeTargetId || c.toId === activeTargetId) {
            conns.push(c);
            ids.add(c.fromId);
            ids.add(c.toId);
          }
        });
      }
    }

    return { highlightedStoryIds: ids, activeConnections: conns };
  }, [focusedLineId, activeTargetId, allConnections, storyMap]);

  const inspectedConnections = useMemo(() => {
    if (!inspectedStory) return { incoming: [], outgoing: [] };
    const incoming = allConnections
      .filter((c) => c.toId === inspectedStory.id)
      .map((c) => ({ ...c, story: storyMap.get(c.fromId)! }))
      .filter((c) => Boolean(c.story));
    const outgoing = allConnections
      .filter((c) => c.fromId === inspectedStory.id)
      .map((c) => ({ ...c, story: storyMap.get(c.toId)! }))
      .filter((c) => Boolean(c.story));
    return { incoming, outgoing };
  }, [inspectedStory, allConnections, storyMap]);

  const inspectedRegions = useMemo(() => {
    if (!inspectedStory) return [];
    return terraRegions.filter((r) => r.relatedStoryIds.includes(inspectedStory.id));
  }, [inspectedStory]);

  const availableCount = useMemo(
    () => storyRegistry.filter((s) => getStoryAccessState(s) === 'available').length,
    []
  );
  const overviewOnlyCount = useMemo(
    () => storyRegistry.filter((s) => getStoryAccessState(s) === 'overview_only').length,
    []
  );

  // =========================================================================
  // MATRIX GPU CAMERA PHYSICS & MEASUREMENT (Only active in 'matrix' tab)
  // =========================================================================
  const applyCameraToDom = useCallback(() => {
    const cam = cameraRef.current;
    if (stageRef.current) {
      stageRef.current.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.zoom})`;
      const splashFade = Math.max(0, Math.min(1, (cam.zoom - 0.44) / 0.34));
      const metaFade = Math.max(0, Math.min(1, (cam.zoom - 0.54) / 0.24));
      stageRef.current.style.setProperty('--prts-splash-fade', splashFade.toFixed(3));
      stageRef.current.style.setProperty('--prts-meta-fade', metaFade.toFixed(3));
    }
    if (gridBgRef.current) {
      gridBgRef.current.style.backgroundPosition = `${cam.x % 48}px ${cam.y % 48}px`;
    }
    if (zoomTextRef.current) {
      zoomTextRef.current.textContent = `${Math.round(cam.zoom * 100)}%`;
    }

    const nextTier = getZoomTierForScale(cam.zoom);
    if (nextTier !== zoomTierRef.current) {
      zoomTierRef.current = nextTier;
      setZoomTier(nextTier);
    }

    const container = containerRef.current;
    const stageEl = stageRef.current;
    if (container) {
      const cWidth = container.clientWidth || 1200;
      const cHeight = container.clientHeight || 700;
      const centerWorldX = (cWidth / 2 - cam.x) / cam.zoom;
      const bounds = eraBoundsRef.current;
      if (bounds.length > 0) {
        let matched = bounds[0].id;
        for (const b of bounds) {
          if (centerWorldX >= b.left && centerWorldX <= b.right) {
            matched = b.id;
            break;
          }
          if (centerWorldX > b.right) matched = b.id;
        }
        if (matched !== activeRulerEraRef.current) {
          activeRulerEraRef.current = matched;
          setActiveRulerEraId(matched);
        }
      }

      if (minimapViewportRef.current && stageEl) {
        const sw = stageEl.scrollWidth || 3200;
        const sh = stageEl.scrollHeight || 1080;
        const viewWorldX = -cam.x / cam.zoom;
        const viewWorldY = -cam.y / cam.zoom;
        const viewWorldW = cWidth / cam.zoom;
        const viewWorldH = cHeight / cam.zoom;

        const mx = (viewWorldX / sw) * MINIMAP_W;
        const my = (viewWorldY / sh) * MINIMAP_H;
        const mw = Math.max(14, (viewWorldW / sw) * MINIMAP_W);
        const mh = Math.max(10, (viewWorldH / sh) * MINIMAP_H);
        minimapViewportRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        minimapViewportRef.current.style.width = `${mw}px`;
        minimapViewportRef.current.style.height = `${mh}px`;
      }
    }
  }, []);

  const schedulePhysicsTick = useCallback(() => {
    if (physicsRafRef.current !== null) return;

    const step = () => {
      const cam = cameraRef.current;
      let keepGoing = false;

      if (cam.isAnimating) {
        const dx = cam.targetX - cam.x;
        const dy = cam.targetY - cam.y;
        const dz = cam.targetZoom - cam.zoom;
        cam.x += dx * 0.22;
        cam.y += dy * 0.22;
        cam.zoom += dz * 0.22;
        if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25 && Math.abs(dz) < 0.001) {
          cam.x = cam.targetX;
          cam.y = cam.targetY;
          cam.zoom = cam.targetZoom;
          cam.isAnimating = false;
        } else {
          keepGoing = true;
        }
      } else if (!dragTrackingRef.current.isDown && Math.hypot(cam.vx, cam.vy) >= 0.25) {
        cam.x += cam.vx;
        cam.y += cam.vy;
        cam.targetX = cam.x;
        cam.targetY = cam.y;
        cam.vx *= 0.89;
        cam.vy *= 0.89;
        keepGoing = true;
      } else {
        cam.vx = 0;
        cam.vy = 0;
      }

      applyCameraToDom();

      if (keepGoing) {
        physicsRafRef.current = requestAnimationFrame(step);
      } else {
        physicsRafRef.current = null;
      }
    };

    physicsRafRef.current = requestAnimationFrame(step);
  }, [applyCameraToDom]);

  useEffect(() => {
    return () => {
      if (physicsRafRef.current !== null) {
        cancelAnimationFrame(physicsRafRef.current);
        physicsRafRef.current = null;
      }
    };
  }, []);

  const measureNodePositions = useCallback(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const coords: Record<string, NodeBox> = {};
    nodeRefs.current.forEach((el, id) => {
      if (!el || !el.isConnected) return;
      let x = 0;
      let y = 0;
      let curr: HTMLElement | null = el;
      while (curr && curr !== stageEl) {
        x += curr.offsetLeft;
        y += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      coords[id] = {
        left: x,
        right: x + w,
        top: y,
        bottom: y + h,
        centerX: x + w / 2,
        centerY: y + h / 2,
      };
    });

    const sw = stageEl.scrollWidth || 3200;
    const sh = stageEl.scrollHeight || 1080;
    setStageSize((prev) => (prev.width === sw && prev.height === sh ? prev : { width: sw, height: sh }));

    const nextBounds: { id: string; left: number; right: number }[] = [];
    for (const era of TIMELINE_ERAS) {
      const eraEl = document.getElementById(`matrix-era-${era.id}`);
      if (eraEl) {
        let ex = 0;
        let curr: HTMLElement | null = eraEl;
        while (curr && curr !== stageEl) {
          ex += curr.offsetLeft;
          curr = curr.offsetParent as HTMLElement | null;
        }
        nextBounds.push({ id: era.id, left: ex, right: ex + eraEl.offsetWidth });
      }
    }
    eraBoundsRef.current = nextBounds;

    setNodeCoords(coords);
    applyCameraToDom();
  }, [applyCameraToDom]);

  useEffect(() => {
    if (browseMode !== 'matrix') return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(measureNodePositions);
    });

    const stageEl = stageRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' && stageEl
        ? new ResizeObserver(() => measureNodePositions())
        : null;
    if (ro && stageEl) ro.observe(stageEl);

    window.addEventListener('resize', measureNodePositions);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro?.disconnect();
      window.removeEventListener('resize', measureNodePositions);
    };
  }, [browseMode, searchQuery, statusFilter, measureNodePositions]);

  // Matrix Drag + Inertia Effect
  useEffect(() => {
    if (browseMode !== 'matrix') return;

    const onPointerMove = (e: PointerEvent) => {
      if (!dragTrackingRef.current.isDown) return;
      const dx = e.clientX - dragTrackingRef.current.startX;
      const dy = e.clientY - dragTrackingRef.current.startY;
      const dist = Math.hypot(dx, dy);
      dragTrackingRef.current.moveDistance = dist;
      if (dist > 5) dragTrackingRef.current.hasMoved = true;

      const frameDx = e.clientX - dragTrackingRef.current.lastX;
      const frameDy = e.clientY - dragTrackingRef.current.lastY;
      dragTrackingRef.current.lastX = e.clientX;
      dragTrackingRef.current.lastY = e.clientY;
      dragTrackingRef.current.lastMoveAt = performance.now();

      const cam = cameraRef.current;
      cam.vx = cam.vx * 0.45 + frameDx * 0.55;
      cam.vy = cam.vy * 0.45 + frameDy * 0.55;
      cam.x = dragTrackingRef.current.initialPanX + dx;
      cam.y = dragTrackingRef.current.initialPanY + dy;
      cam.targetX = cam.x;
      cam.targetY = cam.y;
      cam.isAnimating = false;
      applyCameraToDom();
    };

    const onPointerUp = () => {
      if (!dragTrackingRef.current.isDown) return;
      dragTrackingRef.current.isDown = false;
      setIsDraggingCanvas(false);
      const elapsed = performance.now() - dragTrackingRef.current.lastMoveAt;
      const cam = cameraRef.current;
      if (elapsed > 80) {
        cam.vx = 0;
        cam.vy = 0;
      } else if (Math.hypot(cam.vx, cam.vy) >= 0.4) {
        cam.vx = Math.max(-42, Math.min(42, cam.vx));
        cam.vy = Math.max(-42, Math.min(42, cam.vy));
        schedulePhysicsTick();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [browseMode, applyCameraToDom, schedulePhysicsTick]);

  // Matrix Cursor-Anchored Wheel Zoom & Pinch Zoom
  useEffect(() => {
    if (browseMode !== 'matrix') return;
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const cam = cameraRef.current;

      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      const prevZoom = cam.isAnimating ? cam.targetZoom : cam.zoom;
      const prevX = cam.isAnimating ? cam.targetX : cam.x;
      const prevY = cam.isAnimating ? cam.targetY : cam.y;
      const nextZoom = Math.min(MAX_CHRONICLE_ZOOM, Math.max(MIN_CHRONICLE_ZOOM, Number((prevZoom + delta).toFixed(2))));
      if (nextZoom === prevZoom) return;

      const scaleRatio = nextZoom / prevZoom;
      cam.vx = 0;
      cam.vy = 0;
      cam.zoom = nextZoom;
      cam.x = mouseX - (mouseX - prevX) * scaleRatio;
      cam.y = mouseY - (mouseY - prevY) * scaleRatio;
      cam.targetZoom = cam.zoom;
      cam.targetX = cam.x;
      cam.targetY = cam.y;
      cam.isAnimating = false;
      applyCameraToDom();
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [browseMode, applyCameraToDom]);

  // Matrix WASD / Arrow Keys
  useEffect(() => {
    if (browseMode !== 'matrix') return;
    const stopLoop = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const normalizeKey = (e: KeyboardEvent): string | null => {
      const code = e.code;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(code)) {
        return code;
      }
      return null;
    };

    const updatePan = () => {
      const keys = keysDownRef.current;
      let moveX = 0;
      let moveY = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) moveY += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) moveY -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX += 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) moveX -= 1;

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 28 : 13;
        const cam = cameraRef.current;
        cam.x += (moveX / len) * speed;
        cam.y += (moveY / len) * speed;
        cam.targetX = cam.x;
        cam.targetY = cam.y;
        applyCameraToDom();
        rafIdRef.current = requestAnimationFrame(updatePan);
      } else {
        rafIdRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpenRef.current) return;
      const ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || (ae as HTMLElement).isContentEditable)) return;
      const code = normalizeKey(e);
      if (!code) return;
      if (code.startsWith('Arrow')) e.preventDefault();
      keysDownRef.current.add(code);
      if (code !== 'ShiftLeft' && code !== 'ShiftRight' && rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(updatePan);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = normalizeKey(e);
      if (!code) return;
      keysDownRef.current.delete(code);
      if (!keysDownRef.current.size) stopLoop();
    };

    const keysMap = keysDownRef.current;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopLoop();
      keysMap.clear();
    };
  }, [browseMode, applyCameraToDom]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch' && !e.isPrimary) return;
    const cam = cameraRef.current;
    cam.vx = 0;
    cam.vy = 0;
    cam.isAnimating = false;
    dragTrackingRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastMoveAt: performance.now(),
      initialPanX: cam.x,
      initialPanY: cam.y,
      hasMoved: false,
      moveDistance: 0,
    };
    setIsDraggingCanvas(true);
  };

  const focusOnStoryNode = useCallback(
    (storyId: string) => {
      playClickSound();
      const target = storyMap.get(storyId);
      if (target) setInspectedStory(target);

      if (browseMode === 'matrix') {
        const container = containerRef.current;
        const coord = nodeCoords[storyId];
        if (container && coord) {
          const cam = cameraRef.current;
          const activeZoom = cam.isAnimating ? cam.targetZoom : cam.zoom;
          cam.vx = 0;
          cam.vy = 0;
          cam.targetZoom = activeZoom;
          cam.targetX = container.clientWidth * 0.42 - coord.centerX * activeZoom;
          cam.targetY = container.clientHeight * 0.48 - coord.centerY * activeZoom;
          cam.isAnimating = true;
          schedulePhysicsTick();
        }
      }
    },
    [browseMode, nodeCoords, storyMap, schedulePhysicsTick]
  );

  // Consume external focus request cleanly inside requestAnimationFrame
  useEffect(() => {
    if (!initialFocusStoryId) return;
    const raf = requestAnimationFrame(() => {
      if (browseMode === 'matrix' && nodeCoords[initialFocusStoryId]) {
        focusOnStoryNode(initialFocusStoryId);
      }
      onConsumeInitialStory?.();
    });
    return () => cancelAnimationFrame(raf);
  }, [initialFocusStoryId, browseMode, nodeCoords, focusOnStoryNode, onConsumeInitialStory]);

  const scrollMatrixToEra = (eraId: string) => {
    playClickSound();
    const target = document.getElementById(`matrix-era-${eraId}`);
    if (target) {
      const cam = cameraRef.current;
      const activeZoom = cam.isAnimating ? cam.targetZoom : cam.zoom;
      cam.vx = 0;
      cam.vy = 0;
      cam.targetZoom = activeZoom;
      cam.targetX = 48 - target.offsetLeft * activeZoom;
      cam.targetY = cam.y;
      cam.isAnimating = true;
      schedulePhysicsTick();
    }
  };

  const handleZoomStep = (delta: number) => {
    playClickSound();
    const container = containerRef.current;
    if (!container) return;
    const cam = cameraRef.current;
    const prevZoom = cam.isAnimating ? cam.targetZoom : cam.zoom;
    const prevX = cam.isAnimating ? cam.targetX : cam.x;
    const prevY = cam.isAnimating ? cam.targetY : cam.y;
    const nextScale = Math.min(MAX_CHRONICLE_ZOOM, Math.max(MIN_CHRONICLE_ZOOM, Number((prevZoom + delta).toFixed(2))));
    if (nextScale === prevZoom) return;

    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    const ratio = nextScale / prevZoom;
    cam.vx = 0;
    cam.vy = 0;
    cam.targetZoom = nextScale;
    cam.targetX = centerX - (centerX - prevX) * ratio;
    cam.targetY = centerY - (centerY - prevY) * ratio;
    cam.isAnimating = true;
    schedulePhysicsTick();
  };

  const handleResetView = () => {
    playClickSound();
    const cam = cameraRef.current;
    cam.vx = 0;
    cam.vy = 0;
    cam.targetZoom = 0.88;
    cam.targetX = 36;
    cam.targetY = 24;
    cam.isAnimating = true;
    schedulePhysicsTick();
  };

  const handleFitAll = () => {
    playClickSound();
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;
    const scaleX = (container.clientWidth - 60) / (stage.scrollWidth || 3200);
    const scaleY = (container.clientHeight - 80) / (stage.scrollHeight || 1100);
    const fitScale = Math.min(1.0, Math.max(MIN_CHRONICLE_ZOOM, Number(Math.min(scaleX, scaleY).toFixed(2))));
    const cam = cameraRef.current;
    cam.vx = 0;
    cam.vy = 0;
    cam.targetZoom = fitScale;
    cam.targetX = 28;
    cam.targetY = 20;
    cam.isAnimating = true;
    schedulePhysicsTick();
  };

  const isMinimapScrubbingRef = useRef(false);
  const jumpToMinimapPoint = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const container = containerRef.current;
      if (!container) return;
      const fracX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const fracY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const worldX = fracX * stageSize.width;
      const worldY = fracY * stageSize.height;
      const cam = cameraRef.current;
      const z = cam.isAnimating ? cam.targetZoom : cam.zoom;
      cam.vx = 0;
      cam.vy = 0;
      cam.x = container.clientWidth / 2 - worldX * z;
      cam.y = container.clientHeight / 2 - worldY * z;
      cam.targetX = cam.x;
      cam.targetY = cam.y;
      cam.isAnimating = false;
      applyCameraToDom();
    },
    [stageSize.width, stageSize.height, applyCameraToDom]
  );

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div
      className={`relative w-full shrink-0 ${
        isHeaderCollapsed
          ? 'h-[100dvh] md:h-screen max-h-[100dvh] md:max-h-screen'
          : 'h-[calc(100dvh-6.25rem)] md:h-[calc(100vh-3.5rem)] max-h-[calc(100dvh-6.25rem)] md:max-h-[calc(100vh-3.5rem)]'
      } bg-[#0b0c0f] overflow-hidden select-none flex flex-col font-sans animate-fadeIn`}
    >
      {/* 1. CLEAN SINGLE STICKY TOP CONTROL BAR */}
      <div className="z-30 bg-[#0d0e13]/95 backdrop-blur-md border-b border-white/[0.08] px-3 sm:px-6 py-2.5 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Brand & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-[#f5dd1b]" />
              <span className="text-sm sm:text-base font-black tracking-tight text-white">
                스토리 연대기
              </span>
              <span className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.05] text-zinc-400 border border-white/[0.08] rounded-[2px]">
                NARRATIVE ATLAS
              </span>
            </div>

            <div className="flex items-center bg-[#12141a] p-0.5 rounded-[2px] border border-white/[0.08] text-xs">
              <button
                type="button"
                onClick={() => {
                  playTabSwitchSound();
                  setBrowseMode('stream');
                }}
                className={`h-7 px-2.5 rounded-[1px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                  browseMode === 'stream'
                    ? 'bg-zinc-100 text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>연대기 스트림</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playTabSwitchSound();
                  setBrowseMode('story_line');
                }}
                className={`h-7 px-2.5 rounded-[1px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                  browseMode === 'story_line'
                    ? 'bg-zinc-100 text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>서사 사가</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playTabSwitchSound();
                  setBrowseMode('matrix');
                }}
                className={`h-7 px-2.5 rounded-[1px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                  browseMode === 'matrix'
                    ? 'bg-zinc-100 text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>계통 매트릭스</span>
              </button>
            </div>
          </div>

          {/* Search & Concise Filters */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <div className="relative flex-1 sm:w-56 md:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="스토리명, 코드, 연도 검색..."
                className="w-full h-8 pl-8 pr-7 bg-[#12141a] focus:bg-[#090a0d] border border-white/[0.08] focus:border-[#f5dd1b]/60 rounded-[2px] text-xs text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center bg-[#12141a] p-0.5 rounded-[2px] border border-white/[0.08] text-[11px] font-mono">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setStatusFilter('all');
                }}
                className={`h-7 px-2 rounded-[1px] cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white/[0.1] text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                전체 {storyRegistry.length}
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setStatusFilter(statusFilter === 'available' ? 'all' : 'available');
                }}
                className={`h-7 px-2 rounded-[1px] cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'available'
                    ? 'bg-[#f5dd1b]/18 text-[#f5dd1b] font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-[1px] bg-[#f5dd1b]" />
                <span>전문 {availableCount}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setStatusFilter(statusFilter === 'overview_only' ? 'all' : 'overview_only');
                }}
                className={`h-7 px-2 rounded-[1px] cursor-pointer ${
                  statusFilter === 'overview_only'
                    ? 'bg-white/[0.12] text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                개요 {overviewOnlyCount}
              </button>
            </div>

            {onToggleHeaderCollapse && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onToggleHeaderCollapse();
                }}
                title={isHeaderCollapsed ? '상단 메뉴 복원' : '상단 메뉴 숨기기'}
                className={`h-8 px-2.5 rounded-[2px] border flex items-center gap-1 text-xs cursor-pointer transition-colors ${
                  isHeaderCollapsed
                    ? 'bg-[#f5dd1b]/15 border-[#f5dd1b]/50 text-[#f5dd1b]'
                    : 'bg-[#12141a] hover:bg-[#191b23] border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {isHeaderCollapsed ? <PanelTopOpen className="w-3.5 h-3.5" /> : <PanelTopClose className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        {/* VIEW 1 (DEFAULT): CINEMATIC SINGLE-AXIS EDITORIAL ERA STREAM */}
        {browseMode === 'stream' && (
          <ChronicleEraStream
            stories={filteredStories}
            allConnections={allConnections}
            storyMap={storyMap}
            lineMetaMap={lineMetaMap}
            inspectedStoryId={inspectedStory?.id || null}
            focusedLineId={focusedLineId}
            activeThreadStoryId={activeThreadStoryId}
            onChangeFocusedLine={setFocusedLineId}
            onSelectCausalThread={setActiveThreadStoryId}
            onInspectStory={setInspectedStory}
            onOpenStory={onSelectStory}
            onNavigateToMapRegion={onNavigateToMapRegion}
          />
        )}

        {/* VIEW 2: UPGRADED SAGA HUB WITH FULL-BLEED HERO BANNER */}
        {browseMode === 'story_line' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-[#0b0c0f]">
            {/* Mobile Compact Saga Selector */}
            <div className="md:hidden border-b border-white/[0.08] bg-[#101116] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
              {STORY_LINES.map((line) => {
                const isSelected = activeStoryLineHubId === line.id;
                return (
                  <button
                    key={`mhub-${line.id}`}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setActiveStoryLineHubId(line.id);
                    }}
                    className={`px-2.5 py-1 rounded-[2px] border text-[11px] font-medium whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1a1c24] border-[#f5dd1b] text-white font-bold'
                        : 'bg-[#13141a] border-white/[0.07] text-zinc-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: line.themeColor }} />
                    <span>{line.titleKo.replace('내일을 위하여 · ', '')}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Left 17-Line Directory */}
            <div className="hidden md:block w-64 lg:w-72 flex-shrink-0 border-r border-white/[0.08] bg-[#0e0f14] overflow-y-auto p-3 space-y-4 prts-scrollbar">
              <div>
                <div className="px-2 pb-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>메인 테마 (내일을 위하여)</span>
                  <span>3개 부</span>
                </div>
                <div className="space-y-1">
                  {STORY_LINES.filter((l) => l.id.startsWith('MAIN_')).map((line) => {
                    const count = storyRegistry.filter((s) => s.storyLineId === line.id).length;
                    const isSelected = activeStoryLineHubId === line.id;
                    return (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setActiveStoryLineHubId(line.id);
                        }}
                        className={`w-full px-3 py-2 rounded-[2px] border text-left transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#171922] border-[#f5dd1b] text-white'
                            : 'bg-[#121319] border-white/[0.06] text-zinc-300 hover:bg-[#171922]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-[10px] font-mono font-bold" style={{ color: line.themeColor }}>
                            {line.code}
                          </div>
                          <div className="text-xs font-bold truncate">
                            {line.titleKo.replace('내일을 위하여 · ', '')}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#0b0c0f] text-zinc-400">
                          {count}편
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="px-2 pb-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>이벤트 서사 연작</span>
                  <span>14개 연작</span>
                </div>
                <div className="space-y-1">
                  {STORY_LINES.filter((l) => !l.id.startsWith('MAIN_')).map((line) => {
                    const lineStories = storyRegistry.filter((s) => s.storyLineId === line.id);
                    const hasRestored = lineStories.some((s) => getStoryAccessState(s) === 'available');
                    const isSelected = activeStoryLineHubId === line.id;
                    return (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setActiveStoryLineHubId(line.id);
                        }}
                        className={`w-full px-3 py-2 rounded-[2px] border text-left transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#171922] border-[#f5dd1b] text-white'
                            : 'bg-[#121319] border-white/[0.06] text-zinc-300 hover:bg-[#171922]'
                        }`}
                        style={isSelected ? { borderLeftWidth: '3px', borderLeftColor: line.themeColor } : undefined}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-2 h-2 rounded-[1px] flex-shrink-0" style={{ backgroundColor: line.themeColor }} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate">{line.titleKo}</span>
                              <span className="text-[10px] font-mono text-zinc-500">{line.code}</span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 truncate">{line.titleEn}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {hasRestored && <span className="w-1.5 h-1.5 rounded-[1px] bg-[#f5dd1b]" title="전문 수록 포함" />}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#0b0c0f] text-zinc-400">
                            {lineStories.length}편
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Flagship Saga Details */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 prts-scrollbar">
              {(() => {
                const activeLine = STORY_LINES.find((l) => l.id === activeStoryLineHubId) || STORY_LINES[0];
                const lineStories = filteredStories
                  .filter((s) => s.storyLineId === activeLine.id)
                  .sort((a, b) => a.seriesOrder - b.seriesOrder);
                const heroCover = lineStories.find((s) => s.splashVisualUrl)?.splashVisualUrl;
                const restoredCount = lineStories.filter((s) => getStoryAccessState(s) === 'available').length;
                const lineIds = new Set(lineStories.map((s) => s.id));
                const crossLinksForLine = allConnections.filter(
                  (c) =>
                    c.type === 'cross' &&
                    ((lineIds.has(c.fromId) && !lineIds.has(c.toId)) ||
                      (!lineIds.has(c.fromId) && lineIds.has(c.toId)))
                );

                return (
                  <div className="max-w-5xl mx-auto space-y-6">
                    {/* Flagship Hero Cover Banner */}
                    <div
                      className="rounded-[2px] bg-[#111217] border border-white/[0.1] p-5 sm:p-7 relative overflow-hidden"
                      style={{ borderLeftWidth: '4px', borderLeftColor: activeLine.themeColor }}
                    >
                      {heroCover && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <img
                            src={resolveAssetUrl(heroCover)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover opacity-35"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1015] via-[#0e1015]/88 to-[#0e1015]/50" />
                        </div>
                      )}

                      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2 max-w-3xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="px-2 py-0.5 text-xs font-mono font-black text-black rounded-[2px]"
                              style={{ backgroundColor: activeLine.themeColor }}
                            >
                              {activeLine.code}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-mono bg-black/60 border border-white/15 text-zinc-200 rounded-[2px]">
                              총 {lineStories.length}편 · 전문 복원 {restoredCount}편
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                            {activeLine.titleKo}
                            <span className="block sm:inline text-xs sm:text-sm font-mono text-zinc-400 font-normal sm:ml-2">
                              / {activeLine.titleEn}
                            </span>
                          </h2>
                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed break-keep">
                            {activeLine.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setFocusedLineId(activeLine.id);
                            setActiveThreadStoryId(null);
                            setBrowseMode('stream');
                          }}
                          className="h-9 px-3.5 rounded-[2px] bg-[#161820]/90 hover:bg-zinc-100 hover:text-black text-zinc-100 border border-white/15 text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>연대기 스트림에서 보기</span>
                        </button>
                      </div>

                      {crossLinksForLine.length > 0 && (
                        <div className="relative z-10 mt-5 pt-4 border-t border-white/[0.08]">
                          <div className="text-[11px] font-mono text-zinc-300 font-bold mb-2 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-[#f5dd1b]" />
                            <span>타 시리즈와의 교차 인과 ({crossLinksForLine.length}건)</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {crossLinksForLine.map((cl) => {
                              const fromS = storyMap.get(cl.fromId);
                              const toS = storyMap.get(cl.toId);
                              if (!fromS || !toS) return null;
                              const other = lineIds.has(fromS.id) ? toS : fromS;
                              return (
                                <div
                                  key={`${cl.fromId}-${cl.toId}`}
                                  onClick={() => {
                                    playClickSound();
                                    setInspectedStory(other);
                                    setActiveStoryLineHubId(other.storyLineId);
                                  }}
                                  className="px-3 py-2 rounded-[2px] bg-black/55 border border-white/[0.09] hover:border-[#f5dd1b]/55 cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0">
                                    <div className="font-mono text-[11px] text-white font-bold truncate">
                                      {fromS.titleKo} ({fromS.code}) → {toS.titleKo} ({toS.code})
                                    </div>
                                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">{cl.reasonKo}</div>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sequential Reading Track */}
                    <div className="space-y-3.5">
                      {lineStories.map((story, idx) => {
                        const accessState = getStoryAccessState(story);
                        const isRestored = accessState === 'available';
                        const isSelected = inspectedStory?.id === story.id;
                        const progress = getStoryProgress(story.id);
                        const progressPct = progress ? Math.round(progress.scrollRatio * 100) : 0;

                        return (
                          <div key={story.id} className="relative">
                            {idx > 0 && (
                              <div className="flex items-center gap-2 py-1 pl-5 text-zinc-500 font-mono text-[10px]">
                                <div className="w-0.5 h-4" style={{ backgroundColor: activeLine.themeColor }} />
                                <span>STEP 0{idx + 1}</span>
                              </div>
                            )}

                            <div
                              onClick={() => {
                                playClickSound();
                                setInspectedStory(story);
                              }}
                              className={`relative group rounded-[2px] border p-4 transition-colors cursor-pointer flex flex-col sm:flex-row gap-4 items-stretch overflow-hidden ${
                                isSelected
                                  ? 'bg-[#171923] border-[#f5dd1b]'
                                  : 'bg-[#111217] border-white/[0.08] hover:border-white/25'
                              }`}
                            >
                              <div
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full sm:w-52 h-36 sm:h-auto flex-shrink-0 rounded-[2px] bg-black overflow-hidden relative border border-white/10"
                              >
                                {story.splashVisualUrl ? (
                                  <>
                                    <img
                                      src={resolveAssetUrl(story.splashVisualUrl)}
                                      alt={story.titleKo}
                                      loading="lazy"
                                      decoding="async"
                                      draggable={false}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                                    />
                                    <CopyrightBadge />
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
                                    NO VISUAL
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-mono font-black bg-black/85 text-white border border-white/20">
                                  {story.code}
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#f5dd1b] transition-colors">
                                        {story.titleKo}
                                      </h3>
                                      <span className="text-xs font-mono text-zinc-400">{story.titleEn}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-mono text-[#f5dd1b] bg-[#f5dd1b]/10 px-2 py-0.5 rounded-[2px] border border-[#f5dd1b]/30">
                                        {story.timeline}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-[2px] ${
                                          isRestored ? 'bg-[#f5dd1b] text-black' : 'bg-white/[0.08] text-zinc-300'
                                        }`}
                                      >
                                        {isRestored ? '전문 복원' : '공식 개요'}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed break-keep">
                                    {story.officialSynopsis}
                                  </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                                    <span>YEAR 0{story.releaseYear ?? 1} (#{story.releaseOrder})</span>
                                    {progressPct > 0 && <span className="text-[#f5dd1b]">진행 {progressPct}%</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playClickSound();
                                        setActiveThreadStoryId(story.id);
                                        setBrowseMode('stream');
                                      }}
                                      className="h-8 px-2.5 rounded-[2px] bg-[#171922] hover:bg-[#232632] text-zinc-300 hover:text-[#f5dd1b] border border-white/10 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <GitBranch className="w-3.5 h-3.5" />
                                      <span>인과 추적</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playOpenSound();
                                        onSelectStory(story.id);
                                      }}
                                      className="h-8 px-3 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      <span>{isRestored ? '요약본 열람' : '개요 열람'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {progressPct > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.05]">
                                  <div className="h-full bg-[#f5dd1b]" style={{ width: `${progressPct}%` }} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* VIEW 3: COMPACTED INTERACTIVE 2D CAUSAL MATRIX (Power-User Bird's-Eye Overview) */}
        {browseMode === 'matrix' && (
          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0c0c0e]">
            {/* Sticky Synchronized Time Ruler */}
            <div className="h-8 flex-shrink-0 bg-[#0e0f13]/95 border-b border-white/[0.08] px-3 flex items-center justify-between gap-2 z-30 select-none">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0">
                <span className="hidden lg:inline text-[9.5px] font-mono tracking-widest text-zinc-500 uppercase mr-1.5 flex-shrink-0">
                  EPOCH RULER //
                </span>
                {TIMELINE_ERAS.map((era) => {
                  const isActive = activeRulerEraId === era.id;
                  return (
                    <button
                      key={`ruler-${era.id}`}
                      type="button"
                      onClick={() => scrollMatrixToEra(era.id)}
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white/[0.09] text-white border border-white/25 font-bold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: era.color, opacity: isActive ? 1 : 0.55 }}
                      />
                      <span>{era.code}</span>
                      <span className="hidden md:inline text-zinc-500">{era.periodKo}</span>
                    </button>
                  );
                })}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 flex-shrink-0">
                <span>TIER:</span>
                <span className="text-zinc-200 font-bold uppercase">{zoomTier}</span>
              </div>
            </div>

            <div
              ref={containerRef}
              onPointerDown={handleCanvasPointerDown}
              className={`relative flex-1 min-h-0 overflow-hidden bg-[#0c0c0e] select-none ${
                isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ touchAction: 'none' }}
            >
              <div
                ref={gridBgRef}
                className="absolute inset-0 pointer-events-none opacity-35 bg-[linear-gradient(to_right,#1c1e24_1px,transparent_1px),linear-gradient(to_bottom,#1c1e24_1px,transparent_1px)] bg-[size:48px_48px]"
                style={{ backgroundPosition: '36px 24px' }}
              />

              <div
                ref={stageRef}
                className="absolute left-0 top-0 origin-top-left will-change-transform"
                style={
                  {
                    transform: 'translate3d(36px, 24px, 0) scale(0.88)',
                    '--prts-splash-fade': '1',
                    '--prts-meta-fade': '1',
                  } as React.CSSProperties
                }
              >
                <svg className="absolute inset-0 pointer-events-none z-30 overflow-visible" style={{ width: '100%', height: '100%' }}>
                  {allConnections
                    .filter((c) => c.type === 'series')
                    .map((conn) => {
                      const from = nodeCoords[conn.fromId];
                      const to = nodeCoords[conn.toId];
                      if (!from || !to) return null;
                      const { d, startX, startY, endX, endY } = buildSmartConnectionPath(from, to, false);
                      const isAnyHighlighted = highlightedStoryIds.size > 0;
                      return (
                        <g key={`bg-${conn.fromId}-${conn.toId}`}>
                          <path
                            d={d}
                            fill="none"
                            stroke={conn.color}
                            strokeWidth={1.75}
                            strokeOpacity={isAnyHighlighted ? 0.12 : 0.48}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {!isAnyHighlighted && (
                            <>
                              <circle cx={startX} cy={startY} r={2.2} fill={conn.color} fillOpacity={0.6} />
                              <circle cx={endX} cy={endY} r={2.6} fill={conn.color} fillOpacity={0.75} />
                            </>
                          )}
                        </g>
                      );
                    })}

                  {activeConnections.map((conn) => {
                    const from = nodeCoords[conn.fromId];
                    const to = nodeCoords[conn.toId];
                    if (!from || !to) return null;
                    const isCross = conn.type === 'cross';
                    const { d, startX, startY, endX, endY } = buildSmartConnectionPath(from, to, isCross);
                    const strokeColor = isCross ? '#f5dd1b' : conn.color;
                    return (
                      <g key={`active-${conn.fromId}-${conn.toId}`}>
                        <path
                          d={d}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isCross ? 4.5 : 5}
                          strokeOpacity={0.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d={d}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isCross ? 1.8 : 2.2}
                          strokeDasharray={isCross ? '6 4' : '10 6'}
                          strokeOpacity={0.92}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="prts-causal-flow"
                        />
                        <circle cx={startX} cy={startY} r={3.2} fill={strokeColor} fillOpacity={0.9} />
                        <circle cx={endX} cy={endY} r={4} fill={strokeColor} fillOpacity={0.95} />
                      </g>
                    );
                  })}
                </svg>

                <div className="inline-flex flex-col p-6 gap-0 min-w-max">
                  {/* Top Row: Era Headers */}
                  <div className="flex items-stretch gap-5 mb-4">
                    <div className="w-56 flex-shrink-0 bg-[#121316] border border-white/[0.09] rounded-[2px] p-3.5 flex flex-col justify-between">
                      <div className="text-[10px] font-mono text-[#f5dd1b] font-bold tracking-widest uppercase">
                        STRATEGIC THEATERS
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">6대 서사 노선 × 5대 시대</div>
                      <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-0.5 bg-zinc-400 inline-block" /> 직계 연작
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-0.5 border-b border-dashed border-[#f5dd1b] inline-block" /> 교차 인과
                        </span>
                      </div>
                    </div>

                    {TIMELINE_ERAS.map((era) => {
                      const eraCount = filteredStories.filter(
                        (s) => s.chronologicalOrder >= era.minOrder && s.chronologicalOrder <= era.maxOrder
                      ).length;
                      return (
                        <div
                          key={era.id}
                          id={`matrix-era-${era.id}`}
                          style={{
                            minWidth: era.id === 'era_03' ? '960px' : era.id === 'era_02' ? '740px' : '520px',
                            borderTopColor: era.color,
                          }}
                          className="flex-1 bg-[#121316]/96 border border-white/[0.09] border-t-2 rounded-[2px] p-3.5 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-[11px] font-mono font-black text-black rounded-[1px]" style={{ backgroundColor: era.color }}>
                                {era.code}
                              </span>
                              <span className="text-xs font-mono font-bold text-zinc-300">{era.periodKo}</span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded-[2px]">
                              {eraCount}개 작전
                            </span>
                          </div>
                          <div className="mt-1.5">
                            <h2 className="text-sm font-bold text-white tracking-tight">
                              {era.titleKo}
                              <span className="text-xs font-mono text-zinc-500 font-normal ml-2">/ {era.titleEn}</span>
                            </h2>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{era.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 6 Strategic Lanes Rows (Compacted Empty Row Height) */}
                  <div className="space-y-2.5">
                    {STRATEGIC_LANES.map((lane) => {
                      const isCore = lane.id === 'LANE_CORE';
                      return (
                        <div key={lane.id} className="flex items-stretch gap-5">
                          <div
                            className={`w-56 flex-shrink-0 rounded-[2px] border p-3 flex flex-col justify-center relative overflow-hidden ${
                              isCore ? 'bg-[#15161b] border-[#f5dd1b]/35' : 'bg-[#111215] border-white/[0.08]'
                            }`}
                            style={{ borderLeftWidth: '3px', borderLeftColor: lane.color }}
                          >
                            <div className="text-[10px] font-mono font-bold tracking-wider uppercase" style={{ color: lane.color }}>
                              {lane.code}
                            </div>
                            <div className="text-xs font-bold text-white mt-0.5 leading-snug">{lane.titleKo}</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">{lane.subtitleKo}</div>
                          </div>

                          {TIMELINE_ERAS.map((era) => {
                            const cellStories = filteredStories
                              .filter(
                                (s) =>
                                  lane.storyLineIds.includes(s.storyLineId) &&
                                  s.chronologicalOrder >= era.minOrder &&
                                  s.chronologicalOrder <= era.maxOrder
                              )
                              .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);

                            return (
                              <div
                                key={`${lane.id}-${era.id}`}
                                style={{
                                  minWidth: era.id === 'era_03' ? '960px' : era.id === 'era_02' ? '740px' : '520px',
                                }}
                                className={`flex-1 rounded-[2px] border transition-colors ${
                                  cellStories.length === 0
                                    ? 'bg-[#0e0f12]/35 border-white/[0.03] p-2 min-h-[56px] flex items-center justify-center'
                                    : isCore
                                    ? 'bg-[#131418]/85 border-white/[0.08] p-3 flex flex-col justify-center'
                                    : 'bg-[#101114]/75 border-white/[0.06] p-3 flex flex-col justify-center'
                                }`}
                              >
                                {cellStories.length === 0 ? (
                                  <span className="text-[10px] font-mono text-zinc-800 select-none">·</span>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-3.5">
                                    {cellStories.map((story) => {
                                      const accessState = getStoryAccessState(story);
                                      const isRestored = accessState === 'available';
                                      const isLocked = accessState === 'locked';
                                      const isSelected = inspectedStory?.id === story.id;
                                      const isHovered = hoveredStoryId === story.id;
                                      const isDimmed =
                                        highlightedStoryIds.size > 0 && !highlightedStoryIds.has(story.id);
                                      const lineMeta = lineMetaMap.get(story.storyLineId);
                                      const accentColor = lineMeta?.themeColor || '#71717a';
                                      const cleanTimeline = story.timeline
                                        .replace(/^테라력\s*/, '')
                                        .replace(/\s*\([^)]*\)/g, '')
                                        .trim();

                                      return (
                                        <div
                                          key={story.id}
                                          ref={(el) => {
                                            if (el) nodeRefs.current.set(story.id, el);
                                            else nodeRefs.current.delete(story.id);
                                          }}
                                          onMouseEnter={() => setHoveredStoryId(story.id)}
                                          onMouseLeave={() => setHoveredStoryId(null)}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (dragTrackingRef.current.hasMoved || dragTrackingRef.current.moveDistance > 5) {
                                              return;
                                            }
                                            playClickSound();
                                            setInspectedStory(story);
                                          }}
                                          onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            if (!isLocked) {
                                              playOpenSound();
                                              onSelectStory(story.id);
                                            }
                                          }}
                                          style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
                                          className={`group relative rounded-[2px] border transition-[background-color,border-color,opacity,transform,filter] duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                                            lane.isCompactLane || story.isOmnibus
                                              ? 'w-48 h-[96px] p-2.5'
                                              : isCore
                                              ? 'w-56 h-[118px] p-3'
                                              : 'w-52 h-[110px] p-3'
                                          } ${
                                            isDimmed ? 'opacity-20 saturate-50 hover:opacity-90 hover:saturate-100' : 'opacity-100'
                                          } ${
                                            isSelected
                                              ? 'bg-[#191b22] border-[#f5dd1b] ring-1 ring-[#f5dd1b] -translate-y-0.5'
                                              : isHovered
                                              ? 'bg-[#16181e] border-white/45 -translate-y-0.5'
                                              : isRestored
                                              ? 'bg-[#131419] border-white/[0.16] hover:border-[#f5dd1b]/70'
                                              : isLocked
                                              ? 'bg-[#101012] border-white/[0.05]'
                                              : 'bg-[#111215] border-white/[0.08] hover:border-white/25'
                                          }`}
                                        >
                                          {story.splashVisualUrl && !isLocked && (
                                            <div
                                              style={{ opacity: 'var(--prts-splash-fade, 1)' }}
                                              className="absolute inset-0 overflow-hidden pointer-events-none"
                                            >
                                              <img
                                                src={resolveAssetUrl(story.splashVisualUrl)}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                draggable={false}
                                                className="w-full h-full object-cover opacity-45 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300 select-none"
                                                onError={(e) => {
                                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                }}
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-t from-[#101114] via-[#101114]/75 to-[#101114]/30" />
                                            </div>
                                          )}

                                          <div className="relative z-10 flex items-center justify-between gap-1 text-[10px] font-mono">
                                            <span
                                              className={`px-1.5 py-0.5 font-black tracking-wider rounded-[1px] ${
                                                isRestored
                                                  ? 'bg-[#f5dd1b] text-black'
                                                  : isLocked
                                                  ? 'bg-zinc-900 text-zinc-500 border border-white/10'
                                                  : 'bg-black/80 text-zinc-200 border border-white/15'
                                              }`}
                                            >
                                              {story.code}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              {story.isOmnibus && (
                                                <span style={{ opacity: 'var(--prts-meta-fade, 1)' }}>
                                                  <FilmReelIcon className="w-3.5 h-3.5 text-zinc-300" title="옴니버스 단편" />
                                                </span>
                                              )}
                                              {isRestored && (
                                                <span className="px-1 py-0.2 bg-[#f5dd1b]/15 border border-[#f5dd1b]/50 text-[#f5dd1b] text-[9px] font-bold rounded-[1px]">
                                                  전문
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="relative z-10 my-auto py-0.5">
                                            <div className="text-xs sm:text-[13px] font-bold text-white group-hover:text-[#f5dd1b] transition-colors leading-snug truncate">
                                              {story.titleKo}
                                            </div>
                                            <div
                                              style={{ opacity: 'var(--prts-meta-fade, 1)' }}
                                              className="text-[10px] font-mono text-zinc-400 truncate mt-0.5"
                                            >
                                              {story.titleEn}
                                            </div>
                                          </div>

                                          <div
                                            style={{ opacity: 'var(--prts-meta-fade, 1)' }}
                                            className="relative z-10 pt-1 border-t border-white/[0.08] flex items-center justify-between gap-1.5 text-[10px] font-mono"
                                          >
                                            <span className="text-zinc-300 truncate">{cleanTimeline}</span>
                                            <span className="text-[9.5px] font-bold flex-shrink-0" style={{ color: accentColor }}>
                                              {lineMeta?.titleKo.replace('내일을 위하여 · ', '')}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom-Left Controls Dock */}
              <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 p-1.5 rounded-[2px] bg-[#121316]/95 backdrop-blur-md border border-white/[0.12] shadow-xl font-mono text-xs">
                <div className="hidden sm:flex items-center gap-1.5 px-2 text-[10px] text-zinc-400 border-r border-white/10 select-none">
                  <Move className="w-3 h-3 text-zinc-400" />
                  <span>드래그 이동 · 휠 줌 · 더블클릭 열람</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleZoomStep(-0.12)}
                  className="w-7 h-7 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="축소"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span ref={zoomTextRef} className="px-2 text-[11px] font-bold text-zinc-100 min-w-[44px] text-center tabular-nums">
                  88%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoomStep(0.12)}
                  className="w-7 h-7 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="확대"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
                <button
                  type="button"
                  onClick={handleFitAll}
                  className="px-2 h-7 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center gap-1 text-[10.5px] cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3 text-zinc-300" />
                  <span className="hidden md:inline">전체 조망</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="w-7 h-7 rounded-[2px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="기본 배율 복귀"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom-Right Interactive Radar Minimap */}
              <div
                className={`hidden md:block absolute bottom-4 z-30 rounded-[2px] bg-[#101114]/92 backdrop-blur-md border border-white/[0.14] shadow-2xl overflow-hidden transition-[right] duration-300 ${
                  inspectedStory ? 'right-[25rem]' : 'right-4'
                }`}
              >
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    isMinimapScrubbingRef.current = true;
                    jumpToMinimapPoint(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
                  }}
                  onPointerMove={(e) => {
                    if (!isMinimapScrubbingRef.current) return;
                    e.stopPropagation();
                    jumpToMinimapPoint(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
                  }}
                  onPointerUp={(e) => {
                    if (!isMinimapScrubbingRef.current) return;
                    isMinimapScrubbingRef.current = false;
                    e.stopPropagation();
                  }}
                  onPointerCancel={() => {
                    isMinimapScrubbingRef.current = false;
                  }}
                  className="relative cursor-crosshair bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:26px_27px]"
                  style={{ width: MINIMAP_W, height: MINIMAP_H }}
                  title="레이더 미니맵 클릭/드래그로 시점 즉시 이동"
                >
                  <div className="absolute top-1 left-1.5 text-[8.5px] font-mono tracking-widest text-zinc-500 uppercase pointer-events-none z-10">
                    RADAR // MATRIX
                  </div>
                  {filteredIdSet.size > 0 &&
                    Object.entries(nodeCoords).map(([id, box]) => {
                      const st = storyMap.get(id);
                      const isSel = inspectedStory?.id === id || hoveredStoryId === id;
                      const isRestoredNode = st ? getStoryAccessState(st) === 'available' : false;
                      return (
                        <div
                          key={`mm-${id}`}
                          style={{
                            left: `${(box.left / stageSize.width) * MINIMAP_W}px`,
                            top: `${(box.top / stageSize.height) * MINIMAP_H}px`,
                            width: `${Math.max(3, ((box.right - box.left) / stageSize.width) * MINIMAP_W)}px`,
                            height: `${Math.max(2.5, ((box.bottom - box.top) / stageSize.height) * MINIMAP_H)}px`,
                          }}
                          className={`absolute rounded-[0.5px] pointer-events-none ${
                            isSel ? 'bg-[#f5dd1b] z-10' : isRestoredNode ? 'bg-zinc-300/80' : 'bg-zinc-600/45'
                          }`}
                        />
                      );
                    })}
                  <div
                    ref={minimapViewportRef}
                    className="absolute top-0 left-0 border border-[#f5dd1b]/85 bg-[#f5dd1b]/[0.08] pointer-events-none will-change-transform"
                    style={{ width: '64px', height: '40px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT INSPECTED STORY DOSSIER DRAWER */}
        {inspectedStory && (
          <>
            <div
              onClick={() => {
                playCloseSound();
                setInspectedStory(null);
              }}
              className="fixed inset-0 bg-black/55 backdrop-blur-xs z-30 lg:hidden animate-fadeIn"
            />
            <aside
              style={
                sheetDragY > 0
                  ? { transform: `translateY(${sheetDragY}px)`, transition: 'none' }
                  : undefined
              }
              className="fixed inset-x-0 bottom-0 h-[76vh] max-h-[82vh] rounded-t-[6px] lg:rounded-none lg:static lg:inset-auto lg:h-auto lg:max-h-none lg:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.12] bg-[#101116] flex flex-col z-40 shadow-2xl overflow-hidden transition-transform"
            >
              <div
                onTouchStart={(e) => {
                  sheetTouchStartY.current = e.touches[0].clientY;
                }}
                onTouchMove={(e) => {
                  if (sheetTouchStartY.current === null) return;
                  setSheetDragY(Math.max(0, e.touches[0].clientY - sheetTouchStartY.current));
                }}
                onTouchEnd={() => {
                  if (sheetDragY > 70) {
                    playCloseSound();
                    setInspectedStory(null);
                  }
                  setSheetDragY(0);
                  sheetTouchStartY.current = null;
                }}
                onClick={() => {
                  playCloseSound();
                  setInspectedStory(null);
                }}
                className="lg:hidden flex items-center justify-center py-2.5 bg-black/40 border-b border-white/[0.06] cursor-pointer flex-shrink-0 touch-none"
              >
                <div className="w-10 h-1 rounded-[1px] bg-zinc-600" />
              </div>

              <div className="relative h-44 bg-black border-b border-white/[0.08] overflow-hidden flex-shrink-0">
                {inspectedStory.splashVisualUrl ? (
                  <>
                    <img
                      src={resolveAssetUrl(inspectedStory.splashVisualUrl)}
                      alt={inspectedStory.titleKo}
                      className="w-full h-full object-cover select-none"
                      draggable={false}
                    />
                    <CopyrightBadge style={{ zIndex: 10, top: '12px', left: '12px', right: 'auto', bottom: 'auto' }} />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#121316]">
                    <Layers className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101116] via-[#101116]/45 to-transparent pointer-events-none" />

                <button
                  type="button"
                  onClick={() => {
                    playCloseSound();
                    setInspectedStory(null);
                  }}
                  className="absolute top-3 right-3 w-7 h-7 rounded-[2px] bg-[#141519]/90 hover:bg-[#1f2228] text-zinc-300 hover:text-white border border-white/15 flex items-center justify-center cursor-pointer z-10"
                  title="브리핑 닫기"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 inset-x-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-black bg-zinc-100 text-black rounded-[1px]">
                      {inspectedStory.code}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-[#141519]/90 text-zinc-200 border border-white/15 rounded-[1px]">
                      {lineMetaMap.get(inspectedStory.storyLineId)?.titleKo || inspectedStory.categoryLabel}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow">
                    {inspectedStory.titleKo}
                  </h2>
                  <div className="text-xs font-mono text-zinc-400 truncate">{inspectedStory.titleEn}</div>
                </div>
              </div>

              <div className="p-3 bg-[#14161c] border-b border-white/[0.08] flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={getStoryAccessState(inspectedStory) === 'locked'}
                  onClick={() => {
                    playOpenSound();
                    onSelectStory(inspectedStory.id);
                  }}
                  className="flex-1 h-9 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{getStoryAccessState(inspectedStory) === 'available' ? '요약본 열람' : '개요 열람'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setActiveThreadStoryId(inspectedStory.id);
                    setBrowseMode('stream');
                  }}
                  className="h-9 px-2.5 rounded-[2px] bg-[#1a1c24] hover:bg-[#232632] text-[#f5dd1b] border border-[#f5dd1b]/35 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  title="이 작전의 인과 체인 집중 보기"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>연결 추적</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playOpenSound();
                    setSelectedModalStory(inspectedStory);
                    setIsModalOpen(true);
                  }}
                  className="h-9 px-2.5 rounded-[2px] bg-[#1a1c24] hover:bg-[#232632] text-zinc-200 border border-white/15 text-xs font-mono flex items-center justify-center cursor-pointer transition-colors"
                  title="상세 스플래시"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain prts-modal-scroll p-4 pb-6 space-y-4 prts-scrollbar text-xs">
                <div className="grid grid-cols-2 gap-2 bg-[#15171e] p-3 rounded-[2px] border border-white/[0.06] font-mono">
                  <div>
                    <div className="text-[10px] text-zinc-500">작전 시점</div>
                    <div className="text-xs text-[#f5dd1b] font-bold mt-0.5">{inspectedStory.timeline}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">수록 상태</div>
                    <div className="text-xs text-white font-bold mt-0.5">
                      {getStoryAccessState(inspectedStory) === 'available'
                        ? '요약본 수록'
                        : getStoryAccessState(inspectedStory) === 'overview_only'
                        ? '공식 개요 수록'
                        : '미수록'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-zinc-400" />
                    <span>스토리 개요</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed bg-[#15171e] p-3 rounded-[2px] border border-white/[0.06] break-keep">
                    {inspectedStory.officialSynopsis}
                  </p>
                </div>

                {inspectedStory.subPages && inspectedStory.subPages.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      수록 파트 구성 ({inspectedStory.subPages.length}개 섹션)
                    </div>
                    <div className="space-y-1">
                      {inspectedStory.subPages.map((sp) => (
                        <div
                          key={sp.id}
                          onClick={() => {
                            playOpenSound();
                            onSelectStory(inspectedStory.id);
                          }}
                          className="px-2.5 py-1.5 rounded-[2px] bg-[#15171e] hover:bg-[#1e212b] border border-white/[0.07] hover:border-white/25 cursor-pointer flex items-center justify-between text-[11px] transition-colors"
                        >
                          <span className="text-zinc-200 font-medium truncate">{sp.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <div className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-[#f5dd1b]" />
                    <span>연관 스토리</span>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 mb-1">
                      ◀ 이전 / 배경 스토리 ({inspectedConnections.incoming.length})
                    </div>
                    {inspectedConnections.incoming.length === 0 ? (
                      <div className="text-[11px] text-zinc-600 font-mono py-1">이 시리즈의 시작점입니다.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {inspectedConnections.incoming.map((inc) => (
                          <div
                            key={`in-${inc.fromId}`}
                            onClick={() => focusOnStoryNode(inc.fromId)}
                            className="p-2.5 rounded-[2px] bg-[#15171e] hover:bg-[#1e212b] border border-white/[0.07] hover:border-[#f5dd1b]/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-[#0f1014] text-zinc-200 border border-white/15 rounded-[1px]">
                                  {inc.story.code}
                                </span>
                                <span className="font-bold text-white">{inc.story.titleKo}</span>
                              </div>
                              <span
                                className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] ${
                                  inc.type === 'cross' ? 'bg-[#f5dd1b]/15 text-[#f5dd1b]' : 'bg-white/[0.07] text-zinc-300'
                                }`}
                              >
                                {inc.type === 'cross' ? '교차 연결' : '이전 편'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{inc.reasonKo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 mb-1">
                      ▶ 다음 / 파생 스토리 ({inspectedConnections.outgoing.length})
                    </div>
                    {inspectedConnections.outgoing.length === 0 ? (
                      <div className="text-[11px] text-zinc-600 font-mono py-1">최신 챕터이거나 독립 결말입니다.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {inspectedConnections.outgoing.map((out) => (
                          <div
                            key={`out-${out.toId}`}
                            onClick={() => focusOnStoryNode(out.toId)}
                            className="p-2.5 rounded-[2px] bg-[#15171e] hover:bg-[#1e212b] border border-white/[0.07] hover:border-[#f5dd1b]/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-[#0f1014] text-zinc-200 border border-white/15 rounded-[1px]">
                                  {out.story.code}
                                </span>
                                <span className="font-bold text-white">{out.story.titleKo}</span>
                              </div>
                              <span
                                className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] ${
                                  out.type === 'cross' ? 'bg-[#f5dd1b]/15 text-[#f5dd1b]' : 'bg-white/[0.07] text-zinc-300'
                                }`}
                              >
                                {out.type === 'cross' ? '교차 연결' : '다음 편'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{out.reasonKo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {inspectedRegions.length > 0 && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <div className="text-[10px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#f5dd1b]" />
                        <span>관련 테라 권역 ({inspectedRegions.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {inspectedRegions.map((reg) => (
                          <button
                            key={`reg-chip-${reg.id}`}
                            type="button"
                            onClick={() => {
                              playClickSound();
                              onNavigateToMapRegion?.(reg.id);
                            }}
                            className="px-2 py-1 rounded-[2px] bg-[#15171e] hover:bg-[#1f222c] border border-white/[0.08] hover:border-[#f5dd1b]/55 text-[11px] font-medium text-zinc-200 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: reg.badgeColor }} />
                            <span>{reg.nameKo}</span>
                            <ChevronRight className="w-3 h-3 text-zinc-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {selectedModalStory && (
        <StorySplashModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          story={selectedModalStory}
          onEnterStory={(id) => {
            setIsModalOpen(false);
            onSelectStory(id);
          }}
        />
      )}
    </div>
  );
};

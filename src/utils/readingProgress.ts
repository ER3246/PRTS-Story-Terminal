/**
 * PRTS Archive - Client-Side Reading Progress Persistence (localStorage)
 *
 * 백엔드 없이 브라우저 로컬 스토리지에 최근 열람 스토리, 하위 파트, 스크롤 진행률을 저장합니다.
 */

export interface ReadingProgressEntry {
  storyId: string;
  subPageId?: string | null;
  scrollRatio: number;
  updatedAt: number;
}

const STORAGE_KEY = 'prts_reading_progress_v1';
const MAX_ENTRIES = 12;

function clampRatio(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
}

function readAllRaw(): ReadingProgressEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ReadingProgressEntry =>
          Boolean(item && typeof item.storyId === 'string' && typeof item.updatedAt === 'number')
      )
      .map((item) => ({
        storyId: item.storyId,
        subPageId: typeof item.subPageId === 'string' ? item.subPageId : null,
        scrollRatio: clampRatio(Number(item.scrollRatio ?? 0)),
        updatedAt: item.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function writeAllRaw(entries: ReadingProgressEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage 차단/용량 초과 환경에서는 조용히 무시
  }
}

export function saveReadingProgress(
  entry: Omit<ReadingProgressEntry, 'updatedAt'>
): void {
  if (!entry.storyId) return;
  const normalizedRatio = clampRatio(entry.scrollRatio);
  const current = readAllRaw().filter((item) => item.storyId !== entry.storyId);
  const next: ReadingProgressEntry = {
    storyId: entry.storyId,
    subPageId: entry.subPageId || null,
    scrollRatio: normalizedRatio,
    updatedAt: Date.now(),
  };
  writeAllRaw([next, ...current]);
}

export function getRecentReadingList(limit = 4): ReadingProgressEntry[] {
  return readAllRaw().slice(0, Math.max(0, limit));
}

export function getLastReadingEntry(): ReadingProgressEntry | null {
  const list = readAllRaw();
  return list.length > 0 ? list[0] : null;
}

export function getStoryProgress(storyId: string): ReadingProgressEntry | null {
  return readAllRaw().find((item) => item.storyId === storyId) ?? null;
}

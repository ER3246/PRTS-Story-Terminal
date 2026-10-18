import React, { useEffect } from 'react';
import type { StoryListItem } from '../data/storyRegistry';
import { storyRegistry, getStoryAccessState } from '../data/storyRegistry';
import { 
  X, 
  Lock, 
  ArrowRight, 
  Clock, 
  Calendar, 
  FolderLock, 
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { playClickSound, playCloseSound, playOpenSound, playTabSwitchSound } from '../utils/soundEffects';
import { resolveAssetUrl } from '../utils/assetUrl';
import { CopyrightBadge } from './CopyrightedImage';

interface StorySplashModalProps {
  story: StoryListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEnterStory: (storyId: string) => void;
  onSelectStoryInModal?: (story: StoryListItem) => void;
}

// 인게임 옴니버스 전용 3-날개 필름 릴 아이콘
export const FilmReelIcon: React.FC<{ className?: string; title?: string }> = ({ className = 'w-4 h-4', title }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="6.5" r="1.5" fill="currentColor" />
    <circle cx="7.2" cy="14.8" r="1.5" fill="currentColor" />
    <circle cx="16.8" cy="14.8" r="1.5" fill="currentColor" />
    <path d="M12 9v-2.5" />
    <path d="M9.5 13.5l-2.3 1.3" />
    <path d="M14.5 13.5l2.3 1.3" />
  </svg>
);

export const StorySplashModal: React.FC<StorySplashModalProps> = ({
  story,
  isOpen,
  onClose,
  onEnterStory,
  onSelectStoryInModal
}) => {
  // ESC 키 닫기 핸러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        playCloseSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !story) return null;

  // 동일 시리즈 / 서사 라인에 속한 형제 에피소드 목록 추출 (인게임 하단 탭과 동일)
  const relatedStories = storyRegistry.filter((s) => s.storyLineId === story.storyLineId);

  const accessState = getStoryAccessState(story);
  const isAvailable = accessState === 'available';
  const isLocked = accessState === 'locked';

  const handleEnter = () => {
    if (isLocked) {
      playClickSound();
      return;
    }
    playOpenSound();
    onEnterStory(story.id);
    onClose();
  };

  return (
    <div 
      data-modal="true"
      data-hud-panel="true"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      {/* 바깥 배경 클릭 닫기 */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          playCloseSound();
          onClose();
        }} 
      />

      {/* 메인 스플래시 컨테이너 */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[#0c0d12] border border-[#2a2e3d] shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* 상단 윈도우 컨트롤 바 */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#12141c] border-b border-[#242735] font-mono text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#ffe600] animate-pulse" />
            <span className="text-zinc-400 font-bold">SPECIAL ARCHIVE</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-300 font-semibold">{story.storyLineTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">ESC TO CLOSE</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playCloseSound();
                onClose();
              }}
              className="p-1 hover:bg-[#252a38] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="창 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 본문 그리드: 좌측 대형 비주얼 + 우측 공식 정보/개요 */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* 좌측: 대형 비주얼 영역 (인게임 1:1 대형 배너 룩앤필) */}
          <div
            onContextMenu={(e) => e.preventDefault()}
            className="md:col-span-5 relative bg-black min-h-[260px] md:min-h-[460px] flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-[#202432]"
          >
            <img
              src={resolveAssetUrl(story.splashVisualUrl || '/images/backgrounds/bg_black.png')}
              alt={story.titleKo}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-cover object-center filter brightness-90 contrast-105 select-none"
              onError={(e) => {
                // 이미지 로드 실패 시 블랙 배경 폴백
                (e.target as HTMLImageElement).src = resolveAssetUrl('/images/backgrounds/bg_corridor.png');
              }}
            />
            <CopyrightBadge />

            {/* 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0c0d12]/90 pointer-events-none" />

            {/* 테크 그리드 패턴 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffe600_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

            {/* 좌측 상단 스토리 코드 배지 */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-black/80 backdrop-blur border border-[#ffe600]/60 text-[#ffe600] font-mono font-black text-xs tracking-wider shadow">
                {story.code}
              </span>

              {story.isOmnibus && (
                <span className="px-2 py-0.5 bg-[#ffe600] text-black font-mono font-bold text-[11px] flex items-center gap-1 shadow">
                  <FilmReelIcon className="w-3.5 h-3.5 text-black" />
                  <span>OMNIBUS</span>
                </span>
              )}
            </div>

            {/* 좌측 하단 보안 등급 라벨 */}
            <div className="absolute bottom-4 left-4 right-24 text-xs font-mono">
              {isLocked ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 border border-red-500/60 text-red-400">
                  <FolderLock className="w-3.5 h-3.5" />
                  <span>LEVEL 5 RESTRICTED</span>
                </div>
              ) : isAvailable ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PRTS ARCHIVE // 열람 가능</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/80 border border-sky-500/60 text-sky-300">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>DATA ARCHIVED // 개요 수록</span>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 공식 개요문, 인트로, 메타데이터 */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#0c0d12]">
            <div className="space-y-5">
              {/* 시리즈 및 영문/국문 타이틀 */}
              <div className="space-y-1.5 border-b border-[#1f2330] pb-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#ffe600] font-bold tracking-wider">
                    {story.storyLineTitle}
                  </span>
                  <span className="text-zinc-500 font-mono">
                    {story.categoryLabel}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight [word-break:keep-all] break-words">
                  {story.titleKo}
                </h2>
                <div className="text-xs font-mono text-zinc-400 tracking-widest uppercase">
                  {story.titleEn}
                </div>
              </div>

              {/* 시간대 및 연대기 메타 배너 */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#13151e] border border-[#222533] text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#ffe600]" />
                    <span>작전 시기</span>
                  </div>
                  <div className="text-zinc-200 font-semibold truncate">
                    {story.timeline.replace(/\s*\([^)]*\)/g, '').trim()}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#ffe600]" />
                    <span>출시 순번</span>
                  </div>
                  <div className="text-zinc-200 font-semibold truncate">
                    Vol. {story.releaseOrder} // {story.actGroup}
                  </div>
                </div>
              </div>

              {/* 공식 개요문 */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-400 tracking-wider">
                  <span className="w-1.5 h-1.5 bg-[#ffe600]" />
                  <span>공식 개요</span>
                </div>

                <div className="bg-[#11131a] border-l-2 border-[#ffe600] p-4 text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans [word-break:keep-all] break-words shadow-inner">
                  {story.officialSynopsis || '해당 에피소드의 작전 개요가 등록되지 않았습니다.'}
                </div>
              </div>

              {/* 옴니버스 스토리인 경우: 하위 단편 에피소드 미리보기 목록 */}
              {story.isOmnibus && story.omnibusSubEpisodes && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#ffe600] font-bold flex items-center gap-1.5">
                      <FilmReelIcon className="w-3.5 h-3.5" />
                      <span>수록 단편 ({story.omnibusSubEpisodes.length})</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {story.omnibusSubEpisodes.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-[#151722] border border-[#242738] p-2 text-xs font-mono space-y-0.5 hover:border-[#ffe600]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-bold truncate">#{sub.order}. {sub.titleKo}</span>
                        </div>
                        {sub.mainCharacter && (
                          <div className="text-[10px] text-[#ffe600] truncate">
                            주요 인물: {sub.mainCharacter}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 잠금 상태 경고 문구 */}
              {isLocked && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>한섭 미출시 / 인가 대기 챕터</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    해당 작전 기록은 한국 서버 미실장 또는 보안 잠금 상태입니다. 상세 작전 보고서는 정식 실장 후 개방됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* 우측 하단: 액션 버튼 */}
            <div className="pt-4 border-t border-[#1f2330] flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  playCloseSound();
                  onClose();
                }}
                className="px-4 py-2.5 bg-[#141620] border border-[#282d3e] text-zinc-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
              >
                닫기
              </button>

              {isLocked ? (
                <button
                  disabled
                  className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-600 font-mono text-xs flex items-center gap-2 cursor-not-allowed select-none"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>접근 제한</span>
                </button>
              ) : story.isOmnibus ? (
                <button
                  onClick={handleEnter}
                  className="px-6 py-2.5 bg-[#ffe600] hover:bg-white text-black font-black font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,230,0,0.3)]"
                >
                  <FilmReelIcon className="w-4 h-4 text-black" />
                  <span>스토리 열람</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleEnter}
                  disabled={isLocked}
                  className={`px-6 py-2.5 font-black font-mono text-xs flex items-center gap-2 transition-colors ${
                    isLocked
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-[#ffe600] hover:bg-white text-black cursor-pointer shadow-[0_0_15px_rgba(255,230,0,0.3)]'
                  }`}
                >
                  <span>{isLocked ? '접근 제한' : isAvailable ? '작전 기록 열람' : '개요 열람'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 하단: 연계 에피소드 탭 (동일 시리즈 내 빠른 전환 바로가기) */}
        {relatedStories.length > 1 && (
          <div className="px-4 py-3 bg-[#090a0e] border-t border-[#1e212c] font-mono text-xs flex items-center gap-2 overflow-x-auto select-none">
            <span className="text-[10px] text-zinc-500 uppercase flex-shrink-0 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#ffe600]" />
              <span>연계 에피소드:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-nowrap">
              {relatedStories.map((rel) => {
                const isCurrent = rel.id === story.id;
                return (
                  <button
                    key={rel.id}
                    onClick={() => {
                      if (!isCurrent) {
                        playTabSwitchSound();
                        onSelectStoryInModal?.(rel);
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors flex-shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-[#ffe600] text-black font-bold border-white'
                        : 'bg-[#13151e] border-[#222533] text-zinc-400 hover:text-white hover:bg-[#1a1c28]'
                    }`}
                  >
                    {rel.isOmnibus && <FilmReelIcon className={`w-3 h-3 ${isCurrent ? 'text-black' : 'text-[#ffe600]'}`} />}
                    <span>{rel.titleKo}</span>
                    {rel.status === 'locked' && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

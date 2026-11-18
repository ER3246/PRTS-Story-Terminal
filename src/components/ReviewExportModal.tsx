import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { StoryArchive } from '../types/story';
import { storyRegistry, STORY_LINES, getStoryArchive } from '../data/storyRegistry';
import { generateStoryMarkdown, generateStatusMasterMarkdown, downloadFile } from '../utils/exportMarkdown';
import { 
  X, 
  Download, 
  FileText, 
  Layers,
  FolderDown,
  Info
} from 'lucide-react';
import { playClickSound, playCloseSound } from '../utils/soundEffects';
import { PRTS_MODAL_BACKDROP, PRTS_MODAL_PANEL } from '../utils/motion';

interface ReviewExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStory?: StoryArchive | null;
}

export const ReviewExportModal: React.FC<ReviewExportModalProps> = ({
  isOpen,
  onClose,
  currentStory
}) => {
  const [selectedStoryId, setSelectedStoryId] = useState<string>(currentStory?.id || 'ep00');
  const [prevStoryId, setPrevStoryId] = useState<string | undefined>(currentStory?.id);

  if (currentStory && currentStory.id !== prevStoryId) {
    setPrevStoryId(currentStory.id);
    setSelectedStoryId(currentStory.id);
  }

  // ESC 키 닫기 핸들러
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

  const restoredStories = storyRegistry.filter((s) => s.status === 'restored');

  const handleDownloadMaster = () => {
    playClickSound();
    const md = generateStatusMasterMarkdown(storyRegistry, STORY_LINES);
    downloadFile('PRTS_Archive_Status_Master.md', md);
  };

  const handleDownloadSingleStory = (storyId: string) => {
    playClickSound();
    const archive = getStoryArchive(storyId);
    if (!archive) return;
    const md = generateStoryMarkdown(archive);
    const safeCode = archive.code.replace(/[\s/\\:]+/g, '_');
    const safeTitle = archive.titleKo.replace(/[\s/\\:]+/g, '_');
    downloadFile(`[PRTS]_${safeCode}_${safeTitle}.md`, md);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="review-export-backdrop"
          variants={PRTS_MODAL_BACKDROP}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          {/* 바깥 배경 클릭 시 닫기 */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              playCloseSound();
              onClose();
            }}
          />

          {/* 모달 컨테이너 */}
          <motion.div
            variants={PRTS_MODAL_PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xl bg-[#121316] border border-white/15 rounded-[2px] shadow-2xl overflow-hidden z-10 flex flex-col"
          >
        {/* Top Bar Accent */}
        <div className="h-[2px] w-full bg-zinc-200" />
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#16181d] border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#f5dd1b]" />
            <span className="font-bold text-white text-sm tracking-wide">
              문서 내보내기
            </span>
          </div>
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="p-1 hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 영역 */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* 다운로드 경로 안내 알림 */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#16181d] border border-white/[0.08] text-zinc-300 text-xs font-sans">
            <Info className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span>다운로드된 파일은 PC의 기본 <strong>'다운로드'</strong> 폴더에 자동 저장됩니다.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* 1. 선택 스토리 다운로드 */}
            <div className="p-4 bg-[#15161a] border border-white/[0.08] hover:border-white/25 rounded-[2px] transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span>스토리 요약본 (개별)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  선택한 스토리 하나의 요약 대본과 등장인물 정보를 다운로드합니다.
                </p>
                <div className="pt-1">
                  <select
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="w-full bg-[#0e0f12] border border-white/[0.12] rounded-[2px] text-zinc-100 text-xs p-2 outline-none font-mono focus:border-[#f5dd1b]"
                  >
                    {restoredStories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} : {s.titleKo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleDownloadSingleStory(selectedStoryId)}
                className="w-full py-2.5 px-3 rounded-[2px] bg-[#1c1e24] hover:bg-zinc-100 text-zinc-100 hover:text-black border border-white/[0.1] hover:border-white text-xs font-bold font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FolderDown className="w-4 h-4" />
                <span>개별 다운로드 (.md)</span>
              </button>
            </div>

            {/* 2. 전체 스토리 다운로드 */}
            <div className="p-4 bg-[#15161a] border border-white/[0.08] hover:border-white/25 rounded-[2px] transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <Layers className="w-4 h-4 text-zinc-400" />
                  <span>스토리 요약집 (전체)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  수록된 모든 스토리의 요약 대본과 등장인물 정보가 정리된 종합 마크다운 문서입니다.
                </p>
                <div className="p-2 bg-[#0e0f12] border border-white/[0.08] text-[11px] font-mono text-zinc-400 truncate">
                  PRTS_Archive_Status_Master.md
                </div>
              </div>

              <button
                onClick={handleDownloadMaster}
                className="w-full py-2.5 px-3 rounded-[2px] bg-zinc-100 hover:bg-[#f5dd1b] text-black font-bold font-mono text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>전체 다운로드 (.md)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 하단 바 */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#101114] flex items-center justify-end">
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-[2px] bg-[#181a20] hover:bg-[#22252d] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-mono transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

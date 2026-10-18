import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (currentStory) {
      setSelectedStoryId(currentStory.id);
    }
  }, [currentStory]);

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

  if (!isOpen) return null;

  const restoredStories = storyRegistry.filter((s) => s.status === 'restored');

  const handleDownloadMaster = () => {
    playClickSound();
    const md = generateStatusMasterMarkdown(storyRegistry, STORY_LINES);
    downloadFile('PRTS_Story_Archive_Status_Master.md', md);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* 바깥 배경 클릭 시 닫기 */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={() => {
          playCloseSound();
          onClose();
        }} 
      />

      {/* 모달 컨테이너 */}
      <div className="relative w-full max-w-xl bg-[#0f1118] border border-[#272e42] shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#141724] border-b border-[#23293c]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffe600]" />
            <span className="font-bold text-white text-sm tracking-wide">
              문서 내보내기
            </span>
          </div>
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="p-1 hover:bg-[#202738] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 영역 */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* 다운로드 경로 안내 알림 */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#141824] border border-[#22283a] text-zinc-300 text-xs font-sans">
            <Info className="w-4 h-4 text-[#ffe600] flex-shrink-0" />
            <span>다운로드된 파일은 PC의 기본 <strong>'다운로드'</strong> 폴더에 자동 저장됩니다.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* 1. 선택 스토리 다운로드 */}
            <div className="p-4 bg-[#121520] border border-[#232a3d] hover:border-[#ffe600] transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <FileText className="w-4 h-4 text-[#ffe600]" />
                  <span>선택 스토리 다운로드</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  선택한 개별 에피소드의 상세 서사 전문과 인물 명부, 전술 분석 보고서입니다.
                </p>
                <div className="pt-1">
                  <select
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="w-full bg-[#181c2b] border border-[#2e374f] text-zinc-100 text-xs p-2 outline-none font-mono focus:border-[#ffe600]"
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
                className="w-full py-2.5 px-3 bg-[#1e2436] hover:bg-[#ffe600] text-zinc-100 hover:text-black border border-[#303c58] hover:border-[#ffe600] text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <FolderDown className="w-4 h-4" />
                <span>개별 다운로드</span>
              </button>
            </div>

            {/* 2. 전체 스토리 다운로드 */}
            <div className="p-4 bg-[#121520] border border-[#232a3d] hover:border-[#ffe600] transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <Layers className="w-4 h-4 text-[#ffe600]" />
                  <span>전체 마스터 보고서</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  스토리 수록 상태, 서사 분류 및 연대기 타임라인을 총망라한 마스터 종합 보고서입니다.
                </p>
                <div className="p-2 bg-[#181c2b] border border-[#232a3d] text-[11px] font-mono text-zinc-400 truncate">
                  PRTS_Story_Archive_Status_Master.md
                </div>
              </div>

              <button
                onClick={handleDownloadMaster}
                className="w-full py-2.5 px-3 bg-[#ffe600] hover:bg-[#fff04d] text-black font-bold font-mono text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,230,0,0.2)]"
              >
                <Download className="w-4 h-4" />
                <span>마스터 다운로드</span>
              </button>
            </div>
          </div>
        </div>

        {/* 하단 바 */}
        <div className="px-5 py-3 border-t border-[#23293c] bg-[#0c0e15] flex items-center justify-end">
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#181c28] hover:bg-[#22283a] text-zinc-300 hover:text-white border border-[#2a344a] text-xs font-mono transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

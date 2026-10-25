import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Crop,
  Users,
  BookOpen,
  ArrowLeft,
  HardDrive,
  Globe,
  Download,
  CheckCircle2,
  AlertCircle,
  GitCommit,
  Upload,
} from 'lucide-react';
import { characterCgAssets as initialCgAssets } from '../../data/db/characterCgAssets';
import { characterMasterDb as initialMasterDb } from '../../data/db/characterMasterDb';
import {
  sceneVisualAssets as initialSceneVisuals,
  type SceneVisualAssetItem,
} from '../../data/db/sceneVisualAssets';
import { loadedStories } from '../../data/storyRegistry';
import type { CharacterCgAsset, CharacterMasterRecord } from '../../types/characterDb';
import type { StoryArchive } from '../../types/story';
import {
  serializeCgAssetsToTs,
  serializeMasterDbToTs,
  serializeStoryArchiveToTs,
} from '../../utils/storySerializer';
import { CgCropStudioTab } from './CgCropStudioTab';
import { CharacterMasterTab } from './CharacterMasterTab';
import { StoryContentEditorTab } from './StoryContentEditorTab';

export type StudioTabMode = 'crop' | 'master' | 'story';

interface EditorStudioViewProps {
  initialStoryId?: string;
  onExitToViewer: (storyId?: string) => void;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const EditorStudioView: React.FC<EditorStudioViewProps> = ({
  initialStoryId = 'ep12',
  onExitToViewer,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTabMode>('story');
  const [cgAssets, setCgAssets] = useState<CharacterCgAsset[]>(() => [...initialCgAssets]);
  const [masterRecords, setMasterRecords] = useState<CharacterMasterRecord[]>(() => [
    ...initialMasterDb,
  ]);
  const [storiesMap, setStoriesMap] = useState<Record<string, StoryArchive>>(() => ({
    ...loadedStories,
  }));
  const [sceneVisuals, setSceneVisuals] = useState<SceneVisualAssetItem[]>(() => [
    ...initialSceneVisuals,
  ]);

  const [selectedAssetId, setSelectedAssetId] = useState<string>('cg_amiya');
  const [selectedCharId, setSelectedCharId] = useState<string>('amiya');
  const [activeStoryId, setActiveStoryId] = useState<string>(
    loadedStories[initialStoryId] ? initialStoryId : 'ep12'
  );

  const [isLocalFsConnected, setIsLocalFsConnected] = useState<boolean>(false);
  const [availableDiskFiles, setAvailableDiskFiles] = useState<{
    avatars: string[];
    illusts: string[];
    libraryAvatars?: string[];
    libraryOperators?: string[];
    libraryNpcs?: string[];
    libraryNamed?: string[];
  }>({
    avatars: [],
    illusts: [],
    libraryAvatars: [],
    libraryOperators: [],
    libraryNpcs: [],
    libraryNamed: [],
  });

  // Check local Vite dev server FS API on mount
  useEffect(() => {
    let mounted = true;
    fetch('/__prts_admin_api/list-assets')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data || !data.ok) return;
        setIsLocalFsConnected(true);
        setAvailableDiskFiles({
          avatars: data.avatars || [],
          illusts: data.illusts || [],
          libraryAvatars: data.libraryAvatars || [],
          libraryOperators: data.libraryOperators || [],
          libraryNpcs: data.libraryNpcs || [],
          libraryNamed: data.libraryNamed || [],
        });

        // Merge any newly dropped scene CGs or backgrounds on disk into sceneVisuals
        const dynamicVisuals: SceneVisualAssetItem[] = [
          ...(data.cgs || []).map((f: string) => ({
            fileName: f,
            url: `/images/cgs/${f}`,
            type: 'cg' as const,
          })),
          ...(data.backgrounds || []).map((f: string) => ({
            fileName: f,
            url: `/images/backgrounds/${f}`,
            type: 'bg' as const,
          })),
          ...(data.banners || []).map((f: string) => ({
            fileName: f,
            url: `/images/banners/${f}`,
            type: 'banner' as const,
          })),
        ];
        if (dynamicVisuals.length > 0) {
          setSceneVisuals(dynamicVisuals);
        }
      })
      .catch(() => {
        if (mounted) setIsLocalFsConnected(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const [globalToast, setGlobalToast] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setGlobalToast({ type, message });
    setTimeout(() => {
      setGlobalToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Git Commit Status & Action State
  const [gitStatus, setGitStatus] = useState<{
    clean: boolean;
    changedCount: number;
    branch: string;
    commit: string;
    unpushedCount?: number;
    files: string[];
  } | null>(null);

  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [autoPushToGithub, setAutoPushToGithub] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const refreshGitStatus = useCallback(() => {
    fetch('/__prts_admin_api/git-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.ok) {
          setGitStatus({
            clean: data.clean,
            changedCount: data.changedCount,
            branch: data.branch,
            commit: data.commit,
            unpushedCount: data.unpushedCount || 0,
            files: data.files || [],
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isLocalFsConnected) {
      refreshGitStatus();
    }
  }, [isLocalFsConnected, refreshGitStatus]);

  const handleExecuteGitCommit = useCallback(async () => {
    setIsCommitting(true);
    try {
      const res = await fetch('/__prts_admin_api/git-commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage, push: autoPushToGithub }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Git 커밋 실패');

      if (data.noChanges) {
        showToast('success', `ℹ️ ${data.message}`);
      } else if (data.pushed) {
        showToast('success', `🚀 Git 커밋 & GitHub 푸시 성공! [${data.commitHash}] ${data.message}`);
      } else if (data.pushError) {
        showToast('warning', `⚠️ 커밋 성공 [${data.commitHash}], 그러나 GitHub 푸시 실패: ${data.pushError}`);
      } else {
        showToast('success', `✅ Git 로컬 커밋 완료! [${data.commitHash}] ${data.message}`);
      }
      setIsCommitModalOpen(false);
      setCommitMessage('');
      refreshGitStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `❌ Git 커밋 오류: ${msg}`);
      window.alert(`[Git 커밋 실패] ${msg}`);
    } finally {
      setIsCommitting(false);
    }
  }, [commitMessage, autoPushToGithub, refreshGitStatus, showToast]);

  const handleExecuteGitPush = useCallback(async () => {
    setIsPushing(true);
    try {
      const res = await fetch('/__prts_admin_api/git-push', { method: 'POST' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Git 푸시 실패');
      showToast('success', '🚀 GitHub 원격 저장소에 성공적으로 푸시되었습니다!');
      refreshGitStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `❌ GitHub 푸시 오류: ${msg}`);
      window.alert(`[GitHub 푸시 실패] ${msg}`);
    } finally {
      setIsPushing(false);
    }
  }, [refreshGitStatus, showToast]);

  // Save CG Assets DB
  const handleSaveAssetsDb = useCallback(
    async (assetsToSave?: CharacterCgAsset[]) => {
      const target = assetsToSave || cgAssets;
      const tsCode = serializeCgAssetsToTs(target);
      if (isLocalFsConnected) {
        const res = await fetch('/__prts_admin_api/save-cg-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tsCode }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'CG 자산 DB 저장 실패');
        showToast('success', '✅ CG 자산 DB (src/data/db/characterCgAssets.ts) 로컬 디스크 저장 완료!');
        refreshGitStatus();
      } else {
        downloadTextFile('characterCgAssets.ts', tsCode);
        showToast('success', '📥 characterCgAssets.ts 파일이 다운로드되었습니다.');
      }
    },
    [cgAssets, isLocalFsConnected, refreshGitStatus, showToast]
  );

  // Save Master Character DB
  const handleSaveMasterDb = useCallback(
    async (recordsToSave?: CharacterMasterRecord[]) => {
      const target = recordsToSave || masterRecords;
      const tsCode = serializeMasterDbToTs(target);
      if (isLocalFsConnected) {
        const res = await fetch('/__prts_admin_api/save-master-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tsCode }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || '마스터 DB 저장 실패');
        showToast('success', '✅ 캐릭터 마스터 DB (src/data/db/characterMasterDb.ts) 로컬 디스크 저장 완료!');
        refreshGitStatus();
      } else {
        downloadTextFile('characterMasterDb.ts', tsCode);
        showToast('success', '📥 characterMasterDb.ts 파일이 다운로드되었습니다.');
      }
    },
    [masterRecords, isLocalFsConnected, refreshGitStatus, showToast]
  );

  // Update a story in memory and sync to loadedStories
  const handleUpdateStory = useCallback((updated: StoryArchive) => {
    loadedStories[updated.id] = updated;
    setStoriesMap((prev) => ({
      ...prev,
      [updated.id]: updated,
    }));
  }, []);

  // Save a story to src/data/stories/{id}.ts
  const handleSaveStoryToDisk = useCallback(
    async (storyToSave: StoryArchive) => {
      loadedStories[storyToSave.id] = storyToSave;
      const tsCode = serializeStoryArchiveToTs(storyToSave);
      if (isLocalFsConnected) {
        const res = await fetch('/__prts_admin_api/save-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId: storyToSave.id, tsCode }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || '스토리 파일 저장 실패');
        showToast('success', `✅ 스토리 파일 (src/data/stories/${storyToSave.id}.ts) 로컬 디스크 저장 완료!`);
        refreshGitStatus();
      } else {
        downloadTextFile(`${storyToSave.id}.ts`, tsCode);
        showToast('success', `📥 ${storyToSave.id}.ts 파일이 다운로드되었습니다.`);
      }
    },
    [isLocalFsConnected, refreshGitStatus, showToast]
  );

  const handleDownloadStoryTs = useCallback((storyToSave: StoryArchive) => {
    const tsCode = serializeStoryArchiveToTs(storyToSave);
    downloadTextFile(`${storyToSave.id}.ts`, tsCode);
  }, []);

  const handleJumpToCropper = useCallback(
    (assetId: string) => {
      if (cgAssets.some((a) => a.assetId === assetId)) {
        setSelectedAssetId(assetId);
      }
      setActiveTab('crop');
    },
    [cgAssets]
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#080a0f] text-zinc-100 font-sans select-none relative">
      {/* Global Top Floating Toast Notification */}
      {globalToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-xs font-bold transition-all border animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none ${
            globalToast.type === 'success'
              ? 'bg-[#0b1b16] border-emerald-500/60 text-emerald-300 shadow-emerald-950/50'
              : globalToast.type === 'warning'
              ? 'bg-[#251b08] border-amber-500/60 text-amber-300 shadow-amber-950/50'
              : 'bg-[#210c0e] border-red-500/60 text-red-300 shadow-red-950/50'
          }`}
        >
          {globalToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : globalToast.type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{globalToast.message}</span>
        </div>
      )}

      {/* Studio Top Header */}
      <header className="h-13 px-4 bg-[#0d1018] border-b border-white/15 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#ffe600] text-black font-mono text-xs font-extrabold">
            <Wrench className="w-3.5 h-3.5" />
            <span>PRTS STUDIO // AUTHORING TOOL</span>
          </div>

          {/* 3 Main Studio Mode Tabs */}
          <nav className="flex items-center gap-1 bg-[#07090e] p-1 rounded border border-white/10">
            <button
              onClick={() => setActiveTab('story')}
              className={`h-8 px-3.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'story'
                  ? 'bg-[#ffe600] text-black'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. 스토리 본문 · 장면 CG 편집</span>
            </button>

            <button
              onClick={() => setActiveTab('master')}
              className={`h-8 px-3.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'master'
                  ? 'bg-[#ffe600] text-black'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. 통합 캐릭터 마스터 DB ({masterRecords.length}명)</span>
            </button>

            <button
              onClick={() => setActiveTab('crop')}
              className={`h-8 px-3.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'crop'
                  ? 'bg-[#ffe600] text-black'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>3. 캐릭터 CG 크롭 & 에셋 DB ({cgAssets.length}종)</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Connection Status Badge */}
          {isLocalFsConnected ? (
            <span
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold"
              title="로컬 개발 서버와 연결되어 있어 [저장] 클릭 시 프로젝트 소스 파일(.ts / .png)에 즉시 기록됩니다."
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>LOCAL DISK 직결 모드</span>
            </span>
          ) : (
            <span
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold"
              title="정적 호스팅 모드에서는 [저장] 클릭 시 수정된 .ts 또는 .png 파일이 브라우저로 다운로드됩니다."
            >
              <Globe className="w-3.5 h-3.5" />
              <span>파일 다운로드 모드</span>
            </span>
          )}

          <button
            onClick={() => {
              const mdLines: string[] = [
                '# [PRTS] 통합 캐릭터 마스터 DB 요약 추출본',
                '',
                `총 등록 캐릭터: ${masterRecords.length}명 / CG 자산: ${cgAssets.length}종`,
                '',
                '| ID | 한글명 | 영문명 | 기본 소속 | 대표 직책 | 상태 분기 |',
                '| :--- | :--- | :--- | :--- | :--- | :--- |',
              ];
              for (const r of masterRecords) {
                const stDesc = r.states
                  .map((s) => `${s.stateId}(${s.label} -> ${s.cgAssetId})`)
                  .join(', ');
                mdLines.push(
                  `| \`${r.charId}\` | **${r.nameKo}** | ${r.nameEn} | ${r.defaultFaction} | ${r.defaultRole} | ${stDesc} |`
                );
              }
              downloadTextFile('[PRTS]_통합_캐릭터_마스터_DB_검수용.md', mdLines.join('\n'));
            }}
            className="h-8 px-3 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="캐릭터 마스터 DB 마크다운 추출"
          >
            <Download className="w-3.5 h-3.5 text-[#ffe600]" />
            <span className="hidden md:inline">캐릭터 DB(.md) 추출</span>
          </button>

          {/* Git Commit Button (Local Disk Mode) */}
          {isLocalFsConnected && (
            <>
              <button
                onClick={() => {
                  refreshGitStatus();
                  setIsCommitModalOpen(true);
                }}
                disabled={isCommitting}
                className={`h-8 px-3 rounded border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  gitStatus?.clean === false
                    ? 'bg-[#00d8ff]/20 hover:bg-[#00d8ff] text-[#00d8ff] hover:text-black border-[#00d8ff]/40 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/15'
                }`}
                title="로컬 수정 사항을 Git 커밋으로 보존합니다."
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>Git 커밋</span>
                {gitStatus?.clean === false && (
                  <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse" />
                )}
              </button>

              {/* GitHub Push Button if unpushed commits exist */}
              {gitStatus && (gitStatus.unpushedCount ?? 0) > 0 && (
                <button
                  onClick={handleExecuteGitPush}
                  disabled={isPushing}
                  className="h-8 px-3 rounded border border-[#ffe600]/50 bg-[#ffe600] text-black hover:bg-[#ffe600]/90 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md animate-pulse disabled:opacity-50"
                  title={`${gitStatus.unpushedCount}개의 로컬 커밋이 아직 GitHub에 푸시되지 않았습니다. 클릭 시 즉시 GitHub에 업로드합니다.`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isPushing ? '푸시 중...' : `GitHub 푸시 (${gitStatus.unpushedCount})`}</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => onExitToViewer(activeStoryId)}
            className="h-8 px-3.5 rounded bg-white/10 hover:bg-[#00d8ff] text-white hover:text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>공개 뷰어로 돌아가기</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      {activeTab === 'crop' && (
        <CgCropStudioTab
          assets={cgAssets}
          onChangeAssets={setCgAssets}
          selectedAssetId={selectedAssetId}
          onSelectAssetId={setSelectedAssetId}
          isLocalFsConnected={isLocalFsConnected}
          onSaveAssetsDb={handleSaveAssetsDb}
          availableDiskFiles={availableDiskFiles}
        />
      )}

      {activeTab === 'master' && (
        <CharacterMasterTab
          records={masterRecords}
          onChangeRecords={setMasterRecords}
          cgAssets={cgAssets}
          selectedCharId={selectedCharId}
          onSelectCharId={setSelectedCharId}
          onSaveMasterDb={handleSaveMasterDb}
          onJumpToCropper={handleJumpToCropper}
        />
      )}

      {activeTab === 'story' && (
        <StoryContentEditorTab
          storiesMap={storiesMap}
          activeStoryId={activeStoryId}
          onSelectStoryId={setActiveStoryId}
          onUpdateStory={handleUpdateStory}
          onSaveStoryToDisk={handleSaveStoryToDisk}
          onDownloadStoryTs={handleDownloadStoryTs}
          onPreviewInViewer={(sid) => onExitToViewer(sid)}
          masterCharacters={masterRecords}
          cgAssets={cgAssets}
          sceneVisuals={sceneVisuals}
          onJumpToCropper={handleJumpToCropper}
        />
      )}

      {/* Git Commit Modal */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101420] border border-white/20 rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-[#00d8ff]" />
                <h3 className="text-sm font-bold text-white">Git 변경사항 커밋 생성</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCommitModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded font-mono text-[11px] text-zinc-300 border border-white/5">
                <span>
                  브랜치: <strong className="text-[#00d8ff]">{gitStatus?.branch || 'main'}</strong>
                </span>
                <span>
                  현재 HEAD: <strong className="text-[#ffe600]">{gitStatus?.commit || '-'}</strong>
                </span>
                <span>
                  변경 파일: <strong className="text-white">{gitStatus?.changedCount ?? 0}개</strong>
                </span>
              </div>

              {gitStatus && gitStatus.files.length > 0 ? (
                <div>
                  <div className="text-[11px] font-bold text-zinc-300 mb-1">커밋 대상 파일 목록:</div>
                  <div className="max-h-32 overflow-y-auto bg-[#07090e] border border-white/10 rounded p-2 text-[10px] font-mono text-zinc-400 space-y-0.5">
                    {gitStatus.files.map((f, i) => (
                      <div key={i} className="truncate hover:text-zinc-200">
                        {f}
                      </div>
                    ))}
                    {gitStatus.changedCount > gitStatus.files.length && (
                      <div className="text-zinc-500 italic">
                        ...외 {gitStatus.changedCount - gitStatus.files.length}개 파일
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  ✅ 현재 커밋되지 않은 변경 사항이 없습니다 (작업 트리가 깨끗함).
                </div>
              )}

              <div>
                <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                  커밋 메시지 (비워둘 시 자동 생성)
                </label>
                <textarea
                  rows={3}
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="예: feat(character): 아스트젠 CG 교체 및 1:1 아바타 직접 삽입 완료"
                  className="w-full p-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00d8ff]"
                />
              </div>

              {/* Auto push to GitHub checkbox */}
              <label className="flex items-start gap-2.5 p-2.5 rounded bg-black/40 border border-white/10 cursor-pointer hover:bg-black/60 transition-colors">
                <input
                  type="checkbox"
                  checked={autoPushToGithub}
                  onChange={(e) => setAutoPushToGithub(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 text-[#00d8ff] focus:ring-[#00d8ff] w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>커밋 완료 후 GitHub 원격 저장소에 즉시 푸시 (Push)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00d8ff]/20 text-[#00d8ff] font-semibold">기본 활성</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    체크 시 커밋과 동시에 GitHub(origin/main)으로 즉시 전송되어 원격 저장소에 반영됩니다.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCommitModalOpen(false)}
                disabled={isCommitting}
                className="px-3.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleExecuteGitCommit}
                disabled={isCommitting}
                className="px-4 py-1.5 rounded bg-[#00d8ff] hover:bg-[#00d8ff]/90 text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <span className="inline-block animate-spin text-xs">⏳</span>
                    <span>커밋 생성 중...</span>
                  </>
                ) : (
                  <>
                    <GitCommit className="w-4 h-4" />
                    <span>지금 Git 커밋 실행</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

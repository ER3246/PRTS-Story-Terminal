import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Save,
  Layers,
  Image as ImageIcon,
  Scissors,
  Ban,
  CheckCircle2,
  Users,
  Copy,
} from 'lucide-react';
import type {
  CharacterMasterRecord,
  CharacterState,
  CharacterCgAsset,
} from '../../types/characterDb';
import { CharacterCgPickerModal } from './CgAssetPickerModal';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { TacticalAvatar } from '../TacticalAvatar';

interface CharacterMasterTabProps {
  records: CharacterMasterRecord[];
  onChangeRecords: (next: CharacterMasterRecord[]) => void;
  cgAssets: CharacterCgAsset[];
  selectedCharId: string;
  onSelectCharId: (id: string) => void;
  onSaveMasterDb: (recordsToSave?: CharacterMasterRecord[]) => Promise<void>;
  onJumpToCropper: (assetId: string) => void;
}

type SpecialFilter = 'all' | 'multi_state' | 'shared_cg' | 'silhouette' | CharacterMasterRecord['tier'];

export const CharacterMasterTab: React.FC<CharacterMasterTabProps> = ({
  records,
  onChangeRecords,
  cgAssets,
  selectedCharId,
  onSelectCharId,
  onSaveMasterDb,
  onJumpToCropper,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SpecialFilter>('all');
  const [pickerStateIndex, setPickerStateIndex] = useState<number | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const cgMap = useMemo(() => {
    const m: Record<string, CharacterCgAsset> = {};
    for (const a of cgAssets) m[a.assetId] = a;
    return m;
  }, [cgAssets]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (filter === 'multi_state' && r.states.length <= 1) return false;
      if (filter === 'shared_cg' && !r.states.some((s) => s.isSharedCg)) return false;
      if (
        filter === 'silhouette' &&
        !r.states.some((s) => s.isSilhouetteOnly || s.cgAssetId === 'cg_none')
      ) {
        return false;
      }
      if (
        ['protagonist', 'major', 'supporting', 'npc_named', 'npc_generic'].includes(filter) &&
        r.tier !== filter
      ) {
        return false;
      }

      if (!q) return true;
      return (
        r.charId.toLowerCase().includes(q) ||
        r.nameKo.toLowerCase().includes(q) ||
        r.nameEn.toLowerCase().includes(q) ||
        r.defaultFaction.toLowerCase().includes(q) ||
        r.defaultRole.toLowerCase().includes(q) ||
        (r.aliases && r.aliases.some((al) => al.toLowerCase().includes(q)))
      );
    });
  }, [records, search, filter]);

  const activeChar = useMemo(
    () => records.find((r) => r.charId === selectedCharId) || records[0],
    [records, selectedCharId]
  );

  const updateActiveChar = (updater: (prev: CharacterMasterRecord) => CharacterMasterRecord) => {
    if (!activeChar) return;
    const next = records.map((r) => (r.charId === activeChar.charId ? updater(r) : r));
    onChangeRecords(next);
  };

  const handleAddNewCharacter = () => {
    const rawId = window.prompt('신규 캐릭터 고유 ID (영문 소문자/언더스코어, 예: london_guard):');
    if (!rawId) return;
    const charId = rawId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    if (!charId) return;
    if (records.some((r) => r.charId === charId)) {
      window.alert('이미 등록된 캐릭터 ID입니다.');
      onSelectCharId(charId);
      return;
    }

    const matchedAsset = cgMap[`cg_${charId}`];
    const newChar: CharacterMasterRecord = {
      charId,
      nameKo: `신규 인물 (${charId})`,
      nameEn: charId,
      defaultFaction: '무소속',
      defaultRole: '작전 관계자',
      baseBio: '인물 배경 설명을 입력하세요.',
      tier: 'npc_named',
      defaultStateId: 'default',
      states: [
        {
          stateId: 'default',
          label: '기본 상태',
          cgAssetId: matchedAsset ? matchedAsset.assetId : 'cg_none',
          overrideRole: '작전 관계자',
          description: '인물 배경 설명을 입력하세요.',
          appearances: [],
          isSilhouetteOnly: !matchedAsset,
        },
      ],
    };

    const next = [newChar, ...records];
    onChangeRecords(next);
    onSelectCharId(charId);
  };

  const handleDeleteCharacter = () => {
    if (!activeChar) return;
    if (!window.confirm(`정말로 '${activeChar.nameKo}' (${activeChar.charId}) 캐릭터를 마스터 DB에서 삭제하시겠습니까?`)) {
      return;
    }
    const next = records.filter((r) => r.charId !== activeChar.charId);
    onChangeRecords(next);
    if (next.length > 0) onSelectCharId(next[0].charId);
  };

  const handleAddState = () => {
    if (!activeChar) return;
    const rawStateId = window.prompt(
      '추가할 상태(State) ID를 입력하세요 (예: state_2, child, awakened, disguise):',
      `state_${activeChar.states.length + 1}`
    );
    if (!rawStateId) return;
    const stateId = rawStateId.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (activeChar.states.some((s) => s.stateId === stateId)) {
      window.alert('이미 존재하는 상태 ID입니다.');
      return;
    }
    const baseState = activeChar.states[0];
    const newState: CharacterState = {
      stateId,
      label: `상태 ${activeChar.states.length + 1} (${stateId})`,
      cgAssetId: baseState?.cgAssetId || 'cg_none',
      overrideNameKo: activeChar.nameKo,
      overrideFaction: activeChar.defaultFaction,
      overrideRole: activeChar.defaultRole,
      description: activeChar.baseBio,
      appearances: [],
    };
    updateActiveChar((prev) => ({
      ...prev,
      states: [...prev.states, newState],
    }));
  };

  const handleDuplicateState = (idx: number) => {
    if (!activeChar) return;
    const src = activeChar.states[idx];
    const newId = `${src.stateId}_copy`;
    const copyState: CharacterState = {
      ...src,
      stateId: newId,
      label: `${src.label} (복사본)`,
      appearances: [...src.appearances],
    };
    updateActiveChar((prev) => ({
      ...prev,
      states: [...prev.states, copyState],
    }));
  };

  const handleRemoveState = (idx: number) => {
    if (!activeChar) return;
    if (activeChar.states.length <= 1) {
      window.alert('최소 1개의 기본 상태는 유지되어야 합니다.');
      return;
    }
    const target = activeChar.states[idx];
    if (!window.confirm(`'${target.label}' (${target.stateId}) 상태를 삭제하시겠습니까?`)) return;
    updateActiveChar((prev) => {
      const nextStates = prev.states.filter((_, i) => i !== idx);
      return {
        ...prev,
        defaultStateId:
          prev.defaultStateId === target.stateId ? nextStates[0].stateId : prev.defaultStateId,
        states: nextStates,
      };
    });
  };

  const updateStateAt = (idx: number, patch: Partial<CharacterState>) => {
    updateActiveChar((prev) => ({
      ...prev,
      states: prev.states.map((st, i) => (i === idx ? { ...st, ...patch } : st)),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveNotice(null);
    try {
      await onSaveMasterDb(records);
      setSaveNotice('✅ 통합 캐릭터 마스터 DB(characterMasterDb.ts)가 디스크에 저장되었습니다.');
      setTimeout(() => setSaveNotice(null), 4500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveNotice(`❌ 마스터 DB 저장 실패: ${msg}`);
      window.alert(`[마스터 DB 저장 실패] ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden bg-[#0a0c12]">
      {/* Left Sidebar: Character List */}
      <div className="w-full lg:w-80 border-r border-white/10 bg-[#0d1018] flex flex-col min-h-0">
        <div className="p-3 border-b border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#ffe600]" />
              마스터 캐릭터 ({filteredRecords.length} / {records.length}명)
            </span>
            <button
              onClick={handleAddNewCharacter}
              className="h-7 px-2.5 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              신규 캐릭터
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 영문명, ID, 소속 검색..."
              className="w-full h-8 pl-8 pr-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffe600]"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {(
              [
                ['all', '전체'],
                ['multi_state', '다중상태'],
                ['shared_cg', '임시공유CG'],
                ['silhouette', '실루엣'],
                ['protagonist', '주역'],
                ['major', '주요'],
                ['supporting', '조연'],
                ['npc_generic', '공용NPC'],
              ] as const
            ).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-[10.5px] font-medium cursor-pointer ${
                  filter === f
                    ? 'bg-[#ffe600] text-black font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06]">
          {filteredRecords.map((r) => {
            const active = r.charId === activeChar?.charId;
            const defState =
              r.states.find((s) => s.stateId === r.defaultStateId) || r.states[0];
            const asset = defState ? cgMap[defState.cgAssetId] : undefined;
            const avatarUrl = asset?.avatarUrl ? resolveAssetUrl(asset.avatarUrl) : '';

            return (
              <button
                key={r.charId}
                onClick={() => onSelectCharId(r.charId)}
                className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                  active ? 'bg-[#ffe600]/15 border-l-2 border-[#ffe600]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <TacticalAvatar
                  src={avatarUrl}
                  alt={r.nameKo}
                  className="w-10 h-10 rounded shrink-0"
                  cropOverride={asset?.cropConfig}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-100 truncate">{r.nameKo}</span>
                    <span className="text-[10px] font-mono text-zinc-500">({r.charId})</span>
                  </div>
                  <div className="text-[10.5px] text-zinc-400 truncate">
                    {r.defaultFaction} · {r.defaultRole}
                  </div>
                </div>
                {r.states.length > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-[#ffe600]/20 text-[#ffe600] text-[9.5px] font-mono font-bold shrink-0">
                    {r.states.length}상태
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Detail Panel */}
      {activeChar && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111520] border border-white/10 rounded-lg p-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{activeChar.nameKo}</h2>
                <span className="text-xs font-mono text-zinc-400">({activeChar.nameEn})</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono text-[#ffe600]">
                  ID: {activeChar.charId}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                기본 소속: {activeChar.defaultFaction} | 상태 분기: {activeChar.states.length}개
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteCharacter}
                className="h-9 px-3 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>캐릭터 삭제</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="h-9 px-4 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 disabled:opacity-50 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block animate-spin text-sm">⏳</span>
                    <span>마스터 DB 저장 중...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>마스터 DB 저장 (characterMasterDb.ts)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {saveNotice && (
            <div className="p-3 rounded bg-[#00d8ff]/15 border border-[#00d8ff]/40 text-xs text-[#00d8ff] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveNotice}</span>
            </div>
          )}

          {/* Base Profile Form */}
          <div className="bg-[#10141f] border border-white/10 rounded-lg p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#ffe600] uppercase tracking-wider">
              1. 캐릭터 기본 마스터 정보 (Base Master Profile)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">고유 ID (charId)</label>
                <input
                  type="text"
                  value={activeChar.charId}
                  readOnly
                  className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/10 text-xs font-mono text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">대표 한글 명칭 (nameKo)</label>
                <input
                  type="text"
                  value={activeChar.nameKo}
                  onChange={(e) =>
                    updateActiveChar((prev) => ({ ...prev, nameKo: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">영문 명칭 (nameEn)</label>
                <input
                  type="text"
                  value={activeChar.nameEn}
                  onChange={(e) =>
                    updateActiveChar((prev) => ({ ...prev, nameEn: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">비중 등급 (tier)</label>
                <select
                  value={activeChar.tier}
                  onChange={(e) =>
                    updateActiveChar((prev) => ({
                      ...prev,
                      tier: e.target.value as CharacterMasterRecord['tier'],
                    }))
                  }
                  className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
                >
                  <option value="protagonist">protagonist (핵심 주역)</option>
                  <option value="major">major (주요 조연/보스)</option>
                  <option value="supporting">supporting (일반 조연)</option>
                  <option value="npc_named">npc_named (네임드 NPC)</option>
                  <option value="npc_generic">npc_generic (공용/일반 NPC)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-zinc-400 mb-1">
                  기본 소속 진영 (defaultFaction)
                </label>
                <input
                  type="text"
                  value={activeChar.defaultFaction}
                  onChange={(e) =>
                    updateActiveChar((prev) => ({ ...prev, defaultFaction: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-zinc-400 mb-1">
                  기본 직책/역할 (defaultRole - 35자 이내 권장)
                </label>
                <input
                  type="text"
                  value={activeChar.defaultRole}
                  onChange={(e) =>
                    updateActiveChar((prev) => ({ ...prev, defaultRole: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                인물 종합 배경 설명 (baseBio)
              </label>
              <textarea
                rows={3}
                value={activeChar.baseBio}
                onChange={(e) =>
                  updateActiveChar((prev) => ({ ...prev, baseBio: e.target.value }))
                }
                className="w-full p-3 rounded bg-[#07090e] border border-white/15 text-xs text-zinc-100 leading-relaxed focus:border-[#ffe600] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  별칭/호환 ID 목록 (쉼표 구분, 예: leto, anthony)
                </label>
                <input
                  type="text"
                  value={(activeChar.aliases || []).join(', ')}
                  onChange={(e) => {
                    const list = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    updateActiveChar((prev) => ({
                      ...prev,
                      aliases: list.length > 0 ? list : undefined,
                    }));
                  }}
                  placeholder="호환 ID가 있는 경우 입력"
                  className="w-full h-8 px-3 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-white focus:border-[#ffe600] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">관리자 메모 (notes)</label>
                <input
                  type="text"
                  value={activeChar.notes || ''}
                  onChange={(e) =>
                    updateActiveChar((prev) => ({
                      ...prev,
                      notes: e.target.value || undefined,
                    }))
                  }
                  placeholder="CG 교체 예정 등 메모"
                  className="w-full h-8 px-3 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* States Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00d8ff]" />
                <h3 className="text-sm font-bold text-white">
                  2. 시점·전개별 상태 분기 설정 (States: 총 {activeChar.states.length}개)
                </h3>
              </div>
              <button
                onClick={handleAddState}
                className="h-8 px-3 rounded bg-[#00d8ff] hover:bg-[#00d8ff]/90 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 상태(State) 추가 (어린 시절, 부활 후, 복장 변경 등)</span>
              </button>
            </div>

            <div className="space-y-4">
              {activeChar.states.map((st, idx) => {
                const cgAsset = cgMap[st.cgAssetId];
                const resolvedAvatar = cgAsset?.avatarUrl
                  ? resolveAssetUrl(cgAsset.avatarUrl)
                  : '';
                const resolvedIllust = cgAsset?.illustUrl
                  ? resolveAssetUrl(cgAsset.illustUrl)
                  : '';
                const isDefault = activeChar.defaultStateId === st.stateId;

                return (
                  <div
                    key={`${st.stateId}_${idx}`}
                    className="bg-[#10141f] border border-white/15 rounded-lg p-5 space-y-4"
                  >
                    {/* State Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#00d8ff]/20 text-[#00d8ff] font-mono text-xs font-bold">
                          상태 #{idx + 1} · {st.stateId}
                        </span>
                        <span className="text-sm font-bold text-white">{st.label}</span>
                        {isDefault ? (
                          <span className="px-2 py-0.5 rounded bg-[#ffe600] text-black text-[10px] font-bold">
                            기본 상태 (Default)
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              updateActiveChar((prev) => ({
                                ...prev,
                                defaultStateId: st.stateId,
                              }))
                            }
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white text-[10px] cursor-pointer"
                          >
                            기본 상태로 지정
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDuplicateState(idx)}
                          className="h-7 px-2.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> 상태 복제
                        </button>
                        {activeChar.states.length > 1 && (
                          <button
                            onClick={() => handleRemoveState(idx)}
                            className="h-7 px-2.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> 삭제
                          </button>
                        )}
                      </div>
                    </div>

                    {/* State Content Grid: CG Box + State Form */}
                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Left: Connected CG Visual Box */}
                      <div className="w-full md:w-64 shrink-0 bg-[#080a10] border border-white/10 rounded-md p-3.5 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 w-full justify-center">
                          <div className="flex flex-col items-center">
                            <TacticalAvatar
                              src={resolvedAvatar}
                              alt={st.label}
                              className="w-20 h-20 rounded border border-white/20"
                              cropOverride={cgAsset?.cropConfig}
                            />
                            <span className="text-[10px] font-mono text-zinc-400 mt-1">
                              1:1 아바타
                            </span>
                          </div>

                          {resolvedIllust && (
                            <div className="flex flex-col items-center">
                              <div className="w-20 h-20 rounded border border-white/15 bg-[#05070b] overflow-hidden flex items-center justify-center p-1">
                                <img
                                  src={resolvedIllust}
                                  alt="illust"
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <span className="text-[10px] font-mono text-[#00d8ff] mt-1">
                                전신 스탠딩
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-center w-full">
                          <div className="text-xs font-bold text-zinc-200 truncate">
                            {cgAsset ? cgAsset.label : '전술 실루엣 (CG 없음)'}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 truncate">
                            {st.cgAssetId} · {cgAsset?.avatarFileName || 'none'}
                          </div>
                        </div>

                        <div className="w-full space-y-1.5">
                          <button
                            onClick={() => setPickerStateIndex(idx)}
                            className="w-full py-1.5 px-2.5 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>CG 목록에서 파일 선택</span>
                          </button>

                          {st.cgAssetId && st.cgAssetId !== 'cg_none' && (
                            <button
                              onClick={() => onJumpToCropper(st.cgAssetId)}
                              className="w-full py-1.5 px-2.5 rounded bg-white/10 hover:bg-white/15 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Scissors className="w-3.5 h-3.5 text-[#00d8ff]" />
                              <span>이 CG 크롭 영역 조정</span>
                            </button>
                          )}

                          <button
                            onClick={() =>
                              updateStateAt(idx, {
                                cgAssetId: 'cg_none',
                                isSilhouetteOnly: true,
                              })
                            }
                            className="w-full py-1 px-2.5 rounded bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3 h-3" />
                            <span>전용 CG 없음 (실루엣)</span>
                          </button>
                        </div>
                      </div>

                      {/* Right: State Details Form */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              상태 ID (stateId)
                            </label>
                            <input
                              type="text"
                              value={st.stateId}
                              onChange={(e) =>
                                updateStateAt(idx, { stateId: e.target.value.trim() })
                              }
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-white focus:border-[#00d8ff] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              상태 명칭 (label)
                            </label>
                            <input
                              type="text"
                              value={st.label}
                              onChange={(e) => updateStateAt(idx, { label: e.target.value })}
                              placeholder="예: 기본 (캐스터), 유년기, 부활 후"
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#00d8ff] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              상태별 표기 이름 (overrideNameKo)
                            </label>
                            <input
                              type="text"
                              value={st.overrideNameKo || ''}
                              onChange={(e) =>
                                updateStateAt(idx, {
                                  overrideNameKo: e.target.value || undefined,
                                })
                              }
                              placeholder={activeChar.nameKo}
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#00d8ff] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              상태별 소속 (overrideFaction)
                            </label>
                            <input
                              type="text"
                              value={st.overrideFaction || ''}
                              onChange={(e) =>
                                updateStateAt(idx, {
                                  overrideFaction: e.target.value || undefined,
                                })
                              }
                              placeholder={activeChar.defaultFaction}
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#00d8ff] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              상태별 직책 (overrideRole)
                            </label>
                            <input
                              type="text"
                              value={st.overrideRole || ''}
                              onChange={(e) =>
                                updateStateAt(idx, {
                                  overrideRole: e.target.value || undefined,
                                })
                              }
                              placeholder={activeChar.defaultRole}
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#00d8ff] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              등장 에피소드 (쉼표 구분)
                            </label>
                            <input
                              type="text"
                              value={st.appearances.join(', ')}
                              onChange={(e) =>
                                updateStateAt(idx, {
                                  appearances: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="ep00, ep01..."
                              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-white focus:border-[#00d8ff] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            이 상태에서의 인물 설명 (description)
                          </label>
                          <textarea
                            rows={2}
                            value={st.description}
                            onChange={(e) =>
                              updateStateAt(idx, { description: e.target.value })
                            }
                            className="w-full p-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-zinc-100 focus:border-[#00d8ff] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            이 상태의 대표 대사 (defaultQuote)
                          </label>
                          <input
                            type="text"
                            value={st.defaultQuote || ''}
                            onChange={(e) =>
                              updateStateAt(idx, {
                                defaultQuote: e.target.value || undefined,
                              })
                            }
                            placeholder="대표 대사 입력"
                            className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#00d8ff] focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(st.isSharedCg)}
                              onChange={(e) =>
                                updateStateAt(idx, { isSharedCg: e.target.checked })
                              }
                              className="accent-[#ffe600]"
                            />
                            <span>타 캐릭터/공용 CG 임시 공유 중 (isSharedCg)</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(st.isSilhouetteOnly)}
                              onChange={(e) =>
                                updateStateAt(idx, { isSilhouetteOnly: e.target.checked })
                              }
                              className="accent-[#ffe600]"
                            />
                            <span>전용 CG 없음 / 실루엣 표기 (isSilhouetteOnly)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CG Asset Picker Modal */}
      {pickerStateIndex !== null && activeChar && (
        <CharacterCgPickerModal
          isOpen={true}
          onClose={() => setPickerStateIndex(null)}
          assets={cgAssets}
          selectedAssetId={activeChar.states[pickerStateIndex]?.cgAssetId}
          onSelectAsset={(asset) => {
            updateStateAt(pickerStateIndex, {
              cgAssetId: asset.assetId,
              isSilhouetteOnly: asset.category === 'silhouette',
            });
          }}
          onJumpToCropper={(asset) => onJumpToCropper(asset.assetId)}
        />
      )}
    </div>
  );
};

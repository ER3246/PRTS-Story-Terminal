import React, { useState, useMemo } from 'react';
import { X, Search, Image as ImageIcon, UserCheck, Check, Ban, Sparkles } from 'lucide-react';
import type { CharacterCgAsset, CgAssetCategory } from '../../types/characterDb';
import type { SceneVisualAssetItem } from '../../data/db/sceneVisualAssets';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { TacticalAvatar } from '../TacticalAvatar';

interface CharacterCgPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: CharacterCgAsset[];
  selectedAssetId?: string;
  onSelectAsset: (asset: CharacterCgAsset) => void;
  onJumpToCropper?: (asset: CharacterCgAsset) => void;
}

export const CharacterCgPickerModal: React.FC<CharacterCgPickerModalProps> = ({
  isOpen,
  onClose,
  assets,
  selectedAssetId,
  onSelectAsset,
  onJumpToCropper,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CgAssetCategory>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        a.assetId.toLowerCase().includes(q) ||
        a.label.toLowerCase().includes(q) ||
        a.avatarFileName.toLowerCase().includes(q) ||
        (a.illustFileName && a.illustFileName.toLowerCase().includes(q))
      );
    });
  }, [assets, search, categoryFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#11141d] border border-white/15 rounded-lg w-full max-w-5xl h-[82vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b0d14] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-[#ffe600]" />
            <h3 className="text-sm font-bold text-white">
              캐릭터 CG 자산 선택 (Character CG Asset Catalog)
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              총 {filtered.length} / {assets.length}종
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 bg-[#0e111a] border-b border-white/10 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="캐릭터명, 파일명(amiya.png), 에셋 ID(cg_amiya) 검색..."
              className="w-full h-9 pl-9 pr-3 rounded bg-[#080a10] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffe600]"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                ['all', '전체'],
                ['operator', '오퍼레이터'],
                ['npc_named', '네임드 NPC'],
                ['enemy', '보스/적군'],
                ['npc_generic', '공용 NPC'],
                ['silhouette', '실루엣(없음)'],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`h-8 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#ffe600] text-black font-bold'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
          {filtered.map((asset) => {
            const isSelected = asset.assetId === selectedAssetId;
            const resolvedAvatar = asset.avatarUrl ? resolveAssetUrl(asset.avatarUrl) : '';
            return (
              <div
                key={asset.assetId}
                onClick={() => {
                  onSelectAsset(asset);
                  onClose();
                }}
                className={`group rounded-md border p-3 flex flex-col items-center text-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#ffe600]/10 border-[#ffe600] shadow-[0_0_15px_rgba(255,230,0,0.2)]'
                    : 'bg-[#0b0e15] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#ffe600] text-black flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                <div className="w-16 h-16 rounded overflow-hidden border border-white/15 bg-[#06080c] mb-2 flex items-center justify-center">
                  {asset.category === 'silhouette' ? (
                    <Ban className="w-6 h-6 text-zinc-500" />
                  ) : (
                    <TacticalAvatar
                      src={resolvedAvatar}
                      alt={asset.label}
                      className="w-full h-full"
                      cropOverride={asset.cropConfig}
                    />
                  )}
                </div>

                <div className="text-xs font-bold text-zinc-100 line-clamp-1 w-full">
                  {asset.label}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 truncate w-full mt-0.5">
                  {asset.avatarFileName || '(전술 실루엣)'}
                </div>

                <div className="mt-1.5 flex items-center gap-1 justify-center flex-wrap">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                    {asset.assetId}
                  </span>
                  {asset.illustFileName && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00d8ff]/15 text-[#00d8ff]">
                      전신보유
                    </span>
                  )}
                </div>

                {onJumpToCropper && asset.category !== 'silhouette' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToCropper(asset);
                      onClose();
                    }}
                    className="mt-2 w-full py-1 rounded bg-white/5 hover:bg-[#ffe600] text-zinc-300 hover:text-black text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    ✂️ 크롭 조정
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SceneVisualPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualAssets: SceneVisualAssetItem[];
  currentUrl?: string;
  onSelectVisual: (item: SceneVisualAssetItem) => void;
}

export const SceneVisualPickerModal: React.FC<SceneVisualPickerModalProps> = ({
  isOpen,
  onClose,
  visualAssets,
  currentUrl,
  onSelectVisual,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cg' | 'bg' | 'banner'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visualAssets.filter((v) => {
      if (typeFilter !== 'all' && v.type !== typeFilter) return false;
      if (!q) return true;
      return v.fileName.toLowerCase().includes(q) || v.url.toLowerCase().includes(q);
    });
  }, [visualAssets, search, typeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#11141d] border border-white/15 rounded-lg w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b0d14] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-[#00d8ff]" />
            <h3 className="text-sm font-bold text-white">
              장면 CG 및 배경 이미지 파일 선택 (Scene CG & Background Catalog)
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              총 {filtered.length} / {visualAssets.length}종
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 bg-[#0e111a] border-b border-white/10 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="파일명 검색 (예: ep12, lone_trail, 11_g, bg_...)..."
              className="w-full h-9 pl-9 pr-3 rounded bg-[#080a10] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00d8ff]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                ['all', '전체 이미지'],
                ['cg', '이벤트/장면 CG (/images/cgs)'],
                ['bg', '배경 (/images/backgrounds)'],
                ['banner', '배너 (/images/banners)'],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`h-8 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[#00d8ff] text-black font-bold'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onSelectVisual({ fileName: '(없음)', url: '', type: 'cg' });
              onClose();
            }}
            className="h-8 px-3 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-medium cursor-pointer"
          >
            이미지 비우기 (Empty)
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 content-start">
          {filtered.map((item) => {
            const isSelected = item.url === currentUrl;
            const resolved = resolveAssetUrl(item.url);
            return (
              <div
                key={item.url}
                onClick={() => {
                  onSelectVisual(item);
                  onClose();
                }}
                className={`group rounded-md border overflow-hidden flex flex-col transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00d8ff]/10 border-[#00d8ff] shadow-[0_0_15px_rgba(0,216,255,0.25)]'
                    : 'bg-[#0b0e15] border-white/10 hover:border-white/30'
                }`}
              >
                <div className="aspect-video w-full bg-[#05070b] relative overflow-hidden flex items-center justify-center">
                  <img
                    src={resolved}
                    alt={item.fileName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span
                    className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      item.type === 'cg'
                        ? 'bg-[#ffe600]/90 text-black'
                        : item.type === 'bg'
                        ? 'bg-[#00d8ff]/90 text-black'
                        : 'bg-purple-400/90 text-black'
                    }`}
                  >
                    {item.type}
                  </span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#00d8ff] text-black flex items-center justify-center shadow">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <div className="p-2.5 flex flex-col gap-0.5">
                  <div className="text-xs font-mono font-bold text-zinc-100 truncate">
                    {item.fileName}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 truncate">
                    {item.url}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Crop,
  Save,
  Download,
  Upload,
  Plus,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  ZoomIn,
  Move,
  Check,
} from 'lucide-react';
import type { CharacterCgAsset, CgAssetCategory, CgCropConfig } from '../../types/characterDb';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { updateRuntimeAvatarCrop } from '../../utils/characterAssetHelper';

interface CgCropStudioTabProps {
  assets: CharacterCgAsset[];
  onChangeAssets: (next: CharacterCgAsset[]) => void;
  selectedAssetId: string;
  onSelectAssetId: (id: string) => void;
  isLocalFsConnected: boolean;
  onSaveAssetsDb: (assetsToSave?: CharacterCgAsset[]) => Promise<void>;
  availableDiskFiles?: {
    avatars: string[];
    illusts: string[];
    libraryAvatars?: string[];
    libraryOperators?: string[];
    libraryNpcs?: string[];
    libraryNamed?: string[];
  };
}

type CropSourceMode = 'illust' | 'avatar' | 'upload';
export type StudioWorkMode = 'crop' | 'direct';

interface AssetDetailEditorProps {
  activeAsset: CharacterCgAsset;
  assets: CharacterCgAsset[];
  savedCrop?: CgCropConfig;
  onUpdateCropMemory: (assetId: string, crop: CgCropConfig) => void;
  onChangeAssets: (next: CharacterCgAsset[]) => void;
  isLocalFsConnected: boolean;
  onSaveAssetsDb: (assetsToSave?: CharacterCgAsset[]) => Promise<void>;
  availableDiskFiles?: {
    avatars: string[];
    illusts: string[];
    libraryAvatars?: string[];
    libraryOperators?: string[];
    libraryNpcs?: string[];
    libraryNamed?: string[];
  };
  cacheBuster: number;
  onSaveSuccess: (assetId: string, dataUrl: string | null) => void;
  avatarPreviewOverride?: string;
}

const AssetDetailEditor: React.FC<AssetDetailEditorProps> = ({
  activeAsset,
  assets,
  savedCrop,
  onUpdateCropMemory,
  onChangeAssets,
  isLocalFsConnected,
  onSaveAssetsDb,
  availableDiskFiles,
  cacheBuster,
  onSaveSuccess,
  avatarPreviewOverride,
}) => {
  const initialCrop = useMemo(() => {
    if (activeAsset.illustUrl) {
      const saved = savedCrop || activeAsset.illustCropConfig;
      return {
        sourceMode: 'illust' as CropSourceMode,
        x: saved?.x ?? 50,
        y: saved?.y ?? 22,
        zoom: saved?.zoom ?? 2.2,
      };
    }
    const saved = savedCrop || activeAsset.cropConfig;
    return {
      sourceMode: 'avatar' as CropSourceMode,
      x: saved?.x ?? 50,
      y: saved?.y ?? 50,
      zoom: saved?.zoom ?? 1.0,
    };
  }, [activeAsset, savedCrop]);

  // Overall work mode: Canvas Cropper vs Direct 1:1 Avatar Insertion
  const [workMode, setWorkMode] = useState<StudioWorkMode>('crop');

  const [sourceMode, setSourceMode] = useState<CropSourceMode>(initialCrop.sourceMode);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessType, setSaveSuccessType] = useState<'png' | 'crop' | null>(null);

  // Interactive crop coordinates
  const [focusX, setFocusX] = useState<number>(initialCrop.x);
  const [focusY, setFocusY] = useState<number>(initialCrop.y);
  const [zoom, setZoom] = useState<number>(initialCrop.zoom);

  // Direct 1:1 Avatar Assignment State
  const [libraryAvatarsList, setLibraryAvatarsList] = useState<string[]>([]);
  const [directSearchQuery, setDirectSearchQuery] = useState('');
  const [directCategoryFilter, setDirectCategoryFilter] = useState<'all' | 'operator' | 'npc' | 'token'>('all');
  const [selectedDirectAvatarPath, setSelectedDirectAvatarPath] = useState<string>(activeAsset.avatarFileName || '');
  const [directCustomFileName, setDirectCustomFileName] = useState<string>(
    activeAsset.avatarFileName || `${activeAsset.assetId.replace(/^cg_/, '')}.png`
  );
  const [directUploadedDataUrl, setDirectUploadedDataUrl] = useState<string | null>(null);
  const [isDirectSaving, setIsDirectSaving] = useState(false);
  const [isDirectDropOver, setIsDirectDropOver] = useState(false);

  // Fetch or receive 1,280 official library avatars
  useEffect(() => {
    if (availableDiskFiles?.libraryAvatars && availableDiskFiles.libraryAvatars.length > 0) {
      setLibraryAvatarsList(availableDiskFiles.libraryAvatars);
      return;
    }
    fetch('/images/characters/library/catalog.json')
      .then((r) => r.json())
      .then((items) => {
        if (Array.isArray(items)) {
          const avs = items
            .filter((i) => i.category === 'avatar')
            .map((i) => i.fileName)
            .sort();
          setLibraryAvatarsList(avs);
        }
      })
      .catch(() => {});
  }, [availableDiskFiles?.libraryAvatars]);

  // Update direct filename when activeAsset changes
  useEffect(() => {
    setDirectCustomFileName(activeAsset.avatarFileName || `${activeAsset.assetId.replace(/^cg_/, '')}.png`);
    setDirectUploadedDataUrl(null);
    setSelectedDirectAvatarPath(activeAsset.avatarFileName || '');
  }, [activeAsset.assetId, activeAsset.avatarFileName]);

  // Filtered official library avatars for fast browsing
  const directFilteredAvatars = useMemo(() => {
    let list = libraryAvatarsList;
    if (directCategoryFilter === 'operator') {
      list = list.filter((f) => f.startsWith('char_'));
    } else if (directCategoryFilter === 'npc') {
      list = list.filter(
        (f) => f.startsWith('avg_') || f.startsWith('bavg_') || f.startsWith('npc_')
      );
    } else if (directCategoryFilter === 'token') {
      list = list.filter((f) => f.startsWith('token_') || f.startsWith('trap_'));
    }

    const q = directSearchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((f) => f.toLowerCase().includes(q));
  }, [libraryAvatarsList, directCategoryFilter, directSearchQuery]);

  // Loaded HTMLImageElement for canvas rendering
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({
    clientX: 0,
    clientY: 0,
    startX: 50,
    startY: 22,
  });

  const updateCropCoords = useCallback(
    (newX: number, newY: number, newZoom: number) => {
      const fx = Number(newX.toFixed(1));
      const fy = Number(newY.toFixed(1));
      const fz = Number(newZoom.toFixed(2));
      setFocusX(fx);
      setFocusY(fy);
      setZoom(fz);
      onUpdateCropMemory(activeAsset.assetId, { x: fx, y: fy, zoom: fz });
    },
    [activeAsset.assetId, onUpdateCropMemory]
  );

  // Active source image URL for canvas crop
  const activeSourceUrl = useMemo(() => {
    if (sourceMode === 'upload' && uploadedDataUrl) return uploadedDataUrl;
    if (sourceMode === 'illust' && activeAsset.illustUrl) {
      return `${resolveAssetUrl(activeAsset.illustUrl)}?v=${cacheBuster}`;
    }
    if (activeAsset.avatarUrl) {
      return `${resolveAssetUrl(activeAsset.avatarUrl)}?v=${cacheBuster}`;
    }
    return '';
  }, [sourceMode, uploadedDataUrl, activeAsset, cacheBuster]);

  // Preview URL for direct mode
  const directPreviewUrl = useMemo(() => {
    if (directUploadedDataUrl) return directUploadedDataUrl;
    if (selectedDirectAvatarPath) {
      if (selectedDirectAvatarPath.startsWith('/') || selectedDirectAvatarPath.startsWith('data:')) {
        return selectedDirectAvatarPath;
      }
      return `/images/characters/library/avatars/${selectedDirectAvatarPath}`;
    }
    if (activeAsset.avatarUrl) {
      return `${resolveAssetUrl(activeAsset.avatarUrl)}?v=${cacheBuster}`;
    }
    return null;
  }, [directUploadedDataUrl, selectedDirectAvatarPath, activeAsset.avatarUrl, cacheBuster]);

  // Load source image via Blob URL to prevent tainted canvas issues
  useEffect(() => {
    if (!activeSourceUrl) return;
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    setImgLoadError(false);

    const loadImg = async () => {
      try {
        let finalUrl = activeSourceUrl;
        if (!activeSourceUrl.startsWith('data:') && !activeSourceUrl.startsWith('blob:')) {
          try {
            const res = await fetch(activeSourceUrl, { cache: 'no-store' });
            if (res.ok) {
              const blob = await res.blob();
              if (cancelled) return;
              finalUrl = URL.createObjectURL(blob);
              objectUrlToRevoke = finalUrl;
            }
          } catch (fetchErr) {
            console.warn('[CgCropStudio] Blob fetch failed, falling back to direct URL:', fetchErr);
          }
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (cancelled) return;
          setLoadedImg(img);
          setImgLoadError(false);
        };
        img.onerror = () => {
          if (cancelled) return;
          setLoadedImg(null);
          setImgLoadError(true);
        };
        img.src = finalUrl;
      } catch {
        if (!cancelled) {
          setLoadedImg(null);
          setImgLoadError(true);
        }
      }
    };

    loadImg();

    return () => {
      cancelled = true;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [activeSourceUrl]);

  // Render main canvas and 180x180 preview canvas
  const drawCanvases = useCallback(() => {
    const mainCanvas = mainCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!mainCanvas || !previewCanvas) return;

    const mCtx = mainCanvas.getContext('2d');
    const pCtx = previewCanvas.getContext('2d');
    if (!mCtx || !pCtx) return;

    const MW = mainCanvas.width;
    const MH = mainCanvas.height;
    mCtx.clearRect(0, 0, MW, MH);
    pCtx.clearRect(0, 0, 180, 180);

    mCtx.fillStyle = '#07090e';
    mCtx.fillRect(0, 0, MW, MH);

    if (!loadedImg) return;

    const iw = loadedImg.naturalWidth || 180;
    const ih = loadedImg.naturalHeight || 180;
    const minDim = Math.min(iw, ih);
    const cropSize = minDim / Math.max(0.25, zoom);

    const cx = (focusX / 100) * iw;
    const cy = (focusY / 100) * ih;
    const sx = cx - cropSize / 2;
    const sy = cy - cropSize / 2;

    // 1. Draw 180x180 preview canvas (exact physical PNG output)
    pCtx.clearRect(0, 0, 180, 180);
    pCtx.drawImage(loadedImg, sx, sy, cropSize, cropSize, 0, 0, 180, 180);

    // 2. Draw full source image fitted inside mainCanvas
    const pad = 24;
    const availW = MW - pad * 2;
    const availH = MH - pad * 2;
    const scale = Math.min(availW / iw, availH / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const offsetX = (MW - drawW) / 2;
    const offsetY = (MH - drawH) / 2;

    mCtx.save();
    mCtx.globalAlpha = 0.35;
    mCtx.drawImage(loadedImg, offsetX, offsetY, drawW, drawH);
    mCtx.restore();

    const boxX = offsetX + sx * scale;
    const boxY = offsetY + sy * scale;
    const boxSize = cropSize * scale;

    mCtx.save();
    mCtx.beginPath();
    mCtx.rect(boxX, boxY, boxSize, boxSize);
    mCtx.clip();
    mCtx.drawImage(loadedImg, offsetX, offsetY, drawW, drawH);
    mCtx.restore();

    mCtx.strokeStyle = '#ffe600';
    mCtx.lineWidth = 2;
    mCtx.strokeRect(boxX, boxY, boxSize, boxSize);

    mCtx.strokeStyle = 'rgba(255, 230, 0, 0.28)';
    mCtx.lineWidth = 1;
    mCtx.beginPath();
    mCtx.moveTo(boxX + boxSize / 3, boxY);
    mCtx.lineTo(boxX + boxSize / 3, boxY + boxSize);
    mCtx.moveTo(boxX + (boxSize * 2) / 3, boxY);
    mCtx.lineTo(boxX + (boxSize * 2) / 3, boxY + boxSize);
    mCtx.moveTo(boxX, boxY + boxSize / 3);
    mCtx.lineTo(boxX + boxSize, boxY + boxSize / 3);
    mCtx.moveTo(boxX, boxY + (boxSize * 2) / 3);
    mCtx.lineTo(boxX + boxSize, boxY + (boxSize * 2) / 3);
    mCtx.stroke();

    const centerBoxX = boxX + boxSize / 2;
    const centerBoxY = boxY + boxSize / 2;
    mCtx.strokeStyle = '#00d8ff';
    mCtx.lineWidth = 1.5;
    mCtx.beginPath();
    mCtx.moveTo(centerBoxX - 8, centerBoxY);
    mCtx.lineTo(centerBoxX + 8, centerBoxY);
    mCtx.moveTo(centerBoxX, centerBoxY - 8);
    mCtx.lineTo(centerBoxX, centerBoxY + 8);
    mCtx.stroke();
  }, [loadedImg, focusX, focusY, zoom]);

  useEffect(() => {
    drawCanvases();
  }, [drawCanvases]);

  // Mouse handlers for dragging focus box
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!loadedImg || !mainCanvasRef.current) return;
    const rect = mainCanvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const iw = loadedImg.naturalWidth || 180;
    const ih = loadedImg.naturalHeight || 180;
    const MW = mainCanvasRef.current.width;
    const MH = mainCanvasRef.current.height;
    const pad = 24;
    const scale = Math.min((MW - pad * 2) / iw, (MH - pad * 2) / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const offsetX = (MW - drawW) / 2;
    const offsetY = (MH - drawH) / 2;

    const newFocusX = Math.max(0, Math.min(100, ((clickX - offsetX) / drawW) * 100));
    const newFocusY = Math.max(0, Math.min(100, ((clickY - offsetY) / drawH) * 100));
    updateCropCoords(newFocusX, newFocusY, zoom);

    isDraggingRef.current = true;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: newFocusX,
      startY: newFocusY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !loadedImg || !mainCanvasRef.current) return;
    const iw = loadedImg.naturalWidth || 180;
    const ih = loadedImg.naturalHeight || 180;
    const MW = mainCanvasRef.current.width;
    const MH = mainCanvasRef.current.height;
    const pad = 24;
    const scale = Math.min((MW - pad * 2) / iw, (MH - pad * 2) / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;

    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    const nextX = Math.max(0, Math.min(100, dragStartRef.current.startX + (dx / drawW) * 100));
    const nextY = Math.max(0, Math.min(100, dragStartRef.current.startY + (dy / drawH) * 100));
    updateCropCoords(nextX, nextY, zoom);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    const nextZoom = Math.max(0.5, Math.min(6.0, zoom + delta));
    updateCropCoords(focusX, focusY, nextZoom);
  };

  const updateActiveAssetField = <K extends keyof CharacterCgAsset>(
    key: K,
    val: CharacterCgAsset[K]
  ) => {
    const next = assets.map((a) => (a.assetId === activeAsset.assetId ? { ...a, [key]: val } : a));
    onChangeAssets(next);
  };

  // Unified save handler
  const handleSave = async (options?: { cssOnly?: boolean }) => {
    const isCssOnly = options?.cssOnly ?? false;
    const fileName =
      activeAsset.avatarFileName || `${activeAsset.assetId.replace(/^cg_/, '')}.png`;

    setIsSaving(true);
    setStatusMsg(null);
    setSaveSuccessType(null);

    try {
      let savedUrl = `/images/characters/${fileName}`;
      let dataUrlForPreview: string | null = null;

      if (!isCssOnly && isLocalFsConnected) {
        let savedViaApi = false;

        // 1. Attempt direct canvas base64 export
        if (previewCanvasRef.current) {
          try {
            const dataUrl = previewCanvasRef.current.toDataURL('image/png');
            if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
              dataUrlForPreview = dataUrl;
              const res = await fetch('/__prts_admin_api/save-avatar-crop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, dataUrl }),
              });
              const json = await res.json();
              if (json.ok) {
                savedViaApi = true;
                savedUrl = json.avatarUrl || savedUrl;
              }
            }
          } catch (canvasErr) {
            console.warn('[CgCropStudio] toDataURL failed, using backend PIL fallback:', canvasErr);
          }
        }

        // 2. Fallback to server-side PIL crop
        if (!savedViaApi) {
          const sourceSubpath =
            sourceMode === 'illust' && activeAsset.illustUrl
              ? activeAsset.illustUrl
              : activeAsset.avatarUrl || `images/characters/${fileName}`;

          const res = await fetch('/__prts_admin_api/crop-avatar-coords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceSubpath,
              fileName,
              focusX,
              focusY,
              zoom,
            }),
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || '아바타 이미지 저장 실패');
          savedUrl = json.avatarUrl || savedUrl;
        }
      }

      // Browser download fallback
      if (!isCssOnly && !isLocalFsConnected && previewCanvasRef.current) {
        const dataUrl = previewCanvasRef.current.toDataURL('image/png');
        dataUrlForPreview = dataUrl;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.click();
      }

      const newCropConfig: CgCropConfig = isCssOnly
        ? { x: focusX, y: focusY, zoom }
        : { x: 50, y: 50, zoom: 1.0 };

      const newIllustCropConfig: CgCropConfig =
        sourceMode === 'illust'
          ? { x: focusX, y: focusY, zoom }
          : activeAsset.illustCropConfig || { x: 50, y: 22, zoom: 2.2 };

      onUpdateCropMemory(
        activeAsset.assetId,
        sourceMode === 'illust' ? newIllustCropConfig : newCropConfig
      );

      updateRuntimeAvatarCrop(savedUrl, newCropConfig);

      const updatedAssets = assets.map((a) =>
        a.assetId === activeAsset.assetId
          ? {
              ...a,
              avatarFileName: fileName,
              avatarUrl: savedUrl,
              cropConfig: newCropConfig,
              illustCropConfig: newIllustCropConfig,
            }
          : a
      );
      onChangeAssets(updatedAssets);
      await onSaveAssetsDb(updatedAssets);

      onSaveSuccess(activeAsset.assetId, dataUrlForPreview);
      setSaveSuccessType(isCssOnly ? 'crop' : 'png');
      setStatusMsg(
        isCssOnly
          ? `✅ 뷰포트 크롭 좌표(x:${focusX}%, y:${focusY}%, zoom:${zoom}x)가 DB에 저장되었습니다.`
          : `✅ [${activeAsset.label}] 1:1 아바타 물리 파일(180×180) 및 characterCgAssets.ts 저장 완료!`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg(`❌ 저장 실패: ${msg}`);
      window.alert(`[저장 실패] ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);

  // Process dropped image file (Drag & Drop support from Windows File Explorer)
  const processDroppedFile = useCallback(
    async (file: File) => {
      if (!file || !/\.(png|jpg|jpeg|webp)$/i.test(file.name)) {
        window.alert('지원하지 않는 파일 형식입니다. PNG, JPG, WEBP 이미지 파일을 드롭해주세요.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const dataUrl = reader.result;
          setUploadedDataUrl(dataUrl);
          setSourceMode('illust');
          updateCropCoords(50, 22, 2.2);

          // If local dev server FS is available, persist file to public/images/characters/illust/
          if (isLocalFsConnected) {
            try {
              const res = await fetch('/__prts_admin_api/upload-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileName: file.name,
                  dataUrl,
                  subDir: 'illust',
                }),
              });
              const json = await res.json();
              if (json.ok) {
                const updatedAssets = assets.map((a) =>
                  a.assetId === activeAsset.assetId
                    ? {
                        ...a,
                        illustFileName: json.fileName,
                        illustUrl: json.url,
                      }
                    : a
                );
                onChangeAssets(updatedAssets);
                setStatusMsg(
                  `📥 드롭된 이미지 '${json.fileName}' 디스크 저장 완료 (/images/characters/illust/${json.fileName}). 얼굴 크롭 후 [저장]을 누르세요.`
                );
                return;
              }
            } catch (uploadErr) {
              console.warn('[CgCropStudio] Direct upload failed, falling back to memory dataURL:', uploadErr);
            }
          }

          setStatusMsg(
            `📥 드롭된 이미지 '${file.name}'을(를) 캔버스에 로드했습니다. 원하는 얼굴 영역을 크롭한 후 [저장]을 누르세요.`
          );
        }
      };
      reader.readAsDataURL(file);
    },
    [activeAsset.assetId, assets, isLocalFsConnected, onChangeAssets, updateCropCoords]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processDroppedFile(file);
    }
  };

  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processDroppedFile(file);
  };

  // Process dropped 1:1 avatar file (Direct Insertion Mode)
  const handleDirectFileProcess = useCallback(
    (file: File) => {
      if (!file || !/\.(png|jpg|jpeg|webp)$/i.test(file.name)) {
        window.alert('지원하지 않는 파일 형식입니다. PNG, JPG, WEBP 이미지 파일을 선택해주세요.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setDirectUploadedDataUrl(reader.result);
          setSelectedDirectAvatarPath('');
          if (!directCustomFileName) {
            setDirectCustomFileName(file.name);
          }
          setStatusMsg(
            `📥 1:1 아바타 이미지 '${file.name}' 로드 완료. [⚡ 1:1 아바타 즉시 적용 & DB 저장]을 누르면 디스크에 저장됩니다.`
          );
        }
      };
      reader.readAsDataURL(file);
    },
    [directCustomFileName]
  );

  const handleDirectDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDirectDropOver(true);
  };

  const handleDirectDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDirectDropOver(false);
  };

  const handleDirectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDirectDropOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleDirectFileProcess(file);
    }
  };

  const handleDirectUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleDirectFileProcess(file);
  };

  // Direct 1:1 Avatar assignment save handler
  const handleDirectAssignAndSave = async () => {
    const source = directUploadedDataUrl || selectedDirectAvatarPath;
    if (!source) {
      window.alert('적용할 1:1 아바타를 라이브러리에서 선택하거나 이미지 파일을 드롭/업로드해주세요.');
      return;
    }

    const targetFileName =
      directCustomFileName.trim() ||
      activeAsset.avatarFileName ||
      `${activeAsset.assetId.replace(/^cg_/, '')}.png`;
    const finalName = targetFileName.endsWith('.png') ? targetFileName : `${targetFileName}.png`;

    setIsDirectSaving(true);
    setStatusMsg(null);
    setSaveSuccessType(null);

    try {
      let savedUrl = `/images/characters/${finalName}`;
      let dataUrlForPreview: string | null = directUploadedDataUrl;

      if (isLocalFsConnected) {
        const res = await fetch('/__prts_admin_api/assign-direct-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourcePathOrDataUrl: source,
            fileName: finalName,
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || '1:1 아바타 직접 저장 실패');
        savedUrl = json.avatarUrl || savedUrl;
      }

      // Neutral 1:1 crop
      const newCropConfig: CgCropConfig = { x: 50, y: 50, zoom: 1.0 };
      onUpdateCropMemory(activeAsset.assetId, newCropConfig);
      updateRuntimeAvatarCrop(savedUrl, newCropConfig);

      const updatedAssets = assets.map((a) =>
        a.assetId === activeAsset.assetId
          ? {
              ...a,
              avatarFileName: finalName,
              avatarUrl: savedUrl,
              cropConfig: newCropConfig,
            }
          : a
      );
      onChangeAssets(updatedAssets);
      await onSaveAssetsDb(updatedAssets);

      onSaveSuccess(activeAsset.assetId, dataUrlForPreview || savedUrl);
      setSaveSuccessType('png');
      setStatusMsg(`✅ [${activeAsset.label}] 1:1 아바타 '${finalName}' 직접 적용 및 DB 저장 완료!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg(`❌ 1:1 아바타 직접 저장 실패: ${msg}`);
      window.alert(`[1:1 아바타 직접 저장 실패] ${msg}`);
    } finally {
      setIsDirectSaving(false);
    }
  };

  const currentThumbSrc =
    avatarPreviewOverride ||
    (activeAsset.avatarUrl ? `${resolveAssetUrl(activeAsset.avatarUrl)}?v=${cacheBuster}` : '');

  return (
    <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-y-auto">
      {/* Center Work Area */}
      <div className="flex-1 p-5 flex flex-col items-center justify-start space-y-4">
        {/* Mode Switcher Banner */}
        <div className="w-full max-w-xl bg-[#0e121d] border border-white/10 rounded-lg p-1.5 flex items-center gap-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => setWorkMode('crop')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              workMode === 'crop'
                ? 'bg-[#00d8ff] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crop className="w-4 h-4" />
            <span>1. 캔버스 얼굴 크롭 모드</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkMode('direct')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              workMode === 'direct'
                ? 'bg-[#ffe600] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. 1:1 아바타 직접 삽입 / 교체 모드</span>
          </button>
        </div>

        {/* Mode 1: Interactive Canvas Cropper */}
        {workMode === 'crop' && (
          <div className="w-full max-w-xl flex flex-col items-center space-y-4 animate-in fade-in duration-150">
            {/* Source Selector & Drag-Drop Guide Bar */}
            <div className="w-full bg-[#111520] border border-white/10 rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-zinc-300 mr-1">크롭 소스:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSourceMode('illust');
                    const saved = savedCrop || activeAsset.illustCropConfig;
                    updateCropCoords(saved?.x ?? 50, saved?.y ?? 22, saved?.zoom ?? 2.2);
                  }}
                  disabled={!activeAsset.illustUrl}
                  className={`h-8 px-3 rounded text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    sourceMode === 'illust'
                      ? 'bg-[#00d8ff] text-black font-bold'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  전신 일러스트 ({activeAsset.illustFileName || '없음'})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceMode('avatar');
                    const saved = savedCrop || activeAsset.cropConfig;
                    updateCropCoords(saved?.x ?? 50, saved?.y ?? 50, saved?.zoom ?? 1.0);
                  }}
                  disabled={!activeAsset.avatarUrl}
                  className={`h-8 px-3 rounded text-xs font-semibold cursor-pointer disabled:opacity-40 ${
                    sourceMode === 'avatar'
                      ? 'bg-[#ffe600] text-black font-bold'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  현재 아바타 ({activeAsset.avatarFileName || '없음'})
                </button>
                <label className="h-8 px-3 rounded bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#ffe600]" />
                  <span>로컬 파일 열기</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLocalFile}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[11px] font-mono text-[#00d8ff] flex items-center gap-1 bg-[#00d8ff]/10 px-2 py-0.5 rounded border border-[#00d8ff]/20">
                <Upload className="w-3 h-3" /> 파일 드래그 & 드롭 지원
              </span>
            </div>

            {/* Interactive Canvas Box */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg overflow-hidden border transition-all duration-200 shadow-2xl ${
                isDragOver
                  ? 'border-[#00d8ff] ring-4 ring-[#00d8ff]/30 scale-[1.01]'
                  : 'border-white/15 bg-[#07090e]'
              }`}
            >
              <canvas
                ref={mainCanvasRef}
                width={460}
                height={460}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                className="cursor-crosshair block max-w-full h-auto"
              />

              {isDragOver && (
                <div className="absolute inset-0 z-50 bg-[#07090e]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#00d8ff] rounded-lg animate-in fade-in duration-150 pointer-events-none">
                  <Upload className="w-12 h-12 text-[#00d8ff] animate-bounce mb-3" />
                  <p className="text-sm font-extrabold text-white mb-1">
                    새 캐릭터 이미지 파일을 여기에 드롭하세요!
                  </p>
                  <p className="text-xs text-zinc-300 font-mono">
                    (PNG, JPG, WEBP 지원 · 디스크 자동 저장 및 캔버스 즉각 로드)
                  </p>
                </div>
              )}

              {imgLoadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                  <p className="text-xs text-red-400 font-bold mb-1">
                    원본 이미지를 불러올 수 없습니다 ({activeSourceUrl})
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    탐색기에서 이미지 파일을 캔버스로 직접 드롭하거나 상단 [로컬 파일 열기]를 이용하세요.
                  </p>
                </div>
              )}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 pointer-events-none bg-black/60 px-2.5 py-1 rounded">
                <span className="flex items-center gap-1">
                  <Move className="w-3 h-3 text-[#ffe600]" /> 마우스 드래그: 얼굴 위치 이동
                </span>
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#00d8ff]" /> 휠 스크롤: 확대/축소 ({zoom}x)
                </span>
              </div>
            </div>

            {/* Sliders & Presets */}
            <div className="w-full bg-[#111520] border border-white/10 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-300">빠른 크롭 프리셋:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => updateCropCoords(50, 18, 2.6)}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-[#ffe600] text-zinc-300 hover:text-black text-xs font-medium cursor-pointer"
                  >
                    상단 얼굴 확대 (Y:18%, 2.6x)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCropCoords(50, 26, 1.8)}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-[#ffe600] text-zinc-300 hover:text-black text-xs font-medium cursor-pointer"
                  >
                    상반신 흉상 (Y:26%, 1.8x)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCropCoords(50, 50, 1.0)}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-zinc-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> 정중앙 1:1 초기화
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span>가로 중심 (X)</span>
                    <span className="text-[#ffe600]">{focusX}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={focusX}
                    onChange={(e) => updateCropCoords(Number(e.target.value), focusY, zoom)}
                    className="w-full accent-[#ffe600]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span>세로 중심 (Y)</span>
                    <span className="text-[#ffe600]">{focusY}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={focusY}
                    onChange={(e) => updateCropCoords(focusX, Number(e.target.value), zoom)}
                    className="w-full accent-[#ffe600]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span>배율 (Zoom)</span>
                    <span className="text-[#00d8ff]">{zoom}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={6.0}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => updateCropCoords(focusX, focusY, Number(e.target.value))}
                    className="w-full accent-[#00d8ff]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Direct 1:1 Avatar Insertion / Library Selection */}
        {workMode === 'direct' && (
          <div className="w-full max-w-xl space-y-4 animate-in fade-in duration-150">
            {/* Direct Avatar Dropzone */}
            <div
              onDragOver={handleDirectDragOver}
              onDragEnter={handleDirectDragOver}
              onDragLeave={handleDirectDragLeave}
              onDrop={handleDirectDrop}
              className={`relative border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center transition-all shadow-md ${
                isDirectDropOver
                  ? 'border-[#ffe600] bg-[#ffe600]/10 scale-[1.01]'
                  : 'border-white/20 bg-[#0d1018] hover:border-white/40'
              }`}
            >
              <Upload className="w-7 h-7 text-[#ffe600] mb-2 animate-bounce" />
              <p className="text-sm font-bold text-white mb-1">
                1:1 아바타 이미지 파일을 여기에 드롭하세요
              </p>
              <p className="text-[11px] text-zinc-400 mb-3 font-mono">
                (PNG, JPG, WEBP 지원 · 크롭 없이 180×180 정규 규격으로 자동 저장)
              </p>
              <label className="px-3.5 py-1.5 rounded bg-white/10 hover:bg-white/15 text-xs text-zinc-200 font-semibold flex items-center gap-1.5 cursor-pointer border border-white/10 transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#ffe600]" />
                <span>PC에서 이미지 파일 선택</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDirectUploadFile}
                  className="hidden"
                />
              </label>
              {directUploadedDataUrl && (
                <div className="mt-3 flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded text-xs border border-emerald-500/40 font-mono">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>로컬 이미지 준비 완료 (우측 패널 또는 하단 버튼으로 즉시 저장)</span>
                </div>
              )}
            </div>

            {/* Official 1,280 Avatar Library Browser */}
            <div className="bg-[#111520] border border-white/10 rounded-lg p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200">
                    공식 1:1 아바타 라이브러리 ({libraryAvatarsList.length}종)
                  </span>
                  <span className="text-[10px] font-mono text-[#00d8ff] bg-[#00d8ff]/10 px-2 py-0.5 rounded border border-[#00d8ff]/20">
                    로컬 라이브러리
                  </span>
                </div>
                {/* Category Filters */}
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDirectCategoryFilter('all')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      directCategoryFilter === 'all'
                        ? 'bg-[#ffe600] text-black font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    전체 ({libraryAvatarsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectCategoryFilter('operator')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      directCategoryFilter === 'operator'
                        ? 'bg-[#00d8ff] text-black font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    오퍼 ({libraryAvatarsList.filter((f) => f.startsWith('char_')).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectCategoryFilter('npc')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      directCategoryFilter === 'npc'
                        ? 'bg-purple-400 text-black font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    NPC/보스 ({libraryAvatarsList.filter((f) => f.startsWith('avg_') || f.startsWith('bavg_') || f.startsWith('npc_')).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectCategoryFilter('token')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      directCategoryFilter === 'token'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    장치/기타
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="파일명 검색 (예: amiya, pianst, puzzle, npc_012)..."
                  value={directSearchQuery}
                  onChange={(e) => setDirectSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-7 rounded bg-[#07090e] border border-white/15 text-xs text-white placeholder-zinc-500 focus:border-[#ffe600] focus:outline-none"
                />
                {directSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDirectSearchQuery('')}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Visual Thumbnail Gallery Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1.5 bg-[#07090e] border border-white/10 rounded-md">
                {directFilteredAvatars.slice(0, 72).map((fn) => {
                  const isSelected = selectedDirectAvatarPath === fn && !directUploadedDataUrl;
                  return (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => {
                        setSelectedDirectAvatarPath(fn);
                        setDirectUploadedDataUrl(null);
                        setDirectCustomFileName(fn);
                        setStatusMsg(`선택됨: ${fn}`);
                      }}
                      className={`relative flex flex-col items-center p-1.5 rounded transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#ffe600]/20 border-2 border-[#ffe600] scale-95 shadow-md ring-2 ring-[#ffe600]/30'
                          : 'border border-white/5 hover:border-white/30 hover:bg-white/5'
                      }`}
                      title={fn}
                    >
                      <div className="w-12 h-12 rounded bg-black/60 overflow-hidden flex items-center justify-center">
                        <img
                          src={`/images/characters/library/avatars/${fn}`}
                          alt={fn}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 truncate w-full text-center mt-1">
                        {fn.replace('.png', '')}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>
                  검색 결과: {directFilteredAvatars.length}개 (상위 {Math.min(72, directFilteredAvatars.length)}개 표시)
                </span>
                {selectedDirectAvatarPath && (
                  <span className="text-[#ffe600] font-bold truncate max-w-[200px]">
                    선택: {selectedDirectAvatarPath}
                  </span>
                )}
              </div>
            </div>

            {/* Target Filename & Direct Save Bar */}
            <div className="bg-[#111520] border border-white/10 rounded-lg p-3.5 space-y-2.5">
              <span className="text-xs font-bold text-zinc-200">
                저장할 아바타 파일명 (/images/characters/)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={directCustomFileName}
                  onChange={(e) => setDirectCustomFileName(e.target.value)}
                  placeholder="저장할 파일명 (예: char_002_amiya.png)"
                  className="flex-1 h-9 px-3 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-white focus:border-[#ffe600] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleDirectAssignAndSave}
                  disabled={isDirectSaving || (!directUploadedDataUrl && !selectedDirectAvatarPath)}
                  className="h-9 px-4 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all shadow-md shrink-0"
                >
                  {isDirectSaving ? (
                    <>
                      <span className="inline-block animate-spin text-sm">⏳</span>
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>이 1:1 아바타 즉시 적용 & 저장</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Live Output & Asset Metadata */}
      <div className="w-full xl:w-96 border-l border-white/10 bg-[#0d1018] p-5 space-y-5">
        <div>
          {/* Header & Mini Mode Toggle */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              {workMode === 'direct' ? (
                <>
                  <ImageIcon className="w-4 h-4 text-[#ffe600]" />
                  1:1 아바타 직접 적용 미리보기
                </>
              ) : (
                <>
                  <Crop className="w-4 h-4 text-[#ffe600]" />
                  180×180 크롭 결과 미리보기
                </>
              )}
            </h4>
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/10 text-[10px]">
              <button
                type="button"
                onClick={() => setWorkMode('crop')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  workMode === 'crop'
                    ? 'bg-[#00d8ff] text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                크롭
              </button>
              <button
                type="button"
                onClick={() => setWorkMode('direct')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  workMode === 'direct'
                    ? 'bg-[#ffe600] text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                1:1 아바타
              </button>
            </div>
          </div>

          <div className="bg-[#07090e] border border-white/10 rounded-lg p-4 flex items-center justify-around gap-4">
            {/* Live Visual Box */}
            <div className="flex flex-col items-center gap-1.5">
              {workMode === 'direct' ? (
                <div className="w-28 h-28 rounded border-2 border-[#ffe600] bg-[#05070b] overflow-hidden shadow-lg flex items-center justify-center">
                  {directPreviewUrl ? (
                    <img
                      src={directPreviewUrl}
                      alt="direct-preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500">선택 대기</span>
                  )}
                </div>
              ) : (
                <canvas
                  ref={previewCanvasRef}
                  width={180}
                  height={180}
                  className="w-28 h-28 rounded border-2 border-[#ffe600] bg-[#05070b] shadow-lg"
                />
              )}
              <span className="text-[10px] font-mono text-zinc-400">
                {workMode === 'direct' ? '선택된 1:1 아바타' : '180×180 생성 규격'}
              </span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded overflow-hidden border border-white/20 bg-[#05070b]">
                  {currentThumbSrc ? (
                    <img
                      key={`${activeAsset.assetId}-${cacheBuster}-${avatarPreviewOverride ? 'ov' : 'df'}`}
                      src={currentThumbSrc}
                      alt="current"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-500">NONE</span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400">
                  <div className="text-zinc-200 font-bold">현재 저장된 파일</div>
                  <div className="font-mono text-[10px] truncate max-w-[90px]">
                    {activeAsset.avatarFileName}
                  </div>
                </div>
              </div>

              {/* Action Buttons based on Work Mode */}
              {workMode === 'direct' ? (
                <button
                  type="button"
                  onClick={handleDirectAssignAndSave}
                  disabled={isDirectSaving || (!directUploadedDataUrl && !selectedDirectAvatarPath)}
                  className={`w-full py-2.5 px-3 rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                    saveSuccessType === 'png'
                      ? 'bg-emerald-500 text-black'
                      : isDirectSaving
                      ? 'bg-amber-400 text-black cursor-wait'
                      : 'bg-[#ffe600] hover:bg-[#ffe600]/90 text-black'
                  } disabled:opacity-50`}
                >
                  {isDirectSaving ? (
                    <>
                      <span className="inline-block animate-spin text-sm">⏳</span>
                      <span>1:1 아바타 저장 중...</span>
                    </>
                  ) : saveSuccessType === 'png' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>1:1 아바타 저장 완료!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>⚡ 1:1 아바타 즉시 적용 & DB 저장</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  {/* Primary Canvas Save Button */}
                  <button
                    type="button"
                    onClick={() => handleSave({ cssOnly: false })}
                    disabled={isSaving || !loadedImg}
                    className={`w-full py-2.5 px-3 rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                      saveSuccessType === 'png'
                        ? 'bg-emerald-500 text-black'
                        : isSaving
                        ? 'bg-amber-400 text-black cursor-wait'
                        : 'bg-[#ffe600] hover:bg-[#ffe600]/90 text-black'
                    } disabled:opacity-50`}
                  >
                    {isSaving ? (
                      <>
                        <span className="inline-block animate-spin text-sm">⏳</span>
                        <span>1:1 아바타 생성 및 DB 저장 중...</span>
                      </>
                    ) : saveSuccessType === 'png' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-black" />
                        <span>1:1 아바타 및 DB 통합 저장 완료!</span>
                      </>
                    ) : isLocalFsConnected ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>1:1 아바타 생성 & DB 저장 (추천)</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>180×180 크롭 PNG 다운로드</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Save Button */}
                  <button
                    type="button"
                    onClick={() => handleSave({ cssOnly: true })}
                    disabled={isSaving}
                    className={`w-full py-1.5 px-3 rounded font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      saveSuccessType === 'crop'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <span className="inline-block animate-spin text-xs">⏳</span>
                        <span>뷰포트 크롭 저장 중...</span>
                      </>
                    ) : saveSuccessType === 'crop' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>뷰포트 크롭 DB 저장 완료!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-[#00d8ff]" />
                        <span>원본 유지 + 뷰포트 크롭값만 DB 저장</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded text-xs flex items-start gap-2 shadow-lg transition-all border animate-in fade-in duration-200 ${
              statusMsg.startsWith('❌')
                ? 'bg-red-500/20 border-red-500/50 text-red-200 font-bold'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                statusMsg.startsWith('❌') ? 'text-red-400' : 'text-emerald-400'
              }`}
            />
            <span className="break-all">{statusMsg}</span>
          </div>
        )}

        {/* Asset Metadata Editor */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h4 className="text-xs font-bold text-zinc-200">CG 자산 메타데이터 설정</h4>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">에셋 ID (assetId)</label>
            <input
              type="text"
              value={activeAsset.assetId}
              readOnly
              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/10 text-xs font-mono text-zinc-400"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">식별 라벨 (label)</label>
            <input
              type="text"
              value={activeAsset.label}
              onChange={(e) => updateActiveAssetField('label', e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">분류 (category)</label>
            <select
              value={activeAsset.category}
              onChange={(e) =>
                updateActiveAssetField('category', e.target.value as CgAssetCategory)
              }
              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
            >
              <option value="operator">operator (로도스 오퍼레이터)</option>
              <option value="npc_named">npc_named (네임드 NPC)</option>
              <option value="enemy">enemy (적군/보스)</option>
              <option value="npc_generic">npc_generic (공용 NPC)</option>
              <option value="silhouette">silhouette (실루엣)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              1:1 아바타 파일명 (/images/characters/)
            </label>
            <input
              type="text"
              list="disk-avatar-files"
              value={activeAsset.avatarFileName}
              onChange={(e) => {
                const fn = e.target.value.trim();
                const next = assets.map((a) =>
                  a.assetId === activeAsset.assetId
                    ? {
                        ...a,
                        avatarFileName: fn,
                        avatarUrl: fn ? `/images/characters/${fn}` : '',
                      }
                    : a
                );
                onChangeAssets(next);
              }}
              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-white focus:border-[#ffe600] focus:outline-none"
            />
            {availableDiskFiles && (
              <datalist id="disk-avatar-files">
                {availableDiskFiles.avatars.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              전신 일러스트 파일명 (/images/characters/illust/)
            </label>
            <input
              type="text"
              list="disk-illust-files"
              value={activeAsset.illustFileName || ''}
              placeholder="(전신 일러스트 없을 시 비워둠)"
              onChange={(e) => {
                const fn = e.target.value.trim();
                const next = assets.map((a) =>
                  a.assetId === activeAsset.assetId
                    ? {
                        ...a,
                        illustFileName: fn || undefined,
                        illustUrl: fn ? `/images/characters/illust/${fn}` : undefined,
                      }
                    : a
                );
                onChangeAssets(next);
              }}
              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs font-mono text-white focus:border-[#ffe600] focus:outline-none"
            />
            {availableDiskFiles && (
              <datalist id="disk-illust-files">
                {availableDiskFiles.illusts.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">관리 메모 (notes)</label>
            <input
              type="text"
              value={activeAsset.notes || ''}
              onChange={(e) => updateActiveAssetField('notes', e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white focus:border-[#ffe600] focus:outline-none"
            />
          </div>

          {/* Bottom Save Button */}
          <button
            type="button"
            onClick={() => (workMode === 'direct' ? handleDirectAssignAndSave() : handleSave({ cssOnly: false }))}
            disabled={workMode === 'direct' ? isDirectSaving : isSaving}
            className={`w-full py-2.5 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              saveSuccessType === 'png'
                ? 'bg-emerald-500 text-black'
                : isSaving || isDirectSaving
                ? 'bg-amber-400 text-black cursor-wait'
                : 'bg-[#00d8ff] hover:bg-[#00d8ff]/90 text-black shadow-lg'
            }`}
          >
            {isSaving || isDirectSaving ? (
              <>
                <span className="inline-block animate-spin text-xs">⏳</span>
                <span>디스크 저장 및 DB 반영 중...</span>
              </>
            ) : saveSuccessType === 'png' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                <span>저장 완료!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>
                  {workMode === 'direct'
                    ? '1:1 아바타 디스크 즉시 저장 (파일 복사 + DB 반영)'
                    : '변경사항 디스크 즉시 저장 (1:1 아바타 + DB 반영)'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CgCropStudioTab: React.FC<CgCropStudioTabProps> = ({
  assets,
  onChangeAssets,
  selectedAssetId,
  onSelectAssetId,
  isLocalFsConnected,
  onSaveAssetsDb,
  availableDiskFiles,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CgAssetCategory>('all');
  const [cacheBuster, setCacheBuster] = useState<number>(() => Date.now());
  const [avatarPreviewOverrides, setAvatarPreviewOverrides] = useState<Record<string, string>>({});
  const [inMemoryCrops, setInMemoryCrops] = useState<Record<string, CgCropConfig>>({});

  const activeAsset = useMemo(
    () => assets.find((a) => a.assetId === selectedAssetId) || assets[1] || assets[0],
    [assets, selectedAssetId]
  );

  const filteredAssets = useMemo(() => {
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

  const handleAddNewAsset = () => {
    const rawId = window.prompt('신규 CG 자산 ID를 입력하세요 (예: npc_london_citizen):');
    if (!rawId) return;
    const cleanBase = rawId.trim().replace(/^cg_/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const assetId = `cg_${cleanBase}`;
    if (assets.some((a) => a.assetId === assetId)) {
      window.alert('이미 존재하는 에셋 ID입니다.');
      onSelectAssetId(assetId);
      return;
    }
    const newAsset: CharacterCgAsset = {
      assetId,
      label: `신규 인물 (${cleanBase})`,
      category: 'npc_named',
      avatarFileName: `${cleanBase}.png`,
      avatarUrl: `/images/characters/${cleanBase}.png`,
      cropConfig: { x: 50, y: 50, zoom: 1.0 },
      isSharedOrBorrowed: false,
      notes: '편집 스튜디오에서 신규 등록됨',
    };
    const next = [...assets, newAsset];
    onChangeAssets(next);
    onSelectAssetId(assetId);
  };

  const handleUpdateCropMemory = useCallback((assetId: string, crop: CgCropConfig) => {
    setInMemoryCrops((prev) => ({ ...prev, [assetId]: crop }));
  }, []);

  const handleSaveSuccess = useCallback((assetId: string, dataUrl: string | null) => {
    if (dataUrl) {
      setAvatarPreviewOverrides((prev) => ({
        ...prev,
        [assetId]: dataUrl,
      }));
    }
    setCacheBuster(Date.now());
  }, []);

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden bg-[#0a0c12]">
      {/* Left Sidebar: CG Asset List */}
      <div className="w-full lg:w-80 border-r border-white/10 bg-[#0d1018] flex flex-col min-h-0">
        <div className="p-3 border-b border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#ffe600]" />
              캐릭터 CG DB ({filteredAssets.length}종)
            </span>
            <button
              onClick={handleAddNewAsset}
              className="h-7 px-2.5 rounded bg-[#ffe600] hover:bg-[#ffe600]/90 text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              신규 CG 등록
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="캐릭터명, 파일명, 에셋ID 검색..."
              className="w-full h-8 pl-8 pr-2.5 rounded bg-[#07090e] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffe600]"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {(
              [
                ['all', '전체'],
                ['operator', '오퍼'],
                ['npc_named', '네임드'],
                ['enemy', '적/보스'],
                ['npc_generic', '공용'],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  categoryFilter === cat
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
          {filteredAssets.map((a) => {
            const active = a.assetId === activeAsset?.assetId;
            const thumbSrc =
              avatarPreviewOverrides[a.assetId] ||
              (a.avatarUrl ? `${resolveAssetUrl(a.avatarUrl)}?v=${cacheBuster}` : '');

            return (
              <button
                key={a.assetId}
                onClick={() => onSelectAssetId(a.assetId)}
                className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                  active ? 'bg-[#ffe600]/15 border-l-2 border-[#ffe600]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className="w-10 h-10 rounded bg-[#06080c] border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                  {thumbSrc ? (
                    <img
                      key={`${a.assetId}-${cacheBuster}-${avatarPreviewOverrides[a.assetId] ? 'ov' : 'df'}`}
                      src={thumbSrc}
                      alt={a.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-500">NONE</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-100 truncate">{a.label}</div>
                  <div className="text-[10px] font-mono text-zinc-400 truncate">
                    {a.assetId} · {a.avatarFileName || '실루엣'}
                  </div>
                </div>
                {a.illustFileName && (
                  <span className="px-1.5 py-0.5 rounded bg-[#00d8ff]/15 text-[#00d8ff] text-[9px] font-mono shrink-0">
                    전신
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center & Right: Active Asset Cropper & Metadata Editor */}
      {activeAsset && (
        <AssetDetailEditor
          key={activeAsset.assetId}
          activeAsset={activeAsset}
          assets={assets}
          savedCrop={inMemoryCrops[activeAsset.assetId]}
          onUpdateCropMemory={handleUpdateCropMemory}
          onChangeAssets={onChangeAssets}
          isLocalFsConnected={isLocalFsConnected}
          onSaveAssetsDb={onSaveAssetsDb}
          availableDiskFiles={availableDiskFiles}
          cacheBuster={cacheBuster}
          onSaveSuccess={handleSaveSuccess}
          avatarPreviewOverride={avatarPreviewOverrides[activeAsset.assetId]}
        />
      )}
    </div>
  );
};

/**
 * src/utils/characterAssetHelper.ts
 * 
 * Centralized Character Asset Resolver & Configuration System.
 * 
 * Guarantees stable, unified, and efficient sharing of visual assets
 * (1:1 square avatars and full-body standing illustrations) across all stories,
 * while seamlessly supporting story-specific overrides (alternate skins, disguises, etc.).
 */

import { characterCgAssets } from '../data/db/characterCgAssets';
import type { CgCropConfig } from '../types/characterDb';

export interface CharacterAssetQuery {
  id: string;
  avatarUrl?: string;
  illustUrl?: string;
}

// Global runtime avatar cache-buster to instantly invalidate browser memory/disk caches on crop/asset update
let globalAvatarCacheBuster = Date.now();

export function getGlobalAvatarCacheBuster(): number {
  return globalAvatarCacheBuster;
}

export function refreshGlobalAvatarCacheBuster(): number {
  globalAvatarCacheBuster = Date.now();
  return globalAvatarCacheBuster;
}

const cropLookupByUrl = new Map<string, CgCropConfig>();
for (const asset of characterCgAssets) {
  if (asset.avatarUrl) {
    cropLookupByUrl.set(asset.avatarUrl, asset.cropConfig);
  }
  if (asset.avatarFileName) {
    cropLookupByUrl.set(asset.avatarFileName, asset.cropConfig);
  }
}

export function getAvatarCropConfig(src: string): CgCropConfig | undefined {
  const baseName = src.split('?')[0].split('/').pop() || '';
  return cropLookupByUrl.get(src) || cropLookupByUrl.get(baseName);
}

export function updateRuntimeAvatarCrop(avatarUrlOrFile: string, crop: CgCropConfig) {
  cropLookupByUrl.set(avatarUrlOrFile, crop);
  const base = avatarUrlOrFile.split('/').pop();
  if (base) {
    cropLookupByUrl.set(base, crop);
    cropLookupByUrl.set(`/images/characters/${base}`, crop);
  }
}

// Known alias mappings where one ID shares assets with another
export const CHARACTER_ASSET_ALIASES: Record<string, string> = {
  anthony: 'mountain',
  mountain: 'mountain',
  astrogenes: 'astgenne',
  astgenne: 'astgenne',
  czerny: 'czerny',
  mefisto: 'mephisto',
  cloer: 'carol',
  reunion_soldier_a: 'reunion_soldier',
  reunion_soldier_b: 'reunion_soldier_b',
};

/**
 * Resolves the 1:1 square avatar URL for a character.
 * Priority:
 * 1. If explicit avatarUrl is provided as empty string (''), return '' (denotes Tactical Silhouette / No Record)
 * 2. Explicit story-level override (if customized or story-specific)
 * 3. Standard pattern: /images/characters/{id}.png (with alias fallback)
 */
export function getCharacterAvatarUrl(char: CharacterAssetQuery | string): string {
  if (typeof char === 'string') {
    const aliasId = CHARACTER_ASSET_ALIASES[char] || char;
    return `/images/characters/${aliasId}.png`;
  }

  // If explicitly set to empty string (''), respect it as NO VISUAL RECORD!
  if (char.avatarUrl !== undefined && char.avatarUrl.trim() === '') {
    return '';
  }

  if (char.avatarUrl && char.avatarUrl.trim() !== '') {
    return char.avatarUrl;
  }

  const aliasId = CHARACTER_ASSET_ALIASES[char.id] || char.id;
  return `/images/characters/${aliasId}.png`;
}

/**
 * Resolves the full-body standing illustration URL for a character.
 * Safeguard: Prevents cropped square avatars from ever leaking into the full-body visual showcase.
 * 
 * Priority:
 * 1. If explicit illustUrl is empty string ('') or explicit avatarUrl is empty string (''), return ''
 * 2. If explicit illustUrl is provided and is a valid illust path (contains '/illust/'), use it.
 * 3. If explicit illustUrl was erroneously set to an avatar path (/images/characters/{name}.png without /illust/),
 *    safely redirect to /images/characters/illust/{name}.png.
 * 4. Standard pattern: /images/characters/illust/{id}.png (with alias fallback)
 */
export function getCharacterIllustUrl(char: CharacterAssetQuery | string): string {
  if (typeof char === 'string') {
    const aliasId = CHARACTER_ASSET_ALIASES[char] || char;
    return `/images/characters/illust/${aliasId}.png`;
  }

  // If explicitly set to empty string (''), respect it as NO VISUAL RECORD
  if (char.illustUrl !== undefined && char.illustUrl.trim() === '') {
    return '';
  }
  // If character has no avatar at all, they also have no standing illust
  if (char.avatarUrl !== undefined && char.avatarUrl.trim() === '') {
    return '';
  }

  const explicitIllust = char.illustUrl;
  const explicitAvatar = char.avatarUrl;

  // Case 1: Explicit illustUrl provided
  if (explicitIllust && explicitIllust.trim() !== '') {
    // CRITICAL SAFEGUARD: If illustUrl is identical to avatarUrl, or points directly
    // to the avatar directory without '/illust/', it was an accidental avatar assignment.
    // Automatically redirect to the illust folder!
    if (
      explicitIllust === explicitAvatar ||
      (explicitIllust.startsWith('/images/characters/') && !explicitIllust.includes('/illust/'))
    ) {
      const filename = explicitIllust.replace('/images/characters/', '');
      return `/images/characters/illust/${filename}`;
    }
    return explicitIllust;
  }

  // Case 2: Standard full standing illust path
  const aliasId = CHARACTER_ASSET_ALIASES[char.id] || char.id;
  return `/images/characters/illust/${aliasId}.png`;
}


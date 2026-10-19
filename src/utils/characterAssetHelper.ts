/**
 * src/utils/characterAssetHelper.ts
 * 
 * Centralized Character Asset Resolver & Configuration System.
 * 
 * Guarantees stable, unified, and efficient sharing of visual assets
 * (1:1 square avatars and full-body standing illustrations) across all stories,
 * while seamlessly supporting story-specific overrides (alternate skins, disguises, etc.).
 */

export interface CharacterAssetQuery {
  id: string;
  avatarUrl?: string;
  illustUrl?: string;
}

// Known alias mappings where one ID shares assets with another
export const CHARACTER_ASSET_ALIASES: Record<string, string> = {
  anthony: 'mountain',
  mountain: 'mountain',
  astrogenes: 'astgenne',
  astgenne: 'astgenne',
  mefisto: 'mephisto',
  reunion_soldier_a: 'reunion_soldier',
  reunion_soldier_b: 'reunion_soldier_b',
};

/**
 * Resolves the 1:1 square avatar URL for a character.
 * Priority:
 * 1. If explicit avatarUrl is provided as empty string (''), return '' (denotes Tactical Silhouette / No Record)
 * 2. Explicit story-level override (if customized or story-specific)
 * 3. Standard pattern: /images/characters/{id}.png
 */
export function getCharacterAvatarUrl(char: CharacterAssetQuery | string): string {
  if (typeof char === 'string') {
    return `/images/characters/${char}.png`;
  }

  // If explicitly set to empty string (''), respect it as NO VISUAL RECORD!
  if (char.avatarUrl !== undefined && char.avatarUrl.trim() === '') {
    return '';
  }

  if (char.avatarUrl && char.avatarUrl.trim() !== '') {
    return char.avatarUrl;
  }

  return `/images/characters/${char.id}.png`;
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
 * 4. Standard pattern: /images/characters/illust/{id}.png
 */
export function getCharacterIllustUrl(char: CharacterAssetQuery | string): string {
  if (typeof char === 'string') {
    return `/images/characters/illust/${char}.png`;
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
  return `/images/characters/illust/${char.id}.png`;
}


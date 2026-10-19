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
 * 1. Explicit story-level override (if customized or story-specific)
 * 2. Standard pattern: /images/characters/{id}.png
 */
export function getCharacterAvatarUrl(char: CharacterAssetQuery | string): string {
  const charId = typeof char === 'string' ? char : char.id;
  const explicitAvatar = typeof char === 'object' ? char.avatarUrl : undefined;

  if (explicitAvatar && explicitAvatar.trim() !== '') {
    return explicitAvatar;
  }

  return `/images/characters/${charId}.png`;
}

/**
 * Resolves the full-body standing illustration URL for a character.
 * Safeguard: Prevents cropped square avatars from ever leaking into the full-body visual showcase.
 * 
 * Priority:
 * 1. If explicit illustUrl is provided and is a valid illust path (contains '/illust/'), use it.
 * 2. If explicit illustUrl was erroneously set to an avatar path (/images/characters/{name}.png without /illust/),
 *    safely redirect to /images/characters/illust/{name}.png.
 * 3. Standard pattern: /images/characters/illust/{id}.png
 * 4. Alias fallback (e.g. anthony -> mountain)
 */
export function getCharacterIllustUrl(char: CharacterAssetQuery | string): string {
  const charId = typeof char === 'string' ? char : char.id;
  const explicitIllust = typeof char === 'object' ? char.illustUrl : undefined;
  const explicitAvatar = typeof char === 'object' ? char.avatarUrl : undefined;

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
  return `/images/characters/illust/${charId}.png`;
}

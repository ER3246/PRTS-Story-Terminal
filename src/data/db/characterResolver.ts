/**
 * PRTS Story Terminal - 통합 캐릭터 마스터 DB & 자산 해석기 (Character Resolver)
 * 
 * 마스터 DB와 CG 자산 DB를 연계하여, 개별 스토리 또는 뷰어에서 요구하는 표준 CharacterRef 객체로
 * 변환하고 질의하는 브릿지 유틸리티 레이어입니다.
 */

import type { CharacterRef } from '../../types/story';
import type { 
  CharacterMasterRecord, 
  CharacterCgAsset, 
  StoryCharacterBinding 
} from '../../types/characterDb';
import { characterMasterDb, characterMasterMap } from './characterMasterDb';
import { characterCgAssets, characterCgAssetMap } from './characterCgAssets';

/**
 * 모든 마스터 캐릭터 레코드 조회
 */
export function getAllMasterCharacters(): CharacterMasterRecord[] {
  return characterMasterDb;
}

/**
 * 특정 ID의 마스터 캐릭터 조회 (별칭 지원)
 */
export function getMasterCharacter(charId: string): CharacterMasterRecord | undefined {
  return characterMasterMap[charId];
}

/**
 * 모든 CG 자산 조회
 */
export function getAllCgAssets(): CharacterCgAsset[] {
  return characterCgAssets;
}

/**
 * 특정 ID의 CG 자산 조회
 */
export function getCgAsset(assetId: string): CharacterCgAsset | undefined {
  return characterCgAssetMap[assetId];
}

/**
 * 스토리 캐릭터 바인딩 사양을 표준 CharacterRef 객체로 변환
 * 
 * @param binding 스토리에서 지정한 캐릭터 ID, 상태 ID 및 해당 챕터 전용 상황 오버라이드
 * @returns 뷰어 및 다운로더에서 즉시 렌더링 가능한 CharacterRef
 */
export function resolveStoryCharacter(binding: StoryCharacterBinding): CharacterRef {
  const master = getMasterCharacter(binding.charId);

  if (!master) {
    // 마스터 DB 미등록 인물일 경우 안전 플레이스홀더 반환
    return {
      id: binding.charId,
      nameKo: binding.charId,
      nameEn: binding.charId,
      faction: '미분류',
      role: binding.overrideRole || '작전 관계자',
      avatarUrl: '',
      description: binding.overrideDescription || '마스터 DB에 등록되지 않은 임시 인물입니다.',
      quote: binding.quoteInStory,
      statusInChapter: binding.statusInChapter,
      spoilerLevel: binding.spoilerLevel ?? 1
    };
  }

  // 지정된 상태 또는 기본 상태 선택
  const targetStateId = binding.stateId || master.defaultStateId;
  const state = master.states.find(s => s.stateId === targetStateId) || master.states[0];

  // CG 에셋 매핑
  const cgAsset = state.cgAssetId ? getCgAsset(state.cgAssetId) : undefined;
  const avatarUrl = cgAsset ? cgAsset.avatarUrl : '';
  const illustUrl = cgAsset?.illustUrl;

  return {
    id: master.charId,
    nameKo: state.overrideNameKo || master.nameKo,
    nameEn: state.overrideNameEn || master.nameEn,
    faction: state.overrideFaction || master.defaultFaction,
    role: binding.overrideRole || state.overrideRole || master.defaultRole,
    avatarUrl,
    illustUrl,
    description: binding.overrideDescription || state.description || master.baseBio,
    quote: binding.quoteInStory || state.defaultQuote,
    statusInChapter: binding.statusInChapter,
    spoilerLevel: binding.spoilerLevel ?? 1
  };
}

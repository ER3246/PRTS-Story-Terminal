/**
 * PRTS Story Terminal - 통합 캐릭터 마스터 DB & 자산 해석기 (Character Resolver)
 * 
 * 마스터 DB와 CG 자산 DB를 연계하여, 개별 스토리 또는 뷰어에서 요구하는 표준 CharacterRef 객체로
 * 변환하고 질의하는 브릿지 유틸리티 레이어입니다.
 * 
 * [단일 진실 공급원 (SSOT) 원칙]
 * 모든 뷰어(StoryViewer, SideDrawer, Dossier)는 이 리졸버를 통해 최신 마스터 DB와
 * CG 자산 레코드를 실시간 참조합니다.
 */

import type { CharacterRef, CharacterVisualVariant } from '../../types/story';
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
 * 특정 ID의 마스터 캐릭터 조회 (대소문자 무시 및 별칭 지원)
 */
export function getMasterCharacter(charId: string): CharacterMasterRecord | undefined {
  if (!charId) return undefined;
  return characterMasterMap[charId] || characterMasterMap[charId.toLowerCase().trim()];
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
  if (!assetId) return undefined;
  return characterCgAssetMap[assetId];
}

/**
 * 마스터 DB와 CG 자산 레지스트리를 단일 진실 공급원(SSOT)으로 삼아,
 * 공개 뷰어 및 다운로더에서 사용할 최종 CharacterRef 객체를 실시간 정합 해석합니다.
 * 
 * @param charId 캐릭터 ID 또는 별칭
 * @param inStoryRef 스토리 TS 파일에 기존 정의된 CharacterRef (선택사항, 챕터 고유 맥락 보존)
 * @param targetStateId 특정 시점/외형 상태 분기 ID (선택사항)
 */
export function resolveCharacterMaster(
  charId: string,
  inStoryRef?: CharacterRef,
  targetStateId?: string
): CharacterRef {
  const master = getMasterCharacter(charId) || (inStoryRef?.id ? getMasterCharacter(inStoryRef.id) : undefined);

  if (!master) {
    if (inStoryRef) return inStoryRef;
    return {
      id: charId,
      nameKo: charId,
      nameEn: charId,
      faction: '미분류',
      role: '작전 관계자',
      avatarUrl: '',
      description: '마스터 DB에 등록되지 않은 임시 인물입니다.',
      statusInChapter: '',
      spoilerLevel: 1
    };
  }

  // 1. 대상 상태 분기 (State) 결정
  let activeState = master.states[0];
  if (targetStateId) {
    const found = master.states.find(s => s.stateId === targetStateId);
    if (found) {
      activeState = found;
    } else if (targetStateId === 'current' || targetStateId === 'default') {
      activeState = master.states.find(s => s.stateId === master.defaultStateId) || master.states[0];
    }
  } else {
    activeState = master.states.find(s => s.stateId === master.defaultStateId) || master.states[0];
  }

  // 2. CG 자산 매핑
  const cgAsset = activeState?.cgAssetId ? getCgAsset(activeState.cgAssetId) : undefined;
  const avatarUrl = cgAsset ? cgAsset.avatarUrl : (inStoryRef?.avatarUrl || '');
  const illustUrl = cgAsset?.illustUrl || inStoryRef?.illustUrl;

  // 3. 마스터 DB의 states 목록을 바탕으로 시점별 외형 variants 실시간 생성
  const variants: CharacterVisualVariant[] = master.states && master.states.length > 0
    ? master.states.map((st) => {
        const stAsset = st.cgAssetId ? getCgAsset(st.cgAssetId) : undefined;
        return {
          id: st.stateId,
          label: st.label,
          timePeriod: st.timePeriod,
          avatarUrl: stAsset ? stAsset.avatarUrl : (inStoryRef?.avatarUrl || ''),
          illustUrl: stAsset?.illustUrl || inStoryRef?.illustUrl,
          description: st.description
        };
      })
    : (inStoryRef?.variants || []);

  return {
    id: inStoryRef?.id || master.charId,
    nameKo: activeState?.overrideNameKo || master.nameKo,
    nameEn: activeState?.overrideNameEn || master.nameEn,
    faction: inStoryRef?.faction || activeState?.overrideFaction || master.defaultFaction,
    role: inStoryRef?.role || activeState?.overrideRole || master.defaultRole,
    avatarUrl,
    illustUrl,
    description: inStoryRef?.description || activeState?.description || master.baseBio,
    quote: inStoryRef?.quote || activeState?.defaultQuote,
    statusInChapter: inStoryRef?.statusInChapter || '',
    spoilerLevel: inStoryRef?.spoilerLevel ?? 1,
    variants: variants.length > 0 ? variants : inStoryRef?.variants
  };
}

/**
 * 스토리 캐릭터 바인딩 사양을 표준 CharacterRef 객체로 변환
 * 
 * @param binding 스토리에서 지정한 캐릭터 ID, 상태 ID 및 해당 챕터 전용 상황 오버라이드
 * @returns 뷰어 및 다운로더에서 즉시 렌더링 가능한 CharacterRef
 */
export function resolveStoryCharacter(binding: StoryCharacterBinding): CharacterRef {
  return resolveCharacterMaster(binding.charId, undefined, binding.stateId);
}

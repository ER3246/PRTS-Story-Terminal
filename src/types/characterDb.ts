/**
 * PRTS Story Terminal - 통합 캐릭터 마스터 데이터베이스 & CG 자산 시스템 타입 정의
 * 
 * 캐릭터 데이터 통합 1단계(Phase 1):
 * 1. CharacterCgAsset: 물리적 이미지 파일(1:1 아바타, 전신 일러스트) 자산 메타데이터
 * 2. CharacterState: 동일 캐릭터의 시점/전개/진영별 상태 분기 (유년기, 각성, 변장, 복장 등)
 * 3. CharacterMasterRecord: 외부 비노출 통합 캐릭터 원천 데이터
 */


/**
 * 캐릭터 CG 자산 카테고리
 */
export type CgAssetCategory = 
  | 'operator'       // 로도스 아일랜드 정규/협력 오퍼레이터
  | 'npc_named'     // 네임드 스토리 조연/주요 인물
  | 'npc_generic'   // 일반 주민/병사/폭도 등 공용 NPC
  | 'enemy'         // 보스 및 적대 세력 지휘관
  | 'silhouette';   // 전용 CG 미보유 인물용 전술 실루엣 플레이스홀더

/**
 * CG 자산 크롭 설정 (편집 UI에서 미세 조정 가능한 뷰포트 좌표)
 */
export interface CgCropConfig {
  x: number;     // 가로 중심점 (0~100, 기본 50)
  y: number;     // 세로 중심점 (0~100, 기본 50)
  zoom: number;  // 배율 (0.5~3.0, 기본 1.0)
}

/**
 * 물리적 이미지 자산 레코드 (Character CG Asset)
 */
export interface CharacterCgAsset {
  assetId: string;           // 고유 에셋 ID (e.g. 'cg_amiya', 'cg_alledale_child', 'cg_none')
  label: string;             // 에셋 명칭 (e.g. '아미야 기본', '알레데일 유년기', '전술 실루엣')
  category: CgAssetCategory; // 분류
  avatarFileName: string;    // 아바타 파일명 (e.g. 'amiya.png', ''이면 실루엣)
  avatarUrl: string;         // 웹 접근 URL (e.g. '/images/characters/amiya.png')
  illustFileName?: string;   // 전신 일러스트 파일명 (e.g. 'amiya.png')
  illustUrl?: string;        // 전신 일러스트 URL (e.g. '/images/characters/illust/amiya.png')
  cropConfig: CgCropConfig;  // 1:1 아바타 기본 뷰포트 크롭 매개변수 (CSS transform용)
  illustCropConfig?: CgCropConfig; // 전신 일러스트 기준 크롭 뷰포트 좌표 (편집 스튜디오 재로드 시 100% 복원용)
  isSharedOrBorrowed?: boolean; // 다른 인물과 임시 공유/재사용 중인 에셋인지 여부
  notes?: string;            // 관리자 메모 (교체 예정, 원화 출처 등)
  isUserEdited?: boolean;    // 사용자가 스튜디오에서 직접 크롭 또는 일러스트를 수동 조정한 자산 (일괄 자동화 시 최우선 보호)
  userEditedAt?: string;     // 사용자 직접 수정 일시 (ISO String)
}

/**
 * 캐릭터 상태/시점 분기 (Character State)
 * 
 * 한 캐릭터가 스토리 전개, 시점(과거 회상 등), 진영 변경 등에 따라 다른 모습을 가질 때 분기 정의.
 */
export interface CharacterState {
  stateId: string;              // 상태 식별자 (e.g. 'default', 'guard', 'child', 'snake_possessed')
  label: string;                // 상태 라벨 (e.g. '기본 (캐스터)', '영혼의 검 (가드)', '26년 전 유년기')
  cgAssetId: string;            // 연결된 CG 자산 ID (CharacterCgAsset.assetId)
  timePeriod?: string;          // 시점 연대 (e.g. '테라력 1072년', '테라력 1098년')
  overrideNameKo?: string;      // 상태별 표기 이름 (e.g. '아미야 (가드)', '탈룰라 (불사의 뱀)')
  overrideNameEn?: string;      // 상태별 영문명
  overrideFaction?: string;     // 상태별 소속 진영 (e.g. '리유니온' -> '카즈델 군사위원회')
  overrideRole?: string;        // 상태별 직함 (e.g. '총괄 리더' -> '영혼의 검의 계승자')
  description: string;          // 해당 상태에서의 캐릭터 설정/상황 설명
  defaultQuote?: string;        // 해당 상태의 대표 대사
  appearances: string[];        // 해당 상태로 등장하는 스토리 ID 목록 (e.g. ['ep08'])
  isSilhouetteOnly?: boolean;   // 전용 CG 없이 실루엣으로 표기되는 상태인지 여부
  isSharedCg?: boolean;         // 공용 NPC 또는 타 캐릭터 CG를 임시 차용 중인지 여부
  notes?: string;               // 세부 메모
}

/**
 * 통합 캐릭터 마스터 레코드 (Character Master Record)
 * 
 * 20개 전체 스토리에서 참조하는 단일 진실 공급원(SSOT) 캐릭터 엔티티.
 */
export interface CharacterMasterRecord {
  charId: string;               // 고유 캐릭터 ID (e.g. 'amiya', 'talulah', 'doctor')
  nameKo: string;               // 기본 공식 한국어 명칭
  nameEn: string;               // 기본 영문 명칭
  defaultFaction: string;       // 기본 소속 진영 (로도스 아일랜드, 빅토리아 등)
  defaultRole: string;          // 기본 직책/역할
  baseBio: string;              // 인물 종합 프로필 (배경 서사)
  tier: 'protagonist' | 'major' | 'supporting' | 'npc_named' | 'npc_generic';
  defaultStateId: string;       // 기본 상태 ID ('default' 등)
  states: CharacterState[];     // 상태 목록 (최소 1개 이상)
  aliases?: string[];           // 별칭, 이명 및 중복 ID 매핑 (e.g. ['astrogenes', 'anthony', 'leto'])
  notes?: string;               // 통합 관리용 메모
}

/**
 * 개별 스토리 파일에서 마스터 DB 캐릭터를 참조하여 오버라이드할 때 사용하는 사양
 */
export interface StoryCharacterBinding {
  charId: string;               // 마스터 DB charId
  stateId?: string;             // 사용할 상태 ID (미지정 시 defaultStateId)
  overrideRole?: string;        // 해당 챕터 작전에 한정된 직책 오버라이드
  statusInChapter: string;      // 해당 챕터에서의 현재 상황/임무 (e.g. '탈출 작전 지휘')
  quoteInStory?: string;        // 해당 챕터의 인게임 명대사
  overrideDescription?: string; // 해당 챕터 스포일러 방지 설명 오버라이드
  spoilerLevel?: number;        // 스포일러 허용 레벨
}

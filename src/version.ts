export const APP_VERSION = '0.9.2';
export const APP_VERSION_CODE = 'v0.9.2';
export const APP_RELEASE_STAGE = 'Pre-Release';
export const APP_BUILD_DATE = '2026.10.18';

export interface ChangelogEntry {
  version: string;
  stage: string;
  date: string;
  title: string;
  highlights: string[];
  isCurrent?: boolean;
  isPlanned?: boolean;
}

export const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: 'v1.0.0',
    stage: 'Planned Official Launch',
    date: '정식 공개 예정',
    title: 'PRTS 스토리 아카이브 정식 공개 릴리스',
    highlights: [
      '전체 작전 요약본 수록 완결 및 공식 연대기 종합 검증 완료',
      '로컬 스토리지 기반 마지막 열람 위치 저장 및 독서 진행률(Progress Tracker) 기능',
      '독립 커스텀 도메인 연동 및 PWA(프로그레시브 웹 앱) 오프라인 열람 지원',
    ],
    isPlanned: true,
  },
  {
    version: 'v0.9.2',
    stage: 'Current Pre-Release',
    date: '2026.10.18',
    title: '모바일 심화 최적화 & UX 결함 해결 통합 패치',
    highlights: [
      "테라 지도 '넓게 보기' 시 하단 Three.js 캔버스 리사이즈 갭(검은 여백) 완전 해결 (ResizeObserver 연동)",
      '거점 프리뷰 카드와 지역 상세 패널 간 상호 배타적 닫기 제어로 팝업 겹침 방지',
      '모바일 바텀 시트 상단 핸들 바 터치 슬라이드(드래그 다운) 제스처 구현 (스와이프로 즉시 닫기 지원)',
      '넓게 보기 모드 시 지도 및 타임라인 불필요한 툴바 자동 축소 (화면 100% 몰입 뷰 제공)',
      '스토리 상세 스테이지 헤더 2단 반응형 분리 레이아웃으로 모바일/PC 텍스트 과도한 줄바꿈 방지',
      "모바일 '스토리 색인' 플로팅 버튼을 독서 방해 없는 40×40px 컴팩트 햄버거 아이콘 버튼으로 교체",
      '사이트 전반 버전 표기 시스템(GNB 배지, 홈 대시보드, 푸터, 인앱 체인지로그 탭) 구축',
    ],
    isCurrent: true,
  },
  {
    version: 'v0.9.1',
    stage: 'Pre-Release',
    date: '2026.10.18',
    title: '모바일 네이티브 UI 그래머 개편 및 사용성 혁신',
    highlights: [
      '모바일 뷰포트 맞춤형 4대 하단 탭 바 (메인 · 스토리 상세 · 스토리 목록 · 테라 지도) 도입',
      '모바일 터치 오동작 방지 2단계 프리뷰 미니 카드 및 하단 바텀 시트 서랍 도입',
      '3D 테라 지도 360° 수평 회전 슬라이더 바 및 상단 메뉴 접기/복원(넓게 보기) 기능 추가',
      '사이트 전반 어색한 AI 어투 UI 텍스트 정제 및 간소화',
    ],
  },
  {
    version: 'v0.9.0',
    stage: 'Pre-Release',
    date: '2026.10.18',
    title: '사전 배포 품질 검수 및 GitHub Pages 자동 연동',
    highlights: [
      '익명 GitHub 계정(ER3246) 퍼블릭 원격 저장소 및 GitHub Pages CI/CD 파이프라인 구축',
      '인게임 공식 리소스 전수 저작권 자동 워터마크(© HYPERGRYPH / YOSTAR) 컴포넌트 탑재',
      '테라 지도 거점/지명 한국 서버 공식 설정 전수 교정 (10개 거점 및 7개 작전 기동 궤적)',
      '저작권 고지, AI 콘텐츠 면책, 조작 가이드 안내 모달(InfoLicenseModal) 구현',
      '개인정보 격리 및 로컬 절대경로 전수 제거, .gitignore 보안 필터링 강화',
    ],
  },
  {
    version: 'v0.8.0',
    stage: 'Milestone Alpha',
    date: '2026.10',
    title: '오디오 텔레메트리 & 마크다운 내보내기 허브',
    highlights: [
      'Web Audio API 기반 PRTS 기계음 효과음 시스템 (탭 전환, 버튼 클릭, 개폐 SFX) 탑재',
      '공식 용어 사전(Canon Glossary) 툴팁 및 작전 보고서 마크다운(.md) 내보내기 기능 구현',
      '전체 마스터 보고서 일괄 다운로드 허브(ReviewExportModal) 추가',
    ],
  },
  {
    version: 'v0.7.0',
    stage: 'Milestone Alpha',
    date: '2026.10',
    title: '3D 테라 전술 지도(Terra Tactical Cartography) 엔진',
    highlights: [
      'Three.js WebGL 기반 3D 절차적 헥사곤 대륙 지형 렌더러 탑재',
      '22개 국가 영역 와이어프레임, 27개 핵심 이동도시 거점, 18대 작전 기동 궤적 3D 베지에 곡선 투영',
      '2D 평면도/3D 투영 전환 및 60fps 부드러운 오빗 카메라 시스템 구현',
    ],
  },
  {
    version: 'v0.5.0',
    stage: 'Prototype',
    date: '2026.10',
    title: '크로니클 연대기 로드맵 & 90대 전 스토리 아카이브',
    highlights: [
      '명일방주 테라 연대기(Terra: A Journey) 공식 설정 기반 90대 작전 분류 체계 구축',
      '시간순(Chronological), 서사 계통별(Story Line), 출시순(Release) 3대 탐색 모드 도입',
      '선행/후속/교차 인과 서사 연결망(Cross-Lore Linkage) 시각화',
    ],
  },
  {
    version: 'v0.3.0',
    stage: 'Prototype',
    date: '2026.09',
    title: '에피소드 확장 및 오퍼레이터 프로필 도감',
    highlights: [
      '메인 테마 0~3지 및 주요 사이드 스토리 시놉시스 수록',
      '인물 도감(SideDrawer) 및 세력별 오퍼레이터 아바타 연동',
      '원문 CG 라이트박스(LightboxModal) 확대 기능 추가',
    ],
  },
  {
    version: 'v0.1.0',
    stage: 'Initial Concept',
    date: '2026.09',
    title: 'PRTS 스토리 터미널 초기 프로토타입 (POC)',
    highlights: [
      'PRTS 콘솔 테마 기본 UI 및 단일 스토리 열람기 프로토타입 개발',
      'React + Tailwind CSS 기반 터미널 스타일 와이어프레임 구축',
      '흑백/앰버 톤 텍스트 뷰어 및 기본 폰트 시스템 구축',
    ],
  },
];

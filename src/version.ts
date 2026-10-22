export const APP_VERSION = '0.3.5';
export const APP_VERSION_CODE = 'v0.3.5';
export const APP_RELEASE_STAGE = 'Pre-Release';
export const APP_BUILD_DATE = '2026.10.22';

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
      '독립 커스텀 도메인 연동 및 오프라인 캐시 심화',
    ],
    isPlanned: true,
  },
  {
    version: 'v0.3.5',
    stage: 'Current Pre-Release',
    date: '2026.10.22',
    title: '스토리 통합 플로팅 네비게이션 독 & UI 단축 정리 및 버전 체계 합리화',
    highlights: [
      '스토리 뷰어 통합 하단 플로팅 네비게이션 독(Floating Dock) 구축: 스크롤 추종형 바에서 [이전 파트/작전], [다음 파트/작전], [상단 이동 ↑]을 원클릭으로 조작',
      '중앙 퀵 파트 색인 드롭업 팝오버 연동: 본문 어디서든 현재 위치를 확인하고 원하는 파트나 개요로 즉시 점프 가능',
      '단일 스토리/멀티파트/옴니버스 완벽 호환: 서사 구조에 맞추어 버튼 라벨 및 다음/이전 대상이 유기적으로 자동 전환',
      '스토리 상세 독서 몰입 모드(UI 단축) 추가: 플로팅 독에서 상단 메뉴를 원클릭으로 접고 펼칠 수 있도록 연동',
      '상단 헤더 중복 UI 단축 버튼 제거 및 아이콘 직관화: 전체화면(브라우저 창)과 UI 단축(상단 메뉴 접기/복원)의 역할 및 아이콘 분리',
      '버전 관리 체계 현실화 및 재조정: 기존 임의로 비약된 버전(v0.10.0)을 실제 개발 단계와 패치 번호에 맞추어 v0.3.5로 촘촘히 재정렬',
    ],
    isCurrent: true,
  },
  {
    version: 'v0.3.4',
    stage: 'Pre-Release',
    date: '2026.10.21',
    title: '모바일 제스처 조작성 혁신 & 데이터베이스 무결성 감사 패치',
    highlights: [
      '테라 연대기(Chronicle) 모바일 2손가락 핀치 줌(0.45배~1.6배) 및 핀치 중심점 이동(Pan) 제스처 구현',
      '테라 지도 2D 뷰 1:1 드래그 밀착: 원근 투영 픽셀-월드 환산 및 즉각 댐핑(damp=1.0)으로 미끄러짐/오버슈트 완전 해결',
      '테라 지도 3D 뷰 제스처 우세 축 잠금(Threshold Locking): 구글 어스/애플 지도 표준 알고리즘 도입으로 줌 시 각도 틀어짐 방지',
      '모바일 가로(Landscape) 화면 최적화: 3D 엠블럼/라벨 52% 압축, 툴바 슬림화 및 줌아웃 시 마이너 거점 숨김 처리',
      '맨스필드 브레이크 Part 2 아크 누락 복구 및 validate_stories 검증기 내 시리즈 탭-아크 자동 동기화 룰 추가',
      '테라 지도 남동쪽 심해 고립 노이즈 타일 제거 및 공식 설정 지명 전수 교정',
    ],
  },
  {
    version: 'v0.3.3',
    stage: 'Pre-Release',
    date: '2026.10.21',
    title: 'PWA 웹 앱 설치 시스템 & 브라우저 전체화면 지원',
    highlights: [
      'PWA 웹 앱 설치 지원: manifest.json 및 서비스 워커(sw.js) 구축으로 모바일·데스크톱 독립 앱 설치 및 구동 지원',
      '브라우저 전체화면 시스템 탑재: 주소창/툴바 완전 숨김 전체화면 토글 및 iOS(홈 화면 추가)/Android 크롬 가이드 제공',
      '서비스 권장 환경(크로미움·하드웨어 가속·Wi-Fi) 안내 모달 및 뒤로가기/앞으로가기 브라우저 해시 히스토리 연동',
    ],
  },
  {
    version: 'v0.3.2',
    stage: 'Pre-Release',
    date: '2026.10.21',
    title: '메인 테마 Act II [EP 09 스톰워치] 대규모 신규 편입',
    highlights: [
      '메인 테마 Act II [EP 09 스톰워치] 신규 편입: 4개 파트, 12개 스테이지 전편 8,442자 심층 서사 수록',
      '한국 서버 공식 스크립트 기반 14종 고화질 씬 CG, 36종 핵심 명대사, 21명 등장인물 및 전신 일러스트 10종 연동',
      '빅토리아 연대기 라인 및 런디니움 정세 인과 서사 연결망 확장',
    ],
  },
  {
    version: 'v0.3.1',
    stage: 'Pre-Release',
    date: '2026.10.18',
    title: '모바일 심화 최적화 & Three.js 캔버스 갭 결함 수정',
    highlights: [
      "테라 지도 '넓게 보기' 시 하단 Three.js 캔버스 리사이즈 갭(검은 여백) 완전 해결 (ResizeObserver 연동)",
      '거점 프리뷰 카드와 지역 상세 패널 간 상호 배타적 닫기 제어로 팝업 겹침 방지',
      '모바일 바텀 시트 상단 핸들 바 터치 슬라이드(드래그 다운) 제스처 구현 (스와이프로 즉시 닫기 지원)',
      '스토리 상세 스테이지 헤더 2단 반응형 분리 레이아웃으로 텍스트 과도한 줄바꿈 방지',
    ],
  },
  {
    version: 'v0.3.0',
    stage: 'Pre-Release',
    date: '2026.10.18',
    title: '모바일 네이티브 UI 그래머 개편 및 4대 탭 바 구축',
    highlights: [
      '모바일 뷰포트 맞춤형 4대 하단 탭 바 (메인 · 스토리 상세 · 스토리 목록 · 테라 지도) 도입',
      '모바일 터치 오동작 방지 2단계 프리뷰 미니 카드 및 하단 바텀 시트 서랍 도입',
      '3D 테라 지도 360° 수평 회전 슬라이더 바 추가',
      '사이트 전반 어색한 AI 어투 UI 텍스트 정제 및 간소화',
    ],
  },
  {
    version: 'v0.2.2',
    stage: 'Pre-Release',
    date: '2026.10.18',
    title: '사전 배포 품질 검수 및 GitHub Pages 자동 연동',
    highlights: [
      '익명 GitHub 계정(ER3246) 퍼블릭 원격 저장소 및 GitHub Pages CI/CD 파이프라인 구축',
      '인게임 공식 리소스 전수 저작권 자동 워터마크(© HYPERGRYPH / YOSTAR) 컴포넌트 탑재',
      '테라 지도 거점/지명 한국 서버 공식 설정 전수 교정 (10개 거점 및 7개 작전 기동 궤적)',
      '저작권 고지, AI 콘텐츠 면책, 조작 가이드 안내 모달(InfoLicenseModal) 구현',
    ],
  },
  {
    version: 'v0.2.1',
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
    version: 'v0.2.0',
    stage: 'Milestone Alpha',
    date: '2026.10',
    title: '3D 테라 전술 지도 & 크로니클 연대기 로드맵 엔진',
    highlights: [
      'Three.js WebGL 기반 3D 절차적 헥사곤 대륙 지형 렌더러 탑재',
      '22개 국가 영역 와이어프레임, 27개 핵심 이동도시 거점, 18대 작전 기동 궤적 3D 베지에 곡선 투영',
      '명일방주 테라 연대기(Terra: A Journey) 공식 설정 기반 90대 작전 분류 체계 및 시간순/노선별/출시순 3대 탐색 모드 도입',
    ],
  },
  {
    version: 'v0.1.1',
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

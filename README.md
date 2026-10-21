# PRTS Story Terminal // 명일방주 전술 스토리 아카이브

<p align="left">
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/version-v0.10.0--pre--release-ffe600.svg?style=flat-square&logo=git&logoColor=black" alt="Version"></a>
  <img src="https://img.shields.io/badge/license-Non--Profit%20Fan%20Archive-00d8ff.svg?style=flat-square" alt="Non-Profit Fan Archive">
  <img src="https://img.shields.io/badge/copyright-%C2%A9%20HYPERGRYPH%20%2F%20YOSTAR-27272a.svg?style=flat-square&logoColor=white" alt="Copyright">
  <img src="https://img.shields.io/badge/AI%20Summary-2nd%20Derivative-orange.svg?style=flat-square" alt="AI Summary">
  <img src="https://img.shields.io/badge/stack-React%2019%20%7C%20Three.js%20%7C%20Tailwind%20CSS-blue.svg?style=flat-square" alt="Tech Stack">
</p>

> **명일방주(Arknights) 비공식 · 비영리 팬 스토리 아카이브 및 3D 테라 전술 터미널**  
> **Unofficial & Non-Profit Fan Story Archive & 3D Terra Tactical Terminal for Arknights**  
>  
> 🔗 **Live Terminal (GitHub Pages):** [https://er3246.github.io/PRTS-Story-Terminal/](https://er3246.github.io/PRTS-Story-Terminal/)

> [!IMPORTANT]
> **비영리 팬 프로젝트 및 저작권 귀속 요약 (Non-Profit & Copyright Summary)**
>
> * 본 프로젝트는 **《명일방주(Arknights)》**의 세계관과 서사를 정리한 **비공식·비영리 팬 제작 웹 애플리케이션**이며, 공식 개발사 및 퍼블리셔와 아무런 제휴 관계가 없습니다.
> * 사이트에 사용된 모든 **인게임 시각 리소스(컷신 CG, 배경, 로고, 아바타), 고유명사, 세계관 설정 및 원문 시나리오의 지식재산권(IP)은 전적으로 원저작권자(© HYPERGRYPH / STUDIO MONTAGNE / YOSTAR)**에게 귀속됩니다.
> * 사이트 내 모든 공식 이미지 우측 하단에는 저작권 워터마크(`© HYPERGRYPH / YOSTAR`)가 자동 표기되며, 원저작권자의 수정·삭제 요청 시 즉각 조치합니다.

> [!WARNING]
> **AI 기반 개발 및 스토리 요약 면책 고지 (AI-Generated Content Disclaimer)**
>
> * 본 사이트는 AI 코딩 에이전트를 활용해 개발되었으며, 수록된 **스토리 요약문, 스테이지 브리핑, 인물 행적 및 사후 전술 분석은 AI 에이전트 파이프라인을 통해 생성·요약된 2차 가공물**입니다.
> * 한국 서버(`ko_KR`) 공식 고유명사 대조 검수를 거쳤으나, AI 요약의 특성상 **원작의 세부 맥락과 다른 해석, 오표기, 번역 차이, 서사 압축에 따른 누락 또는 환각(Hallucination)**이 언제든 존재할 수 있습니다. 가장 정확한 공식 스토리는 반드시 **《명일방주》 인게임 아카이브**를 통해 확인해 주시기 바랍니다.

## 1. 프로젝트 소개 (Project Overview)

### 🇰🇷 한국어

**PRTS Story Terminal**은 모바일 전략 디펜스 게임 《명일방주(Arknights)》의 메인 테마(Main Theme), 인터메조(Intermezzi), 사이드 스토리(Side Story), 미니 시리즈(Vignette)를 로도스 아일랜드의 **PRTS(Primitive Rhodes Island Terminal System) 전술 콘솔 인터페이스**로 재구성하여 열람할 수 있도록 제작된 비영리 팬 아카이브 웹 애플리케이션입니다.

| 핵심 모듈 | 주요 기능 및 아키텍처 특징 |
| ----- | ----- |
| **2-Tier 작전 보고서 뷰어**<br>*(Story Archive Viewer)* | • **파트(Part) ➔ 스테이지(Stage) 2계층 구조:** 인게임 작전 노드 단위의 정밀 요약 및 핵심 대사 인용<br>• **시각 자료 연동:** 스테이지 문맥에 매핑된 인게임 컷신 CG, 배경 프리뷰 및 저작권 배지 자동 오버레이<br>• **사후 전술 분석 & 도감:** 작전 종합 평가, 등장인물(Personnel Dossier) 및 세계관 용어(Glossary) 연동 |
| **테라 연대기 로드맵**<br>*(Chronicle Roadmap)* | • **서사 계보 뷰 (Storyline Lineage):** 메인 테마 1~2부, 쉐이(염국), 에기르·시본, 카시미어, 라인 랩 등 세력별 계보 시각화<br>• **테라력 연표 뷰 (Chronological Order):** 테라력 1089년~1102년 시간순 사건 흐름 정리<br>• **출시 연차 뷰 (Release Order):** 한국·글로벌 서버 이벤트 출시 순서 기반 탐색 |
| **3D 테라 전술 지도**<br>*(Terra Tactical Map)* | • **WebGL (Three.js) 지형 렌더링:** 3D 헥사곤 타일 고저차 지형 및 전술 홀로그램 셰이더 구현<br>• **거점 및 국가 네트워크:** 22개 주요 국가·권역 폴리곤, 27개 핵심 이동도시·거점 비콘 수록<br>• **18대 작전 기동 경로:** 주요 스토리의 병력 이동 및 사건 궤적을 3D 베지어 곡선으로 시뮬레이션 |

### 🌐 English

**PRTS Story Terminal** is an **unofficial, non-profit fan-made web archive** designed to catalog and visualize the Main Theme chapters, Intermezzi, Side Stories, and Vignette anthologies of ***Arknights*** through an interactive **PRTS (Primitive Rhodes Island Terminal System) tactical terminal interface**.

* **2-Tier Operation Report Viewer:** Hierarchical narrative breakdown (`Multi-Part Arc` ➔ `Stage Node`) featuring stage-by-stage summaries, canonical dialogue quotes, synchronized in-game cutscene CGs with automatic copyright watermarks, post-operation tactical evaluations, and interactive character/glossary dossiers.
* **Chronicle Roadmap:** Multi-perspective timeline supporting Faction Storyline Lineage, Terra Chronological Order (1089–1102), and Service Release Order.
* **3D Terra Tactical Map:** WebGL (Three.js) 3D hexagonal topographic map featuring 22 nations/territories, 27 major mobile cities & outposts, and 18 animated operational route trajectories.

---

## 2. 저작권 및 리소스 보호 정책 (Copyright & Asset Protection Policy)

### 🇰🇷 한국어

1. **비공식 · 비영리 운영 원칙:**  
   본 웹사이트는 《명일방주(Arknights)》의 세계관과 서사를 연구·감상하기 위해 제작된 **비공식(Unofficial) 팬 프로젝트**입니다. 공식 개발사 및 퍼블리셔와 무관하며, 어떠한 형태의 상업적 목적, 광고 게재, 유료 결제, 후원금 모금도 일절 추구하지 않습니다.

2. **지식재산권(IP) 귀속 명시:**  
   본 프로젝트에 포함된 모든 **인게임 이미지 리소스(컷신 CG, 배경 일러스트, 진영 엠블럼, 캐릭터 아바타), 세계관 설정, 고유명사 및 원문 시나리오의 저작권과 지식재산권은 전적으로 원저작권자**에게 귀속됩니다:
   * **© HYPERGRYPH (上海鹰角网络科技有限公司 / 鷹角網絡)**
   * **© STUDIO MONTAGNE**
   * **© YOSTAR (주식회사 요스타)**

3. **인게임 리소스 보호 및 제3자 무단 재배포 금지:**
   * 사이트 내에서 렌더링되는 모든 공식 이미지의 우측 하단 모서리에는 **`© HYPERGRYPH / YOSTAR`** 저작권 배지가 자동으로 오버레이되며, 무단 드래그 및 우클릭 저장 방지 속성이 적용되어 있습니다.
   * 방문자 및 제3자가 본 저장소(`public/images/`, `src/data/` 등)에 수록된 공식 게임 에셋이나 스토리 데이터를 무단으로 추출·복제·재배포하거나 상업적 용도로 이용하는 행위를 엄격히 금지합니다.

4. **권리자 요청 시 즉각 조치 (Takedown Policy):**  
   원저작권자(Hypergryph / Studio Montagne / Yostar)로부터 리소스 사용 중단이나 게시물 수정·삭제 요청이 있을 경우, 즉시 해당 콘텐츠를 삭제하거나 저장소 및 사이트를 비공개 전환합니다.

### 🌐 English

1. **Unofficial & Strictly Non-Profit:**  
   This web application is an **unofficial fan-made archive** and is **not** affiliated with, endorsed, sponsored, or approved by the official developers or publishers of *Arknights*. It is operated strictly on a **non-profit, non-commercial basis** with zero monetization, advertisements, or donations.

2. **Exclusive IP Ownership:**  
   All in-game visual assets (cutscene CGs, background illustrations, faction emblems, character avatars), worldbuilding lore, proper nouns, and original scenario texts are the exclusive property and copyright of their respective owners:
   * **© HYPERGRYPH**
   * **© STUDIO MONTAGNE**
   * **© YOSTAR**

3. **Asset Watermarking & Prohibition of Redistribution:**
   * Every in-game image displayed on the site automatically renders a **`© HYPERGRYPH / YOSTAR`** copyright badge in the bottom-right corner and enforces drag/context-menu protection.
   * Extracting, redistributing, or commercially using the official game assets or lore data contained within this repository (`public/images/`, `src/data/`) by third parties is strictly prohibited.

4. **Immediate Takedown Compliance:**  
   Upon any request from the copyright holders (Hypergryph / Studio Montagne / Yostar), any specified assets or the entire repository and website will be immediately modified, removed, or taken offline.

---

## 3. AI 개발 및 스토리 요약 면책 조항 (AI Development & Content Disclaimer)

### 🇰🇷 한국어

* **AI 에이전트 기반 개발 및 요약 가공 안내:**  
  본 웹사이트의 프론트엔드 UI/UX 코드 구현뿐만 아니라, 사이트 내에 수록된 **스토리 요약문, 스테이지별 브리핑, 작전 사후 분석, 인물 및 용어 해설 데이터는 AI 에이전트 파이프라인을 통해 생성·요약된 2차 가공물**입니다.

* **오류 · 오표기 및 해석 차이 가능성 고지:**  
  한국 서버(`ko_KR`) 공식 번역 명칭과 원문 흐름을 준수하기 위해 교차 검수를 진행하고 있으나, AI 에이전트 요약의 구조적 특성상 **원작의 세부 맥락과 다른 해석, 고유명사 오표기, 번역상의 차이, 분량 압축에 따른 서사 누락, 또는 AI 환각(Hallucination)으로 인한 사실 오류**가 언제든 존재할 수 있습니다.

* **공식 원문 확인 권장:**  
  본 사이트의 요약본은 방대한 서사 흐름을 빠르게 파악하기 위한 보조 참고 자료로만 활용해 주시고, 정확한 공식 스토리와 대사는 반드시 《명일방주》 인게임 아카이브(기록 복원 및 정보 처리실)를 통해 확인해 주시기 바랍니다.

### 🌐 English

* **AI-Assisted Development & Summarization:**  
  Both the frontend application code and the **story summaries, stage briefings, tactical evaluations, and lore descriptions** featured on this platform are **secondary derivative summaries generated and processed via an AI agent pipeline**.

* **Accuracy & Hallucination Disclaimer:**  
  Although cross-checked against official Korean server (`ko_KR`) terminology and script flows, AI-generated summaries may inherently contain **interpretive discrepancies, typographical errors, translation differences, narrative omissions due to compression, or AI hallucinations** that deviate from official canon.

* **Official Source Recommendation:**  
  Please treat the contents of this archive solely as a supplementary reference and consult the **official *Arknights* game client** for the definitive canonical text and scenario experience.

---

## 4. 전술 터미널 및 3D 지도 조작 가이드 (Controls Guide)

데스크톱(PC) 마우스·키보드 환경과 모바일·태블릿 터치 환경을 자동으로 감지하여 최적화된 조작계를 제공합니다.

| 조작 기능 | 🖥️ PC (마우스 & 키보드) | 📱 모바일 & 태블릿 (터치스크린) |
| ----- | ----- | ----- |
| **지도 화면 이동 (Pan)** | 마우스 좌클릭 드래그 또는 `방향키(↑/↓/←/→)` | **한 손가락 드래그** (1-Finger Drag) |
| **지도 확대 / 축소 (Zoom)** | 마우스 휠 스크롤 또는 우측 하단 `[+]` / `[-]` 버튼 | **두 손가락 핀치 줌** (2-Finger Pinch) 또는 우측 하단 `[+]` / `[-]` 버튼 |
| **거점 · 경로 정보 확인** | 거점 비콘 / 경로 라인 마우스 호버 및 클릭 | 거점 비콘 / 경로 라인 **1회 탭(Tap)** ➔ 요약 미니 카드 표시 |
| **연관 작전 보고서 진입** | 거점 클릭 또는 우측 브리핑 패널에서 작전 선택 | 요약 미니 카드 내 **`[작전 기록 열람]`** 버튼 탭 |
| **시점 초기화 / 라이선스 안내** | 우측 하단 `[⟳]` 리셋 버튼 / 상단 `[ⓘ INFO / LICENSE]` | 우측 하단 `[⟳]` 리셋 버튼 / 상단 `[ⓘ INFO / LICENSE]` |

---

## 5. 기술 스택 및 로컬 실행 방법 (Tech Stack & Local Setup)

* **Frontend Framework:** React 19, TypeScript
* **Styling & UI:** Tailwind CSS v4, Lucide React Icons
* **3D Graphics & Map:** Three.js (WebGL Custom Hexagonal Terrain & Bezier Trajectory System)
* **Build & Deployment:** Vite 8, GitHub Actions (GitHub Pages Automated CI/CD)
* **Version & Changelog:** [CHANGELOG.md](CHANGELOG.md) (`v0.10.0` Pre-Release)

```bash
# 1. 의존성 패키지 설치 (Install dependencies)
npm install

# 2. 로컬 개발 서버 실행 (Start local development server)
npm run dev

# 3. 프로덕션 정적 빌드 및 무결성 검증 (Production build & type-check)
npm run build

# 4. 로컬 프로덕션 빌드 프리뷰 (Preview production build locally)
npm run preview
```

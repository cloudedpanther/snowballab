# Snowballlab SPEC

## 프로젝트 목표/배경/원칙

- 목표: “복리 계산기(Compound Interest Calculator)” 기반의 유틸 웹사이트를 만들어 AdSense 수익화를 시도한다.
- 배경: 단일 계산기만으로는 가치 낮음으로 거절될 수 있으므로 계산기 + 설명/가이드/FAQ + 신뢰 페이지(About/Contact/Privacy)로 최소 구조를 갖춘다.
- 원칙:
  - AI 주도 + 사용자 최소 수정, 단계적(Stage) 진행.
  - 각 Stage는 범위 내 작업만 수행, 산출물에는 반드시 검사 명령어 포함.
  - 불확실한 사항은 기본값으로 결정 후 TODO로 기록.
  - npm만 사용(pnpm/yarn 금지).
  - 정적 빌드(dist) 중심, GitHub Pages base path 고려.
  - 기본 품질 규칙: `any` 사용 금지(명시적 any), 타입 오류는 즉시 해결.

## IA(페이지 구조)

- `/`: 복리 계산기 + 결과 + 설명/가이드/주의사항/FAQ 섹션 + 예시 시나리오 버튼
- `/about`: 사이트 목적/운영자/면책
- `/contact`: 문의 방법(이메일 또는 간단 폼)
- `/privacy`: 개인정보/쿠키/광고 정책(AdSense/Analytics 가능성 포함)
- `/guides`: 가이드 글 목록
- `/guides/[slug]`: 가이드 글 상세(Markdown 기반)

## MVP 기능(복리 계산기 1차)

- 입력: 원금, 연 수익률(%), 기간(년), 복리 주기(연/월/일)
- 출력: 최종 금액, 총 이익, 연도별 간단 테이블(가능하면)
- 예시 시나리오 3개 버튼(입력 자동 채움)
- URL 쿼리스트링으로 입력값 저장/복원
- “투자 조언 아님” 면책 문구

## 배포 전제 및 추후 이전 고려

- GitHub Pages 우선: 정적 빌드 산출물 `dist` 중심.
- base path(예: `/snowballlab/`) 고려하여 라우팅/asset 경로 깨짐 방지.
- 향후 AWS 이전 가능하도록 프레임워크/라우팅 전략을 정적 호스팅 친화적으로 유지.
- 배포 자동화는 GitHub Actions를 염두에 두되 Stage 범위 내에서만 적용.

## Stage 정의(0~5)

### Stage 0: 기준 문서 확정

- 목표: 프로젝트 원칙/범위/Stage 정의 문서화
- 산출물: `SPEC.md`, `PROMPTS.md`
- 검사 기준(DoD): 문서가 모든 요구사항을 반영하고 범위/금지 사항 명시
- 커밋 메시지 예시: `docs: add project spec and stage prompts`

### Stage 1: 스캐폴딩/기본 레이아웃

- 목표: Astro + React islands + Tailwind 기반 초기 구조 구축
- 산출물: 기본 페이지 라우팅, 레이아웃, 글로벌 스타일, base path 대응 설계 반영
- 검사 기준(DoD): 로컬 개발 서버 실행, 각 필수 페이지 렌더 확인
- 커밋 메시지 예시: `chore: scaffold astro site with base path support`

### Stage 2: 복리 계산기 MVP

- 목표: 계산 로직 분리 + UI 구축
- 산출물: 입력 폼, 결과 영역, 예시 시나리오 버튼
- 검사 기준(DoD): 입력값 변경 시 결과 정상 계산, 엣지 케이스 기본 처리
- 커밋 메시지 예시: `feat: add compound interest calculator MVP`

### Stage 3: 공유/SEO/배포 준비

- 목표: 쿼리스트링 공유 + SEO 기본 + 배포 워크플로(선택)
- 산출물: 쿼리스트링 직렬화/복원, 메타/사이트맵/robots, GH Pages 배포 워크플로(범위 내)
- 검사 기준(DoD): 쿼리스트링으로 상태 복원, SEO 파일 생성 확인
- 커밋 메시지 예시: `feat: add shareable URLs and basic SEO`

### Stage 4: 승인용 콘텐츠 보강

- 목표: 홈 가이드/FAQ 강화 + 가이드 글 5개 추가
- 산출물: `/guides` 목록, `/guides/[slug]` 5개 글, 홈 콘텐츠 보강
- 검사 기준(DoD): 5개 가이드 렌더, 홈 섹션 채움
- 커밋 메시지 예시: `content: add guides and expand FAQ`

### Stage 5: AdSense 통합

- 목표: AdSense 스크립트 통합(승인 후), 환경변수로 on/off
- 산출물: 광고 스크립트 조건부 로딩
- 검사 기준(DoD): 환경변수로 광고 on/off 정상 동작
- 커밋 메시지 예시: `feat: add adsense integration toggle`

## 완료 정의(DoD) 체크리스트

- Stage 0: 문서 충족(요구사항/범위/금지/검사/커밋 예시 포함)
- Stage 1: 기본 페이지 렌더, base path 고려, npm 스크립트 정상
- Stage 1 추가 품질: `npm run check` 통과(포맷/린트/타입체크)
- Stage 2: 계산기 입력/출력/예시 버튼 동작
- Stage 3: 쿼리스트링 복원, SEO 파일 생성, 배포 준비 요소 존재
- Stage 4: 가이드 5개/FAQ/홈 콘텐츠 강화 완료
- Stage 5: 광고 on/off 환경변수로 제어

## 범위 밖(하지 말 것)

- 백엔드 구축, 로그인/회원가입, 결제/구독 시스템
- 데이터베이스/서버리스 함수/실시간 기능
- 다국어(i18n) 확장, 고급 애널리틱스 대시보드
- 모바일 앱, 브라우저 확장, 크롤러/수집 기능

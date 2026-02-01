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

### Stage 3: 공유 URL(쿼리) + Canonical 처리

- 목표: “링크 공유=상태 복원”을 구현하되, SEO 중복 문제를 canonical로 방어
- 산출물:
  - 입력값 ↔ URL 쿼리스트링 직렬화/복원(양방향)
  - 쿼리 포함 URL의 canonical을 “쿼리 없는 대표 URL”로 고정
  - 사이트 내 공유 버튼(현재 입력값이 포함된 URL 복사)
- 검사 기준(DoD):
  - 새로고침/직접 접속 시 쿼리스트링으로 상태가 정확히 복원됨
  - 동일 페이지에서 쿼리 유무와 상관없이 canonical이 대표 URL로 유지됨
  - sitemap에는 쿼리 URL이 포함되지 않음(대표 URL만)
- 커밋 메시지 예시: `feat: add shareable URLs with canonical guard`

### Stage 4: SEO 기본 세트 + 인덱싱 준비

- 목표: 검색엔진이 인덱싱하기 좋은 “정적 SEO 기본 세트” 구축
- 산출물:
  - 페이지별 title/description(홈/거치식/적립식/가이드/정책 페이지)
  - `robots.txt`, `sitemap.xml` 생성 및 경로 확인
  - Open Graph/Twitter 메타(기본)
  - 404/네비게이션 기본 정리(크롤링/사용성 보강)
- 검사 기준(DoD):
  - `robots.txt`, `sitemap.xml`이 배포 산출물(dist)에 포함됨
  - 주요 페이지의 메타 태그가 정상 출력됨(title/description/og)
  - sitemap에 대표 URL(쿼리 없는)만 포함됨
- 커밋 메시지 예시: `feat: add sitemap robots and basic meta`

### Stage 5: 배포 워크플로 + GitHub Pages 커스텀 도메인

- 목표: GitHub Pages 배포 자동화 및 커스텀 도메인 연결까지 완료
- 산출물:
  - GitHub Actions 기반 Pages 배포 워크플로(정적 빌드 → 배포)
  - Pages 설정에 맞는 base path/asset 경로 최종 점검
  - 커스텀 도메인 연결 가이드/체크리스트(README 또는 docs) + `CNAME` 반영
- 검사 기준(DoD):
  - main 브랜치 push 시 자동 배포가 동작함
  - 커스텀 도메인으로 접속 가능(HTTPS 활성화 가능 상태)
  - base path 환경에서도 라우팅/정적 리소스 경로가 깨지지 않음
- 커밋 메시지 예시: `chore: automate gh-pages deploy and configure custom domain`

### Stage 6-1: 승인 가능성 보강(콘텐츠/신뢰)

- 목표: 승인 가능성을 높이기 위한 콘텐츠/신뢰 페이지 보강
- 산출물:
  - 홈 가이드/FAQ 강화 + 가이드 글 5개 추가(`/guides`, `/guides/[slug]`)
  - 신뢰 페이지(About/Contact/Privacy) 문구 품질 보강
- 검사 기준(DoD):
  - 5개 가이드 렌더 + 홈 콘텐츠 충분(얇지 않게)
  - 신뢰 페이지 품질 보강 완료
- 커밋 메시지 예시:
  - `content: add guides and expand trust pages`

### Stage 6-2: 승인 가능성 보강(기능)

- 목표: 계산기 기능 보강으로 검색 유입 확대
- 산출물:
  - 적립식 복리 계산기에 “연도별 매월 적립 금액 설정” 기능 추가
- 검사 기준(DoD):
  - 적립식 보강 기능이 정상 동작
- 커밋 메시지 예시:
  - `feat: add recurring yearly contribution controls`

### Stage 6-3: 확장 계산기(선택)

- 목표: 추가 계산기 페이지를 통해 검색 유입 확대
- 산출물(선택, 진행 시 확정):
  - 연봉 실수령액(세후 월급) 계산기
  - 퇴직금 계산기
  - 대출 이자/상환 스케줄 계산기
  - 예금/적금 만기 수령액 계산기
  - 연금저축/IRP 세액공제(절세) 계산기
- 검사 기준(DoD):
  - 진행한 계산기별 기본 입출력 정상 동작
- 커밋 메시지 예시:
  - `feat: add additional calculators`

### Stage 7: 광고 관련 통합

- 목표: AdSense 승인 후 광고 스크립트 조건부 통합
- 산출물:
  - AdSense 스크립트 조건부 로딩(환경변수 on/off)
- 검사 기준(DoD):
  - 환경변수로 광고 on/off 정상 동작
- 커밋 메시지 예시:
  - `feat: add adsense integration toggle`

## 완료 정의(DoD) 체크리스트

- Stage 0: 문서 충족(요구사항/범위/금지/검사/커밋 예시 포함)
- Stage 1: 기본 페이지 렌더, base path 고려, npm 스크립트 정상
- Stage 1 추가 품질: `npm run check` 통과(포맷/린트/타입체크)
- Stage 2: 계산기 입력/출력/예시 버튼 동작
- Stage 3: 쿼리스트링 복원 + canonical 방어 + 공유 버튼
- Stage 4: robots/sitemap/meta/og 정상 + sitemap에 대표 URL만
- Stage 5: GH Actions 배포 + 커스텀 도메인 연결 + base path 무결성
- Stage 6-1: 가이드 5개/FAQ 보강 + 신뢰 페이지 보강
- Stage 6-2: 적립식 보강 기능
- Stage 6-3: 확장 계산기(선택)
- Stage 7: 광고 토글

## 진행 현황

- 완료: Stage 0, Stage 1, Stage 2, Stage 3, Stage 4, Stage 5, Stage 6-1

## 범위 밖(하지 말 것)

- 백엔드 구축, 로그인/회원가입, 결제/구독 시스템
- 데이터베이스/서버리스 함수/실시간 기능
- 다국어(i18n) 확장, 고급 애널리틱스 대시보드
- 모바일 앱, 브라우저 확장, 크롤러/수집 기능

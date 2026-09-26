# [프로젝트 사양서] 영구 무료 웹 호스팅 기반 클라우드 학습 자료 관리 스토리지 (Cloud-Archive)

---

## 1. 프로젝트 개요

* **프로젝트명**: Cloud-Archive (개인용 학습 자료 웹 스토리지 서비스)
* **목표**: HTML, PDF, 사진, TXT, PPT, HWPX, HWP 등 다양한 공부/학습 파일들을 카테고리별로 분류·저장·열람·다운로드할 수 있는 웹사이트 구축.
* **핵심 가치**:
  1. **완전 무료 유지**: 서버 및 데이터베이스 운영 비용 0원 ($0/month).
  2. **장기 안정성 & 영구 보존**: PC 포맷이나 디바이스 변경 시에도 어디서든 웹으로 접속하여 원본 파일 복구 및 열람 가능.
  3. **노코드/바이브 코딩 친화적**: 코딩 지식이 없어도 GitHub, Vercel, Supabase, Google Drive API 등을 활용하여 AI 툴(Cursor, Claude 등)의 도움으로 쉽게 구축 가능.

---

## 2. 제약 조건 및 구현 전략

| 제약 조건 | 상세 구현 전략 |
| :--- | :--- |
| **1. 어디서든 접속 가능** | 글로벌 CDN을 제공하는 Cloudflare Pages 또는 Vercel을 통해 웹 URL 제공 |
| **2. '100% 무료' 웹 호스팅** | • **웹 호스팅**: Vercel / GitHub Pages / Netlify (무료 플랜)<br>• **DB / 서버리스**: Supabase (Free Tier)<br>• **대용량 파일 저장소(선택)**: Google Drive API 연동 또는 Cloudflare R2 (10GB 무료) |
| **3. 노코드 / 최단 난이도** | 프론트엔드는 **React / Next.js (TailwindCSS)** 템플릿 사용, 바이브 코딩으로 AI가 전체 코드 작성 |
| **4. 카테고리 & 파일 CRUD** | • 동적 카테고리 생성, 수정, 삭제 기능<br>• 파일 업로드, 카테고리별 분류, 미리보기(PDF/이미지/TXT/HTML), 다운로드 기능 |
| **5. 깔끔한 UI/UX 디자인** | Modern Dashboard (Clean Light/Dark Mode), TailwindCSS 기반 노션(Notion) 스타일 레이아웃 |

---

## 3. 추천 무료 시스템 아키텍처 (Tech Stack)

```text
[웹 사용자 브라우저 (PC/모바일)]
         │
         ▼
[Vercel / Cloudflare Pages (무료 웹 호스팅)]
         │
         ├──► [Supabase DB (무료)] ── 카테고리, 파일 메타데이터 관리
         │
         └──► [Supabase Storage / Google Drive API (무료)] ── 실제 파일 저장 (PDF, HWP, PPT 등)

```

1. **Front-End & Hosting**: **Vercel** + **Next.js**
* GitHub 연동으로 클릭 한 번에 무제한 무료 웹 배포.


2. **Back-End & Database**: **Supabase**
* PostgreSQL 기반의 무료 백엔드 서비스(BaaS).
* 데이터베이스(카테고리/파일 정보 관리) 및 파일 스토리지 기능 기본 제공.


3. **File Storage Option**:
* **기본**: Supabase Storage (500MB 무료)
* **대용량 확장**: 구글 드라이브 API 연동 (15GB 무료) 또는 Cloudflare R2 (10GB 무료)



---

## 4. 웹사이트 주요 기능 명세 (Requirements)

### 4.1. 카테고리 관리 기능

* **카테고리 생성**: 사용자 정의 카테고리 추가 (예: `알고리즘`, `클라우드`, `HTML/CSS`, `자격증`).
* **카테고리 수정 및 삭제**: 카테고리 이름 변경 및 삭제 (삭제 시 해당 카테고리 내 파일 처리 안내).
* **카테고리 아이콘/색상 지정**: 구분하기 쉬운 태그 형태 제공.

### 4.2. 파일 관리 및 업로드 기능

* **드래그 앤 드롭 업로드**: 컴퓨터 내 파일(HTML, PDF, PNG/JPG, TXT, PPT, HWPX, HWP)을 Drag & Drop하여 원하는 카테고리에 업로드.
* **파일 확장자 지원**:
* **웹 내 바로 열람(Preivew)**: HTML, PDF, PNG/JPG/WEBP, TXT
* **원클릭 다운로드**: PPT, HWPX, HWP 등 브라우저 자체 지원 불가 확장자


* **검색 및 필터링**: 파일명 검색, 확장자별 필터링, 업로드 날짜순 정렬.

### 4.3. UI / UX 스타일 가이드라인

* **Notion / Google Drive 감성**: 좌측 사이드바(카테고리 목록), 우측 메인 영역(파일 그리드/리스트 뷰).
* **반응형 디자인**: 모바일 및 태블릿에서도 최적화된 화면 표출.

---

## 5. 단계별 구축 로드맵 (비전공자 초보자용)

### 1단계: 계정 준비 (모두 무료)

1. **GitHub 계정 가입**: 소스코드 저장 및 Vercel 연동용.
2. **Supabase 계정 가입**: 데이터베이스 및 파일 저장소용.
3. **Vercel 계정 가입**: 웹사이트 영구 무료 배포용.

### 2단계: AI 프롬프트 기반 코딩 (Cursor / Claude 활용)

* AI 코딩 툴(Cursor 등)에 아래 프롬프트를 전달하여 웹사이트 전체 코드를 자동 생성:
> *"Next.js, TailwindCSS, Supabase를 사용하여 학습 파일 관리 웹사이트를 만들어줘. 카테고리 CRUD, 파일 Drag&Drop 업로드, PDF/TXT/이미지 미리보기, 원클릭 다운로드 기능이 포함된 노션 스타일의 깔끔한 UI로 작성해줘."*



### 3단계: Supabase 데이터베이스 테이블 구성

```sql
-- 카테고리 테이블
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 파일 메타데이터 테이블
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

```

### 4단계: Vercel 클릭 한 번으로 배포

1. GitHub에 코드를 올린 후 Vercel과 연동.
2. `Supabase URL`과 `Anon Key`를 환경 변수로 등록.
3. **[Deploy]** 버튼 클릭 ➔ 나만의 고유 웹 주소 생성 (예: `https://my-study-archive.vercel.app`).

---

## 6. 유지보수 및 백업 정책

* **포맷 후 복구**: 새 컴퓨터에서 제공된 웹 URL로 접속하기만 하면 모든 파일 조회 및 재다운로드 가능.
* **무료 용량 관리**: 기본 무료 용량이 채워질 경우, 구글 드라이브 API 연동 모듈로 파일 저장소를 전환하여 무료 용량 연장.

```
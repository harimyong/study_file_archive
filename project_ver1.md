# 📚 Study File Archive (학습 자료 스토리지 프로젝트)

Supabase와 Next.js(Tailwind CSS)를 활용하여 구축한 **학습 자료 관리 웹 스토리지 서비스**입니다.  
카테고리별 자료 관리, 다양한 확장자의 파일 미리보기, 유저 계정 및 카테고리별 접근 권한 관리 기능을 제공합니다.

---

## 🛠️ 주요 구현 기능

1. **사용자 인증 & 권한 관리 시스템**
   - **가상 이메일 지원:** 일반 아이디 입력만으로 `@archive.local` 가상 이메일을 생성하여 로그인/가입 처리.
   - **권한 관리:** 관리자(`admin`) 및 일반 유저(`user`) 역할 분리.
   - **카테고리 접근 제어:** 관리자가 일반 유저별로 특정 카테고리 접근 권한을 체크박스로 부여/해제.

2. **카테고리 관리**
   - 관리자 전용 카테고리 생성 및 삭제.
   - 카테고리 삭제 시 해당 카테고리에 속한 Supabase Storage 실물 파일 및 DB 데이터 연쇄 삭제.

3. **파일 업로드 & 다운로드 & 관리**
   - 다중 파일 업로드 지원.
   - 한글 파일명 깨짐 방지 Sanitizing 및 UTF-8 / EUC-KR MIME Type 인코딩 지정 업로드.
   - Blob 객체를 활용한 안전한 파일 브라우저 직접 다운로드 구현.

4. **스마트 미리보기 모달 (Preview)**
   - **이미지:** 브라우저 원본 이미지 뷰어.
   - **HTML / TXT / 코드 파일:** Binary ArrayBuffer 수신 후 EUC-KR / UTF-8 자동 감지 디코딩하여 깨짐 없는 텍스트/웹 화면 렌더링.
   - **PDF:** 브라우저 내장 뷰어로 직접 렌더링.
   - **DOC / PPT / XLS:** Google Docs Viewer 연동 미리보기.
   - **HWP / ZIP 등:** 브라우저 미지원 확장자 안내 및 직접 다운로드 버턴 제공.

---

## 📁 프로젝트 파일 구조 (모듈화 완료)

단일 파일(`page.js`)에 몰려있던 로직을 역할에 맞게 UI 컴포넌트(`components/`)와 액션/클라이언트 모듈(`lib/`)로 완벽히 분리하였습니다.

```text
app/
 ├── components/               # UI 화면 모듈 (View)
 │    ├── CategorySidebar.js   # 사이드바 (카테고리 목록, 로고, 프로필, 로그아웃)
 │    ├── FileViewer.js        # 파일 카드 목록, 업로드/다운로드, 미리보기 모달
 │    ├── LoginView.js         # 로그인 폼 화면
 │    └── UserManagerModal.js  # 유저 생성/삭제 및 카테고리 접근 권한 설정 모달
 │
 ├── lib/                      # 비즈니스 로직 및 API 액션 모듈 (Controller / API)
 │    ├── supabaseClient.js    # Supabase 공통 인스턴스 설정
 │    ├── categoryActions.js   # 카테고리 조회/생성/삭제 로직
 │    ├── fileActions.js       # 파일 조회/업로드/삭제/다운로드/미리보기 로직
 │    └── userActions.js       # 유저 생성/삭제/권한 토글 로직
 │
 ├── globals.css               # Tailwind CSS 설정
 ├── layout.js                 # 루트 레이아웃 설정
 └── page.js                   # 메인 총괄 페이지 (상태 관리 및 모듈 조립)

```

---

## 📜 핵심 파일별 주요 역할

### 1. `app/lib/`

* **`supabaseClient.js`**: `process.env.NEXT_PUBLIC_SUPABASE_URL` 및 `ANON_KEY`를 이용한 Supabase 공통 싱글톤 클라이언트.
* **`categoryActions.js`**: 권한별 카테고리 불러오기 및 스토리지 연동 완전 삭제 처리.
* **`fileActions.js`**: Storage 파일 업로드, 인코딩 디코딩 처리, Blob 기반 다운로드, 파일 확장자별 미리보기 구분 로직.
* **`userActions.js`**: `adminAuthClient`를 통한 가상 계정 생성, DB 유저 완전 삭제, 권한 테이블(`category_permissions`) 조작.

### 2. `app/components/`

* **`CategorySidebar.js`**: 좌측 메뉴바. 카테고리 이동 및 관리자용 카테고리 추가/삭제, 유저 관리 모달 열기 버튼 제공.
* **`FileViewer.js`**: 중앙 파일 그리드 뷰 및 다양한 타입(Image, HTML, Text, PDF, Doc 등)을 지원하는 미리보기 모달.
* **`LoginView.js`**: 깔끔한 중앙 카드 형태의 로그인 폼.
* **`UserManagerModal.js`**: 관리자가 유저를 등록/삭제하고 카테고리별 접근 권한을 체크박스로 관리하는 팝업 모달.

### 3. `app/page.js`

* 모든 UI 컴포넌트와 비즈니스 로직 함수를 불러와 **전역 상태(State) 및 이벤트를 바인딩하고 연결**하는 총괄 메인 컴포넌트.

---

## 🚀 실행 및 배포 지침

1. **환경 변수 설정 (`.env.local`)**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```


2. **의존성 설치 및 로컬 실행**
```bash
npm install
npm run dev

```


3. **배포 시 주의사항**
* `config.txt` 등 불필요한 설정 파일은 프로젝트 최상위 루트(Root)에 두거나 삭제.
* `globals.css` 상단에는 Tailwind 표준 3줄 directive 포함 확인.
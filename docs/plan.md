# Community — Next.js + Supabase 개발 계획

## 개요

`docs/requirements.md`(요구사항 v1.0)와 `docs/design.md`(Figma 분석)를 기반으로, 모바일 우선 커뮤니티(피드/SNS) 웹앱을 **Next.js App Router + Supabase(Auth/DB/Storage) + Tailwind + Vercel** 스택으로 구현하기 위한 계획.

**확정된 방향**
- 데이터 패칭: **Server Components로 조회 + Server Actions로 변경(mutation)**. `@supabase/ssr` 쿠키 세션 기반. Route Handler는 최소화(인증 콜백 정도).
- 구현 범위: **MVP + 글 수정/삭제**. 검색(`/search`)·무한스크롤·알림 등은 이번 범위 제외(2차).

디자인 톤: 390px 모바일 프레임을 `max-width`(약 480px) 컨테이너로 감싼 반응형. Primary=오렌지(코랄), Neutral=그레이스케일, Poppins 폰트, 하단 3-탭(홈/내정보/설정) + 우하단 글쓰기 FAB.

---

## 1. 폴더 구조

```
community/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/                  # 비로그인 레이아웃 (탭바 없음)
│  │  │  ├─ login/page.tsx
│  │  │  └─ signup/page.tsx
│  │  ├─ (main)/                  # 로그인 레이아웃 (하단 탭바 포함)
│  │  │  ├─ layout.tsx            # BottomTab + max-width 컨테이너
│  │  │  ├─ page.tsx              # 홈/피드 (S3)
│  │  │  ├─ write/page.tsx        # 글 작성 (S4)
│  │  │  ├─ posts/[id]/
│  │  │  │  ├─ page.tsx           # 글 상세 (S5)
│  │  │  │  └─ edit/page.tsx      # 글 수정 (S6)
│  │  │  ├─ profile/
│  │  │  │  ├─ page.tsx           # 내 프로필 (S7)
│  │  │  │  └─ edit/page.tsx      # 프로필 수정 (S8)
│  │  │  ├─ users/[id]/page.tsx   # 타 유저 프로필 (S9)
│  │  │  └─ settings/page.tsx     # 설정 (S10)
│  │  ├─ auth/callback/route.ts   # (선택) 이메일 인증 콜백
│  │  ├─ layout.tsx               # 루트 레이아웃 (폰트, 전역 스타일)
│  │  └─ globals.css
│  ├─ actions/                    # Server Actions ('use server')
│  │  ├─ auth.ts                  # signUp / signIn / signOut
│  │  ├─ posts.ts                 # createPost / updatePost / deletePost
│  │  ├─ comments.ts              # createComment / deleteComment
│  │  ├─ likes.ts                 # toggleLike
│  │  └─ profile.ts               # updateProfile / uploadAvatar
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ server.ts             # createClient() (쿠키, RSC/Action용)
│  │  │  ├─ client.ts             # 브라우저 클라이언트 (낙관적 UI용)
│  │  │  └─ middleware.ts         # 세션 갱신 헬퍼
│  │  ├─ queries/                 # 재사용 조회 함수 (RSC에서 호출)
│  │  │  ├─ posts.ts              # getFeed / getPost / getPostsByUser
│  │  │  └─ profile.ts            # getProfile / getCurrentUser
│  │  └─ validation.ts            # zod 스키마 (이메일/비번/닉네임/본문)
│  ├─ components/
│  │  ├─ ui/                      # Button, Input, Avatar, Header, BottomTab, ActionSheet
│  │  ├─ feed/                    # FeedItem, ActionBar(좋아요/댓글/조회), PostForm
│  │  ├─ comment/                 # CommentList, CommentInput, CommentItem
│  │  └─ profile/                 # ProfileHeader, ProfileForm, AvatarUploader
│  └─ types/
│     └─ database.ts              # Supabase 생성 타입 (supabase gen types)
├─ supabase/
│  ├─ migrations/                 # SQL (테이블 + RLS + 트리거 + Storage)
│  └─ config.toml
├─ middleware.ts                  # 세션 갱신 + 인증 가드 라우팅
├─ tailwind.config.ts             # 시맨틱 컬러 토큰
├─ .env.local                     # SUPABASE_URL / ANON_KEY (커밋 금지)
└─ package.json
```

라우트 그룹 `(auth)` / `(main)`으로 **탭바 유무와 인증 컨텍스트를 레이아웃 단위로 분리**한다.

---

## 2. 페이지 / 라우트 목록

| 라우트 | 화면 | 렌더 | 접근 권한 |
|--------|------|------|----------|
| `/login` | 로그인 | Client form + Action | 비로그인 |
| `/signup` | 회원가입 | Client form + Action | 비로그인 |
| `/` | 홈/피드 | RSC (getFeed) | 전체 |
| `/write` | 글 작성 | Client form + Action | 로그인 |
| `/posts/[id]` | 글 상세(댓글·좋아요) | RSC + Client 인터랙션 | 조회 전체 / 상호작용 로그인 |
| `/posts/[id]/edit` | 글 수정 | Client form + Action | 작성자 |
| `/profile` | 내 프로필 | RSC | 로그인 |
| `/profile/edit` | 프로필 수정 | Client form + Action | 로그인 |
| `/users/[id]` | 타 유저 프로필 | RSC | 전체 |
| `/settings` | 설정(로그아웃) | RSC + Action | 로그인 |

- **인증 가드**: `middleware.ts`에서 세션 확인 → `(main)` 하위 보호 라우트 접근 시 세션 없으면 `/login` 리다이렉트. `/`·`/posts/[id]`·`/users/[id]`는 조회 허용(상호작용만 로그인 요구).
- `revalidatePath`로 mutation 후 피드/상세 갱신. 좋아요는 클라이언트 낙관적 업데이트 후 Action 커밋.

---

## 3. DB 테이블 개요 (`supabase/migrations`)

요구사항 §5 스키마를 그대로 채택.

| 테이블 | 핵심 컬럼 | 비고 |
|--------|----------|------|
| `profiles` | `id`(PK→auth.users), `nickname`(unique), `avatar_url`, `created_at` | 가입 시 트리거로 자동 생성 |
| `posts` | `id`(PK), `author_id`(FK→profiles), `title`, `content`, `created_at`, `updated_at` | |
| `comments` | `id`(PK), `post_id`(FK, CASCADE), `author_id`(FK), `content`, `created_at` | |
| `likes` | `post_id`+`user_id` 복합 PK (FK, CASCADE), `created_at` | 중복 좋아요 방지 |

**집계(좋아요/댓글 수)**: 피드 N+1 방지를 위해 **`post_with_counts` 뷰** 또는 `select ..., likes(count), comments(count)` 임베디드 카운트 사용. 내가 좋아요했는지는 현재 user 기준 `likes` 존재 여부로 판정.

**트리거**: `auth.users` insert 시 `handle_new_user()` → `profiles`에 nickname(가입 메타데이터) 삽입. 닉네임 unique 위반은 회원가입 Action에서 사전 검사 + DB 제약으로 이중 방어.

**Storage**: 버킷 `avatars`(공개 읽기). 경로는 `avatars/{user_id}/...`로 두어 본인만 write.

---

## 4. 구현 순서

각 단계는 **DB(마이그레이션+RLS) → Server Action/Query → UI** 순으로 수직 완성.

**0. 스캐폴딩**
`create-next-app`(TS, Tailwind, App Router) → Supabase 프로젝트 연결, `@supabase/ssr` 설치 → `lib/supabase/{server,client,middleware}.ts` + `middleware.ts` 세팅 → Tailwind에 시맨틱 컬러 토큰(primary/neutral/danger)·Poppins·`max-w-[480px]` 컨테이너.

**1. 공통 UI 킷**
`components/ui`의 Button(Filled/Outlined/Standard × 상태), Input(라벨/에러), Header, BottomTab(홈/내정보/설정), Avatar, FAB, ActionSheet. 디자인 토큰 기준.

**2. 인증** (기능 1~3)
`profiles` 테이블+트리거+RLS → `actions/auth.ts`(signUp/signIn/signOut) + zod 검증 → `/signup`·`/login` 화면, 로그아웃(설정) → middleware 인증 가드. **먼저 세션이 흘러야 이후 모든 기능이 동작.**

**3. 피드 + 글 작성/상세** (기능 4~6)
`posts` 테이블+RLS+카운트 뷰 → `queries/posts.ts`(getFeed/getPost), `actions/posts.ts`(createPost) → `/`(FeedItem 리스트), `/write`(PostForm), `/posts/[id]`(상세).

**4. 글 수정/삭제** (기능 7)
`updatePost`/`deletePost` Action(작성자 RLS + ownership 체크) → `/posts/[id]/edit` + 상세의 ⋮ ActionSheet(수정/삭제). CASCADE로 연관 댓글/좋아요 정리.

**5. 댓글 + 좋아요** (기능 8~9)
`comments`·`likes` 테이블+RLS → `actions/comments.ts`, `actions/likes.ts` → 상세 화면 CommentList/CommentInput + ActionBar. 좋아요는 **낙관적 업데이트**(client) 후 toggleLike Action 커밋, 유니크 제약으로 중복 방지.

**6. 프로필** (기능 10~12)
`profile.ts` query/action + Storage `avatars` 버킷·정책 → `/profile`(내 글 목록), `/profile/edit`(닉네임 중복검사+아바타 업로드), `/users/[id]`(조회 전용).

**7. 설정 마무리 + 배포** (기능 13)
`/settings`(계정 정보 표시 + 로그아웃) → 로딩(`loading.tsx`)/에러(`error.tsx`)·`not-found` 처리, 접근성 라벨 점검 → **Vercel 배포**: 환경변수(SUPABASE_URL/ANON_KEY) 등록, Supabase Auth Redirect URL에 배포 도메인 추가, 프로덕션 마이그레이션 적용.

---

## 5. 주의점 (RLS / 인증 / 기타)

**RLS (요구사항 §5.4 — 모든 테이블 RLS ENABLE 필수)**
- `profiles`: `select` 전체 허용, `update`는 `auth.uid() = id`만.
- `posts`: `select` 전체, `insert`는 `auth.uid() = author_id`, `update`/`delete`는 작성자만.
- `comments`: `select` 전체, `insert` 로그인+본인 author, `delete` 작성자만.
- `likes`: `select` 전체, `insert`/`delete`는 `auth.uid() = user_id`만.
- Storage `avatars`: 공개 읽기, `insert`/`update`/`delete`는 경로 첫 세그먼트 = `auth.uid()`인 본인만.
- ⚠️ **RLS는 마지막 방어선**이지만 UX를 위해 Action/미들웨어에서도 인증·ownership을 선검사(이중 방어). `service_role` 키는 클라이언트는 물론 서버 로직에서도 사용하지 않는다(anon 키 + 세션으로 충분, RLS 우회 금지).

**인증 / 세션**
- `@supabase/ssr` + `middleware.ts`로 **매 요청 세션 토큰 갱신**(누락 시 Server Action에서 세션이 만료로 보일 수 있음).
- 클라이언트/서버 클라이언트 인스턴스를 혼용하지 말 것: RSC·Action은 `lib/supabase/server.ts`, 브라우저 낙관적 UI는 `client.ts`.
- 보호 라우트는 middleware 가드 + 페이지 진입 시 `getCurrentUser()` 재확인.

**데이터/제약**
- 닉네임 unique: 가입·수정 시 사전 조회 + DB unique 제약 이중 처리, 위반(23505) 에러를 사용자 메시지로 변환.
- 좋아요/댓글 수 N+1: 개별 count 쿼리 금지, 임베디드 카운트 또는 뷰 사용.
- 낙관적 좋아요 실패 시 롤백 처리.
- 본문 길이(2,000자)·비번(8자)·닉네임(2~20자) 검증은 **클라이언트 + Action(zod)** 양쪽.

**환경/보안**
- `.env.local`은 커밋 금지(`.gitignore` 확인). Vercel 환경변수로 주입.
- Supabase Auth 이메일 인증: MVP는 미사용 가능하나, 사용 시 `auth/callback/route.ts`와 Redirect URL 설정 필요.

---

## 6. 검증 (Verification)

1. `npm run dev` 후 `/signup` → 신규 계정 생성 → `profiles` 자동 생성 확인(Supabase 테이블 에디터).
2. 로그아웃 상태에서 `/write` 접근 → `/login` 리다이렉트 되는지(가드).
3. 로그인 → 글 작성 → `/` 피드에 최신순 노출 → 상세 진입.
4. 좋아요 토글 시 수 즉시 반영(낙관적) + 새로고침 후에도 유지, 같은 유저 중복 좋아요 불가.
5. 댓글 작성/삭제, 본인 글 수정/삭제(삭제 시 댓글·좋아요 CASCADE 정리) 확인.
6. 프로필 수정: 아바타 업로드(Storage에 파일 생성) + 닉네임 중복 시 에러 메시지.
7. **RLS 검증(핵심)**: 계정 A 세션으로 계정 B의 글/댓글 `update`/`delete` 시도 → 거부되는지 SQL 또는 API로 확인.
8. Vercel 프리뷰 배포 후 동일 플로우 재확인(환경변수·Redirect URL).

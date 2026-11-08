# Community — Supabase 연결 설정 가이드

`docs/plan.md`의 **0단계(스캐폴딩)** 중 "Supabase 연결" 부분을 실제 설정 기준으로 정리한 문서.
인증/글/댓글 같은 기능을 붙이기 전에 **세션이 흐르는 배관**을 먼저 깐다. 이 배관이 있어야 이후 모든
Server Component 조회와 Server Action mutation이 동작한다.

## 전제

- **호스티드 Supabase 프로젝트** 사용 (URL/anon key는 대시보드에서 발급).
- 폴더 구조: 현재 **루트 `app/`** 유지, import alias `@/*` → 레포 루트.
- **이메일 인증 미사용(MVP)** → `auth/callback` 라우트는 이번 범위 밖.

## Next.js 16 주의점 (이 배관에 직접 영향)

- `middleware.ts`는 **`proxy.ts`로 rename/deprecated** 되었고 **Node.js 런타임** 고정이다
  (`@supabase/ssr`는 Node에서 동작하므로 호환). 세션 갱신 파일은 `middleware.ts`가 아니라 루트 `proxy.ts`로 만든다.
- `next/headers`의 **`cookies()`는 async** — 반드시 `await` 한다.
- **Server Component 렌더 중에는 쿠키 `set`이 불가**하다. 그래서 `server.ts`의 `setAll`은 try/catch로
  감싸 무시하고, 실제 세션 쿠키 쓰기/갱신은 `proxy.ts`가 담당한다.

## 1. 환경변수

`.env.local`(커밋 금지, `.gitignore`의 `.env*`로 제외)에 값을 채운다. 템플릿은 `.env.example` 참고.

```
NEXT_PUBLIC_SUPABASE_URL=<프로젝트 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

값 위치: **Supabase 대시보드 → Project Settings → API** 에서 `Project URL`과 `anon public` 키를 복사.

## 2. 클라이언트 3종 — 역할 구분 (혼용 금지)

| 파일 | 사용처 | 비고 |
|------|--------|------|
| `lib/supabase/client.ts` | 브라우저(클라이언트 컴포넌트), 낙관적 UI | `createBrowserClient` |
| `lib/supabase/server.ts` | RSC · Server Action · Route Handler | `createServerClient` + `await cookies()` |
| `proxy.ts` (루트, **다음 단계**) | 매 요청 세션 토큰 갱신 | `NextRequest`/`NextResponse` 쿠키 API |

> ⚠️ RSC/Action에서는 반드시 `server.ts`, 브라우저에서는 `client.ts`를 쓴다. 인스턴스를 섞으면
> 세션이 만료로 보이거나 쿠키 갱신이 깨질 수 있다.

## 3. 연결 스모크 테스트

`.env.local`을 채운 뒤:

1. `npm install` (최초 1회) → `npm run dev`.
2. 임시로 `app/page.tsx`(홈)에 아래를 넣고 확인 후 되돌린다:
   ```tsx
   import { createClient } from "@/lib/supabase/server";
   // 컴포넌트 안 (async 함수):
   const supabase = await createClient();
   const { data, error } = await supabase.auth.getUser();
   console.log("supabase 연결 확인:", { user: data.user, error });
   ```
3. 터미널에 **에러 없이 `user: null`**이 찍히면 env + 서버 클라이언트 + 쿠키 배관이 정상.
   (키가 틀리면 여기서 인증/네트워크 에러가 남.) 확인 후 임시 코드 제거.

## 다음 단계 체크리스트 (이 문서 범위 밖)

1. 루트 `proxy.ts` + `lib/supabase/proxy.ts`(`updateSession`) — 매 요청 세션 갱신, 정적 자산 제외 matcher.
2. `profiles` 테이블 + `handle_new_user` 트리거 + RLS 마이그레이션.
3. `actions/auth.ts`(signUp/signIn/signOut) + `/signup`·`/login` 화면.
4. proxy에 인증 가드(비로그인 보호 라우트 → `/login` 리다이렉트) 추가.
5. (선택) 타입 생성: `npx supabase gen types typescript --project-id <ref> > types/database.ts`.

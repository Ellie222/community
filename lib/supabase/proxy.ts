import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

// 비로그인 상태로도 접근 가능한 공개 경로. 그 외 모든 경로는 로그인이 필요하다.
// (matcher가 정적 자산은 이미 제외하므로 여기서는 신경 쓰지 않아도 된다.)
const PUBLIC_PATHS = ["/login", "/signup", "/auth"];

function isProtectedPath(pathname: string) {
  return !PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * 매 요청마다 Supabase 세션 토큰을 갱신하고, 갱신된 쿠키를 응답에 실어 보낸다.
 * 루트 `proxy.ts`(Next.js 16의 middleware 후신)에서 호출한다.
 *
 * 세션 갱신 후 인증 가드도 수행한다: 비로그인 사용자가 보호 라우트에 접근하면
 * `/login`으로 리다이렉트한다.
 *
 * 주의: `getUser()`로 갱신된 쿠키는 반환 응답(리다이렉트 포함)에 반드시 실어야
 * 세션이 유지된다. 그래서 리다이렉트 시에도 response 쿠키를 복사해 넘긴다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    // 세션 갱신으로 설정된 쿠키를 리다이렉트 응답에도 복사한다.
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

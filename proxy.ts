import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: `middleware`는 `proxy`로 rename되었고 Node.js 런타임에서 실행된다.
// updateSession이 매 요청 세션을 갱신하고, 비로그인 사용자의 보호 라우트 접근을
// /login으로 리다이렉트하는 인증 가드까지 수행한다.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 정적 자산 제외 — 없으면 CSS/JS/이미지 요청까지 proxy가 가로챈다.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

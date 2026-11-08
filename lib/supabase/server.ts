import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * RSC / Server Action / Route Handler용 Supabase 클라이언트.
 * Next.js 16에서 `cookies()`는 async이므로 반드시 await 한다.
 * 브라우저에서는 대신 `lib/supabase/client.ts`의 createClient를 쓴다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 렌더 중에는 쿠키 set이 불가하다.
            // 세션 갱신은 proxy.ts(updateSession)가 담당하므로 여기서는 무시한다.
          }
        },
      },
    },
  );
}

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * 낙관적 UI 등 클라이언트에서 직접 Supabase를 호출할 때 사용한다.
 * RSC/Server Action에서는 대신 `lib/supabase/server.ts`의 createClient를 쓴다.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

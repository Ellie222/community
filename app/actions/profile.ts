"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateNickname } from "@/lib/validation";

export type ProfileFormState = {
  error?: string;
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

// avatars 버킷의 allowed_mime_types와 일치해야 한다. 확장자 없는 경로로 올리면
// Storage가 MIME 추론에 실패해 400을 반환하므로, MIME → 확장자를 명시해 저장한다.
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * 프로필 수정 Server Action. 본인 것만 수정한다(auth.uid() 기준 + RLS).
 * 아바타 파일이 있으면 avatars 버킷의 {uid}/ 경로에 올리고 공개 URL을 저장한다.
 */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const avatar = formData.get("avatar");

  const validationError = validateNickname(nickname);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let avatarUrl: string | undefined;

  if (avatar instanceof File && avatar.size > 0) {
    const ext = MIME_TO_EXT[avatar.type];
    if (!ext) {
      return {
        error: "지원하지 않는 이미지 형식입니다. (jpg, png, webp, gif만 가능)",
      };
    }
    if (avatar.size > MAX_AVATAR_BYTES) {
      return { error: "이미지는 5MB 이하만 업로드할 수 있습니다." };
    }

    // Storage 업로드에는 유저 JWT가 반드시 실려야 auth.uid()가 본인으로 잡혀
    // RLS(avatars_insert_own)를 통과한다. @supabase/ssr 서버 클라이언트로 올리면
    // 토큰이 anon으로 나가 "row violates RLS"가 나므로, 세션 토큰을 명시적으로
    // Authorization 헤더에 실은 전용 클라이언트로 업로드한다.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return { error: "세션이 만료되었습니다. 다시 로그인해 주세요." };
    }

    const storage = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    ).storage.from("avatars");

    // 경로 첫 세그먼트를 uid로 두어야 Storage RLS를 통과한다.
    // 확장자를 붙여 버킷의 allowed_mime_types 검증을 통과시킨다.
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await storage.upload(path, avatar, {
      upsert: true,
      contentType: avatar.type,
    });

    if (uploadError) {
      console.error("[avatar upload] error:", uploadError);
      return {
        error: `이미지 업로드에 실패했습니다: ${uploadError.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = storage.getPublicUrl(path);
    // 같은 경로로 덮어쓰므로 캐시 무효화를 위해 버전 쿼리스트링을 붙인다.
    avatarUrl = `${publicUrl}?v=${Date.now()}`;
  }

  const patch: { nickname: string; avatar_url?: string } = { nickname };
  if (avatarUrl) patch.avatar_url = avatarUrl;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  if (error) {
    // 23505 = nickname unique 제약 위반
    if (error.code === "23505") {
      return { error: "이미 사용 중인 닉네임입니다." };
    }
    console.error("[profile update] error:", error);
    return { error: `프로필 수정 실패: ${error.message}` };
  }

  revalidatePath("/my");
  redirect("/my");
}

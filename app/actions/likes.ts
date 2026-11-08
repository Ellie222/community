"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToggleLikeResult =
  { liked: boolean; likeCount: number } | { error: string };

/**
 * 좋아요 토글 Server Action. 이미 눌렀으면 취소(delete), 아니면 추가(insert).
 * 커밋 후 서버 기준 최신 상태(liked, likeCount)를 반환해 클라이언트가 보정하도록 한다.
 * 중복 좋아요는 복합 PK(post_id, user_id)와 RLS로 방지된다.
 */
export async function toggleLike(postId: string): Promise<ToggleLikeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { error: "좋아요 취소에 실패했습니다." };
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ post_id: postId, user_id: user.id });
    // 23505 = unique_violation (동시 클릭 등으로 이미 존재) → 좋아요된 것으로 간주
    if (error && error.code !== "23505") {
      return { error: "좋아요에 실패했습니다." };
    }
  }

  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  // 피드에 좋아요 수를 노출하게 되면 갱신되도록 홈만 무효화(상세는 클라이언트가 보정).
  revalidatePath("/");

  return { liked: !existing, likeCount: count ?? 0 };
}

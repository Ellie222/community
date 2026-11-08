import { createClient } from "@/lib/supabase/server";

/**
 * 특정 글의 댓글을 작성 시간 오름차순(오래된 순)으로 조회한다.
 * 작성자 프로필(닉네임/아바타)을 FK를 명시해 임베디드 조인한다.
 */
export async function getComments(postId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, content, created_at, deleted_at, author:profiles!comments_author_id_fkey(id, nickname, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export type Comment = Awaited<ReturnType<typeof getComments>>[number];

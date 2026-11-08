import { createClient } from "@/lib/supabase/server";

// 피드 카드용 공통 select. posts↔profiles 경로가 여럿(직접 FK + likes 경유)이라
// FK를 명시해 모호성을 제거하고, likes(count)/comments(count)로 집계해 N+1을 피한다.
const FEED_SELECT =
  "id, title, content, created_at, author:profiles!posts_author_id_fkey(id, nickname, avatar_url), likes(count), comments(count)";

/**
 * 피드용 글 목록을 최신순으로 조회한다(RSC에서 호출).
 */
export async function getFeed() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    // 임베디드 필터: 소프트 삭제된 댓글은 comments(count) 집계에서 제외.
    // (!inner가 아니라 댓글 없는 글도 그대로 유지되고 count만 0이 된다)
    .is("comments.deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// 피드 카드 한 건의 타입. FeedItem 등에서 재사용한다.
export type FeedPost = Awaited<ReturnType<typeof getFeed>>[number];

/**
 * 특정 유저가 작성한 글을 최신순으로 조회한다(내 프로필 "내가 쓴 글" 등).
 * FeedPost와 동일한 형태라 FeedItem을 그대로 재사용할 수 있다.
 */
export async function getPostsByUser(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .eq("author_id", userId)
    .is("comments.deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * 글 상세를 단건 조회한다(RSC에서 호출). 없으면 null을 반환한다.
 */
export async function getPost(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, content, created_at, author:profiles!posts_author_id_fkey(id, nickname, avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPost>>>;

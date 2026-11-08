import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/app/components/Avatar";
import FeedItem from "@/app/components/FeedItem";
import { getPostsByUser } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "내정보 · 커뮤니티",
};

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미들웨어 가드가 있지만 페이지에서도 재확인(이중 방어).
  if (!user) redirect("/login");

  // profiles에서 내 정보, posts에서 내 글을 가져온다.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const posts = await getPostsByUser(user.id);

  // 내가 좋아요한 글 id 집합(카드 하트 채움 여부)
  let likedPostIds = new Set<string>();
  if (posts.length > 0) {
    const { data } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id);
    likedPostIds = new Set((data ?? []).map((row) => row.post_id));
  }

  const nickname = profile?.nickname ?? "알 수 없음";

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between px-4">
        <h1 className="text-lg font-semibold text-gray-900">내정보</h1>
        <Link href="/my/edit" className="text-sm font-semibold text-primary">
          편집
        </Link>
      </header>

      {/* 프로필 영역: 아바타 + 닉네임 */}
      <section className="flex flex-col items-center gap-3 px-4 py-6">
        <Avatar
          url={profile?.avatar_url ?? null}
          nickname={nickname}
          className="h-20 w-20 text-2xl"
        />
        <span className="text-lg font-semibold text-gray-900">{nickname}</span>
      </section>

      {/* 내가 쓴 글 */}
      <section className="border-t-8 border-gray-50">
        <h2 className="px-4 py-3 text-sm font-semibold text-gray-500">
          내가 쓴 글
        </h2>
        {posts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            아직 작성한 글이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col">
            {posts.map((post) => (
              <li
                key={post.id}
                className="border-b border-gray-100 last:border-b-0"
              >
                <FeedItem post={post} liked={likedPostIds.has(post.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

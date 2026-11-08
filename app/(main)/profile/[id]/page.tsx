import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/app/components/Avatar";
import FeedItem from "@/app/components/FeedItem";
import { getPostsByUser } from "@/lib/queries/posts";
import { getProfile } from "@/lib/queries/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "프로필 · 커뮤니티",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile(id);

  if (!profile) notFound();

  const posts = await getPostsByUser(id);

  // 현재 방문자가 좋아요한 글 id 집합(카드 하트 표시용)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let likedPostIds = new Set<string>();
  if (user && posts.length > 0) {
    const { data } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id);
    likedPostIds = new Set((data ?? []).map((row) => row.post_id));
  }

  return (
    <main className="flex flex-1 flex-col">
      {/* Header: 뒤로가기 + 제목 (읽기 전용, 수정 버튼 없음) */}
      <header className="flex h-14 items-center gap-2 px-4">
        <Link href="/" aria-label="뒤로" className="-ml-1 text-gray-600">
          <BackIcon className="h-6 w-6" aria-hidden />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">프로필</h1>
      </header>

      {/* 프로필 영역: 아바타 + 닉네임 */}
      <section className="flex flex-col items-center gap-3 px-4 py-6">
        <Avatar
          url={profile.avatar_url}
          nickname={profile.nickname}
          className="h-20 w-20 text-2xl"
        />
        <span className="text-lg font-semibold text-gray-900">
          {profile.nickname}
        </span>
      </section>

      {/* 이 유저가 쓴 글 */}
      <section className="border-t-8 border-gray-50">
        <h2 className="px-4 py-3 text-sm font-semibold text-gray-500">
          작성한 글
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

function BackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

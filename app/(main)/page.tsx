import Link from "next/link";
import FeedItem from "@/app/components/FeedItem";
import { getFeed } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const posts = await getFeed();

  // 현재 유저가 좋아요한 글 id 집합(카드 하트 채움 여부 판정용)
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
    <main className="relative flex flex-1 flex-col">
      <header className="flex h-14 items-center px-4">
        <h1 className="text-lg font-semibold text-gray-900">홈</h1>
      </header>

      {posts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          아직 글이 없습니다.
        </div>
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

      {/* WriteButton (FAB): 하단 탭 위 우하단에 고정. 모바일 컨테이너(max-w-md,
          448px) 우측 가장자리에 맞추되, 좁은 화면에서는 16px 인셋으로 클램프. */}
      <Link
        href="/write"
        aria-label="글쓰기"
        className="fixed bottom-[98px] right-[max(1rem,calc(50vw-13rem))] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-hover"
      >
        <PencilIcon className="h-6 w-6" aria-hidden />
      </Link>
    </main>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

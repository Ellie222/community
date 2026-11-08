import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/app/components/Avatar";
import CommentIcon from "@/app/components/CommentIcon";
import CommentInput from "@/app/components/CommentInput";
import CommentList from "@/app/components/CommentList";
import LikeButton from "@/app/components/LikeButton";
import PostActions from "@/app/components/PostActions";
import { formatRelativeTime } from "@/lib/format";
import { getComments } from "@/lib/queries/comments";
import { getPost } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "글 상세 · 커뮤니티",
};

export default async function PostDetailPage({
  params,
}: {
  // Next.js 16: params는 Promise이므로 await 한다.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  // 내 글이면 ⋮(수정/삭제) 노출을 위해 현재 유저와 작성자를 비교한다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === post.author?.id;

  // 좋아요 수 + 현재 유저의 좋아요 여부 (이미 확보한 supabase/user 재사용)
  const { count: likeCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", id);

  let liked = false;
  if (user) {
    const { data: myLike } = await supabase
      .from("likes")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    liked = !!myLike;
  }

  // 댓글 목록(오래된 순). 개수는 소프트 삭제된 댓글을 제외해 피드와 기준을 맞춘다.
  const comments = await getComments(id);
  const commentCount = comments.filter((c) => !c.deleted_at).length;

  const nickname = post.author?.nickname ?? "알 수 없음";

  return (
    <main className="flex flex-1 flex-col">
      {/* Header: 뒤로가기 + 제목 + (내 글) ⋮ */}
      <header className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="뒤로" className="-ml-1 text-gray-600">
            <BackIcon className="h-6 w-6" aria-hidden />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">글</h1>
        </div>
        {isOwner && <PostActions postId={post.id} />}
      </header>

      <article className="flex flex-col gap-4 px-4 py-4">
        {/* 작성자(→프로필) + 작성 시간 */}
        <div className="flex items-center gap-2">
          <AuthorLink authorId={post.author?.id ?? null}>
            <Avatar
              url={post.author?.avatar_url ?? null}
              nickname={nickname}
              className="h-10 w-10 text-base"
            />
            <span className="text-sm font-semibold text-gray-900">
              {nickname}
            </span>
          </AuthorLink>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* 제목 + 전체 내용 */}
        <h2 className="text-xl font-semibold text-gray-900">{post.title}</h2>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
          {post.content}
        </p>

        {/* ActionBar: 좋아요 + 댓글 수 */}
        <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
          <LikeButton
            postId={post.id}
            initialLiked={liked}
            initialCount={likeCount ?? 0}
          />
          <div className="flex items-center gap-1.5 text-gray-400">
            <CommentIcon className="h-6 w-6" aria-hidden />
            {commentCount > 0 && (
              <span className="text-sm text-gray-500">{commentCount}</span>
            )}
          </div>
        </div>
      </article>

      {/* 댓글 목록 + 입력창 */}
      <section className="flex flex-col border-t-8 border-gray-50">
        <CommentList
          comments={comments}
          postId={post.id}
          currentUserId={user?.id ?? null}
        />
        <CommentInput postId={post.id} />
      </section>
    </main>
  );
}

// 작성자 정보가 있으면 프로필 링크로 감싼다(없으면 그냥 표시).
function AuthorLink({
  authorId,
  children,
}: {
  authorId: string | null;
  children: React.ReactNode;
}) {
  if (!authorId)
    return <div className="flex items-center gap-2">{children}</div>;
  return (
    <Link href={`/profile/${authorId}`} className="flex items-center gap-2">
      {children}
    </Link>
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

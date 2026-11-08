import Link from "next/link";
import Avatar from "@/app/components/Avatar";
import CommentIcon from "@/app/components/CommentIcon";
import HeartIcon from "@/app/components/HeartIcon";
import { formatRelativeTime } from "@/lib/format";
import type { FeedPost } from "@/lib/queries/posts";

export default function FeedItem({
  post,
  liked,
}: {
  post: FeedPost;
  liked: boolean;
}) {
  const nickname = post.author?.nickname ?? "알 수 없음";
  const authorId = post.author?.id ?? null;
  // likes(count)/comments(count) 임베디드 집계 결과: [{ count }] 형태
  const likeCount = post.likes?.[0]?.count ?? 0;
  const commentCount = post.comments?.[0]?.count ?? 0;

  return (
    <article className="flex flex-col gap-2 px-4 py-4">
      {/* FeedHeader: 아바타 + 닉네임(→작성자 프로필) + 작성 시간.
          카드 본문 링크와 중첩되지 않도록 작성자만 별도 링크로 둔다. */}
      <div className="flex items-center gap-2">
        <MaybeProfileLink
          authorId={authorId}
          className="flex items-center gap-2"
        >
          <Avatar url={post.author?.avatar_url ?? null} nickname={nickname} />
          <span className="text-sm font-semibold text-gray-900">
            {nickname}
          </span>
        </MaybeProfileLink>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(post.created_at)}
        </span>
      </div>

      {/* Basic: 제목 + 본문 미리보기(2줄) → 글 상세로 이동 */}
      <Link href={`/post/${post.id}`} className="flex flex-col gap-1">
        <h2 className="line-clamp-1 text-base font-semibold text-gray-900">
          {post.title}
        </h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">
          {post.content}
        </p>
      </Link>

      {/* ActionBar(표시 전용): 좋아요 하트 + 댓글. 토글/작성은 상세 화면에서 한다. */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <HeartIcon
            filled={liked}
            className={`h-5 w-5 ${liked ? "text-primary" : "text-gray-400"}`}
          />
          {likeCount > 0 && (
            <span
              className={`text-sm ${liked ? "text-primary" : "text-gray-500"}`}
            >
              {likeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <CommentIcon className="h-5 w-5 text-gray-400" />
          {commentCount > 0 && (
            <span className="text-sm text-gray-500">{commentCount}</span>
          )}
        </div>
      </div>
    </article>
  );
}

// 작성자 정보가 있으면 프로필 링크로, 없으면 그냥 감싼다.
function MaybeProfileLink({
  authorId,
  className,
  children,
}: {
  authorId: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  if (!authorId) return <div className={className}>{children}</div>;
  return (
    <Link href={`/profile/${authorId}`} className={className}>
      {children}
    </Link>
  );
}

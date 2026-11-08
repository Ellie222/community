import Avatar from "@/app/components/Avatar";
import CommentActions from "@/app/components/CommentActions";
import { formatRelativeTime } from "@/lib/format";
import type { Comment } from "@/lib/queries/comments";

export default function CommentList({
  comments,
  postId,
  currentUserId,
}: {
  comments: Comment[];
  postId: string;
  currentUserId: string | null;
}) {
  if (comments.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-gray-400">
        첫 댓글을 남겨보세요.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {comments.map((comment) => {
        // 소프트 삭제된 댓글: 내용 대신 안내 문구만 표시(작성자/메뉴 숨김)
        if (comment.deleted_at) {
          return (
            <li key={comment.id} className="px-4 py-3">
              <p className="text-sm italic text-gray-400">삭제된 댓글입니다.</p>
            </li>
          );
        }

        const nickname = comment.author?.nickname ?? "알 수 없음";
        const isMine = !!currentUserId && comment.author?.id === currentUserId;

        return (
          <li key={comment.id} className="flex gap-2 px-4 py-3">
            <Avatar
              url={comment.author?.avatar_url ?? null}
              nickname={nickname}
              className="h-8 w-8 text-xs"
            />
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {nickname}
                </span>
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(comment.created_at)}
                </span>
                {isMine && (
                  <div className="ml-auto">
                    <CommentActions commentId={comment.id} postId={postId} />
                  </div>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                {comment.content}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

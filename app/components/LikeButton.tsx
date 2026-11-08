"use client";

import { useState, useTransition } from "react";
import HeartIcon from "@/app/components/HeartIcon";
import { toggleLike } from "@/app/actions/likes";

/**
 * 하트 버튼 + 좋아요 수. 클릭 시 낙관적으로 즉시 토글하고 toggleLike를 커밋한다.
 * 실패하면 이전 상태로 롤백, 성공하면 서버 기준값으로 보정한다.
 * 좋아요 수가 0이면 숫자는 표시하지 않는다.
 */
export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;

    // 낙관적 업데이트
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleLike(postId);
      if ("error" in result) {
        setLiked(prevLiked);
        setCount(prevCount);
        return;
      }
      setLiked(result.liked);
      setCount(result.likeCount);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      className="flex items-center gap-1.5"
    >
      <HeartIcon
        filled={liked}
        className={`h-6 w-6 transition-colors ${liked ? "text-primary" : "text-gray-400"}`}
      />
      {count > 0 && (
        <span className={`text-sm ${liked ? "text-primary" : "text-gray-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

"use client";

import { useState } from "react";
import { deleteComment } from "@/app/actions/comments";

/**
 * 내 댓글에만 노출되는 ⋮ 버튼 + 바텀시트(삭제하기).
 * 삭제는 소프트 삭제 서버 액션(deleteComment)에 id를 bind해 form으로 제출한다.
 */
export default function CommentActions({
  commentId,
  postId,
}: {
  commentId: string;
  postId: string;
}) {
  const [open, setOpen] = useState(false);
  const deleteAction = deleteComment.bind(null, commentId, postId);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="댓글 메뉴"
        aria-haspopup="menu"
        onClick={() => setOpen(true)}
        className="-mr-1 p-1 text-gray-400"
      >
        <EllipsisIcon className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="닫기"
            onClick={close}
            className="absolute inset-0 h-full w-full bg-black/40"
          />

          <div className="fixed inset-x-0 bottom-0">
            <div className="mx-auto max-w-md p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="overflow-hidden rounded-2xl bg-white">
                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    if (!window.confirm("이 댓글을 삭제할까요?")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="flex h-14 w-full items-center justify-center text-base font-semibold text-red-500 transition-colors hover:bg-gray-50"
                  >
                    삭제하기
                  </button>
                </form>
              </div>

              <button
                type="button"
                onClick={close}
                className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-white text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EllipsisIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

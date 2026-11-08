"use client";

import Link from "next/link";
import { useState } from "react";
import { deletePost } from "@/app/actions/posts";

/**
 * 내 글에만 노출되는 ⋮ 버튼 + 바텀시트(수정하기 / 삭제하기).
 * 삭제는 서버 액션(deletePost)에 id를 bind해 form으로 제출한다.
 */
export default function PostActions({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const deleteAction = deletePost.bind(null, postId);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="더보기"
        aria-haspopup="menu"
        onClick={() => setOpen(true)}
        className="-mr-1 p-1 text-gray-600"
      >
        <EllipsisIcon className="h-6 w-6" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
          {/* 배경 딤 — 탭하면 닫힘 */}
          <button
            type="button"
            aria-label="닫기"
            onClick={close}
            className="absolute inset-0 h-full w-full bg-black/40"
          />

          {/* 바텀시트: 모바일 컨테이너(max-w-md) 폭에 맞춰 하단 중앙 정렬 */}
          <div className="fixed inset-x-0 bottom-0">
            <div className="mx-auto max-w-md p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="overflow-hidden rounded-2xl bg-white">
                <Link
                  href={`/post/${postId}/edit`}
                  onClick={close}
                  className="flex h-14 items-center justify-center border-b border-gray-100 text-base text-gray-900 transition-colors hover:bg-gray-50"
                >
                  수정하기
                </Link>
                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    if (!window.confirm("이 글을 삭제할까요?")) {
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

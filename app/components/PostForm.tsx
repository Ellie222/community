"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { PostFormState } from "@/app/actions/posts";
import { POST_CONTENT_MAX_LENGTH, validatePost } from "@/lib/validation";

type PostAction = (
  state: PostFormState,
  formData: FormData,
) => Promise<PostFormState>;

/**
 * 글 작성/수정 공용 폼. action(createPost 또는 id를 bind한 updatePost)과
 * 초기값을 주입받아 동일한 UI로 재사용한다.
 */
export default function PostForm({
  action,
  headerTitle,
  cancelHref,
  initialTitle = "",
  initialContent = "",
}: {
  action: PostAction;
  headerTitle: string;
  cancelHref: string;
  initialTitle?: string;
  initialContent?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [values, setValues] = useState({
    title: initialTitle,
    content: initialContent,
  });
  const [clientError, setClientError] = useState<string | null>(null);

  const error = clientError ?? state.error;

  function update(field: keyof typeof values) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (clientError) setClientError(null);
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const validationError = validatePost(values);
    if (validationError) {
      event.preventDefault();
      setClientError(validationError);
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col"
      noValidate
    >
      {/* Header: 취소 / 제목 / 저장(제출) */}
      <header className="flex h-14 items-center justify-between px-4">
        <Link href={cancelHref} className="text-base text-gray-500">
          취소
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">{headerTitle}</h1>
        <button
          type="submit"
          disabled={pending}
          className="text-base font-semibold text-primary disabled:opacity-40"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </header>

      <div className="flex flex-1 flex-col px-4 pt-2">
        <input
          name="title"
          value={values.title}
          onChange={update("title")}
          placeholder="제목"
          autoComplete="off"
          className="h-11 border-b border-gray-100 text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-300"
        />
        <textarea
          name="content"
          value={values.content}
          onChange={update("content")}
          placeholder="내용을 입력하세요"
          maxLength={POST_CONTENT_MAX_LENGTH}
          className="mt-3 min-h-40 flex-1 resize-none text-base leading-relaxed text-gray-900 outline-none placeholder:text-gray-300"
        />

        {error && (
          <p role="alert" className="pb-3 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

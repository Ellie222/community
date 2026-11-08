"use client";

import { useActionState, useEffect, useState } from "react";
import { createComment, type CommentFormState } from "@/app/actions/comments";
import { COMMENT_MAX_LENGTH, validateComment } from "@/lib/validation";

const initialState: CommentFormState = {};

export default function CommentInput({ postId }: { postId: string }) {
  const action = createComment.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [value, setValue] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const error = clientError ?? state.error;

  // 작성 성공 시 입력창 비우기(매 성공마다 state가 새 객체 → 매번 실행)
  useEffect(() => {
    if (state.ok) {
      setValue("");
      setClientError(null);
    }
  }, [state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const validationError = validateComment({ content: value });
    if (validationError) {
      event.preventDefault();
      setClientError(validationError);
    }
  }

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      <form action={formAction} onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="content"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (clientError) setClientError(null);
          }}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder="댓글을 입력하세요"
          autoComplete="off"
          className="h-10 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary focus:bg-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          작성
        </button>
      </form>
      {error && (
        <p role="alert" className="pt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

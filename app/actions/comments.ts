"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateComment } from "@/lib/validation";

export type CommentFormState = {
  error?: string;
  // 성공 시 true. 클라이언트가 입력창을 비우는 신호로 쓴다(매 성공마다 새 객체).
  ok?: boolean;
};

/**
 * 댓글 작성 Server Action. postId를 bind해 useActionState와 함께 사용한다.
 * 성공 후 상세 경로를 revalidate해 목록이 바로 갱신되도록 한다.
 */
export async function createComment(
  postId: string,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const content = String(formData.get("content") ?? "").trim();

  const validationError = validateComment({ content });
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, content });

  if (error) {
    return { error: "댓글 작성에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath(`/post/${postId}`);
  return { ok: true };
}

/**
 * 댓글 소프트 삭제 Server Action. `<form action={deleteComment.bind(null, id, postId)}>`로 호출.
 * DB에서 지우지 않고 deleted_at만 채워, 화면에서 "삭제된 댓글입니다"로 표시한다.
 */
export async function deleteComment(
  commentId: string,
  postId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 본인 댓글 + 아직 삭제되지 않은 것만. RLS(comments_update_own)와 이중 방어.
  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", user.id)
    .is("deleted_at", null);

  if (error) {
    throw new Error("댓글 삭제에 실패했습니다.");
  }

  revalidatePath(`/post/${postId}`);
}

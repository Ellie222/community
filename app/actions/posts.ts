"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validatePost } from "@/lib/validation";

export type PostFormState = {
  error?: string;
};

/**
 * 글 작성 Server Action. useActionState와 함께 사용한다.
 * 저장 성공 시 피드("/")로 리다이렉트하므로 정상 경로에서는 반환하지 않는다.
 */
export async function createPost(
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  const validationError = validatePost({ title, content });
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미들웨어 가드가 있지만 Action에서도 인증을 재확인한다(이중 방어).
  if (!user) redirect("/login");

  // 작성자는 현재 로그인 유저. RLS(posts_insert_own)가 author_id = auth.uid()를 강제한다.
  const { error } = await supabase
    .from("posts")
    .insert({ title, content, author_id: user.id });

  if (error) {
    return { error: "글 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/");
  redirect("/");
}

/**
 * 글 수정 Server Action. id를 bind해 useActionState와 함께 사용한다.
 * 성공 시 해당 글 상세로 리다이렉트한다.
 */
export async function updatePost(
  id: string,
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  const validationError = validatePost({ title, content });
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // author_id 조건 + RLS(posts_update_own)로 본인 글만 수정 가능(이중 방어).
  const { error } = await supabase
    .from("posts")
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    return { error: "글 수정에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${id}`);
  redirect(`/post/${id}`);
}

/**
 * 글 삭제 Server Action. `<form action={deletePost.bind(null, id)}>`로 호출한다.
 * 연관 댓글/좋아요는 FK CASCADE로 함께 정리된다. 성공 시 피드로 이동한다.
 */
export async function deletePost(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    throw new Error("글 삭제에 실패했습니다.");
  }

  revalidatePath("/");
  redirect("/");
}

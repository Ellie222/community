import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { updatePost } from "@/app/actions/posts";
import PostForm from "@/app/components/PostForm";
import { createClient } from "@/lib/supabase/server";
import { getPost } from "@/lib/queries/posts";

export const metadata: Metadata = {
  title: "글 수정 · 커뮤니티",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  // 작성자 본인만 수정 화면 접근 가능(아니면 상세로 돌려보낸다).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== post.author?.id) redirect(`/post/${id}`);

  return (
    <main className="flex flex-1 flex-col">
      <PostForm
        action={updatePost.bind(null, id)}
        headerTitle="글 수정"
        cancelHref={`/post/${id}`}
        initialTitle={post.title}
        initialContent={post.content}
      />
    </main>
  );
}

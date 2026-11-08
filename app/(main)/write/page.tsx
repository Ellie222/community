import type { Metadata } from "next";
import { createPost } from "@/app/actions/posts";
import PostForm from "@/app/components/PostForm";

export const metadata: Metadata = {
  title: "글쓰기 · 커뮤니티",
};

export default function WritePage() {
  return (
    <main className="flex flex-1 flex-col">
      <PostForm action={createPost} headerTitle="글쓰기" cancelHref="/" />
    </main>
  );
}

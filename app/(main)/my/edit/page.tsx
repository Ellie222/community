import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/app/components/ProfileEditForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "프로필 수정 · 커뮤니티",
};

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 본인만 수정 가능(미들웨어 가드 + 페이지 재확인).
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="flex flex-1 flex-col">
      <ProfileEditForm
        initialNickname={profile?.nickname ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? null}
      />
    </main>
  );
}

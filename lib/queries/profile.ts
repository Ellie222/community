import { createClient } from "@/lib/supabase/server";

/**
 * 특정 유저의 프로필(닉네임/아바타)을 조회한다. 없으면 null.
 */
export async function getProfile(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url")
    .eq("id", id)
    .maybeSingle();

  return data;
}

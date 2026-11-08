"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateLogin, validateSignup } from "@/lib/validation";

export type AuthFormState = {
  error?: string;
};

/**
 * 회원가입 Server Action. useActionState와 함께 사용한다.
 * 성공(세션 발급) 시 홈("/")으로 리다이렉트하므로 정상 경로에서는 반환하지 않는다.
 */
export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  // 클라이언트와 동일 규칙으로 서버에서도 최종 검증(이중 방어)
  const validationError = validateSignup({ email, password, passwordConfirm });
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: translateAuthError(error) };

  // 이메일 확인(Confirm email)이 켜져 있으면 세션이 없어 자동 로그인이 안 된다.
  if (!data.session) {
    return {
      error:
        "가입은 되었지만 자동 로그인에 실패했습니다. Supabase의 이메일 확인 설정을 꺼주세요.",
    };
  }

  // redirect는 내부적으로 예외를 던지므로 try/catch로 감싸지 않는다.
  redirect("/");
}

/**
 * 로그인 Server Action. useActionState와 함께 사용한다.
 * 성공 시 홈("/")으로 리다이렉트하므로 정상 경로에서는 반환하지 않는다.
 */
export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const validationError = validateLogin({ email, password });
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: translateSignInError(error) };

  redirect("/");
}

/**
 * 로그아웃 Server Action. `<form action={signOut}>`로 직접 호출한다.
 * Server Action 컨텍스트에서는 쿠키 쓰기가 허용되므로 세션 쿠키가 정리된다.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function translateSignInError(error: {
  message: string;
  code?: string;
}): string {
  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials"))
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (message.includes("email not confirmed"))
    return "이메일 인증이 완료되지 않았습니다.";
  return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function translateAuthError(error: { message: string; code?: string }): string {
  const message = error.message.toLowerCase();
  if (
    message.includes("already registered") ||
    message.includes("already been")
  )
    return "이미 가입된 이메일입니다.";
  if (message.includes("password")) return "비밀번호 형식이 올바르지 않습니다.";
  if (message.includes("email")) return "이메일 형식이 올바르지 않습니다.";
  return "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

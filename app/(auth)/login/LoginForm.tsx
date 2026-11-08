"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, type AuthFormState } from "@/app/actions/auth";
import { validateLogin } from "@/lib/validation";

const initialState: AuthFormState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [values, setValues] = useState({ email: "", password: "" });
  // 서버 왕복 전에 잡아내는 클라이언트 측 오류
  const [clientError, setClientError] = useState<string | null>(null);

  const error = clientError ?? state.error;

  function update(field: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (clientError) setClientError(null);
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const validationError = validateLogin(values);
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
      <div className="flex flex-1 flex-col gap-5 px-4 pt-2">
        <Field
          label="이메일"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="example@email.com"
          value={values.email}
          onChange={update("email")}
        />
        <Field
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호 입력"
          value={values.password}
          onChange={update("password")}
        />

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        {/* 확인(로그인) 버튼: 입력창 바로 아래. signIn 액션에 연결됨 */}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 h-12 w-full rounded-xl bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? "확인 중..." : "확인"}
        </button>
      </div>

      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
        <p className="text-center text-sm text-gray-500">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-semibold text-primary">
            회원가입
          </Link>
        </p>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

function Field({ label, name, ...inputProps }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        name={name}
        {...inputProps}
        className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:bg-white"
      />
    </label>
  );
}

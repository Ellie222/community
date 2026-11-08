import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "로그인 · 커뮤니티",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Header (높이 56, 좌우 16 패딩) */}
      <header className="flex h-14 items-center px-4">
        <h1 className="text-lg font-semibold text-gray-900">로그인</h1>
      </header>

      <LoginForm />
    </main>
  );
}

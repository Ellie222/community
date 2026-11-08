import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "회원가입 · 커뮤니티",
};

export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Header (높이 56, 좌우 16 패딩) */}
      <header className="flex h-14 items-center px-4">
        <h1 className="text-lg font-semibold text-gray-900">회원가입</h1>
      </header>

      <SignupForm />
    </main>
  );
}

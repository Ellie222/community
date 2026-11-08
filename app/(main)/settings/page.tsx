import { signOut } from "@/app/actions/auth";

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Header (높이 56, 좌우 16 패딩) */}
      <header className="flex h-14 items-center px-4">
        <h1 className="text-lg font-semibold text-gray-900">설정</h1>
      </header>

      <ul className="flex flex-col">
        <li>
          {/* 로그아웃: 서버 액션으로 세션 정리 후 /login으로 이동 */}
          <form action={signOut}>
            <button
              type="submit"
              className="flex h-14 w-full items-center px-4 text-left text-base text-red-500 transition-colors hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>
        </li>
      </ul>
    </main>
  );
}

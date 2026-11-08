"use client";

import Link from "next/link";
import { useRef, useState, useActionState } from "react";
import Avatar from "@/app/components/Avatar";
import { updateProfile, type ProfileFormState } from "@/app/actions/profile";
import { NICKNAME_MAX_LENGTH, validateNickname } from "@/lib/validation";

const initialState: ProfileFormState = {};

export default function ProfileEditForm({
  initialNickname,
  initialAvatarUrl,
}: {
  initialNickname: string;
  initialAvatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );
  const [nickname, setNickname] = useState(initialNickname);
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = clientError ?? state.error;
  const shownAvatar = preview ?? initialAvatarUrl;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const validationError = validateNickname(nickname);
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
      {/* Header: 취소 / 제목 / 저장 */}
      <header className="flex h-14 items-center justify-between px-4">
        <Link href="/my" className="text-base text-gray-500">
          취소
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">프로필 수정</h1>
        <button
          type="submit"
          disabled={pending}
          className="text-base font-semibold text-primary disabled:opacity-40"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </header>

      {/* 아바타 + 사진 변경 */}
      <div className="flex flex-col items-center gap-3 px-4 py-6">
        <Avatar
          url={shownAvatar}
          nickname={nickname || initialNickname}
          className="h-24 w-24 text-3xl"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm font-semibold text-primary"
        >
          사진 변경
        </button>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 닉네임 */}
      <div className="flex flex-col gap-1.5 px-4">
        <label htmlFor="nickname" className="text-sm font-medium text-gray-700">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            if (clientError) setClientError(null);
          }}
          maxLength={NICKNAME_MAX_LENGTH}
          placeholder="닉네임을 입력하세요"
          autoComplete="off"
          className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:bg-white"
        />
        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

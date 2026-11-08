/**
 * 프로필 아바타. avatar_url이 있으면 이미지를, 없으면 닉네임 첫 글자로 기본 아바타를 그린다.
 * 크기는 className(예: "h-9 w-9 text-sm")으로 조절한다.
 */
export default function Avatar({
  url,
  nickname,
  className = "h-9 w-9 text-sm",
}: {
  url: string | null;
  nickname: string;
  className?: string;
}) {
  if (url) {
    return (
      // 아바타는 Supabase Storage 공개 URL. next/image 원격 설정 대신 img 사용.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`${nickname} 프로필 이미지`}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-500`}
    >
      {nickname.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * ISO 시간 문자열을 "방금 전 / n분 전 / n시간 전 / n일 전" 상대 표기로 변환한다.
 * 7일 이상 지난 경우 YYYY.MM.DD 절대 날짜로 표기한다.
 */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Math.max(0, Date.now() - then);
  const sec = Math.floor(diffMs / 1000);

  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;

  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${month}.${date}`;
}

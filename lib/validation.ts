// 회원가입/로그인 입력 검증. 클라이언트(즉시 피드백)와 Server Action(최종 방어)에서
// 동일하게 재사용한다.

export const PASSWORD_MIN_LENGTH = 8;

// 완벽한 RFC 검증 대신 실사용에 충분한 수준의 이메일 형식 체크.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupInput = {
  email: string;
  password: string;
  passwordConfirm: string;
};

/**
 * 회원가입 입력을 검증한다. 문제가 없으면 null, 있으면 사용자 메시지를 반환한다.
 * 첫 번째로 발견된 오류 하나만 반환한다(폼 상단/버튼 근처에 노출).
 */
export function validateSignup({
  email,
  password,
  passwordConfirm,
}: SignupInput): string | null {
  if (!email.trim()) return "이메일을 입력해 주세요.";
  if (!EMAIL_REGEX.test(email)) return "올바른 이메일 형식이 아닙니다.";
  if (!password) return "비밀번호를 입력해 주세요.";
  if (password.length < PASSWORD_MIN_LENGTH)
    return `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  if (!passwordConfirm) return "비밀번호 확인을 입력해 주세요.";
  if (password !== passwordConfirm) return "비밀번호가 일치하지 않습니다.";
  return null;
}

// 글 작성 제약 (요구사항: 본문 2,000자). 클라이언트 + Action 양쪽에서 검증.
export const POST_TITLE_MAX_LENGTH = 100;
export const POST_CONTENT_MAX_LENGTH = 2000;

export type PostInput = {
  title: string;
  content: string;
};

/**
 * 글 작성 입력을 검증한다. 문제가 없으면 null, 있으면 사용자 메시지를 반환한다.
 */
export function validatePost({ title, content }: PostInput): string | null {
  if (!title.trim()) return "제목을 입력해 주세요.";
  if (title.trim().length > POST_TITLE_MAX_LENGTH)
    return `제목은 ${POST_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`;
  if (!content.trim()) return "내용을 입력해 주세요.";
  if (content.trim().length > POST_CONTENT_MAX_LENGTH)
    return `내용은 ${POST_CONTENT_MAX_LENGTH}자 이하로 입력해 주세요.`;
  return null;
}

// 닉네임 제약 (2~20자)
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

export function validateNickname(nickname: string): string | null {
  const value = nickname.trim();
  if (!value) return "닉네임을 입력해 주세요.";
  if (value.length < NICKNAME_MIN_LENGTH)
    return `닉네임은 최소 ${NICKNAME_MIN_LENGTH}자 이상이어야 합니다.`;
  if (value.length > NICKNAME_MAX_LENGTH)
    return `닉네임은 ${NICKNAME_MAX_LENGTH}자 이하로 입력해 주세요.`;
  return null;
}

// 댓글 제약
export const COMMENT_MAX_LENGTH = 1000;

export type CommentInput = {
  content: string;
};

export function validateComment({ content }: CommentInput): string | null {
  if (!content.trim()) return "댓글을 입력해 주세요.";
  if (content.trim().length > COMMENT_MAX_LENGTH)
    return `댓글은 ${COMMENT_MAX_LENGTH}자 이하로 입력해 주세요.`;
  return null;
}

export type LoginInput = {
  email: string;
  password: string;
};

/**
 * 로그인 입력을 검증한다. 회원가입과 달리 길이 규칙은 검사하지 않고
 * (실제 인증 실패는 Supabase가 판정) 빈 값·형식만 막는다.
 */
export function validateLogin({ email, password }: LoginInput): string | null {
  if (!email.trim()) return "이메일을 입력해 주세요.";
  if (!EMAIL_REGEX.test(email)) return "올바른 이메일 형식이 아닙니다.";
  if (!password) return "비밀번호를 입력해 주세요.";
  return null;
}

#!/usr/bin/env bash
#
# PreToolUse 안전가드 (git commit/push 시크릿 스캔)
# - git commit / git push 명령에 한해, 커밋/푸시될 "추가된 내용"을 스캔
# - 개인키(PEM), 주요 클라우드/SaaS 토큰, Supabase service_role 키 등이 섞여 있으면 차단
# - 비밀 파일(.env*, .mcp.json)이 커밋에 포함돼도 차단
# - git commit/push 가 아니거나 시크릿이 없으면 조용히 통과(exit 0)
#
set -uo pipefail

input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
[ "$tool" = "Bash" ] || exit 0

cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

# git commit / git push 서브커맨드일 때만 동작 (git -c ... commit 같은 전역 옵션 허용)
is_commit=0; is_push=0
printf '%s' "$cmd" | grep -Eq '\bgit\b([[:space:]]+-[^[:space:]]+)*[[:space:]]+commit\b' && is_commit=1
printf '%s' "$cmd" | grep -Eq '\bgit\b([[:space:]]+-[^[:space:]]+)*[[:space:]]+push\b'   && is_push=1
[ "$is_commit" = 1 ] || [ "$is_push" = 1 ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# ── 스캔 대상 수집: 새로 추가되는(+) 내용 + 파일 목록 ────────────────
content=""; names=""
if [ "$is_commit" = 1 ]; then
  # -a/--all/-am 이면 스테이징 안 된 추적 변경도 함께 커밋됨
  if printf '%s' "$cmd" | grep -Eq '(^|[[:space:]])-([[:alnum:]]*a)|--all'; then
    content=$(git diff --no-color HEAD 2>/dev/null; git diff --cached --no-color 2>/dev/null)
    names=$(git diff --name-only HEAD 2>/dev/null; git diff --cached --name-only 2>/dev/null)
  else
    content=$(git diff --cached --no-color 2>/dev/null)
    names=$(git diff --cached --name-only 2>/dev/null)
  fi
else
  # push: 업스트림/푸시대상 대비 앞선 커밋들, 없으면 원격에 없는 로컬 커밋 전체
  if git rev-parse --abbrev-ref '@{push}' >/dev/null 2>&1; then
    content=$(git log -p --no-color '@{push}..HEAD' 2>/dev/null)
    names=$(git diff --name-only '@{push}..HEAD' 2>/dev/null)
  elif git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
    content=$(git log -p --no-color '@{u}..HEAD' 2>/dev/null)
    names=$(git diff --name-only '@{u}..HEAD' 2>/dev/null)
  else
    content=$(git log -p --no-color --branches --not --remotes 2>/dev/null)
    names=$(git log --name-only --pretty=format: --branches --not --remotes 2>/dev/null | sort -u)
  fi
fi

# 추가된 라인만(+ 로 시작, +++ 헤더 제외) 추출
added=$(printf '%s\n' "$content" | grep -E '^\+' | grep -vE '^\+\+\+' | sed 's/^\+//')
[ -n "$added" ] || { [ -n "$names" ] || exit 0; }

# ── 비밀 파일이 커밋/푸시 목록에 포함? ───────────────────────────────
secret_file=$(printf '%s\n' "$names" | grep -E '(^|/)(\.env(\..*)?|.*\.env|\.mcp\.json)$' | head -1 || true)
if [ -n "$secret_file" ]; then
  deny "🔒 비밀 파일 '${secret_file}'이(가) 커밋/푸시 대상에 포함되어 차단되었습니다. .gitignore 에 추가하고 'git rm --cached'로 인덱스에서 제외하세요."
fi

# ── 고신뢰 시크릿 패턴 스캔 ─────────────────────────────────────────
declare -a labels=(
  "PEM 개인키"          '-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----'
  "AWS 액세스 키"        '\b(AKIA|ASIA)[0-9A-Z]{16}\b'
  "GitHub 토큰"          '\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,})\b'
  "Slack 토큰"           '\bxox[baprs]-[A-Za-z0-9-]{10,}'
  "Google API 키"        '\bAIza[0-9A-Za-z_\-]{35}\b'
  "Stripe 라이브 키"     '\b(sk|rk)_live_[0-9A-Za-z]{16,}\b'
  "OpenAI 키"            '\bsk-(proj-)?[A-Za-z0-9_\-]{20,}\b'
  "Supabase PAT"         '\bsbp_[0-9a-fA-F]{40}\b'
  "Slack 웹훅"           'hooks\.slack\.com/services/'
)

hits=""
i=0
while [ $i -lt ${#labels[@]} ]; do
  name="${labels[$i]}"; pat="${labels[$((i+1))]}"
  if printf '%s' "$added" | grep -Eq -e "$pat"; then
    hits="${hits}\n  • ${name}"
  fi
  i=$((i+2))
done

# ── Supabase service_role JWT 판별(anon 키는 공개용이라 통과) ─────────
b64url_decode() {
  local s="$1"; local pad=$(( (4 - ${#s} % 4) % 4 )); local j
  for ((j=0;j<pad;j++)); do s="${s}="; done
  s=$(printf '%s' "$s" | tr '_-' '/+')
  # GNU base64 는 -d, BSD/macOS 는 -D → 둘 다 시도
  printf '%s' "$s" | base64 -d 2>/dev/null || printf '%s' "$s" | base64 -D 2>/dev/null || true
}
while IFS= read -r jwt; do
  [ -n "$jwt" ] || continue
  payload="${jwt#*.}"; payload="${payload%%.*}"
  if b64url_decode "$payload" | grep -q 'service_role'; then
    hits="${hits}\n  • Supabase service_role 키(JWT)"
    break
  fi
done < <(printf '%s' "$added" | grep -oE 'eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}(\.[A-Za-z0-9_-]+)?')

if [ -n "$hits" ]; then
  deny "$(printf '🚫 커밋/푸시에 비밀키로 보이는 값이 감지되어 차단되었습니다:%b\n\n안전한 커밋이 맞다면 해당 값을 제거하거나(환경변수/시크릿 매니저 사용) 오탐이면 .claude/hooks/git-secret-guard.sh 를 잠시 비활성화하세요.' "$hits")"
fi

exit 0

#!/usr/bin/env bash
#
# PreToolUse 안전가드
# - 비밀 파일(.env*, .mcp.json)의 수정/삭제 차단 (Write/Edit + Bash rm/mv/redirect 등)
# - rm -rf 류의 위험한 재귀+강제 삭제 명령 차단
# - 그 외 안전한 작업은 아무 출력 없이 exit 0 → 평소 권한 흐름대로 통과
#
set -euo pipefail

input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')

# 차단: PreToolUse deny 결정 + 사용자에게 보여줄 이유 출력
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

# 비밀 파일 basename 판별
is_secret_path() {
  case "$(basename "$1")" in
    .env | .env.* | *.env | .mcp.json) return 0 ;;
    *) return 1 ;;
  esac
}

case "$tool" in
  Write | Edit | MultiEdit | NotebookEdit)
    path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
    if [ -n "$path" ] && is_secret_path "$path"; then
      deny "🔒 비밀 파일 '$(basename "$path")'은 수정할 수 없도록 보호되어 있습니다. 환경변수/시크릿은 직접 편집하세요. 정말 필요하면 .claude/hooks/safety-guard.sh(또는 해당 훅)를 잠시 비활성화하세요."
    fi
    ;;

  Bash)
    cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

    # rm 명령 세그먼트만 추출(첫 rm 단어부터 줄 끝까지) — npm 등 오탐 방지
    rm_seg=$(printf '%s\n' "$cmd" | grep -oE '(^|[|;&`(]|[[:space:]])rm[[:space:]].*' | head -1 || true)
    if [ -n "$rm_seg" ]; then
      # 재귀 플래그(-r/-R/--recursive)와 강제 플래그(-f/--force)가 함께 있으면 위험
      recursive=0; force=0
      printf '%s' "$rm_seg" | grep -Eq '(-[[:alnum:]]*[rR])|(--recursive)' && recursive=1 || true
      printf '%s' "$rm_seg" | grep -Eq '(-[[:alnum:]]*f)|(--force)' && force=1 || true
      if [ "$recursive" = 1 ] && [ "$force" = 1 ]; then
        deny "💥 위험한 삭제 명령이 차단되었습니다: '${cmd}'. 재귀(-r)+강제(-f) 삭제는 되돌릴 수 없습니다. 꼭 필요하면 대상을 좁혀(-rf 없이, 구체적 경로로) 다시 시도하거나 직접 실행하세요."
      fi
    fi

    # 비밀 파일을 삭제/이동/덮어쓰기 하려는 명령 차단
    if printf '%s' "$cmd" | grep -Eq '((^|[|;&`(]|[[:space:]])(rm|mv|shred|truncate|tee)[[:space:]]|sed[[:space:]]+-i|>{1,2})[^|;&]*(\.env([.[:alnum:]]*)?|\.mcp\.json)([[:space:]]|$|["'"'"'])'; then
      deny "🔒 비밀 파일(.env* / .mcp.json)을 삭제·이동·덮어쓰기 하려는 명령이 차단되었습니다: '${cmd}'. 시크릿 파일은 보호되어 있습니다."
    fi
    ;;
esac

# 안전한 작업 → 통과
exit 0

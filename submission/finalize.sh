#!/usr/bin/env bash
# 把仓库里所有 OWNER 占位符替换成你的 GitHub 用户名。
#
#   bash submission/finalize.sh <你的GitHub用户名>
#
# 改完需要重新提交并推送：
#   git add -A && git commit -m "chore: 填入仓库地址" && git push
set -euo pipefail

if [ $# -ne 1 ] || [ -z "$1" ]; then
  echo "用法: bash submission/finalize.sh <你的GitHub用户名>" >&2
  exit 1
fi

OWNER="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ROOT/package.json" ]; then
  echo "找不到 $ROOT/package.json" >&2
  exit 1
fi

# 只替换这些文件里的 OWNER（避免误伤二进制资源）
for f in package.json submission/ENTRY.yml README.md; do
  [ -f "$ROOT/$f" ] || continue
  # macOS 与 GNU 的 sed -i 语法不同，用临时文件规避
  sed "s|github\.com/OWNER|github.com/$OWNER|g; s|githubusercontent\.com/OWNER|githubusercontent.com/$OWNER|g; s|^name: OWNER/|name: $OWNER/|g" \
    "$ROOT/$f" > "$ROOT/$f.tmp"
  mv "$ROOT/$f.tmp" "$ROOT/$f"
  echo "已更新 $f"
done

echo
echo "剩余 OWNER 占位符（应为空）:"
grep -rn "OWNER" "$ROOT/package.json" "$ROOT/submission/ENTRY.yml" "$ROOT/README.md" || echo "  （无）"
echo
echo "下一步："
echo "  1. git add -A && git commit -m 'chore: 填入仓库地址'"
echo "  2. 在 GitHub 建公开仓库 ${OWNER}/dsh-nba-board 并 push"
echo "  3. 满 1 天后，向 awesome-dsh-plugin 提 PR，新增文件:"
echo "       data/plugins/${OWNER}__dsh-nba-board.yml"
echo "     内容就是本仓库的 submission/ENTRY.yml"

#!/bin/sh
# copy medal/v2 to the lightweight goods-assets branch and print its commit SHA
# usage: sh rewards/sync_assets.sh   then: python3 rewards/build.py <SHA> main|rewards
set -e
R=$(cd "$(dirname "$0")/.." && pwd); W=/tmp/claude-0/goodswt
[ -d "$W" ] || git -C "$R" worktree add "$W" goods-assets
rm -rf "$W/medal/v2" && mkdir -p "$W/medal" && cp -r "$R/medal/v2" "$W/medal/v2"
cd "$W"; git add -A
git diff --cached --quiet || git commit -qm "Sync goods assets"
git push -q origin goods-assets; git rev-parse HEAD

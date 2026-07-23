#!/usr/bin/env bash
# On Windows, run from Git Bash / WSL, or enable Developer Mode (required for symlinks).
# Symlinks AI agent instruction files to AGENTS.md (the source of truth).
set -u

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 0

SOURCE="AGENTS.md"

if [ ! -f "$SOURCE" ]; then
  printf '# AGENTS.md\n\nProject instructions for AI coding agents.\n' > "$SOURCE"
  echo "created placeholder $SOURCE"
fi

# target|depth (number of ../ segments to reach repo root; 0 for root-level targets)
TARGETS="
CLAUDE.md|0
GEMINI.md|0
.cursorrules|0
.cursor/rules/AGENTS.md|2
.windsurfrules|0
.windsurf/rules/AGENTS.md|2
.github/copilot-instructions.md|1
.rules|0
"

link_one() {
  target="$1"
  depth="$2"

  prefix=""
  i=0
  while [ "$i" -lt "$depth" ]; do
    prefix="../$prefix"
    i=$((i + 1))
  done
  rel="${prefix}${SOURCE}"

  dir="$(dirname "$target")"
  if [ "$dir" != "." ]; then
    mkdir -p "$dir" || {
      echo "warning: could not create directory $dir" >&2
      return 0
    }
  fi

  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ -L "$target" ]; then
      ln -sfn "$rel" "$target" || {
        echo "warning: could not update symlink $target" >&2
        return 0
      }
      return 0
    fi
    echo "warning: skipping $target (exists as a real file, not a symlink)" >&2
    return 0
  fi

  ln -sfn "$rel" "$target" || {
    echo "warning: could not create symlink $target" >&2
    return 0
  }
}

printf '%s\n' "$TARGETS" | while IFS='|' read -r target depth; do
  [ -z "${target:-}" ] && continue
  link_one "$target" "$depth"
done

exit 0

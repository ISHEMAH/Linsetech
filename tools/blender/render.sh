#!/bin/bash
# Render + encode both pre-rendered clips headlessly (Blender 5.2, EEVEE/Metal). ~40 min on an M1 Pro.
#   tools/blender/render.sh            # full pipeline -> web/public/clips/
#   tools/blender/render.sh --preview  # 12-frame contact sheets only -> tools/blender/out/*_preview_sheet.png
set -euo pipefail
cd "$(dirname "$0")"
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
CLIPS=../../public/clips
if [[ "${1:-}" == "--preview" ]]; then
  "$BLENDER" -b -P hero.py -- --preview
  "$BLENDER" -b -P stack.py -- --preview
  exit 0
fi
"$BLENDER" -b -P hero.py -- "$@"
"$BLENDER" -b -P stack.py -- "$@"
"$BLENDER" -b -P encode.py -- hero
"$BLENDER" -b -P encode.py -- stack
# HEVC with alpha for Safari, every frame a keyframe (the page scrubs it by scroll). Built from the ProRes 4444 master.
if [[ ! -x hevc_alpha/hevc_alpha ]]; then swiftc -O -o hevc_alpha/hevc_alpha hevc_alpha/main.swift; fi
hevc_alpha/hevc_alpha "$CLIPS/stack_4444.mov" "$CLIPS/stack_safari.mp4" 1 0.85
rm -f "$CLIPS/stack_4444.mov"
python3 -I verify.py "$CLIPS"

#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist
cp index.html styles.css emoji-catalog.js emoji-labels-uk.js creative-tools.js creative-library-v2.js fullscreen-overlays.js uk-localization.js motion-keyframes.js beat-sync.js video-audio-extract.js local-transcription.js app.js _headers dist/
printf 'PTS Creative Studio: static build ready in dist/\n'

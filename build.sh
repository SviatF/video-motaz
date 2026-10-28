#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist
cp index.html styles.css emoji-catalog.js emoji-labels-uk.js creative-tools.js creative-library-v2.js fullscreen-overlays.js uk-localization.js app.js _headers dist/
printf 'PTS Creative Studio: static build ready in dist/\n'

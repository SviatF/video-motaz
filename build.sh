#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist
cp index.html styles.css emoji-catalog.js creative-tools.js creative-library-v2.js app.js _headers dist/
printf 'PTS Creative Studio: static build ready in dist/\n'

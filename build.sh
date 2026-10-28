#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist
cp index.html styles.css app.js _headers dist/
printf 'PTS Creative Studio: static build ready in dist/\n'

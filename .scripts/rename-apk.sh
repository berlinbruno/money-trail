#!/usr/bin/env bash
set -euo pipefail
VERSION="$1"
mkdir -p dist
APK="$(ls dist/*.apk 2>/dev/null | head -n1 || true)"
if [ -z "${APK}" ]; then
echo "No APK found in dist/ to rename."
exit 0
fi
# If branch is prerelease, semantic-release provides version like 1.2.0-beta.1
BASENAME="app-v${VERSION}.apk"
mv "${APK}" "dist/${BASENAME}"
echo "Renamed APK -> dist/${BASENAME}"
#!/usr/bin/env bash
# Runs inside reactivecircus/android-emulator-runner (the emulator only lives for the
# duration of that step), so the install, both Maestro flows and the evidence capture
# all happen here. Run from the repository root with the E2E_CLERK_USER_* variables set.
set -uo pipefail

ROOT="$PWD"
OUT="$ROOT/e2e-artifacts"
mkdir -p "$OUT"

# Maestro's default 15 s driver start-up limit is too short on a CI emulator.
export MAESTRO_DRIVER_STARTUP_TIMEOUT=120000

for name in E2E_CLERK_USER_USERNAME E2E_CLERK_USER_PASSWORD E2E_CLERK_USER_NAME; do
  if [ -z "${!name:-}" ]; then
    echo "::error::$name did not reach the script from the step environment."
    exit 1
  fi
done

collect_evidence() {
  local status=$?
  {
    echo "### Android"
    echo "- device: $(adb shell getprop ro.product.model | tr -d '\r')"
    echo "- API level: $(adb shell getprop ro.build.version.sdk | tr -d '\r')"
    echo "- expo: $(node -p "require('$ROOT/apps/mobile/node_modules/expo/package.json').version")"
  } | tee "$OUT/device-android.md" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  if [ "$status" -ne 0 ]; then
    timeout 20 adb exec-out screencap -p > "$OUT/failure-android.png" || true
    timeout 20 adb logcat -d -t 2000 > "$OUT/logcat-android.txt" || true
    # Screenshots only: Maestro's command JSON and logs contain the typed credentials.
    mkdir -p "$OUT/maestro-screenshots-android"
    find "$HOME/.maestro/tests" -name "*.png" -exec cp {} "$OUT/maestro-screenshots-android/" \; || true
  fi
  exit "$status"
}
trap collect_evidence EXIT

adb install "$ROOT"/apps/mobile/android/app/build/outputs/apk/release/app-release.apk

cd "$OUT"
maestro test -e PLATFORM=android --format junit --output junit-android.xml \
  ../apps/mobile/maestro/signed-out.yaml
maestro test -e PLATFORM=android \
  -e E2E_CLERK_USER_USERNAME="${E2E_CLERK_USER_USERNAME}" \
  -e E2E_CLERK_USER_PASSWORD="${E2E_CLERK_USER_PASSWORD}" \
  -e E2E_CLERK_USER_NAME="${E2E_CLERK_USER_NAME}" \
  --format junit --output junit-android-signin.xml \
  ../apps/mobile/maestro/sign-in.yaml

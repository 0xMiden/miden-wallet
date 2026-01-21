#!/bin/bash
set -e

# Ensure Node 22+ is available (required by the project)
if command -v nvm &> /dev/null || [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh" 2>/dev/null || true
  nvm use 22 2>/dev/null || true
fi

# Set ANDROID_HOME if not set
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  if [ -d "$HOME/Library/Android/sdk" ]; then
    # macOS local dev
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  elif [ -d "/usr/local/lib/android/sdk" ]; then
    # GitHub Actions (Linux)
    export ANDROID_HOME="/usr/local/lib/android/sdk"
  fi
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

# Set JAVA_HOME if not set
if [ -z "$JAVA_HOME" ]; then
  if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
    # macOS with Android Studio
    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  elif command -v /usr/libexec/java_home &> /dev/null; then
    # macOS with standalone Java
    export JAVA_HOME="$(/usr/libexec/java_home 2>/dev/null)"
  fi
  # GitHub Actions sets JAVA_HOME automatically, so no fallback needed
fi
[ -n "$JAVA_HOME" ] && export PATH="$JAVA_HOME/bin:$PATH"

EMULATOR_NAME="Pixel_API_34"
EMU_PID=""
STARTED_EMULATOR=false

cleanup() {
  if [ "$STARTED_EMULATOR" = true ] && [ -n "$EMU_PID" ]; then
    echo "Shutting down emulator (PID: $EMU_PID)..."
    kill "$EMU_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

# Check if an emulator is already running (e.g., in CI)
if "$ANDROID_HOME/platform-tools/adb" get-state 2>/dev/null | grep -q "device"; then
  echo "Emulator already running, skipping emulator startup..."
else
  echo "Starting Android emulator: $EMULATOR_NAME"
  "$ANDROID_HOME/emulator/emulator" -avd "$EMULATOR_NAME" -no-window -no-audio -no-boot-anim &
  EMU_PID=$!
  STARTED_EMULATOR=true

  echo "Waiting for emulator to connect..."
  "$ANDROID_HOME/platform-tools/adb" wait-for-device

  echo "Waiting for emulator to boot..."
  while [ "$("$ANDROID_HOME/platform-tools/adb" shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do
    sleep 2
  done
fi

echo "Emulator ready. Running tests..."
wdio run mobile-e2e/wdio.android.conf.ts

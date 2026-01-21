#!/bin/bash
set -e

# Ensure Node 22+ is available (required by the project)
if command -v nvm &> /dev/null || [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh" 2>/dev/null || true
  nvm use 22 2>/dev/null || true
fi

SIMULATOR_NAME="iPhone 17"
SIMULATOR_UDID=""

cleanup() {
  if [ -n "$SIMULATOR_UDID" ]; then
    echo "Shutting down simulator..."
    xcrun simctl shutdown "$SIMULATOR_UDID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "Finding simulator: $SIMULATOR_NAME"
# Use jq if available, otherwise fall back to Python
if command -v jq &> /dev/null; then
  SIMULATOR_UDID=$(xcrun simctl list devices available -j | jq -r ".devices | to_entries[] | .value[] | select(.name == \"$SIMULATOR_NAME\") | .udid" | head -1)
else
  SIMULATOR_UDID=$(xcrun simctl list devices available -j | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for d in devices:
        if d.get('name') == '$SIMULATOR_NAME':
            print(d.get('udid'))
            sys.exit(0)
")
fi

if [ -z "$SIMULATOR_UDID" ]; then
  echo "Error: Simulator '$SIMULATOR_NAME' not found"
  exit 1
fi

echo "Booting simulator (UDID: $SIMULATOR_UDID)..."
xcrun simctl boot "$SIMULATOR_UDID" 2>/dev/null || true

echo "Waiting for simulator to boot..."
while [ "$(xcrun simctl list devices | grep "$SIMULATOR_UDID" | grep -c "Booted")" -eq 0 ]; do
  sleep 2
done

echo "Enrolling FaceID..."
xcrun simctl spawn "$SIMULATOR_UDID" notifyutil -s com.apple.BiometricKit_Sim.enrollmentChanged 1
xcrun simctl spawn "$SIMULATOR_UDID" notifyutil -p com.apple.BiometricKit_Sim.enrollmentChanged

echo "Simulator ready. Running tests..."
wdio run mobile-e2e/wdio.ios.conf.ts

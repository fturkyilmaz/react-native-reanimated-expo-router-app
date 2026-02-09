#!/bin/bash
# Android Maestro Setup Script
# Version: 1.0.0

echo "🚀 Android Maestro Setup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}❌ ANDROID_HOME is not set. Please set ANDROID_HOME environment variable.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Android SDK found at: $ANDROID_HOME${NC}"

# Check if emulator exists
echo ""
echo "📱 Checking for Android emulator..."
EMULATOR_LIST=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null)

if [ -z "$EMULATOR_LIST" ]; then
    echo -e "${YELLOW}⚠️ No emulators found. Creating one...${NC}"
    $ANDROID_HOME/tools/bin/sdkmanager --licenses --sdk_root=$ANDROID_HOME > /dev/null 2>&1
    $ANDROID_HOME/tools/bin/sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" --sdk_root=$ANDROID_HOME > /dev/null 2>&1
    echo -e "${GREEN}✅ SDK packages installed${NC}"
else
    echo -e "${GREEN}✅ Available emulators:${NC}"
    echo "$EMULATOR_LIST"
fi

# Set emulator name
EMULATOR_NAME=${1:-"Pixel_6"}
echo ""
echo "🚀 Using emulator: $EMULATOR_NAME"

# Start emulator in background
echo "📱 Starting emulator..."
$ANDROID_HOME/emulator/emulator -avd $EMULATOR_NAME -no-audio -no-window -no-boot-anim &
EMULATOR_PID=$!

echo "⏳ Waiting for emulator to boot..."

# Wait for boot completion
BOOT_TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $BOOT_TIMEOUT ]; do
    BOOT_STATUS=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
    if [ "$BOOT_STATUS" == "1" ]; then
        echo -e "${GREEN}✅ Emulator booted successfully!${NC}"
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    echo "⏳ Boot progress... ($ELAPSED/$BOOT_TIMEOUT seconds)"
done

if [ $ELAPSED -ge $BOOT_TIMEOUT ]; then
    echo -e "${RED}❌ Emulator boot timed out${NC}"
    kill $EMULATOR_PID 2>/dev/null
    exit 1
fi

# Install app if APK exists
if [ -f "app.apk" ]; then
    echo "📦 Installing app..."
    adb install app.apk
elif [ -f "android-app/build/outputs/apk/debug/android-app-debug.apk" ]; then
    echo "📦 Installing app from debug build..."
    adb install android-app/build/outputs/apk/debug/android-app-debug.apk
else
    echo -e "${YELLOW}⚠️ No APK found. Please build the app first with: eas build -p android${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Android setup complete!${NC}"
echo "📋 Next steps:"
echo "   1. Start Expo server: npx expo start --android"
echo "   2. Open Maestro Studio: maestro studio"
echo "   3. Run tests: maestro test maestro/config.yaml"

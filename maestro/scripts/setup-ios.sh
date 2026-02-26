#!/bin/bash
# iOS Maestro Setup Script
# Version: 1.0.0

echo "🚀 iOS Maestro Setup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode is not installed. Please install Xcode from App Store.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Xcode found${NC}"

# Check if iOS simulators are available
echo ""
echo "📱 Available iOS simulators:"
SIMULATOR_LIST=$(xcrun simctl list devices available)
echo "$SIMULATOR_LIST"

# Set simulator name or find iPhone 15
SIMULATOR_NAME=${1:-"iPhone 15"}
SIMULATOR_ID=$(echo "$SIMULATOR_LIST" | grep "$SIMULATOR_NAME" | head -1 | grep -oE '[A-F0-9-]{36}')

if [ -z "$SIMULATOR_ID" ]; then
    echo -e "${YELLOW}⚠️ Simulator '$SIMULATOR_NAME' not found. Looking for alternatives...${NC}"
    SIMULATOR_ID=$(echo "$SIMULATOR_LIST" | grep "iPhone" | head -1 | grep -oE '[A-F0-9-]{36}')
    
    if [ -z "$SIMULATOR_ID" ]; then
        echo -e "${RED}❌ No iPhone simulator available. Please install iOS simulators from Xcode.${NC}"
        exit 1
    fi
    SIMULATOR_NAME=$(echo "$SIMULATOR_LIST" | grep "$SIMULATOR_ID" | head -1)
fi

echo ""
echo "🚀 Using simulator: $SIMULATOR_NAME ($SIMULATOR_ID)"

# Boot simulator
echo "📱 Starting simulator..."
xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || echo "Simulator may already be booted"

# Wait for simulator to be ready
echo "⏳ Waiting for simulator to be ready..."
sleep 5

# Install app if .app exists
if [ -f "app.app" ]; then
    echo "📦 Installing app..."
    xcrun simctl install booted app.app
elif [ -f "ios-app/Build/Products/Debug-iphonesimulator/CineSearch.app" ]; then
    echo "📦 Installing app from build..."
    xcrun simctl install booted ios-app/Build/Products/Debug-iphonesimulator/CineSearch.app
elif [ -f "CineSearch.ipa" ]; then
    echo "📦 Installing app from IPA..."
    unzip -o CineSearch.ipa -d /tmp/ipa
    xcrun simctl install booted /tmp/ipa/Payload/*.app
else
    echo -e "${YELLOW}⚠️ No app found. Please build the app first with: eas build -p ios${NC}"
fi

# Open simulator (optional - for visual feedback)
open -a Simulator

echo ""
echo -e "${GREEN}🎉 iOS setup complete!${NC}"
echo "📋 Next steps:"
echo "   1. Start Expo server: npx expo start --ios"
echo "   2. Open Maestro Studio: maestro studio"
echo "   3. Run tests: maestro test maestro/config.yaml --platform ios"
echo ""
echo "💡 Tip: To list available simulators, run: xcrun simctl list devices available"

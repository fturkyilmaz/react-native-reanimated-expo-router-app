#!/usr/bin/env node
/**
 * Check App ID for Maestro Testing
 * Version: 1.0.0
 * 
 * This script checks the device/emulator for the correct App ID
 * and verifies the app is installed.
 */

const { execSync } = require('child_process');

const PLATFORM = process.argv[2] || 'auto';

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[32m',   // green
        warn: '\x1b[33m',   // yellow
        error: '\x1b[31m',  // red
        success: '\x1b[32m' // green
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type] || colors.info}📱 ${message}${reset}`);
}

function checkiOS() {
    log('Checking iOS simulators...', 'info');

    try {
        const simulators = execSync('xcrun simctl list devices available').toString();

        // Find iPhone simulators
        const iphoneMatch = simulators.match(/iPhone\s+\d+/g);
        if (iphoneMatch) {
            log(`✅ Found iPhone simulators: ${iphoneMatch.join(', ')}`, 'success');
        } else {
            log('⚠️ No iPhone simulators found', 'warn');
        }

        // Check for booted simulator
        const bootedMatch = simulators.match(/Booted.*\(([A-F0-9-]{36})\)/);
        if (bootedMatch) {
            log(`✅ Simulator booted: ${bootedMatch[1]}`, 'success');
        } else {
            log('⚠️ No simulator booted. Run: xcrun simctl boot <device>', 'warn');
        }

        return {
            platform: 'ios',
            appId: 'host.exp.Exponent',
            simulators: iphoneMatch || []
        };
    } catch (error) {
        log(`❌ Error checking iOS: ${error.message}`, 'error');
        return { platform: 'ios', appId: null, error: error.message };
    }
}

function checkAndroid() {
    log('Checking Android emulator...', 'info');

    try {
        const devices = execSync('adb devices').toString();

        // Check for emulators
        const emulatorMatch = devices.match(/emulator-\d+\s+device/);
        if (emulatorMatch) {
            log(`✅ Found emulator: ${emulatorMatch[0]}`, 'success');
        } else {
            log('⚠️ No emulator found. Make sure emulator is running.', 'warn');
        }

        // Check boot status
        const bootStatus = execSync('adb shell getprop sys.boot_completed').toString().trim();
        if (bootStatus === '1') {
            log('✅ Emulator booted', 'success');
        } else {
            log('⚠️ Emulator not fully booted. Wait for boot completion.', 'warn');
        }

        return {
            platform: 'android',
            appId: 'host.exp.Exponent',
            emulator: emulatorMatch ? emulatorMatch[0] : null
        };
    } catch (error) {
        log(`❌ Error checking Android: ${error.message}`, 'error');
        return { platform: 'android', appId: null, error: error.message };
    }
}

function checkAppInstallation(appId) {
    log(`Checking for app installation: ${appId}`, 'info');

    try {
        // Check for app package
        const packageCheck = execSync(`adb shell pm list packages | grep ${appId}`).toString();
        if (packageCheck.includes(appId)) {
            log(`✅ App installed: ${appId}`, 'success');
            return true;
        }
    } catch {
        // adb command failed, try different approach
        try {
            const dumpsys = execSync(`adb shell dumpsys package ${appId}`).toString();
            if (dumpsys.includes('packageName')) {
                log(`✅ App installed: ${appId}`, 'success');
                return true;
            }
        } catch {
            log(`⚠️ App not installed: ${appId}`, 'warn');
            return false;
        }
    }

    log(`⚠️ App not found: ${appId}`, 'warn');
    return false;
}

function main() {
    console.log('\n🔍 CineSearch Maestro App ID Checker\n');

    let results = [];

    if (PLATFORM === 'ios' || PLATFORM === 'auto') {
        results.push(checkiOS());
    }

    if (PLATFORM === 'android' || PLATFORM === 'auto') {
        results.push(checkAndroid());
    }

    // Check app installation
    console.log('\n📦 App Installation Check\n');
    results.forEach(result => {
        if (result.appId) {
            checkAppInstallation(result.appId);
        }
    });

    // Summary
    console.log('\n📋 Summary\n');
    console.log('✅ Recommended App IDs:');
    console.log('   - Expo Go: host.exp.Exponent');
    console.log('   - Development Build: com.cinesearch');
    console.log('   - Release: com.cinesearch');
    console.log('\n💡 Usage:');
    console.log('   node scripts/check-app-id.js ios     # Check iOS');
    console.log('   node scripts/check-app-id.js android # Check Android');
    console.log('   node scripts/check-app-id.js        # Check all\n');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { checkiOS, checkAndroid, checkAppInstallation };



import QtQuick 2.0
import QtQuick.Window 2.2 // Provides Screen object and Qt.quit()
import "/usr/share/maliit/plugins/lomiri-keyboard/keys/key_constants.js" as KeyboardConstants // gets KeyboardConstants 

Item {
    id: root

    // Define the constants directly within the QML context,
    // as direct file system imports for JS are not supported in this way.
    // These values are typical percentages for phone keyboard heights.
    property real phoneKeyboardHeightPortrait: 0.35 // Example: 35% of screen height in portrait
    property real phoneKeyboardHeightLandscape: 0.45 // Example: 45% of screen width in landscape


    // This component will run its logic and then quit immediately
    Component.onCompleted: {
        var keyword = "calculatedOSK";
        // Get current screen dimensions
        var screenWidth = Screen.width;
        var screenHeight = Screen.height;

        var assumedPortraitScreenHeight = Math.max(screenWidth, screenHeight);
        var assumedLandscapeScreenHeight = Math.min(screenWidth, screenHeight);
        // Calculate Keyboard Height for Portrait Configuration
        // This uses the current screen's longer dimension (height) as the base for portrait keyboard height.
        var phonePortraitPercentage = KeyboardConstants.phoneKeyboardHeightPortrait;
        var tabletPortraitPercentage = KeyboardConstants.tabletKeyboardHeightPortrait;

        console.log(keyword + "phonePortraitHeight: " + (assumedPortraitScreenHeight * phonePortraitPercentage).toFixed(2));
        console.log(keyword + "tabletPortraitHeight: " + (assumedPortraitScreenHeight * tabletPortraitPercentage).toFixed(2));
        // Calculate Keyboard Height for Landscape Configuration
        // This uses the current screen's shorter dimension (width) as the base for landscape keyboard height.
        var phoneLandscapePercentage = KeyboardConstants.phoneKeyboardHeightLandscape;
        var tabletLandscapePercentage = KeyboardConstants.phoneKeyboardHeightLandscape;
        
        console.log(keyword + "phoneLandscapeHeight: " + (assumedLandscapeScreenHeight * phoneLandscapePercentage).toFixed(2));
        console.log(keyword + "tabletLandscapeHeight: " + (assumedLandscapeScreenHeight * tabletLandscapePercentage).toFixed(2));

        // Exit the QML application immediately
        console.log("%QUIT%");
        Qt.quit();
    }
}
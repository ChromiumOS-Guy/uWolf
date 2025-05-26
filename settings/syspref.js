// This file can be used to configure global preferences for Firefox

// Example: Homepage
pref("browser.urlbar.placeholderName", "DuckDuckGo");
pref("browser.urlbar.placeholderName.private", "DuckDuckGo");
pref("browser.startup.homepage", "ubports.com");
pref("browser.uidensity", 2);
pref("browser.shell.checkDefaultBrowser", false);

// Enable android-style pinch-to-zoom
pref('dom.w3c.touch_events.enabled', true);
pref('apz.allow_zooming', true);
pref('apz.allow_double_tap_zooming', true);

// Enable legacy touch event APIs, as some websites use this to check for mobile compatibility
// and Firefox on Android behaves the same way
pref('dom.w3c_touch_events.legacy_apis.enabled', true);

//save vertical space
pref('browser.tabs.inTitlebar', 0);
//pref("sidebar.revamp", true);
//pref("sidebar.verticalTabs", true);
//pref("sidebar.visibility", "hide-sidebar");

// Disable cosmetic animations, save CPU
pref('toolkit.cosmeticAnimations.enabled', false);

// Disable download animations, save CPU
pref('browser.download.animateNotifications', false);
pref('webgl.disabled', false);
pref('privacy.resistFingerprinting', false);


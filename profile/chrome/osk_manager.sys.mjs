// ==UserScript==
// @name           OSK Manager (Command Driven)
// @description    Manages OSK overlay visibility based on commands from UI and web content scripts.
// @onlyonce
// ==/UserScript==

import { Windows } from "chrome://userchromejs/content/uc_api.sys.mjs";

const DEBUG_MODE = true; // Set to true to see console logs

function log(...args) {
  if (DEBUG_MODE) {
    console.log("[OSK Manager]", ...args);
  }
}

log("OSK Manager Script: Initializing.");

// Internal flags to track focus state from different sources
let browserUIInputHasFocus = false;
let webContentInputHasFocus = false;

// The current global state of the OSK overlay
let currentOSKOverlayState = false; // false = hidden, true = shown

/**
 * Updates the actual OSK overlay visibility across all browser windows.
 * This is the ONLY function that directly manipulates the CSS classes.
 * It's called internally by `determineAndSetOSKState`.
 * @param {boolean} show - True to show, false to hide the overlay.
 */
function setOSKOverlayState(show) {
  if (currentOSKOverlayState === show) {
    // log("OSK overlay already in desired state:", show ? "SHOW" : "HIDE");
    return; // No change needed for the actual overlay.
  }

  currentOSKOverlayState = show; // Update the internal state.
  log("OSK overlay state changed to:", show ? "SHOW" : "HIDE");

  Windows.forEach((doc, win) => {
    // Only target main browser windows and ensure they have the <html> element
    if (Windows.isBrowserWindow(win) && win.document && win.document.documentElement) {
      if (show) {
        win.document.documentElement.classList.remove('osk-hidden');
        win.document.documentElement.classList.add('osk-input-focused');
      } else {
        win.document.documentElement.classList.remove('osk-input-focused');
        win.document.documentElement.classList.add('osk-hidden');
      }
    }
  }, true);
}

/**
 * Determines the overall desired OSK state based on current focus flags
 * and then calls setOSKOverlayState to apply it.
 * This function acts as the "request processor".
 */
function determineAndSetOSKState() {
  const desiredState = browserUIInputHasFocus || webContentInputHasFocus;
  log("Determining OSK state: UI Focused:", browserUIInputHasFocus, "| Web Focused:", webContentInputHasFocus, "-> Desired:", desiredState ? "SHOW" : "HIDE");
  setOSKOverlayState(desiredState);
}


/**
 * Handles messages received from osk_controller.uc.js (browser UI)
 * and osk_web_input_detector.uc.js (web content).
 * @param {MessageEvent} event - The message event.
 */
function handleFocusMessage(event) {
  // Enhanced logging for incoming messages
  log("Message received by Manager:");
  log("  Type:", event.data ? event.data.type : 'N/A');
  log("  Data:", event.data);
  log("  Origin:", event.origin); // The origin of the message sender (e.g., "https://www.google.com")
  log("  Source Window URL:", event.source ? (event.source.location ? event.source.location.href : 'N/A (no location)') : 'N/A (no source)');
  log("  Target Window URL (this window):", event.target ? (event.target.location ? event.target.location.href : 'N/A (no location)') : 'N/A (no target)');


  if (!event.data || !event.data.type) {
    return; // Ignore irrelevant messages
  }

  switch (event.data.type) {
    case 'OSK_UI_FocusIn':
      if (!browserUIInputHasFocus) {
        browserUIInputHasFocus = true;
        determineAndSetOSKState();
      }
      break;
    case 'OSK_UI_FocusOut':
      if (browserUIInputHasFocus) {
        browserUIInputHasFocus = false;
        determineAndSetOSKState();
      }
      break;
    case 'OSK_Web_FocusIn':
      if (!webContentInputHasFocus) {
        webContentInputHasFocus = true;
        determineAndSetOSKState();
      }
      break;
    case 'OSK_Web_FocusOut':
      if (webContentInputHasFocus) {
        webContentInputHasFocus = false;
        determineAndSetOSKState();
      }
      break;
    default:
      log("Unknown message type:", event.data.type);
      break;
  }
}


// Register the main handler for newly created browser windows.
Windows.onCreated(async (win) => {
  if (!Windows.isBrowserWindow(win)) {
    log("Ignoring non-browser window:", win.location.href);
    return;
  }

  log("New browser window detected:", win.location.href);

  // Wait for the window to be fully initialized before attaching listeners.
  await Windows.waitWindowLoading(win);

  // Add a listener to this browser window to receive messages from its content (tabs)
  // AND from its own UI scripts (like osk_controller.uc.js).
  // The 'message' event on a chrome window receives messages posted from content
  // windows (tabs/iframes) within that chrome window.
  win.addEventListener('message', handleFocusMessage, false);

  // Ensure initial OSK state for this newly loaded window.
  determineAndSetOSKState();

  log("OSK Manager: Message listener added for window:", win.location.href);
});

// Initial startup: Handle any browser windows that are already open when this manager loads.
Windows.forEach((doc, win) => {
  if (Windows.isBrowserWindow(win)) {
    log("Initializing already open browser window:", win.location.href);
    // Directly call the onCreated callback with the existing window.
    Windows.onCreated._callbacks.forEach(cb => cb(win));
  }
}, true); // `true` ensures we only iterate over browser windows.

log("OSK Manager Script: Initialization complete. Listening for focus commands.");
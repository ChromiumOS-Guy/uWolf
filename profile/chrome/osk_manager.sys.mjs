// ==UserScript==
// @name OSK Manager (Config Driven)
// @description Manages OSK overlay visibility based on commands from the trigger script.
// @onlyonce
// ==/UserScript==

import { Windows } from "chrome://userchromejs/content/uc_api.sys.mjs";

const CONFIG_FILE_URL = "chrome://userscripts/content/osk_overlay_config.js";
const DEBUG_MODE = true;
const CUSTOM_EVENT_READ_CONFIG = "OSK_READ_CONFIG_COMMAND";
const CUSTOM_EVENT_HIDE_OSK = "OSK_HIDE_COMMAND";

function log(...args) {
  if (DEBUG_MODE) {
    console.log("[OSK Manager]", ...args);
  }
}

log("OSK Manager Script: Initializing.");

let currentOSKOverlayState = false; // false = hidden, true = shown
let lastConfigFileCharCount = -1; // Initialize with -1 to ensure first read triggers a show

/**
 * Updates the actual OSK overlay visibility across all browser windows.
 * This is the ONLY function that directly manipulates the CSS classes.
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
 * Reads the content of the configuration file, compares character count,
 * and updates the OSK state if the count has changed.
 */
async function readAndApplyConfigState() {
  try {
    const response = await fetch(CONFIG_FILE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch config file: ${response.statusText}`);
    }
    const configContent = await response.text();
    const currentCharCount = configContent.length;

    if (currentCharCount !== lastConfigFileCharCount) {
      log("Character count has changed. Showing OSK.");
      setOSKOverlayState(true);
      lastConfigFileCharCount = currentCharCount; // Save the new character count
    }
  } catch (error) {
    console.error("[OSK Manager] Error reading config file:", error);
    // On error, we don't change the OSK state based on the file read.
  }
}

/**
 * Handles messages received from osk_config_trigger.uc.mjs.
 * @param {MessageEvent} event - The message event.
 */
function handleCommandMessage(event) {

  if (!event.data || !event.data.type) {
    return; // Ignore irrelevant messages
  }

  if (event.data.type === CUSTOM_EVENT_READ_CONFIG) {
    readAndApplyConfigState();
  } else if (event.data.type === CUSTOM_EVENT_HIDE_OSK) {
    log("Explicit HIDE command received from trigger. Hiding OSK.");
    setOSKOverlayState(false);
  } else {
    log("Unknown or unhandled message type:", event.data.type);
  }
}

// Register the main handler for newly created browser windows.
Windows.onCreated(async (win) => {
  if (!Windows.isBrowserWindow(win)) {
    log("Ignoring non-browser window:", win.location.href);
    return;
  }

  log("New browser window detected:", win.location.href);

  await Windows.waitWindowLoading(win);

  win.addEventListener('message', handleCommandMessage, false);

  log("OSK Manager: Message listener added for window:", win.location.href);
});

// Initial startup: Handle any browser windows that are already open when this manager loads.
Windows.forEach((doc, win) => {
  if (Windows.isBrowserWindow(win)) {
    log("Initializing already open browser window:", win.location.href);
    Windows.onCreated._callbacks.forEach(cb => cb(win));
  }
}, true);

log("OSK Manager Script: Initialization complete. Waiting for commands.");

// Perform an initial read when the manager script itself initializes,
// to set the initial state based on the daemon's file.
readAndApplyConfigState();
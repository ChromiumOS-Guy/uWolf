// ==UserScript==
// @name           OSK Config Trigger
// @description    Periodically sends a command to the OSK Manager to read the config file, and sends hide commands.
// @onlyonce
// @include        chrome://browser/content/browser.xhtml
// ==/UserScript==

const READ_INTERVAL_MS = 200; // The interval for triggering the config read
const DEBUG_MODE = true;
const CUSTOM_EVENT_READ_CONFIG = "OSK_READ_CONFIG_COMMAND"; // To tell manager to read file (for show)
const CUSTOM_EVENT_HIDE_OSK = "OSK_HIDE_COMMAND"; // NEW: Command to hide the OSK

let lastUrl = window.location.href; // To track URL changes

function log(...args) {
  if (DEBUG_MODE) {
    console.log("[OSK Config Trigger]", ...args);
  }
}

log("OSK Config Trigger Script: Initializing.");

/**
 * Dispatches a custom command message to the OSK Manager.
 * @param {string} type - The type of command (e.g., CUSTOM_EVENT_READ_CONFIG, CUSTOM_EVENT_HIDE_OSK).
 */
function dispatchCommand(type) {
  log(`Dispatching '${type}' command to OSK Manager.`);
  window.postMessage({ type: type }, "*"); // "*" for any origin
}

// Function to periodically dispatch the config read command (for daemon's 'true' signal)
function periodicallyReadConfigCommand() {
  dispatchCommand(CUSTOM_EVENT_READ_CONFIG);
}

/**
 * Checks if the clicked element is an input field.
 * @param {Element} element - The clicked DOM element.
 * @returns {boolean} True if the element is an input-like field, false otherwise.
 */
function isInputField(element) {
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.hasAttribute('contenteditable')
  );
}

/**
 * Handles global click events to detect unfocus.
 * If a click occurs anywhere on the screen
 * it dispatches the OSK_HIDE_COMMAND.
 * @param {MouseEvent} event - The click event.
 */
function handleClickOutside(event) {
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
}

/**
 * Monitors URL changes to hide the OSK on page navigation.
 */
function monitorUrlChange() {
  if (window.location.href !== lastUrl) {
    log("URL changed detected. Sending HIDE command.");
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
    lastUrl = window.location.href; // Update last URL
  }
}

// === NEW/MODIFIED CODE FOR URL BAR HANDLING ===

/**
 * Handles focus/blur events on the URL bar.
 */
function setupUrlBarListeners() {
  const urlBar = document.getElementById('urlbar');
  if (urlBar) {
    log("URL bar element found. Setting up listeners.");
    urlBar.addEventListener('blur', () => {
      log("URL bar lost focus. Sending HIDE command.");
      dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
    }, false);

    urlBar.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        log("Enter pressed in URL bar. Sending HIDE command.");
        dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
      }
    }, false);
  } else {
    log("Warning: URL bar element (ID 'urlbar') not found at DOMContentLoaded.");
    // In some very rare cases, the element might not be immediately available.
    // You could consider a short timeout or retry mechanism if this warning appears frequently.
  }
}

// === END NEW/MODIFIED CODE ===


// Start the continuous dispatching process for config read
setInterval(periodicallyReadConfigCommand, READ_INTERVAL_MS);

// Monitor URL changes more frequently than config reads, or on specific events
setInterval(monitorUrlChange, 100);

// Add a global click listener to detect clicks anywhere on the document body
window.addEventListener('click', handleClickOutside, true); // Use capture phase for reliability

// Also dispatch HIDE on page load events for explicit navigation
window.addEventListener('DOMContentLoaded', () => {
    log("DOMContentLoaded event. Sending HIDE command.");
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
    setupUrlBarListeners(); // Initialize URL bar listeners after DOM is loaded
}, false);
window.addEventListener('load', () => {
    log("Load event. Sending HIDE command.");
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
}, false);
window.addEventListener('pageshow', () => { // For back/forward button navigation
    log("Pageshow event. Sending HIDE command.");
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
}, false);


log(`OSK Config Trigger Script: Will dispatch '${CUSTOM_EVENT_READ_CONFIG}' every ${READ_INTERVAL_MS}ms. Also listening for clicks outside inputs and URL changes, and URL bar specific events.`);
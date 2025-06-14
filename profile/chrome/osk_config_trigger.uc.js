// ==UserScript==
// @name           OSK Config Trigger
// @description    Periodically sends a command to the OSK Manager to read the config file, and sends hide commands.
// @onlyonce
// @include        chrome://browser/content/browser.xhtml
// ==/UserScript==

const READ_INTERVAL_MS = 200; // The interval for triggering the config read
const URL_CHECK_INTERVAL_MS = 100; // How frequently to check the URLs
const DEBUG_MODE = true;
const CUSTOM_EVENT_READ_CONFIG = "OSK_READ_CONFIG_COMMAND"; // To tell manager to read file (for show)
const CUSTOM_EVENT_HIDE_OSK = "OSK_HIDE_COMMAND"; // Command to hide the OSK

let lastDetectedUrl = null; // To track the last URL that triggered a hide command

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
  window.postMessage({ type: type }, "*"); // "*" for any origin
}

// Function to periodically dispatch the config read command
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
 * If a click occurs anywhere on the screen, it dispatches the OSK_HIDE_COMMAND.
 * @param {MouseEvent} event - The click event.
 */
function handleClickOutside(event) {
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
}

/**
 * Handles focus/blur events on the URL bar.
 */
function setupUrlBarListeners() {
  const urlBar = document.getElementById('urlbar');
  if (urlBar) {
    log("URL bar element found. Setting up specific blur and keydown listeners.");
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
  }
}

/**
 * Continuously monitors the URL from both the URL bar value and gBrowser's currentURI.
 * If either value changes from the last detected URL, it dispatches the HIDE command.
 */
function monitorUrlsForChange() {
  let currentUrlToMonitor = null;
  let urlBarValue = null;
  let gBrowserURI = null;

  // Attempt to get URL from URL bar value
  const urlBar = document.getElementById('urlbar');
  if (urlBar) { // Check if urlBar element exists before trying to access its value
    urlBarValue = urlBar.value;
    currentUrlToMonitor = urlBarValue; // Prefer urlbar value as primary
  } else {
    log("[Check] URL Bar Element not found for value check.");
  }


  // Attempt to get URL from gBrowser's currentURI.spec
  if (typeof gBrowser !== 'undefined' && gBrowser.selectedBrowser && gBrowser.selectedBrowser.currentURI) {
    gBrowserURI = gBrowser.selectedBrowser.currentURI.spec;

    // If urlBarValue was not available, or if gBrowserURI is different and seems more accurate
    if (!currentUrlToMonitor || (currentUrlToMonitor !== gBrowserURI && currentUrlToMonitor === "about:blank")) {
        // A common scenario for 'about:blank' or initial load where urlbar might not reflect the real URL yet.
        currentUrlToMonitor = gBrowserURI;
    }
  } else {
    log("[Check] gBrowser.selectedBrowser.currentURI not available.");
  }

  // Determine the actual URL to use for comparison
  const effectiveUrl = currentUrlToMonitor || gBrowserURI; // Use either, prioritizing urlBarValue

  if (effectiveUrl && effectiveUrl !== lastDetectedUrl) {
    log(`URL change detected! From '${lastDetectedUrl}' to '${effectiveUrl}'. Sending HIDE command.`);
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
    lastDetectedUrl = effectiveUrl; // Update the last known value
  }
}

// Start the continuous dispatching process for config read
setInterval(periodicallyReadConfigCommand, READ_INTERVAL_MS);

// Monitor URLs frequently
setInterval(monitorUrlsForChange, URL_CHECK_INTERVAL_MS);

// Add a global click listener to detect clicks anywhere on the document body
window.addEventListener('click', handleClickOutside, true); // Use capture phase for reliability

// Also dispatch HIDE on page load events for explicit navigation
window.addEventListener('DOMContentLoaded', () => {
    log("DOMContentLoaded event. Sending HIDE command.");
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
    setupUrlBarListeners(); // Initialize URL bar specific listeners

    // Initialize lastDetectedUrl after the DOM is ready
    const urlBar = document.getElementById('urlbar');
    let initialUrl = null;
    if (urlBar && urlBar.value) {
      initialUrl = urlBar.value;
    } else if (typeof gBrowser !== 'undefined' && gBrowser.selectedBrowser && gBrowser.selectedBrowser.currentURI) {
      initialUrl = gBrowser.selectedBrowser.currentURI.spec;
    }

    if (initialUrl) {
      lastDetectedUrl = initialUrl;
      log(`Initial URL set: ${lastDetectedUrl}`);
    } else {
      log("Initial URL could not be set at DOMContentLoaded.");
    }
}, false);

window.addEventListener('load', () => {
    log("Load event. Sending HIDE command.");
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
}, false);

window.addEventListener('pageshow', () => { // For back/forward button navigation
    log("Pageshow event. Sending HIDE command.");
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
}, false);


log(`OSK Config Trigger Script: Will dispatch '${CUSTOM_EVENT_READ_CONFIG}' every ${READ_INTERVAL_MS}ms. Also monitoring URLs every ${URL_CHECK_INTERVAL_MS}ms, listening for clicks outside inputs, and URL bar specific events.`);
// ==UserScript==
// @name          OSK Config Trigger
// @description   Periodically sends a command to the OSK Manager to read the config file, and sends hide commands based on clicks, Enter presses, and a double-hide on page load events.
// @onlyonce
// @include       chrome://browser/content/browser.xhtml
// ==/UserScript==

const READ_INTERVAL_MS = 200; // The interval for triggering the config read
const DOUBLE_HIDE_DELAY_MS = 150; // Delay for the second HIDE command after page events
const DEBUG_MODE = true;
const CUSTOM_EVENT_READ_CONFIG = "OSK_READ_CONFIG_COMMAND"; // To tell manager to read file (for show)
const CUSTOM_EVENT_HIDE_OSK = "OSK_HIDE_COMMAND"; // Command to hide the OSK

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
 * Handles global click events to detect unfocus.
 * If a click occurs anywhere on the screen, it dispatches the OSK_HIDE_COMMAND.
 */
function handleClickAnywhere() {
  dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
  log("Click detected. Sending HIDE command.");
}

/**
 * Handles global keydown events to detect Enter presses.
 * If Enter is pressed anywhere on the screen, it dispatches the OSK_HIDE_COMMAND.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleKeyDown(event) {
  if (event.key === 'Enter') {
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK);
    log("Enter key pressed. Sending HIDE command.");
  }
}

/**
 * Sends a HIDE command immediately and then again after a short delay.
 * Useful for handling scenarios where a page might briefly re-focus an element.
 * @param {string} eventName - The name of the event that triggered the hide.
 */
function dispatchDoubleHide(eventName) {
  log(`${eventName} event. Sending initial HIDE command.`);
  dispatchCommand(CUSTOM_EVENT_HIDE_OSK); // Send immediately

  setTimeout(() => {
    log(`Sending delayed HIDE command after ${DOUBLE_HIDE_DELAY_MS}ms for ${eventName}.`);
    dispatchCommand(CUSTOM_EVENT_HIDE_OSK); // Send again after a delay
  }, DOUBLE_HIDE_DELAY_MS);
}

// Start the continuous dispatching process for config read
setInterval(periodicallyReadConfigCommand, READ_INTERVAL_MS);

// Add a global click listener to detect clicks anywhere on the document body
window.addEventListener('click', handleClickAnywhere, true); // Use capture phase for reliability

// Add a global keydown listener to detect Enter presses anywhere on the document body
window.addEventListener('keydown', handleKeyDown, true); // Use capture phase for reliability

// Use the new dispatchDoubleHide for page load events
window.addEventListener('DOMContentLoaded', () => {
  dispatchDoubleHide('DOMContentLoaded');
}, false);

window.addEventListener('load', () => {
  dispatchDoubleHide('Load');
}, false);

window.addEventListener('pageshow', () => { // For back/forward button navigation
  dispatchDoubleHide('Pageshow');
}, false);

log(`OSK Config Trigger Script: Will dispatch '${CUSTOM_EVENT_READ_CONFIG}' every ${READ_INTERVAL_MS}ms. Also listening for any clicks, Enter key presses, and performing a double-hide on page load events.`);
// osk_controller_webcontent.js
// This script runs inside web content (pages) to detect focus changes in input fields.
// ==UserScript==
// @name         OSK Web Content Controller
// @namespace    http://ubuntutouch.com/osk/content
// @version      1.5 // Adds document readiness check
// @description  Monitors input focus in web content and communicates with OSK Manager.
// @match        *://*/*
// @run-at       document-idle
// ==/UserScript==

(function(contentWindow) {
  // Ensure the script's main logic runs only once per content window.
  // Using a property on the contentWindow object itself.
  if (contentWindow.oskControllerContentLoaded) {
    // log is not available here, so console.log is used.
    // console.log("[OSK Web Content Controller] CONTENT SCRIPT: Already loaded in this window. Skipping global init.");
    return;
  }
  contentWindow.oskControllerContentLoaded = true; // Mark as loaded

  const SCRIPT_ID = "osk_controller_webcontent";

  function log(...args) {
    try {
      // Use parent.sendAsyncMessage if available in this context, otherwise global sendAsyncMessage
      if (typeof sendAsyncMessage === 'function') {
        sendAsyncMessage(`${SCRIPT_ID}:Log`, { args: ["[CONTENT LOG]", ...args] });
      } else if (contentWindow.parent && typeof contentWindow.parent.sendAsyncMessage === 'function') {
        // Fallback for subframes if messageManager isn't directly exposed to their global
        contentWindow.parent.sendAsyncMessage(`${SCRIPT_ID}:Log`, { args: ["[CONTENT LOG]", ...args] });
      } else {
        console.log(`[${SCRIPT_ID} Fallback Log (no sendAsyncMessage)]`, ...args);
      }
    } catch (e) {
      console.error(`[${SCRIPT_ID} Logging Error]`, e, ...args);
    }
  }

  log("osk_controller_webcontent.js is running.");

  let currentFocusedElement = null;

  /**
   * Sends a message to the chrome process indicating focus status.
   * @param {string} eventType - 'OSK:Web_FocusIn' or 'OSK:Web_FocusOut'
   */
  function sendFocusMessage(eventType) {
    if (contentWindow.BrowseContext) {
      try {
        sendAsyncMessage(eventType, {
          url: contentWindow.location.href,
          eventType: eventType
        });
        log(`Sent message: ${eventType} for ${contentWindow.location.href}`);
      } catch (e) {
        log("ERROR: Could not send message to chrome:", e);
      }
    } else {
      log("Not in a valid Browse context. Cannot send message.");
    }
  }

  /**
   * Handles focus events on input elements.
   * @param {Event} event
   */
  function handleFocus(event) {
    const target = event.target;
    if (target.matches('input:not([type="hidden"]), textarea, [contenteditable="true"]')) {
      if (currentFocusedElement !== target) {
        log("Focus IN on:", target.tagName, "Type:", target.type, "ID:", target.id, "Class:", target.className);
        currentFocusedElement = target;
        sendFocusMessage('OSK:Web_FocusIn');
      }
    }
  }

  /**
   * Handles blur events.
   * @param {Event} event
   */
  function handleBlur(event) {
    const target = event.target;
    if (currentFocusedElement === target) {
      log("Focus OUT from:", target.tagName, "Type:", target.type, "ID:", target.id, "Class:", target.className);
      currentFocusedElement = null;
      sendFocusMessage('OSK:Web_FocusOut');
    }
  }

  /**
   * Sets up or re-sets up the event listeners, only if document is ready.
   */
  function setupEventListeners() {
    // Check if document is available and interactive/complete
    if (!contentWindow.document || contentWindow.document.readyState === 'loading') {
      log("Document not ready (or not an HTML/XML document). Deferring event listener setup.");
      // We might want to re-try later, but for now, rely on Reinitialize message.
      return;
    }

    log("Setting up/re-setting up event listeners.");
    // Remove existing listeners to prevent duplicates if re-called
    contentWindow.document.removeEventListener('focusin', handleFocus, true);
    contentWindow.document.removeEventListener('focusout', handleBlur, true);

    // Add new listeners (use capture phase for reliable detection)
    contentWindow.document.addEventListener('focusin', handleFocus, true);
    contentWindow.document.addEventListener('focusout', handleBlur, true);
    log("Event listeners (focusin, focusout) are active.");

    // Initial check for already focused elements after listeners are set up
    const activeElement = contentWindow.document.activeElement;
    if (activeElement && activeElement.matches('input:not([type="hidden"]), textarea, [contenteditable="true"]')) {
        log("Initial active element is an input. Sending FocusIn.");
        currentFocusedElement = activeElement;
        sendFocusMessage('OSK:Web_FocusIn');
    } else {
        log("No input element initially focused.");
    }
  }

  /**
   * Handles messages from the chrome script.
   * @param {object} message - The message object.
   */
  addMessageListener(`${SCRIPT_ID}:Reinitialize`, (message) => {
    log("Received Reinitialize message from chrome. Re-setting up listeners for URL:", message.data.url);
    // Use setTimeout to ensure the document is fully ready, especially for about: pages.
    // This is a common pattern to avoid `document is undefined` on very early messages.
    contentWindow.setTimeout(setupEventListeners, 0); // Schedule for the next event loop tick
  });

  // Initial setup when the script is first loaded into the content window.
  // This initial call might be too early for some about: pages, but the Reinitialize
  // message (which is guaranteed to come shortly after) will re-trigger it.
  setupEventListeners();

})(this); // Pass `this` as the contentWindow to the IIFE
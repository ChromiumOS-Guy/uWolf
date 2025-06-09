// ==UserScript==
// @name         OSK Browser UI Controller
// @namespace    http://ubuntutouch.com/osk/barebones
// @version      1.0
// @description  Detects focus/unfocus on text inputs in browser UI and notifies OSK Manager.
// @include      chrome://browser/content/browser.xhtml
// @include      chrome://mozapps/content/downloads/downloads.xhtml
// @include      chrome://devtools/content/devtools.xhtml
// @include      chrome://userchromejs/content/aboutUserChrome.xhtml
// @include      chrome://global/content/viewSource.xhtml
// @include      about:blank
// @include      about:newtab
// @include      about:home
// @include      about:preferences
// @include      about:config
// @include      about:addons
// @include      about:debugging
// @include      about:profiles
// @include      about:performance
// @include      about:memory
// @include      about:downloads
// @include      chrome://browser/content/about/aboutHome.html
// @include      chrome://browser/content/browser.html
// @include      chrome://browser/content/webext-panels.html
// @include      chrome://browser/content/protections/dashboard.html
// @run-at       document-end
// ==/UserScript==

// This script runs in the context of a browser.xhtml window.
// It detects focus/unfocus on UI text inputs and sends messages to osk_manager.sys.mjs
// via window.parent.postMessage.

(function() {
  const DEBUG_MODE = true; // Set to true to see console logs

  function log(...args) {
    if (DEBUG_MODE) {
      console.log("[OSK UI Controller]", ...args);
    }
  }

  log("OSK Browser UI Controller Script: Initializing.");

  /**
   * Identifies if an element is a text input field or contenteditable.
   * @param {HTMLElement} element - The element to check.
   * @returns {boolean} - True if the element is an input, textarea, or contenteditable.
   */
  function isTextInputElement(element) {
    if (!element || typeof element.matches !== 'function') {
        return false;
    }
    // Check for standard text inputs, textareas, and elements with contenteditable attribute.
    // Excludes buttons, checkboxes, radios, and file inputs.
    return element.matches(
      'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, [contenteditable="true"]'
    );
  }

  // Listen for focus events on input-like elements across the entire document.
  document.body.addEventListener('focusin', (event) => {
    // Check if the focused element is a text input
    if (isTextInputElement(event.target)) {
      log("UI Focus detected on a text input element:", event.target.tagName, event.target.id || event.target.name || '');
      // Send a message to the OSK Manager (global chrome context)
      window.parent.postMessage({ type: 'OSK_UI_FocusIn' }, '*');
    }
  }, true); // Use capture phase for reliability

  // Listen for focusout events anywhere on the document.
  document.body.addEventListener('focusout', (event) => {
    // A small timeout is added to allow for focus to shift to another element.
    setTimeout(() => {
        const newActiveElement = document.activeElement;
        // If the element that lost focus was a text input AND the new active element is NOT a text input,
        // it means focus truly moved away from a text input to a non-text input element or off the document.
        if (isTextInputElement(event.target) && !isTextInputElement(newActiveElement)) {
            log("UI Focus lost from a text input, or moved to a non-text input. Notifying OSK Manager.");
            // Send a message to the OSK Manager
            window.parent.postMessage({ type: 'OSK_UI_FocusOut' }, '*');
        } else if (isTextInputElement(event.target) && isTextInputElement(newActiveElement)) {
             // If focus just shifted from one text input to another text input on the same page,
             // we don't send a hide message. The OSK should remain visible.
             log("UI Focus shifted between text inputs. Keeping OSK visible (no message sent).");
        }
    }, 50); // A small delay (e.g., 50ms) to ensure `document.activeElement` is updated
  }, true); // Use capture phase

  log("OSK Browser UI Controller Script: Initialization complete. Listeners added.");

})();
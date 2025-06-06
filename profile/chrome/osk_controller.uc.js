// ==UserScript==
// @name         OSK CSS Controller
// @namespace    http://ubuntutouch.com/osk/barebones
// @version      1.5 // Reverted version for browser UI only so it at least partially works
// @description  Controls the visibility of the OSK bar, showing on text input focus and hiding on input unfocus.
// @include      chrome://browser/content/browser.xhtml
// @run-at       document-end
// ==/UserScript==

(function() {
  const DEBUG_MODE = true; // Set to true to see console logs

  function log(...args) {
    if (DEBUG_MODE) {
      console.log("[OSK CSS Controller]", ...args);
    }
  }

  log("OSK CSS Controller Script: Initializing for automatic control (unfocus behavior)...");

  let browserRootElement = null;
  let isOSKShown = false; // Start with the OSK hidden by default

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

  /**
   * Shows the OSK by applying the 'osk-input-focused' class and removing 'osk-hidden'.
   */
  function showOSK() {
    if (!browserRootElement) {
      log("Browser root element not found, cannot show OSK.");
      return;
    }
    if (!isOSKShown) { // Only change if it's currently hidden
      browserRootElement.classList.remove('osk-hidden');
      browserRootElement.classList.add('osk-input-focused');
      isOSKShown = true;
      log("OSK: Showing (removed 'osk-hidden', added 'osk-input-focused')");
    }
  }

  /**
   * Hides the OSK by applying the 'osk-hidden' class and removing 'osk-input-focused'.
   */
  function hideOSK() {
    if (!browserRootElement) {
      log("Browser root element not found, cannot hide OSK.");
      return;
    }
    if (isOSKShown) { // Only change if it's currently shown
      browserRootElement.classList.remove('osk-input-focused');
      browserRootElement.classList.add('osk-hidden');
      isOSKShown = false;
      log("OSK: Hiding (removed 'osk-input-focused', added 'osk-hidden')");
    }
  }

  // Find the root browser element once the document is ready
  window.addEventListener('DOMContentLoaded', () => {
    // This typically refers to the <html> element for applying global CSS classes
    browserRootElement = document.documentElement;
    if (browserRootElement) {
      log("Browser root element found:", browserRootElement);
      // Initialize the OSK state as hidden
      hideOSK();
    } else {
      log("Error: Could not find browser root element.");
    }
  });

  // Listen for focus events on input-like elements across the entire document.
  // 'focusin' event bubbles, so we can listen on the document body.
  document.body.addEventListener('focusin', (event) => {
    // Check if the focused element is a text input
    if (isTextInputElement(event.target)) {
      log("Focus detected on a text input element:", event.target);
      showOSK();
    }
  });

  // Listen for focusout events anywhere on the document.
  // 'focusout' event bubbles, similar to 'focusin'.
  document.body.addEventListener('focusout', (event) => {
    // Check if the element that lost focus was a text input, and if the OSK is currently shown.
    // Also, ensure the focus is truly moving away from a text input, not just within different text inputs.
    // A small timeout is added to allow for focus to shift to another element before hiding,
    // which helps prevent immediate hiding if tapping quickly between inputs.
    setTimeout(() => {
        const newActiveElement = document.activeElement;
        // If the OSK is shown AND the new active element is NOT a text input
        // (meaning focus moved away from a text input to a non-text input element or no element)
        if (isOSKShown && !isTextInputElement(newActiveElement)) {
            log("Focus lost from a text input, or focus moved to a non-text input. Hiding OSK.");
            hideOSK();
        }
    }, 50); // A small delay to ensure `document.activeElement` is updated
  });

  log("OSK CSS Controller Script: Initialization complete. Automatic control listeners added.");

})(); // End of IIFE

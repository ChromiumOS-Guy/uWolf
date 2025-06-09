// osk_controller_webcontent_injector.uc.js
// This script loads the OSK Web Content Controller as a frame script.
// It uses WebProgressListener to detect document load completion and ensures the
// frame script is present and re-initialized for newly loaded web content.
// ==UserScript==
// @name         OSK Web Content Injector Loader (WebProgressListener + FrameScript)
// @namespace    http://ubuntutouch.com/osk/loader
// @version      4.8 // Always Ensure Message Listeners & Reinitialize
// @description  Loads OSK Web Content Controller using messageManager.loadFrameScript and WebProgressListener for robust injection.
// @include      chrome://browser/content/browser.xhtml
// @run-at       document-start
// ==/UserScript==

(function() {
  const DEBUG_MODE = true;
  const SCRIPT_ID = "osk_controller_webcontent"; // Matches the ID in content script

  // Constants for WebProgressListener states
  const Ci = Components.interfaces;
  const NS_IWEBPROGRESSLISTENER_STATE_STOP = Ci.nsIWebProgressListener.STATE_STOP;
  const NS_IWEBPROGRESSLISTENER_STATE_IS_DOCUMENT = Ci.nsIWebProgressListener.STATE_IS_DOCUMENT;

  function log(...args) {
    if (DEBUG_MODE) {
      console.log("[OSK Content Injector Loader]", ...args);
    }
  }

  log("OSK Content Injector Loader: Initializing (document-start phase).");

  // Path to the content script that will be loaded as a frame script.
  const WEB_CONTENT_SCRIPT_PATH = "chrome://userscripts/content/osk_controller_webcontent.js";

  // Use a WeakMap to store listener and message listener status for each browser element.
  // We'll still use this for `cleanupBrowser`, but the `messageListenersAdded` flag will be less strict.
  const browserListenersAndStatus = new WeakMap();

  let gBrowser = null; // Will be assigned later in initializeBrowserListeners

  /**
   * Chrome-side message listener functions.
   * These are registered once per browser element using messageManager.
   */
  const handleFocusInMessage = (message) => {
    log("MESSAGE RX: Received OSK:Web_FocusIn from content script for:", message.data.url);
    window.parent.postMessage({ type: 'OSK_Web_FocusIn' }, '*');
  };

  const handleFocusOutMessage = (message) => {
    log("MESSAGE RX: Received OSK:Web_FocusOut from content script for:", message.data.url);
    window.parent.postMessage({ type: 'OSK_Web_FocusOut' }, '*');
  };

  // Content script's internal log messages, relayed to chrome console
  const handleContentLogMessage = (message) => {
    log(`[${SCRIPT_ID} Content Log]`, ...message.data.args);
  };

  /**
   * Helper function to get the <browser> element from an nsIWebProgress object.
   * This is more robust as it handles cases where docShell might be null or undefined.
   * @param {nsIWebProgress} aWebProgress
   * @returns {XULElement|null} The <browser> element, or null if it cannot be determined.
   */
  function getBrowserElementFromWebProgress(aWebProgress) {
      if (!aWebProgress) {
          return null;
      }

      // Try via docShell first (most common and direct for main browser frames)
      if (aWebProgress.docShell) {
          try {
              // This is the direct way to get the <browser> element
              return aWebProgress.docShell.QueryInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShell).chromeEventHandler;
          } catch (e) {
              // log("getBrowserElementFromWebProgress: Failed to get browserElement via docShell.chromeEventHandler:", e); // Reduced logging
          }
      }

      // Fallback: If docShell is not available or failed, try via DOMWindow
      try {
          const domWindow = aWebProgress.DOMWindow;
          if (domWindow) {
              // gBrowser.getBrowserForContentWindow is reliable if a DOMWindow is available.
              return gBrowser.getBrowserForContentWindow(domWindow);
          }
      } catch (e) {
          // log("getBrowserElementFromWebProgress: Failed to get browserElement via DOMWindow/getBrowserForContentWindow:", e); // Reduced logging
      }

      return null;
  }

  /**
   * Loads the frame script into the content process associated with the given browser element.
   * Also sets up chrome-side message listeners for communication.
   * This function should be called whenever a browser element's content changes
   * or a new browser element is created.
   * @param {XULElement} browserElement - The <browser> element.
   * @param {string} reason - For logging, why this injection is being triggered.
   */
  function ensureFrameScriptLoadedAndReinitialize(browserElement, reason = "unknown") {
    if (!browserElement || !browserElement.messageManager) {
      log("FRAMESCRIPT LOADER: Invalid browser element or no messageManager. Skipping frame script operation.");
      return;
    }

    const currentURI = browserElement.currentURI ? browserElement.currentURI.spec : 'N/A';

    // Get or initialize status for this browser element
    let status = browserListenersAndStatus.get(browserElement) || {};

    // --- Step 1: Always ensure frame script is loaded and chrome-side listeners are attached ---
    // Remove the `if (!status.messageListenersAdded)` check.
    // Calling loadFrameScript multiple times on the same messageManager for the same script is idempotent.
    // Re-adding message listeners ensures they are active even if a new document loaded in the same process.
    try {
      browserElement.messageManager.loadFrameScript(WEB_CONTENT_SCRIPT_PATH, true); // true for "allow delayed load"
      log(`FRAMESCRIPT LOADER: Ensuring frame script loaded for: ${currentURI} (Reason: ${reason}).`);

      // Always re-add message listeners. addMessageListener is generally idempotent.
      browserElement.messageManager.addMessageListener('OSK:Web_FocusIn', handleFocusInMessage);
      browserElement.messageManager.addMessageListener('OSK:Web_FocusOut', handleFocusOutMessage);
      browserElement.messageManager.addMessageListener(`${SCRIPT_ID}:Log`, handleContentLogMessage);

      // Only set this flag to true once it's confirmed, for cleanup purposes.
      if (!status.messageListenersAdded) {
          status.messageListenersAdded = true;
          browserListenersAndStatus.set(browserElement, status); // Update map
          log("FRAMESCRIPT LOADER: Added chrome-side message listeners for browser:", currentURI);
      } else {
          log("FRAMESCRIPT LOADER: Chrome-side message listeners re-confirmed for browser:", currentURI);
      }

    } catch (e) {
      log("FRAMESCRIPT LOADER: ERROR: Failed to load frame script or add listeners for", currentURI, "Error:", e);
      return; // Critical failure, stop here.
    }

    // --- Step 2: Always send a re-initialize message to the content script ---
    try {
        browserElement.messageManager.sendAsyncMessage(`${SCRIPT_ID}:Reinitialize`, { url: currentURI });
        log("FRAMESCRIPT LOADER: Successfully sent Reinitialize message to content script for:", currentURI);
    } catch (e) {
        log("FRAMESCRIPT LOADER: ERROR sending Reinitialize message to content script for:", currentURI, "Error:", e);
    }
  }

  /**
   * Defines the WebProgressListener for each browser element.
   */
  const webProgressListener = {
    QueryInterface: ChromeUtils.generateQI(["nsIWebProgressListener", "nsISupportsWeakReference"]),

    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus) {
      let browserElement = getBrowserElementFromWebProgress(aWebProgress);

      // --- FALLBACK LOGIC ---
      if (!browserElement) {
          browserElement = gBrowser.selectedBrowser;
          if (browserElement) {
              const currentURIForLog = browserElement.currentURI ? browserElement.currentURI.spec : (aRequest && aRequest.name ? aRequest.name : 'N/A');
              log(`WEBPROGRESS: onStateChange: Fallback to gBrowser.selectedBrowser. New URI: ${currentURIForLog}`);
          } else {
              log(`WEBPROGRESS: onStateChange: Skipped - could not get browserElement from WebProgress and gBrowser.selectedBrowser is null.`);
              return; // Skip if no browser element found.
          }
      }

      const currentURI = browserElement.currentURI ? browserElement.currentURI.spec : 'N/A';

      // Only interested in STATE_STOP and STATE_IS_DOCUMENT for the top-level document
      if ((aFlag & NS_IWEBPROGRESSLISTENER_STATE_STOP) && (aFlag & NS_IWEBPROGRESSLISTENER_STATE_IS_DOCUMENT)) {
        log(`WEBPROGRESS: onStateChange: Document fully loaded/stopped for: ${currentURI}.`);
        // Only trigger for web content, not internal chrome/about pages
        if (currentURI.startsWith("http://") || currentURI.startsWith("https://")) {
            ensureFrameScriptLoadedAndReinitialize(browserElement, "onStateChange:STATE_STOP+STATE_IS_DOCUMENT");
        } else {
            log(`WEBPROGRESS: onStateChange: Skipping web content script for non-HTTP/HTTPS URI: ${currentURI}`);
        }
      }
    },

    onLocationChange: function(aWebProgress, aRequest, aLocation, aFlags) {
      let browserElement = getBrowserElementFromWebProgress(aWebProgress);

      // --- FALLBACK LOGIC ---
      if (!browserElement) {
          browserElement = gBrowser.selectedBrowser;
          if (browserElement) {
              log(`WEBPROGRESS: onLocationChange: Fallback to gBrowser.selectedBrowser. New URI (from aLocation): ${aLocation ? aLocation.spec : 'N/A'}`);
          } else {
              log(`WEBPROGRESS: onLocationChange: Skipped - could not get browserElement from WebProgress and gBrowser.selectedBrowser is null for: ${aLocation ? aLocation.spec : 'N/A'}`);
              return; // Skip if no browser element found.
          }
      }

      const newURI = aLocation ? aLocation.spec : 'N/A';
      log(`WEBPROGRESS: onLocationChange: Location changed to: ${newURI}.`);
      // When location changes, it's a very strong indicator of new content needing the script.
      // We only care about real web content URLs for the OSK's input focus.
      if (newURI.startsWith("http://") || newURI.startsWith("https://")) {
          // Re-initialize immediately on location change for web content
          ensureFrameScriptLoadedAndReinitialize(browserElement, "onLocationChange");
      } else {
          log(`WEBPROGRESS: onLocationChange: Skipping web content script for non-HTTP/HTTPS URI on location change: ${newURI}`);
      }
    },

    // Implement other nsIWebProgressListener methods, even if empty, to satisfy the interface
    onProgressChange: function() {},
    onStatusChange: function() {},
    onSecurityChange: function() {},
    onLinkIconAvailable: function() {}
  };


  /**
   * Attaches the WebProgressListener to a browser element.
   * This is made more aggressive by always adding if not present.
   * @param {XULElement} browserElement - The <browser> element.
   */
  function attachProgressListener(browserElement) {
    if (!browserElement || !browserElement.webProgress) return;

    // Get or initialize status for this browser element
    let status = browserListenersAndStatus.get(browserElement) || {};

    // Always attempt to add. If it's already added to the same listener instance,
    // addProgressListener should be idempotent (it won't add duplicates).
    // However, to be truly safe, we still check our tracking map.
    if (status.webProgressListenerAttached) {
      log("LISTENER ATTACH: WebProgressListener already attached to browser:", browserElement.currentURI.spec || 'N/A');
      return;
    }

    try {
      // Use NOTIFY_ALL to get all possible events, allowing onStateChange/onLocationChange to filter.
      browserElement.webProgress.addProgressListener(webProgressListener, Ci.nsIWebProgress.NOTIFY_ALL);
      status.webProgressListenerAttached = true;
      browserListenersAndStatus.set(browserElement, status); // Update map

      log("LISTENER ATTACH: WebProgressListener attached to browser:", browserElement.currentURI.spec || 'N/A');
    } catch (e) {
      log("LISTENER ATTACH: ERROR attaching WebProgressListener:", e);
    }
  }

  /**
   * Removes the WebProgressListener and associated message listeners from a browser element.
   * @param {XULElement} browserElement - The <browser> element.
   */
  function cleanupBrowser(browserElement) {
    if (!browserElement) return;

    const currentURI = browserElement.currentURI ? browserElement.currentURI.spec : 'N/A';
    log("CLEANUP: Cleaning up browser:", currentURI);

    const status = browserListenersAndStatus.get(browserElement);

    // Remove WebProgressListener
    if (status && status.webProgressListenerAttached) {
      try {
        // Ensure webProgress is not null before attempting to remove listener.
        if (browserElement.webProgress) {
          browserElement.webProgress.removeProgressListener(webProgressListener); // Use the global listener instance
          log("CLEANUP: WebProgressListener removed from browser:", currentURI);
        } else {
          log("CLEANUP: Cannot remove WebProgressListener, browserElement.webProgress is null for:", currentURI);
        }
      } catch (e) {
        log("CLEANUP: ERROR removing WebProgressListener:", e);
      }
    }

    // Remove messageManager listeners if they were added
    if (status && status.messageListenersAdded) {
        try {
            if (browserElement.messageManager) {
                browserElement.messageManager.removeMessageListener('OSK:Web_FocusIn', handleFocusInMessage);
                browserElement.messageManager.removeMessageListener('OSK:Web_FocusOut', handleFocusOutMessage);
                browserElement.messageManager.removeMessageListener(`${SCRIPT_ID}:Log`, handleContentLogMessage);
                log("CLEANUP: Removed messageManager listeners for closed browser:", currentURI);
            } else {
                log("CLEANUP: Cannot remove messageManager listeners, browserElement.messageManager is null for:", currentURI);
            }
        } catch (e) {
            log("CLEANUP: ERROR removing messageManager listeners:", e);
        }
    }

    // Finally, remove the browser element's status from the WeakMap
    browserListenersAndStatus.delete(browserElement);
  }

  /**
   * Main initialization function that runs when the browser UI is ready.
   */
  function initializeBrowserListeners() {
    log("INITIALIZATION: Initializing browser listeners (window DOMContentLoaded phase).");

    gBrowser = window.gBrowser;

    if (!gBrowser) {
      log("INITIALIZATION: CRITICAL ERROR: gBrowser is still null after window DOMContentLoaded. Cannot proceed.");
      return;
    }

    // --- Initial Setup for Existing Tabs (if any were restored) ---
    if (gBrowser.browsers) {
      log("INITIALIZATION: Processing existing tabs on startup...");
      Array.from(gBrowser.browsers).forEach(browserElement => {
        log(`INITIALIZATION: Processing existing tab: ${browserElement.currentURI.spec || 'N/A'}`);
        attachProgressListener(browserElement);
        // Ensure frame script is loaded for initial content if it's web content
        if (browserElement.currentURI && (browserElement.currentURI.spec.startsWith("http://") || browserElement.currentURI.spec.startsWith("https://"))) {
            ensureFrameScriptLoadedAndReinitialize(browserElement, "initialization:existing_tab_web_uri");
        } else {
             // For about:blank or other non-web URIs, we'll wait for a navigation via WebProgressListener
            log(`INITIALIZATION: Skipping direct frame script load for non-web existing tab: ${browserElement.currentURI.spec || 'N/A'}`);
        }
      });
    }

    // --- Event listener for newly opened tabs ---
    gBrowser.tabContainer.addEventListener("TabOpen", (event) => {
      const newTab = event.target;
      const newBrowserElement = newTab.linkedBrowser;
      if (newBrowserElement) {
        log("TAB OPEN: New tab opened. Attaching listener and ensuring frame script.");
        attachProgressListener(newBrowserElement);
        // New tabs often start with about:newtab or about:blank.
        // We will ensure the frame script is loaded immediately for the new tab.
        ensureFrameScriptLoadedAndReinitialize(newBrowserElement, "TabOpen");
      }
    });
    log("INITIALIZATION: Added TabOpen listener to gBrowser.tabContainer.");

    // --- Event listener for tab selection changes ---
    gBrowser.tabContainer.addEventListener("TabSelect", (event) => {
      const selectedBrowser = gBrowser.selectedBrowser;
      if (selectedBrowser) {
        log("TAB SELECT: Tab selected. Ensuring frame script loaded and listeners active for:", selectedBrowser.currentURI.spec || 'N/A');
        // Always attach listener if not already. This is idempotent.
        attachProgressListener(selectedBrowser);
        // Always attempt to re-initialize on tab select, even if it's not a web URI yet.
        // The content script can handle non-web URIs gracefully.
        ensureFrameScriptLoadedAndReinitialize(selectedBrowser, "TabSelect");
      }
    });
    log("INITIALIZATION: Added TabSelect listener to gBrowser.tabContainer.");

    // --- Clean up on TabClose ---
    window.addEventListener("TabClose", (event) => {
      const closedBrowser = event.target.linkedBrowser;
      if (closedBrowser) {
        cleanupBrowser(closedBrowser);
      }
    });
    log("INITIALIZATION: Added TabClose listener for cleanup.");

    log("INITIALIZATION: Browser listeners initialization complete.");
  }

  // Defer the main initialization until the browser window's DOM is ready
  window.addEventListener("DOMContentLoaded", initializeBrowserListeners, { once: true });
  log("OSK Content Injector Loader: Waiting for window DOMContentLoaded event.");

})();
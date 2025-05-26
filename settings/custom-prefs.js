// librewolf
pref('toolkit.legacyUserProfileCustomizations.stylesheets', true); // enable css customizations (trust me bro. ,style)
pref('privacy.resistFingerprinting', false); // makes useragnet overrride possible on librewolf

// privacy
pref('dom.event.clipboardevents.enabled' , false); // no clipboards for grabby websites
pref("privacy.donottrackheader.enabled", true); // no tracking

// QoL

pref('browser.blink_allowed', false); // fuck blinking text
pref('media.autoplay.default', 2); // no autoplay (0 allows all, 1 blocks only audio ,2 blocks all media)
pref('extensions.pocket.enabled', false); // disables Pocket Integration
pref("browser.theme.dark", true); // dark mode is best mode for mobile


// UI Hacks
//pref('layout.css.devPixelsPerPx', 1.5); // the way to properly scale, 150% (not needed anymore)
pref('nglayout.initialpaint.delay', 0); // display page after 0ms
pref('ui.submenuDelay', 0); // disable menu delay (the delay will be added back in software acceleration lag)
pref("ui.prefersReducedMotion" , 1); // reduce animation

// netowrking
pref('network.http.pipelining' , true); // enable http
pref('network.http.pipelining.maxrequests', 8); // limit rq to 8/s
pref('network.http.pipelining.ssl', true); // enable https
pref('network.http.proxy.pipelining' , false); // disable proxy
pref('network.http.max-connections', 45); // max total http(s) connections
pref('network.http.max-connections-per-server', 30); // max http(s) connections per server


// website rendering

pref("general.useragent.override", "Mozilla/5.0 (Android 14; Mobile; rv:136.0) Gecko/136.0 Firefox/136.0"); // make website render for mobile
pref('content.notify.backoffcount', 5); // reflow adjustment
pref('content.notify.interval', 849999); // minimum time between reflows
pref('content.interrupt.parsing', true); // enables content parsing


// auto generated with AI crap
// Force software rendering
pref('gfx.software-rendering.force-enabled', true);

// Disable hardware acceleration layers
pref('layers.acceleration.force-enabled', false);

// Disable WebGL (can be resource-intensive with software rendering)
pref('webgl.disabled', true);

// Disable hardware-accelerated video decoding
pref('media.hardware-video-decoding.force-disabled', true);

// Disable hardware-accelerated video encoding
pref('media.hardware-video-encoding.enabled', false);

// Disable compositor (might help in some software rendering scenarios, but could cause tearing)
pref('ui.compositor.enabled', false);

// Reduce the number of content processes (can save memory and CPU, but might affect stability)
pref('dom.ipc.processCount', 2);

// Optimize image decoding (experiment with these)
pref('image.mem.decode_bytes_at_a_time', true);
pref('image.mem.shared.unmap.min_expiration_ms', 3000); // Increase if memory is tight
pref('image.cache.size', 51200); // Adjust cache size (in KB)

// Disable smooth scrolling (can sometimes improve preformance)
pref('browser.smoothscroll.enabled', false);
pref('general.smoothScroll', false);

// Disable animations where possible
pref('image.animation_mode', 'none'); // Or 'once'
pref('toolkit.animateNativeMenu', false);
pref('browser.tabs.animate', false);

// Disable features that might not be needed
pref('extensions.pocket.enabled', false);
pref('reader.parse-on-load.enabled', false);
pref('pdfjs.enableWebGL', false); // Disable WebGL in the PDF viewer

// Reduce memory usage (experiment with these)
pref('browser.cache.memory.enable', true);
pref('browser.cache.memory.capacity', 102400); // Adjust memory cache size (in KB)
pref('javascript.options.mem.max', 2048); // Adjust JavaScript heap size (in MB) - be cautious with this

// Adjust layout repaint throttling
pref('layout.repaint.throttling.enabled', false); // disabling, might help with responsiveness

// Disable speculative connections (can save resources)
pref('network.prefetch-next', false);
pref('network.http.speculative-parallel-limit', 0);

// disabling service workers if not heavily used (might break some website functionality)
pref('dom.serviceWorkers.enabled', false);

// enables scrollbar all the time, so you can scroll through finicky af UI (shit for userChrome)
// from https://connect.mozilla.org/t5/discussions/scrollbars-disappear-in-firefox-100/m-p/19881/highlight/true#M8533
pref('widget.gtk.overlay-scrollbars.enabled', false);
pref('widget.non-native-theme.gtk.scrollbar.thumb-size', 1.0);
pref('widget.non-native-theme.scrollbar.size.override', 15);
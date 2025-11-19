// Content script that runs on app.kickertool.de

// === INJECT SCRIPT INTO PAGE CONTEXT ===
// Content scripts run in an isolated context and can't intercept everything
// We need to inject a script directly into the page to access the same globals
(function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
})();

// Listen for data from injected script
window.addEventListener('KCM_TOURNAMENT_CAPTURED', function(e) {
  const { data, filename } = e.detail;
  
  lastDownloadData = data;
  
  // Send to background script
  chrome.runtime.sendMessage({
    type: 'TOURNAMENT_DATA_CAPTURED',
    data: data,
    filename: filename
  });
});

// Intercept downloads/exports from Kickertool
let lastDownloadData = null;




// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_LAST_DOWNLOAD') {
    sendResponse({ data: lastDownloadData });
    lastDownloadData = null; // Clear after retrieval
  }
});





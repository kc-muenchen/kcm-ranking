// This script runs in the page context (not isolated like content scripts)
// It has full access to the same globals as Kickertool's code

// Store captured data in a custom event
function sendToExtension(data, filename) {
  window.dispatchEvent(new CustomEvent('KCM_TOURNAMENT_CAPTURED', {
    detail: { data, filename }
  }));
}

// Intercept URL.createObjectURL
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(blob) {
  // Read blob content if it might be tournament data
  if (blob.size > 100) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data && (data.name || data.qualifying || data.participants || data.tournament)) {
          console.log('✅ KCM Exporter: Tournament data captured');
          sendToExtension(data, null);
        }
      } catch (err) {
        // Not JSON or not tournament data, ignore
      }
    };
    reader.readAsText(blob);
  }
  
  return originalCreateObjectURL.call(this, blob);
};

// Intercept document.createElement for anchor elements (backup method)
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
  const element = originalCreateElement.call(this, tagName);
  
  if (tagName.toLowerCase() === 'a') {
    // Watch for download attribute being set
    const originalSetAttribute = element.setAttribute;
    element.setAttribute = function(name, value) {
      if (name === 'download' && element.href && element.href.startsWith('blob:')) {
        // Try to capture blob data
        fetch(element.href)
          .then(r => r.text())
          .then(text => {
            const data = JSON.parse(text);
            if (data && (data.name || data.qualifying || data.participants)) {
              sendToExtension(data, value);
            }
          })
          .catch(() => {}); // Silently fail
      }
      return originalSetAttribute.call(this, name, value);
    };
    
    // Intercept click method (backup)
    const originalClick = element.click;
    element.click = function() {
      if (element.href && element.href.startsWith('blob:')) {
        const blobUrl = element.href;
        const filename = element.getAttribute('download') || element.download;
        
        fetch(blobUrl)
          .then(r => r.text())
          .then(text => {
            const data = JSON.parse(text);
            if (data && (data.name || data.qualifying || data.participants)) {
              sendToExtension(data, filename);
            }
          })
          .catch(() => {}); // Silently fail
      }
      return originalClick.call(this);
    };
  }
  
  return element;
};


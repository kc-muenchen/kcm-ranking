// Background service worker

// Listen for captured tournament data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOURNAMENT_DATA_CAPTURED') {
    // Show badge notification
    chrome.action.setBadgeText({ text: '1' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    
    // Store the data temporarily
    chrome.storage.local.set({
      pendingTournament: message.data,
      pendingFilename: message.filename || null,
      captureTime: Date.now()
    });
    
    // Auto-clear badge after 5 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 5000);
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Tournament Captured!',
      message: `${message.data.name || 'Tournament'} ready to export`,
      priority: 2
    });
  }
});


// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const settings = await chrome.storage.local.get([
    'apiUrl',
    'pendingTournament',
    'pendingFilename'
  ]);
  
  // Check if API is configured
  const isConfigured = settings.apiUrl;
  
  if (!isConfigured) {
    document.getElementById('settingsRequired').style.display = 'block';
  }
  
  // Check for pending tournament
  if (settings.pendingTournament) {
    showPendingTournament(settings.pendingTournament, settings.pendingFilename);
  }
  
  // Settings link
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  document.getElementById('openSettingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // Export button
  document.getElementById('exportBtn').addEventListener('click', async () => {
    await exportToBackend();
  });
});

function showPendingTournament(tournament, suggestedFilename) {
  const section = document.getElementById('pendingSection');
  section.style.display = 'block';
  
  document.getElementById('pendingName').textContent = tournament.name || 'Tournament';
  
  if (tournament.createdAt) {
    const date = new Date(tournament.createdAt);
    document.getElementById('pendingDate').textContent = 
      `Created: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
  
  // Generate filename
  let filename = suggestedFilename || generateFilename(tournament);
  document.getElementById('filename').value = filename;
}

function generateFilename(tournament) {
  if (tournament.createdAt) {
    const date = new Date(tournament.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}_export.json`;
  }
  
  if (tournament.name) {
    // Clean tournament name for filename
    const cleanName = tournament.name
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/__+/g, '_')
      .toLowerCase();
    return `${cleanName}_export.json`;
  }
  
  return `tournament_${Date.now()}.json`;
}

async function exportToBackend() {
  const exportBtn = document.getElementById('exportBtn');
  exportBtn.disabled = true;
  exportBtn.textContent = '⏳ Uploading...';
  
  try {
    // Get settings
    const settings = await chrome.storage.local.get([
      'apiUrl',
      'pendingTournament'
    ]);
    
    if (!settings.apiUrl) {
      showStatus('Please configure API URL in settings first', 'error');
      return;
    }
    
    if (!settings.pendingTournament) {
      showStatus('No tournament data available', 'error');
      return;
    }
    
    // Upload to backend API
    const result = await pushToBackend(
      settings.apiUrl,
      settings.pendingTournament
    );
    
    if (result.success) {
      showStatus(`✅ Successfully uploaded to backend!`, 'success');
      
      // Clear pending tournament
      await chrome.storage.local.remove(['pendingTournament', 'pendingFilename']);
      document.getElementById('pendingSection').style.display = 'none';
      
      // Reset badge
      chrome.action.setBadgeText({ text: '' });
    } else {
      showStatus(`❌ Error: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Export error:', error);
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = '📤 Upload to Backend';
  }
}

async function pushToBackend(apiUrl, data) {
  try {
    // Remove trailing slash if present
    const baseUrl = apiUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/api/tournaments`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Could not parse error response
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Backend push error:', error);
    return { success: false, error: error.message };
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 5000);
  }
}


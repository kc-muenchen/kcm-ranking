// Options page script
document.addEventListener('DOMContentLoaded', async () => {
  // Load existing settings
  const settings = await chrome.storage.local.get(['apiUrl']);
  
  // Populate fields
  if (settings.apiUrl) {
    document.getElementById('apiUrl').value = settings.apiUrl;
  }
  
  // Save button
  document.getElementById('saveBtn').addEventListener('click', async () => {
    await saveSettings();
  });
  
  // Test button
  document.getElementById('testBtn').addEventListener('click', async () => {
    await testConnection();
  });
});

async function saveSettings() {
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = '⏳ Saving...';
  
  try {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    
    if (!apiUrl) {
      showStatus('Please enter an API URL', 'error');
      return;
    }
    
    // Validate URL format
    try {
      const url = new URL(apiUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        showStatus('URL must start with http:// or https://', 'error');
        return;
      }
    } catch (e) {
      showStatus('Please enter a valid URL', 'error');
      return;
    }
    
    // Remove trailing slash
    const cleanUrl = apiUrl.replace(/\/$/, '');
    
    await chrome.storage.local.set({
      apiUrl: cleanUrl
    });
    
    showStatus('✅ Settings saved successfully!', 'success');
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Settings';
  }
}

async function testConnection() {
  const testBtn = document.getElementById('testBtn');
  testBtn.disabled = true;
  testBtn.textContent = '⏳ Testing...';
  
  try {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    
    if (!apiUrl) {
      showStatus('Please save settings first', 'error');
      return;
    }
    
    // Remove trailing slash
    const baseUrl = apiUrl.replace(/\/$/, '');
    
    // Test by fetching health endpoint
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      showStatus(`✅ Connection successful! Backend is running (${data.status})`, 'success');
    } else {
      showStatus(`❌ Backend returned error: ${response.status} ${response.statusText}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Connection error: ${error.message}. Make sure backend is running!`, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '🧪 Test Connection';
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


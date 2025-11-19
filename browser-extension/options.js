// Options page script
document.addEventListener('DOMContentLoaded', async () => {
  // Load existing settings
  const settings = await chrome.storage.local.get([
    'githubToken',
    'githubRepo',
    'githubPath'
  ]);
  
  // Populate fields
  if (settings.githubToken) {
    document.getElementById('githubToken').value = settings.githubToken;
  }
  if (settings.githubRepo) {
    document.getElementById('githubRepo').value = settings.githubRepo;
  }
  if (settings.githubPath) {
    document.getElementById('githubPath').value = settings.githubPath;
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
    const token = document.getElementById('githubToken').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const path = document.getElementById('githubPath').value.trim();
    
    if (!token || !repo) {
      showStatus('Please fill in GitHub token and repository', 'error');
      return;
    }
    
    // Validate token format
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      showStatus('Warning: GitHub token should start with "ghp_" or "github_pat_"', 'error');
      return;
    }
    
    // Validate repo format
    if (!repo.includes('/')) {
      showStatus('Repository must be in format: owner/repo', 'error');
      return;
    }
    
    await chrome.storage.local.set({
      githubToken: token,
      githubRepo: repo,
      githubPath: path || 'dummy_data'
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
    const token = document.getElementById('githubToken').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    
    if (!token || !repo) {
      showStatus('Please save settings first', 'error');
      return;
    }
    
    const [owner, repoName] = repo.split('/');
    
    // Test by fetching repo info
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (response.ok) {
      const repoData = await response.json();
      showStatus(`✅ Connection successful! Found repository: ${repoData.full_name}`, 'success');
    } else if (response.status === 401) {
      showStatus('❌ Authentication failed. Check your token.', 'error');
    } else if (response.status === 404) {
      showStatus('❌ Repository not found. Check the repository name.', 'error');
    } else {
      showStatus(`❌ Error: ${response.status} ${response.statusText}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Connection error: ${error.message}`, 'error');
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


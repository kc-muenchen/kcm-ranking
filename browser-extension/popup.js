// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const settings = await chrome.storage.local.get([
    'githubToken',
    'githubRepo',
    'githubPath',
    'pendingTournament',
    'pendingFilename'
  ]);
  
  // Check if GitHub is configured
  const isConfigured = settings.githubToken && settings.githubRepo;
  
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
    await exportToGitHub();
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

async function exportToGitHub() {
  const exportBtn = document.getElementById('exportBtn');
  exportBtn.disabled = true;
  exportBtn.textContent = '⏳ Uploading...';
  
  try {
    // Get settings
    const settings = await chrome.storage.local.get([
      'githubToken',
      'githubRepo',
      'githubPath',
      'pendingTournament'
    ]);
    
    if (!settings.githubToken || !settings.githubRepo) {
      showStatus('Please configure GitHub settings first', 'error');
      return;
    }
    
    if (!settings.pendingTournament) {
      showStatus('No tournament data available', 'error');
      return;
    }
    
    const filename = document.getElementById('filename').value;
    if (!filename) {
      showStatus('Please enter a filename', 'error');
      return;
    }
    
    // Upload to GitHub
    const result = await pushToGitHub(
      settings.githubToken,
      settings.githubRepo,
      settings.githubPath || 'dummy_data',
      filename,
      settings.pendingTournament
    );
    
    if (result.success) {
      showStatus(`✅ Successfully pushed to GitHub!`, 'success');
      
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
    exportBtn.textContent = '📤 Push to GitHub';
  }
}

async function pushToGitHub(token, repo, path, filename, data) {
  try {
    const [owner, repoName] = repo.split('/');
    const filePath = `${path}/${filename}`;
    
    // Encode content to base64
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    
    // Check if file exists
    let sha = null;
    try {
      const checkResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (checkResponse.ok) {
        const existing = await checkResponse.json();
        sha = existing.sha;
      }
    } catch (e) {
      // File doesn't exist, that's fine
    }
    
    // Create/update file
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add tournament export: ${filename}`,
          content: content,
          ...(sha && { sha })
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'GitHub API error');
    }
    
    return { success: true };
  } catch (error) {
    console.error('GitHub push error:', error);
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


# KCM Ranking - Kickertool Exporter Chrome Extension

Automatically export tournament data from Kickertool to your GitHub repository.

## 🚀 Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The extension should now appear in your extensions list

### 2. Configure GitHub Access (One-Time Setup by Admin)

1. **Right-click** the extension icon → Click **"Options"**
   - Or click the extension icon → Click "⚙️ Settings"
   
2. Click "🔑 Create a new token" link
   - Or go to: https://github.com/settings/tokens/new
   - Give it a name: "KCM Ranking Exporter"
   - Select scope: `repo` (Full control of private repositories)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

3. In the settings page, enter:
   - **GitHub Token**: Paste your token
   - **Repository**: `mgaesslein/kcm-ranking` (already filled)
   - **Path**: `dummy_data` (already filled)
   - Click "💾 Save Settings"
   - Click "🧪 Test Connection" to verify

**Note:** These settings are configured once by an administrator. Regular team members don't need to see or configure them.

## 📖 How to Use

### Method 1: Automatic Capture (Recommended)

1. Log into https://app.kickertool.de
2. Go to your tournaments list
3. Click "Export" on any tournament
4. Select "JSON" export option
5. The extension will automatically:
   - ✅ Capture the tournament data
   - ✅ Show a notification
   - ✅ Display a badge on the extension icon

6. Click the extension icon
7. Review the tournament name and filename
8. Click "📤 Push to GitHub"
9. Done! ✨

### Method 2: Manual Capture (If Automatic Fails)

1. Download the JSON from Kickertool normally
2. Open the downloaded `.json` file in Chrome (drag into browser)
3. Click the extension icon
4. Click "🔍 Capture from Current Tab" button
5. Review and push to GitHub
6. Done! ✨

### Automatic Workflow

Once installed:
- 🎯 Extension monitors Kickertool exports
- 📥 Captures JSON data automatically
- 🔔 Notifies you when data is captured
- 🚀 One-click push to GitHub
- ✅ File appears in your repo's `dummy_data` folder

## 🔧 Troubleshooting

### Extension not capturing data automatically?

**Try the Manual Capture method** (see "Method 2" above)!

For detailed troubleshooting steps, see **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

### Quick Fixes:

**Extension not capturing data:**
1. Use Manual Capture: Download JSON → Open in Chrome → Click "Capture from Current Tab"
2. Make sure you're on `app.kickertool.de`
3. Try refreshing the page and reloading the extension
4. Check browser console (F12) for errors

**GitHub push fails:**
1. Verify your GitHub token is valid
2. Make sure token has `repo` scope
3. Check repository name is correct: `owner/repo`
4. Ensure you have write access to the repository

**Can't see the extension:**
1. Go to `chrome://extensions/`
2. Find "KCM Ranking - Kickertool Exporter"
3. Make sure it's enabled
4. Try reloading the extension

📖 **For more help, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

## 🔐 Security

- GitHub token is stored locally in Chrome
- Token is never sent anywhere except GitHub API
- All communication is over HTTPS
- Token is only stored on your computer

## 📝 File Naming

The extension auto-generates filenames based on:
- Tournament date: `20250101_export.json`
- Or tournament name: `tournament_name_export.json`

You can edit the filename before pushing to GitHub.

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Verify GitHub token permissions
3. Try reloading the extension
4. Contact the repository maintainer

## 🔄 Updates

To update the extension:
1. Pull latest changes from repository
2. Go to `chrome://extensions/`
3. Click reload icon on the extension card

---

Made with ❤️ for KC München Table Soccer


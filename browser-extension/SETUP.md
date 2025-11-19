# 🚀 Complete Setup Guide

## Step 1: Generate Icons

1. Open `generate-icons.html` in your browser (just double-click the file)
2. Click "Download All Icons" button
3. Move the downloaded files (`icon16.png`, `icon48.png`, `icon128.png`) to this folder
4. Verify all three icon files are in the `browser-extension` folder

## Step 2: Install Extension in Chrome

1. Open Google Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" toggle (top right corner)
4. Click "Load unpacked" button
5. Navigate to and select the `browser-extension` folder
6. Extension should now appear with the title "KCM Ranking - Kickertool Exporter"

## Step 3: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. **Token name**: `KCM Ranking Exporter`
3. **Expiration**: Choose "No expiration" or "90 days"
4. **Scopes**: Check `repo` (Full control of private repositories)
5. Scroll down and click "Generate token"
6. **IMPORTANT**: Copy the token immediately! You won't see it again!
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 4: Configure Extension (Admin Only)

**Note:** This step only needs to be done once by an administrator. Regular team members don't need to configure anything.

1. **Open Settings Page** (choose one method):
   - **Method A**: Right-click the extension icon → Click "Options"
   - **Method B**: Click extension icon → Click "⚙️ Settings" link at bottom
   - **Method C**: Go to `chrome://extensions/` → Find extension → Click "Details" → Scroll to "Extension options"

2. In the settings page, fill in:
   - **GitHub Personal Access Token**: Paste your token from Step 3
   - **Repository**: `mgaesslein/kcm-ranking` (should be pre-filled)
   - **Path in repo**: `dummy_data` (should be pre-filled)

3. Click "💾 Save Settings"
4. Click "🧪 Test Connection" to verify it works
5. You should see "✅ Connection successful!" message

**Security Note**: The settings page is separate from the main popup, so team members won't see the GitHub token when exporting tournaments.

## Step 5: Test the Extension

1. Go to https://app.kickertool.de
2. Log in with your credentials
3. Navigate to your tournaments list
4. Click "Export" on any tournament
5. Select "JSON" option
6. The extension should:
   - Show a notification "Tournament Data Captured!"
   - Display a badge "1" on the extension icon
7. Click the extension icon
8. You should see the captured tournament with:
   - Tournament name
   - Date
   - Suggested filename
9. Review the filename (edit if needed)
10. Click "📤 Push to GitHub"
11. Wait for "✅ Successfully pushed to GitHub!"
12. Go to https://github.com/mgaesslein/kcm-ranking/tree/main/dummy_data
13. Verify your tournament file is there!

## 🎉 You're Done!

From now on, every time you export a tournament from Kickertool:
1. Extension captures the data automatically
2. Click extension icon
3. Click "Push to GitHub"
4. Done! File appears in your repository

## 🔧 Troubleshooting

### Extension doesn't appear after loading

- Make sure all required files are in the folder
- Check Chrome console: `chrome://extensions/` → Extension details → Errors
- Try reloading the extension

### Icons missing warning

- Generate icons using `generate-icons.html`
- Make sure all three icon files are in the folder
- Reload the extension

### Can't capture tournament data

- Make sure you're logged into Kickertool
- Try refreshing the page
- Open browser console (F12) and check for errors
- Look for "KCM Ranking Exporter" messages

### GitHub push fails

- Verify token is correct and hasn't expired
- Make sure token has `repo` scope
- Check repository name is exactly: `mgaesslein/kcm-ranking`
- Ensure you have write access to the repository

### "Authentication failed" error

- Token might be expired - create a new one
- Token might not have `repo` scope - create new one with correct scope
- Copy/paste token carefully (no extra spaces)

## 📋 Quick Checklist

- [ ] Icons generated and in folder
- [ ] Extension loaded in Chrome
- [ ] Developer mode enabled
- [ ] GitHub token created with `repo` scope
- [ ] Extension settings configured
- [ ] Settings saved successfully
- [ ] Test export successful
- [ ] File appears in GitHub repository

## 🔄 Updating the Extension

If the extension code is updated:
1. Go to `chrome://extensions/`
2. Find "KCM Ranking - Kickertool Exporter"
3. Click the reload icon (circular arrow)
4. Extension will reload with new code

## 🆘 Need Help?

Check these resources:
1. Read `README.md` in this folder
2. Check browser console for error messages
3. Verify GitHub token permissions
4. Contact the repository maintainer

---

Happy exporting! ⚽🏆


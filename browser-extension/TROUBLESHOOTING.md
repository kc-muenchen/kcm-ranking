# 🔧 Troubleshooting Guide

## Extension shows only settings after downloading

This usually means the extension didn't automatically capture the tournament data. Here's how to fix it:

### Method 1: Manual Capture (New!)

1. **Download the JSON** from Kickertool as usual:
   - Go to app.kickertool.de
   - Click "Export" on a tournament
   - Select "JSON" format
   - Click download

2. **Open the downloaded JSON file**:
   - Find the downloaded `.json` file (usually in Downloads folder)
   - Drag it into Chrome or open it with Chrome
   - The file should display as text in the browser

3. **Capture it manually**:
   - Click the KCM extension icon
   - Click "🔍 Capture from Current Tab" button
   - The extension will parse the JSON and show the tournament!

### Method 2: Check Browser Console

The extension logs debug information to the browser console:

1. **On Kickertool page** (before exporting):
   - Press `F12` or `Right-click → Inspect`
   - Go to "Console" tab
   - Look for messages like:
     - `KCM Ranking Exporter: Content script loaded`
     - `KCM Ranking Exporter: Monitoring for exports...`
   - You should see a purple notification badge appear briefly at bottom-right

2. **After clicking Export**:
   - Watch the console for:
     - `KCM Ranking Exporter: Tournament data detected`
     - `KCM Ranking Exporter: Blob download detected`
   - If you don't see these, the extension didn't intercept the download

3. **Check extension popup**:
   - Open the extension popup
   - Right-click inside the popup → Inspect
   - Check the console for any errors

### Method 3: Reload Extension

Sometimes the content script doesn't inject properly:

1. Go to `chrome://extensions/`
2. Find "KCM Ranking - Kickertool Exporter"
3. Click the **reload icon** (circular arrow)
4. Go back to Kickertool and refresh the page
5. Try exporting again

### Method 4: Check Extension Installation

Make sure everything is set up correctly:

1. **Icons**: Check that `icon16.png`, `icon48.png`, and `icon128.png` exist in the `browser-extension` folder
2. **Permissions**: When you installed the extension, it should have asked for permissions to:
   - Access app.kickertool.de
   - Download files
   - Show notifications
3. **Content Script**: 
   - Go to app.kickertool.de
   - Open DevTools (F12)
   - Go to Sources tab
   - Check if `content.js` is listed under Content Scripts

## Common Issues

### "No tournament data found on this page"

This means you're not on a page with valid JSON. Make sure:
- You've downloaded the JSON file from Kickertool
- You've opened the JSON file in Chrome (not a text editor)
- The file actually contains tournament data

### Extension badge doesn't appear

The badge (green "1") should appear when data is captured. If it doesn't:
- The extension might not have permission to show badges
- Check `chrome://extensions/` and make sure the extension is enabled
- Try reloading the extension

### Popup shows "Checking..." status

This is normal if no tournament has been captured yet. Follow Method 1 (Manual Capture) above.

## Still Having Issues?

### Debug Checklist:

1. ✅ Extension is installed and enabled
2. ✅ You're on app.kickertool.de (or have a JSON file open)
3. ✅ You've clicked "Export" → "JSON" on Kickertool
4. ✅ The file downloaded successfully
5. ✅ You've tried the manual capture method
6. ✅ No errors in browser console
7. ✅ Extension has all required permissions

### Enable Verbose Logging:

The extension already logs to console. To see all logs:

1. **For content script logs** (on Kickertool page):
   - Open DevTools (F12) on app.kickertool.de
   - Console tab will show content.js logs

2. **For background script logs**:
   - Go to `chrome://extensions/`
   - Find the extension
   - Click "Inspect views: service worker"
   - Check console for background.js logs

3. **For popup logs**:
   - Open the popup
   - Right-click inside it → Inspect
   - Check console for popup.js logs

## Tips for Success

- **Wait for the indicator**: When you load app.kickertool.de, look for the purple "🎯 KCM Exporter Active" badge at bottom-right
- **Use manual capture**: If automatic capture fails, manual capture is very reliable
- **Check GitHub settings**: Make sure your GitHub token and repository are configured correctly
- **Test with a known file**: Download a tournament, then manually capture it to verify the extension works

## How Automatic Capture Works

The extension tries multiple methods to capture data:

1. **Fetch interception**: Monitors network requests for exports
2. **Blob download interception**: Catches when Kickertool creates a download link
3. **Download events**: Listens for file downloads from Kickertool domain

If all three fail, use **Manual Capture**!


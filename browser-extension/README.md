# KCM Ranking - Kickertool Exporter Chrome Extension

Automatically export tournament data from Kickertool directly to your backend API!

## 🚀 Quick Start

### 1. Generate Icons

1. Open `generate-icons.html` in your browser
2. Click "Download All Icons"
3. Icons are automatically saved to the correct location

### 2. Install Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. Extension appears in your toolbar

### 3. Configure Backend API

1. **Start your backend** (if running locally):
   ```bash
   cd backend
   npm run dev
   ```

2. **Configure extension**:
   - Click extension icon
   - Click "⚙️ Settings"
   - Enter API URL: `http://localhost:3001` (or your production URL)
   - Enter API Key (get from backend admin)
   - Click "💾 Save Settings"
   - Click "🧪 Test Connection"

**Settings are saved in your browser - configure once!**

## 📖 How to Use

### Automatic Capture (Recommended)

1. Go to https://app.kickertool.de
2. Log in
3. Navigate to tournaments
4. Click "Export" on any tournament
5. Select "Export as JSON"
6. Extension **automatically**:
   - ✅ Captures tournament data
   - ✅ Shows notification
   - ✅ Displays badge on icon

7. Click extension icon
8. Review tournament details
9. Click "📤 Upload to Backend"
10. Done! Tournament is in your database

### Manual Capture (If automatic fails)

1. Download JSON from Kickertool normally
2. Open the downloaded `.json` file in Chrome
3. Click extension icon
4. Click "🔍 Capture from Current Tab"
5. Click "📤 Upload to Backend"

## 🔧 Configuration

### Local Development
```
API URL: http://localhost:3001
API Key: (from backend/.env API_KEYS)
```

### Production
```
API URL: https://api.yourdomain.com
API Key: (from production environment)
```

**Important:** Don't include `/api` in the URL - it's added automatically!

## ✅ Verification

After uploading, verify the tournament:

```bash
# Check backend logs
cd backend
npm run dev

# Check database
npm run prisma:studio

# Check frontend
# Open http://localhost:5173 - new tournament should appear
```

## 🐛 Troubleshooting

### "Please configure API URL in settings first"

**Solution:** Click extension icon → ⚙️ Settings → Enter API URL and Key → Save

### "Connection error: Failed to fetch"

**Problem:** Backend not running

**Solution:**
```bash
cd backend
npm run dev
```

### "Unauthorized" or "API key required"

**Problem:** Missing or invalid API key

**Solution:**
1. Get valid API key from backend admin
2. Extension settings → Enter API key → Save
3. Test connection

### "Backend returned error: 500"

**Problem:** Database connection issue

**Solution:**
```bash
# Start PostgreSQL
docker-compose up -d database

# Check backend logs
cd backend
npm run dev
```

### Capture Not Working

**Try these steps:**

1. **Reload extension:**
   - Go to `chrome://extensions/`
   - Find extension
   - Click reload icon (circular arrow)
   - Refresh Kickertool page

2. **Check console:**
   - On Kickertool page, press F12
   - Look for "KCM Ranking Exporter" messages
   - Check for errors

3. **Use manual capture:**
   - Download JSON from Kickertool
   - Open JSON file in Chrome
   - Click extension → "🔍 Capture from Current Tab"

4. **Verify permissions:**
   - `chrome://extensions/` → Extension details
   - Check it has access to app.kickertool.de

### Extension badge doesn't appear

The badge (green "1") appears when data is captured:
- Extension must be enabled
- Check `chrome://extensions/`
- Try reloading extension

### "No tournament data found on this page"

Make sure:
- You've downloaded JSON from Kickertool
- JSON file is open in Chrome (not text editor)
- File contains valid tournament data

## 🎯 How It Works

1. **Content Script** (`content.js`) - Runs on Kickertool pages
2. **Injected Script** (`injected.js`) - Intercepts blob downloads
3. **Background Script** (`background.js`) - Receives captured data
4. **Popup** (`popup.html/js`) - Displays tournaments
5. **Backend API** (`POST /api/tournaments`) - Stores in database

## 📦 What Gets Uploaded

Complete tournament JSON including:
- Tournament metadata (name, date, mode, sport)
- Qualifying rounds (matches, standings, stats)
- Elimination rounds (bracket, matches, results)
- Player information (names, IDs, stats)

Same format as Kickertool exports!

## 🔐 Privacy & Security

- API URL and key stored locally in browser
- No data sent to external services
- Direct communication: browser → your backend
- Data goes into your PostgreSQL database
- API key required for uploads (read-only access is public)

## 🎉 Benefits

✅ **Instant updates** - Data appears immediately
✅ **No git commits** - Cleaner repository
✅ **Simpler workflow** - No GitHub tokens
✅ **Better scalability** - Database handles large datasets
✅ **Real-time** - Frontend always shows latest data
✅ **Secure** - API key authentication

## 📋 Setup Checklist

- [ ] Icons generated
- [ ] Extension loaded in Chrome
- [ ] Developer mode enabled
- [ ] Backend running (local or production)
- [ ] API URL configured in extension
- [ ] API key configured in extension
- [ ] Connection test successful
- [ ] Test export successful

## 🔄 Updating the Extension

When extension code is updated:

1. Go to `chrome://extensions/`
2. Find "KCM Ranking - Kickertool Exporter"
3. Click reload icon (circular arrow)
4. Extension reloads with new code

## 🐞 Debug Information

### Enable Verbose Logging

**Content script logs** (on Kickertool page):
- Press F12 on app.kickertool.de
- Console shows content.js logs

**Background script logs**:
- `chrome://extensions/`
- Find extension
- Click "Inspect views: service worker"
- Check console

**Popup logs**:
- Open popup
- Right-click inside → Inspect
- Check console

### Look for These Messages

On Kickertool page:
- `KCM Ranking Exporter: Content script loaded`
- `KCM Ranking Exporter: Monitoring for exports...`
- `KCM Ranking Exporter: Tournament data detected`

In popup:
- `Loaded tournament from storage`
- `Uploading tournament to backend...`
- `Upload successful!`

## 📚 Additional Resources

- [Backend Setup](../docs/SETUP.md) - Set up the backend API
- [Configuration Guide](../docs/CONFIGURATION.md) - Configure API keys and settings
- [Deployment Guide](../docs/DEPLOYMENT.md) - Deploy to production
- [Main README](../README.md) - Project overview

## 🆘 Still Need Help?

1. Check browser console for errors (F12)
2. Verify backend is running and accessible
3. Test API connection in extension settings
4. Review backend logs for errors
5. Try manual capture method
6. Check [Backend Security Guide](../backend/SECURITY.md) for API key setup

## 🎮 Tips for Success

- **Wait for indicator**: Purple "🎯 KCM Exporter Active" badge appears on Kickertool
- **Use manual capture**: Very reliable if automatic fails
- **Check API key**: Must match one in backend `API_KEYS` environment variable
- **Test connection**: Always test after configuring settings
- **Monitor logs**: Keep browser console open to see what's happening

---

Happy exporting! ⚽🏆

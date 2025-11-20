# KCM Ranking - Kickertool Exporter Chrome Extension

Automatically export tournament data from Kickertool directly to your backend API!

## 🚀 Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The extension should now appear in your extensions list

### 2. Configure API URL

1. **Start your backend first**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Configure extension**:
   - Click the extension icon
   - Click "⚙️ Settings"
   - Enter your API URL (default: `http://localhost:3001`)
   - Click "💾 Save Settings"
   - Click "🧪 Test Connection" to verify

**Note:** Settings only need to be configured once! They're stored in your browser.

## 📖 How to Use

### Automatic Capture (Recommended)

1. Log into https://app.kickertool.de
2. Go to your tournaments list
3. Click "Export" on any tournament
4. Select "Export as JSON"
5. The extension will **automatically**:
   - ✅ Capture the tournament data
   - ✅ Show a notification
   - ✅ Display a badge on the extension icon

6. Click the extension icon
7. Review the tournament details
8. Click "📤 Upload to Backend"
9. Done! Check your database or frontend

## 🔧 API Configuration

### Local Development
```
http://localhost:3001
```

### Production
```
https://api.yourdomain.com
```

## ✅ Verification

After uploading, verify the tournament is in the database:

```bash
# Check backend logs
cd backend
npm run dev

# Check database (optional)
npm run prisma:studio

# Check frontend
# Open http://localhost:5173 and look for the new tournament
```

## 🐛 Troubleshooting

### "Please configure API URL in settings first"

**Solution:** Click the extension icon → "⚙️ Settings" → Enter API URL → Save

### "Connection error: Failed to fetch"

**Problem:** Backend is not running

**Solution:**
```bash
cd backend
npm run dev
```

### "Backend returned error: 500"

**Problem:** Database connection issue

**Solution:**
```bash
# Make sure PostgreSQL is running
docker-compose up -d database

# Check backend logs for details
cd backend
npm run dev
```

### Capture Not Working

1. Make sure you're on `app.kickertool.de`
2. Click "Export" → "Export as JSON"
3. Check browser console (F12) for any errors
4. Reload the page and try again

## 🎯 How It Works

1. **Content Script** (`content.js`) runs on Kickertool pages
2. **Injected Script** (`injected.js`) intercepts blob downloads
3. **Background Script** (`background.js`) receives captured data
4. **Popup** (`popup.html/js`) displays captured tournaments
5. **Backend API** (`POST /api/tournaments`) stores in database

## 📦 What Gets Uploaded

The extension captures and uploads the **complete tournament JSON** including:
- Tournament metadata (name, date, mode, sport)
- Qualifying rounds (matches, standings, stats)
- Elimination rounds (bracket, matches, results)
- Player information (names, external IDs, stats)

This is the exact same data format that Kickertool exports!

## 🔐 Privacy & Security

- API URL is stored locally in your browser
- No data is sent to external services
- All communication is between your browser and your backend
- Data goes directly into your PostgreSQL database

## 🎉 Benefits Over GitHub Method

✅ **Instant updates** - Data appears immediately in your app
✅ **No git commits** - Cleaner repository history  
✅ **Simpler workflow** - No GitHub tokens needed
✅ **Better scalability** - Database handles large datasets efficiently
✅ **Real-time** - Frontend always shows latest data

## 📚 Additional Resources

- [Backend Setup Guide](../BACKEND_SETUP.md)
- [Migration Guide](../MIGRATION_TO_API.md)
- [Main README](../README.md)

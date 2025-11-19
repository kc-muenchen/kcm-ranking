# Browser Extension Changelog

## v1.3.0 - Production Ready

### Changes

**Cleaned up for production**: Removed verbose debug logging and simplified the user interface.

- Removed debug section from popup
- Removed manual capture feature (automatic works reliably now)
- Simplified console logging (only essential messages)
- Removed self-test code
- Removed verbose interception logging
- Cleaned up all emoji-heavy debug messages

### Benefits

- ✅ **Cleaner console**: Only shows essential "Tournament captured" message
- ✅ **Simpler popup**: Just shows captured tournaments, no debug clutter
- ✅ **Production-ready**: Professional, clean experience for end users
- ✅ **Smaller codebase**: Removed ~300 lines of debug code

---

## v1.2.0 - Separate Settings Page

### Changes

**Improved Security & UX**: Moved GitHub settings to a separate options page so team members don't see admin credentials.

- Added `options.html` - Dedicated settings page for administrators
- Added `options.js` - Settings page logic with connection testing
- Updated `popup.html` - Simplified popup, removed inline settings
- Updated `popup.js` - Added settings link and configuration check
- Updated `manifest.json` - Registered options page

### Benefits

- ✅ **Security**: GitHub token hidden from regular users
- ✅ **Simpler UX**: Main popup only shows export functionality
- ✅ **Admin-friendly**: Settings page includes connection testing
- ✅ **Team-ready**: Perfect for multi-user deployments

### How to Access Settings

- Right-click extension icon → "Options"
- Or click extension → "⚙️ Settings" link
- Or chrome://extensions → Extension details → Extension options

---

## v1.1.0 - Improved Automatic Capture

### Major Changes

**Problem:** Automatic capture wasn't working because content scripts run in an isolated context and can't intercept all of Kickertool's JavaScript operations.

**Solution:** Implemented a dual-script approach:
- `injected.js` - Runs in the page's actual context with full access to the same globals as Kickertool
- `content.js` - Manages communication between injected script and extension

### Files Modified

1. **manifest.json**
   - Changed `run_at` from `document_end` to `document_start` for earlier injection
   - Added `web_accessible_resources` to allow injected.js to load
   - Added permissions: `activeTab`, `notifications`, `scripting`

2. **content.js**
   - Added injection of `injected.js` into page context
   - Added listener for custom events from injected script
   - Enhanced logging with emojis for easier debugging
   - Added multiple interception methods as fallbacks
   - Fixed DOM observer to handle document_start timing

3. **injected.js** (NEW)
   - Runs in page context (not isolated)
   - Intercepts `URL.createObjectURL`
   - Intercepts `document.createElement` for anchor elements
   - Intercepts `element.click()` method
   - Intercepts `setAttribute` for download attributes
   - Sends captured data to content script via custom events

4. **popup.js**
   - Added debug section to show capture status
   - Added manual capture feature as backup
   - Enhanced error messages and user feedback

5. **popup.html**
   - Added debug status display
   - Added "Capture from Current Tab" button

### How It Works

```
Kickertool Page → injected.js (intercepts) → Custom Event → content.js → background.js → popup.js
```

1. User loads Kickertool page
2. `content.js` injects `injected.js` into the page
3. `injected.js` intercepts blob creation/download in the same context as Kickertool
4. When tournament is exported, `injected.js` captures the data
5. Sends data via custom event to `content.js`
6. `content.js` forwards to `background.js`
7. User sees notification and can push to GitHub

### Features

- ✅ **Automatic capture** - Works with Kickertool's export
- ✅ **Manual capture** - Backup method if automatic fails
- ✅ **Debug logging** - Verbose console output for troubleshooting
- ✅ **Self-test** - Verifies interceptions are working on page load
- ✅ **Multiple fallbacks** - Many interception methods to catch edge cases

### Testing

After reloading the extension, you should see in console:
```
🎯 KCM Exporter: Injected script loaded in page context
✅ [INJECTED] All interceptions installed in page context
✅ Injected script loaded into page context
```

When exporting a tournament:
```
🔵 [INJECTED] URL.createObjectURL called!
🎉 [INJECTED] Tournament data captured!
📥 Tournament data received from injected script!
```

### Troubleshooting

If automatic capture still doesn't work:
1. Check console for `[INJECTED]` messages
2. Verify injected.js loaded successfully
3. Use manual capture feature
4. See TROUBLESHOOTING.md for details


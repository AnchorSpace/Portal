# Redo Google Apps Script — Complete Guide

Use this if you get **"No item with the given ID could be found"** or move to a new Google account.

---

## Your current live setup (working)

| Item | Value |
|------|-------|
| **Sheet ID** | `1nNAgJDPWqBNOXdI0mJeXhfx76dINuGnxKw7v8AYvjWM` |
| **Folder ID** | `1c4dcN0iiNpmSwyJxsbIUQ5gdl-x-Ikzl` |
| **Web App URL** | `https://script.google.com/macros/s/AKfycbxStI0u7tpPcNQ_LwKuegGtLZOI8R4SzQUjEXTzNVggP5f5HYSFL2XgZc0oxTWBIz_nBg/exec` |

Only redo the steps below if you need **new** Sheet/Folder IDs on a different account.

---

## STEP A — Create a new Google Sheet

1. [sheets.google.com](https://sheets.google.com) → **Blank**
2. Name: **Property Submissions**
3. Copy ID from URL (between `/d/` and `/edit`)

---

## STEP B — Create a new Drive folder

1. [drive.google.com](https://drive.google.com) — **same account**
2. **New → Folder** → **Property Uploads**
3. Open folder → copy ID after `/folders/`

---

## STEP C — Open Apps Script

1. [script.google.com](https://script.google.com)
2. Open **Property Submission API** (or create new project)

---

## STEP D — Paste Code.gs

1. **Code.gs** → delete all
2. Paste from: `C:\xampp\htdocs\New folder\ongithub\appsscript.gs`

---

## STEP E — Set IDs (lines 16 & 19)

```javascript
const PARENT_FOLDER_ID = 'YOUR_NEW_FOLDER_ID';
const SPREADSHEET_ID = 'YOUR_NEW_SHEET_ID';
```

Current working values:

```javascript
const PARENT_FOLDER_ID = '1c4dcN0iiNpmSwyJxsbIUQ5gdl-x-Ikzl';
const SPREADSHEET_ID = '1nNAgJDPWqBNOXdI0mJeXhfx76dINuGnxKw7v8AYvjWM';
```

**Ctrl+S**

---

## STEP F — Paste appsscript.json

1. Gear → enable **Show appsscript.json**
2. Paste from `ongithub/appsscript.json`
3. **Ctrl+S**

---

## STEP G — Run setupProject

1. **Code.gs** → **`setupProject`** → **▶ Run**
2. Authorize: **Advanced** → **Allow**
3. Logs:

```
OK — Drive folder found: Property Uploads
OK — Spreadsheet found: Property Submissions
OK — Headers synced to 16 columns.
Setup complete!
```

| Error | Fix |
|-------|-----|
| Drive folder not found | Wrong folder ID or wrong Google account |
| Spreadsheet not found | Wrong sheet ID |

---

## STEP H — Deploy Web App

1. **Deploy → New deployment** (or Edit → **New version**)
2. Web app | Execute as: **Me** | Access: **Anyone**
3. Copy `/exec` URL

---

## STEP I — Update script.js (line 10)

```javascript
WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
```

Current live value:

```javascript
WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxStI0u7tpPcNQ_LwKuegGtLZOI8R4SzQUjEXTzNVggP5f5HYSFL2XgZc0oxTWBIz_nBg/exec',
```

Push updated `script.js` to GitHub.

---

## STEP J — Check sheet

Click **Submissions** tab at bottom. Row 1 = 16 column headers (see SETUP-GUIDE.md).

---

## STEP K — Test

1. Live site → **Ctrl+F5**
2. Submit test property
3. Verify sheet row + Drive folder

---

## Checklist

- [ ] Sheet + Folder created (if redoing)
- [ ] Code.gs pasted + IDs set
- [ ] appsscript.json pasted
- [ ] setupProject passed
- [ ] Web App deployed
- [ ] script.js WEB_APP_URL updated on GitHub
- [ ] Test submission works

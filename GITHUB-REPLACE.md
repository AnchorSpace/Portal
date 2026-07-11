# Replace on GitHub — Anchor Submission Portal

Ready-to-upload files from the `ongithub/` folder.

---

## Your live configuration (current)

| Item | Value |
|------|-------|
| **Sheet ID** | `1nNAgJDPWqBNOXdI0mJeXhfx76dINuGnxKw7v8AYvjWM` |
| **Drive Folder ID** | `1c4dcN0iiNpmSwyJxsbIUQ5gdl-x-Ikzl` |
| **Web App URL** | In `script.js` line 10 (see below) |

```javascript
WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxStI0u7tpPcNQ_LwKuegGtLZOI8R4SzQUjEXTzNVggP5f5HYSFL2XgZc0oxTWBIz_nBg/exec',
```

---

## Step 1 — Replace on GitHub

| File | Action |
|------|--------|
| `index.html` | ✅ Replace |
| `styles.css` | ✅ Replace |
| `script.js` | ✅ Replace |
| `images/logo.png` | ✅ Must exist in repo |

**Do NOT upload:** `appsscript.gs`, `appsscript.json`

---

## Step 2 — Google Apps Script (if code changed)

1. [script.google.com](https://script.google.com) → your project
2. Replace all of **Code.gs** with `ongithub/appsscript.gs`
3. Confirm IDs (lines 16–19):

```javascript
const PARENT_FOLDER_ID = '1c4dcN0iiNpmSwyJxsbIUQ5gdl-x-Ikzl';
const SPREADSHEET_ID = '1nNAgJDPWqBNOXdI0mJeXhfx76dINuGnxKw7v8AYvjWM';
```

4. Run **`setupProject`**
5. **Deploy → Manage deployments → Edit → New version → Deploy**

---

## Step 3 — Google Sheet (16 columns)

Data saves to the **Submissions** tab. Row 1 headers:

1. Timestamp  
2. Property ID  
3. Seller Name  
4. Phone  
5. Email  
6. Contact Method  
7. Property Type  
8. County  
9. City  
10. Neighborhood  
11. Address  
12. Google Maps Link  
13. Additional Information  
14. Drive Folder URL  
15. Image URLs  
16. Video URLs  

If you have old extra columns from a previous version, delete them manually (backup sheet first if needed).

---

## Step 4 — Test

1. Hard refresh live site (**Ctrl+F5**)
2. Submit test property
3. Check **Submissions** tab + Drive folder

---

## Checklist

- [ ] `index.html`, `styles.css`, `script.js` on GitHub
- [ ] `images/logo.png` on GitHub
- [ ] `Code.gs` matches `appsscript.gs` (if backend changed)
- [ ] `setupProject` run after backend changes
- [ ] Web App redeployed after backend changes
- [ ] Test submission works

---

See also: [SETUP-GUIDE.md](SETUP-GUIDE.md) | [APPSCRIPT-SETUP.md](APPSCRIPT-SETUP.md)

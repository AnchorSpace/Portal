# Anchor Submission Portal

A production-ready property submission web application. Property owners submit photos and information through a modern landing page; data is stored in Google Sheets and media in Google Drive via Google Apps Script.

> **Setup:** Start with **[SETUP-GUIDE.md](SETUP-GUIDE.md)**  
> **GitHub deploy:** See **[GITHUB-REPLACE.md](GITHUB-REPLACE.md)** (in `ongithub/` folder)  
> **Redo Apps Script:** See **[APPSCRIPT-SETUP.md](APPSCRIPT-SETUP.md)** (in `ongithub/` folder)

---

## Live configuration (current)

| Item | Value |
|------|-------|
| **Sheet ID** | `1nNAgJDPWqBNOXdI0mJeXhfx76dINuGnxKw7v8AYvjWM` |
| **Drive Folder ID** | `1c4dcN0iiNpmSwyJxsbIUQ5gdl-x-Ikzl` |
| **Web App URL** | Set in `script.js` line 10 |

Data is saved to the **Submissions** tab in Google Sheets.

---

## Features

- Anchor Submission Portal branding with logo (`images/logo.png`)
- USA-focused form (county, city, neighborhood)
- Client-side image compression (WebP, max 1920px)
- Client-side video compression via FFmpeg.wasm (when supported)
- Drag-and-drop image upload with reorder
- Centered upload progress overlay
- Mobile-first responsive design
- Secure backend — Sheet/Drive IDs stay in Apps Script only

---

## Form fields collected

| Section | Fields |
|---------|--------|
| Seller | Name, Phone, Email, Contact Method (Phone / Email / Text) |
| Property | Type |
| Location | County, City, Neighborhood, Address, Maps link |
| Notes | Any additional information (optional) |
| Media | Up to 20 images, 3 videos |

---

## Google Sheet columns (16)

Timestamp · Property ID · Seller Name · Phone · Email · Contact Method · Property Type · County · City · Neighborhood · Address · Google Maps Link · Additional Information · Drive Folder URL · Image URLs · Video URLs

---

## Project structure

```
├── index.html          # Landing page + form
├── styles.css          # Styles
├── script.js           # Form logic, compression, API (upload to GitHub)
├── images/logo.png     # Logo (upload to GitHub)
├── appsscript.gs       # Backend — Google Apps Script only (NOT public GitHub)
├── appsscript.json     # Apps Script settings (NOT public GitHub)
├── SETUP-GUIDE.md      # Full setup guide
├── ongithub/           # Copy of files ready for GitHub upload
└── .gitignore
```

---

## Quick deploy

### GitHub (public)
Upload from `ongithub/`:
- `index.html`, `styles.css`, `script.js`, `images/logo.png`

### Google Apps Script (private)
1. Paste `appsscript.gs` into `Code.gs`
2. Paste `appsscript.json`
3. Run `setupProject`
4. Deploy Web App (Anyone)
5. Put Web App URL in `script.js` line 10

---

## Security

| Item | Public? |
|------|---------|
| Web App URL in `script.js` | Yes |
| Sheet ID, Folder ID | No — Apps Script only |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No rows in sheet | Open **Submissions** tab (not Sheet1) |
| `Drive folder not found` | Wrong folder ID or Google account |
| Old data going to wrong sheet | Update `WEB_APP_URL` in `script.js` on GitHub |
| Backend changes not working | Redeploy Web App (new version) |

Full troubleshooting: [SETUP-GUIDE.md](SETUP-GUIDE.md)

---

## License

Provided as-is for property submission use.

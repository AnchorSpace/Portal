# Complete Setup Guide — Anchor Submission Portal

This guide covers **everything** from zero to a working site. Follow the steps **in order**.

**Time needed:** about 20–30 minutes  
**What you need:** A Google account (Gmail)

---

## Your live configuration (current)

| Item | Value |
|------|-------|
| **Brand** | Anchor Submission Portal |
| **Sheet ID** | `1nNAgJDPWqBNOXdI0mJeXhfx76dINuGnxKw7v8AYvjWM` |
| **Sheet URL** | [Open Sheet](https://docs.google.com/spreadsheets/d/1nNAgJDPWqBNOXdI0mJeXhfx76dINuGnxKw7v8AYvjWM/edit) |
| **Drive Folder ID** | `1c4dcN0iiNpmSwyJxsbIUQ5gdl-x-Ikzl` |
| **Drive Folder URL** | [Property Uploads](https://drive.google.com/drive/folders/1c4dcN0iiNpmSwyJxsbIUQ5gdl-x-Ikzl) |
| **Web App URL** | `https://script.google.com/macros/s/AKfycbxStI0u7tpPcNQ_LwKuegGtLZOI8R4SzQUjEXTzNVggP5f5HYSFL2XgZc0oxTWBIz_nBg/exec` |

> Data is saved to the **Submissions** tab in your sheet — not always the first tab you see.

---

## Table of Contents

1. [How the system works](#how-the-system-works)
2. [Current form fields](#current-form-fields)
3. [Google Sheet columns (16)](#google-sheet-columns-16)
4. [How to get IDs from URLs](#how-to-get-ids-from-urls)
5. [What to replace in which file](#what-to-replace-in-which-file)
6. [Part 1 — Google setup (Steps 1–6)](#part-1--google-setup)
7. [Part 2 — Connect the website (Steps 7–9)](#part-2--connect-the-website)
8. [Part 3 — GitHub & going live (Steps 10–12)](#part-3--github--going-live)
9. [Troubleshooting](#troubleshooting)
10. [Quick reference card](#quick-reference-card)

---

## How the system works

```
User opens website (GitHub Pages / hosting)
        ↓
script.js sends form + media to Google Apps Script (Web App URL)
        ↓
Apps Script saves files to Google Drive + row to Google Sheet (Submissions tab)
```

| Piece | Where it lives |
|-------|----------------|
| `index.html`, `styles.css`, `script.js`, `images/logo.png` | GitHub Pages / hosting |
| `appsscript.gs`, `appsscript.json` | Google Apps Script only (not public GitHub) |
| Web App URL | `script.js` line 10 (safe to be public) |
| Sheet ID, Folder ID | `appsscript.gs` lines 16–19 (keep private) |

---

## Current form fields

The form collects:

**Seller information**
- Full Name, Phone, Email
- Preferred Contact Method: Phone, Email, Text

**Property information**
- Property Type (House, Apartment, Villa, etc.)

**Location**
- County, City, Neighborhood, Street Address, Google Maps Link (optional)

**Any additional information**
- Optional textarea

**Media**
- Up to 20 images, up to 3 videos

**Removed from form** (no longer collected):
- Property Title, Property Details (bedrooms, price, etc.), Amenities, Why Choose Us section

---

## Google Sheet columns (16)

| # | Column |
|---|--------|
| 1 | Timestamp |
| 2 | Property ID |
| 3 | Seller Name |
| 4 | Phone |
| 5 | Email |
| 6 | Contact Method |
| 7 | Property Type |
| 8 | County |
| 9 | City |
| 10 | Neighborhood |
| 11 | Address |
| 12 | Google Maps Link |
| 13 | Additional Information |
| 14 | Drive Folder URL |
| 15 | Image URLs |
| 16 | Video URLs |

Drive folders are named: `PropertyType_City_YYYYMMDD_HHMMSS`

---

## How to get IDs from URLs

### Google Sheet ID

```
https://docs.google.com/spreadsheets/d/1nNAgJDPWqBNOXdI0mJeXhfx76dINuGnxKw7v8AYvjWM/edit
                                      └──────────── COPY THIS ────────────┘
```

**Rule:** Copy everything between `/d/` and `/edit`.

### Google Drive Folder ID

Open the folder first, then:

```
https://drive.google.com/drive/folders/1c4dcN0iiNpmSwyJxsbIUQ5gdl-x-Ikzl
                                        └────────── COPY THIS ──────────┘
```

**Rule:** Copy everything after `/folders/`.

### Web App URL

Copy the **full URL** ending in `/exec` — do not extract an ID.

---

## What to replace in which file

| File | Where | What to set |
|------|-------|-------------|
| `appsscript.gs` → `Code.gs` | Line 16 | `PARENT_FOLDER_ID` |
| `appsscript.gs` → `Code.gs` | Line 19 | `SPREADSHEET_ID` |
| `script.js` | Line 10 | `WEB_APP_URL` |
| `appsscript.json` | Whole file | Paste as-is into Apps Script |

**Upload to GitHub:** `index.html`, `styles.css`, `script.js`, `images/logo.png`, guides  
**Do NOT upload to public GitHub:** `appsscript.gs`, `appsscript.json`

---

# PART 1 — Google Setup

---

## Step 1 — Create Google Sheet

1. [sheets.google.com](https://sheets.google.com) → **Blank**
2. Name: **Property Submissions**
3. Copy Sheet ID from URL

---

## Step 2 — Create Drive Folder

1. [drive.google.com](https://drive.google.com) → **New → Folder**
2. Name: **Property Uploads**
3. Open folder → copy Folder ID from URL

---

## Step 3 — Apps Script Code.gs

1. [script.google.com](https://script.google.com) → **Property Submission API**
2. **Code.gs** → delete all → paste from `ongithub/appsscript.gs`
3. Update lines 16 & 19 with your IDs
4. **Ctrl+S**

---

## Step 4 — appsscript.json

1. Gear → enable **Show appsscript.json**
2. Paste from `ongithub/appsscript.json`
3. **Ctrl+S**

---

## Step 5 — Run setupProject

1. On **Code.gs** → select **`setupProject`** → **▶ Run**
2. Authorize: **Advanced** → **Allow**
3. Logs should show:

```
OK — Drive folder found: Property Uploads
OK — Spreadsheet found: Property Submissions
OK — Headers synced to 16 columns.
Setup complete!
```

---

## Step 6 — Deploy Web App

1. **Deploy → New deployment** (or Manage → Edit → **New version**)
2. Type: **Web app** | Execute as: **Me** | Access: **Anyone**
3. Copy Web App URL → paste into `script.js` line 10

---

# PART 2 — Connect the Website

---

## Step 7 — Update script.js

Line 10 (current live value):

```javascript
WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxStI0u7tpPcNQ_LwKuegGtLZOI8R4SzQUjEXTzNVggP5f5HYSFL2XgZc0oxTWBIz_nBg/exec',
```

---

## Step 8 — Test locally (optional)

```
http://localhost/New%20folder/
```

Requires XAMPP Apache running. Local folder is for testing only.

---

## Step 9 — Test submission

1. Fill required fields + upload 1 image
2. Click **Submit Property**
3. Check **Submissions** tab in sheet
4. Check **Property Uploads** folder in Drive

---

# PART 3 — GitHub & Going Live

---

## Step 10 — Upload to GitHub

From `ongithub/` folder:

```
index.html
styles.css
script.js
images/logo.png
README.md
SETUP-GUIDE.md
GITHUB-REPLACE.md
.gitignore
```

---

## Step 11 — Enable GitHub Pages

Repo → **Settings → Pages** → deploy from `main` branch.

---

## Step 12 — Verify live site

1. Hard refresh (**Ctrl+F5**)
2. Logo shows in header/footer
3. Test submission end-to-end

---

# Troubleshooting

| Problem | Fix |
|---------|-----|
| No data in sheet | Click **Submissions** tab at bottom of spreadsheet |
| `Drive folder not found` | Wrong folder ID or wrong Google account |
| `Spreadsheet not found` | Wrong sheet ID |
| Form submits but old sheet gets data | Update `WEB_APP_URL` in `script.js` on GitHub |
| `Google hasn't verified` | Advanced → Allow |
| Changed Code.gs | Redeploy Web App (new version) |
| Logo missing on site | Add `images/logo.png` to GitHub repo |

---

# Quick reference card

| Step | Action |
|------|--------|
| 1 | Create Sheet → copy Sheet ID |
| 2 | Create Drive folder → copy Folder ID |
| 3 | Paste `appsscript.gs` into Code.gs + set IDs |
| 4 | Paste `appsscript.json` |
| 5 | Run `setupProject` |
| 6 | Deploy Web App → copy URL to `script.js` |
| 7–9 | Test submission |
| 10–12 | Push to GitHub + enable Pages |

---

*Anchor Submission Portal — setup guide (updated July 2026)*

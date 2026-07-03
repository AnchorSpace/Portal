# Complete Setup Guide — Anchor Submission Portal

This guide walks you through **everything** from zero to a working site — or moving to a **new Google email**. Follow the steps **in order**.

**Time needed:** about 20–30 minutes  
**What you need:** A Google account (Gmail)

---

## Table of Contents

1. [How the system works](#how-the-system-works)
2. [How to get IDs from URLs](#how-to-get-ids-from-urls) ← read this if URLs confuse you
3. [What to replace in which file](#what-to-replace-in-which-file)
4. [Part 1 — Google setup (Steps 1–6)](#part-1--google-setup)
5. [Part 2 — Connect the website (Steps 7–9)](#part-2--connect-the-website)
6. [Part 3 — GitHub & going live (Steps 10–12)](#part-3--github--going-live)
7. [Moving to a different Google email](#moving-to-a-different-google-email)
8. [Troubleshooting](#troubleshooting)
9. [Quick reference card](#quick-reference-card)

---

## How the system works

```
User opens your website (GitHub Pages / hosting / localhost)
        ↓
User fills form → script.js sends data to Google Apps Script (Web App URL)
        ↓
Apps Script saves photos/videos to Google Drive + row to Google Sheet
```

### What lives where

| Piece | Purpose | Needs internet? |
|-------|---------|-----------------|
| `index.html`, `styles.css`, `script.js` | Website users see | Yes (hosted or localhost) |
| Google Apps Script | Backend API | Yes (Google servers) |
| Google Sheet | Submission data | Yes (your Google account) |
| Google Drive | Photos & videos | Yes (your Google account) |
| XAMPP / `htdocs` | **Local testing only** | Only on your PC |

> **Important:** Users anywhere in the world can use your site once it is hosted online. They do **not** need your computer or XAMPP.

---

## How to get IDs from URLs

You need **2 IDs** from Google and **1 full URL** after deploy. Here is exactly how to find each one.

---

### A) Google Sheet ID

1. Open your spreadsheet in Chrome (or any browser).
2. Look at the **address bar** at the top.

**Full URL example:**
```
https://docs.google.com/spreadsheets/d/1QUOUX7PWHgP4oXRoZvmXsbpxAKJr4Itunv8tlu9woCA/edit?gid=0#gid=0
```

**Find the ID between `/d/` and `/edit`:**

```
https://docs.google.com/spreadsheets/d/ 1QUOUX7PWHgP4oXRoZvmXsbpxAKJr4Itunv8tlu9woCA /edit?gid=0
                                         └────────────────── COPY THIS ──────────────────┘
```

**Sheet ID to save:**
```
1QUOUX7PWHgP4oXRoZvmXsbpxAKJr4Itunv8tlu9woCA
```

**Simple rule:** Copy the long code after `/d/` and before `/edit`.

---

### B) Google Drive Folder ID

1. Go to [Google Drive](https://drive.google.com).
2. **Double-click** your folder **Property Uploads** — you must be **inside** it.
3. Look at the address bar.

**Full URL example:**
```
https://drive.google.com/drive/u/0/folders/1nXYcAVd-oSHSQiM0bRVizsOI9aPCmbJg
```

**Find the ID after `/folders/`:**

```
https://drive.google.com/drive/u/0/folders/ 1nXYcAVd-oSHSQiM0bRVizsOI9aPCmbJg
                                              └──────────── COPY THIS ────────────┘
```

**Folder ID to save:**
```
1nXYcAVd-oSHSQiM0bRVizsOI9aPCmbJg
```

**Simple rule:** Copy everything after `/folders/`.

> ⚠️ If your URL does **not** contain `/folders/`, you are not inside the folder yet. Open **Property Uploads** first.

---

### C) Web App URL (after deploy) — copy the FULL link

This one is **different**. Do **not** extract an ID. Copy the **entire URL**.

**Example:**
```
https://script.google.com/macros/s/AKfycbwqH56iq1wTf4gPzhFQeVSvERdx2drmqh3iqepnGhZntetUNLwUfkviWqzaWcyU8bhS/exec
```

Copy from `https://` all the way through `/exec` (include `/exec`).

**Test:** Paste in browser. You should see:
```json
{"success":true,"message":"Property submission API is running.","version":"1.0.0"}
```

---

### ID cheat sheet

| What you need | Where in the URL | What to copy |
|---------------|------------------|--------------|
| **Sheet ID** | between `/d/` and `/edit` | ID only |
| **Folder ID** | after `/folders/` | ID only |
| **Web App URL** | whole link | Full URL ending in `/exec` |

📝 Keep a note like this while setting up:

```
MY_SHEET_ID    = ________________________________
MY_FOLDER_ID   = ________________________________
MY_WEB_APP_URL = https://script.google.com/macros/s/________/exec
```

---

## What to replace in which file

Use this table every time you set up or move accounts.

| File | Where | What to replace | Replace with |
|------|-------|-----------------|--------------|
| **Apps Script `Code.gs`** | Line ~16 | `PARENT_FOLDER_ID = '...'` | Your **Folder ID** |
| **Apps Script `Code.gs`** | Line ~19 | `SPREADSHEET_ID = '...'` | Your **Sheet ID** |
| **GitHub / hosting `script.js`** | Line ~10 | `WEB_APP_URL: '...'` | Your full **Web App URL** |
| **Apps Script `appsscript.json`** | Whole file | Paste from PC | No ID edits needed |
| **`index.html`** | — | Do not change for setup | — |
| **`styles.css`** | — | Do not change for setup | — |

### What is public vs private

| Item | Safe on public GitHub? |
|------|------------------------|
| `index.html`, `styles.css`, `script.js` | ✅ Yes |
| Web App URL inside `script.js` | ✅ Yes |
| Sheet ID, Folder ID | ❌ No — Apps Script only |
| `appsscript.gs`, `appsscript.json` | ❌ No — keep in Google or private repo |

---

# PART 1 — Google Setup

Use the **same Google account** for Steps 1–6.

---

## Step 1 — Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank**
3. Rename (top left): **Property Submissions**
4. Leave it empty — headers are added automatically
5. Copy your **Sheet ID** using [section A above](#a-google-sheet-id)

✅ **Done when:** You have the Sheet ID written down.

---

## Step 2 — Create the Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. **New** → **Folder** → name: **Property Uploads**
3. **Double-click** to open the folder
4. Copy your **Folder ID** using [section B above](#b-google-drive-folder-id)

> Do **not** create `images/` or `videos/` manually — the script creates them per submission.

✅ **Done when:** You have the Folder ID written down.

---

## Step 3 — Create Google Apps Script + paste Code.gs

1. Go to [Google Apps Script](https://script.google.com)
2. **New project** → rename: **Property Submission API**
3. Click **Code.gs** → delete all default code
4. On your PC open:
   ```
   C:\xampp\htdocs\New folder\appsscript.gs
   ```
5. Copy **everything** → paste into **Code.gs**

### Replace your IDs at the top of Code.gs

Find these two lines and paste **your** IDs from Steps 1 & 2:

**Replace this:**
```javascript
const PARENT_FOLDER_ID = 'YOUR_OLD_OR_PLACEHOLDER_FOLDER_ID';
const SPREADSHEET_ID = 'YOUR_OLD_OR_PLACEHOLDER_SHEET_ID';
```

**With this (your real values):**
```javascript
const PARENT_FOLDER_ID = 'PASTE_YOUR_FOLDER_ID_HERE';
const SPREADSHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
```

Press **Ctrl+S** to save.

✅ **Done when:** `Code.gs` has full code + your two real IDs at the top.

---

## Step 4 — Set up appsscript.json

> This is a **second file** in Apps Script — not `Code.gs`.

### 4a. Show the file

1. Click **gear icon** ⚙️ → **Project settings**
2. Turn **ON**: **"Show appsscript.json manifest file in editor"**
3. Click **Editor** (`<>`) to go back

You should see:
```
Files
 ├── Code.gs
 └── appsscript.json
```

### 4b. Paste settings

1. Click **appsscript.json**
2. Ctrl+A → delete all
3. On your PC open:
   ```
   C:\xampp\htdocs\New folder\appsscript.json
   ```
4. Copy everything → paste → **Ctrl+S**

No ID replacements needed in this file.

✅ **Done when:** Both files appear in the sidebar.

---

## Step 5 — Run setupProject

1. Click **Code.gs** (not appsscript.json)
2. **Ctrl+S** to save
3. Top toolbar → dropdown next to ▶ Run → select **`setupProject`**
4. Click **▶ Run**

> **Can't see the dropdown?**
> - Must be on **Code.gs**
> - Save first (Ctrl+S)
> - Or menu: **Run → Run function → setupProject**

### Authorize (first time only)

Google shows: **"Google hasn't verified this app"** — this is **normal** for your own script.

1. Click **Advanced**
2. Click **Go to Property Submission API (unsafe)**
3. Click **Allow**

### Check logs

**View → Logs** should show:
```
Parent folder found: Property Uploads
Sheet ready: Submissions with 1 rows
Setup complete!
```

Open your Sheet — **Submissions** tab with headers should appear.

✅ **Done when:** Logs say "Setup complete!"

---

## Step 6 — Deploy as Web App

> Deploy from [script.google.com](https://script.google.com) in the browser — **not** from your PC files.

1. **Deploy** → **New deployment**
2. Gear icon ⚙️ → **Web app**
3. Settings:

| Field | Value |
|-------|-------|
| Description | Property Submission API v1 |
| Execute as | **Me** |
| Who has access | **Anyone** |

4. **Deploy** → authorize if asked
5. Copy the full **Web App URL** (see [section C above](#c-web-app-url-after-deploy--copy-the-full-link))
6. Test in browser — JSON success message should appear

✅ **Done when:** Browser shows `"success":true`.

---

# PART 2 — Connect the Website

---

## Step 7 — Update script.js (Web App URL)

### On GitHub (live site)

1. Open **`script.js`** in your GitHub repo
2. Find line **~10**:

**Replace old URL:**
```javascript
WEB_APP_URL: 'https://script.google.com/macros/s/OLD_ID_HERE/exec',
```

**With your new URL:**
```javascript
WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_NEW_ID_HERE/exec',
```

3. Save / commit

### On your PC (optional — for XAMPP testing)

Same change in:
```
C:\xampp\htdocs\New folder\script.js
```

✅ **Done when:** `WEB_APP_URL` has your real `/exec` URL.

---

## Step 8 — Test locally with XAMPP (optional)

XAMPP is **only for testing on your computer** — not required for live users.

1. Files in:
   ```
   C:\xampp\htdocs\New folder\
   ├── index.html
   ├── styles.css
   └── script.js
   ```
2. XAMPP Control Panel → Start **Apache**
3. Open:
   ```
   http://localhost/New%20folder/
   ```

✅ **Done when:** You see **Anchor Submission Portal** landing page.

---

## Step 9 — Test a full submission

1. Fill required fields (name, phone, property title, type, county, city, address)
2. Upload 1–2 test images
3. Click **Submit Property**

### Verify

| Check | Where |
|-------|-------|
| New row with form data | Google Sheet → Submissions |
| New property folder | Drive → Property Uploads |
| Photos inside folder | `images/` subfolder |

✅ **Done when:** Sheet row + Drive files appear.

---

# PART 3 — GitHub & Going Live

---

## Step 10 — What to upload to GitHub

### ✅ Upload these

```
index.html
styles.css
script.js
README.md
SETUP-GUIDE.md
.gitignore
```

### ❌ Do NOT upload to public GitHub

```
appsscript.gs    ← contains Sheet ID + Folder ID
appsscript.json  ← backend settings
```

`.gitignore` already blocks the backend files if you use git locally.

---

## Step 11 — Push to GitHub

```bash
cd "C:\xampp\htdocs\New folder"
git add index.html styles.css script.js README.md SETUP-GUIDE.md .gitignore
git commit -m "Update Anchor Submission Portal"
git push
```

---

## Step 12 — Go live (so anyone can use it)

GitHub repo alone is **not** enough unless you enable **GitHub Pages**.

Host these 3 files publicly:
- `index.html`
- `styles.css`
- `script.js`

Options:
- [GitHub Pages](https://pages.github.com)
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)
- Any web hosting (cPanel, etc.)

Once hosted, users **anywhere in the world** can submit properties. They only need your public site URL — not XAMPP or your PC.

---

# Moving to a Different Google Email

Use this when switching to a new Gmail (new business account, etc.).

**Best approach:** Create **fresh** on the new email (do not try to "move" Apps Script).

### Steps (new account)

| Step | Action |
|------|--------|
| 1 | New Google account → create new Sheet → copy **new Sheet ID** |
| 2 | Create new **Property Uploads** folder → copy **new Folder ID** |
| 3 | New Apps Script project → paste `appsscript.gs` → replace **both IDs** in `Code.gs` |
| 4 | Paste `appsscript.json` |
| 5 | Run `setupProject` |
| 6 | Deploy Web App → copy **new Web App URL** |
| 7 | Update **only line ~10** in `script.js` on GitHub with new URL |
| 8 | Test submission on live site |

### Files to touch when moving

| File | Change? |
|------|---------|
| Apps Script `Code.gs` | ✅ New Sheet ID + Folder ID |
| Apps Script `appsscript.json` | ✅ Paste as-is (new project) |
| `script.js` | ✅ New Web App URL only |
| `index.html` | ❌ No |
| `styles.css` | ❌ No |

### Old account

After new setup works, old Sheet/Drive/Apps Script on the old email can be kept for records or deleted. The live site only uses the **new** `WEB_APP_URL`.

---

# Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't find Sheet ID | Copy text between `/d/` and `/edit` in URL |
| Can't find Folder ID | Open folder first; copy after `/folders/` |
| "Please configure Web App URL" | Paste real `/exec` URL in `script.js` line ~10 |
| "Google hasn't verified this app" | Advanced → Go to ... (unsafe) → Allow |
| No function dropdown | Switch to `Code.gs`, save, then Run |
| "Invalid response from server" | Redeploy with **Anyone** access; test URL in browser |
| Form submits, no Sheet row | Apps Script → **Executions** tab → check errors |
| No images in Drive | Wrong `PARENT_FOLDER_ID` in `Code.gs` |
| Changed backend code | **New deployment** required for changes to go live |
| Video won't compress locally | Normal on XAMPP; uploads still work (original file) |

---

# Quick Reference Card

| Step | Action | You get |
|------|--------|---------|
| 1 | Create Google Sheet | **Sheet ID** |
| 2 | Create Drive folder | **Folder ID** |
| 3 | Paste `Code.gs` + add both IDs | Backend ready |
| 4 | Paste `appsscript.json` | Settings ready |
| 5 | Run `setupProject` | Sheet headers created |
| 6 | Deploy Web App (Anyone) | **Web App URL** |
| 7 | Update `script.js` line ~10 | Website connected |
| 8 | Test on XAMPP (optional) | Local preview |
| 9 | Submit test property | Row + Drive files |
| 10–11 | Push to GitHub | Code backed up |
| 12 | Enable hosting / GitHub Pages | Live for everyone |

---

*Anchor Submission Portal — setup guide v2*

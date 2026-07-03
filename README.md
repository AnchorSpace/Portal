# Property Submission Landing Page

A production-ready property submission web application that allows property owners to submit their properties for sale. Features client-side image and video compression, drag-and-drop media uploads, and a Google Apps Script backend that stores data in Google Drive and Google Sheets.

> **New to this project?** Start with **[SETUP-GUIDE.md](SETUP-GUIDE.md)** — a complete step-by-step guide covering Google Sheet, Drive, Apps Script, deployment, testing, and GitHub.

## Features

- Premium real estate landing page design (dark blue + gold accents)
- Mobile-first responsive layout
- Complete property submission form with validation
- Client-side image compression (WebP, max 1920px, ~78% quality)
- Client-side video compression via FFmpeg.wasm (1080p, H.264)
- Drag-and-drop image upload with reorder support
- Upload progress with estimated time remaining
- Automatic retry on failed uploads
- Duplicate submission prevention
- Secure backend — no Google IDs exposed to users

## Project Structure

```
├── index.html        # Landing page and submission form
├── styles.css        # Premium real estate styles
├── script.js         # Form logic, compression, and API calls
├── appsscript.gs     # Google Apps Script backend (DO NOT upload to public GitHub)
├── appsscript.json   # Apps Script manifest (DO NOT upload to public GitHub)
├── SETUP-GUIDE.md    # Complete step-by-step setup guide (START HERE)
├── README.md         # Project overview and reference
└── .gitignore        # Blocks private backend files from Git commits
```

---

## Deployment Guide

### Prerequisites

- A Google account
- A web server or hosting for the frontend (e.g., XAMPP, Netlify, GitHub Pages)
- A modern browser (Chrome, Edge, Firefox, Safari)

---

### Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it something like **Property Submissions**.
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
4. Keep this ID private — you will use it only in the Apps Script backend.

---

### Step 2: Create the Google Drive Folder

1. Go to [Google Drive](https://drive.google.com).
2. Create a folder named **Property Uploads**.
3. Open the folder and copy the **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```
4. Keep this ID private — you will use it only in the Apps Script backend.

The backend will automatically create subfolders for each submission:

```
Property Uploads/
└── PropertyName_20260703_143500/
    ├── images/
    └── videos/
```

---

### Step 3: Set Up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com) and click **New Project**.
2. Name the project **Property Submission API**.
3. Delete any default code in `Code.gs`.
4. Copy the entire contents of `appsscript.gs` from this project and paste it into the editor.
5. Update the two configuration constants at the top of the file:

   ```javascript
   const PARENT_FOLDER_ID = 'YOUR_PARENT_FOLDER_ID_HERE';  // From Step 2
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';      // From Step 1
   ```

6. Click **Project Settings** (gear icon) and enable **Show "appsscript.json" manifest file in editor**.
7. Replace the contents of `appsscript.json` with the one from this project.

---

### Step 4: Run Setup and Authorize

1. In the Apps Script editor, select the `setupProject` function from the dropdown.
2. Click **Run**.
3. Google will prompt you to authorize the script. Click **Review Permissions** and allow access to:
   - Google Drive (create folders and upload files)
   - Google Sheets (read and write data)
4. Check the **Execution log** (View → Logs) — you should see:
   ```
   Parent folder found: Property Uploads
   Sheet ready: Submissions with 1 rows
   Setup complete!
   ```

---

### Step 5: Deploy as Web App

1. Click **Deploy** → **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure:
   - **Description:** Property Submission API v1
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Copy the **Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
6. This is the **only** URL you expose to the frontend. Never share the Sheet ID or Folder ID.

> **Important:** Each time you change `appsscript.gs`, create a **New deployment** (or manage deployments → edit → New version) for changes to take effect.

---

### Step 6: Connect the Frontend

1. Open `script.js` in this project.
2. Find the `CONFIG` object at the top and replace the placeholder:

   ```javascript
   const CONFIG = {
     WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
     // ...
   };
   ```

3. Save the file.

---

### Step 7: Host the Frontend

#### Option A: XAMPP (Local Development)

1. Place all frontend files (`index.html`, `styles.css`, `script.js`) in:
   ```
   C:\xampp\htdocs\property-submission\
   ```
2. Start Apache in XAMPP Control Panel.
3. Open `http://localhost/property-submission/` in your browser.

#### Option B: Any Static Host

Upload `index.html`, `styles.css`, and `script.js` to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

---

### Step 8: Test the Application

1. Open the landing page in your browser.
2. Fill in the seller and property details.
3. Upload 1–2 test images (JPG or PNG).
4. Optionally upload a short test video (MP4).
5. Click **Submit Property**.
6. Watch the progress overlay through each stage:
   - Compressing Images...
   - Compressing Videos...
   - Uploading Files...
   - Saving Property...
   - Submission Complete.
7. Verify in Google Drive:
   - A new folder appears under **Property Uploads**.
   - Images are in the `images/` subfolder.
   - Videos are in the `videos/` subfolder.
8. Verify in Google Sheets:
   - A new row appears with all form data and media URLs.

---

## Security Notes

| Item | Visibility |
|------|-----------|
| Web App URL | Public (in `script.js`) |
| Spreadsheet ID | Private (Apps Script only) |
| Drive Folder ID | Private (Apps Script only) |
| API Keys | Not used |

The frontend validates file types and sizes before upload. The backend re-validates MIME types, sanitizes all text input, and verifies submission tokens.

---

## Configuration Reference

### Frontend (`script.js`)

| Setting | Default | Description |
|---------|---------|-------------|
| `MAX_IMAGES` | 20 | Maximum images per submission |
| `MAX_VIDEOS` | 3 | Maximum videos per submission |
| `MAX_IMAGE_SIZE` | 10 MB | Max size per image before compression |
| `MAX_VIDEO_SIZE` | 500 MB | Max size per video before compression |
| `IMAGE_MAX_WIDTH` | 1920 px | Max width after compression |
| `IMAGE_QUALITY` | 0.78 | WebP compression quality (75–80%) |

### Backend (`appsscript.gs`)

| Setting | Description |
|---------|-------------|
| `PARENT_FOLDER_ID` | Google Drive folder for all uploads |
| `SPREADSHEET_ID` | Google Sheet for submission data |
| `SHEET_NAME` | Tab name (default: `Submissions`) |
| `MAX_PAYLOAD_BYTES` | 45 MB per request limit |

---

## Troubleshooting

### "Please configure the Web App URL"

You have not replaced `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` in `script.js`. Paste your deployed Web App URL.

### "Invalid response from server"

- Verify the Web App is deployed with **Who has access: Anyone**.
- Create a new deployment after any code changes.
- Test the URL directly in a browser — you should see:
  ```json
  {"success":true,"message":"Property submission API is running.","version":"1.0.0"}
  ```

### CORS / Network Errors

The frontend uses `Content-Type: text/plain` to avoid CORS preflight issues with Google Apps Script. Do not change this header.

### "Payload too large"

A single file exceeds the 45 MB request limit after base64 encoding. The frontend compresses media before upload, but very large uncompressed videos may still hit this limit. Compress videos on the client first, or reduce video file size.

### Authorization Errors in Apps Script

1. Re-run `setupProject` from the editor.
2. Go to [Google Account Permissions](https://myaccount.google.com/permissions) and re-authorize the script.
3. Ensure the Google account that owns the Sheet and Drive folder is the same account deploying the script.

### Video Compression Not Working

FFmpeg.wasm requires `SharedArrayBuffer`, which needs these HTTP headers on your hosting server:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

On XAMPP/local hosting these headers are usually not set, so videos upload in their original format. The app shows a confirmation dialog in this case. For production video compression, deploy the frontend on a host that supports these headers (e.g., Netlify with a `_headers` file).

### Images Not Appearing in Drive

- Check that `PARENT_FOLDER_ID` is correct.
- Verify the script has Drive access (re-authorize if needed).
- Check Apps Script execution logs: **Executions** tab in the editor.

### Sheet Row Missing Data

- Ensure `SPREADSHEET_ID` is correct.
- Run `setupProject` to create headers.
- Check that the `finalize` step completed (view execution logs).

---

## Browser Support

| Browser | Images | Videos (compressed) | Videos (fallback) |
|---------|--------|--------------------|--------------------|
| Chrome 90+ | Yes | Yes* | Yes |
| Edge 90+ | Yes | Yes* | Yes |
| Firefox 90+ | Yes | Yes* | Yes |
| Safari 15+ | Yes | Limited | Yes |
| Mobile Chrome | Yes | Limited | Yes |
| Mobile Safari | Yes | Limited | Yes |

\* Requires COOP/COEP headers for FFmpeg.wasm SharedArrayBuffer support.

---

## Customization

### Branding

- Change **Anchor Submission Portal** branding in `index.html` (logo text and footer).
- Update CSS custom properties in `styles.css` (`:root` block) for colors.
- Replace the hero SVG illustration with your own image.

### Form Fields

Add or remove fields in three places:
1. `index.html` — form inputs
2. `script.js` — `collectFormData()` and `validateForm()`
3. `appsscript.gs` — `HEADERS` array and `sanitizeSubmissionData()`

### Timezone

Change `timeZone` in `appsscript.json` (default: `America/New_York`).

---

## License

This project is provided as-is for property submission use. Customize freely for your real estate business.

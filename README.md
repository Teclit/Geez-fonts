# Free Geez Fonts

Free Geez Fonts helps individuals, schools, businesses, and community organizations find, preview, and download Geez typefaces for documents, designs, websites, and everyday communication.

**Current version:** v1.00, May 24, 2023

## Overview

- **Content:** Geez font families grouped under `fonts/<City>/`.
- **Use cases:** Word, LibreOffice, Google Docs, PDFs, posters, signs, websites, apps, and design tools.
- **Preview app:** `index.html` loads the app from `assets/`.
- **Non-technical guide:** see `docs/Non-Technical-Guide-Word-GoogleDocs.md`.

## Project Structure

```text
.
|-- index.html
|-- api/
|   |-- download.js
|   `-- download-stats.js
|-- assets/
|   |-- css/
|   |   `-- styles.css
|   |-- data/
|   |   |-- city_name.json
|   |   |-- fonts.json
|   |   |-- fonts.min.json
|   |   |-- geez.ts
|   |   `-- tigrinya.ts
|   |-- images/
|   |   |-- free-geez-fonts.png
|   |   |-- og-image.png
|   |   `-- og-image-wide.png
|   `-- js/
|       `-- app.js
|-- docs/
|   |-- Eritrean-city.md
|   `-- Non-Technical-Guide-Word-GoogleDocs.md
|-- fonts/
|   `-- <City>/*.ttf
|-- scripts/
|   |-- cities_enum.py
|   `-- scan_fonts.py
|-- LICENSE.md
`-- README.md
```

`fonts/` stays at the project root so generated manifests and copied CSS snippets can use stable paths like `fonts/Asmara/AsmaraSansGeez-Regular.ttf`.

## Browser Preview

Run a local server from the project root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000/index.html
```

A local server is recommended because the preview app loads `assets/data/fonts.min.json`, `assets/data/city_name.json`, and `assets/data/geez.ts` with `fetch()`.

For local testing of the Vercel API routes, run Vercel's local runtime:

```powershell
npx vercel dev
```

If Blob credentials are not configured locally, font downloads still work and the stats API returns the initialized `1000+` display count.

## Download Tracking

Downloads are tracked by Vercel API functions instead of writing files into the deployed project. Vercel's runtime filesystem is read-only and not persistent, so the counters live in Vercel Blob at:

```text
download-counts.json
```

The public display count starts at `1000`. The stored JSON keeps `rawTotalDownloads`, `displayTotalDownloads`, `perFont`, `daily`, `createdAt`, and `updatedAt`. Display totals are computed as:

```text
displayTotalDownloads = 1000 + rawTotalDownloads
perFont[file].displayDownloads = 1000 + perFont[file].downloads
```

Download links use the API route:

```text
/api/download?file=fonts/Asmara/AsmaraSansGeez-Regular.ttf
```

The API validates that `file` starts with `fonts/`, ends with `.ttf`, is relative, is not an HTTP URL, and does not contain `..`. Valid requests read `download-counts.json`, increment the counters, write the JSON back to Vercel Blob when credentials are configured, and redirect with HTTP 302 to the real font file under `fonts/`.

Stats are available at:

```text
/api/download-stats
```

The frontend fetches this endpoint and shows the total downloads count when available. If the endpoint fails, the page keeps showing `1000+`.

### Vercel Blob Setup

The API functions use Vercel Blob through direct `fetch()` calls, so this project does not need a `package.json` or `@vercel/blob` dependency.

In Vercel, create or connect a Blob store to this project from the Storage tab. A private Blob store is recommended for `download-counts.json` because the browser does not need direct Blob access. Vercel provides the Blob credentials to the API functions through environment variables such as `BLOB_READ_WRITE_TOKEN`. If credentials are missing, tracking is skipped and the font download still continues.

For local API testing, pull the environment variables after connecting storage:

```powershell
npx vercel env pull .env.local
```

The API supports `BLOB_ACCESS=public` if you intentionally use a public Blob. Without that variable it writes and reads the counter as a private Blob.

## Regenerating Font Data

Install the font scanning dependency:

```powershell
pip install fonttools
```

Generate the full manifest:

```powershell
python scripts/scan_fonts.py
```

Generate the smaller preview manifest:

```powershell
python scripts/scan_fonts.py --minimal --output assets/data/fonts.min.json
```

## Installing Fonts

### Windows

Select `.ttf` files in File Explorer, right-click, and choose **Install**.

For a per-user PowerShell install:

```powershell
$dest = Join-Path $env:LOCALAPPDATA "Microsoft\Windows\Fonts"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Get-ChildItem -Path ".\fonts" -Recurse -Filter "*.ttf" |
  Copy-Item -Destination $dest -Force

Write-Host "Fonts copied. Restart your apps to see the new fonts."
```

### macOS

```bash
mkdir -p ~/Library/Fonts
find fonts -type f -name "*.ttf" -exec cp -f {} ~/Library/Fonts \;
```

### Linux

```bash
mkdir -p ~/.local/share/fonts
find fonts -type f -name "*.ttf" -exec cp -f {} ~/.local/share/fonts \;
fc-cache -f -v
```

## Web Usage

For quick prototypes, loading `.ttf` can work. In production, prefer `.woff2`, preload only the variants you need, and use long-lived cache headers.

```css
@font-face {
  font-family: "AsmaraSansGeez";
  src: url("fonts/Asmara/AsmaraSansGeez-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

body {
  font-family: "AsmaraSansGeez", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
```

## License

These fonts are free for personal, educational, community, commercial, print, design, app, and web projects. See `LICENSE.md` for the full terms.

## About FidelPE

FidelPE is a small toolkit for people who are not comfortable with digital technology. It focuses on making text clearer, offering helpful fonts, and keeping Tigrinya learning resources in one place.

Copyright FidelPE Asmara 2023 - 2026.

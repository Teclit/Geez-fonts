# Simple Guide: Install and Use Geez Fonts (Non-Technical)

This step-by-step guide is for non-technical users. It explains how to:

- Install the Geez fonts from this project
- Enable a Geez keyboard (Geez, Tigre, Tigrinya and Amharic) on your computer
- Use the fonts in Microsoft Word and (as an alternative) with Google Docs

---

## 0) Before You Start

You need:

- A computer running **Windows 10/11** or **macOS**
- The font folders included in this project (each city has its own folder), for example:
  - `Asmara/AsmaraSansGeez-Regular.ttf`
  - `Keren/...`, `Nakfa/...`, `Mendefera/...`, `Massawa/...`, etc.

You **do not need administrator rights** if you install fonts for your user account only.

---

## 1) Install the Fonts

### A. Windows (recommended: install for your user account)

1. Open **File Explorer** and go to the **project root** (where you see folders like `Asmara/`, `Keren/`, `Nakfa/`, etc.).
2. Open one city folder, for example: `Asmara`.
3. Press **Ctrl + A** to select all `.ttf` files.
4. Right-click the selection and choose:
   - **Install** (installs for your user only), or
   - **Install for all users** (requires admin; makes fonts available to everyone)
5. Repeat for each city folder you want (Asmara, Keren, Nakfa, Massawa, etc.), or use Windows search to find all `.ttf` files and install them in one pass.
6. Close and re-open your applications (Word, browser, etc.) so they can detect the new fonts.

Windows tips:
- On **Windows 11**, if you don’t see **Install**, click **Show more options** first.
- User-only installation is usually enough and does **not** require admin access.

### B. macOS

1. Open **Finder** and go to the **project root** (folders like `Asmara/`, `Keren/`, etc.).
2. Select one or more `.ttf` files (for example, all files inside `Asmara`).
3. Choose one method:
   - Double-click a `.ttf` file → **Font Book** opens → click **Install Font**, or
   - Open **Font Book** and **drag & drop** multiple `.ttf` files into it.
4. Close and re-open the apps where you want to use the fonts.

---

## 2) Enable a Geez Keyboard (to type ግእዝ)

Fonts control how text looks. To type ግእዝ characters, you must add an **input language/keyboard** (Tigrinya or Amharic) to your system.

### A. Windows — Add a Tigrinya/Amharic keyboard

1. Open **Settings**.
2. Go to **Time & language → Language & region**.
3. Click **Add a language**.
4. Search for **Tigrinya** or **Amharic** and add it.
5. Switch keyboards using:
   - **Win + Space**, or
   - the language icon (e.g., “ENG”) in the taskbar.

### B. macOS — Add a Tigrinya/Amharic keyboard

1. Open **System Settings**.
2. Go to **Keyboard → Text Input → Input Sources**.
3. Click **Add (+)**.
4. Search for **Amharic** or **Tigrinya** and add it.
5. Switch keyboards using:
   - the input menu in the menu bar, or
   - **Ctrl + Space** (if configured as a shortcut).

---

## 3) Use the Fonts in Microsoft Word (desktop app)

1. Open **Microsoft Word** (desktop app) and create a new document.
2. Make sure your **Geez keyboard** is active (Tigrinya/Amharic from step 2).
3. In the **Home** tab, open the **Font** dropdown.
4. Start typing the family name, for example:
   - `Asmara Sans Geez`
   - `Asmara Serif Geez`
   - `Keren`
   - `Nakfa`
   - `Massawa`
   - `Senafe`
   - `Tsorona`
5. Select the font family you want.
6. If available, choose a **specific style/weight** (Regular, Bold, Thin, SemiBold, etc.).
7. Start typing in Geez.

Notes (Word):
- If you **don’t see the fonts**, fully close Word and open it again.
- **Word Online (web)** may not use your locally installed fonts.
  - If you need the exact appearance for sharing, use **Word desktop → Export to PDF** and share the PDF.

---

## 4) Use Geez Text with Google Docs

Google Docs runs in the browser and usually **does not use fonts installed on your computer**. You cannot directly import these `.ttf` files into Google Docs.

Use one of these options:

### Option 1 — Use Google fonts (approximate rendering)

1. Open a document in **Google Docs**.
2. Open the **Font** menu.
3. Click **More fonts…**
4. Search for and add a font that supports Geez (availability can vary).
5. Select the font in the menu.
6. Make sure your **Geez keyboard** is active (Tigrinya/Amharic on your OS).
7. Type your text.

> The look may not match this project’s fonts exactly, but Geez characters should display.

### Option 2 — Keep the exact appearance (recommended for sharing)

1. Create your document in **Microsoft Word (desktop)** using the fonts from this project.
2. Export as PDF: **File → Save As / Export → PDF**.
3. Upload the PDF to **Google Drive** and share it.

Important:
- If you upload a Word document to Drive and open it with **Google Docs**, Google may substitute fonts and the layout can change.

---

## 5) Uninstall the Fonts (if needed)

### A. Windows

1. Open **Settings**.
2. Go to **Personalization → Fonts**.
3. Search for a family name (e.g., `Asmara`, `Keren`, etc.).
4. Open the font family page.
5. Click **Uninstall**.

### B. macOS

1. Open **Font Book**.
2. Find the family (Asmara, Keren, etc.).
3. Right-click (or Ctrl-click) the family.
4. Select **Remove**.

---

## 6) Troubleshooting (Quick Checklist)

### Fonts do not appear in Word (or other apps)
- Close the app completely and reopen it.
- If still missing, **restart your computer**.
- Confirm installation:
  - Windows: **Settings → Personalization → Fonts**

### You see Latin letters instead of ግእዝ
- Make sure your **Geez keyboard** (Tigrinya/Amharic) is selected — not English.
- Windows shortcut: **Win + Space**
- macOS: use the input menu in the menu bar (or your configured shortcut)

### Bold/Italic does not change anything
- Not all fonts have every style.
- In Word, select an actual font weight from the font family (SemiBold, Bold, Thin, etc.) if available, instead of relying on simulated bold/italic.

### Other people don’t see the correct font
- If they don’t have the fonts installed, their system will replace them.
- Share a **PDF** if you need identical rendering.

---

## 7) Where Are the Fonts in This Project?

- Fonts are grouped by **city folders at the project root**, for example:
  - `Asmara/AsmaraSansGeez-Regular.ttf`
  - `Keren/...`, `Nakfa/...`, `Mendefera/...`, `Massawa/...`, etc.
- For the list of cities, see `Eritrean-city.md`.
- For licensing and full documentation, see the project `README.md`.

---

## Metadata (Reference)

This information helps identify the fonts and usage terms. For the latest details, refer to `README.md`.

- `version` = "Geez font Version 1.0.0.0"
- `copyright` = "Geez font © FidelPE — Asmara, 24 May 2023. All rights reserved."
- `trademark` = "Geez font © FidelPE — Asmara"
- `manufacturer` = "FidelPE Projects"
- `designer` = "FidelPE Team"
- `license_description` = "This font may be used free of charge for personal or educational non-profit projects only. Any commercial use, redistribution, modification, or inclusion in products intended for sale requires prior written permission from FidelPE."
- `compatible_full` = "https://hdrimedia.com/"

Tip: move these metadata into a separate file (`METADATA.md` or `metadata.json`) to simplify maintenance.

---

## Acknowledgements

Thank you to the Geez and Eritrean community, contributors, and the typography toolchain ecosystem.  

For questions or attribution requests, see `README.md` and the **Support & Contact** section.

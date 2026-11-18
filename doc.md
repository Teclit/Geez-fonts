Add a separate, self-contained feature module called GeezEditor that gives users a Microsoft Word-style rich text editing experience. Everything must run entirely in the browser: no backend, no server calls, no external APIs.

Before coding:
1. Inspect the repo (stack, folder structure, routing, state management, test setup, conventions) and summarize how GeezEditor should fit in.
2. Propose a short plan and wait for my confirmation if any decision is ambiguous.

Requirements:
- Isolation: put everything in its own module (e.g. features/geez-editor) with a clear public API. No changes to existing features other than the route/entry point and navigation link.
- Browser-only architecture:
  - No server, database or network dependency. Documents never leave the user's machine.
  - Persistence: IndexedDB (autosave + manual save, document list, recovery after reload), with localStorage only for small settings.
  - Open/Save: File System Access API where supported, with a fallback to file input (open) and download (save) for other browsers.
  - Import .docx client-side (e.g. mammoth.js) and export .docx client-side (e.g. docx library).
  - Export PDF and print client-side (print stylesheet / jsPDF / html2pdf).
  - Heavy work (import/export) off the main thread in a Web Worker where practical.
  - Optional: make it an installable, offline-capable PWA (service worker caching the editor assets).
  - Lazy-load the editor and its libraries (dynamic import) so the rest of the app's bundle stays small.
- Core editing: bold, italic, underline, strikethrough, headings, font family/size, text color/highlight, alignment, bulleted/numbered lists, indentation, links, images (embedded locally, no upload), tables, undo/redo, find/replace, word/character count.
- Ge'ez (Ethiopic) support: correct rendering with a bundled Ge'ez-capable font (no CDN), a client-side Ge'ez keyboard/transliteration input option (Latin-to-Ge'ez mapping), and proper Unicode handling.
- UX: Word-like toolbar/ribbon, keyboard shortcuts (Ctrl+B/I/U/Z/Y/S, etc.), responsive, accessible (ARIA, keyboard navigation).
- Tech: use a proven editor library (e.g. TipTap/ProseMirror or Lexical), TypeScript, matching the project's existing lint and format rules. Handle SSR safely if using Next.js (client-only component, no window/document access on the server).
- Security: sanitize imported HTML/.docx content (e.g. DOMPurify) and set a sensible CSP; no eval.
- Quality: unit tests for core commands and the Ge'ez transliteration, a few browser e2e tests (Playwright) for the main flows (type, format, save, reload and recover, export), no regressions in the existing test suite.

Deliver:
- The implemented module, with a short README (usage, API, extension points, browser support and fallbacks).
- A summary of the files changed and the commands to run, build and test it.
- A list of anything left out or deferred.

Work in small commits, run the tests and linter after each step, and fix any failures before moving on.
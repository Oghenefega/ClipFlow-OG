# ClipFlow — Task Tracker

> Plan first. Track progress. Verify before marking done.

---

## Completed

- [x] Electron main process with IPC handlers, file watcher, OBS log parser
- [x] Preload bridge (`window.clipflow` API)
- [x] Sidebar navigation with 6 tabs
- [x] **RenameView** — file watcher, rename cards, history, manage tab
- [x] Fix file watcher — root-only watching, skip subfolders/renamed files
- [x] Add +Add Game button to Rename header
- [x] Wire up OBS log parser for game detection
- [x] **SettingsView** — game library CRUD, main game selector, watch folder, ignored processes, downloads
- [x] **QueueView** — schedule/tracker tabs, manual logging, publish now, weekly template editor
- [x] **ProjectsView** — Vizard project browser, clip review with approve/reject, inline title editing
- [x] **CaptionsView** — YouTube descriptions per game, platform caption templates
- [x] **UploadView** — file selection, R2 upload with progress
- [x] electron-store persistence for all settings/data
- [x] Vizard API integration — project import, clip mapping, deduplication
- [x] Source video filtering (duration-based heuristic)
- [x] Tracker source tagging (Vizard vs manual) with glow dots
- [x] Time picker redesign (hour + minute split dropdowns)
- [x] Scrollbar overflow fixes across all views
- [x] Clip download support with progress tracking
- [x] Fix AI hashtag generation — pass game hashtag explicitly to Anthropic prompt
- [x] Vizard title sync — smart merge with titleEdited flag + refresh button on ClipBrowser

## In Progress

- [ ] Phase out legacy clipping software — track Vizard vs manual usage in tracker

## Up Next

- [ ] Implement real platform API integrations:
  - [ ] YouTube Data API (Shorts upload)
  - [ ] TikTok API
  - [ ] Instagram Graph API (Reels)
  - [ ] Facebook Graph API (Reels)
- [ ] Publishing automation — 30-second stagger across 6 accounts
- [ ] Vizard publish integration (publish clips directly from Projects view)
- [ ] Auto-fill tracker when publishing via platform APIs
- [ ] Cloudflare R2 upload → Vizard project creation pipeline

## Current Sprint — 5 Issues (Pending Approval)

### Issue 1: AI title/caption selections lost on collapse/expand
**Root cause:** GenerationPanel state (suggestions, picks) lives in component-local `useState`. When the panel collapses (expand another clip), the component unmounts and all state is lost. The style history logging works (picks/rejections saved to `titleCaptionHistory` in electron-store), but the **per-clip UI state** (which suggestions were generated, which was picked) isn't preserved on the clip object.
**Fix:**
- [x] Store `suggestions`, `pickedTitle`, `pickedCaption`, and `sessionRejections` on the clip object itself via a new handler
- [x] When GenerationPanel mounts, initialize from `clip.aiState` if it exists → restores previous suggestions + picks
- [x] On pick/reject/generate, save the updated AI state back to the clip
- **Files:** `App.js` (new `handleUpdateClipAiState` handler), `ProjectsView.js` (GenerationPanel init + save logic)

### Issue 2: Search for clips within a project ✅
**Fix:**
- [x] Add a search input above the clip list in ClipBrowser (between TabBar and clip cards)
- [x] Filter clips by title match (case-insensitive substring)
- [x] Works across All/Pending/Approved tabs
- **Files:** `ProjectsView.js` (ClipBrowser component)

### Issue 3: Editable transcripts from Projects tab ✅
**Fix:**
- [x] When user clicks "Transcript" button, show transcript with Edit button
- [x] Save edits back to the clip object (`clip.transcript`)
- [x] Edited transcript feeds into AI title generation for better context
- **Files:** `modals.js` (TranscriptModal), `App.js` (persist transcript edits)

### Issue 4: Refresh button not updating clip data (duration, etc.) ✅
**Root cause:** The refresh button uses `setTimeout(600)` not tied to the actual API response. The async call may not complete in 600ms.
**Fix:**
- [x] Await the actual `onRefreshProject` promise, then set refreshing=false (no more setTimeout)
- **Files:** `ProjectsView.js` (refresh button onClick)

### Issue 5: Deselect a picked AI title/caption ✅
**Fix:**
- [x] Make the ✓ (pick) button toggle — clicking again on an already-picked title/caption deselects it
- [x] On deselect: revert clip title to original (pre-AI) title, clear the pick from clip.aiState
- [x] Visual: picked items show a highlighted ✓ that can be clicked to unpick
- **Files:** `ProjectsView.js` (GenerationPanel pick handlers)

---

## Known Issues

- None currently reported (all tracked above)

---

## Review Notes

_Add post-implementation review notes here after each major feature._

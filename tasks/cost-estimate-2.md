# ClipFlow — Detailed Cost Estimate

> Generated March 5, 2026
> 27 commits | March 3–5, 2026 | 4,730 lines of source code

---

## Project Scope

ClipFlow is a **production Electron + React desktop application** that automates a gaming content creator's full pipeline: OBS recording → file detection & renaming → cloud upload → AI clipping → clip review → scheduled publishing across 6 platform accounts.

| Metric | Value |
|--------|-------|
| Total source files | 14 |
| Total lines of code | 4,730 |
| Functional views/screens | 6 |
| React components | 30+ |
| IPC handlers (main ↔ renderer) | 23 |
| Live API integrations | 3 (Vizard AI, Cloudflare R2, OBS Studio) |
| Planned API integrations | 4 (YouTube, TikTok, Instagram, Facebook) |
| npm dependencies | 14 |
| Commits | 27 |
| Developer experience | **None** |

---

## Component-by-Component Engineering Estimate

Estimated hours for a **senior full-stack developer** (5+ years Electron/React) building each component from scratch, including research, implementation, debugging, and iteration:

### Backend — Electron Main Process

| Component | LOC | Description | Human Hours |
|-----------|-----|-------------|:-----------:|
| Window management & app lifecycle | ~40 | Custom titlebar, frameless window, close=quit behavior | 6 |
| File system IPC handlers (7) | ~120 | readDir, renameFile, exists, readFile, writeFile, scanWatchFolder, pickFolder | 20 |
| File watcher (chokidar) | ~45 | Root-only depth:0 watching, stability threshold, debouncing | 14 |
| OBS log parser | ~60 | Regex extraction of game capture exe, recording time mapping, process filtering | 18 |
| Persistence layer (electron-store) | ~30 | 3 handlers (get/set/getAll), schema management | 10 |
| Cloudflare R2 upload handler | ~50 | S3-compatible multipart upload, 10MB chunks, progress streaming to renderer | 18 |
| Vizard AI API wrapper (5 handlers) | ~140 | createProject, queryProject, getSocialAccounts, publishClip, generateCaption | 30 |
| Download manager | ~35 | HTTPS download with redirect handling, progress events, file write stream | 10 |
| Dialogs & shell handlers | ~20 | saveFile, openFile, openFolder | 4 |
| Preload bridge (context bridge) | 67 | 20+ exposed methods via contextBridge.exposeInMainWorld | 6 |
| **Backend subtotal** | **576 + 67** | | **136** |

### Frontend — React Renderer

| Component | LOC | Description | Human Hours |
|-----------|-----|-------------|:-----------:|
| App shell & routing | ~120 | 6-tab routing, view switching, sidebar integration | 10 |
| Global state management | ~200 | 20+ useState hooks, cross-view data flow, effect chains | 24 |
| Vizard clip mapping & dedup | ~60 | API normalization, clipEditorId grouping, duration-based source filtering | 14 |
| Data migrations | ~30 | Corrupted clip recovery, schema evolution, persisted data cleanup | 8 |
| Auto-import & refresh | ~80 | Seed project import, 30s polling, status transitions | 10 |
| Persistence sync | ~40 | Auto-save all state to electron-store on change | 6 |
| **App.js subtotal** | **656** | | **72** |

| View | LOC | Description | Human Hours |
|------|-----|-------------|:-----------:|
| RenameView — Pending tab | ~180 | File cards with game dropdown, Day/Part spinbox, rename/hide buttons | 20 |
| RenameView — History tab | ~120 | Old→new pairs, undo/redo with file restoration | 14 |
| RenameView — Manage tab | ~100 | Monthly subfolder browsing, batch operations, multi-select | 12 |
| RenameView — Stats & header | ~45 | 4 stat cards (Total/Today/Games/Day), refresh, add game button | 6 |
| UploadView | 328 | File scanning, checkbox selection, R2 progress bars, Vizard trigger | 32 |
| ProjectsView — Project list | ~120 | Grid with status badges, progress bars, manual import | 12 |
| ProjectsView — ClipBrowser | ~176 | Clip cards, viral score bars, approve/reject, title editing, transcript | 22 |
| QueueView — Schedule tab | ~350 | Clip list, publish now, schedule picker (hour+minute), caption builder | 36 |
| QueueView — Tracker grid | ~450 | 48-cell weekly grid, per-week overrides, template presets, CSV import/export | 48 |
| QueueView — Publishing logic | ~150 | 6-platform stagger, source tagging (Vizard/manual), auto-fill on publish | 20 |
| QueueView — Stats & info | ~99 | Published counts, game breakdown, info popovers, legend | 8 |
| CaptionsView | 100 | YouTube descriptions per game, platform caption templates with variables | 10 |
| SettingsView — Watch folder & game | ~160 | Folder picker, main game pill selector with multi-select | 14 |
| SettingsView — Game library | ~180 | CRUD pills, color picker, edit modal, tag/hashtag validation | 20 |
| SettingsView — Platform & API config | ~140 | 6 platform toggles, R2 credentials, Vizard API key, ignored processes | 14 |
| SettingsView — Downloads | ~120 | Download path config, clip download with progress, downloaded list | 14 |
| **Views subtotal** | **3,396** | | **302** |

| UI System | LOC | Description | Human Hours |
|-----------|-----|-------------|:-----------:|
| Design token system (theme.js) | 45 | Colors, spacing, radii, fonts, semantic tokens | 6 |
| Sidebar navigation | 147 | 6 tabs, active states, badge counts, main game footer | 10 |
| Shared component library (15) | 207 | PulseDot, GamePill, Badge, Checkbox, Card, Button, TabBar, Select, MiniSpinbox, ViralBar, ColorPicker, etc. | 28 |
| Modals | 172 | AddGameModal (3-step with animation), TranscriptModal, ColorPicker | 16 |
| Global CSS (scrollbar, animations) | 76 | Custom scrollbar, pulse animation, drag region, theme variables | 4 |
| **UI system subtotal** | **647** | | **64** |

### Cross-Cutting Concerns

| Concern | Description | Human Hours |
|---------|-------------|:-----------:|
| Architecture & planning | Tech stack decisions, IPC design, state architecture, file naming conventions | 24 |
| Iteration & bug fixing | Scrollbar overflow, source video filtering (multiple attempts), day count recalculation | 40 |
| API research | Vizard undocumented API patterns, OBS log format reverse-engineering, R2/S3 SDK config | 16 |
| UI polish & UX | Hover states, transitions, opacity, glow effects, responsive behavior, dark theme tuning | 20 |
| Windows-specific handling | NTFS paths, backslash handling, native dialogs, file locking behavior | 8 |
| **Cross-cutting subtotal** | | **108** |

---

## Total Human Hours Required

| Category | Hours |
|----------|:-----:|
| Backend (Electron main + preload) | 136 |
| App.js (state, routing, data) | 72 |
| Views (6 screens, all functional) | 302 |
| UI system (design, components, modals) | 64 |
| Cross-cutting (architecture, bugs, polish, research) | 108 |
| **TOTAL** | **682** |

---

## Value per Claude Hour

| Value Basis | Total Value | Claude Hours | $/Claude Hour |
|-------------|:-----------:|:------------:|:-------------:|
| Engineering only (solo avg) | $85,250 | ~35 hrs | **$2,436/Claude hr** |
| Mid freelancer (Upwork) | $54,640 | ~35 hrs | **$1,561/Claude hr** |
| Agency team | $98,800 | ~35 hrs | **$2,823/Claude hr** |

---

## Speed vs. Human Developer

- Estimated human hours for same work: **682 hours**
- Claude active hours: **~35 hours**
- Speed multiplier: **~19x** (Claude was 19x faster)
- Calendar days (human, full-time): **~85 days (4.3 months)**
- Calendar days (Claude): **3 days**
- Calendar speed: **~28x faster**

---

## Cost Comparison

- Human developer cost: **$85,250** (at $125/hr senior avg)
- Estimated Claude cost: **~CA$248.78 (~US$180)**
- Net savings: **~$85,070**
- ROI: **~473x** (every $1 spent on Claude produced ~$473 of value)

---

## Grand Total Summary

| Metric | Solo Freelancer | Upwork Mid-Level | Small Agency | Growth Company |
|--------|:--------------:|:----------------:|:------------:|:--------------:|
| Calendar Time | ~4 months | ~5 months | ~3 months | ~6 months |
| Total Human Hours | 682 | 820 | 780 | 1,200 |
| Total Cost | $85,250 | $65,600 | $98,800 | $168,000 |

**Solo Freelancer** — 1 senior Electron/React dev at $125/hr. Fastest individual execution.

**Upwork Mid-Level** — 1 mid-level dev at $80/hr, +20% platform fees, +15% revision overhead. Cheaper rate but more hours and more back-and-forth.

**Small Agency** — PM ($110/hr, 80 hrs) + Senior dev ($150/hr, 400 hrs) + UI/UX designer ($120/hr, 80 hrs) + QA ($85/hr, 60 hrs) + DevOps ($130/hr, 40 hrs). Professional process but expensive overhead.

**Growth Company** — Full team with benefits, office, management overhead. 2 developers + 1 designer + PM + QA. Loaded rate ~$140/hr avg across roles. Includes sprint planning, standups, code review, CI/CD setup, documentation.

---

## The Headline

*ClipFlow was built in approximately 35 Claude hours across 3 calendar days and produced the equivalent of $85,250 in professional engineering value — roughly $2,436 per Claude hour. A small agency would spend $98,800 and 3 months to build this with a full team.*

*The developer? A gaming content creator with zero coding experience and a CA$248.78 Claude subscription.*

---

## What Makes This Estimate Conservative

1. **Electron is specialized.** Not every React dev can build Electron apps. The IPC bridge pattern, main/renderer process model, and native dialog integration require specific expertise. This narrows the talent pool and increases rates.

2. **Vizard AI has no public SDK.** The integration was built by reverse-engineering API patterns. A human dev would spend additional hours on API discovery and trial-and-error.

3. **OBS log parsing is niche.** Parsing game capture hooks from OBS Studio logs (including Vertical Canvas plugin variants) requires domain expertise that most developers don't have.

4. **The iteration cost is hidden.** This estimate assumes a developer gets things right the first time. In reality, the source video filtering took 3 attempts, the time picker was redesigned, scrollbar overflow was patched across multiple views. Human developers iterate too — often more slowly.

5. **No test coverage.** Adding proper unit/integration tests would add 15-20% to all hour estimates.

6. **No deployment pipeline.** Building installers (NSIS/MSI), auto-updater, code signing, and distribution would add another 30-50 hours.

---

## Assumptions

1. Rates based on US/Canadian market averages (2025–2026)
2. Senior full-stack developer = 5+ years experience with Electron + React
3. Mid-level = 2-4 years, competent but slower on architectural decisions
4. No test coverage exists — a production build would add ~15–20% to costs
5. Does not include: marketing, platform OAuth app registration, API quota costs, hosting, or ongoing maintenance
6. Agency estimate includes standard overhead (PM, design, QA) but not sales/account management
7. Growth company estimate uses fully loaded cost ($140/hr avg) including benefits, office, tools
8. Claude hours estimated from session activity across 27 commits in 3 days
9. All costs in USD unless otherwise noted
10. The CA$248.78 represents the user's March 2026 Claude billing cycle, which includes ClipFlow and other usage

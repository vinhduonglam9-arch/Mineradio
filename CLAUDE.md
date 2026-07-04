# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                # Install dependencies (includes electron, electron-builder)
npm start                  # Launch the app via Electron (starts local server + opens window)
npm run dev                # Run only the local API server (port 3000) without Electron
npm run build:win          # Build Windows NSIS installer (output in dist/)
npm run build:win:dir      # Build unpacked Windows app (output in dist/win-unpacked/)
node --check server.js     # Syntax-check the server
git diff --check           # Check for whitespace errors
```

There is no test suite, no linter, and no TypeScript compilation step.

## Architecture

Mineradio is a Windows Electron desktop music player. The app runs a local Node.js HTTP server (`server.js`) on `127.0.0.1:3000` that the Electron renderer loads as its UI. There are three main code layers:

### server.js — Local API & music proxy

The backend is a single Node.js HTTP server that provides:

- **Netease Cloud Music API proxy** — uses the `NeteaseCloudMusicApi` npm package for search, song URLs, lyrics, playlists, login (QR code), user data, comments, etc. Login cookies persist to `.cookie`.
- **QQ Music API proxy** — custom HTTP client to QQ Music endpoints for search, song details, playback URLs, login. Cookies persist to `.qq-cookie`. QQ playback requires specific keys (`qm_keyst`, `qqmusic_key`, etc.), not just web login cookies.
- **Weather radio** — fetches location from `ip-api.com`, weather from `open-meteo.com`, generates mood-based playlists.
- **Update system** — checks GitHub Releases for new versions, supports full installer downloads and lightweight patch JSON files. Update config is in `package.json` → `mineradio.update`.
- **Local media streaming** — uses `fluent-ffmpeg` + `ffmpeg-static` to transcode non-browser-native formats (MKV, AVI, FLAC, APE, etc.) via `/api/stream-local-media`.
- **Audio caching** — beatmap cache directory defaults to `D:\MineradioCache\beatmaps`.

### desktop/ — Electron main process

- `main.js` — Window management (frameless, transparent, single-instance), login windows (Netease + QQ), desktop lyrics overlay, wallpaper mode (WorkerW attachment), global hotkeys, IPC handlers for native dialogs, file export/import, app restart, update installer launch.
- `preload.js` — Context bridge exposing IPC methods to the renderer.
- `overlay-preload.js` — Context bridge for overlay windows (desktop lyrics, wallpaper).

### public/index.html — Frontend

This is a **very large single file** containing all UI, CSS, and frontend JavaScript. It includes:

- Home page with weather radio, recommendations, playlists
- Search interface
- Player controls with SVG glass texture (see `docs/GLASS_SVG_TEXTURE.md` — this is a carefully tuned visual asset, do not casually modify)
- Three.js 3D visualization: particle systems (cover art particles), 3D playlist shelf, skull point-cloud preset ("安魂"), cinema beat visual system
- Lyric stage with 3D positioning bound to particle world axes
- Visual preset system with persistence (user FX archives)
- Settings: DIY visual console, performance profiles, 3D shelf controls

The file uses inline `<script>` blocks (no bundler). Before modifying, use `rg`/Grep to locate the relevant functions and state — avoid rewriting large sections.

### Other files

- `dj-analyzer.js` — Server-side audio analysis (BPM, energy, onset detection) for DJ/podcast tracks. Uses WebAudio-style DSP with biquad filters.
- `build/` — NSIS installer scripts (`installer.nsh`), icons (`.ico`), bitmaps for installer UI. Installer style: Chinese minimal, white/black with `#3257F7` blue accents (see `docs/INSTALLER_STYLE.md`).
- `public/vendor/` — Vendored libraries: Three.js r128, GSAP, music-tempo.
- `public/default-user-fx-archive.json` — Default visual preset snapshot applied on first launch.

## Key conventions

- The user communicates in Chinese. Be direct and action-oriented, not wordy.
- **Never rewrite large blocks of `public/index.html`** — use surgical edits guided by grep.
- The player's SVG glass texture (`#mineradio-control-glass-filter`) is a "golden version" — do not replace with plain blur/transparency.
- Do not modify the cinema beat visual system unless explicitly asked.
- Do not revert the 3D playlist shelf to its old buggy state (forced galaxy preset switch, occlusion, scroll jank, Home click-through).
- Performance optimizations must not sacrifice visual quality or frame stability.
- Never upload/push to GitHub unless explicitly asked. When doing a release, run the full checklist: version bumps, changelog, syntax checks, `npm run build:win`, security scan.
- The `.cookie`, `.qq-cookie`, `updates/`, `backups/`, and `dist/` directories are git-ignored and contain local state.

## Release workflow

1. Update version in `package.json` and `package-lock.json`
2. Update `CHANGELOG.md` (Chinese at the top)
3. Run `git diff --check` and `node --check server.js`
4. Run `npm run build:win` — produces `dist/Mineradio-{version}-Setup.exe`, `.blockmap`, and `latest.yml`
5. Upload to GitHub Release with patch JSON files for the last 4 versions (if applicable)
6. For security/clean-install releases (like v1.1.0), do NOT upload `latest.yml` and set `--latest=false` on the GitHub Release to prevent old clients from auto-updating

Update patches use the naming convention `Mineradio-{from}-to-{to}.patch.json` and are scoped to `public/`, `desktop/`, `build/` directories plus root JS/JSON files (max 12 MB per patch).

When GitHub CLI needs a proxy, use `127.0.0.1:10808` — never the old `127.0.0.1:26001` port.

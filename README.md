# Sonora — Modern Free Music Streaming PWA

**Sonora** is a free, ad-free, high-fidelity music streaming Progressive Web Application (PWA) built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

Designed with an original obsidian dark and slate light aesthetic, Sonora provides a persistent audio engine, lockscreen media controls, seamless playlist management, and responsive layouts for mobile, tablet, desktop, and standalone app installs.

---

## ✨ Features

- **Global Persistent Audio Engine**: Audio playback continues seamlessly while navigating between pages (`/`, `/search`, `/artist/:id`, `/album/:id`, `/playlist/:id`, `/library`, `/settings`).
- **Rich Music Discovery**: Trending hits, new releases, mood stations (Lo-Fi, Synthwave, Electronic, Ambient, Pop, Hip-Hop), and curated playlists.
- **Fast Debounced Search**: Search for songs, artists, albums, and playlists with instant filter pills and persistent search history.
- **Local Library (Zero Database)**:
  - Liked Songs collection
  - Custom Playlist Builder (Create, Rename, Delete, Reorder, Add/Remove tracks)
  - Recently Played listening history (capped at 100 tracks)
  - Complete JSON Backup Export & Restore
- **Mobile First & Responsive**:
  - Desktop: Sidebar + Top bar + Persistent Bottom Player with visualizer & Up Next drawer.
  - Mobile: Bottom tab navigation + Floating Mini Player + Immersive Full-Screen Player with swipe-down dismiss and queue management.
- **Full Progressive Web App (PWA)**:
  - Installable on iOS (Safari Add to Home Screen), Android, Windows, and macOS.
  - Service Worker shell caching with offline fallback indicator.
  - Media Session API integration for lockscreen metadata and system media keys.
  - Desktop keyboard shortcuts (`Space`, `ArrowLeft/Right`, `M`, `L`, `J/K`).
- **Bespoke Theme System**: Dark (Obsidian), Light (Clean Slate), and System default preference without flash on load.
- **Privacy First**: Zero login/signup, zero trackers, zero external database dependencies.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Storage**: LocalStorage with type-safe wrapper
- **PWA**: `vite-plugin-pwa`, Web App Manifest, Service Worker
- **Audio**: HTML5 Audio + MediaSession API

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/sonora-music.git
cd sonora-music
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## ☁️ 1-Click Vercel Deployment

Deploying Sonora to Vercel requires **zero backend servers and zero database setup**:

1. Push this repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. Keep default settings (Framework Preset: **Vite**, Root Directory: `./`).
4. Click **Deploy**.

The bundled `vercel.json` ensures all client-side routes (`/search`, `/library`, etc.) resolve seamlessly.

---

## ⌨️ Desktop Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause playback |
| `Arrow Right` | Seek forward 5 seconds |
| `Arrow Left` | Seek backward 5 seconds |
| `M` | Mute / Unmute audio |
| `L` | Toggle Favorite for current track |
| `K` | Skip to Next track |
| `J` | Skip to Previous track |

---

## 📄 License

MIT License — free for personal and educational use.

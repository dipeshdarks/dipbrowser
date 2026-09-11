# DipBrowser

**Fast. Secure. Yours.**

DipBrowser is a modern, privacy-focused web browser built with Electron, React, and TypeScript. Features built-in ad blocking, workspace management, and an upcoming AI assistant (DipAI).

## Features

- **Tab Management** — Multi-tab browsing with workspace organization
- **Bookmarks** — Save and organize your favorite sites
- **History** — Track your browsing history
- **Downloads** — Built-in download manager
- **Shields** — Ad and tracker blocking powered by filter lists
- **Reader Mode** — Clean, distraction-free reading
- **Workspaces** — Organize tabs by project or context
- **Fingerprint Protection** — Enhanced privacy against fingerprinting
- **Keyboard Shortcuts** — Navigate faster with built-in shortcuts

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Electron |
| Frontend | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Database | SQLite (better-sqlite3) |
| Build | Electron Vite |
| Packaging | Electron Builder |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/dipeshdarks/dipbrowser.git
cd dipbrowser

# Install dependencies
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
# Windows
pnpm package

# macOS
pnpm package:mac

# Linux
pnpm package:linux
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + T` | New tab |
| `Ctrl + W` | Close tab |
| `Ctrl + Tab` | Next tab |
| `Ctrl + Shift + Tab` | Previous tab |
| `Ctrl + L` | Focus address bar |
| `F5` | Reload page |
| `F12` | Open DevTools |
| `Ctrl + B` | Toggle sidebar |

## Project Structure

```
dipbrowser/
├── src/
│   ├── main/              # Electron main process
│   │   ├── database/      # SQLite database
│   │   ├── ipc/           # IPC handlers
│   │   ├── scripts/       # Browser scripts
│   │   └── services/      # Core services
│   ├── preload/           # Preload scripts
│   ├── renderer/          # React frontend
│   │   ├── components/    # UI components
│   │   ├── stores/        # Zustand stores
│   │   └── lib/           # Utilities
│   └── shared/            # Shared types/constants
├── docs/                  # Documentation
└── images/                # Assets
```

## Upcoming: DipAI

DipBrowser will include **DipAI** — a built-in AI assistant that understands web pages, assists with research, and automates browser workflows while keeping your data private.

### DipAI Features (Planned)

- Page summarization
- Content explanation
- Translation (100+ languages)
- Research assistant
- Coding assistant
- Browser automation
- AI-powered search

## License

MIT

## Author

DipBrowser Team

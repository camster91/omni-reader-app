# Omni Reader

A personal news digest reader — one page, all your feeds. Curated articles across categories delivered as a static JSON digest and rendered in a fast, keyboard-driven interface.

**⚠️ Early Stage —** This project is in active early development. Features and structure may change significantly.

**Live:** [camster91.github.io/omni-reader-app](https://camster91.github.io/omni-reader-app)

## What It Does

Omni Reader loads a `digest.json` file containing categorized article links (World, Tech, AI/ML, Dev, Social, Freelance) and displays them in a clean, scrollable single-page app.

### Current Features

- **Multi-category feed** — Articles grouped by category with color-coded sections. Toggle sources on/off and adjust max items per source.
- **Mark as read/unread** — Tap to mark articles read. Unread count in the document title. "Mark all" and "Reset all" actions.
- **Bookmarks** — Save articles for later. Filter to show only saved items.
- **Quality filtering** — Hide clickbait articles. Filter by minimum quality score.
- **Profile-based ranking** — Set preferred topics and interests. Articles matching your profile float to the top.
- **Search & keyword drill-down** — Full-text search across titles and summaries. Click trending keywords to filter.
- **Keyboard shortcuts** — `A` to mark all visible as read, `R` to reset, `S` to toggle settings.
- **Pull-to-refresh** — On mobile, pull down to reload.
- **Scroll position restore** — Remembers where you were when switching tabs or returning to the page.
- **Article thumbnails** — OpenGraph image previews with favicon fallback.
- **PWA support** — Service worker, web manifest, and offline-ready design.
- **Share** — Native Web Share API or clipboard copy fallback.

### What's Not Yet Built

- No backend — digest data is generated externally by a Python script (`~/.hermes/scripts/omni-reader.py`) and committed as a static JSON file.
- No user accounts or persistence beyond `localStorage`.
- No real-time updates — the digest is refreshed via scheduled rebuilds.
- Reader mode / full article extraction is a stub (UI elements exist but are not wired up).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, static export) |
| UI | React 19, Tailwind CSS 4 |
| Data | Static JSON (`public/digest.json`) |
| Build | `next build` → static HTML export |
| Deploy | GitHub Pages via GitHub Actions |

Minimal dependencies — just `next`, `react`, and `react-dom`.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A `public/digest.json` file (see [Data Format](#data-format))

### Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Static Export

```bash
npm run build
# Output in dist/
```

### Data Format

The app expects `public/digest.json` in this shape:

```json
{
  "News": [
    {
      "title": "Article headline",
      "link": "https://example.com/article",
      "source": "Example News",
      "summary": "Brief summary...",
      "quality": 0.8,
      "clickbait": 0.1,
      "importance": 0.5,
      "sentiment": "neutral",
      "topics": ["Canada", "Climate"],
      "interests": ["money", "privacy"],
      "fresh": true
    }
  ],
  "Tech": [...],
  "AI/ML": [...],
  "Dev": [...],
  "Social": [...],
  "Freelance": [...],
  "_meta": {
    "trending_keywords": ["AI", "Apple", "Elections"]
  }
}
```

## Deployment

The site is deployed to GitHub Pages. The `deploy.sh` script regenerates the digest and pushes to `main`, where GitHub Actions builds and deploys:

```bash
./deploy.sh
```

GitHub Actions workflow: `.github/workflows/deploy.yml`

## Project Structure

```
├── app/
│   ├── page.tsx           # Main single-page app (all components inline)
│   ├── layout.tsx         # Root layout (minimal)
│   └── globals.css        # Tailwind imports
├── lib/
│   └── types.ts           # TypeScript type definitions
├── public/
│   ├── digest.json        # Article digest data (committed, updated via deploy.sh)
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── deploy.sh              # Digest regeneration + git push
└── .github/workflows/
    └── deploy.yml         # GitHub Actions CI/CD
```

## License

See [LICENSE](./LICENSE).

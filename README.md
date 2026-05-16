# Personal site

Clean, professional personal website scaffold (projects + writing + reading list) built with **Astro**.

## Local dev

```bash
npm install
npm run dev
```

Astro will print a local URL (usually http://localhost:4321).

## Adding content (easy mode)

### Projects
Add a Markdown file in:
- `src/content/projects/<slug>.md`

### Writing
Add a Markdown file in:
- `src/content/writing/YYYY-MM-DD-title.md`

### Papers / reading notes
Add a Markdown file in:
- `src/content/papers/<slug>.md`

## Build

```bash
npm run build
npm run preview
```

## Deploy

Recommended: Cloudflare Pages or Vercel.

- Build command: `npm run build`
- Output directory: `dist/`

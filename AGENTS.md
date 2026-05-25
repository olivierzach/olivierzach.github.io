# Repository Guidelines

## Project Structure & Module Organization

This is an Astro personal site. Route components live in `src/pages`, with dynamic content routes such as `src/pages/projects/[...slug].astro` and `src/pages/writing/[...slug].astro`. Shared page framing is in `src/layouts/Base.astro`, while site-wide CSS is in `src/styles/global.css` and `public/styles/global.css`.

Content collections live under `src/content`: `projects`, `writing`, `papers`, and `books`. Collection schemas are defined in `src/content.config.ts`; update that file when adding new frontmatter fields. Static assets are stored in `public`, including generated art, book covers, paper PDFs, and thumbnails. Utility scripts for fetching or generating assets are in `scripts`.

## Build, Test, and Development Commands

- `npm install`: install dependencies. Node `>=22.12.0` is required.
- `npm run dev`: start the local Astro dev server.
- `npm run build`: produce the production site in `dist/`.
- `npm run preview`: preview the built site locally.
- `npm run covers:books`: fetch all configured book covers.
- `npm run covers:opt`: optimize cover images into `public/covers/_optimized`.
- `npm run fetch:papers`: fetch paper assets.
- `npm run thumbs:papers`: generate paper thumbnails with Poppler tooling.
- `npm run art:gen`: regenerate SVG art assets.

There is no dedicated test script currently; use `npm run build` as the main validation step.

## Coding Style & Naming Conventions

Use the existing Astro and TypeScript style: two-space indentation, single quotes in JS/TS frontmatter, and semicolons. Keep route components focused on rendering and data loading through Astro content collections.

Name content files by stable slugs, for example `src/content/projects/telemetry-retention-ml.md`. Writing posts should use the existing dated pattern: `src/content/writing/YYYY-MM-DD-title.md`. Public asset filenames should be lowercase and hyphenated.

## Testing Guidelines

Before submitting changes, run `npm run build` and fix schema, routing, or asset errors. For content-only edits, verify frontmatter matches the schema in `src/content.config.ts`. For visual changes, run `npm run dev` and inspect the affected pages at desktop and mobile widths.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `Prevent horizontal overflow on influences page` and `Add ML/statistics book influences with covers`. Follow that pattern: describe the user-visible change in one line.

Pull requests should include a concise description, affected pages or content collections, validation performed (`npm run build`, screenshots when visual), and any asset-generation commands used. Link related issues when applicable.


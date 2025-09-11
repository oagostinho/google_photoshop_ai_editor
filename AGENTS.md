# Repository Guidelines

## Project Structure & Module Organization
- `pages/`: Next.js pages and API routes. API endpoints live under `pages/api/` (e.g., `pages/api/generate.js`).
- `components/`: Reusable React components (one component per file).
- `lib/`: Small utilities (e.g., file prep, seeds).
- `public/`: Static assets (icons, images).
- `styles/`: Global Tailwind CSS.
- Config: `next.config.js`, `tailwind.config.js`, `.eslintrc.json`.

## Build, Test, and Development Commands
- `npm run dev` — Run the Next.js dev server on `http://localhost:3000`.
- `npm run build` — Production build.
- `npm start` — Start the production server (after build).
- `npm run lint` — Lint with ESLint.
- `npm test` — Lint then build (no unit tests yet).

## Coding Style & Naming Conventions
- Language: React + Next.js (Pages Router), ES2020+.
- Indentation: 2 spaces; avoid semicolons unless required by tooling.
- Files: kebab-case for component files (e.g., `prompt-form.js`); default export `PascalCase` React components (e.g., `export default function PromptForm() {}`).
- Modules: co-locate small helpers in `lib/`; keep files focused and under ~200 lines when reasonable.
- Linting: ESLint extends `next/core-web-vitals`. Run `npm run lint` before PRs.
- Styles: Tailwind CSS classes in JSX; put global styles in `styles/globals.css`.

## Testing Guidelines
- Current: No formal unit tests. `npm test` validates build + lint.
- Add tests near source or under `__tests__/` mirroring paths (e.g., `components/__tests__/messages.test.js`).
- Prefer React Testing Library for components and minimal mocks.
- Aim for coverage on utilities in `lib/` and critical UI flows.

## Commit & Pull Request Guidelines
- Commits: concise imperative subject (≤72 chars), body for rationale.
  - Example: `feat(api): add google image generation endpoint`
- PRs must include:
  - Clear description, motivation, and scope.
  - Before/after screenshots or short clip for UI changes.
  - Linked issue (if applicable) and notes on trade-offs.
  - Updated docs (`AGENTS.md`, `CHANGES.md`, or comments) when behavior changes.

## Security & Configuration Tips
- Secrets: never commit real keys. Use `.env.local`; reference `.env.example`.
- Google AI: server route `pages/api/generate.js` accepts `x-google-api-key`; client stores `googleApiKey` in `localStorage` for local use.
- Legacy Replicate endpoints remain under `pages/api/predictions/`; avoid regressions when editing.
- Node 18+ recommended; keep dependencies minimal and audited.

## Architecture Notes
- Next.js Pages Router with API routes; image generation handled server-side via the AI SDK and Google provider. Prefer small, composable components in `components/` and pure helpers in `lib/`.

## Important Notes
ALWAYS READ and UPDATE properly the file CHANGES.MD


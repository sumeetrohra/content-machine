# content-machine

A content creation tool that works with RSS feeds to help users generate and publish content on social media.

Subscribe to RSS sources, pull in articles you care about, and turn them into ready-to-post content for your social channels — all from one place.

## Features

- Connect and manage RSS feeds as content sources
- Generate social-media-ready posts from feed items
- Streamlined workflow for drafting, editing, and publishing

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Zustand for state management
- React Hook Form + Zod for forms and validation
- React Router DOM v7
- i18next for internationalization
- Sentry for error tracking
- Vitest + React Testing Library (unit) and Playwright (E2E)

## Getting Started

Install dependencies:

```bash
yarn install
```

Start the dev server:

```bash
yarn dev
```

## Scripts

- `yarn dev` — Start the dev server
- `yarn build` — Production build
- `yarn lint` — Run ESLint
- `yarn format` — Format with Prettier
- `yarn typecheck` — TypeScript type check
- `yarn test` — Run Vitest unit tests
- `yarn e2e` — Run Playwright E2E tests
- `yarn generate:api` — Generate API hooks from schema

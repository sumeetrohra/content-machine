# content-machine

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router DOM v7
- **Internationalization:** i18next + react-i18next
- **Date/Time:** dayjs (via datetime-utils wrapper)
- **Error Tracking:** Sentry
- **Testing:** Vitest + React Testing Library (unit) + Playwright (E2E)
- **Linting:** ESLint flat config (strict) + Prettier
- **Git Hooks:** Husky + lint-staged
- **React Compiler:** Enabled (auto-memoization — no manual memo/useMemo/useCallback)

## Key Conventions

- See `.cursor/rules/` for detailed rules on each topic
- All user-facing strings must use i18n (`useTranslation()`)
- No `useEffect` for data fetching — use dedicated async hooks/services
- No React Context for state — use Zustand
- No `console.log` — use Sentry for error tracking
- No `new Date()` or direct `dayjs()` — use `@/shared/utils/datetime-utils`
- No `React.memo()`, `useMemo()`, `useCallback()` — React Compiler handles this
- Import Sentry from `@/modules/sentry`, never from `@sentry/react` directly
- TypeScript naming: `T` prefix for types, `I` for interfaces, `E` for enums
- Path alias: `@/` maps to `./src/`

## Project Structure

```
src/
├── components/ui/       # shadcn/ui components
├── e2e/                 # Playwright E2E tests
├── hooks/               # Custom hooks (use-kebab-case.ts)
├── generated/           # Auto-generated API hooks (DO NOT EDIT)
├── layouts/             # Layout components
├── lib/                 # Utilities (cn())
├── modules/sentry/      # Sentry wrapper module
├── pages/               # Route pages
├── providers/           # Context/provider components
├── routes/              # Router configuration
├── shared/
│   ├── constants/       # App constants
│   ├── i18n/            # i18next config + locales
│   ├── stores/          # Zustand stores (*.store.ts)
│   ├── types/           # Shared TypeScript types
│   └── utils/           # Utility functions
└── test/                # Test setup
```

## Scripts

- `yarn dev` — Start dev server
- `yarn build` — Production build
- `yarn lint` — Run ESLint
- `yarn format` — Format with Prettier
- `yarn typecheck` — TypeScript type check
- `yarn test` — Run Vitest
- `yarn e2e` — Run Playwright E2E tests
- `yarn generate:api` — Generate API hooks from schema (when API generator is enabled)

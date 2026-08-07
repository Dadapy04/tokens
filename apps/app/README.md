# @tokens/app

Authenticated dashboard for Tokens projects, API keys, and usage (port 3001).

## Structure

- `src/app/(dashboard)/` — dashboard routes. The route-group layout mounts the
  heavy client providers (Convex websocket, motion, sonner, nuqs, tooltips) and
  `TopNav`. Auth routes (`/sign-in`, `/sign-up`) live outside the group and load
  none of it.
- `src/contexts/project-api-keys.tsx` — single source of truth for API-key
  state (subscription + fresh-key reveal flow). Use `useProjectApiKeys()`
  instead of threading key props.

## Conventions

### Icons

Two icon libraries are in use — pick by role, and never add the same glyph
from both:

- **`symbols-react`** — brand/filled SF-symbol-style glyphs that are part of
  the product look (logos, filled status icons, decorative marks).
- **`lucide-react`** — generic stroke UI icons (copy, logout, sort arrows,
  chevrons).

### URL state

Dashboard tab state uses nuqs with shallow routing (no server round-trip per
tab switch). If a server component ever needs to read `searchParams.tab`,
restore `shallow: false` in `use-dashboard-tab.ts`.

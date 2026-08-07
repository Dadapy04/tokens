# Tokens

Tokens is the public source repository for the Tokens website, API, docs, and first-party operational apps.

This repository is published as a reference codebase for transparency and inspection. The hosted Tokens product surfaces are the primary supported way to use Tokens. Turnkey self-hosting, production deployment support, and active community operations are not currently offered as part of this repository.

## What Is Supported

Supported:

- Browsing the codebase and API implementation details
- Building the monorepo locally
- Inspecting the public API and docs behavior
- Best-effort issue triage and PR review

Not promised:

- Turnkey self-hosting
- Production deployment guidance for third parties
- Maintainer response SLAs
- Full support for internal or operational apps outside the hosted Tokens environment

## Repo Surfaces

| Surface      | Role                                                | Public posture                                              |
| ------------ | --------------------------------------------------- | ----------------------------------------------------------- |
| `apps/web`         | Public product website and lightweight proxy routes | Hosted-first product surface                                |
| `apps/docs`        | Public API documentation site                       | Hosted-first product surface                                |
| `apps/api`         | Tokens platform API (`/v1/...`) and helper routes   | Public API implementation                                   |
| `apps/app`         | First-party dashboard for API keys and usage        | Reference app for authenticated users                       |
| `apps/admin`       | Operational tooling for curated asset management    | Maintainer-only surface, not anonymous public functionality |
| `apps/cloudrun-*`  | Backend services (assets, prices, usage, admin)     | Cloud Run services behind the API                           |
| `packages/*`       | Shared packages and UI primitives                   | Internal/shared monorepo packages                           |
| `db/`              | SQL schema and ordered migrations                   | Postgres (Cloud SQL) schema                                 |
| `terraform/`       | Infrastructure-as-code for staging/production       | Reference infra definitions                                 |
| `scripts`          | Verification, seeding, and maintenance utilities    | Maintainer tooling                                          |

## Architecture

The `apps/web`, `apps/app`, and `apps/admin` Next.js frontends talk to `apps/api`
(the public `/v1/...` platform API). `apps/api` authenticates callers (Clerk for
sessions, hashed platform API keys for programmatic access) and proxies to the
Cloud Run backend services in `apps/cloudrun-*` (assets, prices, usage, admin),
which own data access to Postgres (Cloud SQL), ClickHouse, and Upstash Redis.
Schema lives in `db/`; infrastructure in `terraform/`.

## Tech Stack

- Next.js 16 App Router
- Bun workspaces + Turborepo
- TypeScript
- Tailwind CSS 4
- Clerk (auth)
- Postgres (Cloud SQL) + ClickHouse + Upstash Redis
- Cloud Run (backend services)

## Getting Started

1. Install dependencies.

```bash
bun install
```

2. Create local env files from the checked-in templates.

```bash
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/app/.env.example apps/app/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/web/.env.example apps/web/.env.local
```

3. Fill in the credentials and service URLs required for the apps you plan to run.
4. Apply the database schema (Postgres) if you are running services that need it.

```bash
DATABASE_URL=postgres://... ./db/apply.sh
```

5. Start the workspace dev servers.

```bash
bun dev
```

Common local ports:

- `web`: `http://localhost:3000`
- `app`: `http://localhost:3001`
- `api`: `http://localhost:3002`
- `docs`: `http://localhost:3003`
- `admin`: `http://localhost:3004`

## Common Commands

```bash
bun dev
bun run build
bun run lint
bun run check:repo-hygiene
bun run verify:api-health-routes
bun run audit:deps
```

## Verification And Release Gates

- Read [TESTING.md](TESTING.md) for the current automated and manual verification bar.
- Read [RELEASING.md](RELEASING.md) before making the repository public or cutting a public release.
- Review [SECURITY.md](SECURITY.md) before reporting vulnerabilities.

## Security And OSS Hygiene

- Local env files such as `.env.local` are ignored and must never be committed.
- Assistant/tooling artifacts such as `.claude`, `.cursor`, and `.agents` are not part of the public source tree.
- Git history must be reviewed before publication; current-tree hygiene alone is not sufficient.

## License

MIT. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for vendored-asset posture.

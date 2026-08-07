# Testing

This repository is published as a reference codebase, so the verification bar is intentionally explicit rather than implied.

## Automated Checks

The default CI and local pre-release checks are:

```bash
bun run check:repo-hygiene
bun run verify:api-health-routes
bun run lint
bun run build
bun run audit:deps
```

What these cover:

- `check:repo-hygiene`: blocks tracked secret-bearing env files, assistant artifacts, and junk files such as `.DS_Store`
- `verify:api-health-routes`: smoke-checks the public health route handlers and their cache/request-id behavior
- `lint`: static analysis across the monorepo
- `build`: production builds for the workspaces in scope
- `audit:deps`: dependency advisory scan

## Manual Or Environment-Dependent Checks

Some verification requires real credentials, a seeded data environment, or a deployed API surface. Those checks are not part of the default public CI baseline.

Useful maintainers' scripts:

```bash
bun run verify:assets-api-v1
node scripts/smoke-assets-v1.mjs
```

These require environment variables such as:

- `API_BASE_URL` or `TOKENS_API_BASE_URL`
- `API_KEY` or `TOKENS_API_KEY`

## Current Testing Posture

- Public API route smoke coverage exists, but is intentionally narrow.
- Hosted and data-dependent behavior is still best verified against the deployed Tokens environment.
- Internal and operational apps are build-verified, not comprehensively end-to-end tested in this repository.

If you add new security-sensitive behavior, auth boundaries, or public API routes, add or update an automated check when practical.

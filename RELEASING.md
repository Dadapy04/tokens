# Releasing

Use this checklist before making the repository public or treating a revision as an OSS-ready release.

## Publication Checklist

- Confirm current-tree hygiene passes.

    ```bash
    bun run check:repo-hygiene
    ```

- Confirm automated verification passes.

    ```bash
    bun run verify:api-health-routes
    bun run lint
    bun run build
    bun run audit:deps
    ```

- Run a full git-history secret scan.

    ```bash
    gitleaks git --redact --verbose
    ```

- Review historical tracked paths for sensitive material, including:
    - `.env*` files other than committed examples
    - assistant/tooling artifacts such as `.claude`, `.cursor`, and `.agents`
    - internal notes or operational material that should not be public
    - stray binary junk such as `.DS_Store`

    Example helper command:

    ```bash
    git log --all --name-only --format= | sort -u | rg '(^|/)(\.env($|\.)|\.claude($|/)|\.cursor($|/)|\.agents($|/)|\.DS_Store$)'
    ```

- Review tags and long-lived branches before publication.

    ```bash
    git tag --list
    git branch -a --format='%(refname:short)'
    ```

- If any sensitive credential or private operational material appears in history:
    - rotate the credential first
    - decide whether history rewrite is required before publication
    - document that decision and approval in the release notes or internal change record

- Confirm the legal posture is still accurate:
    - `LICENSE` matches the intended public repository owner
    - `THIRD_PARTY_LICENSES.md` reflects any vendored third-party assets
    - no new bundled assets with unclear redistribution terms were added

- Confirm public docs are still accurate:
    - `README.md` still describes the repo as reference-only
    - `CONTRIBUTING.md` still reflects best-effort review posture
    - `SECURITY.md` still points reporters away from public issues

- Confirm repository visibility change or release publication has explicit owner approval.

## Do Not Publish If

- `gitleaks` reports unresolved secrets
- history review finds material that still needs rotation or rewrite
- proprietary or unclear-license assets remain vendored in-tree
- CI is red or the release checklist has open items

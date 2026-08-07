/** Shared handler error types, mapped to HTTP statuses by the server dispatcher. */

/** Malformed/invalid arguments (or Convex-parity handler errors) → 400 `invalid_args`. */
export class InvalidArgsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidArgsError';
    }
}

/** Handler requires a caller identity (`x-tokens-identity`) and none was sent → 401 `identity_required`. */
export class IdentityRequiredError extends Error {
    constructor(message = 'caller identity required') {
        super(message);
        this.name = 'IdentityRequiredError';
    }
}

/** Caller identity failed an authorization check (admin allowlist) → 403 `unauthorized`. */
export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

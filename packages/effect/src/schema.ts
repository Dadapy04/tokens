import { Effect, Schema } from 'effect';
import { BadRequestError } from './api-errors';

// -----------------------------------------------------------------------------
// Common schemas
// -----------------------------------------------------------------------------

// Base58 (no 0,O,I,l) and common Solana mint length range.
export const SolanaAddress = Schema.String.pipe(Schema.pattern(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/));

export const TimeInterval = Schema.Literal('1m', '5m', '15m', '1H', '4H', '1D', '1W');

export const NonEmptyString = Schema.NonEmptyString;

export const NonNegativeIntFromString = Schema.NumberFromString.pipe(Schema.int(), Schema.nonNegative());

export const PositiveIntFromString = Schema.NumberFromString.pipe(Schema.int(), Schema.positive());

// -----------------------------------------------------------------------------
// Decode helpers (Schema -> BadRequestError)
// -----------------------------------------------------------------------------

function parseErrorToMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string') return message;
    }
    return String(error);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeUnknownOrBadRequest<S extends Schema.Schema<any, any, any>>(
    schema: S,
    input: unknown,
    message: string,
): Effect.Effect<Schema.Schema.Type<S>, BadRequestError, Schema.Schema.Context<S>> {
    return Schema.decodeUnknown(schema)(input).pipe(
        Effect.mapError(parseError => new BadRequestError({ message, details: parseErrorToMessage(parseError) })),
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeRequiredSearchParam<S extends Schema.Schema<any, any, any>>(
    schema: S,
    params: URLSearchParams,
    key: string,
): Effect.Effect<Schema.Schema.Type<S>, BadRequestError, Schema.Schema.Context<S>> {
    const raw = params.get(key);
    if (raw == null) return Effect.fail(new BadRequestError({ message: `${key} is required` }));
    return decodeUnknownOrBadRequest(schema, raw, `Invalid ${key}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeOptionalSearchParam<S extends Schema.Schema<any, any, any>>(
    schema: S,
    params: URLSearchParams,
    key: string,
): Effect.Effect<Schema.Schema.Type<S> | null, BadRequestError, Schema.Schema.Context<S>> {
    const raw = params.get(key);
    if (raw == null) return Effect.succeed(null);
    return decodeUnknownOrBadRequest(schema, raw, `Invalid ${key}`);
}

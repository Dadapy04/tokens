import { Effect } from 'effect';

import { BadRequestError } from './api-errors';
import { decodeUnknownOrBadRequest, NonNegativeIntFromString, PositiveIntFromString } from './schema';

export function clampLimit(value: number, max: number): number {
    return Math.max(1, Math.min(max, value));
}

export function decodeLimit(
    raw: string | null,
    options: { defaultValue: string; max: number; label?: string },
): Effect.Effect<number, BadRequestError> {
    return Effect.gen(function* () {
        const value = yield* decodeUnknownOrBadRequest(
            PositiveIntFromString,
            raw ?? options.defaultValue,
            `Invalid ${options.label ?? 'limit'}`,
        );
        return clampLimit(value, options.max);
    });
}

export function decodeOffset(
    raw: string | null,
    options: { defaultValue?: string; label?: string } = {},
): Effect.Effect<number, BadRequestError> {
    return decodeUnknownOrBadRequest(
        NonNegativeIntFromString,
        raw ?? options.defaultValue ?? '0',
        `Invalid ${options.label ?? 'offset'}`,
    );
}

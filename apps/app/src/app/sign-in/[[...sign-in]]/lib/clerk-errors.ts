function normalizeMessage(message: string): string {
    return message.trim().toLowerCase();
}

export function resolveClerkErrorMessage(caught: unknown): string {
    if (caught instanceof Error && caught.message.trim()) return caught.message;

    if (caught && typeof caught === 'object') {
        const record = caught as Record<string, unknown>;
        const errors = record.errors;
        if (Array.isArray(errors)) {
            const first = errors[0] as Record<string, unknown> | undefined;
            const longMessage = first?.longMessage;
            if (typeof longMessage === 'string' && longMessage.trim()) return longMessage;
            const message = first?.message;
            if (typeof message === 'string' && message.trim()) return message;
        }
    }

    return 'Failed to start sign in. Please try again.';
}

export function isAccountNotFoundMessage(message: string): boolean {
    const normalized = normalizeMessage(message);
    return normalized.includes("couldn't find your account") || normalized.includes('could not find your account');
}

export function isAccountAlreadyExistsMessage(message: string): boolean {
    const normalized = normalizeMessage(message);
    return normalized.includes('already exists') || normalized.includes('account already exists');
}

export function hasUsableClerkPublishableKey(value: string | null | undefined): boolean {
    const key = value?.trim() ?? '';
    if (!key) return false;
    if (key.includes('placeholder')) return false;
    return true;
}

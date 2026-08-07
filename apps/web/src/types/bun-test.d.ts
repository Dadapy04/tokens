declare module 'bun:test' {
    type TestCallback = () => void | Promise<void>;

    export function describe(name: string, fn: TestCallback): void;
    export function it(name: string, fn: TestCallback): void;
    export const test: typeof it;
    export const mock: {
        module(specifier: string, factory: () => unknown): void;
    };
    export function expect<T>(value: T): {
        toBe(expected: unknown): void;
        toContain(expected: string): void;
        toHaveLength(expected: number): void;
    };
}

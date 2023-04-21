export function assertNotNull<T>(obj: T | null | undefined): T {
    expect(obj).toBeDefined();
    expect(obj).not.toBeNull();
    if (obj == null) {
        throw new Error('cannot happen');
    }
    return obj;
}

export function expectNotNullOrUndefined<T>(obj: T | null | undefined): void {
    expect(obj).toBeDefined();
    expect(obj).not.toBeNull();
}

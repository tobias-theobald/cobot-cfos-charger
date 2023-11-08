export abstract class KeyValueStorageBase {
    constructor(protected uri: string) {}

    public abstract get(key: string): Promise<unknown>;
    public abstract set(key: string, value: unknown): Promise<void>;
    public abstract delete(key: string): Promise<void>;
    public abstract list(prefix?: string): Promise<[string, unknown][]>;
}
